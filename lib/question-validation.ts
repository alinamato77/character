import { questionWeeks } from './question-data';
export function validateAnswer(body: unknown) {
  if (!body || typeof body !== 'object') return null;
  const b=body as Record<string,unknown>;
  if (typeof b.id !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(b.id)) return null;
  if (!Number.isInteger(b.week) || !Number.isInteger(b.index)) return null;
  const week=b.week as number, index=b.index as number;
  const q=questionWeeks[week]?.[index];
  if (!q || typeof b.answer !== 'string') return null;
  const answer=b.answer.trim();
  if (!answer || answer.length>240 || (q.type==='choice' && !['yes','no'].includes(answer))) return null;
  if (b.name !== undefined && (typeof b.name !== 'string' || b.name.trim().length>40)) return null;
  const name=typeof b.name==='string' ? b.name.trim() : '';
  return {id:b.id,week,index,question:q.question,type:q.type,answer,name};
}
