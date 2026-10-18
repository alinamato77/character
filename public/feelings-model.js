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

export const moods = [
  { id: 'anxious', label: 'Anxious', description: 'Uneasy, worried, or on edge', reflection: 'You chose anxious. There may be worry or unease here, but I don’t know its cause from one sentence.', question: 'Is there something you’re anticipating, or is the uneasy feeling hard to place?', tip: 'Name the worry if you want to. You can also simply say that you feel anxious without explaining why.' },
  { id: 'depressed', label: 'Depressed', description: 'Low, heavy, or disconnected', reflection: 'You’re using depressed to describe how you feel. I’ll keep your wording without turning it into a diagnosis or assuming how long it has lasted.', question: 'Would you rather describe the heaviness, or just let someone know that today feels difficult?', tip: 'You don’t have to soften a difficult feeling to make the sentence easier for someone else to read.' },
  { id: 'happy', label: 'Happy', description: 'Bright, pleased, or joyful', reflection: 'You’ve named something that feels good. That doesn’t mean I should assume the whole day was happy.', question: 'Was there a particular moment you enjoyed, or is it a more general good feeling?', tip: 'A specific moment can make a happy feeling easier to share. Only add that detail if it feels true.' },
  { id: 'content', label: 'Content', description: 'Calm, satisfied, or at ease', reflection: 'Contentment can be quiet. Your words don’t need to sound excited to express that things feel okay.', question: 'Does it feel more like enough, peaceful, or simply okay where you are?', tip: 'Quiet feelings count too. A simple “I feel content right now” can be a complete thought.' },
  { id: 'tired', label: 'Tired', description: 'Low on energy or worn out', reflection: 'You chose tired. I won’t assume whether that’s physical, emotional, or both.', question: 'Would it help to name the kind of tiredness, or do you simply want a little rest?', tip: 'You can name your energy level without having to explain or justify it.' },
  { id: 'overwhelmed', label: 'Overwhelmed', description: 'Too much to hold at once', reflection: 'You’re describing a feeling of too much. I don’t know which part feels biggest until you tell me.', question: 'Is there one part you want to name, or would you rather keep the bigger picture?', tip: 'One clear sentence is enough. You don’t have to list everything that contributed to the feeling.' },
  { id: 'sad', label: 'Sad', description: 'Hurt, down, or tearful', reflection: 'You chose sad. That gives me a word for the feeling, not an explanation of what caused it.', question: 'Would you like to share what brought this up, or keep the reason private?', tip: 'Your sentence can hold sadness without adding a silver lining you don’t feel.' },
  { id: 'excited', label: 'Excited', description: 'Energized or looking forward', reflection: 'You’ve named anticipation or energy. I won’t assume it feels entirely comfortable or uncomplicated.', question: 'What are you looking forward to? Is there another feeling alongside the excitement?', tip: 'If excitement and nerves coexist, “and” makes room for both.' },
  { id: 'disappointed', label: 'Disappointed', description: 'Let down or not as you hoped', reflection: 'You chose disappointed. I don’t know what you hoped for, or whether you want to talk about it.', question: 'Is there a gap between what happened and what you hoped would happen?', tip: 'You can describe the gap between your hopes and the result without judging yourself for the feeling.' },
  { id: 'relieved', label: 'Relieved', description: 'Lighter after some tension', reflection: 'You’ve named relief. I won’t assume the tension has completely gone away.', question: 'What feels a little lighter now? Is there anything still lingering?', tip: 'Relief can be partial. You don’t need to write that everything is solved.' },
  { id: 'other', label: 'Other — name it', description: 'Your feeling, in your own words', reflection: 'You supplied your own word. I’ll keep it instead of forcing it into one of my labels.', question: 'What would you like someone to understand about that feeling?', tip: 'Your own wording takes priority over a preset label.' },
  { id: 'unsure', label: 'I’m not sure yet', description: 'Leave room for not knowing', reflection: 'You don’t have to name a feeling before you’re ready. We can describe the moment and leave its meaning open.', question: 'Would it feel more honest to say you’re still sorting it out?', tip: 'Uncertainty belongs in the sentence too. “I’m still figuring out how I feel” is a valid expression.' },
];

export const intensities = [
  { id: 'gentle', label: 'Gentle', description: 'In the background', sentence: 'The feeling is gentle right now.' },
  { id: 'noticeable', label: 'Noticeable', description: 'Taking up some space', sentence: 'The feeling is noticeable right now.' },
  { id: 'strong', label: 'Strong', description: 'Taking up a lot of space', sentence: 'The feeling is strong right now.' },
  { id: 'unsure', label: 'Hard to tell', description: 'No need to measure it', sentence: 'I’m not sure how intense it feels yet.' },
];

export const needs = [
  { id: 'heard', label: 'To be heard', sentence: 'I’d like someone to listen.' },
  { id: 'space', label: 'Some space', sentence: 'I’d like a little space.' },
  { id: 'rest', label: 'A little rest', sentence: 'I’d like a little time to rest.' },
  { id: 'support', label: 'Some support', sentence: 'I’d appreciate a little support.' },
  { id: 'celebrate', label: 'Share the good', sentence: 'I’d like to share this good feeling with someone.' },
  { id: 'none', label: 'Just finding words', sentence: '' },
];

export function summarizeSelection(selected, custom = '') {
  if (!Array.isArray(selected) || !selected.length || new Set(selected).size !== selected.length) return null;
  if (selected.some(id => !moods.some(mood => mood.id === id))) return null;
  if (selected.includes('unsure') && selected.length > 1) return null;
  if (selected.includes('other') && (!custom.trim() || custom.trim().length > 100)) return null;
  const items = selected.map(id => ({ ...moods.find(mood => mood.id === id), text: id === 'other' ? custom.trim() : moods.find(mood => mood.id === id).label.toLowerCase() }));
  return { items, uncertain: selected[0] === 'unsure', text: joinWords(items.map(item => item.text)) };
}

export function joinWords(words) {
  if (words.length < 2) return words[0] || '';
  if (words.length === 2) return words.join(' and ');
  return `${words.slice(0, -1).join(', ')}, and ${words.at(-1)}`;
}

export function makeDraft({ original, selected, custom = '', intensity, context = '', need = '' }) {
  const feeling = summarizeSelection(selected, custom);
  const strength = intensities.find(item => item.id === intensity);
  if (!original.trim()) throw new Error('Please add your words.');
  if (!feeling) throw new Error('Please choose a feeling, or choose to stay unsure.');
  if (!strength) throw new Error('Please choose an intensity, including “Hard to tell.”');
  if (need && !needs.some(item => item.id === need)) throw new Error('Please choose a listed request.');
  const lines = [original.trim(), feeling.uncertain ? 'I’m still figuring out how I feel.' : `Right now, I feel ${feeling.text}.`];
  lines.push(strength.sentence);
  if (context.trim()) lines.push(`A little more context: ${context.trim()}`);
  const request = needs.find(item => item.id === need);
  if (request?.sentence) lines.push(request.sentence);
  return lines.join('\n\n');
}
