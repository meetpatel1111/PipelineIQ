import type { SlackConfig, TeamsConfig, NotificationsConfig } from "../types/config.js";

export type { SlackConfig, TeamsConfig, NotificationsConfig };

export type ChannelResult = {
  success: boolean;
  error?: string;
};

export type NotificationResult = {
  slack?: ChannelResult;
  teams?: ChannelResult;
};

export type NotificationMetrics = {
  mttrHours?: number;
  blastRadius?: number;
};

export type NotificationPayload = {
  title: string;
  summary?: string;
  severity: string;
  priority: string;
  jiraKey: string;
  jiraUrl: string;
  repo: string;
  pipeline: string;
  branch: string;
  isNewTicket: boolean;
  dedupCount?: number;
  metrics?: NotificationMetrics;
};
