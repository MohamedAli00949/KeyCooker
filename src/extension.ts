// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { getLocation as getLocationJSON } from "jsonc-parser";
import { getKeyPathAtJSOrTS } from "./get-js-or-ts-path";
import { getKeyPathAtYAML } from "./get-yaml-path";
import { isInsideFunctionUsingAST } from "./utils";

// Pre-compiled regex patterns
const VALID_BEFORE_REGEX = /^\s*$|{\s*$|['"]$/;
const VALID_AFTER_TS_REGEX = /^\s*['"]?\?:/;
const VALID_AFTER_REGEX = /^\s*['"]?:/;

// Character code constants
const CHAR = {
	SPACE: 32,
	TAB: 9,
	NEWLINE: 10,
	CR: 13,
	OPEN_BRACE: 123,
	COMMA: 44,
	COLON: 58,
	QUOTE_SINGLE: 39,
	QUOTE_DOUBLE: 34,
	QUESTION: 63,
	DIGIT_0: 48,
	DIGIT_9: 57,
};

function isWhitespace(code: number) {
	return (
		code === CHAR.SPACE ||
		code === CHAR.TAB ||
		code === CHAR.NEWLINE ||
		code === CHAR.CR
	);
}

function isDigit(code: number) {
	return code >= CHAR.DIGIT_0 && code <= CHAR.DIGIT_9;
}

function detectPropKeyAtCursor(
	line: string,
	offset: number,
	docLang = "javascript",
) {
	if (offset < 0 || offset > line.length) {
		return null;
	}

	// Find key boundaries
	let start = offset;
	let end = offset;

	// Scan backwards
	while (start > 0) {
		const code = line.charCodeAt(start - 1);
		if (isWhitespace(code) || code === CHAR.OPEN_BRACE || code === CHAR.COMMA) {
			break;
		}
		start--;
	}

	// Scan forwards
	while (end < line.length) {
		const code = line.charCodeAt(end);
		if (isWhitespace(code) || code === CHAR.COLON || code === CHAR.QUESTION) {
			break;
		}
		end++;
	}

	if (start >= end) {
		return null;
	}

	const key = line.substring(start, end);

	// Quick validation
	const firstCode = key.charCodeAt(0);
	if (
		!(firstCode === CHAR.QUOTE_SINGLE || firstCode === CHAR.QUOTE_DOUBLE) &&
		isDigit(firstCode)
	) {
		return null;
	}

	// Context validation
	const prevChars = line.substring(0, start);
	const nextChars = line.substring(end);

	const validBefore = VALID_BEFORE_REGEX.test(prevChars);
	const validAfter =
		(docLang.startsWith("typescript") &&
			VALID_AFTER_TS_REGEX.test(nextChars)) ||
		VALID_AFTER_REGEX.test(nextChars);

	if (!validBefore || !validAfter) {
		return null;
	}

	return {
		key,
		start,
		end,
		startColumn: start + 1,
		endColumn: end + 1,
	};
}

function getSelectedKeyPath(): { path: string; error: string } {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		const selection = editor.selection;
		// const selectedText = editor.document.getText(selection);
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

		const keyProps = isCompletedPropName();

		console.log("getSelectedKeyPath keyProps: ", keyProps);

		if (document.languageId === "json" || document.languageId === "jsonc") {
			const location = getLocationJSON(document.getText(), offset);

			if (location.path.length > 0) {
				return {
					path: location.path
						.map((p, i) =>
							p.toString().includes(".")
								? `["${p}"]`
								: i !== location.path.length - 1
								? `${p}.`
								: `${p}`,
						)
						.join(""),
					error: "",
				};
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
					{
						start: keyProps?.start as { line: number; character: number },
						end: keyProps?.end as { line: number; character: number },
					},
					keyProps?.key as string,
				),
				error: "",
			};
		} else {
			const insideFunction = isInsideFunctionUsingAST(
				document.getText(),
				offset,
			);

			if (insideFunction) {
				return { path: "", error: "Sorry, invalid key at function." };
			} else {
				const result = getKeyPathAtJSOrTS(
					document.getText(),
					keyProps?.key as string,
					{
						start: keyProps?.start as { line: number; character: number },
						end: keyProps?.end as { line: number; character: number },
					},
					selection.start.line,
				);

				return result;
			}
		}
	}

	return { path: "", error: "" };
}

function isCompletedPropName(): {
	key: string;
	isCompleted: boolean;
	start: {
		line: number;
		character: number;
	};
	end: {
		line: number;
		character: number;
	};
} | null {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		const selection = editor.selection;

		// if (!selection) {
		// 	return false;
		// }

		const docLang = editor.document.languageId;
		const selectionText = editor.document.getText(selection);
		const selectionLineText = editor.document.lineAt(selection.active.line);

		if (!selection.isEmpty) {
			// const [prevChars, nextChars] = selectionLineText.text.split(selectionText);
			const [prevChars, nextChars] = [
				selectionLineText.text.slice(0, selection.start.character),
				selectionLineText.text.slice(selection.end.character),
			];

			const validBefore = /\s*$|{\s*$|['"]$/.test(prevChars);

			const validAfter =
				(docLang.startsWith("typescript") && /^\s*['"]?\s*:/.test(nextChars)) ||
				/^\s*['"]?\s*:/.test(nextChars);

			const validName = /^['"]|^(?!\d)/.test(selectionText);

			if (validAfter && validBefore && validName) {
				return {
					key: selectionText,
					isCompleted: true,
					start: {
						line: selection.start.line,
						character: selection.start.character,
					},
					end: {
						line: selection.end.line,
						character: selection.end.character,
					},
				};
			}
		}

		const detectedKeyProps = detectPropKeyAtCursor(
			selectionLineText.text,
			selection.start.character,
			docLang,
		);

		if (detectedKeyProps !== null && detectedKeyProps.key.length > 0) {
			return {
				key: detectedKeyProps.key,
				isCompleted: true,
				start: {
					line: selection.start.line,
					character: detectedKeyProps.start,
				},
				end: {
					line: selection.start.line,
					character: detectedKeyProps.end,
				},
			};
		}

		// console.log("isCompletedPropName keyProps: ", keyProps);
	}

	return null;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	console.log("key-cooker is active");

	const disposable = vscode.commands.registerCommand(
		"key-cooker.copyKeyPath",
		async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}

			const selection = editor.selection;
			// if (!selection) {
			// 	return;
			// }

			const detectedKeyProps = isCompletedPropName();
			console.log("global keyProps: ", detectedKeyProps);

			if (detectedKeyProps === null) {
				vscode.window.showErrorMessage("Sorry, uncompleted selected prop");
				return;
			} else {
				const path = getSelectedKeyPath();
				if (path.path && !path.error) {
					try {
						await vscode.env.clipboard.writeText(path.path);
						vscode.window.showInformationMessage(
							`The final path to '${detectedKeyProps.key}': ` + path.path,
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
