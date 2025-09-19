import { findTupleIndex, getIndentationLevel, isJSComment } from "./utils";
import * as vscode from "vscode";

type BlockType = "object" | "class" | "type" | null;

function getBlockData(
	trimmedLine: string,
	equalSperatorLine: number,
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
		if (/:\s*[{[]/.test(trimmedLine) && equalSperatorLine === -1) {
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

export function getKeyPathAtJSOrTS(
	documentText: string,
	selectedText: string,
	selection: vscode.Selection,
	startLine: number,
): { path: string; error: string } {
	const lines = documentText.split("\n");
	let lastLineLevel = getIndentationLevel(lines[startLine]);
	let equalSperatorLine = -1;

	let blockType: BlockType = null;
	let typeName = "";
	const path: string[] = [selectedText];

	for (let i = startLine; i >= 0; i--) {
		const line = lines[i];
		const trimmedLine = line.trim();

		if (!trimmedLine || isJSComment(line)) {
			continue;
		}

		const targetLineSlice =
			startLine === i
				? line.slice(0, selection.start.character).split(";").at(-1) ?? ""
				: line.split(";").at(-1) ?? "";

		if (targetLineSlice.includes("=") && equalSperatorLine === -1) {
			equalSperatorLine = i;
		}

		const blockData = getBlockData(targetLineSlice.trim(), equalSperatorLine);

		if (blockData) {
			blockType = blockData.blockType;
			typeName = blockData.typeName;
			break;
		}

		if (i === startLine) {
			const cleanLine = trimmedLine.slice(0, selection.start.character);

			const arrayMatches = [...cleanLine.matchAll(/(\w+)\s*:\s*\[/g)];
			arrayMatches.forEach((arrayMatch) => {
				const tupleIndex = findTupleIndex(lines, i, startLine);
				path.unshift(`${arrayMatch[1]}[${tupleIndex}]`);
			});

			const propertyMatches = [...cleanLine.matchAll(/(\w+)\s*:\s*\{/g)];
			propertyMatches.reverse().forEach((propertyMatch) => {
				path.unshift(propertyMatch[1]);
			});
		} else {
			const lineLevel = getIndentationLevel(line);
			if (lineLevel < lastLineLevel) {
				const arrayMatches = [...trimmedLine.matchAll(/(\w+)\s*:\s*\[/g)];
				arrayMatches.forEach((arrayMatch) => {
					const tupleIndex = findTupleIndex(lines, i, startLine);
					path.unshift(`${arrayMatch[1]}[${tupleIndex}]`);
				});

				const propertyMatches = [...trimmedLine.matchAll(/(\w+)\s*:\s*\{/gi)];
				propertyMatches.reverse().forEach((propertyMatch) => {
					path.unshift(propertyMatch[1]);
				});
				lastLineLevel = lineLevel;
			}
		}
	}

	if (blockType === "type" && !typeName) {
		return { path: "", error: "Sorry, invalid key at inline type" };
	}

	const result =
		blockType === "object" || blockType === "class"
			? typeName + "." + path.join(".")
			: typeName +
			  "" +
			  path
					.map((p) =>
						!isNaN(Number(p))
							? `[${p}]`
							: p.endsWith("]")
							? p
									.split("[")
									.map((p2) => (p2.includes("]") ? `[${p2}` : `["${p2}"]`))
									.join("")
							: `["${p}"]`,
					)
					.join("");

	return { path: result ?? "", error: "" };
}
