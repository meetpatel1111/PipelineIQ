import * as fs from "fs";
import * as path from "path";
import { type Enricher, type EnrichmentContext, setField } from "./types.js";

/**
 * Helper to match a CODEOWNERS pattern to a file path.
 * Supports basic *, **, and directory prefix matches.
 */
function isMatch(pattern: string, filePath: string): boolean {
  const normalizedFile = filePath.replace(/\\/g, "/").replace(/^\//, "");
  let p = pattern.replace(/\\/g, "/").replace(/^\//, "");

  // If pattern has no slash (except trailing), it matches anywhere. 
  // In CODEOWNERS: `*.js` matches any .js file. `docs/` matches any docs folder.
  const hasSlash = p.indexOf("/") !== -1 && p.indexOf("/") !== p.length - 1;
  if (!hasSlash && !p.startsWith("**")) {
    p = "**/" + p;
  }

  const regexStr = p
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, ".")
    .replace(/\/?$/, "(?:/.*)?");

  const regex = new RegExp(`^${regexStr}$`);
  return regex.test(normalizedFile);
}

/**
 * codeOwnerEnricher parses the CODEOWNERS file in the repository (if it exists),
 * checks the failingFiles against the rules, and assigns the Jira ticket 
 * or adds reviewers accordingly.
 */
export const codeOwnerEnricher: Enricher = {
  name: "codeowners",
  source: "deterministic",

  async enrich(ctx: EnrichmentContext) {
    const failingFiles = ctx.fields.failingFiles;
    if (!failingFiles || failingFiles.length === 0) {
      return;
    }

    const workspaceRoot = process.env.GITHUB_WORKSPACE || process.cwd();

    const locations = [
      path.join(workspaceRoot, ".github", "CODEOWNERS"),
      path.join(workspaceRoot, ".gitlab", "CODEOWNERS"),
      path.join(workspaceRoot, "docs", "CODEOWNERS"),
      path.join(workspaceRoot, "CODEOWNERS"),
    ];

    let codeownersContent = "";
    for (const loc of locations) {
      if (fs.existsSync(loc)) {
        codeownersContent = fs.readFileSync(loc, "utf-8");
        break;
      }
    }

    if (!codeownersContent) {
      return;
    }

    const lines = codeownersContent.split("\n");
    const rules: { pattern: string; owners: string[] }[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("#")) continue;

      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        rules.push({
          pattern: parts[0] as string,
          owners: parts.slice(1),
        });
      }
    }

    const matchedOwners = new Set<string>();

    for (const file of failingFiles) {
      let fileOwners: string[] = [];
      for (const rule of rules) {
        if (isMatch(rule.pattern, file)) {
          fileOwners = rule.owners;
        }
      }
      for (const owner of fileOwners) {
        matchedOwners.add(owner);
      }
    }

    if (matchedOwners.size > 0) {
      const ownersArray = Array.from(matchedOwners);
      ctx.codeowners = ownersArray;

      const currentLabels = (ctx.fields.labels as string[]) || [];
      const newLabels = ownersArray.map(o => `owner:${o.replace(/^@/, '')}`);
      setField(ctx, "labels", Array.from(new Set([...currentLabels, ...newLabels])), "deterministic", true);

      const emailOwner = ownersArray.find(o => o.includes("@") && !o.startsWith("@"));
      if (emailOwner && !ctx.fields.assignee) {
        setField(ctx, "assignee", emailOwner, "deterministic");
      }
    }
  },
};
