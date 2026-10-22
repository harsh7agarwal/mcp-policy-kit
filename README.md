# mcp-policy-kit

A small TypeScript library for deterministic policy decisions around MCP tool handlers. It is framework-agnostic and can be used by an MCP server or gateway.

## What it provides
- Zod validation for declarative policy documents.
- Deterministic `deny > approve > allow` precedence.
- Default-deny decisions when no rule matches.
- SHA-256 policy hash for audit/version tracking.
- `wrapToolHandler` to ensure denied and approval-required actions do not run the downstream handler.

## Install / build

```bash
npm install
npm test
npm run build
```

## Example

```ts
import { createPolicyEngine, wrapToolHandler } from 'mcp-policy-kit';

const engine = createPolicyEngine({
  version: '1.0.0',
  defaultEffect: 'deny',
  rules: [
    { tool: 'orders.get', effect: 'allow', roles: ['operator'], reasonCode: 'READ_ALLOWED' },
    { tool: 'orders.update', effect: 'approve', roles: ['operator'], reasonCode: 'HUMAN_REVIEW', approvalTtlSeconds: 300 },
  ],
});

const guarded = wrapToolHandler(async (args: { id: string }) => getOrder(args.id), engine);
const outcome = await guarded({ tool: 'orders.get', actorRole: 'operator' }, { id: '1042' });
if (outcome.executed) console.log(outcome.result);
```

**Important:** `approve` does not automatically approve or execute a mutation. The optional `onApprovalRequired` callback can create a ticket in the host application's approval workflow; the host should execute the mutation only after an authorized approval is completed.

## Publish as a separate GitHub repository
1. Create a new public GitHub repository named `mcp-policy-kit`.
2. Upload the contents of this folder (not the parent folder) and push the initial commit.
3. Tag the release: `git tag v0.1.0 && git push origin v0.1.0`.
4. In PermissionOS, replace the placeholder Git dependency with `git+https://github.com/YOUR_USERNAME/mcp-policy-kit.git#v0.1.0`, then run `npm install`.

## Security note
This is a policy decision helper, not a complete authentication or approval service. The integrating application remains responsible for actor identity, authorization of approvers, audit persistence, replay protection, and safe downstream execution.
