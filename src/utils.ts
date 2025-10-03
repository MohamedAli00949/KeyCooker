import * as vscode from "vscode";

export function isJSComment(line: string): {
	check: boolean;
	type: "inline" | "block" | "uncomment";
} {
	const trimmedLine = line.trim();

	return {
		type: trimmedLine.startsWith("//")
			? "inline"
			: trimmedLine.startsWith("*") || trimmedLine.startsWith("/*")
			? "block"
			: "uncomment",
		check:
			trimmedLine.startsWith("//") ||
			trimmedLine.startsWith("*") ||
			trimmedLine.startsWith("/*"),
	};
}

export function getIndentationLevel(line: string): number {
	const match = line.match(/^(\s*)/);

	return match ? match[1].length : 0;
}

export function findTupleIndex(
	lines: string[],
	arrayLineIndex: number,
	startLineIndex: number,
	selectionChar: number,
	arrayStart: number,
): number {
	let tupleIndex = 0;
	let braceCount = 0;

	if (arrayLineIndex === startLineIndex) {
		const line = cleanLine(lines[startLineIndex]).slice(arrayStart, selectionChar);
		braceCount += [...line.matchAll(/\{/g)].length;
		// braceCount -= [...line.matchAll(/\}/g)].length;

		// if (braceCount === 0 && line.includes(",")) {
		// 	tupleIndex += [...line.matchAll(/,/g)].length;
		// } else
		if (line.includes(",")) {
			tupleIndex += [...line.matchAll(/,/g)].length;
		}
	} else {
		for (let i = arrayLineIndex + 1; i <= startLineIndex; i++) {
			const line = cleanLine(lines[i].trim());
			braceCount += [...line.matchAll(/\{/g)].length;
			braceCount -= [...line.matchAll(/\}/g)].length;

			if (braceCount === 0 && line.includes(",")) {
				tupleIndex += [...line.matchAll(/,/g)].length;
			}
		}
	}

	return tupleIndex;
}

export function cleanLine(rawLine: string): string {
	const cleaned = rawLine
		.replace(/\r/g, "")
		.replace(/\/\*.*?\*\//g, "")
		.replace(/\/\/.*$/g, "");

	const segments = cleaned
		.split(";")
		.map((s) => s.trim())
		.filter(Boolean);

	return segments.length > 0 ? segments[segments.length - 1] : cleaned;
}

export async function openDocument(language: string, content: string) {
	const doc = await vscode.workspace.openTextDocument({ language, content });
	const editor = await vscode.window.showTextDocument(doc);

	return editor;
}
