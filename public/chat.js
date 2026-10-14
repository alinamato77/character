import { chatContent } from './chat-content.js';
import { moodReply } from './chat-mood.js';

(() => {
  const get = id => document.getElementById(id);
  const panel = get('chat-panel'), talk = get('talk'), room = get('room');
  const input = get('chat-answer'), form = get('chat-form');
  const next = get('chat-next'), title = get('chat-question');
  const mail = get('chat-mail'), status = get('chat-send-status');
  // Flow: announcement → mood → mood reply → hangout → [date → reply] → name → sending → sent.
  let step = 'announcement', reply = '', afterReply = '', timer;
  let sending = false, submissionId = crypto.randomUUID(), pending = null;
  let draft = { mood: '', hangout: '', 'available-date': '', name: '' };
  const question = id => chatContent.questions.find(q => q.id === id);
  const isInput = () => ['mood', 'available-date', 'name'].includes(step);

  function stopTimer() { clearTimeout(timer); }
  function scheduleReply() {
    stopTimer();
    if (step === 'reply' && !panel.hidden && !document.hidden) {
      timer = setTimeout(() => { step = afterReply; render(); }, 2600);
    }
  }
  function render() {
    stopTimer();
    const announcement = step === 'announcement';
    panel.setAttribute('data-view', announcement ? 'announcement' : 'conversation');
    panel.setAttribute('aria-busy', String(sending));
    panel.setAttribute('aria-labelledby', announcement ? 'chat-progress' : 'chat-question');
    get('chat-progress').textContent = announcement ? 'A note from me · This week' : '';
    get('chat-announcement').hidden = !announcement;
    get('chat-announcement-text').textContent = chatContent.announcement;
    get('chat-signature').textContent = chatContent.signature;
    title.hidden = announcement;
    title.textContent = announcement ? '' : step === 'reply' ? reply : step === 'name' ? chatContent.nameQuestion : step === 'sending' ? chatContent.replies.sending : step === 'sent' ? chatContent.replies.sent : question(step).text;
    get('chat-choices').hidden = step !== 'hangout';
    form.hidden = !isInput();
    input.readOnly = sending || (step === 'name' && !!pending);
    input.maxLength = step === 'name' ? 40 : 240;
    input.placeholder = step === 'name' ? chatContent.namePlaceholder : (question(step)?.placeholder || '');
    input.autocomplete = step === 'name' ? 'nickname' : 'off';
    input.setAttribute('aria-label', step === 'name' ? chatContent.nameQuestion : (question(step)?.text || 'Your answer'));
    if (isInput()) input.value = draft[step];
    input.setCustomValidity('');
    get('chat-submit').textContent = step === 'name' ? chatContent.buttons.send : chatContent.buttons.next;
    status.hidden = true;
    mail.hidden = !['sending','sent'].includes(step);
    mail.setAttribute('data-state', step === 'sent' ? 'sent' : 'sending');
    next.hidden = !announcement && step !== 'sent';
    next.textContent = announcement ? chatContent.openingButton : chatContent.buttons.done;
    get('chat-close').disabled = sending;
    // Focus the input directly for each question; responses are announced without an extra box.
    if (!panel.hidden) (isInput() ? input : announcement || step === 'sent' ? next : title).focus({preventScroll:true});
    scheduleReply();
  }
  function showReply(text, destination) {
    reply = text; afterReply = destination; step = 'reply'; render();
  }
  function closeChat() {
    if (sending) return;
    if (isInput()) draft[step] = input.value;
    stopTimer(); panel.hidden = true; room.classList.remove('has-chat');
    talk.setAttribute('aria-expanded','false'); talk.focus({preventScroll:true});
  }
  function reset() {
    draft = {mood:'',hangout:'','available-date':'',name:''};
    pending = null; submissionId = crypto.randomUUID(); step = 'announcement';
  }
  async function sendLetter() {
    if (sending) return;
    // Freeze the full letter and ID for safe retries; never save partial replies.
    pending ||= {
      id: submissionId, edition: chatContent.edition, name: draft.name.trim(),
      answers: ['mood','hangout',...(draft.hangout === 'yes' ? ['available-date'] : [])].map(questionId => ({questionId,answer:draft[questionId].trim()}))
    };
    sending = true; step = 'sending'; render();
    const animation = new Promise(resolve => setTimeout(resolve, 1000));
    try {
      const sessionResponse = await fetch('/api/chat/session',{cache:'no-store'});
      const session = await sessionResponse.json();
      if (!sessionResponse.ok || !session.csrf) throw new Error('session');
      const response = await fetch('/api/chat/answers',{
        method:'POST',headers:{'Content-Type':'application/json','X-Bimba-CSRF':session.csrf},body:JSON.stringify(pending)
      });
      const result = await response.json();
      if (!response.ok || !result.saved) throw new Error('save');
      await animation;
      sending = false; step = 'sent'; render();
    } catch {
      sending = false; step = 'name'; render();
      // Keep all answers and the same submission ID. Never show sent on a failed request.
      status.textContent = chatContent.replies.error; status.hidden = false;
    }
  }
  talk.addEventListener('click', () => {
    if (!panel.hidden) return;
    if (step === 'sent') reset();
    panel.hidden = false; room.classList.add('has-chat'); talk.setAttribute('aria-expanded','true'); render();
  });
  get('chat-close').addEventListener('click',closeChat);
  next.addEventListener('click', () => {
    if (step === 'announcement') { step = 'mood'; render(); }
    else if (step === 'sent') { closeChat(); reset(); }
  });
  function choose(answer) {
    if (step !== 'hangout') return;
    draft.hangout = answer;
    if (answer === 'yes') { step = 'available-date'; render(); }
    else { draft['available-date'] = ''; showReply(chatContent.replies.declined,'name'); }
  }
  get('chat-yes').addEventListener('click',() => choose('yes'));
  get('chat-no').addEventListener('click',() => choose('no'));
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!isInput() || sending) return;
    const value = input.value.trim();
    if (!value || value.length > input.maxLength) {
      input.setCustomValidity(step === 'name' ? 'your name?' : 'write a little first..'); input.reportValidity(); return;
    }
    draft[step] = value;
    if (step === 'mood') showReply(moodReply(value),'hangout');
    else if (step === 'available-date') showReply(chatContent.replies.schedule,'name');
    else return sendLetter();
  });
  input.addEventListener('input', () => input.setCustomValidity(''));
  document.addEventListener('visibilitychange',scheduleReply);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); closeChat(); }
  });
})();
