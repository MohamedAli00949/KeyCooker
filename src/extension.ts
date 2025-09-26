// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { getLocation as getLocationJSON } from "jsonc-parser";
import { getKeyPathAtJSOrTS } from "./get-js-or-ts-path";
import { getKeyPathAtYAML } from "./get-yaml-path";

function getSelectedKeyPath(): { path: string; error: string } {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		const selection = editor.selection;
		const selectedText = editor.document.getText(selection);
		const document = editor.document;

		const diagnostics = vscode.languages.getDiagnostics(document.uri);

		const errors = diagnostics.filter(
			(diagnostic) => diagnostic.severity === vscode.DiagnosticSeverity.Error,
		);

		if (errors.length > 0) {
			return {
				path: "",
				error:
					"Sorry, this file has errors that will affect the final result. Please fix them first.",
			};
		}

		const offset = document.offsetAt(selection.active);

		if (document.languageId === "json") {
			const location = getLocationJSON(document.getText(), offset);

			if (location.path.length > 0) {
				return { path: location.path.join("."), error: "" };
			} else {
				return { path: "", error: "" };
			}
		} else if (
			document.languageId === "yaml" ||
			document.languageId === "yml"
		) {
			return {
				path: getKeyPathAtYAML(
					document,
					selection,
					selectedText.trim().replace(/['"]/g, ""),
				),
				error: "",
			};
		} else {
			const result = getKeyPathAtJSOrTS(
				document.getText(),
				selectedText.trim().replace(/['"]/g, ""),
				selection,
				selection.start.line,
			);

			return result;
		}
	}

	return { path: "", error: "" };
}

function isCompletedPropName(): boolean {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		const selection = editor.selection;

		if (!selection) {
			return false;
		}

		const docLang = editor.document.languageId;
		const selectionText = editor.document.getText(selection);
		const selectionLineText = editor.document.lineAt(selection.active.line);
		const [prevChars, nextChars] = selectionLineText.text.split(selectionText);

		// const validBefore =
		// 	!prevChars.slice(-1).trim() ||
		// 	prevChars.slice(-1).trim() === "{" ||
		// 	prevChars.trim().endsWith(`'`) ||
		// 	prevChars.trim().endsWith(`"`);

		// const validAfter =
		// 	(docLang.startsWith("typescript") &&
		// 		(nextChars.trim().startsWith("?:") ||
		// 			nextChars.trim().startsWith(`"?:`) ||
		// 			nextChars.trim().startsWith(`'?:`))) ||
		// 	nextChars.trim().startsWith(":") ||
		// 	nextChars.trim().startsWith(`":`) ||
		// 	nextChars.trim().startsWith(`':`);

		// const validName =
		// 	selectionText.startsWith("'") ||
		// 	selectionText.startsWith('"') ||
		// 	!/^\d/.test(selectionText);

		// const validBefore = /(?:(?<=\s)|(?<={)|(?<=')|(?<="))/.test(prevChars);
		// const validName = /^(?:['"].*|[^\d]\w*)/.test(selectionText);
		// const validAfter = docLang.startsWith("typescript")
		// 	? /(?=\s*(?:\?|['"]\??)\s*:)/.test(nextChars)
		// 	: /(?=\\s*['"]?:)/.test(nextChars);

		const validBefore = /^\s*$|{\s*$|['"]$/.test(prevChars);

		const validAfter =
			(docLang.startsWith("typescript") && /^\s*['"]?\?:/.test(nextChars)) ||
			/^\s*['"]?:/.test(nextChars);

		const validName = /^['"]|^(?!\d)/.test(selectionText);

		return validBefore && validAfter && validName;
	}

	return false;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	const disposable = vscode.commands.registerCommand(
		"key-cooker.copyKeyPath",
		async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}
			const selection = editor.selection;
			if (!selection) {
				return;
			}

			if (isCompletedPropName()) {
				const path = getSelectedKeyPath();
				if (path.path && !path.error) {
					try {
						await vscode.env.clipboard.writeText(path.path);
						vscode.window.showInformationMessage(
							`The final path to '${editor.document.getText(selection)}': ` +
								path.path,
						);
					} catch (error) {
						vscode.window.showErrorMessage(
							"Failed to copy content: " + (error as Error).message,
						);
					}
				}

				if (path.error) {
					vscode.window.showErrorMessage(path.error);
				}
			} else {
				vscode.window.showErrorMessage("Sorry, uncompleted selected prop");
				return;
			}
		},
	);
	context.subscriptions.push(disposable);

	vscode.window.onDidChangeTextEditorSelection(() => updateContext());
	vscode.workspace.onDidChangeTextDocument(() => updateContext());

	function updateContext() {
		vscode.commands.executeCommand(
			"setContext",
			"completedKey",
			isCompletedPropName(),
		);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
