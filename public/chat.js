import { chatContent } from './chat-content.js';
(() => {
  const get = id => document.getElementById(id);
  const panel = get('chat-panel'), talk = get('talk'), room = get('room');
  let index = -1, answered = false, sending = false;
  const current = () => chatContent.conversation[index];
  let submissionId = crypto.randomUUID();
  const sendStatus = get('chat-send-status');

  function showQuestion() {
    answered = false;
    submissionId = crypto.randomUUID();
    sendStatus.hidden = true;
    const item = current();
    const isQuestion = item && ['text', 'choice'].includes(item.type);
    panel.setAttribute('data-view', index === -1 ? 'announcement' : 'conversation');
    get('chat-announcement-text').textContent = chatContent.announcement;
    get('chat-announcement').hidden = index !== -1;
    get('chat-progress').textContent = index === -1 ? 'A note from me · This week' : (isQuestion ? item.topic : 'A little company');
    get('chat-question').textContent = index === -1 ? 'Hey, you.' : item.text;
    get('chat-name-field').hidden = !isQuestion;
    get('chat-choices').hidden = !isQuestion || item.type !== 'choice';
    get('chat-form').hidden = !isQuestion || item.type !== 'text';
    get('chat-answer').value = '';
    get('chat-answer').setCustomValidity('');
    get('chat-reply').hidden = true;
    get('chat-next').hidden = !!isQuestion;
    get('chat-next').textContent = index === -1 ? chatContent.openingButton : (item.button || 'Keep chatting');
    get('chat-skip').hidden = !isQuestion;
    get('chat-question').focus({ preventScroll: true });
  }

  function closeChat() {
    if (sending) return;
    panel.hidden = true;
    room.classList.remove('has-chat');
    talk.setAttribute('aria-expanded', 'false');
    talk.focus({ preventScroll: true });
  }

  async function answer(choice) {
    if (answered || sending || !current() || !['text','choice'].includes(current().type)) return;
    sending = true;
    const buttons = [get('chat-yes'), get('chat-no'), get('chat-close'), get('chat-form').querySelector('button'), get('chat-skip')];
    buttons.forEach(button => { button.disabled = true; });
    get('chat-answer').readOnly = true;
    get('chat-name').readOnly = true;
    sendStatus.textContent = 'Sending…';
    sendStatus.hidden = false;
    try {
      const sessionResponse = await fetch('/api/chat/session', {cache:'no-store'});
      const session = await sessionResponse.json();
      if (!sessionResponse.ok || !session.csrf) throw new Error(session.error || 'Chat is temporarily unavailable. Please try again.');
      const response = await fetch('/api/chat/answers', {
        method:'POST', headers:{'Content-Type':'application/json','X-Bimba-CSRF':session.csrf},
        body:JSON.stringify({id:submissionId,edition:chatContent.edition,questionId:current().id,name:get('chat-name').value.trim(),answer:choice || get('chat-answer').value.trim()})
      });
      const result = await response.json();
      if (!response.ok || !result.saved) throw new Error(result.error || 'Your answer wasn’t confirmed. Please try again.');
      answered = true;
      sendStatus.textContent = 'Sent privately. Thank you!';
    } catch (error) {
      sendStatus.textContent = error instanceof Error ? error.message : 'Couldn’t send. Please try again.';
      return;
    } finally {
      sending = false;
      buttons.forEach(button => { button.disabled = false; });
      get('chat-answer').readOnly = false;
      get('chat-name').readOnly = false;
    }
    const item = current();
    get('chat-name-field').hidden = true;
    get('chat-choices').hidden = true;
    get('chat-form').hidden = true;
    get('chat-reply').textContent = item.type === 'text' ? item.reply : item[choice];
    get('chat-reply').hidden = false;
    get('chat-skip').hidden = true;
    get('chat-next').textContent = 'Keep chatting';
    get('chat-next').hidden = false;
    get('chat-next').focus({ preventScroll: true });
  }

  talk.addEventListener('click', () => {
    if (!panel.hidden) { get('chat-question').focus({ preventScroll: true }); return; }
    index = -1;
    panel.hidden = false;
    room.classList.add('has-chat');
    talk.setAttribute('aria-expanded', 'true');
    showQuestion();
  });
  get('chat-close').addEventListener('click', closeChat);
  get('chat-yes').addEventListener('click', () => answer('yes'));
  get('chat-no').addEventListener('click', () => answer('no'));
  get('chat-form').addEventListener('submit', event => {
    event.preventDefault();
    const input = get('chat-answer');
    if (!input.value.trim()) {
      input.setCustomValidity('Write a little answer first.');
      input.reportValidity();
      return;
    }
    return answer();
  });
  get('chat-answer').addEventListener('input', () => get('chat-answer').setCustomValidity(''));
  function advance() {
    if (sending) return;
    if (index >= chatContent.conversation.length - 1) { closeChat(); return; }
    index++;
    showQuestion();
  }
  get('chat-next').addEventListener('click', () => {
    if (index === -1 || current().type === 'chat' || answered) advance();
  });
  get('chat-skip').addEventListener('click', advance);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); closeChat(); }
  });
})();
