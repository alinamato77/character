import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { chatContent } from '../public/chat-content.js';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const base = 'http://127.0.0.1:4180';
const marker = `Flow ${crypto.randomUUID().slice(0, 8)}`;
const payload = {
  id: crypto.randomUUID(), edition: chatContent.edition, name: `Test ${marker}`,
  answers: [
    { questionId: 'mood', answer: `${marker}: I feel good today.` },
    { questionId: 'hangout', answer: 'yes' },
    { questionId: 'available-date', answer: `${marker}: Saturday afternoon.` },
  ],
};

// Exercise an unavailable database and a concurrent retry without changing a
// real database. The full HTTP checks below use only the local preview.
function loadTs(relative, dependencies) {
  const file = new URL(relative, import.meta.url);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    assert(name in dependencies, `Unexpected import: ${name}`);
    return dependencies[name];
  }, Response, Request, URL, Date, Set, Map, console });
  return module.exports;
}
const validation = loadTs('../lib/question-validation.ts', { '../public/chat-content.js': { chatContent } });
assert(validation.validateSubmission(payload));
assert.equal(validation.validateSubmission({ ...payload, name: '  ' }), null);
assert.equal(validation.validateSubmission({ ...payload, answers: [...payload.answers, { questionId: 'companion', answer: 'I feel so happy for you' }] }), null);
assert.equal(validation.validateSubmission({ ...payload, answers: [payload.answers[0], payload.answers[1]] }), null, 'Yes requires availability');
assert.equal(validation.validateSubmission({ ...payload, answers: [payload.answers[0], { questionId: 'hangout', answer: 'no' }, payload.answers[2]] }), null, 'No cannot include availability');
assert.equal(validation.validateSubmission({ ...payload, answers: [payload.answers[0], payload.answers[0]] }), null, 'Duplicate question IDs are rejected');
assert.equal(validation.validateSubmission({ ...payload, reply: 'Companion text is not an answer' }), null);
let fakeRows = [], batchCalls = 0, insertCount = 0, concurrentRetry = false;
const fakeDb = {
  prepare(sql) {
    return { bind(...values) { return {
      sql, values, all: async () => ({ results: fakeRows }), first: async () => ({ count: 0 }),
    }; } };
  },
  async batch(statements) {
    batchCalls++; insertCount = statements.length;
    if (concurrentRetry) fakeRows = statements.map(({ values: [id, session_id, , visitor_name, week, question_index, question, answer_type, answer] }) => ({ id, session_id, visitor_name, week, question_index, question, answer_type, answer }));
    throw new Error('Simulated failed transaction');
  },
};
const { POST } = loadTs('../app/api/chat/answers/route.ts', {
  '../../../../lib/answer-store': { answerDb: () => fakeDb, getSession: async () => ({ id: 'test-session', csrf: 'test-csrf', tag: 'test-tag' }), json: (body, status = 200) => Response.json(body, { status }) },
  '../../../../public/chat-content.js': { chatContent },
  '../../../../lib/question-validation': validation,
});
const fakeRequest = () => new Request(base + '/api/chat/answers', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json', 'X-Bimba-CSRF': 'test-csrf' }, body: JSON.stringify(payload) });
assert.equal((await POST(fakeRequest())).status, 503, 'Database failure is not acknowledged as sent');
assert.equal(batchCalls, 1); assert.equal(insertCount, 3, 'All answers use one transaction'); assert.equal(fakeRows.length, 0);
concurrentRetry = true;
assert.equal((await POST(fakeRequest())).status, 200, 'Identical concurrent retry succeeds safely');
fakeRows[0].answer = 'Different payload';
assert.equal((await POST(fakeRequest())).status, 409, 'Conflicting prior content is never acknowledged');

const root = await fetch(base);
assert.equal(root.status, 200); assert((await root.text()).includes('Creator inbox'));
const anon = await fetch(base + '/inbox');
assert.equal(anon.status, 200); assert((await anon.text()).includes('Access code')); assert.match(anon.headers.get('cache-control'), /no-store/);
const session = await fetch(base + '/api/chat/session');
assert.equal(session.status, 200);
const { csrf } = await session.json();
const cookie = session.headers.get('set-cookie').split(';')[0];
const headers = { 'Content-Type': 'application/json', Origin: base, Cookie: cookie, 'X-Bimba-CSRF': csrf };
const post = (body, h = headers) => fetch(base + '/api/chat/answers', { method: 'POST', headers: h, body: JSON.stringify(body) });
assert.equal((await post(payload, { ...headers, Origin: 'https://other.example' })).status, 403);
assert.equal((await post(payload, { ...headers, 'X-Bimba-CSRF': 'wrong' })).status, 403);
assert.equal((await post(payload, { ...headers, Cookie: '__Host-bimba-visitor=' + crypto.randomUUID() })).status, 403);
assert.equal((await post(payload, { ...headers, 'Content-Type': 'text/plain' })).status, 403);
assert.equal((await post({ ...payload, edition: 'old-flow' })).status, 409);
assert.equal((await fetch(base + '/api/chat/answers', { method: 'POST', headers, body: '{' })).status, 400);
assert.equal((await post({ ...payload, name: 'x'.repeat(3000) })).status, 413);
const rejectedMarker = `${marker}: invalid answer must not be saved`;
const invalid = { ...payload, answers: [{ questionId: 'mood', answer: rejectedMarker }, ...payload.answers.slice(1)] };
assert.equal((await post({ ...invalid, name: 'x'.repeat(41) })).status, 400);
assert.equal((await post({ ...invalid, name: '' })).status, 400);
assert.equal((await post({ ...invalid, answers: [...invalid.answers, { questionId: 'companion-only', answer: 'I feel so happy for you' }] })).status, 400);
assert.equal((await post({ ...invalid, answers: invalid.answers.slice(0, 2) })).status, 400);
assert.equal((await post({ ...invalid, answers: [{ ...invalid.answers[0], answer: ' ' }, ...invalid.answers.slice(1)] })).status, 400);
assert.equal((await post({ ...invalid, answers: [invalid.answers[0], { questionId: 'hangout', answer: 'maybe' }] })).status, 400);
assert.equal((await post(payload)).status, 201);
assert.equal((await post(payload)).status, 200, 'Retry is idempotent');
assert.equal((await post({ ...payload, name: 'Different visitor' })).status, 409, 'Retry cannot replace a name');
const noPayload = {
  id: crypto.randomUUID(), edition: chatContent.edition, name: `  No plan ${marker}  `,
  answers: [{ questionId: 'mood', answer: `${marker}: I feel tired today.` }, { questionId: 'hangout', answer: 'no' }],
};
assert.equal((await post({ ...noPayload, answers: [...noPayload.answers, payload.answers[2]] })).status, 400);
assert.equal((await post(noPayload)).status, 201);
assert.equal((await post(noPayload)).status, 200);

const form = (code, origin = base) => fetch(base + '/api/inbox/unlock', { method: 'POST', redirect: 'manual', headers: { Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code }) });
assert.equal((await form('9876', 'https://other.example')).status, 403);
const wrong = await form('0000');
assert.match(wrong.headers.get('location'), /error=invalid/); assert.equal(wrong.headers.get('set-cookie'), null);
const unlocked = await form('9876');
assert.equal(unlocked.status, 303);
const accessCookie = unlocked.headers.get('set-cookie');
assert.match(accessCookie, /HttpOnly; Secure; SameSite=Strict/);
const owner = await fetch(base + '/inbox', { headers: { Cookie: accessCookie.split(';')[0] } });
const html = await owner.text();
// The same strings also appear in React's serialized payload. Count only the
// rendered answer list, so that hydration data does not look like duplicates.
const answerList = html.match(/<ol\b[^>]*class="answer-list"[^>]*>([\s\S]*?)<\/ol>/)?.[1];
assert(answerList, 'Inbox renders an answer list');
const renderedAnswers = [...answerList.matchAll(/<p\b[^>]*class="answer-text"[^>]*>([\s\S]*?)<\/p>/g)].map(match => match[1]);
const renderedNames = [...answerList.matchAll(/<div\b[^>]*class="answer-meta"[^>]*>\s*<span>([\s\S]*?)<\/span>/g)].map(match => match[1]);
for (const answer of [payload.answers[0].answer, payload.answers[2].answer, noPayload.answers[0].answer]) {
  assert.equal(renderedAnswers.filter(value => value === answer).length, 1, `Exactly one saved answer: ${answer}`);
}
assert.equal(renderedNames.filter(value => value === payload.name).length, 3, 'Yes branch saves all three named answers');
assert.equal(renderedNames.filter(value => value === noPayload.name.trim()).length, 2, 'No branch saves only two named answers');
assert(!html.includes(rejectedMarker), 'Rejected collection never writes any answer');
assert(html.includes('Lock inbox')); assert.match(owner.headers.get('cache-control'), /no-store/);
const forged = await fetch(base + '/inbox', { headers: { Cookie: '__Host-bimba-inbox=' + 'a'.repeat(64) } });
assert(!(await forged.text()).includes(marker));
const locked = await fetch(base + '/api/inbox/lock', { method: 'POST', redirect: 'manual', headers: { Origin: base, Cookie: accessCookie.split(';')[0] } });
assert.equal(locked.status, 303);
const replay = await fetch(base + '/inbox', { headers: { Cookie: accessCookie.split(';')[0] } });
assert(!(await replay.text()).includes(marker));
for (let i = 0; i < 4; i++) await form('0000');
const limited = await form('9876'); assert.match(limited.headers.get('location'), /error=locked/);
console.log('Passed: atomic yes/no collections, question-only validation, named inbox readback, safe retries and failures, no partial writes, CSRF/session checks, inbox access and locking.');
