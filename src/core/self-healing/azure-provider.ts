import type { GitProvider, PRCreationResult, PROptions } from "./types.js";
import type { CodeFix } from "../types/self-healing.js";

/**
 * Azure DevOps implementation of GitProvider.
 *
 * Uses the Azure DevOps REST API to:
 *   1. Create a new branch via a push with refUpdate
 *   2. Push file changes in a single atomic commit
 *   3. Create a Pull Request targeting the failed branch
 *   4. Add reviewers and labels
 */
export class AzureDevOpsProvider implements GitProvider {
  readonly name = "azure-devops";
  private token: string;
  private orgUrl: string;

  constructor(token: string, orgUrl: string) {
    if (!token) {
      throw new Error("[PipelineIQ] Azure DevOps token is required for self-healing PR creation");
    }
    if (!orgUrl) {
      throw new Error("[PipelineIQ] Azure DevOps organization URL is required");
    }
    this.token = token;
    this.orgUrl = orgUrl.replace(/\/+$/, "");
  }

  async createFixPR(
    fix: CodeFix,
    repoOwner: string, // Used as project name in ADO context
    repoName: string,
    baseBranch: string,
    baseSha: string,
    issueKey: string,
    options: PROptions,
  ): Promise<PRCreationResult> {
    const { default: axios } = await import("axios");

    const projectName = repoOwner;
    const apiBase = `${this.orgUrl}/${projectName}/_apis/git/repositories/${repoName}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`:${this.token}`).toString("base64")}`,
    };
    const apiVersion = "api-version=7.1";

    const branchName = options.branchName;

    // Fetch original files and apply patches BEFORE pushing to ADO
    // This allows us to detect if the changes are completely empty (no actual modifications)
    let actualChangeCount = 0;
    const changePromises = fix.changes.map(async (change) => {
      if (change.action === "delete") {
        actualChangeCount++;
        return {
          changeType: "delete" as const,
          item: { path: `/${change.filePath}` },
        };
      } else if (change.action === "create") {
        const isIdentical = await this.isFileIdentical(
          axios,
          apiBase,
          apiVersion,
          baseSha,
          change.filePath,
          change.newContent ?? "",
          headers,
        );
        if (!isIdentical) {
          actualChangeCount++;
        }
        return {
          changeType: "add" as const,
          item: { path: `/${change.filePath}` },
          newContent: {
            content: change.newContent ?? "",
            contentType: "rawtext" as const,
          },
        };
      } else if (change.action === "modify" && change.originalContent) {
        const patchResult = await this.fetchOriginalAndPatch(
          axios,
          apiBase,
          apiVersion,
          baseSha,
          change.filePath,
          change.originalContent,
          change.newContent ?? "",
          headers,
        );
        if (patchResult.isModified) {
          actualChangeCount++;
        }
        return {
          changeType: "edit" as const,
          item: { path: `/${change.filePath}` },
          newContent: {
            content: patchResult.content,
            contentType: "rawtext" as const,
          },
        };
      } else {
        actualChangeCount++;
        return {
          changeType: "edit" as const,
          item: { path: `/${change.filePath}` },
          newContent: {
            content: change.newContent ?? "",
            contentType: "rawtext" as const,
          },
        };
      }
    });

    const resolvedChanges = await Promise.all(changePromises);

    if (actualChangeCount === 0) {
      throw new Error("No actual file changes detected after applying the patch. Aborting PR creation to prevent empty commits.");
    }

    const commitMessage = this.buildCommitMessage(fix, issueKey);

    const pushPayload = {
      refUpdates: [
        {
          name: `refs/heads/${branchName}`,
          oldObjectId: baseSha,
        },
      ],
      commits: [
        {
          comment: commitMessage,
          changes: resolvedChanges,
        },
      ],
    };

    await axios.post(`${apiBase}/pushes?${apiVersion}`, pushPayload, { headers });

    // 2. Create Pull Request
    const baseBranchRef = baseBranch.startsWith("refs/")
      ? baseBranch
      : `refs/heads/${baseBranch}`;

    const prBody = this.buildPRBody(fix, issueKey);
    const prPayload: Record<string, unknown> = {
      sourceRefName: `refs/heads/${branchName}`,
      targetRefName: baseBranchRef,
      title: `🤖 [PipelineIQ] ${fix.title}`,
      description: prBody,
      isDraft: options.draft,
    };

    // Add reviewers if provided
    if (options.reviewers.length > 0) {
      prPayload.reviewers = options.reviewers.map((r) => ({
        id: r, // ADO reviewer IDs or unique names
      }));
    }

    const prResponse = await axios.post(
      `${apiBase}/pullrequests?${apiVersion}`,
      prPayload,
      { headers },
    );

    const prData = prResponse.data;
    const prId = prData.pullRequestId;
    const prUrl = `${this.orgUrl}/${projectName}/_git/${repoName}/pullrequest/${prId}`;

    // 3. Apply labels (best-effort)
    if (options.labels.length > 0) {
      for (const label of options.labels) {
        try {
          await axios.post(
            `${apiBase}/pullrequests/${prId}/labels?${apiVersion}`,
            { name: label },
            { headers },
          );
        } catch (e) {
          console.warn(`[PipelineIQ] Failed to apply ADO PR label "${label}": ${e}`);
        }
      }
    }

    return {
      prUrl,
      prNumber: prId,
      branchName,
    };
  }

  private buildCommitMessage(fix: CodeFix, issueKey: string): string {
    return [
      `fix: ${fix.title}`,
      "",
      fix.description,
      "",
      `Jira: ${issueKey}`,
      `Confidence: ${Math.round(fix.confidence * 100)}%`,
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
      "",
      `---`,
      `Generated by PipelineIQ Self-Healing Engine · Fix ID: ${fix.id}`,
    ].join("\n");
  }

  private async isFileIdentical(
    axios: any,
    apiBase: string,
    apiVersion: string,
    baseSha: string,
    filePath: string,
    newContent: string,
    headers: Record<string, string>,
  ): Promise<boolean> {
    try {
      const response = await axios.get(
        `${apiBase}/items?path=/${filePath}&versionDescriptor.version=${baseSha}&versionDescriptor.versionType=commit&${apiVersion}`,
        { headers, responseType: "text" },
      );
      return response.data === newContent;
    } catch {
      return false;
    }
  }

  private async fetchOriginalAndPatch(
    axios: any,
    apiBase: string,
    apiVersion: string,
    baseSha: string,
    filePath: string,
    originalSnippet: string,
    newSnippet: string,
    headers: Record<string, string>,
  ): Promise<{ content: string; isModified: boolean }> {
    try {
      const response = await axios.get(
        `${apiBase}/items?path=/${filePath}&versionDescriptor.version=${baseSha}&versionDescriptor.versionType=commit&${apiVersion}`,
        { headers, responseType: "text" },
      );

      const originalFile = response.data;
      let fullContent = originalFile;

      // Apply the patch: find the original snippet and replace
      if (originalFile.includes(originalSnippet)) {
        fullContent = originalFile.replace(originalSnippet, newSnippet);
      } else {
        // Fallback: try trimmed matching
        const trimmedOriginal = originalSnippet.trim();
        const lines = originalFile.split("\n");
        const matchIdx = lines.findIndex((_: string, i: number) => {
          const block = lines.slice(i, i + trimmedOriginal.split("\n").length).join("\n").trim();
          return block === trimmedOriginal;
        });

        if (matchIdx !== -1) {
          const snippetLineCount = trimmedOriginal.split("\n").length;
          const before = lines.slice(0, matchIdx).join("\n");
          const after = lines.slice(matchIdx + snippetLineCount).join("\n");
          fullContent = [before, newSnippet, after].filter(Boolean).join("\n");
        } else {
          console.warn(`[PipelineIQ] Could not locate patch target in ${filePath} — appending change`);
          fullContent = originalFile + "\n" + newSnippet;
        }
      }

      return {
        content: fullContent,
        isModified: fullContent !== originalFile,
      };
    } catch (error) {
      console.warn(`[PipelineIQ] Could not fetch ${filePath} for patching: ${error}`);
      return {
        content: newSnippet,
        isModified: true,
      };
    }
  }
}
