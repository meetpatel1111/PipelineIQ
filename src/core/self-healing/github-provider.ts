import type { GitProvider, PRCreationResult, PROptions } from "./types.js";
import type { CodeFix } from "../types/self-healing.js";
import { applyPatch } from "./patch.js";

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

    // 1. Create branch from the base SHA
    try {
      await octokit.git.createRef({
        owner: repoOwner,
        repo: repoName,
        ref,
        sha: baseSha,
      });
    } catch (e: any) {
      if (e.status === 422 && String(e).includes("Reference already exists")) {
        console.warn(`[PipelineIQ] Branch ${branchName} already exists. Deleting it to recreate cleanly...`);
        try {
          await octokit.git.deleteRef({
            owner: repoOwner,
            repo: repoName,
            ref: `heads/${branchName}`,
          });
          await octokit.git.createRef({
            owner: repoOwner,
            repo: repoName,
            ref,
            sha: baseSha,
          });
        } catch (deleteError: any) {
          console.error(`[PipelineIQ] Failed to recreate branch reference:`, {
            status: deleteError.status,
            message: deleteError.message,
            data: deleteError.response?.data,
          });
          throw deleteError;
        }
      } else {
        console.error(`[PipelineIQ] Failed to create branch reference:`, {
          status: e.status,
          message: e.message,
          data: e.response?.data,
        });
        throw e;
      }
    }

    // 2. Build a Git tree with all file changes
    //    - create: use newContent directly (full file)
    //    - modify: fetch original → apply patch (originalContent → newContent)
    //    - delete: set sha to null
    const treeItems: Array<{
      path: string;
      mode: "100644";
      type: "blob";
      content?: string;
      sha?: string | null;
    }> = [];

    for (const change of fix.changes) {
      if (change.action === "delete") {
        // To delete a file via the tree API, set sha to null
        treeItems.push({
          path: change.filePath,
          mode: "100644",
          type: "blob",
          sha: null,
        });
      } else if (change.action === "modify" && change.originalContent) {
        // For modify: fetch the original file, apply the AI's patch snippet
        const fullContent = await this.fetchAndPatch(
          octokit,
          repoOwner,
          repoName,
          baseSha,
          change.filePath,
          change.originalContent,
          change.newContent ?? "",
        );
        treeItems.push({
          path: change.filePath,
          mode: "100644",
          type: "blob",
          content: fullContent,
        });
      } else {
        // create — newContent is the full file
        treeItems.push({
          path: change.filePath,
          mode: "100644",
          type: "blob",
          content: change.newContent ?? "",
        });
      }
    }

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
    let pr;
    try {
      pr = await octokit.pulls.create({
        owner: repoOwner,
        repo: repoName,
        title: `🤖 [PipelineIQ] ${fix.title}`,
        head: branchName,
        base: baseBranch,
        body: prBody,
        draft: options.draft,
      });
    } catch (error: any) {
      console.error(`[PipelineIQ] GitHub pulls.create API call failed:`, {
        status: error.status,
        message: error.message,
        data: error.response?.data,
      });
      throw error;
    }

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
   * Fetch the original file content from the repo and apply the AI's
   * snippet-level patch to produce the full modified file.
   *
   * The Git Trees API requires full file content for modifications, but
   * the AI only generates the snippet that needs changing. This method
   * bridges that gap by:
   *   1. Fetching the file at the base commit SHA
   *   2. Finding the originalContent snippet in the file
   *   3. Replacing it with the newContent snippet
   */
  private async fetchAndPatch(
    octokit: InstanceType<typeof import("@octokit/rest").Octokit>,
    owner: string,
    repo: string,
    baseSha: string,
    filePath: string,
    originalSnippet: string,
    newSnippet: string,
  ): Promise<string> {
    let originalFile: string;
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
      originalFile = Buffer.from(data.content, "base64").toString("utf-8");
    } catch (error) {
      // If we can't fetch the file, fall back to using newContent as full content
      console.warn(`[PipelineIQ] Could not fetch ${filePath} for patching: ${error}`);
      return newSnippet;
    }

    // Apply the patch, throwing an explicit error if patch target is not found
    return applyPatch(originalFile, originalSnippet, newSnippet, filePath);
  }
}
