// Reuses the existing animation bytes; only the surrounding white background is removed at render time.
export function startCompanion() {
  const canvas = document.getElementById('q-canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const video = document.getElementById('q-video');
  const toggle = document.getElementById('motion-toggle');
  const loading = document.getElementById('q-loading');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reducedMotion.matches, animationFrame = 0, lastPaint = 0;
  const w = canvas.width, h = canvas.height;
  const seen = new Uint8Array(w * h), queue = new Int32Array(w * h);

  function draw() {
    if (video.readyState < 2) return;
    try {
      ctx.drawImage(video, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h), data = frame.data;
      seen.fill(0);
      let head = 0, tail = 0;
      const visit = pixel => {
        if (seen[pixel]) return;
        seen[pixel] = 1;
        const i = pixel * 4, r = data[i], g = data[i + 1], b = data[i + 2];
        if (Math.min(r, g, b) > 175 && Math.max(r, g, b) - Math.min(r, g, b) < 24) {
          data[i + 3] = 0; queue[tail++] = pixel;
        }
      };
      for (let x = 0; x < w; x++) { visit(x); visit((h - 1) * w + x); }
      for (let y = 0; y < h; y++) { visit(y * w); visit(y * w + w - 1); }
      while (head < tail) {
        const pixel = queue[head++], x = pixel % w;
        if (x > 0) visit(pixel - 1);
        if (x < w - 1) visit(pixel + 1);
        if (pixel >= w) visit(pixel - w);
        if (pixel < w * (h - 1)) visit(pixel + w);
      }
      ctx.putImageData(frame, 0, 0);
      loading.hidden = true;
    } catch {
      loading.textContent = 'Q is here with you.';
    }
  }

  function tick(time) {
    if (paused || document.hidden) { animationFrame = 0; return; }
    if (time - lastPaint >= 50) { draw(); lastPaint = time; }
    animationFrame = requestAnimationFrame(tick);
  }

  function sync() {
    toggle.textContent = paused ? 'Play animation' : 'Pause animation';
    toggle.setAttribute('aria-pressed', String(paused));
    if (paused || document.hidden) {
      video.pause(); cancelAnimationFrame(animationFrame); animationFrame = 0; draw();
    } else {
      video.play().catch(() => { paused = true; sync(); });
      if (!animationFrame) animationFrame = requestAnimationFrame(tick);
    }
  }

  video.addEventListener('loadeddata', () => { draw(); sync(); });
  video.addEventListener('error', () => {
    paused = true; sync(); loading.hidden = false;
    loading.textContent = 'Q is here with you. The animation couldn’t load.';
  });
  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  document.getElementById('q-character').addEventListener('click', () => {
    document.getElementById('announcement').textContent = 'Hello from Q. Take your time finding your words.';
    if (!paused) video.play().catch(() => {});
  });
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', event => { paused = event.matches; sync(); });
  sync();
}
