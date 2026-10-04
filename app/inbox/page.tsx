import { isOwner } from '../../lib/owner';
import { answerDb } from '../../lib/answer-store';
import { chatGPTSignInPath, chatGPTSignOutPath } from '../chatgpt-auth';
import './inbox.css';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Private inbox · bimba', robots: { index:false, follow:false } };
type Answer = {id:string; visitor:string; week:number;question:string;answer_type:string;answer:string;created_at:number};
export default async function Inbox({searchParams}: {searchParams: Promise<{page?:string}>}) {
  const {user,allowed}=await isOwner();
  if (!allowed) return <main className="inbox-shell"><a className="back" href="/">Back to bimba</a><h1>Private inbox</h1><p>{user ? 'This inbox is only available to the website owner. Sign in with the account that owns this site.' : 'Sign in with the ChatGPT account that owns this website to see visitor answers.'}</p><a className="inbox-button" href={user ? chatGPTSignOutPath('/inbox') : chatGPTSignInPath('/inbox')} target="_top">{user ? 'Sign out' : 'Sign in with ChatGPT'}</a></main>;
  const params=await searchParams;
  const page=Math.max(1,Math.min(200,Math.floor(Number(params.page)||1)));
  let rows:Answer[]=[]; let unavailable=false;
  try { const result=await answerDb().prepare('SELECT id, visitor, week, question, answer_type, answer, created_at FROM answers ORDER BY created_at DESC, id DESC LIMIT 31 OFFSET ?').bind((page-1)*30).all<Answer>(); rows=result.results; } catch {unavailable=true;}
  return <main className="inbox-shell"><div className="inbox-top"><a className="back" href="/">Back to bimba</a><a href={chatGPTSignOutPath('/inbox')} target="_top">Sign out</a></div><div className="inbox-title"><div><span className="eyebrow">ONLY YOU CAN SEE THIS</span><h1>Visitor answers</h1></div><a className="inbox-button" href="/inbox">Refresh</a></div><p className="inbox-intro">A little window into everyone’s day. Newest answers appear first.</p>
  {unavailable ? <p className="empty" role="alert">Your inbox couldn’t load. Please refresh to try again.</p> : rows.length===0 ? <div className="empty"><h2>No answers yet</h2><p>Share bimba’s link. Answers will appear here when visitors send them in Chat.</p></div> : <ol className="answer-list">{rows.slice(0,30).map(row=><li key={row.id}><div className="answer-meta"><span>Visitor {row.visitor} · Week {row.week}</span><time dateTime={new Date(row.created_at).toISOString()}>{new Date(row.created_at).toLocaleString('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'})} PT</time></div><h2>{row.question}</h2><p className="answer-text">{row.answer_type==='choice' ? (row.answer==='yes'?'Yes':'No') : row.answer}</p></li>)}</ol>}
  <nav className="inbox-pagination" aria-label="Answer pages">{page>1&&<a href={`/inbox?page=${page-1}`}>Newer answers</a>}<span>Page {page}</span>{rows.length>30&&<a href={`/inbox?page=${page+1}`}>Older answers</a>}</nav></main>;
}
