const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../public/questions.js'), 'utf8');
let failSave = false, posted = [];
const ctx = vm.createContext({ Date, crypto:require('node:crypto').webcrypto, fetch:async (url,options) => { if(url.endsWith('/session')) return {ok:true,json:async()=>({csrf:'test-csrf'})}; posted.push(JSON.parse(options.body)); return {ok:!failSave,json:async()=>failSave?{error:'Please try again.'}:{saved:true}}; } });
vm.runInContext(source, ctx);
const weeks = vm.runInContext('BIMBA_QUESTIONS', ctx);
assert.equal(weeks.length, 4);
assert(weeks.every(w => w.length === 3));
assert.equal(new Set(weeks.flat().map(q => q.question)).size, 12);
for (const [date, week] of [['2026-10-04T00:00:00',0],['2026-10-10T23:59:59',0],['2026-10-11T00:00:00',1],['2026-10-18T00:00:00',2],['2026-10-25T00:00:00',3],['2026-11-01T00:00:00',0],['2026-11-08T00:00:00',1]]) {
  assert.equal(vm.runInContext(`bimbaWeek(new Date('${date}'))`,ctx), week);
}
const els = new Map(), documentEvents = {};
const el = id => {
  if (!els.has(id)) els.set(id,{hidden:true,value:'',textContent:'',events:{},classList:{add(){},remove(){}},setAttribute(){},querySelector(){return el('send-button');},focus(){},setCustomValidity(v){this.validity=v;},reportValidity(){},addEventListener(type,fn){this.events[type]=fn;}});
  return els.get(id);
};
ctx.document = {getElementById:el,addEventListener(type,fn){documentEvents[type]=fn;}};
vm.runInContext('bimbaWeek = () => 0',ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/chat.js'),'utf8'),ctx);
const click = id => el(id).events.click();
(async () => {
click('talk');
assert.equal(el('chat-panel').hidden,false);
assert.equal(el('chat-form').hidden,false);
assert.equal(el('chat-choices').hidden,true);
el('chat-answer').value='   ';el('chat-form').events.submit({preventDefault(){}});
assert.equal(el('chat-reply').hidden,true);
assert(el('chat-answer').validity);
el('chat-answer').value='<img onerror=alert(1)>';
failSave=true; await el('chat-form').events.submit({preventDefault(){}}); assert.equal(el('chat-form').hidden,false); assert.equal(el('chat-answer').value,'<img onerror=alert(1)>');
const retryId=posted[0].id; failSave=false; await el('chat-form').events.submit({preventDefault(){}}); assert.equal(posted[1].id,retryId);
assert.equal(el('chat-reply').textContent,weeks[0][0].reply);
assert.equal(el('chat-form').hidden,true);
click('chat-next');await click('chat-no');assert.equal(el('chat-reply').textContent,weeks[0][1].no);
click('chat-close');click('talk');await click('chat-yes');assert.equal(el('chat-reply').textContent,weeks[0][1].yes);
click('chat-next');await click('chat-no');assert.equal(el('chat-reply').textContent,'OK, I can find someone else!');
click('chat-close');click('talk');await click('chat-yes');assert.equal(el('chat-reply').textContent,'Great! I will buy tickets for us!');
click('chat-next');assert.equal(el('chat-panel').hidden,true);
click('talk');assert.equal(el('chat-question').textContent,weeks[0][0].question);
documentEvents.keydown({key:'Escape',preventDefault(){}});assert.equal(el('chat-panel').hidden,true);
console.log('Passed: 12 questions; weekly boundaries and repeat; typed answer validation; Yes/No replies; next, close, reopen, and Escape.');

})().catch(error=>{console.error(error);process.exitCode=1;});
