import * as vscode from "vscode";

export function getKeyPathAtYAML(
	document: vscode.TextDocument,
	selection: vscode.Selection,
	selectedText: string,
): string {
	const text = document.getText().replace(/\r\n?/g, "\n");
	const lines = text.split("\n");

	const lineText = document.lineAt(selection.start.line).text;
	const currentIndent = lineText.search(/\S|$/);

	const paths: string[] = [selectedText];
	let indent = currentIndent;

	for (let i = selection.start.line - 1; i >= 0; i--) {
		const line = lines[i];
		const match = line.match(/^(\s*)([^:]+):/);

		if (!match) {
			continue;
		}

		const [, spaces, key] = match;
		const lineIndent = spaces.length;

		if (lineIndent < indent) {
			paths.unshift(key.trim().replace(/['"]/g, ""));
			indent = lineIndent;
		}

		if (lineIndent === 0) {
			break;
		} // reached root
	}

	return paths.join(".");
}
