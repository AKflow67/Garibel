// Le chantier en 4 temps : une scene animee qui se deroule toute seule.
// Tout est calcule a partir de la progression p (0 a 1) : ce qu'on voit est ce qui se passe.
(() => {
  const svg = document.querySelector('#chantier'); if (!svg) return;
  const tabs = [...document.querySelectorAll('.tabs button')], tabBox = document.querySelector('.tabs'), cap = document.querySelector('.cap');
  const stepEl = document.querySelector('#c-step');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = 250, TB = 306, T0 = 420, T1 = 820, DUR = 22000, S = .8, R = 195 * S, BL = 109 * S;
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), rp = (p, a, b) => cl((p - a) / (b - a));
  const ez = u => u * u * (3 - 2 * u), lerp = (a, b, u) => a + (b - a) * u, f = v => v.toFixed(1);
  const bump = x => 10 * Math.sin(x * .013 + 1) + 6 * Math.sin(x * .041) + 3 * Math.sin(x * .09 + 2);

  // Bras de la mini-pelle (meme geometrie que celle du haut de page)
  const P1 = [248, 246], L1 = 141.5, L2 = 109.6, A0 = Math.atan2(-96, 104), B0 = Math.atan2(86, 68);
  const ik = (tx, ty) => {
    const dx = tx - P1[0], dy = ty - P1[1], dist = cl(Math.hypot(dx, dy), 45, L1 + L2 - 1), th = Math.atan2(dy, dx);
    const al = Math.acos(cl((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1)), a1 = th - al;
    const ex = P1[0] + L1 * Math.cos(a1), ey = P1[1] + L1 * Math.sin(a1);
    const a2 = Math.atan2(P1[1] + dist * Math.sin(th) - ey, P1[0] + dist * Math.cos(th) - ex);
    const a = a1 - A0, b = a2 - B0 - a;
    return [a * 180 / Math.PI, b * 180 / Math.PI];
  };
  const pelle = (X, dir, tx, ty, full) => {
    const r = ik(tx, ty), c = -(r[0] + r[1]) * .9 + (full ? 22 : 0);
    return '<g transform="translate(' + f(X) + ' ' + G + ') scale(' + (dir * S) + ' ' + S + ') translate(-205 -310)">' +
      '<rect class="kf k2" x="120" y="276" width="170" height="34" rx="17"/><circle class="k k2" cx="139" cy="293" r="9"/><circle class="k k2" cx="271" cy="293" r="9"/>' +
      '<path class="k k2" d="M290 298l24-7v19"/><rect class="kf k2" x="146" y="262" width="122" height="14" rx="3"/>' +
      '<path class="kf k2" d="M160 262v-22q0-8-8-8h-14q-8 0-8 8v22z"/><path class="kf k2" d="M160 262V196q0-8 8-8h38q6 0 9 5l15 30v39z"/><path class="k k2" d="M170 198h32l13 26h-45z"/>' +
      '<g transform="rotate(' + f(r[0]) + ' 248 246)"><path class="ko" d="M248 246L298 170L352 150"/><path class="ki" d="M248 246L298 170L352 150"/>' +
      '<g transform="rotate(' + f(r[1]) + ' 352 150)"><path class="ko" d="M352 150L420 236"/><path class="ki" d="M352 150L420 236"/>' +
      '<g transform="rotate(' + f(c) + ' 420 236)">' + (full ? '<path class="kc" d="M409 229q14-18 30 3z"/>' : '') +
      '<path class="kf k2" d="M410 228l-12 26q14 18 36 8l4-30z"/></g></g></g></g>';
  };
  // Un artisan : pieds en (x, y), ph = phase de marche
  const man = (x, y, ph, extra) => {
    const s = Math.sin(ph) * 7;
    return '<g transform="translate(' + f(x) + ' ' + f(y) + ') scale(1.5) translate(' + f(-x) + ' ' + f(-y) + ')"><path class="k" d="M' + f(x) + ' ' + f(y - 22) + 'L' + f(x + s) + ' ' + f(y) + 'M' + f(x) + ' ' + f(y - 22) + 'L' + f(x - s) + ' ' + f(y) + 'M' + f(x) + ' ' + f(y - 22) + 'V' + f(y - 42) + '"/>' +
      '<circle class="kf" cx="' + f(x) + '" cy="' + f(y - 48) + '" r="5.5"/><path class="kc" d="M' + f(x - 7) + ' ' + f(y - 49) + 'a7 6 0 0 1 14 0z"/>' +
      (extra || '<path class="k" d="M' + f(x) + ' ' + f(y - 38) + 'l' + f(5 + s * .5) + ' 13M' + f(x) + ' ' + f(y - 38) + 'l' + f(-5 - s * .5) + ' 13"/>') + '</g>';
  };

  const frame = p => {
    const F = lerp(-120, 1150, rp(p, .26, .38)), lv = x => cl((F - x) / 100), gy = x => G - bump(x) * (1 - lv(x));
    const te = lerp(T0, T1, rp(p, .41, .5));
    let X = null, dir = 1, tx = 345, ty = 218, full = false, h = '';
    if (p >= .26 && p < .38) X = F - BL;
    else if (p >= .38 && p < .41) { dir = -1; X = lerp(1100, T0 + R, ez(rp(p, .38, .41))); }
    else if (p >= .41 && p < .5) {
      dir = -1; X = te + R;
      const q = (rp(p, .41, .5) * 3) % 1, K = [[0, 395, 240], [.25, 402, 350], [.4, 372, 354], [.55, 376, 232], [.72, 408, 168], [.86, 408, 168], [1, 395, 240]];
      for (let i = 1; i < K.length; i++) if (q <= K[i][0]) { const u = ez((q - K[i - 1][0]) / (K[i][0] - K[i - 1][0])); tx = lerp(K[i - 1][1], K[i][1], u); ty = lerp(K[i - 1][2], K[i][2], u); break; }
      full = q > .36 && q < .76;
      if (q > .76 && q < .92) { const u = (q - .76) / .16; for (let i = 0; i < 5; i++) h += '<circle class="kc" cx="' + f(te - 10 + i * 4) + '" cy="' + f(G - 92 + u * (72 + i * 4)) + '" r="2.2" opacity="' + f(1 - u) + '"/>'; }
    }
    else if (p >= .5 && p < .53) { dir = -1; X = lerp(T1 + R, 1005, ez(rp(p, .5, .53))); }
    else if (p >= .53 && p < .76) { dir = -1; X = 1005; }
    else if (p >= .76 && p < .88) { dir = -1; X = lerp(1005, -130, rp(p, .76, .88)); }
    const bf = p < .76 ? T1 + 1 : (p < .88 ? cl(X - BL, T0, T1) : T0), o1 = Math.min(te, bf), open = o1 > T0 + 1;

    // Sous-sol
    let s = '<path class="k" opacity=".16" d="M0 205L110 120L190 168L330 84L455 178L560 128L700 190L825 104L1000 182"/><path class="k" d="M0 326h1000" stroke-dasharray="2 9" opacity=".25"/><path class="k" d="M0 342h1000" stroke-dasharray="1 14" opacity=".25"/>';
    // Cordon de deblai (derriere la tranchee)
    const be = p < .76 ? te : bf, nb = Math.floor((be - T0) / 40);
    if (nb > 0) { let b = 'M' + T0 + ' ' + G; for (let i = 0; i < nb; i++) b += 'q20-15 40 0'; s += '<path class="k" opacity=".4" d="' + b + '"/>'; }
    // Sol
    let dd = '', pen = false, skipped = false;
    for (let x = 0; x <= 1000; x += 10) {
      if (open && x > T0 && x < o1) { pen = false; skipped = true; continue; }
      if (skipped) { dd += 'M' + f(o1) + ' ' + G; pen = true; skipped = false; }
      dd += (pen ? 'L' : 'M') + x + ' ' + f(gy(x)); pen = true;
    }
    s += '<path class="k" d="' + dd + '"/>';
    if (open) s += '<path class="k" d="M' + T0 + ' ' + G + 'V' + TB + 'H' + f(o1) + 'V' + G + '"/>';
    if (bf < T1) s += '<path class="k" opacity=".3" stroke-dasharray="3 5" d="M' + f(bf) + ' ' + TB + 'H' + T1 + 'V' + G + (bf <= T0 ? 'M' + T0 + ' ' + G + 'V' + TB : '') + '"/><path class="kl" stroke-dasharray="7 5" d="M' + f(bf + 2) + ' 270H' + (T1 - 2) + '"/>';
    // Herbes folles et cailloux du terrain brut
    [60, 140, 300, 480, 610, 760, 1005].forEach(x => { const o = 1 - lv(x); if (o > 0) s += '<path class="k" opacity="' + f(o) + '" d="M' + x + ' ' + f(gy(x)) + 'l-3-10m7 10l1-12m5 12l5-9"/>'; });
    [210, 690].forEach(x => { const o = 1 - lv(x); if (o > 0) s += '<path class="k" opacity="' + f(o) + '" d="M' + (x - 10) + ' ' + f(gy(x - 10)) + 'q10-14 22 0"/>'; });
    // Piquets et cordeau
    const fade = 1 - rp(p, .385, .41);
    if (p > .12 && fade > 0) {
      const s1 = rp(p, .12, .14), s2 = rp(p, .21, .23), sx = lerp(400, 860, ez(rp(p, .23, .25)));
      s += '<g opacity="' + f(fade) + '"><path class="kl" d="M400 ' + f(gy(400)) + 'v' + f(-44 * s1) + (s2 > 0 ? 'M860 ' + f(gy(860)) + 'v' + f(-44 * s2) : '') + '"/>' +
        (p > .23 ? '<path class="kl" stroke-dasharray="5 4" d="M400 ' + f(gy(400) - 40) + 'L' + f(sx) + ' ' + f(lerp(gy(400), gy(860), (sx - 400) / 460) - 40) + '"/>' : '') + '</g>';
    }
    // Reseaux : tuyau deroule depuis la couronne
    if (p >= .5 && p < .76) {
      const Cx = p < .54 ? lerp(-10, 424, rp(p, .5, .54)) : p < .66 ? lerp(424, 824, rp(p, .54, .66)) : p < .7 ? 826 : lerp(826, 1060, rp(p, .7, .76));
      const Bx = p < .54 ? lerp(-55, 384, rp(p, .5, .54)) : p < .69 ? 384 : lerp(384, -70, rp(p, .69, .75));
      const cr = lerp(22, 13, rp(p, .54, .66)), rot = Bx * 4 + rp(p, .54, .66) * 1440, cx = Bx + 34, cy = G - cr;
      if (p >= .54 && p < .69) s += '<path class="kp" d="M' + f(cx + 4) + ' ' + f(cy + cr) + 'Q416 ' + (TB - 8) + ' 430 ' + (TB - 8) + 'H' + f(p < .66 ? Math.max(430, Cx - 26) : T1) + (p < .66 ? 'Q' + f(Cx - 2) + ' ' + (TB - 8) + ' ' + f(Cx + 9) + ' ' + (G - 42) : '') + '"/>';
      s += '<g transform="rotate(' + f(rot) + ' ' + f(cx) + ' ' + f(cy) + ')"><circle class="kp" cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(cr) + '"/><circle class="kp" cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(cr - 6) + '"/><path class="k" d="M' + f(cx - cr) + ' ' + f(cy) + 'h' + f(cr * 2) + '"/></g>';
      s += man(Bx, G, Bx * .35) + man(Cx, G, Cx * .35, p >= .54 && p < .66 ? '<path class="k" d="M' + f(Cx) + ' ' + f(G - 38) + 'L' + f(Cx + 6) + ' ' + (G - 28) + '"/>' : '');
    }
    if (p >= .69) s += '<path class="kp" d="M424 ' + (TB - 8) + 'H' + T1 + '"/>';
    if (p >= .56) s += '<path class="k" stroke-dasharray="1 6" d="M424 ' + (TB - 2) + 'H' + f(p < .66 ? Math.max(424, lerp(424, 824, rp(p, .54, .66)) - 40) : 818) + '"/>';
    if (p >= .68) {
      const g = rp(p, .68, .7); s += '<path class="k" d="M' + T1 + ' ' + (TB - 8) + 'V' + f(TB - 8 - 80 * g) + (g >= 1 ? 'h10v5' : '') + '"/>';
      if (p < .74 && p >= .7) s += '<circle class="kw" cx="' + f(lerp(426, 818, rp(p, .7, .74))) + '" cy="' + (TB - 8) + '" r="4"/>';
      if (p >= .74) { const u = (p * DUR / 800) % 1; s += '<path class="kw" opacity="' + f(1 - u) + '" d="M830 ' + f(226 + u * 18) + 'c-3 4-4 6-4 8a4 4 0 0 0 8 0c0-2-1-4-4-8z"/>'; }
    }
    // Geometre
    if (p >= .03 && p < .31) {
      const Ax = p < .12 ? lerp(-30, 392, rp(p, .03, .12)) : p < .14 ? 392 : p < .21 ? lerp(392, 852, rp(p, .14, .21)) : p < .25 ? 852 : lerp(852, 1060, rp(p, .25, .31));
      s += man(Ax, gy(Ax), Ax * .35);
    }
    // Finitions : empierrement du chemin, arbre, herbe
    if (p >= .86) {
      const Dx = p < .955 ? lerp(1060, 268, rp(p, .86, .955)) : lerp(268, 205, rp(p, .985, 1)), k = Math.sin(p * DUR / 130) * 5;
      s += '<path class="kl" style="stroke-width:4" stroke-dasharray="0.1 9" d="M' + f(Math.max(430, Dx + 20)) + ' 246H812"/>';
      s += man(Dx, G, Dx * .35, p < .955 ? '<path class="k" d="M' + f(Dx) + ' ' + (G - 38) + 'l-8 12L' + f(Dx - 24 + k) + ' ' + (G - 2) + 'm-5 0h10"/>' : '');
      const t1 = rp(p, .955, .97), t2 = ez(rp(p, .965, .985));
      if (t1 > 0) s += '<path class="k" d="M240 ' + G + 'v' + f(-58 * t1) + '"/>' + (t2 > 0 ? '<circle class="kf" cx="240" cy="' + f(G - 58 - 24 * t2) + '" r="' + f(28 * t2) + '"/>' : '');
      [70, 150, 330, 890, 950].forEach((x, i) => { const u = ez(rp(p, .96 + i * .004, .975 + i * .004)); if (u > 0) s += '<path class="k" d="M' + x + ' ' + G + 'l-2 ' + f(-8 * u) + 'm5 ' + f(8 * u) + 'l1 ' + f(-10 * u) + 'm4 ' + f(10 * u) + 'l3 ' + f(-7 * u) + '"/>'; });
    }
    // Mini-pelle et terre poussee par la lame
    if (X !== null) {
      if (p < .38) s += '<path class="k" d="M' + f(X + BL) + ' ' + G + 'q10-13 22 0"/>';
      if (p >= .76 && X - BL > T0 && X - BL < T1) s += '<path class="k" d="M' + f(X - BL - 22) + ' ' + G + 'q10-13 22 0"/>';
      s += pelle(X, dir, tx, ty, full);
    }
    svg.innerHTML = '<g opacity="' + f(Math.min(rp(p, 0, .012), 1 - rp(p, .988, 1))) + '">' + s + h + '</g>';
  };

  let p = 0, step = -1, seen = false, last = 0, drawn = 0;
  const show = () => {
    tabBox.style.setProperty('--p', p.toFixed(4));
    const i = Math.min(3, Math.floor(p * 4));
    if (i !== step) { step = i; tabs.forEach((b, j) => b.classList.toggle('on', j <= i)); cap.textContent = tabs[i].dataset.cap; if (stepEl) stepEl.textContent = 'Étape ' + (i + 1) + ' sur 4 · ' + tabs[i].dataset.name; }
    frame(p);
  };
  tabs.forEach((b, i) => b.addEventListener('click', () => { p = i / 4 + .005; show(); }));
  if (calm) { p = .984; show(); return; }
  show();
  new IntersectionObserver(es => { seen = es[0].isIntersecting; last = 0; }, { threshold: .3 }).observe(svg);
  const tick = now => {
    requestAnimationFrame(tick); if (!seen) return;
    if (last) p += (now - last) / DUR; last = now;
    if (p >= 1) p = 0;
    if (now - drawn > 30) { drawn = now; show(); }
  };
  requestAnimationFrame(tick);
})();
