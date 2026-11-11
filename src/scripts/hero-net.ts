export interface Node {
  x: number; // 0..1
  y: number; // 0..1
  w: number; // px
  h: number; // px
  vx: number;
  vy: number;
  accent: boolean;
  label?: string;
}

/**
 * Hero node network.
 * Nodes are rounded rects (flowchart pieces, not dots) drifting slowly.
 * Edges draw when two nodes are within range. Pointer repels gently.
 * Mobile + reduced motion => one static frame, no loop.
 */
export function initHeroCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => window.innerWidth < 760;

  let dpr = 1;
  let W = 0;
  let H = 0;
  let nodes: Node[] = [];
  let raf = 0;
  let yMin = 0.08;
  let yMax = 0.92;

  const pointer = { x: -9999, y: -9999, active: false };

  function build() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = small() ? 7 : 15;
    // Keep the network on the right so it never fights the headline on the left.
    const cols = small() ? 2 : 4;
    const rows = Math.ceil(count / cols);
    const xMin = small() ? 0.56 : 0.46;
    const xMax = 0.95;
    // On phones the headline owns the middle of the screen, so the network
    // lives in the band above it.
    yMin = small() ? 0.1 : 0.08;
    yMax = small() ? 0.29 : 0.92;
    nodes = [];
    let i = 0;
    for (let r = 0; r < rows && i < count; r++) {
      for (let c = 0; c < cols && i < count; c++) {
        const jx = (Math.sin(i * 12.9898) * 0.5 + 0.5) * 0.7 + 0.15;
        const jy = (Math.sin(i * 78.233) * 0.5 + 0.5) * 0.7 + 0.15;
        const wide = i % 5 === 2;
        nodes.push({
          x: Math.min(xMax, xMin + ((c + jx) / cols) * (xMax - xMin)),
          y: yMin + ((r + jy) / rows) * (yMax - yMin),
          w: wide ? 74 : 34 + (i % 3) * 12,
          h: wide ? 30 : 26,
          vx: (Math.sin(i * 3.1) * 0.5) * 0.00013,
          vy: (Math.cos(i * 5.7) * 0.5) * 0.00013,
          accent: i === 4 || i === 11,
          label: wide ? 'flow' : undefined,
        });
        i++;
      }
    }
  }

  function draw(t: number) {
    ctx!.clearRect(0, 0, W, H);
    const pts = nodes.map((n) => ({
      n,
      px: n.x * W,
      py: n.y * H,
    }));

    // Edges first.
    const range = small() ? 150 : 210;
    for (let a = 0; a < pts.length; a++) {
      for (let b = a + 1; b < pts.length; b++) {
        const dx = pts[a].px - pts[b].px;
        const dy = pts[a].py - pts[b].py;
        const d = Math.hypot(dx, dy);
        if (d > range) continue;
        // Fade out with distance; accent edges slightly warmer.
        const k = 1 - d / range;
        const warm = pts[a].n.accent || pts[b].n.accent;
        ctx!.strokeStyle = warm
          ? `rgba(194, 35, 63, ${k * 0.42})`
          : `rgba(243, 240, 232, ${k * 0.14})`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(pts[a].px, pts[a].py);
        ctx!.lineTo(pts[b].px, pts[b].py);
        ctx!.stroke();
      }
    }

    // Nodes.
    for (const { n, px, py } of pts) {
      const w = n.w;
      const h = n.h;
      const x = px - w / 2;
      const y = py - h / 2;
      const r = 4;
      ctx!.beginPath();
      ctx!.roundRect(x, y, w, h, r);
      ctx!.fillStyle = n.accent ? 'rgba(194, 35, 63, 0.9)' : 'rgba(243, 240, 232, 0.055)';
      ctx!.fill();
      ctx!.strokeStyle = n.accent
        ? 'rgba(194, 35, 63, 1)'
        : 'rgba(243, 240, 232, 0.22)';
      ctx!.lineWidth = 1;
      ctx!.stroke();

      // A tiny inner glyph line so nodes read as objects, not blobs.
      if (w > 45) {
        ctx!.strokeStyle = n.accent
          ? 'rgba(255,255,255,0.55)'
          : 'rgba(243, 240, 232, 0.3)';
        ctx!.beginPath();
        ctx!.moveTo(x + 8, py);
        ctx!.lineTo(x + w - 8, py);
        ctx!.stroke();
      }
    }
  }

  function step(t: number) {
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0.06 || n.x > 0.94) n.vx *= -1;
      if (n.y < yMin || n.y > yMax) n.vy *= -1;

      if (pointer.active && pointer.x > -1000) {
        // Gentle repulsion: keeps the cursor a clear area.
        const px = n.x * W;
        const py = n.y * H;
        const dx = px - pointer.x;
        const dy = py - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < 130 && d > 0.001) {
          const f = (1 - d / 130) * 0.0018;
          n.x += (dx / d) * f;
          n.y += (dy / d) * f;
        }
      }
      n.x = Math.min(0.97, Math.max(0.03, n.x));
      n.y = Math.min(yMax, Math.max(yMin, n.y));
    }
    draw(performance.now());
    raf = requestAnimationFrame(step);
  }

  function start() {
    cancelAnimationFrame(raf);
    if (reduced) {
      draw(performance.now());
      return;
    }
    raf = requestAnimationFrame(step);
  }

  build();
  start();

  // Only animate while visible.
  const vis = new IntersectionObserver(
    (entries) => {
      const visible = entries[0]?.isIntersecting;
      if (reduced) return;
      if (visible) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(step);
      } else {
        cancelAnimationFrame(raf);
      }
    },
    { threshold: 0 }
  );
  vis.observe(canvas);

  const hero = canvas.parentElement;
  hero?.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.active = true;
  });
  hero?.addEventListener('pointerleave', () => {
    pointer.active = false;
  });

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = window.setTimeout(() => {
      build();
      if (reduced) draw(performance.now());
    }, 160);
  });
}
