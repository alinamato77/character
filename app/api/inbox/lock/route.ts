import { answerDb, noStore } from '../../../../lib/answer-store';
import { digest, INBOX_COOKIE, inboxRedirect } from '../../../../lib/inbox-access';
export const dynamic='force-dynamic';
export async function POST(request:Request) {
  if(request.headers.get('origin')!==new URL(request.url).origin) return new Response('Forbidden',{status:403});
  const token=request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-bimba-inbox=([a-f0-9]{64})(?:;|$)/)?.[1];
  try {if(token) await answerDb().prepare('DELETE FROM inbox_sessions WHERE token_hash = ?').bind(await digest(token)).run();}
  catch {return new Response('Could not lock the inbox. Please try again.',{status:503,headers:noStore});}
  return inboxRedirect(request,undefined,`${INBOX_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}
