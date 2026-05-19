/**
 * Applies a code snippet patch to file content.
 * Handles CRLF/LF line endings and spacing/indentation mismatches.
 * Throws an explicit error if the patch target cannot be found.
 */
export function applyPatch(
  originalContent: string,
  originalSnippet: string,
  newSnippet: string,
  filePath?: string,
): string {
  const fileDesc = filePath ? ` in ${filePath}` : "";

  // Normalize line endings to LF (\n)
  const normalizeNewlines = (str: string) => str.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const hasCRLF = originalContent.includes("\r\n");

  const content = normalizeNewlines(originalContent);
  const snippet = normalizeNewlines(originalSnippet);
  const replacement = normalizeNewlines(newSnippet);

  // Try exact match first
  if (content.includes(snippet)) {
    const patched = content.replace(snippet, replacement);
    return hasCRLF ? patched.replace(/\n/g, "\r\n") : patched;
  }

  // Try line-by-line match ignoring leading/trailing whitespaces and empty lines at start/end of snippet
  const contentLines = content.split("\n");
  const snippetLines = snippet.split("\n");

  let startIdx = 0;
  while (startIdx < snippetLines.length && (snippetLines[startIdx] ?? "").trim() === "") {
    startIdx++;
  }
  let endIdx = snippetLines.length - 1;
  while (endIdx >= startIdx && (snippetLines[endIdx] ?? "").trim() === "") {
    endIdx--;
  }

  if (startIdx <= endIdx) {
    const targetLines = snippetLines.slice(startIdx, endIdx + 1);
    const matchIdx = contentLines.findIndex((_, i) => {
      if (i + targetLines.length > contentLines.length) return false;
      for (let j = 0; j < targetLines.length; j++) {
        if ((contentLines[i + j] ?? "").trim() !== (targetLines[j] ?? "").trim()) {
          return false;
        }
      }
      return true;
    });

    if (matchIdx !== -1) {
      const before = contentLines.slice(0, matchIdx).join("\n");
      const after = contentLines.slice(matchIdx + targetLines.length).join("\n");
      const patched = [before, replacement, after].filter((p) => p !== "").join("\n");
      return hasCRLF ? patched.replace(/\n/g, "\r\n") : patched;
    }
  }

  throw new Error(`Could not find the original code snippet to modify${fileDesc}.`);
}
