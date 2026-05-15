import type { JiraAuth, JiraTicketSpec, ExternalLink } from "../types/index.js";
import { createJiraClient, type JiraClient } from "./client.js";
import { JiraApiError } from "./errors.js";
import { markdownToAdf } from "./adf.js";

/**
 * Enhanced Jira client with additional PRD features
 * Wraps base client with custom fields, bulk operations, and advanced search
 */
export class EnhancedJiraClient implements JiraClient {
  private client: JiraClient;

  constructor(auth: JiraAuth) {
    this.client = createJiraClient(auth);
  }

  // Required JiraClient interface methods - delegate to wrapped client
  async createIssue(spec: JiraTicketSpec): Promise<any> {
    return await this.client.createIssue(spec);
  }

  async updateIssue(issueKey: string, spec: JiraTicketSpec): Promise<void> {
    return await this.client.updateIssue(issueKey, spec);
  }

  async addComment(issueKey: string, body: string): Promise<void> {
    return await this.client.addComment(issueKey, body);
  }

  async findBySignature(projectKey: string, signature: string, windowHours: number): Promise<any> {
    return await this.client.findBySignature(projectKey, signature, windowHours);
  }

  async attachFile(issueKey: string, filename: string, content: string | Buffer): Promise<void> {
    return await this.client.attachFile(issueKey, filename, content);
  }

  async createRemoteLink(issueKey: string, title: string, url: string, globalId?: string): Promise<void> {
    return await this.client.createRemoteLink(issueKey, title, url, globalId);
  }

  async fetchAll<T>(fetcher: (startAt: number) => Promise<{ values: T[]; isLast: boolean }>): Promise<T[]> {
    return await this.client.fetchAll(fetcher);
  }

  async request<T>(method: string, url: string, data?: any, params?: any): Promise<T> {
    return await this.client.request(method, url, data, params);
  }

  async requestFull<T>(method: string, url: string, data?: any, params?: any): Promise<any> {
    return await this.client.requestFull(method, url, data, params);
  }

  async checkConnection(): Promise<boolean> {
    return await this.client.checkConnection();
  }

  async getServerInfo(): Promise<any> {
    return await this.client.getServerInfo();
  }

  async doTransition(issueKey: string, transitionId: string): Promise<void> {
    return await this.client.doTransition(issueKey, transitionId);
  }

  async getTransitions(issueKey: string): Promise<any[]> {
    return await this.client.getTransitions(issueKey);
  }

  async assignIssue(issueKey: string, assigneeId: string | null): Promise<void> {
    return await this.client.assignIssue(issueKey, assigneeId);
  }

  async getIssue(issueKey: string): Promise<any> {
    return await this.client.getIssue(issueKey);
  }

  async deleteIssue(issueKey: string): Promise<void> {
    return await this.client.deleteIssue(issueKey);
  }

  async bulkFetchIssues(issueKeys: string[]): Promise<any[]> {
    return await this.client.bulkFetchIssues(issueKeys);
  }

  async bulkCreateIssues(specs: JiraTicketSpec[]): Promise<any[]> {
    return await this.client.bulkCreateIssues(specs);
  }

  async getCreateIssueMeta(projectKeys?: string[], issueTypeNames?: string[]): Promise<any> {
    return await this.client.getCreateIssueMeta(projectKeys, issueTypeNames);
  }

  async getEditIssueMeta(issueKey: string): Promise<any> {
    return await this.client.getEditIssueMeta(issueKey);
  }

  getApiPath(path: string): string {
    return this.client.getApiPath(path);
  }

  formatDescription(text: string): any {
    return this.client.formatDescription(text);
  }

  formatAssignee(assigneeId: string): any {
    return this.client.formatAssignee(assigneeId);
  }

  /**
   * Create issue with enhanced metadata from PRD
   * Supports all 80-120 operational fields
   */
  async createEnhancedIssue(spec: JiraTicketSpec): Promise<any> {
    const payload = this.buildEnhancedPayload(spec);
    
    const res = await this.request<any>("POST", this.getApiPath("/issue"), payload);

    // Assign separately to handle invalid users gracefully
    if (spec.assignee !== undefined) {
      try {
        await this.assignIssue(res.key || res.id, spec.assignee);
      } catch (assignError) {
        console.warn(`[PipelineIQ] Failed to assign enhanced issue to "${spec.assignee}": ${assignError}`);
      }
    }

    return res;
  }

  /**
   * Update issue with enhanced metadata
   */
  async updateEnhancedIssue(issueKey: string, spec: JiraTicketSpec): Promise<void> {
    const payload = {
      fields: this.buildEnhancedFields(spec),
    };

    await this.request<void>("PUT", this.getApiPath(`/issue/${issueKey}`), payload);

    // Assign separately to handle invalid users gracefully
    if (spec.assignee !== undefined) {
      try {
        await this.assignIssue(issueKey, spec.assignee);
      } catch (assignError) {
        console.warn(`[PipelineIQ] Failed to update assignee for enhanced issue ${issueKey} to "${spec.assignee}": ${assignError}`);
      }
    }
  }

  /**
   * Add multiple comments in bulk
   */
  async addBulkComments(issueKey: string, comments: string[]): Promise<void> {
    for (const comment of comments) {
      await this.addComment(issueKey, comment);
    }
  }

  /**
   * Add external links to issue
   */
  async addExternalLinks(issueKey: string, links: ExternalLink[]): Promise<void> {
    for (const link of links) {
      const payload = {
        object: {
          url: link.url,
          title: link.title,
          globalId: link.url,
        },
      };

      await this.request<void>("POST", `/rest/api/3/issue/${issueKey}/remotelink`, payload);
    }
  }

  /**
   * Search issues with advanced JQL
   */
  async advancedSearch(
    jql: string, 
    options: {
      maxResults?: number;
      startAt?: number;
      fields?: string[];
      expand?: string[];
    } = {}
  ): Promise<{ issues: any[]; total: number; startAt: number; maxResults: number }> {
    const payload = {
      jql,
      maxResults: options.maxResults || 50,
      startAt: options.startAt || 0,
      fields: options.fields || ["summary", "status", "created", "updated", "priority", "labels"],
      expand: options.expand || [],
    };

    return await this.request<any>("POST", "/rest/api/3/search/jql", payload);
  }

  /**
   * Find issues by multiple criteria
   */
  async findSimilarIssues(
    projectKey: string,
    criteria: {
      signature?: string;
      category?: string;
      repository?: string;
      branch?: string;
      timeWindow?: number;
    }
  ): Promise<any[]> {
    const jqlParts: string[] = [`project = "${projectKey}"`, "resolution = Unresolved"];

    if (criteria.signature) {
      jqlParts.push(`labels = "piq-sig:${criteria.signature}"`);
    }

    if (criteria.category) {
      jqlParts.push(`labels = "piq-cat:${criteria.category.toLowerCase()}"`);
    }

    if (criteria.repository) {
      jqlParts.push(`labels = "repo:${criteria.repository}"`);
    }

    if (criteria.branch) {
      jqlParts.push(`labels = "branch:${criteria.branch}"`);
    }

    if (criteria.timeWindow) {
      jqlParts.push(`created >= -${criteria.timeWindow}h`);
    }

    const jql = jqlParts.join(" AND ");
    const result = await this.advancedSearch(jql, { maxResults: 10 });
    
    return result.issues;
  }

  /**
   * Get issue with all fields including custom fields
   */
  async getFullIssue(issueKey: string): Promise<any> {
    const expand = [
      "renderedFields",
      "names",
      "schema",
      "transitions",
      "operations",
      "editmeta",
      "changelog",
      "versionedRepresentations"
    ].join(",");

    return await this.request<any>("GET", this.getApiPath(`/issue/${issueKey}?expand=${expand}`));
  }

  /**
   * Add worklog entry
   */
  async addWorklog(
    issueKey: string, 
    timeSpentSeconds: number, 
    comment?: string
  ): Promise<void> {
    const payload = {
      timeSpentSeconds,
      comment: comment ? markdownToAdf(comment) : undefined,
    };

    await this.request<void>("POST", `/rest/api/3/issue/${issueKey}/worklog`, payload);
  }

  /**
   * Transition issue to new status
   */
  async transitionIssue(issueKey: string, transitionName: string, comment?: string): Promise<void> {
    // First get available transitions
    const transitions = await this.request<any>("GET", `/rest/api/3/issue/${issueKey}/transitions`);
    
    const transition = transitions.transitions.find((t: any) => 
      t.name.toLowerCase() === transitionName.toLowerCase()
    );

    if (!transition) {
      throw new JiraApiError(`Transition "${transitionName}" not available`, 400);
    }

    const payload: any = {
      transition: { id: transition.id },
    };

    if (comment) {
      payload.update = {
        comment: [{ add: { body: markdownToAdf(comment) } }],
      };
    }

    await this.request<void>("POST", `/rest/api/3/issue/${issueKey}/transitions`, payload);
  }

  /**
   * Add watchers to issue
   */
  async addWatchers(issueKey: string, watchers: string[]): Promise<void> {
    for (const watcher of watchers) {
      await this.request<void>("POST", `/rest/api/3/issue/${issueKey}/watchers`, watcher);
    }
  }

  /**
   * Link issues together
   */
  async linkIssues(
    fromIssueKey: string, 
    toIssueKey: string, 
    linkType: string = "Relates"
  ): Promise<void> {
    const payload = {
      outwardIssue: { key: fromIssueKey },
      inwardIssue: { key: toIssueKey },
      type: { name: linkType },
    };

    await this.request<void>("POST", this.getApiPath("/issueLink"), payload);
  }

  /**
   * Get project metadata
   */
  async getProject(projectKey: string): Promise<any> {
    return await this.request<any>("GET", this.getApiPath(`/project/${projectKey}`));
  }

  /**
   * Get issue types for project
   */
  async getIssueTypes(projectKey: string): Promise<any[]> {
    return await this.request<any[]>("GET", this.getApiPath(`/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes.fields`));
  }

  /**
   * Build enhanced payload with all PRD fields
   */
  private buildEnhancedPayload(spec: JiraTicketSpec): any {
    return {
      fields: this.buildEnhancedFields(spec),
    };
  }

  /**
   * Build enhanced fields object with all operational metadata
   */
  private buildEnhancedFields(spec: JiraTicketSpec): any {
    const baseFields = {
      project: { key: spec.projectKey },
      summary: spec.summary.length > 255 ? spec.summary.substring(0, 252) + "..." : spec.summary,
      description: this.formatDescription(spec.description),
      issuetype: { name: spec.issueType },
      labels: spec.labels,
      ...(spec.priority ? { priority: { name: spec.priority } } : {}),
      ...(spec.environment ? { environment: this.formatDescription(spec.environment) } : {}),
      ...(spec.components.length > 0 
        ? { components: spec.components.map((name) => ({ name })) }
        : {}),
      ...spec.customFields,
    };

    // Add PipelineIQ-specific custom fields
    const enhancedFields = {
      ...baseFields,
      // External links as custom field
      ...(spec.externalLinks && spec.externalLinks.length > 0
        ? {
            "customfield_10010": {
              type: "com.atlassian.jira.plugin.system.external-links:external-links",
              value: spec.externalLinks,
            },
          }
        : {}),
      // Provenance tracking
      ...(spec.provenance && Object.keys(spec.provenance).length > 0
        ? {
            "customfield_10011": {
              type: "json",
              value: JSON.stringify(spec.provenance),
            },
          }
        : {}),
      // Dedup signature
      ...(spec.dedupSignature
        ? {
            "customfield_10012": spec.dedupSignature,
          }
        : {}),
    };

    return enhancedFields;
  }
}
