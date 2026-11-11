/**
 * Scroll-driven polish, all cheap and all optional.
 * - Numbers in the hero stats count up once.
 * - Case screenshots drift a few pixels against the page (parallax).
 * Everything bails out under prefers-reduced-motion or a narrow viewport.
 */

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Count-up numbers ---------- */
function countUp() {
  if (reduce) return;
  const targets = document.querySelectorAll<HTMLElement>('[data-count]');
  if (!targets.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);

        const to = Number(el.dataset.count || '0');
        const dur = 900;
        const t0 = performance.now();
        const prefix = el.dataset.countPrefix || '';
        const suffix = el.dataset.countSuffix || '';

        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          // easeOutCubic
          const k = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + Math.round(to * k) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    },
    { threshold: 0.6 }
  );
  targets.forEach((el) => io.observe(el));
}

/* ---------- Screenshot parallax ---------- */
function parallax() {
  if (reduce || window.innerWidth < 900) return;
  const items = Array.from(
    document.querySelectorAll<HTMLElement>('[data-parallax] img')
  );
  if (!items.length) return;

  let ticking = false;

  const update = () => {
    const vh = window.innerHeight;
    for (const img of items) {
      const host = img.closest('[data-parallax]') as HTMLElement | null;
      if (!host) continue;
      const r = host.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      // -1 .. 1 across the viewport
      const mid = r.top + r.height / 2;
      const p = (mid - vh / 2) / vh;
      const shift = Math.max(-14, Math.min(14, p * 18));
      img.style.setProperty('--py', `${shift.toFixed(2)}px`);
    }
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}

countUp();
parallax();
