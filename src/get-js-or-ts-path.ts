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

// todo: fix if any prop key at the path start with number to add it at ["{key-name}"]
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

		if (!line.trim() || isJSComment(line)) {
			continue;
		}

		const rawLine =
			startLine === i ? line.slice(0, selection.start.character) : line;

		const targetLineSlice = (() => {
			const cleaned = rawLine
				.replace(/\r/g, "")
				.replace(/\/\*.*?\*\//g, "")
				.replace(/\/\/.*$/g, "");

			const segments = cleaned
				.split(";")
				.map((s) => s.trim())
				.filter(Boolean);

			return segments.length > 0 ? segments[segments.length - 1] : cleaned;
		})();

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
			const cleanLine = targetLineSlice.slice(0, selection.start.character);

			const arrayMatches = [...cleanLine.matchAll(/(\w+)\s*:\s*\[/g)];
			arrayMatches.reverse().forEach((arrayMatch) => {
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
				const arrayMatches = [...targetLineSlice.matchAll(/(\w+)\s*:\s*\[/g)];
				arrayMatches.reverse().forEach((arrayMatch) => {
					const tupleIndex = findTupleIndex(lines, i, startLine);
					path.unshift(`${arrayMatch[1]}[${tupleIndex}]`);
				});

				const propertyMatches = [
					...targetLineSlice.matchAll(/(\w+)\s*:\s*\{/gi),
				];
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
