import test from 'node:test';
import assert from 'node:assert/strict';
import { createPolicyEngine, wrapToolHandler } from '../dist/index.js';
const policy = { version: 'test-1', defaultEffect: 'deny', rules: [
  { tool: 'orders.get', effect: 'allow', roles: ['operator'], reasonCode: 'READ_ALLOWED' },
  { tool: 'orders.update', effect: 'approve', roles: ['operator'], reasonCode: 'MUTATION_REQUIRES_APPROVAL', approvalTtlSeconds: 300 },
  { tool: 'orders.export', effect: 'deny', reasonCode: 'BULK_EXPORT_DENIED' },
]};
test('default deny for tools without a matching rule', () => { const engine=createPolicyEngine(policy); assert.equal(engine.evaluate({tool:'unknown.tool',actorRole:'operator'}).effect,'deny'); });
test('explicit allow permits execution', async () => { const engine=createPolicyEngine(policy); let called=false; const wrapped=wrapToolHandler(async()=>{called=true;return 'ok'},engine); const out=await wrapped({tool:'orders.get',actorRole:'operator'},{}); assert.equal(out.decision.effect,'allow'); assert.equal(out.executed,true); assert.equal(called,true); });
test('approval-required actions do not execute handler', async () => { const engine=createPolicyEngine(policy); let called=false; const wrapped=wrapToolHandler(async()=>{called=true;return 'mutated'},engine); const out=await wrapped({tool:'orders.update',actorRole:'operator'},{}); assert.equal(out.decision.effect,'approve'); assert.equal(out.executed,false); assert.equal(called,false); });
test('deny never executes handler', async () => { const engine=createPolicyEngine(policy); let called=false; const wrapped=wrapToolHandler(async()=>{called=true;return 'exported'},engine); const out=await wrapped({tool:'orders.export',actorRole:'operator'},{}); assert.equal(out.decision.effect,'deny'); assert.equal(out.executed,false); assert.equal(called,false); });
test('deny wins when matching rules conflict', () => { const engine=createPolicyEngine({version:'1',defaultEffect:'deny',rules:[{tool:'x',effect:'allow',reasonCode:'ALLOW'},{tool:'x',effect:'deny',reasonCode:'DENY'}]}); assert.equal(engine.evaluate({tool:'x',actorRole:'operator'}).effect,'deny'); });
