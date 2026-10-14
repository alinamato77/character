import { chatContent } from './chat-content.js';

// A small local keyword check; no external AI request or mood label is saved.
export function moodReply(answer) {
  let text = answer.toLowerCase().replace(/[’‘]/g, "'");
  let negatedPositive = false, negatedNegative = false;
  const negate = "(?:not|never|no|don't|didn't|isn't|wasn't|aren't|wasnt|isnt|dont|didnt)\\s+(?:(?:very|really|so|that|too|feel|feeling|a|much)\\s+){0,3}";
  const hasWord = word => /[\u3400-\u9fff]/.test(word) ? text.includes(word) : new RegExp(`\\b${word}\\b`, 'u').test(text);
  // Remove negated English words before the ordinary keyword pass.
  for (const word of chatContent.moodWords.positive.filter(w => !/[\u3400-\u9fff]/.test(w))) {
    text = text.replace(new RegExp(`\\b${negate}${word}\\b`, 'gu'), () => { negatedPositive = true; return ' '; });
  }
  for (const word of chatContent.moodWords.negative.filter(w => !/[\u3400-\u9fff]/.test(w))) {
    text = text.replace(new RegExp(`\\b${negate}${word}\\b`, 'gu'), () => { negatedNegative = true; return ' '; });
  }
  const negative = negatedPositive || chatContent.moodWords.negative.some(hasWord);
  const positive = negatedNegative || chatContent.moodWords.positive.some(hasWord);
  return chatContent.replies[positive && !negative ? 'happy' : 'supportive'];
}
