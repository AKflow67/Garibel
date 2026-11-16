(() => {
  const d = document, $ = s => d.querySelector(s), $$ = s => [...d.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  d.body.classList.add('js');

  // Titre : apparition mot par mot
  const h1 = $('.hero h1');
  if (h1) h1.innerHTML = h1.textContent.trim().split(/\s+/).map((w, i) =>
    '<span class="w"><span style="transition-delay:' + (i * 80) + 'ms">' + w + '</span></span>').join(' ');
  requestAnimationFrame(() => requestAnimationFrame(() => d.body.classList.add('ready')));

  // Apparitions au scroll
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
  }), { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  $$('.r').forEach(el => io.observe(el));

  // Progression + en-tete
  const hdr = $('#hdr'), root = d.documentElement;
  const onScroll = () => {
    const y = scrollY, max = d.body.scrollHeight - innerHeight;
    root.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    hdr.classList.toggle('solid', y > 60);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Cartes : halo qui suit le curseur
  $$('.card').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  // ---------- Jeu : la mini-pelle suit vraiment la souris ----------
  const svg = $('#pelle'), hero = $('.hero');
  if (svg) {
    const boom = $('#boom'), stick = $('#stick'), bucket = $('#bucket'), heap = $('#heap'), trench = $('#trench');
    const truck = $('#truck'), loadEl = $('#load'), hint = $('#hint'), sIn = $('#sc-in'), sOut = $('#sc-out'), sGo = $('#sc-go');
    const cl = (v, a, b) => Math.max(a, Math.min(b, v));
    // Geometrie du bras (repere du SVG)
    const P1 = [248, 246], L1 = 141.5, L2 = 109.6, A0 = Math.atan2(-96, 104), B0 = Math.atan2(86, 68);
    const ik = (tx, ty) => {
      const dx = tx - P1[0], dy = ty - P1[1], dist = cl(Math.hypot(dx, dy), 45, L1 + L2 - 1), th = Math.atan2(dy, dx);
      const al = Math.acos(cl((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1)), a1 = th - al;
      const ex = P1[0] + L1 * Math.cos(a1), ey = P1[1] + L1 * Math.sin(a1);
      const a2 = Math.atan2(P1[1] + dist * Math.sin(th) - ey, P1[0] + dist * Math.cos(th) - ex);
      const a = a1 - A0, b = a2 - B0 - a;
      return [a * 180 / Math.PI, b * 180 / Math.PI];
    };
    const TR = [334, 410], BEN = [442, 522], BTOP = 262, FULL = 4;
    let n = 0, load = 0, loaded = false, leaving = false, inB = 0, out = 0, gone = 0;
    let tgt = { x: 392, y: 240 }, cur = { x: 392, y: 240 }, lastInput = -1e9, demo = true, sayUntil = 0;
    const floor = x => (x > TR[0] && x < TR[1]) ? 316 + n * 7 : (x > BEN[0] - 8 && x < BEN[1] + 8 ? BTOP - 6 : 307);
    const clampT = p => {
      let x = cl(p.x, 318, 545), y = cl(p.y, 110, floor(x));
      const dx = x + 2 - P1[0], dy = y - 26 - P1[1], dist = Math.hypot(dx, dy), max = L1 + L2 - 3;
      if (dist > max) { x = P1[0] + dx / dist * max - 2; y = Math.min(P1[1] + dy / dist * max + 26, floor(x)); }
      return { x, y };
    };
    const level = () => { trench.style.transform = 'scaleY(' + (.1 + .9 * n / 6) + ')'; };
    const say = (t, ms) => { hint.textContent = t; sayUntil = performance.now() + (ms || 0); };
    const idleHint = () => {
      if (performance.now() < sayUntil) return;
      hint.textContent = loaded ? 'Amenez le godet au-dessus de la benne, puis cliquez pour vider'
        : 'Descendez le godet dans la terre devant la pelle, puis cliquez';
    };
    const drop = (toY) => {
      for (let i = 0; i < 8; i++) {
        const c = d.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', cur.x + Math.random() * 16 - 8); c.setAttribute('cy', cur.y - 8);
        c.setAttribute('r', 1.6 + Math.random() * 2.6); c.setAttribute('class', 'dirt');
        c.style.setProperty('--dx', (Math.random() * 14 - 7) + 'px');
        c.style.setProperty('--dy', Math.max(8, toY - cur.y + 8) + 'px');
        c.style.animationDelay = (i * 40) + 'ms';
        svg.appendChild(c); setTimeout(() => c.remove(), 1300);
      }
    };
    const score = () => { sIn.textContent = inB; sOut.textContent = out; sGo.textContent = gone; };
    const act = () => {
      if (leaving) return;
      if (!loaded) {
        if (cur.x > TR[0] - 6 && cur.x < TR[1] + 6 && cur.y >= 303) {
          loaded = true; n = Math.min(n + 1, 6); level(); heap.style.opacity = 1; sayUntil = 0;
        } else say('Le godet est vide : plantez-le d\'abord dans la terre, devant la pelle', 2200);
        return;
      }
      loaded = false; heap.style.opacity = 0;
      const ok = cur.x > BEN[0] && cur.x < BEN[1] && cur.y <= BTOP + 4;
      if (ok) {
        drop(284); if (!demo) inB++;
        setTimeout(() => {
          load++; loadEl.style.transform = 'scaleY(' + Math.min(load / FULL, 1) + ')';
          if (load >= FULL) {
            leaving = true; say('Benne pleine, elle part à la décharge', 2600);
            setTimeout(() => { truck.classList.add('go'); if (!demo) gone++; score(); }, 500);
            setTimeout(() => { load = 0; loadEl.style.transform = 'scaleY(0)'; }, 1600);
            setTimeout(() => { truck.classList.remove('go'); leaving = false; }, 2100);
          }
        }, 650);
      } else {
        drop(floor(cur.x)); if (!demo) out++;
        say('À côté ! La terre retombe et rebouche le trou', 2400);
        setTimeout(() => { n = Math.max(0, n - 1); level(); }, 650);
      }
      score();
    };
    const apply = () => {
      const r = ik(cur.x + 2, cur.y - 26), c = -(r[0] + r[1]) * .9 + (loaded ? 22 : 0);
      boom.style.transform = 'rotate(' + r[0].toFixed(2) + 'deg)';
      stick.style.transform = 'rotate(' + r[1].toFixed(2) + 'deg)';
      bucket.style.transform = 'rotate(' + c.toFixed(2) + 'deg)';
    };
    const toSvg = e => { const m = svg.getScreenCTM(); return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : tgt; };
    const takeover = () => { if (demo) { demo = false; loaded = false; heap.style.opacity = 0; sayUntil = 0; } };
    level(); apply(); idleHint();
    if (!calm) {
      hero.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        takeover(); tgt = clampT(toSvg(e)); lastInput = performance.now();
      });
      hero.addEventListener('pointerdown', e => {
        if (e.target.closest('a,button')) return;
        const touch = e.pointerType !== 'mouse';
        if (touch && !e.target.closest('.stage')) return;
        takeover(); tgt = clampT(toSvg(e)); lastInput = performance.now();
        if (touch) setTimeout(act, 450); else act();
      });
      // Demonstration automatique quand personne ne joue
      const script = [[372, 340, 1300, 1], [395, 200, 900, 0], [482, 250, 1100, 1], [400, 215, 900, 0]];
      let si = 0, st = 0, visible = true, prev = 0;
      new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(hero);
      const loop = now => {
        requestAnimationFrame(loop); if (!visible) { prev = now; return; }
        const dt = Math.min(60, now - (prev || now)); prev = now;
        if (now - lastInput > 6000) {
          demo = true; const s = script[si]; tgt = clampT({ x: s[0], y: s[1] }); st += dt;
          if (st > s[2]) { if (s[3]) act(); st = 0; si = (si + 1) % script.length; }
        }
        cur.x += (tgt.x - cur.x) * .14; cur.y += (tgt.y - cur.y) * .14;
        apply(); idleHint();
      };
      requestAnimationFrame(loop);
    }
  }

  // Email
  const m = $('#cmail'); if (m) { const a = 'garibel' + '@' + 'riseup.net'; m.href = 'mailto:' + a; m.textContent = a; }

  // Formulaire (Netlify Forms)
  const f = $('#contact-form');
  if (f) f.addEventListener('submit', e => {
    e.preventDefault();
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(f)).toString() })
      .then(r => { if (r.ok) { f.style.display = 'none'; $('#ok').style.display = 'block'; } else alert("Erreur lors de l'envoi. Réessayez ou appelez directement."); })
      .catch(() => alert('Erreur réseau. Vérifiez votre connexion.'));
  });

  // Modales
  $$('[data-modal]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); $$('.modal').forEach(x => x.style.display = 'none'); $('#' + a.dataset.modal).style.display = 'flex'; }));
  $$('.modal').forEach(x => x.addEventListener('click', e => { if (e.target === x || e.target.classList.contains('x')) x.style.display = 'none'; }));
  addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal').forEach(x => x.style.display = 'none'); });
})();
