(() => {
  const get = id => document.getElementById(id);
  const panel = get('chat-panel'), talk = get('talk'), room = get('room');
  let week = bimbaWeek(), index = 0, answered = false, sending = false;
  let submissionId = crypto.randomUUID();
  const sendStatus = get('chat-send-status');

  function showQuestion() {
    answered = false;
    submissionId = crypto.randomUUID();
    sendStatus.hidden = true;
    get('chat-privacy').hidden = false;
    get('chat-name-field').hidden = false;
    const item = BIMBA_QUESTIONS[week][index];
    get('chat-progress').textContent = `Week ${week + 1} · ${index + 1} of 3`;
    get('chat-question').textContent = item.question;
    get('chat-choices').hidden = item.type !== 'choice';
    get('chat-form').hidden = item.type !== 'text';
    get('chat-answer').value = '';
    get('chat-answer').setCustomValidity('');
    get('chat-reply').hidden = true;
    get('chat-next').hidden = true;
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
    if (answered || sending) return;
    sending = true;
    const buttons = [get('chat-yes'), get('chat-no'), get('chat-close'), get('chat-form').querySelector('button')];
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
        body:JSON.stringify({id:submissionId,week,index,name:get('chat-name').value.trim(),answer:choice || get('chat-answer').value.trim()})
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
    const item = BIMBA_QUESTIONS[week][index];
    get('chat-privacy').hidden = true;
    get('chat-name-field').hidden = true;
    get('chat-choices').hidden = true;
    get('chat-form').hidden = true;
    get('chat-reply').textContent = item.type === 'text' ? item.reply : item[choice];
    get('chat-reply').hidden = false;
    get('chat-next').textContent = index === 2 ? 'Done for now' : 'Next question';
    get('chat-next').hidden = false;
    get('chat-next').focus({ preventScroll: true });
  }

  talk.addEventListener('click', () => {
    if (!panel.hidden) { get('chat-question').focus({ preventScroll: true }); return; }
    const currentWeek = bimbaWeek();
    if (currentWeek !== week) { week = currentWeek; index = 0; }
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
  get('chat-next').addEventListener('click', () => {
    if (!answered) return;
    if (index === 2) { index = 0; closeChat(); } else { index++; showQuestion(); }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); closeChat(); }
  });
})();
