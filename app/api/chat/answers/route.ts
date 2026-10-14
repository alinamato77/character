import { answerDb, getSession, json } from '../../../../lib/answer-store';
import { chatContent } from '../../../../public/chat-content.js';
import { validateSubmission } from '../../../../lib/question-validation';

export const dynamic = 'force-dynamic';
type SavedAnswer = {
  id: string; session_id: string; visitor_name: string | null;
  week: number; question_index: number; question: string; answer_type: string; answer: string;
};

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (request.headers.get('origin') !== url.origin || !request.headers.get('content-type')?.startsWith('application/json')) {
    return json({ error: 'Please submit your answer from this website.' }, 403);
  }
  try {
    const raw = await request.text();
    if (raw.length > 2048) return json({ error: 'Your answer is too long.' }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return json({ error: 'Please check your answer.' }, 400); }
    if (body && body.edition !== chatContent.edition) return json({ error: 'Chat has been updated. Copy your answer, then refresh the page to see the latest questions.' }, 409);
    const submission = validateSubmission(body);
    if (!submission) return json({ error: 'Please complete your answers and name before sending.' }, 400);
    const session = await getSession(request);
    if (!session || request.headers.get('x-bimba-csrf') !== session.csrf) return json({ error: 'Your session expired. Please try sending again.' }, 403);
    const db = answerDb();
    const savedSubmission = async () => (await db.prepare(
      'SELECT id, session_id, visitor_name, week, question_index, question, answer_type, answer FROM answers WHERE id LIKE ?'
    ).bind(`${submission.id}:%`).all<SavedAnswer>()).results;
    const isSameSubmission = (rows: SavedAnswer[]) => rows.length === submission.entries.length && submission.entries.every(entry => {
      const row = rows.find(saved => saved.id === entry.id);
      return row && row.session_id === session.id && row.visitor_name === submission.name && row.week === entry.week + 1 && row.question_index === entry.index && row.question === entry.question && row.answer_type === entry.type && row.answer === entry.answer;
    });
    const conflict = () => json({ error: 'This message has already been sent. Reopen Chat to start another.' }, 409);
    const previous = await savedSubmission();
    if (previous.length) return isSameSubmission(previous) ? json({ saved: true }) : conflict();
    const count = await db.prepare('SELECT COUNT(*) AS count FROM answers WHERE session_id = ? AND created_at > ?').bind(session.id, Date.now() - 3600000).first<{count: number}>();
    if ((count?.count || 0) + submission.entries.length > 30) return json({ error: 'You’ve shared lots today. Please try again in an hour.' }, 429);

    // D1 executes a batch as one transaction: all question answers arrive with
    // the final name, or none do. A stable submission ID makes retries safe.
    const createdAt = Date.now();
    try {
      await db.batch(submission.entries.map(entry => db.prepare(
        'INSERT INTO answers (id, session_id, visitor, visitor_name, week, question_index, question, answer_type, answer, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(entry.id, session.id, session.tag, submission.name, entry.week + 1, entry.index, entry.question, entry.type, entry.answer, createdAt)));
    } catch (error) {
      // A concurrent retry may win the insert. Never acknowledge a different
      // payload or a partial result as successfully saved.
      const concurrent = await savedSubmission();
      if (concurrent.length) return isSameSubmission(concurrent) ? json({ saved: true }) : conflict();
      throw error;
    }
    return json({ saved: true }, 201);
  } catch {
    return json({ error: 'Your message wasn’t confirmed. Please try again; your answers are still here.' }, 503);
  }
}
