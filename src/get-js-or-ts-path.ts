import {
	cleanLine,
	findTupleIndex,
	getIndentationLevel,
	isJSComment,
} from "./utils";
import * as vscode from "vscode";

type BlockType = "object" | "class" | "type" | null;

function getBlockData(
	trimmedLine: string,
	equalSeparatorLine: number,
): {
	typeName: string;
	blockType: BlockType;
} | null {
	const typeMatch = trimmedLine.match(/(?:export\s+)?type\s+(\w+)\s*=/);

	if (typeMatch) {
		return {
			typeName: typeMatch[1],
			blockType: "type",
		};
	}

	const interfaceMatch = trimmedLine.match(/(?:export\s+)?interface\s+(\w+)/);
	if (interfaceMatch) {
		return { typeName: interfaceMatch[1], blockType: "type" };
	}

	const constMatch = trimmedLine.match(
		/(?:export\s+)?(?:const|let|var)\s+(\w+)(?:\s*:)?/,
	);
	if (constMatch) {
		if (/:\s*[{[]/.test(trimmedLine) && equalSeparatorLine === -1) {
			return { typeName: "", blockType: "type" };
		} else {
			return { typeName: constMatch[1], blockType: "object" };
		}
	}

	const classMatch = trimmedLine.match(/(?:export\s+)?class\s+(\w+)/);
	if (classMatch) {
		return { typeName: classMatch[1], blockType: "class" };
	}

	// return { typeName, blockType };
	return null;
}

function buildFinalPath(
	pathChunks: { content: string; line: number; idx: number }[],
	blockType: BlockType,
	typeName: string,
) {
	if (blockType === "object" || blockType === "class") {
		let result = "";
		pathChunks
			.sort((a, b) => {
				if (a.line > b.line) {
					if (a.idx < b.idx) {
						return -1;
					} else {
						return 1;
					}
				} else {
					if (a.idx < b.idx) {
						return -1;
					} else {
						return 1;
					}
				}
			})
			.forEach((chunk, i) => {
				if (isNaN(Number(chunk.content))) {
					result += `${i !== 0 ? "." : ""}${chunk.content}`;
				} else {
					result += `${result.endsWith("]") ? "" : "."}[${chunk.content}]`;
				}
			});
		return typeName + "." + result;
	} else {
		return (
			typeName +
			"" +
			pathChunks
				.sort((a, b) => {
					if (a.line > b.line) {
						if (a.idx < b.idx) {
							return -1;
						} else {
							return 1;
						}
					} else {
						if (a.idx < b.idx) {
							return -1;
						} else {
							return 1;
						}
					}
				})
				.map((p) =>
					!isNaN(Number(p.content))
						? `[${p.content}]`
						: p.content.endsWith("]")
						? p.content
								.split("[")
								.map((p2) => (p2.includes("]") ? `[${p2}` : `["${p2}"]`))
								.join("")
						: `["${p.content}"]`,
				)
				.join("")
		);
	}
}

interface PathSegment {
	content: string;
	line: number;
	idx: number;
}

export function getKeyPathAtJSOrTS(
	documentText: string,
	selectedText: string,
	selection: vscode.Selection,
	startLine: number,
): { path: string; error: string } {
	const lines = documentText.split("\n");

	let lastLineLevel = getIndentationLevel(lines[startLine]);
	let equalSeparatorLine = -1;

	let blockType: BlockType = null;
	let typeName = "";

	const path: PathSegment[] = [
		{
			content: selectedText,
			line: selection.start.line,
			idx: selection.start.character,
		},
	];

	for (let i = startLine; i >= 0; i--) {
		const line = lines[i];
		const commentLine = isJSComment(line);

		if (!line.trim() || commentLine.check) {
			if (i === startLine || (commentLine.type === "block")) {
				return { path: "", error: "Sorry, this is comment" };
			}

			continue;
		}

		// Determine which part of the line to analyze
		const isCurrentLine = i === startLine;
		const rawLine = isCurrentLine
			? line.slice(0, selection.start.character)
			: line;

		const targetLineSlice = cleanLine(rawLine);

		if (targetLineSlice.includes("=") && equalSeparatorLine === -1) {
			equalSeparatorLine = i;
		}

		if (i === startLine) {
			const cleanLine = targetLineSlice.slice(0, selection.start.character);

			const arrayMatches = [...cleanLine.matchAll(/(\w+)\s*:\s*\[/g)].sort(
				(a, b) => b.index - a.index,
			);
			arrayMatches.forEach((arrayMatch, i) => {
				console.log(`arrayMatch ${i}: `, arrayMatch);
				const tupleIndex = findTupleIndex(
					lines,
					startLine,
					startLine,
					i === 0
						? selection.start.character
						: arrayMatches.slice(0, i).reduce((pV, cV) => pV + cV.index, 0),
					arrayMatch.index,
				);
				path.unshift({
					content: `${arrayMatch[1]}[${tupleIndex}]`,
					line: startLine,
					idx: arrayMatch.index,
				});
			});

			const propertyMatches = [
				// ...cleanLine.matchAll(/(\w+)\s*:\s*\{/gi),
				...cleanLine.matchAll(/['"]?(\w+)['"]?\s*:\s*\{/gi),
			];
			propertyMatches.reverse().forEach((propertyMatch) => {
				path.unshift({
					content: propertyMatch[1],
					line: startLine,
					idx: propertyMatch.index,
				});
			});
		} else {
			const lineLevel = getIndentationLevel(line);
			if (lineLevel < lastLineLevel) {
				const arrayMatches = [
					...targetLineSlice.matchAll(/(\w+)\s*:\s*\[/g),
				].sort((a, b) => b.index - a.index);
				arrayMatches.forEach((arrayMatch) => {
					const tupleIndex = findTupleIndex(
						lines,
						i,
						startLine,
						i === 0
							? selection.start.character
							: arrayMatches.slice(0, i).reduce((pV, cV) => pV + cV.index, 0),
						arrayMatch.index + arrayMatch[0].length,
					);
					path.unshift({
						content: `${arrayMatch[1]}[${tupleIndex}]`,
						line: i,
						idx: arrayMatch.index,
					});
				});

				const propertyMatches = [
					// ...targetLineSlice.matchAll(/(\w+)\s*:\s*\{/gi),
					...targetLineSlice.matchAll(/['"]?(\w+)['"]?\s*:\s*\{/gi),
				];
				propertyMatches.reverse().forEach((propertyMatch) => {
					path.unshift({
						content: propertyMatch[1],
						line: i,
						idx: propertyMatch.index,
					});
				});

				lastLineLevel = lineLevel;
			}
		}

		const blockData = getBlockData(targetLineSlice.trim(), equalSeparatorLine);
		if (blockData) {
			blockType = blockData.blockType;
			typeName = blockData.typeName;
			break;
		}
	}

	if (blockType === "type" && !typeName) {
		return { path: "", error: "Sorry, invalid key at inline type" };
	}

	const result = buildFinalPath(path, blockType, typeName);

	return { path: result ?? "", error: "" };
}
