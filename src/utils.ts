import * as vscode from "vscode";
import * as ts from "typescript";

export function isJSComment(line: string): {
	check: boolean;
	type: "inline" | "block" | "uncomment";
} {
	const trimmedLine = line.trim();

	return {
		type:
			(trimmedLine.startsWith("*") || trimmedLine.startsWith("/*")) &&
			!trimmedLine.includes("*/")
				? "block"
				: trimmedLine.startsWith("//")
				? "inline"
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
		const line = cleanLine(lines[startLineIndex]).slice(
			arrayStart,
			selectionChar,
		);
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

export function isInsideFunctionUsingAST(
	source: string,
	position: number,
): boolean {
	const sourceFile = ts.createSourceFile(
		"temp.ts",
		source,
		ts.ScriptTarget.Latest,
		true,
	);

	function find(node: ts.Node): boolean {
		// Check if position is within this node's range
		if (position < node.getFullStart() || position > node.getEnd()) {
			return false;
		}

		// Check if we're inside a function-like node
		if (ts.isFunctionLike(node)) {
			const func = node as ts.FunctionLikeDeclaration;

			// Check if position is in parameters
			if (func.parameters) {
				for (const param of func.parameters) {
					if (position >= param.getStart() && position <= param.getEnd()) {
						return true;
					}
				}
			}

			// Check if position is in return type annotation
			if (
				func.type &&
				position >= func.type.getStart() &&
				position <= func.type.getEnd()
			) {
				return true;
			}

			// Check if position is in a return statement's object literal
			if (func.body && ts.isBlock(func.body)) {
				for (const statement of func.body.statements) {
					if (ts.isReturnStatement(statement) && statement.expression) {
						if (
							position >= statement.expression.getStart() &&
							position <= statement.expression.getEnd()
						) {
							// Make sure it's an object literal, not a variable reference
							if (ts.isObjectLiteralExpression(statement.expression)) {
								return true;
							}
						}
					}
				}
			}

			// If we're in a function but not in params, return type, or return object,
			// continue searching deeper (for nested functions)
			return ts.forEachChild(node, find) || false;
		}

		// Continue searching in children
		return ts.forEachChild(node, find) || false;
	}

	return find(sourceFile);
}
