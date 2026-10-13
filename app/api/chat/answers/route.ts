import { answerDb, getSession, json } from '../../../../lib/answer-store';
import { chatContent } from '../../../../public/chat-content.js';
import { validateAnswer } from '../../../../lib/question-validation';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  const url=new URL(request.url);
  if (request.headers.get('origin') !== url.origin || !request.headers.get('content-type')?.startsWith('application/json')) return json({error:'Please submit your answer from this website.'},403);
  try {
    const raw=await request.text();
    if (raw.length>2048) return json({error:'Your answer is too long.'},413);
    let body; try {body=JSON.parse(raw);} catch {return json({error:'Please check your answer.'},400);}
    if (body && body.edition !== chatContent.edition) return json({error:'Chat has been updated. Copy your answer, then refresh the page to see the latest questions.'},409);
    const entry=validateAnswer(body);
    if (!entry) return json({error:'Please check your answer (up to 240 characters).'},400);
    const session=await getSession(request);
    if (!session || request.headers.get('x-bimba-csrf') !== session.csrf) return json({error:'Your session expired. Please try sending again.'},403);
    const db=answerDb();
    const previous=await db.prepare('SELECT session_id FROM answers WHERE id = ?').bind(entry.id).first<{session_id:string}>();
    if (previous) return previous.session_id===session.id ? json({saved:true}) : json({error:'Please reopen Chat and try again.'},409);
    // Bound submissions per anonymous session; retries reuse the same record ID.
    const count=await db.prepare('SELECT COUNT(*) AS count FROM answers WHERE session_id = ? AND created_at > ?').bind(session.id,Date.now()-3600000).first<{count:number}>();
    if ((count?.count || 0)>=30) return json({error:'You’ve shared lots today. Please try again in an hour.'},429);
    await db.prepare('INSERT INTO answers (id, session_id, visitor, visitor_name, week, question_index, question, answer_type, answer, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING').bind(entry.id,session.id,session.tag,entry.name || null,entry.week+1,entry.index,entry.question,entry.type,entry.answer,Date.now()).run();
    return json({saved:true},201);
  } catch { return json({error:'Your answer wasn’t confirmed. Please try again; your text is still here.'},503); }
}
