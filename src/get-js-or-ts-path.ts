import { findTupleIndex, getIndentationLevel, isJSComment } from "./utils";
import * as vscode from "vscode";

export function getKeyPathAtJSOrTS(
	documentText: string,
	selectedText: string,
	selection: vscode.Selection,
	startLine: number,
): string {
	const lines = documentText.split("\n");
	let lastLineLevel = getIndentationLevel(lines[startLine]);

	let blockType: "object" | "class" | "type" | null = null;
	let typeName = "";
	const path: string[] = [selectedText];

	for (let i = startLine; i >= 0; i--) {
		const line = lines[i];
		const trimmedLine = line.trim();

		if (!trimmedLine || isJSComment(line)) {
			continue;
		}

		const typeMatch = trimmedLine.match(/^(?:export\s+)?type\s+(\w+)\s*=/);
		if (typeMatch) {
			typeName = typeMatch[1];
			blockType = "type";
			break;
		}

		const interfaceMatch = trimmedLine.match(
			/^(?:export\s+)?interface\s+(\w+)/,
		);
		if (interfaceMatch) {
			typeName = interfaceMatch[1];
			blockType = "type";
			break;
		}

		// todo: validate the path of the key is not at the inline type
		// ex:
		/**
     * // 9.
        const testVarForType2: {
          profiles: {
            users: {
              names: [
                string,
                {
                  kjkljdfs: "kjdfsfldj";
                },
              ];
            };
          };
        } = {
          profiles: {
            users: {
              names: [
                "string",
                {
                  kjkljdfs: "kjdfsfldj",
                },
              ],
            },
          },
        };
     */
		const constMatch = trimmedLine.match(
			/^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*:/,
		);
		console.log(`const : `, constMatch);
		if (constMatch) {
			if (/:\s*[{[]/.test(trimmedLine)) {
				typeName = "";
				blockType = "type";
			} else {
				typeName = constMatch[1];
				blockType = "object";
			}
			break;
		}

		const classMatch = trimmedLine.match(/^(?:export\s+)?class\s+(\w+)/);
		if (classMatch) {
			typeName = classMatch[1];
			blockType = "class";
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
		vscode.window.showErrorMessage("Sorry, invalid key at inline type");
		return "";
	}

	return blockType === "object" || blockType === "class"
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
}
