import { scenarios, moods, intensities, needs, readWords, summarizeSelection, makeDraft } from './feelings-model.js';
import { moodIcon } from './feelings-icons.js';
import { startCompanion } from './feelings-companion.js';

const get = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const freshState = () => ({ step: 0, original: '', selected: [], custom: '', intensity: '', context: '', need: '', reviewed: false, draft: '', initialDraft: '', final: '' });
const state = freshState();
const stepNames = ['Words', 'Feelings', 'Details', 'Check', 'Draft', 'Keep'];
const qWords = [
  'You know your feelings.\nI’m here to help with the words.',
  'One feeling, or a few?\nThere’s room for all of them.',
  'A little more context helps.\nShare only what you want to.',
  'Here’s what I heard.\nYou can correct any part of it.',
  'A draft is an invitation.\nChange anything that isn’t you.',
  'These are your words now.\nThank you for helping me understand.',
];
const selection = () => summarizeSelection(state.selected, state.custom);
const invalidate = () => { state.reviewed = false; state.draft = ''; state.initialDraft = ''; state.final = ''; };
const selectedBadges = () => selection()?.items.map(item => `<span class="mood-badge">${moodIcon(item.id)}${escape(item.id === 'other' ? state.custom.trim() : item.label)}</span>`).join('') || '';
const button = (action, label, primary = false, disabled = false) => `<button type="button" class="${primary ? 'primary-button' : 'secondary-button'}" data-action="${action}" ${disabled ? 'disabled' : ''}>${label}${primary ? '<span aria-hidden="true">→</span>' : ''}</button>`;

function render({ focus = true } = {}) {
  get('steps').innerHTML = stepNames.map((name, index) => `<li ${index === state.step ? 'aria-current="step"' : ''} class="${index < state.step ? 'complete' : ''}">${name}</li>`).join('');
  get('step-count').textContent = `0${state.step + 1} / 06`;
  get('q-words').textContent = qWords[state.step];
  get('q-words').style.whiteSpace = 'pre-line';
  get('coach-view').innerHTML = [writeView, feelingsView, detailsView, checkView, draftView, finalView][state.step]();
  if (focus) {
    get('workspace').scrollIntoView({ block: 'start', behavior: 'instant' });
    get('view-title').focus({ preventScroll: true });
  }
}

function writeView() {
  const chosen = readWords(state.original).scenario?.id;
  return `<p class="small-label">01 · Start wherever you are</p>
    <h2 id="view-title" tabindex="-1">What’s on your mind?</h2>
    <p class="view-description">Tell me about a moment from your day. Next, we’ll choose the feelings, add a little detail, and find words that fit.</p>
    <p class="example-label">Try a little example, or write your own.</p>
    <div class="scenario-options" role="group" aria-label="Example situations">${scenarios.map(item => `<button type="button" class="scenario-button" data-scenario="${item.id}" aria-pressed="${chosen === item.id}"><span class="scenario-number">${item.icon}</span>${escape(item.name)}</button>`).join('')}</div>
    <form id="words-form"><label for="original-words" class="text-label">Your words</label>
      <textarea id="original-words" name="words" maxlength="600" required placeholder="Today, I joined an interesting event…" aria-describedby="writing-help">${escape(state.original)}</textarea>
      <div class="input-meta"><span id="writing-help">Every entry gets the full feeling palette.</span><span id="word-count">${state.original.length} / 600</span></div>
      <div class="actions"><p class="helper-copy">A moment first.<br>The meaning is yours.</p><button class="primary-button" type="submit" ${state.original.trim() ? '' : 'disabled'}>Find my feelings <span aria-hidden="true">→</span></button></div>
    </form><p class="demo-note">A guided, scripted coach. Q uses your choices to help with wording; it doesn’t read your mind.</p>`;
}

function feelingsView() {
  return `<p class="small-label">02 · Give the feeling a name</p>
    <h2 id="view-title" tabindex="-1">How does it feel?</h2>
    <p class="view-description">The same moment can bring different feelings. Pick any that fit, name your own, or leave it open. These are your choices, not Q’s verdict.</p>
    <details class="original-peek"><summary>A look at your words</summary><p>${escape(state.original)}</p></details>
    <fieldset class="mood-fieldset"><legend>Choose your feelings · more than one is okay</legend><div class="mood-grid">${moods.map(mood => `<label class="mood-choice"><input type="checkbox" class="sr-only" name="mood" value="${mood.id}" ${state.selected.includes(mood.id) ? 'checked' : ''}><span class="mood-tick" aria-hidden="true">✓</span>${moodIcon(mood.id)}<span class="mood-name">${escape(mood.label)}</span><span class="mood-description">${escape(mood.description)}</span></label>`).join('')}</div></fieldset>
    <div id="custom-field" class="custom-field" ${state.selected.includes('other') ? '' : 'hidden'}><label class="text-label" for="custom-feeling">What would you call the feeling?</label><input id="custom-feeling" class="custom-input" maxlength="100" value="${escape(state.custom)}" placeholder="For example: curious, nostalgic, or restless" autocomplete="off"></div>
    <div id="feeling-explanation" class="feeling-explanation" aria-live="polite">${feelingExplanation()}</div>
    <div class="actions">${button('back', '← My words')}${button('next', 'Add a little detail', true, !selection())}</div>`;
}

function feelingExplanation() {
  const feeling = selection();
  if (!feeling) return '<p class="selection-help">No need to find the perfect word. You can change your choices later.</p>';
  return `<div class="selection-heading"><span class="tag tag-confirmed">✓ Your choice${feeling.items.length > 1 ? 's' : ''}</span></div>${feeling.items.map(item => `<div class="feeling-explainer"><strong>${escape(item.id === 'other' ? state.custom.trim() : item.label)}</strong><p>${escape(item.reflection)}</p></div>`).join('')}${feeling.items.length > 1 ? '<p class="mixed-note">Mixed feelings can coexist. I’ll keep them together without choosing one for you.</p>' : ''}`;
}

function detailsView() {
  const feeling = selection();
  return `<p class="small-label">03 · A little more texture</p>
    <h2 id="view-title" tabindex="-1">Tell me a little more.</h2>
    <p class="view-description">A name is a starting point. How much space does the feeling take up, and what would you like to express?</p>
    <div class="mood-badges">${selectedBadges()}</div>
    <fieldset class="detail-fieldset"><legend>How strong does it feel right now?</legend><div class="intensity-grid">${intensities.map((item, index) => `<label class="intensity-choice"><input type="radio" name="intensity" value="${item.id}" ${state.intensity === item.id ? 'checked' : ''}><span><span class="intensity-bars" data-level="${index + 1}" aria-hidden="true">${item.id === 'unsure' ? '?' : '▮'.repeat(index + 1)}</span><strong>${item.label}</strong><small>${item.description}</small></span></label>`).join('')}</div></fieldset>
    <div class="context-prompt"><span class="tag tag-guess">A question, not an assumption</span><p>${escape(feeling.items.length > 1 ? 'How do these feelings sit together? You can describe where each one comes from, or leave the reasons open.' : feeling.items[0].question)}</p></div>
    <label class="text-label" for="feeling-context">Anything you’d like to add? <span class="optional">Optional</span></label>
    <textarea id="feeling-context" class="context-textarea" maxlength="280" placeholder="A detail, a reason, or something you want someone to understand…">${escape(state.context)}</textarea>
    <fieldset class="detail-fieldset"><legend>What would help right now? <span class="optional">Optional</span></legend><div class="need-options">${needs.map(item => `<label class="need-choice"><input type="radio" name="need" value="${item.id}" ${state.need === item.id ? 'checked' : ''}>${escape(item.label)}</label>`).join('')}</div></fieldset>
    <div class="actions">${button('back', '← My feelings')}${button('next', 'Check together', true, !state.intensity)}</div>`;
}

function checkView() {
  const feeling = selection();
  const intensity = intensities.find(item => item.id === state.intensity);
  const need = needs.find(item => item.id === state.need);
  return `<p class="small-label">04 · Check my understanding</p>
    <h2 id="view-title" tabindex="-1">Does this sound right?</h2>
    <p class="view-description">Here’s what comes directly from you, and the part I’m treating as a possibility. You can go back and change any of it.</p>
    <div class="evidence-card"><span class="tag tag-said">▣ You wrote · your exact words</span><p>${escape(state.original)}</p></div>
    <div class="evidence-card chosen-card"><div class="card-label-row"><span class="tag tag-confirmed">✓ You chose · not inferred</span>${button('edit-feelings', 'Change')}</div><div class="mood-badges">${selectedBadges()}</div><p class="detail-summary">Intensity: ${escape(intensity.label)}${need ? `<br>What would help: ${escape(need.label)}` : ''}</p>${state.context.trim() ? `<p class="context-quote">Your added context: “${escape(state.context.trim())}”</p>` : ''}${button('edit-details', 'Adjust the details')}</div>
    <div class="evidence-card guess-card"><span class="tag tag-guess">? Q’s working interpretation · please check</span>${feeling.uncertain ? '<p>You’re describing a moment whose emotional meaning is still open. The most honest draft may describe what happened and say you’re still figuring it out.</p>' : `<p>You want to describe this moment as ${escape(feeling.text)}, with ${intensity.id === 'unsure' ? 'an intensity you’re still figuring out' : `a ${escape(intensity.label.toLowerCase())} intensity`}. ${feeling.items.length > 1 ? 'Those feelings can sit alongside each other.' : 'That gives us a starting point for your wording.'} I’m following your choices, rather than deciding what the event meant.</p>`}</div>
    <details class="uncertainty-details" open><summary>What I’m still not assuming</summary><ul>${!state.context.trim() ? '<li>What caused the feeling. You haven’t supplied that context.</li>' : '<li>That your added context explains the whole feeling.</li>'}<li>How long you’ve felt this way, or how you’ll feel later.</li>${feeling.uncertain ? '<li>A specific emotion label. You’ve chosen to leave it open.</li>' : '<li>That any label fully captures your experience.</li>'}</ul></details>
    <label class="review-confirmation"><input id="review-confirmation" type="checkbox" ${state.reviewed ? 'checked' : ''}><span>This reflects what I want to say. Let’s make a draft.</span></label>
    <div class="actions">${button('back', '← The details')}${button('next', 'Make a draft', true, !state.reviewed)}</div>`;
}

function draftView() {
  const feeling = selection();
  return `<p class="small-label">05 · Make it sound like you</p>
    <h2 id="view-title" tabindex="-1">A little clearer. Still yours.</h2>
    <p class="view-description">Your moment, your feelings, your details. Now make the wording yours. You can remove any sentence that doesn’t belong.</p>
    <div class="source-summary"><span class="tag tag-confirmed">✓ Reviewed by you</span><div class="mood-badges">${selectedBadges()}</div><p>${feeling.uncertain ? 'Your uncertainty stays in the draft.' : 'Only the feelings you selected have been added.'}</p></div>
    <label class="text-label" for="draft-words">Your draft · you can edit every word</label>
    <textarea id="draft-words" class="draft-textarea" maxlength="2400" aria-describedby="draft-provenance">${escape(state.draft)}</textarea>
    <div class="input-meta"><span id="draft-provenance">${state.draft === state.initialDraft ? 'Built from your words and the details you confirmed.' : 'Edited by you. Your wording takes priority.'}</span><span id="draft-count">${state.draft.length} / 2400</span></div>
    <div class="writing-thoughts"><span class="small-label">A small writing thought</span>${feeling.items.map(item => `<p>${escape(item.tip)}</p>`).join('')}</div>
    <div class="actions">${button('back', '← Check again')}${button('keep', 'Yes, that says it', true, !state.draft.trim())}</div>`;
}

function finalView() {
  return `<p class="small-label">06 · In your own words</p>
    <h2 id="view-title" tabindex="-1">That sounds like you.</h2>
    <p class="view-description">A small note to keep, share, or simply sit with.<br>It’s okay if your words change later.</p>
    <div class="final-note"><div class="final-moods" aria-label="Feelings you selected during this check-in">${selectedBadges()}</div><p class="final-words">${escape(state.final)}</p><div class="final-credit"><span>✓ Reviewed by you</span><span>Your feelings. Your say.</span></div></div>
    <div class="actions">${button('back', '← I want to edit it')}${button('copy', 'Copy my words', true)}</div>
    <p id="copy-message" class="copy-message" role="status" aria-live="polite"></p>
    <div id="copy-fallback" class="copy-fallback" hidden><label class="text-label" for="copy-text">Select and copy your words here</label><textarea id="copy-text" readonly>${escape(state.final)}</textarea></div>
    <div class="actions">${button('restart', 'Start a fresh page')}<span class="helper-copy">Nothing was sent or saved.</span></div>`;
}

get('coach-view').addEventListener('input', event => {
  const target = event.target;
  if (target.id === 'original-words') {
    state.original = target.value; invalidate();
    get('word-count').textContent = `${state.original.length} / 600`;
    get('words-form').querySelector('button[type="submit"]').disabled = !state.original.trim();
    const chosen = readWords(state.original).scenario?.id;
    document.querySelectorAll('[data-scenario]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.scenario === chosen)));
  }
  if (target.id === 'custom-feeling') {
    state.custom = target.value; invalidate();
    get('feeling-explanation').innerHTML = feelingExplanation();
    document.querySelector('[data-action="next"]').disabled = !selection();
  }
  if (target.id === 'feeling-context') { state.context = target.value; invalidate(); }
  if (target.id === 'draft-words') {
    state.draft = target.value;
    get('draft-count').textContent = `${state.draft.length} / 2400`;
    get('draft-provenance').textContent = state.draft === state.initialDraft ? 'Built from your words and the details you confirmed.' : 'Edited by you. Your wording takes priority.';
    document.querySelector('[data-action="keep"]').disabled = !state.draft.trim();
  }
});

get('coach-view').addEventListener('change', event => {
  const target = event.target;
  if (target.name === 'mood') {
    if (target.value === 'unsure' && target.checked) state.selected = ['unsure'];
    else if (target.checked) state.selected = [...state.selected.filter(id => id !== 'unsure'), target.value];
    else state.selected = state.selected.filter(id => id !== target.value);
    invalidate();
    document.querySelectorAll('input[name="mood"]').forEach(input => { input.checked = state.selected.includes(input.value); });
    get('custom-field').hidden = !state.selected.includes('other');
    get('feeling-explanation').innerHTML = feelingExplanation();
    document.querySelector('[data-action="next"]').disabled = !selection();
    if (target.value === 'other' && target.checked) get('custom-feeling').focus();
  }
  if (target.name === 'intensity') {
    state.intensity = target.value; invalidate();
    document.querySelector('[data-action="next"]').disabled = false;
  }
  if (target.name === 'need') { state.need = target.value; invalidate(); }
  if (target.id === 'review-confirmation') {
    state.reviewed = target.checked;
    document.querySelector('[data-action="next"]').disabled = !state.reviewed;
  }
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
    const item = scenarios.find(item => item.id === scenarioButton.dataset.scenario);
    Object.assign(state, freshState(), { original: item.text });
    render({ focus: false });
    document.querySelector(`[data-scenario="${item.id}"]`).focus({ preventScroll: true });
    get('announcement').textContent = `Example loaded: ${item.name}. ${item.text}`;
    return;
  }
  const target = event.target.closest('[data-action]');
  if (!target || target.disabled) return;
  const action = target.dataset.action;
  if (action === 'back') { state.step = Math.max(0, state.step - 1); render(); }
  if (action === 'edit-feelings') { state.step = 1; render(); }
  if (action === 'edit-details') { state.step = 2; render(); }
  if (action === 'next') {
    if (state.step === 1 && !selection()) return;
    if (state.step === 2 && !intensities.some(item => item.id === state.intensity)) return;
    if (state.step === 3) {
      if (!state.reviewed) return;
      if (!state.draft) { state.draft = makeDraft(state); state.initialDraft = state.draft; }
    }
    state.step++; render();
  }
  if (action === 'keep' && state.draft.trim()) { state.final = state.draft.trim(); state.step = 5; render(); }
  if (action === 'restart') {
    Object.assign(state, freshState());
    get('announcement').textContent = 'Fresh page started. Previous words cleared from the coach.';
    render();
  }
  if (action === 'copy') {
    const words = state.final;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(words);
      if (state.step !== 5 || state.final !== words) return;
      get('copy-message').textContent = 'Copied. Take your words wherever you need them.';
      target.innerHTML = 'Copied <span aria-hidden="true">✓</span>';
    } catch {
      if (state.step !== 5 || state.final !== words) return;
      get('copy-fallback').hidden = false;
      get('copy-text').focus(); get('copy-text').select();
      get('copy-message').textContent = 'Your browser couldn’t copy automatically. The text is selected below so you can copy it yourself.';
    }
  }
});

render({ focus: false });
startCompanion();
