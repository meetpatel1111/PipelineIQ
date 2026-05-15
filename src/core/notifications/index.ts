import type { NotificationPayload, NotificationsConfig, NotificationResult } from "./types.js";
import { sendSlack } from "./slack.js";
import { sendTeams } from "./teams.js";

export { NotificationService };
export type { NotificationPayload, NotificationResult, NotificationsConfig };

class NotificationService {
  constructor(private config: NotificationsConfig) {}

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (this.config.enabled === false) return {};

    const result: NotificationResult = {};
    const tasks: Promise<void>[] = [];

    if (this.config.slack) {
      const cfg = this.config.slack;
      const notifyOn = cfg.notifyOn?.map((s) => s.toLowerCase());
      if (!notifyOn || notifyOn.includes(payload.severity.toLowerCase())) {
        tasks.push(sendSlack(payload, cfg).then((r) => { result.slack = r; }));
      }
    }

    if (this.config.teams) {
      const cfg = this.config.teams;
      const notifyOn = cfg.notifyOn?.map((s) => s.toLowerCase());
      if (!notifyOn || notifyOn.includes(payload.severity.toLowerCase())) {
        tasks.push(sendTeams(payload, cfg).then((r) => { result.teams = r; }));
      }
    }

    const settled = await Promise.allSettled(tasks);
    for (const s of settled) {
      if (s.status === "rejected") {
        console.warn(`[PipelineIQ] Notification dispatch error: ${s.reason}`);
      }
    }

    return result;
  }
}
