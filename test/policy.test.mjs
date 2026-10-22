import test from 'node:test';
import assert from 'node:assert/strict';
import { createPolicyEngine, wrapToolHandler } from '../dist/index.js';

const policy = { version: '1', defaultEffect: 'deny', rules: [
  { tool: 'read', effect: 'allow', roles: ['operator'], reasonCode: 'READ_ALLOWED' },
  { tool: 'write', effect: 'approve', roles: ['operator'], resourceScope: 'order-1', reasonCode: 'HUMAN_REVIEW', approvalTtlSeconds: 120 },
  { tool: 'write', effect: 'deny', roles: ['operator'], resourceScope: 'order-2', reasonCode: 'BLOCKED' }
] };

test('role-scoped allow matches only permitted role', () => {
 const engine = createPolicyEngine(policy);
 assert.equal(engine.evaluate({tool:'read', actorRole:'operator'}).effect, 'allow');
 assert.equal(engine.evaluate({tool:'read', actorRole:'admin'}).effect, 'deny');
});
test('resource-scoped rules do not match when resource is absent', () => {
 const engine = createPolicyEngine(policy);
 assert.equal(engine.evaluate({tool:'write', actorRole:'operator'}).effect, 'deny');
 assert.equal(engine.evaluate({tool:'write', actorRole:'operator', resource:'order-1'}).effect, 'approve');
 assert.equal(engine.evaluate({tool:'write', actorRole:'operator', resource:'order-2'}).effect, 'deny');
});
test('deny takes precedence over approve and allow', () => {
 const engine = createPolicyEngine({version:'1', defaultEffect:'deny', rules:[
  {tool:'x', effect:'allow', reasonCode:'A'}, {tool:'x', effect:'approve', reasonCode:'B'}, {tool:'x', effect:'deny', reasonCode:'C'}
 ]});
 assert.equal(engine.evaluate({tool:'x',actorRole:'operator'}).effect, 'deny');
});
test('denied wrapper never invokes tool handler', async () => {
 const engine = createPolicyEngine({version:'1', defaultEffect:'deny', rules:[]}); let calls=0;
 const wrapped = wrapToolHandler(async () => { calls++; return 'bad'; }, engine);
 const result = await wrapped({tool:'x', actorRole:'operator'}, {});
 assert.equal(result.executed, false); assert.equal(calls, 0);
});

test('default policy effect cannot be configured to allow', () => {
 assert.throws(() => createPolicyEngine({version:'1', defaultEffect:'allow', rules:[]}));
});
