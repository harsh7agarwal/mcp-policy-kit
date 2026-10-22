import { z } from 'zod';

export const PolicyRuleSchema = z.object({
  tool: z.string().trim().min(1),
  effect: z.enum(['allow', 'approve', 'deny']),
  roles: z.array(z.string().trim().min(1)).min(1).optional(),
  resourceScope: z.string().trim().min(1).optional(),
  reasonCode: z.string().trim().min(1),
  approvalTtlSeconds: z.number().int().min(1).max(86400).optional(),
}).strict();

export const PolicySchema = z.object({
  version: z.string().min(1),
  defaultEffect: z.literal('deny').default('deny'),
  rules: z.array(PolicyRuleSchema),
}).strict();

export function validatePolicy(data: unknown) {
  return PolicySchema.parse(data);
}
