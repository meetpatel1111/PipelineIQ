import { createCloudClient, type CloudClient } from "jira.js";
import { createClient, type Client } from "jira.js/core";
import JiraApi from "jira-client";
import type { JiraAuth, JiraTicketSpec } from "../types/index.js";
import { markdownToAdf } from "./adf.js";
import { JiraApiError } from "./errors.js";

/**
 * Escape characters for safe embedding inside JQL quoted strings.
 * Jira requires escaping \ and " inside quoted string literals.
 */
export function escapeJql(value: string): string {
  if (!value || typeof value !== "string") return "";
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Validate that a Jira project key conforms to standard Jira key syntax (e.g. "PROJ", "CORE_1").
 */
export function sanitizeProjectKey(key: string): string {
  if (!key || typeof key !== "string" || !/^[A-Z][A-Z0-9_]{0,30}$/i.test(key.trim())) {
    throw new Error(`[PipelineIQ Security] Invalid Jira project key: "${key}"`);
  }
  return key.trim().toUpperCase();
}

export type CreateIssueResult = {
  id: string;
  key: string;
  self: string;
};

export type FoundIssue = {
  id: string;
  key: string;
  self: string;
  summary: string;
  status: string;
};

export interface JiraClient {
  createIssue(spec: JiraTicketSpec): Promise<CreateIssueResult>;
  updateIssue(issueKey: string, spec: JiraTicketSpec): Promise<void>;
  addComment(issueKey: string, body: string): Promise<void>;
  findBySignature(projectKey: string, signature: string, windowHours: number): Promise<FoundIssue | null>;
  attachFile(issueKey: string, filename: string, content: string | Buffer): Promise<void>;
  createRemoteLink(issueKey: string, title: string, url: string, globalId?: string): Promise<void>;
  fetchAll<T>(fetcher: (startAt: number) => Promise<{ values: T[]; isLast: boolean }>): Promise<T[]>;
  request<T>(method: string, url: string, data?: any, params?: any): Promise<T>;
  requestFull<T>(method: string, url: string, data?: any, params?: any): Promise<any>;
  checkConnection(): Promise<boolean>;
  getServerInfo(): Promise<any>;
  doTransition(issueKey: string, transitionId: string): Promise<void>;
  getTransitions(issueKey: string): Promise<any[]>;
  assignIssue(issueKey: string, assigneeId: string | null): Promise<void>;
  getIssue(issueKey: string): Promise<any>;
  deleteIssue(issueKey: string): Promise<void>;
  bulkFetchIssues(issueKeys: string[]): Promise<any[]>;
  bulkCreateIssues(specs: JiraTicketSpec[]): Promise<CreateIssueResult[]>;
  getCreateIssueMeta(projectKeys?: string[], issueTypeNames?: string[]): Promise<any>;
  getEditIssueMeta(issueKey: string): Promise<any>;

  // Platform-specific helpers
  getApiPath(path: string): string;
  formatDescription(text: string): any;
  formatAssignee(assigneeId: string): any;
}

/**
 * Jira Cloud implementation using jira.js
 */
class JiraCloudClient implements JiraClient {
  private cloudClient: CloudClient;
  private coreClient: Client;

  constructor(auth: JiraAuth) {
    let authConfig: any = undefined;

    if (auth.accessToken) {
      authConfig = {
        type: "bearer" as const,
        token: auth.accessToken,
      };
    } else if (auth.email && auth.apiToken) {
      authConfig = {
        type: "basic" as const,
        email: auth.email,
        apiToken: auth.apiToken,
      };
    }

    const host = auth.baseUrl.replace(/\/+$/, "");
    this.coreClient = createClient({
      host,
      auth: authConfig,
      onSchemaMismatch: "warn",
    });
    this.cloudClient = createCloudClient(this.coreClient);
  }

  async request<T>(method: string, url: string, data?: any, params?: any): Promise<T> {
    try {
      return await this.coreClient.sendRequest<T>({
        method: method as any,
        url,
        body: data,
        searchParams: params,
      });
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async createIssue(spec: JiraTicketSpec): Promise<CreateIssueResult> {
    try {
      const res = await this.cloudClient.issues.createIssue({
        fields: {
          project: { key: spec.projectKey },
          summary: (spec.summary as string).length > 255 ? (spec.summary as string).substring(0, 252) + "..." : (spec.summary as string),
          description: markdownToAdf(spec.description as string) as any,
          issuetype: { name: spec.issueType },
          labels: spec.labels,
          ...(spec.priority ? { priority: { name: spec.priority } } : {}),
          ...(spec.environment ? { environment: markdownToAdf(spec.environment) as any } : {}),
          ...(spec.components.length > 0
            ? { components: spec.components.map((name) => ({ name })) }
            : {}),
          ...spec.customFields,
        },
      });

      // Assign separately to prevent failure if assignee is invalid (common with AI-suggested users)
      if (spec.assignee !== undefined) {
        try {
          await this.assignIssue(res.key, spec.assignee);
        } catch (assignError) {
          console.warn(`[PipelineIQ] Failed to assign issue ${res.key} to "${spec.assignee}": ${assignError}`);
        }
      }

      return res as CreateIssueResult;
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async updateIssue(issueKey: string, spec: JiraTicketSpec): Promise<void> {
    try {
      await this.cloudClient.issues.editIssue({
        issueIdOrKey: issueKey,
        fields: {
          summary: spec.summary,
          description: markdownToAdf(spec.description) as any,
          labels: spec.labels,
          ...(spec.priority ? { priority: { name: spec.priority } } : {}),
        },
      });
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async addComment(issueKey: string, body: string): Promise<void> {
    try {
      await this.cloudClient.issueComments.addComment({
        issueIdOrKey: issueKey,
        body: markdownToAdf(body) as any,
      });
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async findBySignature(projectKey: string, signature: string, windowHours: number): Promise<FoundIssue | null> {
    const safeProject = sanitizeProjectKey(projectKey);
    const safeSignature = escapeJql(signature);
    const label = `piq-sig:${safeSignature}`;
    const safeHours = Math.max(1, Math.min(8760, Number(windowHours) || 24));
    const jql = `project = "${safeProject}" AND labels = "${label}" AND created >= -${safeHours}h ORDER BY created DESC`;

    try {
      // Atlassian deprecated /rest/api/3/search in favor of /rest/api/3/search/jql
      const result = await this.coreClient.sendRequest<any>({
        method: "GET",
        url: "/rest/api/3/search/jql",
        searchParams: {
          jql,
          maxResults: 1,
          fields: "summary,status",
        },
      });

      const issue = result.issues?.[0];
      if (!issue) return null;
      return {
        id: issue.id!,
        key: issue.key!,
        self: issue.self!,
        summary: issue.fields!.summary,
        status: issue.fields!.status.name!,
      };
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async attachFile(issueKey: string, filename: string, content: string | Buffer): Promise<void> {
    try {
      await this.cloudClient.issueAttachments.addAttachment({
        issueIdOrKey: issueKey,
        attachments: {
          filename,
          content,
        },
      });
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async createRemoteLink(issueKey: string, title: string, url: string, globalId?: string): Promise<void> {
    try {
      await this.cloudClient.issueRemoteLinks.createOrUpdateRemoteIssueLink({
        issueIdOrKey: issueKey,
        object: {
          title,
          url,
        },
        ...(globalId !== undefined ? { globalId } : {}),
      });
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async requestFull<T>(method: string, url: string, data?: any, params?: any): Promise<any> {
    try {
      return await this.coreClient.sendRequest<T>({
        method: method as any,
        url,
        body: data,
        searchParams: params,
      });
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async fetchAll<T>(
    fetcher: (startAt: number) => Promise<{ values: T[]; isLast: boolean }>
  ): Promise<T[]> {
    const allItems: T[] = [];
    let startAt = 0;
    let isLast = false;
    let pageCount = 0;
    const maxPages = 100;

    while (!isLast && pageCount < maxPages) {
      const page = await fetcher(startAt);
      allItems.push(...page.values);
      isLast = page.isLast;
      startAt += page.values.length;
      pageCount++;
      if (page.values.length === 0) break;
    }

    return allItems;
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.cloudClient.myself.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  async getServerInfo(): Promise<any> {
    try {
      return await this.cloudClient.serverInfo.getServerInfo();
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async doTransition(issueKey: string, transitionId: string): Promise<void> {
    try {
      await this.cloudClient.issues.doTransition({
        issueIdOrKey: issueKey,
        transition: { id: transitionId },
      });
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async getTransitions(issueKey: string): Promise<any[]> {
    try {
      const res = await this.cloudClient.issues.getTransitions({ issueIdOrKey: issueKey });
      return (res as any).transitions || [];
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async assignIssue(issueKey: string, assigneeId: string | null): Promise<void> {
    try {
      await this.cloudClient.issues.assignIssue({
        issueIdOrKey: issueKey,
        accountId: assigneeId ?? undefined,
      });
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async getIssue(issueKey: string): Promise<any> {
    try {
      return await this.cloudClient.issues.getIssue({
        issueIdOrKey: issueKey,
      });
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async deleteIssue(issueKey: string): Promise<void> {
    try {
      await this.cloudClient.issues.deleteIssue({
        issueIdOrKey: issueKey,
      });
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async bulkFetchIssues(issueKeys: string[]): Promise<any[]> {
    if (issueKeys.length === 0) return [];
    try {
      const jql = `key in (${issueKeys.map((k) => `"${k}"`).join(",")})`;
      const res = await this.cloudClient.issueSearch.searchAndReconsileIssuesUsingJql({
        jql,
        maxResults: issueKeys.length,
      });
      return (res as any).issues || [];
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async bulkCreateIssues(specs: JiraTicketSpec[]): Promise<CreateIssueResult[]> {
    if (specs.length === 0) return [];
    try {
      const res = await this.cloudClient.issues.createIssues({
        issueUpdates: specs.map((spec) => ({
          fields: {
            project: { key: spec.projectKey },
            summary: (spec.summary as string).length > 255 ? (spec.summary as string).substring(0, 252) + "..." : (spec.summary as string),
            description: markdownToAdf(spec.description as string) as any,
            issuetype: { name: spec.issueType },
            labels: spec.labels,
            ...(spec.priority ? { priority: { name: spec.priority } } : {}),
            ...(spec.environment ? { environment: markdownToAdf(spec.environment) as any } : {}),
            ...(spec.components.length > 0
              ? { components: spec.components.map((name) => ({ name })) }
              : {}),
            ...spec.customFields,
          },
        })),
      });

      const results = ((res as any).issues || []) as CreateIssueResult[];

      // Assign separately for each created issue
      for (let i = 0; i < results.length; i++) {
        const spec = specs[i];
        const result = results[i];
        if (spec && result && spec.assignee !== undefined && result.key) {
          try {
            await this.assignIssue(result.key, spec.assignee as string | null);
          } catch (assignError) {
            console.warn(`[PipelineIQ] Failed to bulk-assign issue ${result.key} to "${spec.assignee}": ${assignError}`);
          }
        }
      }

      return results;
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async getCreateIssueMeta(projectKeys?: string[], issueTypeNames?: string[]): Promise<any> {
    try {
      const projectKey = projectKeys?.[0];
      if (projectKey) {
        return await this.cloudClient.issues.getCreateIssueMetaIssueTypes({
          projectIdOrKey: projectKey,
        });
      }
      return {};
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async getEditIssueMeta(issueKey: string): Promise<any> {
    try {
      return await this.cloudClient.issues.getEditIssueMeta({
        issueIdOrKey: issueKey,
      });
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  getApiPath(path: string): string {
    return `/rest/api/3${path}`;
  }

  formatDescription(text: string): any {
    return markdownToAdf(text);
  }

  formatAssignee(assigneeId: string): any {
    return { accountId: assigneeId };
  }
}

/**
 * Jira Server/Data Center implementation using jira-client
 */
class JiraServerClient implements JiraClient {
  private client: JiraApi;

  constructor(auth: JiraAuth) {
    const url = new URL(auth.baseUrl);
    this.client = new JiraApi({
      protocol: url.protocol.replace(":", ""),
      host: url.hostname,
      port: url.port || (url.protocol === "https:" ? "443" : "80"),
      username: auth.username || auth.email?.split("@")[0] || "admin",
      password: auth.apiToken,
      apiVersion: "2",
      strictSSL: true,
    });
  }

  async request<T>(method: string, url: string, data?: any, params?: any): Promise<T> {
    try {
      // jira-client doesn't expose a clean sendRequest, but we can use its internal request method
      // which is usually available on the instance.
      const options = {
        method: method,
        uri: (this.client as any).makeUri({ pathname: url, query: params }),
        body: data,
        json: true,
      };
      
      return await (this.client as any).doRequest(options);
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async createIssue(spec: JiraTicketSpec): Promise<CreateIssueResult> {
    try {
      const res = await this.client.addNewIssue({
        fields: {
          project: { key: spec.projectKey },
          summary: (spec.summary as string).length > 255 ? (spec.summary as string).substring(0, 252) + "..." : (spec.summary as string),
          // Jira Server uses Wiki Markup, not ADF
          description: spec.description as string,
          issuetype: { name: spec.issueType },
          labels: spec.labels,
          ...(spec.priority ? { priority: { name: spec.priority } } : {}),
          ...(spec.environment ? { environment: spec.environment } : {}),
          ...(spec.components.length > 0
            ? { components: spec.components.map((name) => ({ name })) }
            : {}),
          ...spec.customFields,
        },
      });

      if (spec.assignee !== undefined) {
        try {
          await this.assignIssue(res.key, spec.assignee);
        } catch (assignError) {
          console.warn(`[PipelineIQ] Failed to assign issue ${res.key} to "${spec.assignee}": ${assignError}`);
        }
      }

      return {
        id: res.id,
        key: res.key,
        self: res.self,
      };
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async updateIssue(issueKey: string, spec: JiraTicketSpec): Promise<void> {
    try {
      await this.client.updateIssue(issueKey, {
        fields: {
          summary: spec.summary,
          description: spec.description,
          labels: spec.labels,
          ...(spec.priority ? { priority: { name: spec.priority } } : {}),
        },
      });
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async addComment(issueKey: string, body: string): Promise<void> {
    try {
      await this.client.addComment(issueKey, body);
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async findBySignature(projectKey: string, signature: string, windowHours: number): Promise<FoundIssue | null> {
    const safeProject = sanitizeProjectKey(projectKey);
    const safeSignature = escapeJql(signature);
    const label = `piq-sig:${safeSignature}`;
    const safeHours = Math.max(1, Math.min(8760, Number(windowHours) || 24));
    const jql = `project = "${safeProject}" AND labels = "${label}" AND created >= -${safeHours}h ORDER BY created DESC`;

    try {
      const result = await this.client.searchJira(jql, {
        maxResults: 1,
        fields: ["summary", "status"],
      });

      const issue = result.issues?.[0];
      if (!issue) return null;
      return {
        id: issue.id,
        key: issue.key,
        self: issue.self,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
      };
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async attachFile(issueKey: string, filename: string, content: string | Buffer): Promise<void> {
    try {
      // jira-client's addAttachment expects a stream or a path, but can handle buffers if configured.
      // This is a simplified version.
      await this.client.addAttachmentOnIssue(issueKey, content as any);
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async createRemoteLink(issueKey: string, title: string, url: string, globalId?: string): Promise<void> {
    try {
      // jira-client uses createRemoteLink
      await (this.client as any).createRemoteLink(issueKey, {
        object: {
          url,
          title,
        },
        globalId,
      });
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async requestFull<T>(method: string, url: string, data?: any, params?: any): Promise<any> {
    // For Server, we'll just return the body wrapped in a response-like object for consistency
    const data_res = await this.request<T>(method, url, data, params);
    return { data: data_res };
  }

  async fetchAll<T>(
    fetcher: (startAt: number) => Promise<{ values: T[]; isLast: boolean }>
  ): Promise<T[]> {
    const allItems: T[] = [];
    let startAt = 0;
    let isLast = false;
    let pageCount = 0;
    const maxPages = 100;

    while (!isLast && pageCount < maxPages) {
      const page = await fetcher(startAt);
      allItems.push(...page.values);
      isLast = page.isLast;
      startAt += page.values.length;
      pageCount++;
      if (page.values.length === 0) break;
    }

    return allItems;
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.client.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  async getServerInfo(): Promise<any> {
    try {
      // jira-client's getServerInfo returns similar information
      return await this.client.getServerInfo();
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async doTransition(issueKey: string, transitionId: string): Promise<void> {
    try {
      await this.client.transitionIssue(issueKey, {
        transition: { id: transitionId },
      });
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async getTransitions(issueKey: string): Promise<any[]> {
    try {
      const res = await this.client.listTransitions(issueKey);
      return res.transitions || [];
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async assignIssue(issueKey: string, assigneeId: string | null): Promise<void> {
    try {
      // For Server, assigneeId is typically the username
      // jira-client uses updateAssignee
      await this.client.updateAssignee(issueKey, assigneeId as any);
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async getIssue(issueKey: string): Promise<any> {
    try {
      return await this.client.findIssue(issueKey);
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async deleteIssue(issueKey: string): Promise<void> {
    try {
      await this.client.deleteIssue(issueKey);
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async bulkFetchIssues(issueKeys: string[]): Promise<any[]> {
    if (issueKeys.length === 0) return [];
    try {
      const jql = `key in (${issueKeys.map((k) => `"${k}"`).join(",")})`;
      const res = await this.client.searchJira(jql);
      return res.issues || [];
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async bulkCreateIssues(specs: JiraTicketSpec[]): Promise<CreateIssueResult[]> {
    // Jira Server doesn't have a bulk create API in jira-client, so we loop
    const results: CreateIssueResult[] = [];
    for (const spec of specs) {
      results.push(await this.createIssue(spec));
    }
    return results;
  }

  async getCreateIssueMeta(projectKeys?: string[], issueTypeNames?: string[]): Promise<any> {
    try {
      // jira-client's getIssueCreateMetadata
      return await this.client.getIssueCreateMetadata({
        projectKeys: projectKeys,
        issuetypeNames: issueTypeNames,
        expand: "projects.issuetypes.fields",
      });
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  async getEditIssueMeta(issueKey: string): Promise<any> {
    try {
      // jira-client uses getIssueUpdateMetadata or similar, but it's often simpler to just use the REST path
      return await this.request("GET", `/issue/${issueKey}/editmeta`);
    } catch (error: any) {
      throw JiraApiError.from(error);
    }
  }

  getApiPath(path: string): string {
    return `/rest/api/2${path}`;
  }

  formatDescription(text: string): any {
    return text;
  }

  formatAssignee(assigneeId: string): any {
    return { name: assigneeId };
  }
}

/**
 * Factory for platform-specific Jira Clients
 */
export function createJiraClient(auth: JiraAuth): JiraClient {
  if (auth.type === "server") {
    return new JiraServerClient(auth);
  } else {
    return new JiraCloudClient(auth);
  }
}
