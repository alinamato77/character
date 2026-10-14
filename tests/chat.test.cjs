const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const read = file => fs.readFileSync(path.join(__dirname, '../public', file), 'utf8');

function createChat() {
  const elements = new Map(), events = {}, timers = new Map(), requests = [], posted = [];
  let now = 0, timerId = 0, failSave = false, failSession = false;
  const element = id => {
    if (!elements.has(id)) {
      const classes = new Set();
      elements.set(id, {
        hidden: true, value: '', textContent: '', disabled: false, readOnly: false,
        events: {}, attrs: {}, focused: false, validity: '',
        classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
        setAttribute(name, value) { this.attrs[name] = value; },
        focus() { this.focused = true; },
        setCustomValidity(value) { this.validity = value; },
        reportValidity() { this.reported = true; },
        addEventListener(type, callback) { this.events[type] = callback; },
      });
    }
    return elements.get(id);
  };
  const document = { hidden: false, getElementById: element, addEventListener(type, fn) { events[type] = fn; } };
  const context = vm.createContext({
    Date, crypto: webcrypto, document,
    setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    fetch: async (url, options) => {
      requests.push(url);
      if (url.endsWith('/session')) return { ok: !failSession, json: async () => failSession ? {} : { csrf: 'test-csrf' } };
      posted.push(JSON.parse(options.body));
      assert.equal(options.headers['X-Bimba-CSRF'], 'test-csrf');
      return { ok: !failSave, json: async () => failSave ? { error: 'Not saved.' } : { saved: true } };
    },
  });
  vm.runInContext(read('chat-content.js').replace('export const', 'const'), context);
  vm.runInContext(read('chat-mood.js').replace(/^import .*;\n/gm, '').replace('export function', 'function'), context);
  vm.runInContext(read('chat.js').replace(/^import .*;\n/gm, ''), context);
  function advance(ms) {
    const until = now + ms;
    while (true) {
      const next = [...timers.entries()].filter(([, timer]) => timer.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      now = next[1].at; timers.delete(next[0]); next[1].fn();
    }
    now = until;
  }
  return {
    element, document, events, requests, posted, advance,
    content: vm.runInContext('chatContent', context),
    mood: text => context.moodReply(text),
    click: id => element(id).events.click(),
    submit(value) { element('chat-answer').value = value; return element('chat-form').events.submit({ preventDefault() {} }); },
    setHidden(hidden) { document.hidden = hidden; events.visibilitychange(); },
    failSave(value) { failSave = value; },
    failSession(value) { failSession = value; },
  };
}
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const title = chat => chat.element('chat-question').textContent;

(async () => {
  const yes = createChat(), c = yes.content;
  assert.deepEqual(Array.from(c.questions, q => q.id), ['mood', 'hangout', 'available-date']);
  for (const text of ['I am happy today', 'That was a GOOD day!', "I'm not sad", "I don't feel sad", '今天很开心']) {
    assert.equal(yes.mood(text), c.replies.happy, text);
  }
  for (const text of ['I am unhappy', 'not happy', "I don't feel good", "it wasn't really good", 'good but exhausted', '今天不开心', 'I feel ordinary']) {
    assert.equal(yes.mood(text), c.replies.supportive, text);
  }
  yes.click('talk');
  assert.equal(yes.element('chat-announcement-text').textContent, c.announcement);
  assert.equal(yes.element('chat-form').hidden, true);
  assert.equal(yes.requests.length, 0);
  yes.click('chat-next');
  assert.equal(title(yes), c.questions[0].text);
  assert.equal(yes.element('chat-announcement').hidden, true);
  yes.submit('   ');
  assert.equal(yes.requests.length, 0); assert(yes.element('chat-answer').validity);
  yes.element('chat-answer').value = 'I feel happy today';
  yes.click('chat-close');
  assert.equal(yes.element('chat-panel').hidden, true);
  yes.click('talk');
  assert.equal(yes.element('chat-answer').value, 'I feel happy today', 'Closing keeps an unfinished mood');
  yes.submit(yes.element('chat-answer').value);
  assert.equal(title(yes), c.replies.happy);
  assert.equal(yes.element('chat-form').hidden, true);
  yes.setHidden(true); yes.advance(10000);
  assert.equal(title(yes), c.replies.happy, 'Hidden tabs do not skip the reply');
  yes.setHidden(false); yes.advance(2599);
  assert.equal(title(yes), c.replies.happy);
  yes.advance(1);
  assert.equal(title(yes), c.questions[1].text);
  assert.equal(yes.element('chat-choices').hidden, false);
  yes.click('chat-yes');
  assert.equal(title(yes), c.questions[2].text);
  yes.element('chat-answer').value = 'Saturday afternoon';
  yes.events.keydown({ key: 'Escape', preventDefault() {} });
  yes.click('talk');
  assert.equal(yes.element('chat-answer').value, 'Saturday afternoon', 'Closing keeps availability');
  yes.submit('Saturday afternoon');
  assert.equal(title(yes), c.replies.schedule);
  yes.advance(2600);
  assert.equal(title(yes), c.nameQuestion);
  assert.equal(yes.element('chat-answer').maxLength, 40);
  yes.submit('a'.repeat(41));
  assert.equal(yes.requests.length, 0, 'Nothing is sent before a valid final name');

  yes.failSave(true);
  const failed = yes.submit('  Alina  ');
  assert.equal(title(yes), c.replies.sending);
  assert.equal(yes.element('chat-mail').hidden, false);
  assert.equal(yes.element('chat-close').disabled, true);
  yes.click('chat-close');
  assert.equal(yes.element('chat-panel').hidden, false, 'Sending cannot be dismissed');
  await failed;
  assert.equal(title(yes), c.nameQuestion);
  assert.equal(yes.element('chat-send-status').textContent, c.replies.error);
  assert.equal(yes.element('chat-mail').hidden, true, 'Failure never displays a sent envelope');
  assert.equal(yes.element('chat-answer').readOnly, true, 'A retry keeps the original final name');
  assert.equal(yes.posted.length, 1);
  const original = yes.posted[0];
  assert.equal(original.name, 'Alina');
  assert.deepEqual(original.answers, [
    { questionId: 'mood', answer: 'I feel happy today' },
    { questionId: 'hangout', answer: 'yes' },
    { questionId: 'available-date', answer: 'Saturday afternoon' },
  ]);
  yes.click('chat-close'); yes.click('talk');
  assert.equal(title(yes), c.nameQuestion);
  assert.equal(yes.element('chat-answer').value, 'Alina');
  assert.equal(yes.element('chat-answer').readOnly, true);
  yes.failSave(false);
  const retry = yes.submit(yes.element('chat-answer').value);
  await flush();
  assert.deepEqual(yes.posted[1], original, 'Retry sends exactly the same ID and payload');
  yes.advance(999); await flush();
  assert.equal(title(yes), c.replies.sending, 'The envelope animation has time to play');
  yes.advance(1); await retry;
  assert.equal(title(yes), c.replies.sent);
  assert.equal(yes.element('chat-mail').attrs['data-state'], 'sent');
  yes.click('chat-next');
  assert.equal(yes.element('chat-panel').hidden, true);
  yes.click('talk');
  assert.equal(yes.element('chat-announcement').hidden, false, 'A completed chat opens fresh');
  yes.click('chat-next');
  assert.equal(yes.element('chat-answer').value, '');

  const no = createChat();
  no.click('talk'); no.click('chat-next'); no.submit('I feel tired');
  assert.equal(title(no), c.replies.supportive);
  no.click('chat-close'); no.advance(5000);
  no.click('talk');
  assert.equal(title(no), c.replies.supportive, 'Closing pauses the companion response');
  no.advance(2600); no.click('chat-no');
  assert.equal(title(no), c.replies.declined);
  no.advance(2600);
  assert.equal(title(no), c.nameQuestion, 'No skips availability without a Skip button');
  assert.equal(no.requests.length, 0);
  no.failSession(true);
  await no.submit('Visitor');
  assert.equal(no.posted.length, 0, 'Session failure never sends unprotected answers');
  assert.equal(title(no), c.nameQuestion);
  no.failSession(false);
  const sent = no.submit('Visitor');
  await flush(); no.advance(1000); await sent;
  assert.equal(title(no), c.replies.sent);
  assert.deepEqual(no.posted[0].answers, [
    { questionId: 'mood', answer: 'I feel tired' },
    { questionId: 'hangout', answer: 'no' },
  ]);
  assert(!read('companion.html').includes('chat-skip'), 'Skip is removed from the interface');
  console.log('Passed: yes/no flow, keyword negations, timed replies and visibility pause, draft persistence, final-only collection, safe retry, failures, and sent animation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
