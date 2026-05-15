import type { NotificationPayload, SlackConfig, ChannelResult } from "./types.js";

const SEVERITY_EMOJI: Record<string, string> = {
  Critical: "🔴",
  High: "🟠",
  Medium: "🟡",
  Low: "🔵",
};

export async function sendSlack(
  payload: NotificationPayload,
  config: SlackConfig,
): Promise<ChannelResult> {
  const emoji = SEVERITY_EMOJI[payload.severity] ?? "⚪";
  const ticketStatus = payload.isNewTicket
    ? "new ticket"
    : `seen ${payload.dedupCount ?? 1}×`;

  const metricsText =
    config.includeMetrics !== false && payload.metrics
      ? buildMetricsText(payload.metrics)
      : null;

  const blocks: object[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} [${payload.severity.toUpperCase()}] ${payload.title} — ${payload.repo}`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Pipeline:* ${payload.pipeline}` },
        { type: "mrkdwn", text: `*Branch:* ${payload.branch}` },
        {
          type: "mrkdwn",
          text: `*Jira:* <${payload.jiraUrl}|${payload.jiraKey}> (${ticketStatus})`,
        },
        { type: "mrkdwn", text: `*Priority:* ${payload.priority}` },
      ],
    },
  ];

  if (payload.summary) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Root cause:* ${payload.summary}` },
    });
  }

  if (metricsText) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: `📊  ${metricsText}` }],
    });
  }

  const body: Record<string, unknown> = { blocks };
  if (config.channel) body.channel = config.channel;
  if (config.username) body.username = config.username;

  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${await response.text()}` };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function buildMetricsText(metrics: { mttrHours?: number; blastRadius?: number }): string {
  const parts: string[] = [];
  if (metrics.mttrHours !== undefined) parts.push(`MTTR ${metrics.mttrHours}h`);
  if (metrics.blastRadius !== undefined) parts.push(`${metrics.blastRadius} repos affected`);
  return parts.join("  |  ");
}
