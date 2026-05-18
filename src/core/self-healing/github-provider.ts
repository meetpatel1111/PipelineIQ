import type { GitProvider, PRCreationResult, PROptions } from "./types.js";
import type { CodeFix } from "../types/self-healing.js";

/**
 * GitHub implementation of GitProvider.
 *
 * Uses the Octokit REST API to:
 *   1. Create a new branch from the failed commit SHA
 *   2. Commit file changes to the branch (via Git Trees API for atomicity)
 *   3. Open a Pull Request targeting the failed branch
 *   4. Request reviewers and apply labels
 */
export class GitHubProvider implements GitProvider {
  readonly name = "github";
  private token: string;

  constructor(token: string) {
    if (!token) {
      throw new Error("[PipelineIQ] GitHub token is required for self-healing PR creation");
    }
    this.token = token;
  }

  async createFixPR(
    fix: CodeFix,
    repoOwner: string,
    repoName: string,
    baseBranch: string,
    baseSha: string,
    issueKey: string,
    options: PROptions,
  ): Promise<PRCreationResult> {
    // Dynamic import — @octokit/rest is already a dependency via @actions/github
    const { Octokit } = await import("@octokit/rest");
    const octokit = new Octokit({ auth: this.token });

    const branchName = options.branchName;
    const ref = `refs/heads/${branchName}`;

    // 1. Fetch original files and apply patches BEFORE creating the branch/PR
    // This allows us to detect if the changes are completely empty (no actual modifications)
    const treeItems: Array<{
      path: string;
      mode: "100644";
      type: "blob";
      content?: string;
      sha?: string | null;
    }> = [];

    let actualChangeCount = 0;

    for (const change of fix.changes) {
      if (change.action === "delete") {
        actualChangeCount++;
        // To delete a file via the tree API, set sha to null
        treeItems.push({
          path: change.filePath,
          mode: "100644",
          type: "blob",
          sha: null,
        });
      } else if (change.action === "modify" && change.originalContent) {
        // For modify: fetch the original file, apply the AI's patch snippet
        const patchResult = await this.fetchOriginalAndPatch(
          octokit,
          repoOwner,
          repoName,
          baseSha,
          change.filePath,
          change.originalContent,
          change.newContent ?? "",
        );
        if (patchResult.isModified) {
          actualChangeCount++;
        }
        treeItems.push({
          path: change.filePath,
          mode: "100644",
          type: "blob",
          content: patchResult.content,
        });
      } else {
        // create — newContent is the full file.
        // Let's check if the file is identical to an existing one.
        const isIdentical = await this.isFileIdentical(
          octokit,
          repoOwner,
          repoName,
          baseSha,
          change.filePath,
          change.newContent ?? "",
        );
        if (!isIdentical) {
          actualChangeCount++;
        }
        treeItems.push({
          path: change.filePath,
          mode: "100644",
          type: "blob",
          content: change.newContent ?? "",
        });
      }
    }

    if (actualChangeCount === 0) {
      throw new Error("No actual file changes detected after applying the patch. Aborting PR creation to prevent empty commits.");
    }

    // 2. Create branch from the base SHA now that we know we have changes
    await octokit.git.createRef({
      owner: repoOwner,
      repo: repoName,
      ref,
      sha: baseSha,
    });

    const tree = await octokit.git.createTree({
      owner: repoOwner,
      repo: repoName,
      base_tree: baseSha,
      tree: treeItems as any,
    });

    // 3. Create a commit on the new tree
    const commitMessage = this.buildCommitMessage(fix, issueKey);
    const commit = await octokit.git.createCommit({
      owner: repoOwner,
      repo: repoName,
      message: commitMessage,
      tree: tree.data.sha,
      parents: [baseSha],
    });

    // 4. Update the branch ref to point to the new commit
    await octokit.git.updateRef({
      owner: repoOwner,
      repo: repoName,
      ref: `heads/${branchName}`,
      sha: commit.data.sha,
    });

    // 5. Create the Pull Request
    const prBody = this.buildPRBody(fix, issueKey);
    const pr = await octokit.pulls.create({
      owner: repoOwner,
      repo: repoName,
      title: `🤖 [PipelineIQ] ${fix.title}`,
      head: branchName,
      base: baseBranch,
      body: prBody,
      draft: options.draft,
    });

    // 6. Request reviewers (best-effort)
    if (options.reviewers.length > 0) {
      try {
        await octokit.pulls.requestReviewers({
          owner: repoOwner,
          repo: repoName,
          pull_number: pr.data.number,
          reviewers: options.reviewers,
        });
      } catch (e) {
        console.warn(`[PipelineIQ] Failed to request reviewers: ${e}`);
      }
    }

    // 7. Apply labels (best-effort)
    if (options.labels.length > 0) {
      try {
        await octokit.issues.addLabels({
          owner: repoOwner,
          repo: repoName,
          issue_number: pr.data.number,
          labels: options.labels,
        });
      } catch (e) {
        console.warn(`[PipelineIQ] Failed to apply labels: ${e}`);
      }
    }

    return {
      prUrl: pr.data.html_url,
      prNumber: pr.data.number,
      branchName,
    };
  }

  private buildCommitMessage(fix: CodeFix, issueKey: string): string {
    const filesChanged = fix.changes.map((c) => `  - ${c.action}: ${c.filePath}`).join("\n");
    return [
      `fix: ${fix.title}`,
      "",
      fix.description,
      "",
      `Files changed:`,
      filesChanged,
      "",
      `Jira: ${issueKey}`,
      `Confidence: ${Math.round(fix.confidence * 100)}%`,
      `Risk: ${fix.riskLevel}`,
      "",
      `Generated by PipelineIQ Self-Healing Engine`,
    ].join("\n");
  }

  private buildPRBody(fix: CodeFix, issueKey: string): string {
    const changeList = fix.changes
      .map((c) => `| \`${c.filePath}\` | ${c.action} | ${c.changeDescription} |`)
      .join("\n");

    return [
      `## 🤖 PipelineIQ Self-Healing Fix`,
      "",
      `> **This PR was automatically generated by PipelineIQ.** It requires human review and approval before merging.`,
      "",
      `### Summary`,
      fix.description,
      "",
      `### Changes`,
      `| File | Action | Description |`,
      `| --- | --- | --- |`,
      changeList,
      "",
      `### Metadata`,
      `| Field | Value |`,
      `| --- | --- |`,
      `| Jira Issue | ${issueKey} |`,
      `| AI Confidence | ${Math.round(fix.confidence * 100)}% |`,
      `| Risk Level | ${fix.riskLevel} |`,
      `| Category | ${fix.category} |`,
      fix.estimatedTimeSavedMinutes
        ? `| Est. Time Saved | ${fix.estimatedTimeSavedMinutes} min |`
        : "",
      "",
      `### ⚠️ Review Checklist`,
      `- [ ] Fix addresses the root cause correctly`,
      `- [ ] No unintended side effects`,
      `- [ ] Tests pass with this change`,
      `- [ ] Safe to merge to target branch`,
      "",
      `---`,
      `<sub>Generated by PipelineIQ Self-Healing Engine · Fix ID: \`${fix.id}\`</sub>`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  /**
   * Helper to check if a file already exists in the repository with the exact same content.
   */
  private async isFileIdentical(
    octokit: InstanceType<typeof import("@octokit/rest").Octokit>,
    owner: string,
    repo: string,
    baseSha: string,
    filePath: string,
    newContent: string,
  ): Promise<boolean> {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: baseSha,
      });

      if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
        return false;
      }

      const originalFile = Buffer.from(data.content, "base64").toString("utf-8");
      return originalFile === newContent;
    } catch {
      return false;
    }
  }

  /**
   * Fetch the original file content from the repo and apply the AI's
   * snippet-level patch to produce the full modified file, as well as
   * indicating if it was actually modified.
   */
  private async fetchOriginalAndPatch(
    octokit: InstanceType<typeof import("@octokit/rest").Octokit>,
    owner: string,
    repo: string,
    baseSha: string,
    filePath: string,
    originalSnippet: string,
    newSnippet: string,
  ): Promise<{ content: string; isModified: boolean }> {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: baseSha,
      });

      if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
        throw new Error(`Path "${filePath}" is not a file`);
      }

      // GitHub returns base64-encoded content
      const originalFile = Buffer.from(data.content, "base64").toString("utf-8");
      let fullContent = originalFile;

      // Apply the patch: find the original snippet and replace
      if (originalFile.includes(originalSnippet)) {
        fullContent = originalFile.replace(originalSnippet, newSnippet);
      } else {
        // Fallback: try trimmed matching (whitespace normalization)
        const trimmedOriginal = originalSnippet.trim();
        const lines = originalFile.split("\n");
        const matchIdx = lines.findIndex((_, i) => {
          const block = lines.slice(i, i + trimmedOriginal.split("\n").length).join("\n").trim();
          return block === trimmedOriginal;
        });

        if (matchIdx !== -1) {
          const snippetLineCount = trimmedOriginal.split("\n").length;
          const before = lines.slice(0, matchIdx).join("\n");
          const after = lines.slice(matchIdx + snippetLineCount).join("\n");
          fullContent = [before, newSnippet, after].filter(Boolean).join("\n");
        } else {
          // Last resort: append the new content with a comment
          console.warn(`[PipelineIQ] Could not locate patch target in ${filePath} — appending change`);
          fullContent = originalFile + "\n" + newSnippet;
        }
      }

      return {
        content: fullContent,
        isModified: fullContent !== originalFile,
      };
    } catch (error) {
      // If we can't fetch the file, fall back to using newSnippet as full content
      console.warn(`[PipelineIQ] Could not fetch ${filePath} for patching: ${error}`);
      return {
        content: newSnippet,
        isModified: true,
      };
    }
  }
}
