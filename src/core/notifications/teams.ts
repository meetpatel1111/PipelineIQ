import type { NotificationPayload, TeamsConfig, ChannelResult } from "./types.js";

const SEVERITY_COLOR: Record<string, string> = {
  Critical: "attention",
  High: "warning",
  Medium: "accent",
  Low: "good",
};

export async function sendTeams(
  payload: NotificationPayload,
  config: TeamsConfig,
): Promise<ChannelResult> {
  const color = SEVERITY_COLOR[payload.severity] ?? "accent";
  const ticketStatus = payload.isNewTicket
    ? "New ticket"
    : `Seen ${payload.dedupCount ?? 1}×`;

  const facts: Array<{ title: string; value: string }> = [
    { title: "Pipeline", value: payload.pipeline },
    { title: "Branch", value: payload.branch },
    { title: "Jira", value: `[${payload.jiraKey}](${payload.jiraUrl}) — ${ticketStatus}` },
    { title: "Priority", value: payload.priority },
  ];

  if (config.includeMetrics !== false && payload.metrics) {
    if (payload.metrics.mttrHours !== undefined) {
      facts.push({ title: "MTTR", value: `${payload.metrics.mttrHours}h avg` });
    }
    if (payload.metrics.blastRadius !== undefined) {
      facts.push({ title: "Blast radius", value: `${payload.metrics.blastRadius} repos` });
    }
  }

  const bodyBlocks: object[] = [
    {
      type: "TextBlock",
      text: `[${payload.severity.toUpperCase()}] ${payload.title}`,
      weight: "Bolder",
      size: "Medium",
      color,
    },
    { type: "TextBlock", text: payload.repo, isSubtle: true },
    { type: "FactSet", facts },
  ];

  if (payload.summary) {
    bodyBlocks.push({ type: "TextBlock", text: payload.summary, wrap: true });
  }

  const card = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: bodyBlocks,
        },
      },
    ],
  };

  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${await response.text()}` };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
