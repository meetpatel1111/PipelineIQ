export { createJiraClient, type JiraClient } from "./client.js";
export { EnhancedJiraClient } from "./enhanced-client.js";
import { EnhancedJiraClient } from "./enhanced-client.js";
import type { JiraAuth, JiraCustomFieldMapping } from "../types/index.js";

/**
 * Factory for the enhanced Jira client (supports historical search)
 */
export function createEnhancedJiraClient(
  auth: JiraAuth,
  customFields?: JiraCustomFieldMapping
): EnhancedJiraClient {
  return new EnhancedJiraClient(auth, customFields);
}
export type { CreateIssueResult, FoundIssue } from "./client.js";
export { JiraApiError, JiraConfigError } from "./errors.js";
export { markdownToAdf } from "./adf.js";
export type { AdfDoc, AdfNode } from "./adf.js";
