(() => {
  const get = id => document.getElementById(id);
  const panel = get('chat-panel'), talk = get('talk'), room = get('room');
  let week = bimbaWeek(), index = 0, answered = false;

  function showQuestion() {
    answered = false;
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
    panel.hidden = true;
    room.classList.remove('has-chat');
    talk.setAttribute('aria-expanded', 'false');
    talk.focus({ preventScroll: true });
  }

  function answer(choice) {
    if (answered) return;
    answered = true;
    const item = BIMBA_QUESTIONS[week][index];
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
    answer();
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
