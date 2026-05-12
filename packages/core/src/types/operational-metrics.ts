import { z } from "zod";

export const OperationalMetricsSchema = z.object({
  mttrEstimate: z.number().int().positive().optional(),
  incidentFrequency: z.number().int().nonnegative().optional(),
  failureTrend: z.enum(["increasing", "decreasing", "stable"]).optional(),
  teamReliabilityScore: z.number().min(0).max(100).optional(),
  pipelineReliabilityScore: z.number().min(0).max(100).optional(),
  failureDuration: z.number().int().nonnegative().optional(),
  slaImpact: z.boolean().optional(),
  sloImpact: z.boolean().optional(),
  downtimeEstimate: z.number().int().nonnegative().optional(),
  deploymentRiskScore: z.number().min(0).max(10).optional(),
  blastRadius: z.array(z.string()).optional(),
  flakyDetection: z.boolean().optional(),
  similarFailuresCount: z.number().int().nonnegative().optional(),
  previousIncidentLinks: z.array(z.string()).optional(),
});

export type OperationalMetrics = z.infer<typeof OperationalMetricsSchema>;

export const OwnershipRoutingSchema = z.object({
  suggestedTeam: z.string().optional(),
  suggestedAssignee: z.string().optional(),
  escalationPolicy: z.string().optional(),
  onCallEngineer: z.string().optional(),
  serviceOwner: z.string().optional(),
  teamSlackChannel: z.string().optional(),
  teamsChannel: z.string().optional(),
});

export type OwnershipRouting = z.infer<typeof OwnershipRoutingSchema>;

export const NotificationFieldsSchema = z.object({
  slackNotificationUrl: z.string().url().optional(),
  teamsNotificationUrl: z.string().url().optional(),
  incidentChannel: z.string().optional(),
  stakeholders: z.array(z.string()).optional(),
  notificationStatus: z.enum(["pending", "sent", "delivered", "failed"]).optional(),
  pagerReference: z.string().optional(),
});

export type NotificationFields = z.infer<typeof NotificationFieldsSchema>;
