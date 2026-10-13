import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { answerDb, noStore } from './answer-store';
export const INBOX_COOKIE='__Host-bimba-inbox';
export const INBOX_DURATION=2*60*60*1000;
export async function digest(value:string) {
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('');
}
export async function codeKey() {
  if (!env.INBOX_ACCESS_CODE || !env.INBOX_RATE_SALT) throw new Error('Inbox access unavailable');
  return digest(`${env.INBOX_RATE_SALT}:code:${env.INBOX_ACCESS_CODE}`);
}
export async function hasInboxAccess() {
  const token=(await cookies()).get(INBOX_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  try {
    const row=await answerDb().prepare('SELECT token_hash FROM inbox_sessions WHERE token_hash = ? AND code_key = ? AND expires_at > ?').bind(await digest(token),await codeKey(),Date.now()).first();
    return !!row;
  } catch { return false; }
}
export function inboxRedirect(request:Request,error?:string,cookie?:string) {
  return new Response(null,{status:303,headers:{...noStore,Location:new URL(error ? `/inbox?error=${error}` : '/inbox',request.url).toString(),...(cookie?{'Set-Cookie':cookie}:{})}});
}
// Count attempts atomically in D1, across restarts and simultaneous requests.
export async function consumeAttempt(bucket:string,limit:number) {
  const now=Date.now();
  const row=await answerDb().prepare(`INSERT INTO inbox_attempts (bucket,attempts,resets_at) VALUES (?,1,?)
    ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN resets_at <= ? THEN 1 ELSE attempts+1 END,
    resets_at=CASE WHEN resets_at <= ? THEN excluded.resets_at ELSE resets_at END RETURNING attempts`).bind(bucket,now+15*60*1000,now,now).first<{attempts:number}>();
  return !!row && row.attempts<=limit;
}
export async function networkBucket(request:Request) {
  if (!env.INBOX_RATE_SALT) throw new Error('Inbox access unavailable');
  return digest(`${env.INBOX_RATE_SALT}:network:${request.headers.get('cf-connecting-ip') || 'unavailable'}`);
}
