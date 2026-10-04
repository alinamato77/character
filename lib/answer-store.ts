import { env } from 'cloudflare:workers';
export function answerDb() {
  if (!env.DB) throw new Error('Answer storage is unavailable');
  return env.DB;
}
export const noStore = { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff' };
export function json(body: unknown, status = 200, headers = {}) {
  return Response.json(body, {status,headers:{...noStore,...headers}});
}
export function sessionId(request: Request) {
  return request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-bimba-visitor=([a-f0-9-]{36})(?:;|$)/)?.[1] || '';
}
export async function getSession(request: Request) {
  return answerDb().prepare('SELECT id, csrf, tag, created_at FROM visitor_sessions WHERE id = ? AND created_at > ?').bind(sessionId(request),Date.now()-86400000).first<{id:string;csrf:string;tag:string;created_at:number}>();
}
