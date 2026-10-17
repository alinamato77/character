import { scenarios, readWords, feelingChoices, confirmedFeeling, makeDraft } from './feelings-model.js';
import { startCompanion } from './feelings-companion.js';

const get = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const state = { step: 0, original: '', choice: '', custom: '', draft: '', initialDraft: '', final: '' };
const stepNames = ['Your words', 'Check', 'Make yours', 'Keep'];
const qWords = [
  'You know your feelings.\nI’m just here to help with the words.',
  'I can offer a possibility.\nYou can tell me I missed it.',
  'A draft is an invitation.\nChange anything that isn’t you.',
  'These are your words now.\nThank you for helping me understand.',
];

function button(action, label, { primary = false, disabled = false } = {}) {
  return `<button type="button" class="${primary ? 'primary-button' : 'secondary-button'}" data-action="${action}" ${disabled ? 'disabled' : ''}>${label}${primary ? '<span aria-hidden="true">→</span>' : ''}</button>`;
}

function render({ focus = true } = {}) {
  get('steps').innerHTML = stepNames.map((name, index) => `<li ${index === state.step ? 'aria-current="step"' : ''} class="${index < state.step ? 'complete' : ''}">${name}</li>`).join('');
  get('step-count').textContent = `0${state.step + 1} / 04`;
  get('q-words').textContent = qWords[state.step];
  get('q-words').style.whiteSpace = 'pre-line';
  const views = [writeView, checkView, draftView, finalView];
  get('coach-view').innerHTML = views[state.step]();
  if (focus) {
    get('workspace').scrollIntoView({ block: 'start', behavior: 'instant' });
    get('view-title').focus({ preventScroll: true });
  }
}

function writeView() {
  const selected = readWords(state.original).scenario?.id;
  return `<p class="small-label">01 · Start wherever you are</p>
    <h2 id="view-title" tabindex="-1">What’s on your mind?</h2>
    <p class="view-description">A feeling, a moment, a sentence you can’t quite finish.<br>It doesn’t have to make sense yet.</p>
    <p class="example-label">Try a little example, or write your own.</p>
    <div class="scenario-options" role="group" aria-label="Example situations">${scenarios.map(item => `<button type="button" class="scenario-button" data-scenario="${item.id}" aria-pressed="${selected === item.id}"><span class="scenario-number">${item.icon}</span>${escape(item.name)}</button>`).join('')}</div>
    <form id="words-form">
      <label for="original-words" class="text-label">Your words</label>
      <textarea id="original-words" name="words" maxlength="600" required placeholder="Today I…" aria-describedby="writing-help">${escape(state.original)}</textarea>
      <div class="input-meta"><span id="writing-help">Your own text? I’ll ask you to name the feeling.</span><span id="word-count">${state.original.length} / 600</span></div>
      <div class="actions"><p class="helper-copy">A place to find words.<br>You decide what fits.</p><button class="primary-button" type="submit" ${state.original.trim() ? '' : 'disabled'}>Let’s untangle it <span aria-hidden="true">→</span></button></div>
    </form>
    <p class="demo-note">A scripted demo, not a live AI. Examples have prepared responses. Your own words always stay yours.</p>`;
}

function checkView() {
  const reading = readWords(state.original);
  const feeling = confirmedFeeling(reading, state.choice, state.custom);
  return `<p class="small-label">02 · Check my understanding</p>
    <h2 id="view-title" tabindex="-1">Did I get that right?</h2>
    <p class="view-description">Here’s what you told me, and what I can only guess.<br>You can correct me. You don’t have to pick a label.</p>
    <div class="evidence-card"><span class="tag tag-said">▣ You said · from your words</span><p>${escape(reading.said)}</p></div>
    ${reading.guesses.length ? `<p class="guess-intro">These are possibilities to check, not conclusions about you.</p><div class="guesses">${reading.guesses.map(guess => `<div class="evidence-card guess-card"><span class="tag tag-guess">? Q’s guess · unconfirmed</span><p class="guess-heading">Maybe ${escape(guess.feeling)}?</p><p class="clue">${escape(guess.clue)}</p></div>`).join('')}</div>` : '<div class="evidence-card guess-card"><span class="tag tag-guess">? Still unknown</span><p>I don’t have a prepared reading for these words. I won’t guess your feeling. What would you call it?</p></div>'}
    <fieldset class="feeling-fieldset"><legend>What feels closer to you?</legend><div class="feeling-options">${feelingChoices(reading).map(option => `<label class="feeling-option"><input type="radio" name="feeling" value="${escape(option.id)}" ${state.choice === option.id ? 'checked' : ''}><span>${escape(option.label)}</span></label>`).join('')}</div></fieldset>
    <div id="custom-field" class="custom-field" ${state.choice === 'other' ? '' : 'hidden'}><label class="text-label" for="custom-feeling">Thank you for correcting me. What words fit better?</label><input class="custom-input" id="custom-feeling" maxlength="100" value="${escape(state.custom)}" placeholder="For example: relieved, restless, or numb" autocomplete="off"></div>
    <p id="confirmed-summary" class="confirmed-summary" ${feeling ? '' : 'hidden'}>${feeling ? escape(confirmationText(feeling)) : ''}</p>
    <div class="actions">${button('back', '← Back to my words')}${button('draft', 'Make a draft', { primary: true, disabled: !feeling })}</div>`;
}

function confirmationText(feeling) {
  if (feeling.uncertain) return 'It’s okay to stay unsure. I’ll keep that uncertainty in the draft.';
  return `You chose “${feeling.text}.” I’ll use your choice, not my unconfirmed guesses.`;
}

function draftView() {
  const reading = readWords(state.original);
  const feeling = confirmedFeeling(reading, state.choice, state.custom);
  return `<p class="small-label">03 · Make it sound like you</p>
    <h2 id="view-title" tabindex="-1">A little clearer. Still yours.</h2>
    <p class="view-description">This is a suggestion, not the right answer.<br>Edit any word that doesn’t fit your meaning.</p>
    <div class="source-summary"><span class="tag tag-confirmed">✓ ${feeling.uncertain ? 'You chose to stay unsure' : 'You confirmed'}</span><p>${escape(feeling.text)}${feeling.uncertain ? '.' : ` · ${escape(feeling.source)}`}</p></div>
    <label class="text-label" for="draft-words">Your draft · you can edit every word</label>
    <textarea class="draft-textarea" id="draft-words" maxlength="1200" aria-describedby="draft-provenance">${escape(state.draft)}</textarea>
    <div class="input-meta"><span id="draft-provenance">${state.draft === state.initialDraft ? 'Built from your words and the choice you confirmed.' : 'Edited by you. Your wording takes priority.'}</span><span id="draft-count">${state.draft.length} / 1200</span></div>
    <p class="writing-tip"><strong>A small writing thought.</strong> ${escape(reading.tip)}</p>
    <div class="actions">${button('back', '← Revisit my feeling')}${button('keep', 'Yes, that says it', { primary: true, disabled: !state.draft.trim() })}</div>`;
}

function finalView() {
  return `<p class="small-label">04 · In your own words</p>
    <h2 id="view-title" tabindex="-1">That sounds like you.</h2>
    <p class="view-description">A small note to keep, share, or simply sit with.<br>It’s okay if your words change later.</p>
    <div class="final-note"><p class="final-words">${escape(state.final)}</p><div class="final-credit"><span><span aria-hidden="true">✓</span> Reviewed by you</span><span>Your feelings. Your say.</span></div></div>
    <div class="actions">${button('back', '← I want to edit it')}${button('copy', 'Copy my words', { primary: true })}</div>
    <p class="copy-message" id="copy-message" role="status" aria-live="polite"></p>
    <div id="copy-fallback" class="copy-fallback" hidden><label class="text-label" for="copy-text">Select and copy your words here</label><textarea id="copy-text" readonly>${escape(state.final)}</textarea></div>
    <div class="actions">${button('restart', 'Start a fresh page')}<span class="helper-copy">Nothing was sent or saved.</span></div>`;
}

function updateConfirmation() {
  const feeling = confirmedFeeling(readWords(state.original), state.choice, state.custom);
  get('confirmed-summary').hidden = !feeling;
  get('confirmed-summary').textContent = feeling ? confirmationText(feeling) : '';
  document.querySelector('[data-action="draft"]').disabled = !feeling;
}

get('coach-view').addEventListener('input', event => {
  if (event.target.id === 'original-words') {
    state.original = event.target.value;
    state.choice = ''; state.custom = ''; state.draft = ''; state.final = '';
    get('word-count').textContent = `${state.original.length} / 600`;
    get('words-form').querySelector('button[type="submit"]').disabled = !state.original.trim();
    const selected = readWords(state.original).scenario?.id;
    document.querySelectorAll('[data-scenario]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.scenario === selected)));
  } else if (event.target.id === 'custom-feeling') {
    state.custom = event.target.value;
    state.draft = ''; updateConfirmation();
  } else if (event.target.id === 'draft-words') {
    state.draft = event.target.value;
    get('draft-count').textContent = `${state.draft.length} / 1200`;
    get('draft-provenance').textContent = state.draft === state.initialDraft ? 'Built from your words and the choice you confirmed.' : 'Edited by you. Your wording takes priority.';
    document.querySelector('[data-action="keep"]').disabled = !state.draft.trim();
  }
});

get('coach-view').addEventListener('change', event => {
  if (event.target.name !== 'feeling') return;
  state.choice = event.target.value;
  state.draft = '';
  get('custom-field').hidden = state.choice !== 'other';
  updateConfirmation();
  if (state.choice === 'other') get('custom-feeling').focus();
});

get('coach-view').addEventListener('submit', event => {
  if (event.target.id !== 'words-form') return;
  event.preventDefault();
  if (!state.original.trim()) return;
  state.step = 1; render();
});

get('coach-view').addEventListener('click', async event => {
  const scenarioButton = event.target.closest('[data-scenario]');
  if (scenarioButton) {
    const scenario = scenarios.find(item => item.id === scenarioButton.dataset.scenario);
    state.original = scenario.text; state.choice = ''; state.custom = ''; state.draft = ''; state.final = '';
    render({ focus: false });
    document.querySelector(`[data-scenario="${scenario.id}"]`).focus({ preventScroll: true });
    get('announcement').textContent = `Example loaded: ${scenario.name}. ${scenario.text}`;
    return;
  }
  const target = event.target.closest('[data-action]');
  if (!target || target.disabled) return;
  const action = target.dataset.action;
  if (action === 'back') { state.step = Math.max(0, state.step - 1); render(); }
  if (action === 'draft') {
    if (!confirmedFeeling(readWords(state.original), state.choice, state.custom)) return;
    if (!state.draft) {
      state.draft = makeDraft(readWords(state.original), state.choice, state.custom);
      state.initialDraft = state.draft;
    }
    state.step = 2; render();
  }
  if (action === 'keep' && state.draft.trim()) { state.final = state.draft.trim(); state.step = 3; render(); }
  if (action === 'restart') {
    Object.assign(state, { step: 0, original: '', choice: '', custom: '', draft: '', initialDraft: '', final: '' });
    get('announcement').textContent = 'Fresh page started. Previous words cleared from the coach.';
    render();
  }
  if (action === 'copy') {
    const words = state.final;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard is unavailable');
      await navigator.clipboard.writeText(words);
      if (state.step !== 3 || state.final !== words) return;
      get('copy-message').textContent = 'Copied. Take your words wherever you need them.';
      target.innerHTML = 'Copied <span aria-hidden="true">✓</span>';
    } catch {
      if (state.step !== 3 || state.final !== words) return;
      get('copy-fallback').hidden = false;
      get('copy-text').focus(); get('copy-text').select();
      get('copy-message').textContent = 'Your browser couldn’t copy automatically. The text is selected below so you can copy it yourself.';
    }
  }
});

render({ focus: false });
startCompanion();
