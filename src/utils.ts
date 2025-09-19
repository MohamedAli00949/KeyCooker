export function isJSComment(line: string): boolean {
	const trimmedLine = line.trim();

	return (
		trimmedLine.startsWith("//") ||
		trimmedLine.startsWith("*") ||
		trimmedLine.startsWith("/*")
	);
}

export function getIndentationLevel(line: string): number {
	const match = line.match(/^(\s*)/);

	return match ? match[1].length : 0;
}

export function findTupleIndex(
	lines: string[],
	arrayLineIndex: number,
	startLineIndex: number,
): number {
	let tupleIndex = 0;
	let braceCount = 0;

	for (let i = arrayLineIndex + 1; i <= startLineIndex; i++) {
		const line = lines[i].trim();
		braceCount += (line.match(/\{/g) || []).length;
		braceCount -= (line.match(/\}/g) || []).length;

		if (braceCount === 0 && line.includes(",")) {
			tupleIndex++;
		}
	}

	return tupleIndex;
}
