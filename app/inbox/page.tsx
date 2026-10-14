import { hasInboxAccess } from '../../lib/inbox-access';
import { answerDb } from '../../lib/answer-store';
import './inbox.css';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Private inbox · Q.alina', robots: { index:false, follow:false } };
type Answer = {id:string; visitor:string;visitor_name:string|null; week:number;question:string;answer_type:string;answer:string;created_at:number};
export default async function Inbox({searchParams}: {searchParams: Promise<{page?:string;error?:string}>}) {
  const params=await searchParams;
  const allowed=await hasInboxAccess();
  if (!allowed) {
    const messages:Record<string,string>={invalid:'That code wasn’t correct. Please try again.',locked:'Too many attempts. Please wait 15 minutes and try again.',unavailable:'The inbox is temporarily unavailable. Please try again.'};
    return <main className="inbox-shell"><a className="back" href="/">Back to Q.alina</a><h1>Private inbox</h1><p>Enter your access code to read visitor messages.</p><form className="inbox-unlock" method="post" action="/api/inbox/unlock"><label htmlFor="inbox-code">Access code</label><input id="inbox-code" name="code" type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="off" required /><button className="inbox-button" type="submit">Open inbox</button></form>{params.error&&messages[params.error]&&<p role="alert">{messages[params.error]}</p>}</main>;
  }
  const page=Math.max(1,Math.min(200,Math.floor(Number(params.page)||1)));
  let rows:Answer[]=[]; let unavailable=false;
  try { const result=await answerDb().prepare('SELECT id, visitor, visitor_name, week, question, answer_type, answer, created_at FROM answers ORDER BY created_at DESC, id DESC LIMIT 31 OFFSET ?').bind((page-1)*30).all<Answer>(); rows=result.results; } catch {unavailable=true;}
  return <main className="inbox-shell"><div className="inbox-top"><a className="back" href="/">Back to Q.alina</a><form method="post" action="/api/inbox/lock"><button className="inbox-button" type="submit">Lock inbox</button></form></div><div className="inbox-title"><div><span className="eyebrow">PRIVATE INBOX</span><h1>Visitor answers</h1></div><a className="inbox-button" href="/inbox">Refresh</a></div><p className="inbox-intro">Newest messages appear first. Names are provided by visitors.</p>
  {unavailable ? <p className="empty" role="alert">Your inbox couldn’t load. Please refresh to try again.</p> : rows.length===0 ? <div className="empty"><h2>No answers yet</h2><p>Share Q.alina’s link. Answers will appear here when visitors send them in Chat.</p></div> : <ol className="answer-list">{rows.slice(0,30).map(row=><li key={row.id}><div className="answer-meta"><span>{row.visitor_name || `Anonymous visitor ${row.visitor}`}</span><time dateTime={new Date(row.created_at).toISOString()}>{new Date(row.created_at).toLocaleString('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'})} PT</time></div><h2>{row.question}</h2><p className="answer-text">{row.answer_type==='choice' ? (row.answer==='yes'?'Yes':'No') : row.answer}</p></li>)}</ol>}
  <nav className="inbox-pagination" aria-label="Answer pages">{page>1&&<a href={`/inbox?page=${page-1}`}>Newer answers</a>}<span>Page {page}</span>{rows.length>30&&<a href={`/inbox?page=${page+1}`}>Older answers</a>}</nav></main>;
}
