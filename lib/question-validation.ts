import { chatContent } from '../public/chat-content.js';

const submissionFields = new Set(['id', 'edition', 'name', 'answers']);
const answerFields = new Set(['questionId', 'answer']);
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

// Only question answers enter the inbox. Companion replies and the name step
// are not answers; the name is attached to every answer in this submission.
export function validateSubmission(body: unknown) {
  if (!isRecord(body) || Object.keys(body).some(key => !submissionFields.has(key))) return null;
  if (typeof body.id !== 'string' || !uuid.test(body.id) || body.edition !== chatContent.edition) return null;
  if (typeof body.name !== 'string') return null;
  const name = body.name.trim();
  if (!name || name.length > 40 || !Array.isArray(body.answers) || ![2, 3].includes(body.answers.length)) return null;

  const supplied = new Map<string, string>();
  for (const item of body.answers) {
    if (!isRecord(item) || Object.keys(item).some(key => !answerFields.has(key))) return null;
    if (typeof item.questionId !== 'string' || typeof item.answer !== 'string' || supplied.has(item.questionId)) return null;
    const answer = item.answer.trim();
    if (!answer || answer.length > 240) return null;
    supplied.set(item.questionId, answer);
  }

  const hangout = supplied.get('hangout');
  if (hangout !== 'yes' && hangout !== 'no') return null;
  const ids = hangout === 'yes' ? ['mood', 'hangout', 'available-date'] : ['mood', 'hangout'];
  if (supplied.size !== ids.length || ids.some(id => !supplied.has(id))) return null;

  const entries = ids.map(questionId => {
    const index = chatContent.questions.findIndex(question => question.id === questionId);
    const question = chatContent.questions[index];
    if (!question || !['text', 'choice'].includes(question.type)) return null;
    const answer = supplied.get(questionId)!;
    if (question.type === 'choice' && answer !== 'yes' && answer !== 'no') return null;
    return {
      id: `${body.id}:${questionId}`, week: 0, index,
      question: question.text, type: question.type, answer,
    };
  });
  if (entries.some(entry => entry === null)) return null;
  return { id: body.id, name, entries: entries.filter(entry => entry !== null) };
}
