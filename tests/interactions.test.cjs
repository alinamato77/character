const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../dist/app.js'), 'utf8');
function setup(random = .1) {
  const elements = new Map(), timers = new Map(), documentEvents = {};
  let now = 0, timerId = 0;
  function element(id) {
    if (elements.has(id)) return elements.get(id);
    const el = { id, style: {}, attributes: {}, events: {}, readyState: 0, currentTime: 0, paused: true,
      classList: { items: new Set(), add(...names) { names.forEach(n => this.items.add(n)); }, remove(...names) { names.forEach(n => this.items.delete(n)); }, toggle(n, on) { on ? this.items.add(n) : this.items.delete(n); } },
      offsetWidth: 224, offsetHeight: 280, clientWidth: 1000, clientHeight: 610,
      get offsetLeft() { return parseFloat(this.style.left) || 300; }, get offsetTop() { return parseFloat(this.style.top) || 150; },
      getBoundingClientRect() { return { left: 300, top: 150, width: 224, height: 280 }; },
      addEventListener(name, fn) { (this.events[name] ||= []).push(fn); },
      setAttribute(name, value) { this.attributes[name] = value; },
      play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; },
      append() {}, remove() {}, setPointerCapture() {},
      getContext() { return { clearRect() {}, drawImage() {}, putImageData() {}, getImageData() { return { data: new Uint8Array(280 * 350 * 4) }; } }; }
    };
    elements.set(id, el); return el;
  }
  const math = Object.create(Math); math.random = () => random;
  const context = { document: { hidden: false, body: element('body'), getElementById: element, createElement: tag => element(`${tag}-${elements.size}`), addEventListener(name, fn) { (documentEvents[name] ||= []).push(fn); } },
    window: { innerWidth: 1000, innerHeight: 800, addEventListener() {} }, requestAnimationFrame() {}, Math: math,
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { at: now + ms, fn }); return id; }, clearTimeout(id) { timers.delete(id); }, Uint8Array, Int32Array };
  vm.createContext(context); vm.runInContext(fs.readFileSync(path.join(__dirname, '../dist/assets/animations/hold-anchors.js'), 'utf8'), context); vm.runInContext(source, context);
  const run = text => vm.runInContext(text, context);
  const fire = (id, event = 'click', data = {}) => (element(id).events[event] || []).forEach(fn => fn(data));
  const end = name => fire(`video-${name}`, 'ended');
  function tick(ms) { const target = now + ms; for (;;) { const next = [...timers].filter(([, t]) => t.at <= target).sort((a,b) => a[1].at - b[1].at)[0]; if (!next) break; now = next[1].at; timers.delete(next[0]); next[1].fn(); } now = target; }
  return { run, fire, end, tick, element, state: () => run('state') };
}
{
  const a = setup(); a.tick(20000); assert.equal(a.state(), 'sitting'); a.end('sit'); assert.equal(a.state(), 'rest'); a.end('rest'); assert.equal(a.state(), 'standing'); a.end('stand'); assert.equal(a.state(), 'default');
}
{
  const a = setup(); a.fire('feed'); assert.equal(a.state(), 'sitting'); a.end('sit'); assert.equal(a.state(), 'feeding'); a.end('feed'); assert.equal(a.state(), 'eating'); a.end('eat'); assert.equal(a.state(), 'standing'); a.end('stand'); assert.equal(a.state(), 'default');
}
{
  const a = setup(); a.tick(20000); a.end('sit'); a.fire('feed'); assert.equal(a.state(), 'feeding');
}
{
  const a = setup(); a.fire('hello'); a.end('sit'); assert.equal(a.state(), 'hello'); a.fire('feed'); a.end('hello'); assert.equal(a.state(), 'feeding');
}
{
  const a = setup(); a.fire('hello'); a.end('sit'); a.end('hello'); a.fire('feed'); assert.equal(a.state(), 'standing'); a.end('stand'); assert.equal(a.state(), 'sitting'); a.end('sit'); assert.equal(a.state(), 'feeding');
}
{
  const a = setup(.1); a.fire('talk'); a.end('sit'); assert.equal(a.state(), 'thinking'); a.end('think'); assert.equal(a.state(), 'standing');
  const b = setup(.9); b.fire('talk'); assert.equal(b.state(), 'default'); b.fire('feed'); b.fire('talk'); b.end('sit'); assert.equal(b.state(), 'feeding');
}
{
  const a = setup(); a.fire('pat'); assert.equal(a.state(), 'petting'); assert.equal(a.run('active.id'), 'video-pet'); a.tick(2599); assert.equal(a.state(), 'petting'); a.tick(1); assert.equal(a.state(), 'default');
  a.fire('pat'); a.fire('feed'); a.tick(2600); assert.equal(a.state(), 'sitting');
}
{
  const a = setup(); a.fire('hold'); assert.equal(a.state(), 'holding'); a.run('holdTarget = {x: 500, y: 150}; lastFrame = 100; active.currentTime = .5; moveCharacter(150)'); assert.equal(a.element('pet').offsetLeft, 300);
  a.run('active.currentTime = 1.1; moveCharacter(200)'); assert(a.element('pet').offsetLeft > 300);
  a.end('hold-right'); assert.equal(a.element('video-hold-right').currentTime, 1); a.fire('hold'); assert.equal(a.state(), 'default');
}
{
  const a = setup(); const e = { button: 0, pointerId: 1, clientX: 412, clientY: 310 }; a.fire('character', 'pointerdown', e); a.fire('character', 'pointerup', e); assert.equal(a.state(), 'sitting'); a.end('sit'); assert.equal(a.state(), 'feeding');
  const b = setup(); b.fire('character','pointerdown',e); b.fire('character','pointermove',{...e,clientX:450}); b.fire('character','pointerup',{...e,clientX:450}); assert.equal(b.state(),'default');
}
console.log('Passed: default/rest cycle; sit/feed/eat/stand; Hello and queued actions; random Chat thinking; unchanged Pet timing and Hold lead-in/loop; face feeding and dragging.');

for (const side of [-1, 1]) {
  const a = setup(); a.run(`holdHand(${side}); active.currentTime = 1.5; updateHoldIndicator()`);
  const marker = a.element('hold-indicator');
  assert.equal(marker.hidden, false);
  const before = [marker.style.left, marker.style.top];
  a.run('holdTarget = {x: 10000, y: 10000}; updateHoldIndicator()');
  assert.deepEqual([marker.style.left, marker.style.top], before);
  assert(parseFloat(marker.style.left) > 0 && parseFloat(marker.style.left) < 100);
  a.fire('hold'); assert.equal(marker.hidden, true);
}
console.log('Passed: both Hold indicators track the hand, remain independent of pointer distance, and disappear on release.');
