import { answerDb, getSession, json } from '../../../../lib/answer-store';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    if (request.headers.get('sec-fetch-site') === 'cross-site') return json({error:'Please open Chat on this website.'},403);
    const existing = await getSession(request);
    if (existing) return json({csrf:existing.csrf});
    const id=crypto.randomUUID(), csrf=crypto.randomUUID(), tag=crypto.randomUUID().slice(0,8);
    const db=answerDb();
    await db.batch([
      db.prepare('INSERT INTO visitor_sessions (id, csrf, tag, created_at) VALUES (?, ?, ?, ?)').bind(id,csrf,tag,Date.now()),
      db.prepare('DELETE FROM visitor_sessions WHERE created_at < ?').bind(Date.now()-86400000)
    ]);
    return json({csrf},200,{'Set-Cookie':`__Host-bimba-visitor=${id}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`});
  } catch { return json({error:'Chat is temporarily unavailable. Please try again.'},503); }
}
