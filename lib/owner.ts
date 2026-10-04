import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../app/chatgpt-auth';
export async function isOwner() {
  const user=await getChatGPTUser();
  const owner=env.INBOX_OWNER_EMAIL?.trim().toLowerCase();
  return {user, allowed: !!(owner && user?.userId && user.email.toLowerCase()===owner)};
}
