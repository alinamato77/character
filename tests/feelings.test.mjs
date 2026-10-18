import test from 'node:test';
import assert from 'node:assert/strict';
import { scenarios, moods, intensities, readWords, summarizeSelection, makeDraft } from '../public/feelings-model.js';
import { moodIcon } from '../public/feelings-icons.js';

const entry = { original: 'Today, I joined an interesting event.', selected: ['happy'], intensity: 'noticeable', context: '', need: '' };

test('custom writing gets the same complete mood palette and never an inferred mood', () => {
  for (const text of [entry.original, 'Great, another deadline.', 'I am not anxious.', '我不知道怎么说。', '<img src=x onerror=alert(1)>']) {
    assert.deepEqual(readWords(text).guesses, []);
    for (const id of ['anxious', 'depressed', 'happy', 'content', 'other', 'unsure']) assert(moods.some(item => item.id === id));
    assert.equal(summarizeSelection([]), null);
    assert(makeDraft({ ...entry, original: text }).startsWith(text));
  }
});

test('all named moods have their own explanation, follow-up question, writing tip, and pixel icon', () => {
  for (const mood of moods) {
    assert(mood.description && mood.reflection && mood.question && mood.tip, mood.id);
    assert(moodIcon(mood.id).includes('shape-rendering="crispEdges"'), mood.id);
    const selected = [mood.id], custom = mood.id === 'other' ? 'curious' : '';
    const draft = makeDraft({ ...entry, selected, custom });
    if (mood.id === 'unsure') assert(draft.includes('I’m still figuring out how I feel.'));
    else assert(draft.includes(`Right now, I feel ${mood.id === 'other' ? custom : mood.label.toLowerCase()}.`));
  }
});

test('mixed feelings remain together without selecting a dominant emotion', () => {
  const selected = ['anxious', 'happy', 'content'];
  assert.equal(summarizeSelection(selected).text, 'anxious, happy, and content');
  assert(makeDraft({ ...entry, selected }).includes('Right now, I feel anxious, happy, and content.'));
});

test('uncertainty stays explicit and cannot be combined with confirmed labels', () => {
  assert.equal(summarizeSelection(['unsure', 'happy']), null);
  const draft = makeDraft({ ...entry, selected: ['unsure'], intensity: 'unsure' });
  assert(draft.includes('I’m still figuring out how I feel.'));
  assert(draft.includes('I’m not sure how intense it feels yet.'));
  assert(!draft.includes('Right now, I feel'));
});

test('custom labels require an actual word and never preserve rejected default moods', () => {
  assert.equal(summarizeSelection(['other'], '   '), null);
  assert.equal(summarizeSelection(['other'], 'x'.repeat(101)), null);
  const draft = makeDraft({ ...entry, selected: ['other'], custom: '  nostalgic  ' });
  assert(draft.includes('Right now, I feel nostalgic.'));
  assert(!draft.includes('happy'));
  assert(!draft.includes('anxious'));
});

test('drafting requires a user-selected feeling and intensity rather than guessing missing choices', () => {
  for (const overrides of [{ selected: [] }, { selected: ['nonexistent'] }, { selected: ['happy', 'happy'] }, { intensity: '' }, { intensity: 'automatic' }, { original: '  ' }, { need: 'invented-request' }]) {
    assert.throws(() => makeDraft({ ...entry, ...overrides }));
  }
  for (const intensity of intensities) assert(makeDraft({ ...entry, intensity: intensity.id }).includes(intensity.sentence));
});

test('only supplied context and the chosen request are added to the draft', () => {
  const draft = makeDraft({ ...entry, context: 'I met someone who shared my interests.', need: 'heard' });
  assert(draft.includes('A little more context: I met someone who shared my interests.'));
  assert(draft.includes('I’d like someone to listen.'));
  assert(!draft.includes('I’d like a little time to rest.'));
  const minimal = makeDraft({ ...entry, need: 'none' });
  assert(!minimal.includes('A little more context:'));
  assert(!minimal.includes('I’d like'));
});

test('the original examples remain available, and edits are treated as the visitor’s own words', () => {
  for (const scenario of scenarios) {
    assert.equal(readWords(scenario.text).scenario.id, scenario.id);
    const edited = `${scenario.text} Actually, there’s more to it.`;
    assert.equal(readWords(edited).scenario, null);
    assert.deepEqual(readWords(edited).guesses, []);
  }
});
