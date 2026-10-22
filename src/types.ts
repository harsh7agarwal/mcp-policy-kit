export type PolicyEffect = 'allow' | 'approve' | 'deny';

export interface PolicyRule {
  tool: string;
  effect: PolicyEffect;
  roles?: string[];
  resourceScope?: string;
  reasonCode: string;
  approvalTtlSeconds?: number;
}

export interface Policy {
  version: string;
  defaultEffect: 'deny';
  rules: PolicyRule[];
}

export interface ActionContext {
  tool: string;
  actorRole: string;
  resource?: string;
  args?: Record<string, unknown>;
}

export interface PolicyDecision {
  effect: PolicyEffect;
  reasonCode: string;
  ruleMatched?: PolicyRule;
  approvalTtlSeconds?: number;
  policyVersion: string;
}

export interface PolicyEngine {
  evaluate(context: ActionContext): PolicyDecision;
  getPolicy(): Policy;
  getHash(): string;
}

export type ToolHandler<TArgs = unknown, TResult = unknown> = (args: TArgs) => Promise<TResult>;

export type ApprovalHandler<TArgs = any> = (
  context: ActionContext,
  decision: PolicyDecision
) => Promise<any>;
