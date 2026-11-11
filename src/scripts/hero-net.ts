export interface NetNode {
  x: number; // 0..1
  y: number; // 0..1
  w: number; // px
  h: number;
  vx: number;
  vy: number;
  accent: boolean;
  phase: number;
}

interface Packet {
  a: number;
  b: number;
  t: number;
  speed: number; // px per second
  warm: boolean;
}

/** Soft radial sprite, pre-rendered once — far cheaper than shadowBlur per frame. */
function makeGlow(r: number, g: number, b: number): HTMLCanvasElement {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.95)`);
  grad.addColorStop(0.22, `rgba(${r},${g},${b},0.5)`);
  grad.addColorStop(0.55, `rgba(${r},${g},${b},0.12)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return c;
}

/**
 * Hero node network.
 *
 * Nodes are rounded rects (flowchart pieces, not dots) drifting slowly, joined
 * by hairline edges. Bright packets travel along those edges, and the pointer
 * lifts nearby geometry into light. Glow comes from pre-rendered sprites drawn
 * with 'lighter' — the same additive approach the popular WebGL hero
 * backgrounds use, without shipping a 3D engine.
 *
 * Mobile: fewer nodes in a band above the headline.
 * prefers-reduced-motion: one static frame, no loop.
 */
export function initHeroCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => window.innerWidth < 760;

  const warmGlow = makeGlow(226, 52, 80);
  const coolGlow = makeGlow(243, 240, 232);

  let dpr = 1;
  let W = 0;
  let H = 0;
  let nodes: NetNode[] = [];
  let neighbors: number[][] = [];
  let packets: Packet[] = [];
  let raf = 0;
  let last = 0;

  let yMin = 0.08;
  let yMax = 0.92;

  const pointer = { x: -9999, y: -9999, active: false };
  const eased = { x: -9999, y: -9999 };

  function build() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    const isSmall = small();
    const count = isSmall ? 7 : 13;
    const cols = isSmall ? 3 : 4;
    const rows = Math.ceil(count / cols);
    // Keep the network right of the headline on desktop, and in a band above
    // it on phones.
    const xMin = isSmall ? 0.04 : 0.56;
    const xMax = 0.97;
    yMin = isSmall ? 0.05 : 0.1;
    yMax = isSmall ? 0.2 : 0.9;

    nodes = [];
    let i = 0;
    for (let r = 0; r < rows && i < count; r++) {
      for (let c = 0; c < cols && i < count; c++) {
        const jx = (Math.sin(i * 12.9898) * 0.5 + 0.5) * 0.62 + 0.19;
        const jy = (Math.sin(i * 78.233) * 0.5 + 0.5) * 0.62 + 0.19;
        const wide = i % 4 === 1;
        nodes.push({
          x: Math.min(xMax, xMin + ((c + jx) / cols) * (xMax - xMin)),
          y: yMin + ((r + jy) / rows) * (yMax - yMin),
          w: wide ? 78 : 30 + (i % 3) * 14,
          h: wide ? 30 : 24,
          vx: Math.sin(i * 3.1) * 0.00035,
          vy: Math.cos(i * 5.7) * 0.00028,
          accent: i === 3 || i === 9 || i === 14,
          phase: i * 0.9,
        });
        i++;
      }
    }

    // Static adjacency: packets travel these routes.
    const range = Math.hypot(W, H) * (isSmall ? 0.3 : 0.19);
    neighbors = nodes.map(() => []);
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const dx = (nodes[a].x - nodes[b].x) * W;
        const dy = (nodes[a].y - nodes[b].y) * H;
        if (Math.hypot(dx, dy) < range) {
          neighbors[a].push(b);
          neighbors[b].push(a);
        }
      }
    }

    const edgeCount = neighbors.reduce((n, l) => n + l.length, 0) / 2;
    const packetCount = Math.max(6, Math.min(isSmall ? 8 : 18, Math.round(edgeCount * 1.1)));
    packets = [];
    for (let p = 0; p < packetCount; p++) {
      const a = (p * 3) % nodes.length;
      const list = neighbors[a].length ? neighbors[a] : [(a + 1) % nodes.length];
      const b = list[Math.floor(Math.abs(Math.sin(p * 9.7)) * list.length) % list.length];
      packets.push({
        a,
        b,
        t: Math.abs(Math.sin(p * 4.3)),
        speed: 55 + Math.abs(Math.sin(p * 2.1)) * 75,
        warm: nodes[a].accent || nodes[b].accent || p % 5 === 0,
      });
    }
  }

  function draw(now: number) {
    ctx!.clearRect(0, 0, W, H);

    if (pointer.active) {
      if (eased.x < -1000) {
        eased.x = pointer.x;
        eased.y = pointer.y;
      }
      eased.x += (pointer.x - eased.x) * 0.14;
      eased.y += (pointer.y - eased.y) * 0.14;
    }

    const isSmall = small();
    const range = Math.hypot(W, H) * (isSmall ? 0.3 : 0.19);
    const pts = nodes.map((n) => ({ n, px: n.x * W, py: n.y * H }));

    // --- Edges, additive so crossings brighten ---
    ctx!.globalCompositeOperation = 'lighter';
    for (let a = 0; a < pts.length; a++) {
      for (let b = a + 1; b < pts.length; b++) {
        const dx = pts[a].px - pts[b].px;
        const dy = pts[a].py - pts[b].py;
        const dist = Math.hypot(dx, dy);
        if (dist > range) continue;

        const warm = pts[a].n.accent || pts[b].n.accent;
        let alpha = 0.03 + (1 - dist / range) * 0.09;
        if (pointer.active && eased.x > -1000) {
          const mx = (pts[a].px + pts[b].px) / 2;
          const my = (pts[a].py + pts[b].py) / 2;
          const d = Math.hypot(mx - eased.x, my - eased.y);
          if (d < 280) alpha += (1 - d / 280) * 0.42;
        }
        alpha = Math.min(0.6, alpha);

        const grad = ctx!.createLinearGradient(pts[a].px, pts[a].py, pts[b].px, pts[b].py);
        const rgb = warm ? '226,52,80' : '243,240,232';
        grad.addColorStop(0, `rgba(${rgb},${alpha})`);
        grad.addColorStop(1, `rgba(${rgb},${alpha * 0.5})`);

        ctx!.strokeStyle = grad;
        ctx!.lineWidth = warm ? 1.15 : 1;
        ctx!.beginPath();
        ctx!.moveTo(pts[a].px, pts[a].py);
        ctx!.lineTo(pts[b].px, pts[b].py);
        ctx!.stroke();
      }
    }

    // --- Packets travelling the edges ---
    for (const pk of packets) {
      const A = pts[pk.a];
      const B = pts[pk.b];
      if (!A || !B) continue;
      const x = A.px + (B.px - A.px) * pk.t;
      const y = A.py + (B.py - A.py) * pk.t;
      const g = pk.warm ? warmGlow : coolGlow;
      const size = pk.warm ? 26 : 20;
      ctx!.drawImage(g, x - size / 2, y - size / 2, size, size);
      ctx!.fillStyle = pk.warm ? 'rgba(255,196,206,0.95)' : 'rgba(255,255,255,0.9)';
      ctx!.beginPath();
      ctx!.arc(x, y, 1.7, 0, Math.PI * 2);
      ctx!.fill();
    }

    // --- Pointer light ---
    if (pointer.active && eased.x > -1000) {
      const R = 320;
      const g = ctx!.createRadialGradient(eased.x, eased.y, 0, eased.x, eased.y, R);
      g.addColorStop(0, 'rgba(226,52,80,0.12)');
      g.addColorStop(0.45, 'rgba(226,52,80,0.04)');
      g.addColorStop(1, 'rgba(226,52,80,0)');
      ctx!.fillStyle = g;
      ctx!.fillRect(eased.x - R, eased.y - R, R * 2, R * 2);
    }

    ctx!.globalCompositeOperation = 'source-over';

    // --- Nodes ---
    for (const { n, px, py } of pts) {
      const pulse = n.accent ? 0.5 + 0.5 * Math.sin(now / 900 + n.phase) : 0;
      const w = n.w * (n.accent ? 1 + pulse * 0.05 : 1);
      const h = n.h;
      const x = px - w / 2;
      const y = py - h / 2;

      let near = 0;
      if (pointer.active && eased.x > -1000) {
        const d = Math.hypot(px - eased.x, py - eased.y);
        near = Math.max(0, 1 - d / 320);
      }

      if (n.accent) {
        const size = 62 + pulse * 18;
        ctx!.globalCompositeOperation = 'lighter';
        ctx!.drawImage(warmGlow, px - size / 2, py - size / 2, size, size);
        ctx!.globalCompositeOperation = 'source-over';
      }
      if (near > 0.02) {
        const size = 150 * near + 40;
        ctx!.globalCompositeOperation = 'lighter';
        ctx!.globalAlpha = 0.55 * near;
        ctx!.drawImage(coolGlow, px - size / 2, py - size / 2, size, size);
        ctx!.globalAlpha = 1;
        ctx!.globalCompositeOperation = 'source-over';
      }

      ctx!.beginPath();
      ctx!.roundRect(x, y, w, h, 4);
      ctx!.fillStyle = n.accent
        ? `rgba(226,52,80,${0.78 + pulse * 0.22})`
        : `rgba(243,240,232,${0.07 + near * 0.16})`;
      ctx!.fill();
      ctx!.strokeStyle = n.accent
        ? `rgba(255,150,170,${0.8 + pulse * 0.2})`
        : `rgba(243,240,232,${0.34 + near * 0.55})`;
      ctx!.lineWidth = 1;
      ctx!.stroke();

      // Inner glyph line so nodes read as objects rather than blobs.
      if (w > 45) {
        ctx!.strokeStyle = n.accent
          ? 'rgba(255,255,255,0.72)'
          : `rgba(243,240,232,${0.3 + near * 0.5})`;
        ctx!.beginPath();
        ctx!.moveTo(x + 9, py);
        ctx!.lineTo(x + w - 9, py);
        ctx!.stroke();
      }
    }
  }

  function advance(dt: number) {
    for (const n of nodes) {
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      if (n.x < 0.03 || n.x > 0.98) n.vx *= -1;
      if (n.y < yMin - 0.02 || n.y > yMax + 0.02) n.vy *= -1;
      n.x = Math.min(0.98, Math.max(0.03, n.x));
      n.y = Math.min(yMax + 0.02, Math.max(yMin - 0.02, n.y));
    }

    for (const pk of packets) {
      const A = nodes[pk.a];
      const B = nodes[pk.b];
      if (!A || !B) continue;
      const len = Math.hypot((A.x - B.x) * W, (A.y - B.y) * H) || 1;
      pk.t += (pk.speed / len) * dt;
      if (pk.t >= 1) {
        pk.t -= 1;
        const at = pk.b;
        const options = neighbors[at] && neighbors[at].length ? neighbors[at] : [at];
        const next = options[Math.floor(Math.random() * options.length)];
        pk.a = at;
        pk.b = next === at ? (at + 1) % nodes.length : next;
        pk.warm = nodes[pk.a].accent || nodes[pk.b].accent || Math.random() < 0.2;
      }
    }
  }

  function loop(now: number) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    advance(dt);
    draw(now);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    cancelAnimationFrame(raf);
    last = 0;
    if (reduced) {
      draw(performance.now());
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  build();
  start();

  // Animate only while the canvas is on screen.
  const vis = new IntersectionObserver(
    (entries) => {
      if (reduced) return;
      if (entries[0]?.isIntersecting) {
        if (!raf) {
          last = 0;
          raf = requestAnimationFrame(loop);
        }
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    { threshold: 0 }
  );
  vis.observe(canvas);

  const host = canvas.parentElement;
  host?.addEventListener(
    'pointermove',
    (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
    },
    { passive: true }
  );
  host?.addEventListener('pointerleave', () => {
    pointer.active = false;
    eased.x = -9999;
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
