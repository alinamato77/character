import test from 'node:test';
import assert from 'node:assert/strict';
import { scenarios, readWords, feelingChoices, confirmedFeeling, makeDraft } from '../public/feelings-model.js';

test('every prepared interpretation remains an unconfirmed possibility until a visitor chooses', () => {
  for (const scenario of scenarios) {
    const reading = readWords(scenario.text);
    assert.equal(reading.scenario.id, scenario.id);
    assert.equal(confirmedFeeling(reading, ''), null);
    assert.throws(() => makeDraft(reading, ''), /confirm/);
    assert.equal(confirmedFeeling(reading, 'not-a-real-choice'), null);
    assert.throws(() => makeDraft(reading, 'not-a-real-choice'), /confirm/);
    assert.equal(reading.guesses.length, 2);
  }
});

test('single and mixed confirmations use only the selected feelings in all three scenarios', () => {
  for (const scenario of scenarios) {
    const reading = readWords(scenario.text);
    for (const guess of reading.guesses) {
      const result = confirmedFeeling(reading, guess.feeling);
      assert.equal(result.text, guess.feeling);
      assert.equal(makeDraft(reading, guess.feeling), scenario.drafts[guess.feeling]);
    }
    assert.equal(confirmedFeeling(reading, 'both').text, reading.guesses.map(item => item.feeling).join(' and '));
    assert.equal(makeDraft(reading, 'both'), scenario.drafts.both);
  }
  assert(!makeDraft(readWords(scenarios[0].text), 'tired').includes('disappointed'));
  assert(!makeDraft(readWords(scenarios[0].text), 'tired').includes('happy'));
});

test('correcting Q with a custom feeling does not retain its rejected guesses', () => {
  for (const scenario of scenarios) {
    const reading = readWords(scenario.text);
    assert.equal(confirmedFeeling(reading, 'other', '   '), null);
    assert.throws(() => makeDraft(reading, 'other', ''), /confirm/);
    const result = makeDraft(reading, 'other', '  relieved  ');
    assert.equal(result, `${scenario.text}\n\nHow I’d describe my feeling: relieved.`);
    for (const guess of reading.guesses) assert(!result.includes(guess.feeling));
  }
});

test('being unsure remains explicit, with no forced emotion label', () => {
  for (const scenario of scenarios) {
    const reading = readWords(scenario.text);
    assert.equal(confirmedFeeling(reading, 'unsure').uncertain, true);
    assert.equal(makeDraft(reading, 'unsure'), `${scenario.text}\n\nI’m still figuring out how I feel.`);
  }
});

test('custom text and edited examples never receive a prepared interpretation', () => {
  for (const text of ['Great, another deadline.', 'I am not tired.', '我不知道怎么说。', '<img src=x onerror=alert(1)>', `${scenarios[0].text} Actually, I want to celebrate.`]) {
    const reading = readWords(text);
    assert.equal(reading.scenario, null);
    assert.equal(reading.said, text);
    assert.deepEqual(reading.guesses, []);
    assert.deepEqual(feelingChoices(reading).map(item => item.id), ['other', 'unsure']);
    assert.equal(confirmedFeeling(reading, 'tired'), null);
    assert.equal(makeDraft(reading, 'other', 'restless'), `${text}\n\nHow I’d describe my feeling: restless.`);
  }
});

test('typographic apostrophes and harmless whitespace do not change a known example', () => {
  const text = scenarios[0].text.replace('don’t', "don't").replaceAll(' ', '  ');
  assert.equal(readWords(text).scenario.id, 'project');
});
