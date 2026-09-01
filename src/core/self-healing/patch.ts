/**
 * Applies a code snippet patch to file content.
 * Handles CRLF/LF line endings and spacing/indentation mismatches.
 *
 * Matching strategies (in order):
 *   1. Exact substring match
 *   2. Line-by-line trimmed match (ignores leading/trailing whitespace per line)
 *   3. Whitespace-collapsed match (normalizes all internal whitespace)
 *   4. Throws if none of the above match (snippet was hallucinated)
 */
export function applyPatch(
  originalContent: string,
  originalSnippet: string,
  newSnippet: string,
  filePath?: string,
  action: "modify" | "create" | "delete" = "modify"
): string {
  const fileDesc = filePath ? ` in ${filePath}` : "";

  // Normalize line endings to LF (\n)
  const normalizeNewlines = (str: string) => str.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const hasCRLF = originalContent.includes("\r\n");

  const content = normalizeNewlines(originalContent);
  const snippet = normalizeNewlines(originalSnippet);
  const replacement = normalizeNewlines(newSnippet);

  const restoreLineEndings = (str: string) => hasCRLF ? str.replace(/\n/g, "\r\n") : str;

  // ── Strategy 1: Exact substring match ─────────────────────────────────────
  if (content.includes(snippet)) {
    const patched = content.replace(snippet, replacement);
    return restoreLineEndings(patched);
  }

  // ── Strategy 2: Line-by-line trimmed match ────────────────────────────────
  const contentLines = content.split("\n");
  const snippetLines = snippet.split("\n");

  // Strip leading/trailing empty lines from the snippet
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
      return restoreLineEndings(patched);
    }
  }

  // ── Strategy 3: Whitespace-collapsed match ────────────────────────────────
  // Collapse all runs of whitespace (spaces, tabs) into a single space for
  // comparison.  This catches cases where the AI quotes slightly different
  // indentation or intra-line spacing than the actual file content.
  const collapseWS = (str: string) => str.replace(/[ \t]+/g, " ");

  const collapsedContent = collapseWS(content);
  const collapsedSnippet = collapseWS(snippet);

  if (collapsedSnippet.length > 0 && collapsedContent.includes(collapsedSnippet)) {
    // Walk the original content to find the byte-range that matches
    const matchStart = collapsedContent.indexOf(collapsedSnippet);

    // Map collapsed index → original index via a parallel scan
    let origIdx = 0;
    let collIdx = 0;
    // Advance to matchStart in collapsed space
    while (collIdx < matchStart && origIdx < content.length) {
      const ch = content[origIdx]!;
      if (/[ \t]/.test(ch)) {
        // In collapsed form, runs of whitespace become a single space
        origIdx++;
        while (origIdx < content.length && /[ \t]/.test(content[origIdx]!)) {
          origIdx++;
        }
        collIdx++; // the single collapsed space
      } else {
        origIdx++;
        collIdx++;
      }
    }
    const realStart = origIdx;

    // Now advance through the collapsed snippet length to find the end
    let snippetCollIdx = 0;
    while (snippetCollIdx < collapsedSnippet.length && origIdx < content.length) {
      const ch = content[origIdx]!;
      if (/[ \t]/.test(ch)) {
        origIdx++;
        while (origIdx < content.length && /[ \t]/.test(content[origIdx]!)) {
          origIdx++;
        }
        snippetCollIdx++;
      } else {
        origIdx++;
        snippetCollIdx++;
      }
    }
    const realEnd = origIdx;

    const patched = content.slice(0, realStart) + replacement + content.slice(realEnd);
    return restoreLineEndings(patched);
  }

  // ── Strategy 4: Aggressive Whitespace-collapsed match ─────────────────────
  // Collapse all whitespace (including newlines) into a single space.
  // This handles when the AI completely hallucinates the indentation or line breaks.
  const collapseAllWS = (str: string) => str.replace(/\s+/g, " ");

  const fullyCollapsedContent = collapseAllWS(content);
  const fullyCollapsedSnippet = collapseAllWS(snippet);

  if (fullyCollapsedSnippet.length > 0 && fullyCollapsedContent.includes(fullyCollapsedSnippet)) {
    const matchStart = fullyCollapsedContent.indexOf(fullyCollapsedSnippet);

    let origIdx = 0;
    let collIdx = 0;
    while (collIdx < matchStart && origIdx < content.length) {
      if (/\s/.test(content[origIdx]!)) {
        origIdx++;
        while (origIdx < content.length && /\s/.test(content[origIdx]!)) {
          origIdx++;
        }
        collIdx++;
      } else {
        origIdx++;
        collIdx++;
      }
    }
    const realStart = origIdx;

    let snippetCollIdx = 0;
    while (snippetCollIdx < fullyCollapsedSnippet.length && origIdx < content.length) {
      if (/\s/.test(content[origIdx]!)) {
        origIdx++;
        while (origIdx < content.length && /\s/.test(content[origIdx]!)) {
          origIdx++;
        }
        snippetCollIdx++;
      } else {
        origIdx++;
        snippetCollIdx++;
      }
    }
    const realEnd = origIdx;

    const patched = content.slice(0, realStart) + replacement + content.slice(realEnd);
    return restoreLineEndings(patched);
  }

  // ── Strategy 5: Append fallback ───────────────────────────────────────────
  console.warn(`[PipelineIQ] Snippet match failed${fileDesc}. Falling back to appending changes.`);
  const patched = content + (content.endsWith("\n") ? "" : "\n") + replacement;
  return restoreLineEndings(patched);
}
