(() => {
  const footer = document.querySelector('.tips-footer');
  const tips = [...footer.querySelectorAll('.tip')];
  const toggle = document.getElementById('tips-pause');
  let index = 0, paused = false, hovering = false, timer;
  const blocked = () => paused || hovering || document.hidden || footer.contains(document.activeElement);
  function schedule() {
    clearTimeout(timer);
    if (!blocked()) timer = setTimeout(advance, 5000);
  }
  function advance() {
    if (blocked()) return;
    const previous = tips[index];
    index = (index + 1) % tips.length;
    const next = tips[index];
    previous.classList.remove('active');
    previous.classList.add('leaving');
    next.hidden = false;
    next.classList.add('active', 'entering');
    setTimeout(() => {
      previous.hidden = true;
      previous.classList.remove('leaving');
      next.classList.remove('entering');
    }, 480);
    schedule();
  }
  footer.addEventListener('pointerenter', () => { hovering = true; schedule(); });
  footer.addEventListener('pointerleave', () => { hovering = false; schedule(); });
  footer.addEventListener('focusin', schedule);
  footer.addEventListener('focusout', () => setTimeout(schedule, 0));
  document.addEventListener('visibilitychange', schedule);
  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} interaction tips`);
    toggle.firstElementChild.textContent = paused ? '▶' : 'Ⅱ';
    schedule();
  });
  schedule();
})();
