import { env } from 'cloudflare:workers';
import { answerDb } from '../../../../lib/answer-store';
import { codeKey,consumeAttempt,digest,INBOX_COOKIE,INBOX_DURATION,inboxRedirect,networkBucket } from '../../../../lib/inbox-access';
export const dynamic='force-dynamic';
export async function POST(request:Request) {
  if (request.headers.get('origin')!==new URL(request.url).origin) return new Response('Forbidden',{status:403});
  try {
    if (!env.INBOX_ACCESS_CODE || !env.INBOX_RATE_SALT) return inboxRedirect(request,'unavailable');
    if (!(await consumeAttempt('global',100)) || !(await consumeAttempt(await networkBucket(request),5))) return inboxRedirect(request,'locked');
    const raw=await request.text();
    if(raw.length>128) return inboxRedirect(request,'invalid');
    const code=new URLSearchParams(raw).get('code') || '';
    const expected=await codeKey();
    const entered=await digest(`${env.INBOX_RATE_SALT}:code:${code}`);
    let difference=0; for(let i=0;i<expected.length;i++) difference |= expected.charCodeAt(i)^entered.charCodeAt(i);
    if(difference!==0) return inboxRedirect(request,'invalid');
    const bytes=crypto.getRandomValues(new Uint8Array(32));
    const token=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    const db=answerDb();
    await db.batch([
      db.prepare('INSERT INTO inbox_sessions (token_hash,code_key,expires_at) VALUES (?,?,?)').bind(await digest(token),expected,Date.now()+INBOX_DURATION),
      db.prepare('DELETE FROM inbox_sessions WHERE expires_at < ?').bind(Date.now()),
      db.prepare('DELETE FROM inbox_attempts WHERE resets_at < ?').bind(Date.now())
    ]);
    return inboxRedirect(request,undefined,`${INBOX_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${INBOX_DURATION/1000}`);
  } catch {return inboxRedirect(request,'unavailable');}
}
