export const scenarios = [
  {
    id: 'project', name: 'After a big project', icon: '01',
    text: 'I finally finished my project, but I don’t feel like celebrating.',
    said: 'You finished your project, and you don’t feel like celebrating.',
    guesses: [
      { feeling: 'tired', label: 'Tired', clue: 'Not wanting to celebrate could mean you need rest. It could also mean something else.' },
      { feeling: 'disappointed', label: 'Disappointed', clue: 'The “but” suggests a contrast. It doesn’t tell me how you feel about the result.' },
    ],
    drafts: {
      tired: 'I finally finished my project, but I’m tired and don’t feel like celebrating right now.',
      disappointed: 'I finally finished my project, but I feel disappointed and don’t feel like celebrating right now.',
      both: 'I finally finished my project, but I feel tired and disappointed, and I don’t feel like celebrating right now.',
    },
    tip: 'Finishing something doesn’t tell me whether you’re happy with it. I’ll ask instead of adding that feeling for you.',
  },
  {
    id: 'friends', name: 'Plans with a friend', icon: '02',
    text: 'I want to see my friends, but I also don’t want to leave the house.',
    said: 'You want to see your friends, and you also don’t want to leave the house.',
    guesses: [
      { feeling: 'tired', label: 'Tired', clue: 'Not wanting to go out could be about energy. You haven’t said why yet.' },
      { feeling: 'overwhelmed', label: 'Overwhelmed', clue: 'Wanting two different things could feel overwhelming. I can’t assume that it does.' },
    ],
    drafts: {
      tired: 'I want to see my friends, but I feel tired and don’t want to leave the house right now.',
      overwhelmed: 'I want to see my friends, but I feel overwhelmed and don’t want to leave the house right now.',
      both: 'I want to see my friends, but I feel tired and overwhelmed, and I don’t want to leave the house right now.',
    },
    tip: 'Two wishes can both be true. We can keep both in your sentence without deciding which one matters more.',
  },
  {
    id: 'offer', name: 'Happy for someone else', icon: '03',
    text: 'My friend got a job offer. I’m happy for her, but I feel bad too.',
    said: 'Your friend got a job offer. You’re happy for her, and you also feel bad.',
    guesses: [
      { feeling: 'left behind', label: 'Left behind', clue: 'Someone else’s news can bring up comparison, but you haven’t said that’s what happened.' },
      { feeling: 'worried about my own future', label: 'Worried about my future', clue: 'The news might bring up worry about your next step. “Feel bad” alone doesn’t establish that.' },
    ],
    drafts: {
      'left behind': 'I’m happy my friend got a job offer, and I also feel left behind.',
      'worried about my own future': 'I’m happy my friend got a job offer, and I also feel worried about my own future.',
      both: 'I’m happy my friend got a job offer, and I also feel left behind and worried about my own future.',
    },
    tip: '“And” can make room for two feelings. You can be happy for your friend and have a difficult feeling of your own.',
  },
];

const normalize = text => text.trim().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');

export function readWords(text) {
  const original = text.trim();
  const scenario = scenarios.find(item => normalize(item.text) === normalize(original));
  if (scenario) return { original, scenario, said: scenario.said, guesses: scenario.guesses, tip: scenario.tip };
  return {
    original, scenario: null, said: original, guesses: [],
    tip: 'One way to make a feeling clearer is to name it in your own words. I’ll keep your original text and only add what you confirm.',
  };
}

export function feelingChoices(reading) {
  const named = reading.guesses.map(guess => ({ id: guess.feeling, label: guess.label }));
  if (named.length) named.push({ id: 'both', label: 'Both of these' });
  return [...named, { id: 'other', label: 'Something else — I’ll name it' }, { id: 'unsure', label: 'I’m not sure yet' }];
}

export function confirmedFeeling(reading, choice, custom = '') {
  if (!feelingChoices(reading).some(option => option.id === choice)) return null;
  if (choice === 'other') return custom.trim() ? { text: custom.trim(), source: 'your own words', uncertain: false } : null;
  if (choice === 'unsure') return { text: 'I’m still figuring out how I feel', source: 'your choice to stay unsure', uncertain: true };
  if (choice === 'both') return { text: reading.guesses.map(guess => guess.feeling).join(' and '), source: 'confirmed by you', uncertain: false };
  return { text: choice, source: 'confirmed by you', uncertain: false };
}

export function makeDraft(reading, choice, custom = '') {
  const feeling = confirmedFeeling(reading, choice, custom);
  if (!feeling) throw new Error('Please confirm a feeling, or choose to stay unsure.');
  if (feeling.uncertain) return `${reading.original}\n\nI’m still figuring out how I feel.`;
  if (reading.scenario?.drafts[choice]) return reading.scenario.drafts[choice];
  return `${reading.original}\n\nHow I’d describe my feeling: ${feeling.text}.`;
}
