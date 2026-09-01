/**
 * Minimal converter: Markdown → Atlassian Document Format (ADF).
 * Jira Cloud's REST v3 API requires ADF, not plain markdown, for issue descriptions.
 * Supports headings, paragraphs, code blocks, tables, and links — enough for our renderer.
 */

export type AdfNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: AdfNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
};

export type AdfDoc = {
  version: 1;
  type: "doc";
  content: AdfNode[];
};

export function markdownToAdf(md: string): AdfDoc {
  const lines = md.split("\n");
  const blocks: AdfNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        codeLines.push(lines[i] ?? "");
        i++;
      }
      i++;
      blocks.push({
        type: "codeBlock",
        attrs: lang ? { language: lang } : {},
        content: [{ type: "text", text: codeLines.join("\n") }],
      });
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        attrs: { level: headingMatch[1]!.length },
        content: [{ type: "text", text: headingMatch[2]! }],
      });
      i++;
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.startsWith("|") && (lines[i + 1] ?? "").includes("---")) {
      const tableRows: string[][] = [];
      while (i < lines.length && (lines[i] ?? "").startsWith("|")) {
        const cells = (lines[i] ?? "")
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
        if (!cells.every((c) => /^-+$/.test(c))) tableRows.push(cells);
        i++;
      }
      blocks.push(buildAdfTable(tableRows));
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: AdfNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i] ?? "")) {
        const text = (lines[i] ?? "").replace(/^[-*]\s+/, "");
        items.push({
          type: "listItem",
          content: [{ type: "paragraph", content: inlineMd(text) }],
        });
        i++;
      }
      blocks.push({ type: "bulletList", content: items });
      continue;
    }

    blocks.push({ type: "paragraph", content: inlineMd(line) });
    i++;
  }

  return { version: 1, type: "doc", content: blocks };
}

function inlineMd(text: string): AdfNode[] {
  const nodes: AdfNode[] = [];
  // Matches [link](url), **bold**, `code`, or *italic*
  const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // Link [text](href)
      nodes.push({
        type: "text",
        text: match[2]!,
        marks: [{ type: "link", attrs: { href: match[3]! } }],
      });
    } else if (match[4]) {
      // Bold **text**
      nodes.push({
        type: "text",
        text: match[5]!,
        marks: [{ type: "strong" }],
      });
    } else if (match[6]) {
      // Inline Code `text`
      nodes.push({
        type: "text",
        text: match[7]!,
        marks: [{ type: "code" }],
      });
    } else if (match[8]) {
      // Italic *text*
      nodes.push({
        type: "text",
        text: match[9]!,
        marks: [{ type: "em" }],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) });
  }

  return nodes.length > 0 ? nodes : [{ type: "text", text }];
}

function buildAdfTable(rows: string[][]): AdfNode {
  const [header, ...body] = rows;
  const content: AdfNode[] = [];

  if (header) {
    content.push({
      type: "tableRow",
      content: header.map((cell) => ({
        type: "tableHeader",
        content: [{ type: "paragraph", content: inlineMd(cell) }],
      })),
    });
  }

  for (const row of body) {
    content.push({
      type: "tableRow",
      content: row.map((cell) => ({
        type: "tableCell",
        content: [{ type: "paragraph", content: inlineMd(cell) }],
      })),
    });
  }

  return { type: "table", content };
}
