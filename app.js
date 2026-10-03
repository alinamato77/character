'use strict';

const $ = id => document.getElementById(id);
const room = $('room');
const pet = $('pet');
const character = $('character');
const canvas = $('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const clips = Object.fromEntries(['default', 'jump', 'walk', 'pet', 'sit', 'rest', 'stand', 'feed', 'eat', 'hello', 'think', 'hold-left', 'hold-right'].map(name => [name, $(`video-${name}`)]));
const W = 280, H = 350;
const seen = new Uint8Array(W * H);
const queue = new Int32Array(W * H);
const previousFrame = document.createElement('canvas');
previousFrame.width = W;
previousFrame.height = H;
const previousCtx = previousFrame.getContext('2d');
const currentFrame = document.createElement('canvas');
currentFrame.width = W;
currentFrame.height = H;
const currentCtx = currentFrame.getContext('2d');
const protectedClips = new Set([clips.pet, clips['hold-left'], clips['hold-right']]);

let state = 'default';
let active = clips.default;
let pendingAction = null;
let queuedAction = null;
let defaultIndex = 0;
let direction = 1;
let lastFrame = 0;
let drag = null;
let bubbleTimer, defaultTimer, sitTimer, patTimer, patMotionTimer;
let holdDirection = 1;
let holdTarget = null;
let transitionStart = null;
let transitionPending = false;

function updateControls() {
  $('hold-label').textContent = state === 'holding' ? 'Let go' : 'Hold';
  $('hold').setAttribute('aria-pressed', String(state === 'holding'));
  $('feed').disabled = state === 'feeding' || state === 'eating';
  $('feed-label').textContent = state === 'feeding' ? 'Feeding…' : state === 'eating' ? 'Eating…' : 'Feed';
  $('hello').disabled = state === 'hello';
  $('state').textContent = state;
}

function say(text, duration = 6000) {
  clearTimeout(bubbleTimer);
  $('bubble').textContent = text;
  bubbleTimer = setTimeout(() => { $('bubble').textContent = 'I’m here. Take your time.'; }, duration);
}

function play(video) {
  video.play().catch(() => say('Tap me to wake up the animation.', 5000));
}

function switchClip(name, nextState = name, restart = true) {
  const next = clips[name];
  // Briefly blend matching seated poses; keep Pet and Hold playback untouched.
  transitionPending = active !== next && active.readyState >= 2 && !protectedClips.has(active) && !protectedClips.has(next);
  transitionStart = null;
  if (transitionPending) {
    previousCtx.clearRect(0, 0, W, H);
    previousCtx.drawImage(canvas, 0, 0);
  }
  Object.values(clips).forEach(video => video.pause());
  active = next;
  state = nextState;
  if (restart) active.currentTime = 0;
  updateControls();
  play(active);
}

function clearActionTimers() {
  clearTimeout(defaultTimer);
  clearTimeout(sitTimer);
  clearTimeout(patTimer);
  clearTimeout(patMotionTimer);
  pet.classList.remove('patted');
}

function resumeDefault() {
  clearActionTimers();
  pendingAction = null;
  queuedAction = null;
  holdTarget = null;
  document.body.classList.remove('holding-hand');
  canvas.style.transform = '';
  defaultIndex = 0;
  switchClip('default');
  defaultTimer = setTimeout(nextDefault, 10000);
  sitTimer = setTimeout(() => requestSeatedAction('rest'), 20000);
}

function nextDefault() {
  if (!['default', 'jump', 'walk'].includes(state)) return;
  const sequence = [['default', 10000], ['walk', 6400], ['jump', 4300]];
  defaultIndex = (defaultIndex + 1) % sequence.length;
  const [name, duration] = sequence[defaultIndex];
  canvas.style.transform = name === 'walk' && direction < 0 ? 'scaleX(-1)' : '';
  switchClip(name);
  defaultTimer = setTimeout(nextDefault, duration);
}

function startStanding() {
  pendingAction = null;
  canvas.style.transform = '';
  switchClip('stand', 'standing');
}

function runSeatedAction(action) {
  pendingAction = null;
  if (action === 'feed') {
    switchClip('feed', 'feeding');
    say('A little toast for me? Thank you!', 10000);
  } else if (action === 'hello') {
    switchClip('hello');
    say('Hi! It’s lovely to see you.');
  } else if (action === 'think') {
    switchClip('think', 'thinking');
  } else {
    switchClip('rest');
  }
}

function requestSeatedAction(action) {
  if (state === 'standing') { queuedAction = action; return; }
  if (['feeding', 'eating', 'hello', 'thinking'].includes(state)) {
    if (!(['feeding', 'eating'].includes(state) && action === 'feed')) queuedAction = action;
    return;
  }
  if (state === 'sitting') { pendingAction = action; return; }
  clearActionTimers();
  holdTarget = null;
  document.body.classList.remove('holding-hand');
  canvas.style.transform = '';
  if (state === 'rest') { runSeatedAction(action); return; }
  pendingAction = action;
  switchClip('sit', 'sitting');
  if (action === 'rest') say('Let’s sit and rest a little.', 10000);
  if (action === 'feed') say('Let me sit down for a little toast.', 10000);
}

function finishSeatedAction() {
  if (queuedAction) {
    const action = queuedAction;
    queuedAction = null;
    runSeatedAction(action);
  } else {
    startStanding();
  }
}

clips.sit.addEventListener('ended', () => {
  if (state === 'sitting') runSeatedAction(pendingAction || 'rest');
});
clips.rest.addEventListener('ended', () => { if (state === 'rest') startStanding(); });
clips.feed.addEventListener('ended', () => { if (state === 'feeding') switchClip('eat', 'eating'); });
clips.eat.addEventListener('ended', () => {
  if (state !== 'eating') return;
  say('All full. Thank you!');
  finishSeatedAction();
});
clips.hello.addEventListener('ended', () => { if (state === 'hello') finishSeatedAction(); });
clips.think.addEventListener('ended', () => { if (state === 'thinking') finishSeatedAction(); });
clips.stand.addEventListener('ended', () => {
  if (state !== 'standing') return;
  const action = queuedAction;
  resumeDefault();
  if (action) requestSeatedAction(action);
});

function pat() {
  if (!['default', 'jump', 'walk', 'petting'].includes(state)) return;
  clearActionTimers();
  canvas.style.transform = '';
  switchClip('pet', 'petting');
  say('Hehe, one more pat?');
  pet.classList.remove('patted');
  void pet.offsetWidth;
  pet.classList.add('patted');
  patMotionTimer = setTimeout(() => pet.classList.remove('patted'), 550);
  const heart = document.createElement('span');
  heart.className = 'heart';
  heart.textContent = '♥';
  $('particles').append(heart);
  setTimeout(() => heart.remove(), 1100);
  patTimer = setTimeout(() => { if (state === 'petting') resumeDefault(); }, 2600);
}

function releaseHand() {
  if (state !== 'holding') return;
  resumeDefault();
  say('Letting go. I’ll be right here.');
}

function holdHand(side) {
  if (state === 'holding') { releaseHand(); return; }
  if (!['default', 'jump', 'walk', 'petting'].includes(state)) return;
  clearActionTimers();
  holdDirection = side;
  holdTarget = { x: pet.offsetLeft, y: pet.offsetTop };
  document.body.classList.add('holding-hand');
  canvas.style.transform = '';
  switchClip(side < 0 ? 'hold-left' : 'hold-right', 'holding');
  say('Hold my hand and move your cursor to lead me.', 10000);
}

for (const name of ['hold-left', 'hold-right']) {
  clips[name].addEventListener('ended', () => {
    if (state === 'holding' && active === clips[name]) { active.currentTime = 1; play(active); }
  });
}

function position(x, y) {
  pet.style.left = Math.max(0, Math.min(x, room.clientWidth - pet.offsetWidth)) + 'px';
  pet.style.top = Math.max(65, Math.min(y, room.clientHeight - pet.offsetHeight - 140)) + 'px';
}

function moveCharacter(timestamp) {
  const dt = lastFrame ? Math.min((timestamp - lastFrame) / 1000, .05) : 0;
  lastFrame = timestamp;
  if (document.hidden) return;
  if (state === 'holding') {
    // Original one-second hand-raise lead-in and movement behavior.
    if (active.currentTime < 1 || !holdTarget) return;
    const maxX = Math.max(0, room.clientWidth - pet.offsetWidth);
    const maxY = Math.max(65, room.clientHeight - pet.offsetHeight - 140);
    if ((holdTarget.x <= 0 && pet.offsetLeft <= 6) || (holdTarget.x >= maxX && pet.offsetLeft >= maxX - 6) ||
        (holdTarget.y <= 65 && pet.offsetTop <= 71) || (holdTarget.y >= maxY && pet.offsetTop >= maxY - 6)) {
      releaseHand(); return;
    }
    const dx = holdTarget.x - pet.offsetLeft, dy = holdTarget.y - pet.offsetTop;
    const distance = Math.hypot(dx, dy);
    if (distance <= 5) { active.pause(); return; }
    const nextDirection = dx < -5 ? -1 : dx > 5 ? 1 : holdDirection;
    if (nextDirection !== holdDirection) {
      holdDirection = nextDirection;
      switchClip(holdDirection < 0 ? 'hold-left' : 'hold-right', 'holding', false);
      active.currentTime = 1;
    }
    play(active);
    const step = Math.min(distance, 95 * dt);
    position(pet.offsetLeft + dx / distance * step, pet.offsetTop + dy / distance * step);
  } else if (state === 'walk' && !drag) {
    const limit = room.clientWidth - pet.offsetWidth;
    let x = pet.offsetLeft + direction * 38 * dt;
    if (x >= limit) { x = limit; direction = -1; }
    if (x <= 0) { x = 0; direction = 1; }
    position(x, pet.offsetTop);
    canvas.style.transform = direction < 0 ? 'scaleX(-1)' : '';
  }
}

function removeBackground(frame) {
  const data = frame.data;
  seen.fill(0);
  let head = 0, tail = 0;
  function add(pixel) {
    if (seen[pixel]) return;
    seen[pixel] = 1;
    const i = pixel * 4, r = data[i], g = data[i + 1], b = data[i + 2];
    if (Math.min(r, g, b) > 175 && Math.max(r, g, b) - Math.min(r, g, b) < 24) {
      queue[tail++] = pixel;
      data[i + 3] = 0;
    }
  }
  for (let x = 0; x < W; x++) { add(x); add((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { add(y * W); add(y * W + W - 1); }
  while (head < tail) {
    const pixel = queue[head++], x = pixel % W;
    if (x > 0) add(pixel - 1);
    if (x < W - 1) add(pixel + 1);
    if (pixel >= W) add(pixel - W);
    if (pixel < W * (H - 1)) add(pixel + W);
  }
  return frame;
}

function render(timestamp = 0) {
  moveCharacter(timestamp);
  if (active.readyState >= 2 && !active.seeking) {
    try {
      currentCtx.drawImage(active, 0, 0, W, H);
      currentCtx.putImageData(removeBackground(currentCtx.getImageData(0, 0, W, H)), 0, 0);
      if (transitionPending && transitionStart === null) transitionStart = timestamp;
      const progress = transitionPending ? Math.min(1, (timestamp - transitionStart) / 140) : 1;
      ctx.clearRect(0, 0, W, H);
      if (progress < 1) { ctx.globalAlpha = 1 - progress; ctx.drawImage(previousFrame, 0, 0); }
      ctx.globalAlpha = progress;
      ctx.drawImage(currentFrame, 0, 0);
      ctx.globalAlpha = 1;
      if (progress === 1) transitionPending = false;
      $('loading').hidden = true;
    } catch {
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(active, 0, 0, W, H);
      $('loading').hidden = true;
    }
  }
  requestAnimationFrame(render);
}

$('hold').addEventListener('click', () => holdHand(1));
$('hand-left').addEventListener('click', () => holdHand(-1));
$('hand-right').addEventListener('click', () => holdHand(1));
$('pat').addEventListener('click', pat);
$('feed').addEventListener('click', () => requestSeatedAction('feed'));
$('hello').addEventListener('click', () => requestSeatedAction('hello'));
const chatLines = ['What made you smile today?', 'Take a break if you’re tired. I’m here.', 'Do your thing. I’ll keep you company.', 'Toast crusts are tasty too.'];
let lineIndex = 0;
$('talk').addEventListener('click', () => {
  if (['default', 'jump', 'walk', 'rest'].includes(state) && Math.random() < .45) requestSeatedAction('think');
  say(chatLines[lineIndex++ % chatLines.length], 10000);
});

document.addEventListener('pointermove', e => {
  if (state !== 'holding') return;
  if (e.clientX <= 1 || e.clientY <= 1 || e.clientX >= window.innerWidth - 1 || e.clientY >= window.innerHeight - 1) { releaseHand(); return; }
  const bounds = room.getBoundingClientRect();
  holdTarget = {
    x: Math.max(0, Math.min(e.clientX - bounds.left - pet.offsetWidth / 2, room.clientWidth - pet.offsetWidth)),
    y: Math.max(65, Math.min(e.clientY - bounds.top - pet.offsetHeight * .55, room.clientHeight - pet.offsetHeight - 140))
  };
});
document.addEventListener('pointerout', e => { if (state === 'holding' && !e.relatedTarget) releaseHand(); });
room.addEventListener('click', e => { if (state === 'holding' && !e.target.closest('#character,.hand-zone,.controls')) releaseHand(); });

function characterAction(e) {
  const rect = character.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width, y = (e.clientY - rect.top) / rect.height;
  if (x >= .3 && x <= .7 && y >= .3 && y <= .64) return 'feed';
  if (x >= .2 && x <= .8 && y >= .07 && y < .3) return 'pet';
  return null;
}
character.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  if (state === 'holding') { releaseHand(); return; }
  if (!active.ended) play(active);
  character.setPointerCapture(e.pointerId);
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, left: pet.offsetLeft, top: pet.offsetTop, moved: false, action: characterAction(e) };
});
character.addEventListener('pointerleave', () => character.classList.remove('cursor-heart', 'cursor-toast'));
character.addEventListener('pointermove', e => {
  const action = characterAction(e);
  character.classList.toggle('cursor-heart', state !== 'holding' && action === 'pet');
  character.classList.toggle('cursor-toast', state !== 'holding' && action === 'feed');
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.hypot(dx, dy) > 6 && !drag.moved) { drag.moved = true; pet.classList.add('lift'); say('Whoa, we’re flying!'); }
  if (drag.moved) position(drag.left + dx, drag.top + dy);
});
function release(e, cancelled = false) {
  if (!drag || drag.id !== e.pointerId) return;
  const { moved, action } = drag;
  drag = null;
  pet.classList.remove('lift');
  if (moved) {
    pet.classList.add('dropped');
    setTimeout(() => pet.classList.remove('dropped'), 450);
    say('This spot is nice. I’ll stay here.');
  } else if (!cancelled) {
    if (action === 'feed') requestSeatedAction('feed');
    else if (action === 'pet') pat();
  }
}
character.addEventListener('pointerup', e => release(e));
character.addEventListener('pointercancel', e => release(e, true));
character.addEventListener('lostpointercapture', e => release(e, true));
character.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pat(); }
  const directions = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] };
  if (directions[e.key]) { e.preventDefault(); const [x, y] = directions[e.key]; position(pet.offsetLeft + x, pet.offsetTop + y); }
});
window.addEventListener('resize', () => position(pet.offsetLeft, pet.offsetTop));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { Object.values(clips).forEach(video => video.pause()); lastFrame = 0; }
  else if (!active.ended) play(active);
});
for (const video of Object.values(clips)) {
  video.addEventListener('error', () => {
    if (active !== video) return;
    if (video !== clips.default) resumeDefault();
    say('Couldn’t load the animation. Please refresh and try again.', 10000);
  });
}
resumeDefault();
render();
