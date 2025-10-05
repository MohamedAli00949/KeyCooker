import * as assert from "assert";
import * as vscode from "vscode";
import sinon from "sinon";
import { openDocument } from "../../utils";

suite("key-cooker.copyKeyPath Command Tests", () => {
	const commandId = "key-cooker.copyKeyPath";

	async function selectToken(
		editor: vscode.TextEditor,
		token: string,
		options?: { fromIndex?: number; linePredicate?: (line: string) => boolean },
	) {
		const docText = editor.document.getText();
		if (options?.linePredicate) {
			const lines = docText.split("\n");
			const lineIdx = lines.findIndex(options.linePredicate);
			assert.ok(lineIdx >= 0, "Target line not found for selection");
			const col = lines[lineIdx].indexOf(token);
			assert.ok(col >= 0, `Token '${token}' not found on target line`);
			const absStart =
				lines.slice(0, lineIdx).reduce((sum, l) => sum + l.length + 1, 0) + col;
			const start = editor.document.positionAt(absStart);
			const end = editor.document.positionAt(absStart + token.length);
			editor.selection = new vscode.Selection(start, end);
			return;
		}

		const from = options?.fromIndex ?? 0;
		const idx = docText.indexOf(token, from);
		assert.ok(idx >= 0, `Token '${token}' not found`);
		const start = editor.document.positionAt(idx);
		const end = editor.document.positionAt(idx + token.length);
		editor.selection = new vscode.Selection(start, end);
	}

	async function getClipboardAfterRun() {
		await vscode.commands.executeCommand(commandId);
		return vscode.env.clipboard.readText();
	}

	async function withDiagnostics(
		editor: vscode.TextEditor,
		diagnostics: vscode.Diagnostic[],
		exec: () => Promise<void>,
	) {
		const collection =
			vscode.languages.createDiagnosticCollection("key-cooker-tests");
		try {
			collection.set(editor.document.uri, diagnostics);
			await exec();
		} finally {
			collection.clear();
			collection.dispose();
		}
	}

	test("should show error for uncompleted property", async () => {
		const editor = await openDocument("typescript", "{ foo: 123 }");

		// Select outside any key
		editor.selection = new vscode.Selection(0, 0, 0, 1);

		const showErrorStub = sinon.stub(vscode.window, "showErrorMessage");

		try {
			await vscode.commands.executeCommand(commandId);

			assert.ok(
				showErrorStub.calledWith("Sorry, uncompleted selected prop"),
				"Should show error for invalid selection",
			);
		} finally {
			showErrorStub.restore();
		}
	});

	test("should show file error when diagnostics contain an error", async () => {
		const editor = await openDocument(
			"typescript",
			"const obj = { foo: { bar: 1 } };",
		);

		await selectToken(editor, "bar");

		const showErrorStub = sinon.stub(vscode.window, "showErrorMessage");
		try {
			const diag = new vscode.Diagnostic(
				new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 10)),
				"Simulated error",
				vscode.DiagnosticSeverity.Error,
			);

			await withDiagnostics(editor, [diag], async () => {
				await vscode.commands.executeCommand(commandId);
			});

			assert.ok(
				showErrorStub.calledWith(
					"Sorry, this file has errors that will affect the final result. Please fix them first.",
				),
				"Should show file error when diagnostics contain an error",
			);
		} finally {
			showErrorStub.restore();
		}
	});

	// Invalid content tests across languages: JSON, YAML, JS, TS, TSX, JSX
	test("should show error for invalid JSON content", async () => {
		const editor = await openDocument("json", '{ "foo": { "bar": 42 ');
		await selectToken(editor, "foo");
		const diag = new vscode.Diagnostic(
			new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 10)),
			"Invalid JSON",
			vscode.DiagnosticSeverity.Error,
		);
		const showErrorStub = sinon.stub(vscode.window, "showErrorMessage");
		try {
			await withDiagnostics(editor, [diag], async () => {
				await vscode.commands.executeCommand(commandId);
			});
			assert.ok(
				showErrorStub.calledWith(
					"Sorry, this file has errors that will affect the final result. Please fix them first.",
				),
			);
		} finally {
			showErrorStub.restore();
		}
	});

	test("should show error for invalid YAML content", async () => {
		const editor = await openDocument("yaml", "foo:\n  bar: : 42");
		await selectToken(editor, "foo");
		const diag = new vscode.Diagnostic(
			new vscode.Range(new vscode.Position(0, 0), new vscode.Position(1, 5)),
			"Invalid YAML",
			vscode.DiagnosticSeverity.Error,
		);
		const showErrorStub = sinon.stub(vscode.window, "showErrorMessage");
		try {
			await withDiagnostics(editor, [diag], async () => {
				await vscode.commands.executeCommand(commandId);
			});
			assert.ok(
				showErrorStub.calledWith(
					"Sorry, this file has errors that will affect the final result. Please fix them first.",
				),
			);
		} finally {
			showErrorStub.restore();
		}
	});

	test("should show error for invalid JavaScript content", async () => {
		const editor = await openDocument(
			"javascript",
			"const obj = { foo: { bar: 123  // missing closing braces",
		);
		await selectToken(editor, "foo");
		const diag = new vscode.Diagnostic(
			new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 20)),
			"Invalid JS",
			vscode.DiagnosticSeverity.Error,
		);
		const showErrorStub = sinon.stub(vscode.window, "showErrorMessage");
		try {
			await withDiagnostics(editor, [diag], async () => {
				await vscode.commands.executeCommand(commandId);
			});
			assert.ok(
				showErrorStub.calledWith(
					"Sorry, this file has errors that will affect the final result. Please fix them first.",
				),
			);
		} finally {
			showErrorStub.restore();
		}
	});

	test("should show error for invalid TypeScript content", async () => {
		const editor = await openDocument(
			"typescript",
			"type X = { foo: { bar: string;  // missing braces",
		);
		await selectToken(editor, "foo");
		const diag = new vscode.Diagnostic(
			new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 15)),
			"Invalid TS",
			vscode.DiagnosticSeverity.Error,
		);
		const showErrorStub = sinon.stub(vscode.window, "showErrorMessage");
		try {
			await withDiagnostics(editor, [diag], async () => {
				await vscode.commands.executeCommand(commandId);
			});
			assert.ok(
				showErrorStub.calledWith(
					"Sorry, this file has errors that will affect the final result. Please fix them first.",
				),
			);
		} finally {
			showErrorStub.restore();
		}
	});

	test("should show error for invalid TS React content", async () => {
		const tsxContent = [
			"type Props = { label: string; data: { key: string } };",
			"export function C(props: Props){",
			"  const obj: { inner: { value: number } } = { inner: { value: 1 } };",
			"  return (<div><span>{props.label}</span></div  );",
			"}",
		].join("\n");
		const editor = await openDocument("typescriptreact", tsxContent);
		await selectToken(editor, "label");
		const diag = new vscode.Diagnostic(
			new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 40)),
			"Invalid TSX",
			vscode.DiagnosticSeverity.Error,
		);
		const showErrorStub = sinon.stub(vscode.window, "showErrorMessage");
		try {
			await withDiagnostics(editor, [diag], async () => {
				await vscode.commands.executeCommand(commandId);
			});
			assert.ok(
				showErrorStub.calledWith(
					"Sorry, this file has errors that will affect the final result. Please fix them first.",
				),
			);
		} finally {
			showErrorStub.restore();
		}
	});

	test("should show error for invalid JS React content", async () => {
		const jsxContent = [
			"export function C(){",
			"  const obj = { inner: { value: 1 } };",
			"  return (<div><span>ok</span></div  );",
			"}",
		].join("\n");
		const editor = await openDocument("javascriptreact", jsxContent);
		await selectToken(editor, "inner");
		const diag = new vscode.Diagnostic(
			new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 40)),
			"Invalid JSX",
			vscode.DiagnosticSeverity.Error,
		);
		const showErrorStub = sinon.stub(vscode.window, "showErrorMessage");
		try {
			await withDiagnostics(editor, [diag], async () => {
				await vscode.commands.executeCommand(commandId);
			});
			assert.ok(
				showErrorStub.calledWith(
					"Sorry, this file has errors that will affect the final result. Please fix them first.",
				),
			);
		} finally {
			showErrorStub.restore();
		}
	});

	// * 8 block comment selection on "target" should error
	test("should show comment error when selecting 'target' in block comment", async () => {
		const content = [
			"/**",
			" * type TestTypes8 = {",
			" *\tprofiles: {",
			" *\t\tusers: {",
			" *\t\t\tnames: [",
			" *\t\t\t\tstring,",
			' *\t\t\t\t{ target: "target value";',
			" *\t\t\t\t},",
			" *\t\t\t];",
			" *\t\t};",
			" * \t};",
			" * };",
			" */",
		].join("\n");

		const editor = await openDocument("typescript", content);
		await selectToken(editor, "target");

		const showErrorStub = sinon.stub(vscode.window, "showErrorMessage");
		try {
			await vscode.commands.executeCommand(commandId);
			assert.ok(
				showErrorStub.calledWith("Sorry, this is comment"),
				"Should show comment error for target inside block comment",
			);
		} finally {
			showErrorStub.restore();
		}
	});

	// * 8.3 select child from inline object with quotes adjacent to block comment
	test("should copy path for child in inline object with quoted keys", async () => {
		const content = [
			'const typessssTest = { "parent": { "child": true } };/**',
			" * type TestTypes8 = {",
			" *\tprofiles: {",
			"\t\tusers: {",
			" *\t\t\tnames: [",
			" *\t\t\t\tstring,",
			' *\t\t\t\t{ target: "target value";',
			" *\t\t\t\t},",
			" *\t\t\t];",
			" *\t\t};",
			" * \t};",
			" * };",
			" */",
		].join("\n");

		const editor = await openDocument("typescript", content);
		await selectToken(editor, "child");

		const clipboardText = await getClipboardAfterRun();
		assert.strictEqual(clipboardText, "typessssTest.parent.child");
	});

	// * 8.4 select child from inline object without quotes adjacent to block comment
	test("should copy path for child in inline object without quoted child", async () => {
		const content = [
			'const typesssTest = { "parent": { child : true } };/**',
			" * type TestTypes8 = {",
			" *\tprofiles: {",
			"\t\tusers: {",
			" *\t\t\tnames: [",
			" *\t\t\t\tstring,",
			' *\t\t\t\t{ target: "target value";',
			" *\t\t\t\t},",
			" *\t\t\t];",
			" *\t\t};",
			" * \t};",
			" * };",
			" */",
		].join("\n");

		const editor = await openDocument("typescript", content);
		await selectToken(editor, "child");

		const clipboardText = await getClipboardAfterRun();
		assert.strictEqual(clipboardText, "typesssTest.parent.child");
	});

	// * 8.4 combined: child from const and target from actual type
	test("should copy child from const and target from type in same doc", async () => {
		const content = [
			'const typessTest = { "parent": { child : true } };',
			"type TestTypes8 = {",
			"\tprofiles: {",
			"    /** sdad aDFS */",
			"\t\tusers: {",
			"\t\t\tnames: [",
			"\t\t\t\tstring,",
			'\t\t\t\t{ target: "target value";',
			"\t\t\t\t},",
			"\t\t\t];",
			"\t\t};",
			"\t};",
			"};",
		].join("\n");

		const editor = await openDocument("typescript", content);

		// Select child in const and assert
		await selectToken(editor, "child", { fromIndex: 0 });
		let clipboardText = await getClipboardAfterRun();
		assert.strictEqual(clipboardText, "typessTest.parent.child");

		// Select target in type and assert
		const typeStart = editor.document.getText().indexOf("type TestTypes8 = {");
		await selectToken(editor, "target", { fromIndex: typeStart });
		clipboardText = await getClipboardAfterRun();
		assert.strictEqual(
			clipboardText,
			'TestTypes8["profiles"]["users"]["names"][1]["target"]',
		);
	});

	// * 9 inline typed const object with preceding vars
	test("should copy path for inline typed const object assignment", async () => {
		const content = [
			'let var2 = ""; let obj2 = { key: "jkfsj" }; const testVarForType2: {',
			"  profiles: {",
			"    users: {",
			"      names: [",
			"        string,",
			"        {",
			'          target: "target value";',
			"        },",
			"      ];",
			"    };",
			"  };",
			"} = {",
			"  profiles: {",
			"    users: {",
			"      names: [",
			'        "string",',
			"        {",
			'          target: "target value",',
			"        },",
			"      ],",
			"    },",
			"  },",
			"};",
		].join("\n");

		const editor = await openDocument("typescript", content);
		const idx = editor.document.getText().lastIndexOf("target:");
		await selectToken(editor, "target", { fromIndex: idx });

		const clipboardText = await getClipboardAfterRun();
		assert.strictEqual(
			clipboardText,
			"testVarForType2.profiles.users.names[1].target",
		);
	});

	// * 1
	test("should copy TS type path with tuple index", async () => {
		const content = [
			"type TestTypes = {",
			"  profiles: {",
			'    users: { names: [string, { target: "target value" }] };',
			"  };",
			"};",
		].join("\n");

		const editor = await openDocument("typescript", content);
		await selectToken(editor, "target");

		const clipboardText = await getClipboardAfterRun();
		assert.strictEqual(
			clipboardText,
			'TestTypes["profiles"]["users"]["names"][1]["target"]',
		);
	});

	// * 1.1 multiple type/interface declarations in one block
	test("should copy TS paths for inline type and interface keys", async () => {
		const content = [
			"type obj = { foo2: string };type obj2 = { foo2: string };",
			"interface objI2 { foo: string; }; interface objI22 {",
			"  foo?: string;",
			"}",
		].join("\n");

		const editor = await openDocument("typescript", content);
		const text = editor.document.getText();

		async function assertKeyPath(
			blockHeader: string,
			key: string,
			expectedPath: string,
		) {
			const headerIdx = text.indexOf(blockHeader);
			assert.ok(headerIdx >= 0, `Header not found: ${blockHeader}`);
			const closeIdx = text.indexOf("}", headerIdx);
			const keyIdx = text.indexOf(key, headerIdx);
			assert.ok(
				keyIdx >= 0 && keyIdx < closeIdx + 1,
				`Key not found in block: ${key}`,
			);
			const startPos = editor.document.positionAt(keyIdx);
			const endPos = editor.document.positionAt(keyIdx + key.length);
			editor.selection = new vscode.Selection(startPos, endPos);

			await vscode.commands.executeCommand(commandId);
			const clipboardText = await vscode.env.clipboard.readText();
			assert.strictEqual(clipboardText, expectedPath);
		}

		(async () => {
			await assertKeyPath("type obj = {", "foo2", 'obj["foo2"]');
		})();
		(async () => {
			await assertKeyPath("type obj2 = {", "foo2", 'obj2["foo2"]');
		})();
		(async () => {
			await assertKeyPath("interface objI2", "foo", 'objI2["foo"]');
		})();
		(async () => {
			await assertKeyPath("interface objI22", "foo", 'objI22["foo"]');
		})();
	});

	// * 1.2 testing multiple arrays innline.
	test("should copy TS type path with nested container and tuple index", async () => {
		const content = [
			"type TestTypes1 = {",
			"  profiles: {",
			'    usersContainer: [{ users: { names: [string, { target: "target value" }] } }];',
			"  };",
			"};",
		].join("\n");

		const editor = await openDocument("typescript", content);
		await selectToken(editor, "target");

		const clipboardText = await getClipboardAfterRun();
		assert.strictEqual(
			clipboardText,
			'TestTypes1["profiles"]["usersContainer"][0]["users"]["names"][1]["target"]',
		);
	});

	// * 3.3 select second tuple element in unioned tuple
	test("should copy TS type path with second tuple element target", async () => {
		const content = [
			"type TestTypes33 = {",
			"  profiles: {",
			"    users: {",
			'      names: [string, { target: "target value" }, { target: "target value 2" }];',
			"    };",
			"  };",
			"};",
		].join("\n");

		const editor = await openDocument("typescript", content);
		const idx2 = editor.document.getText().lastIndexOf("target:");
		await selectToken(editor, "target", { fromIndex: idx2 });

		const clipboardText = await getClipboardAfterRun();
		assert.strictEqual(
			clipboardText,
			'TestTypes33["profiles"]["users"]["names"][2]["target"]',
		);
	});

	// * 5 select property name in a type where inner object is commented
	test("should copy TS type path for names when inner element commented", async () => {
		const content = [
			"type TestTypes5 = {",
			"  profiles: {",
			"    users: {",
			"      names: [",
			"        string,",
			"        // {",
			'        // \ttarget: "target value";',
			"        // },",
			"      ];",
			"    };",
			"  };",
			"};",
		].join("\n");

		const editor = await openDocument("typescript", content);
		await selectToken(editor, "names");

		const clipboardText = await getClipboardAfterRun();
		assert.strictEqual(
			clipboardText,
			'TestTypes5["profiles"]["users"]["names"]',
		);
	});

	// * 6 property path where array is commented out and target is direct property
	test("should copy TS type path when array commented and target is direct", async () => {
		const content = [
			"type TestTypes6 = {",
			"  profiles: {",
			"    users: {",
			"      // names: [",
			"      // string,",
			"      // {",
			'      target: "target value";',
			"      // },",
			"      // ];",
			"    };",
			"  };",
			"};",
		].join("\n");

		const editor = await openDocument("typescript", content);
		await selectToken(editor, "target");

		const clipboardText = await getClipboardAfterRun();
		assert.strictEqual(
			clipboardText,
			'TestTypes6["profiles"]["users"]["target"]',
		);
	});

	// * 7 similar to 6 with unrelated inline comment
	test("should copy TS type path with unrelated inline comment present", async () => {
		const content = [
			"type TestTypes7 = {",
			"  profiles: {",
			"    // type",
			"    users: {",
			"      // names: [",
			"      // string,",
			"      // {",
			'      target: "target value";',
			"      // },",
			"      // ];",
			"    };",
			"  };",
			"};",
		].join("\n");

		const editor = await openDocument("typescript", content);
		await selectToken(editor, "target");

		const clipboardText = await getClipboardAfterRun();
		assert.strictEqual(
			clipboardText,
			'TestTypes7["profiles"]["users"]["target"]',
		);
	});

	test("should copy key path for typed const object", async () => {
		const content = [
			"type TestTypes = {",
			"  profiles: {",
			"    users: {",
			"      names: [",
			"        string,",
			"        {",
			'          target: "target value",',
			"        },",
			"      ];",
			"    },",
			"  },",
			"};",
			"const testVarForType: TestTypes = {",
			"  profiles: {",
			"    users: {",
			"      names: [",
			'        "string",',
			"        {",
			'          target: "target value",',
			"        },",
			"      ],",
			"    },",
			"  },",
			"};",
		].join("\n");

		const editor = await openDocument("typescript", content);

		const fullText = editor.document.getText();
		const startIdx = fullText.lastIndexOf("target:");
		const startPos = editor.document.positionAt(startIdx);
		const endPos = editor.document.positionAt(startIdx + "target".length);
		editor.selection = new vscode.Selection(startPos, endPos);

		await vscode.commands.executeCommand(commandId);

		const clipboardText = await vscode.env.clipboard.readText();
		assert.strictEqual(
			clipboardText,
			"testVarForType.profiles.users.names[1].target",
		);
	});

	test("should show comment error when selecting inside block comment", async () => {
		const content = [
			"/**",
			" * type TestTypes8 = {",
			" *\tprofiles: {",
			"\t\tusers: {",
			" *\t\t\tnames: [",
			" *\t\t\t\tstring,",
			' *\t\t\t\t{ target: "target value";',
			" *\t\t\t\t},",
			" *\t\t\t];",
			" *\t\t};",
			" * \t};",
			" * };",
			" */",
		].join("\n");

		const editor = await openDocument("typescript", content);
		await selectToken(editor, "users");

		const showErrorStub = sinon.stub(vscode.window, "showErrorMessage");
		try {
			await vscode.commands.executeCommand(commandId);
			await assert.ok(
				showErrorStub.calledWith("Sorry, this is comment"),
				"Should show comment error for selection inside block comment",
			);
		} finally {
			showErrorStub.restore();
		}
	});

	test("should copy JSON key path", async () => {
		const editor = await openDocument("json", '{ "foo": { "bar": 42 } }');

		// Select "bar"
		await selectToken(editor, "bar");
		// console.log(editor.document.getText(editor.selection));

		const clipboardText = await getClipboardAfterRun();
		assert.strictEqual(clipboardText, "foo.bar");
	});

	test("should copy YAML key path", async () => {
		const editor = await openDocument("yaml", "foo:\n  bar: 42");

		// Select "bar"
		await selectToken(editor, "bar");

		const clipboardText = await getClipboardAfterRun();
		assert.strictEqual(clipboardText, "foo.bar");
	});

	test("should copy nested key path in TypeScript", async () => {
		const editor = await openDocument(
			"typescript",
			"const obj = { foo: { bar: { baz: 1 } } };",
		);

		await selectToken(editor, "baz");
		// console.log(editor.document.getText(editor.selection));

		const clipboardText = await getClipboardAfterRun();
		assert.strictEqual(clipboardText, "obj.foo.bar.baz");
	});

	test("should show error for invalid selection", async () => {
		const editor = await openDocument("json", '{ "foo": 42 }');

		// Select outside any key
		editor.selection = new vscode.Selection(0, 0, 0, 1);

		const showErrorStub = sinon.stub(vscode.window, "showErrorMessage");

		try {
			await vscode.commands.executeCommand(commandId);

			assert.ok(
				showErrorStub.calledWith("Sorry, uncompleted selected prop"),
				"Should show error for invalid selection",
			);
		} finally {
			showErrorStub.restore();
		}
	});

	test("should copy key path in JavaScript", async () => {
		const editor = await openDocument(
			"javascript",
			"const obj = { foo: { bar: 123 } };",
		);

		await selectToken(editor, "bar");

		const clipboardText = await getClipboardAfterRun();
		assert.strictEqual(clipboardText, "obj.foo.bar");
	});
});
