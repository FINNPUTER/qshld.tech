(() => {
'use strict';

/* ===== config ===== */
const API = 'https://qshld-api-production.up.railway.app';
const TOKEN = { ca: '', buy: '' };          // fill in when $QSHLD is live
const QDAY = Date.UTC(2029, 5, 1);           // earliest public estimate

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* ===== boot sequence ===== */
(function boot() {
  const el = $('#boot');
  let seen = false;
  try { seen = sessionStorage.getItem('qs-boot') === '1'; sessionStorage.setItem('qs-boot', '1'); } catch (e) {}
  if (RM || seen) { el.remove(); return; }
  document.body.classList.add('boot-pending');
  const msgs = ['Cooling to 15 millikelvin', 'Entangling qubits', 'Loading threat index', 'Ready'];
  const bar = $('#boot-bar'), txt = $('#boot-txt');
  let i = 0;
  const tick = () => {
    txt.textContent = msgs[i];
    bar.style.width = ((i + 1) / msgs.length * 100) + '%';
    i++;
    if (i < msgs.length) setTimeout(tick, 300);
    else setTimeout(() => { el.classList.add('done'); document.body.classList.remove('boot-pending'); setTimeout(() => el.remove(), 800); }, 280);
  };
  tick();
})();

/* ===== scroll progress ===== */
const prog = $('#progress');
function onScrollProgress() {
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
}

/* ===== reveals, count-up, bars, gauge ===== */
function countUp(el) {
  const to = parseFloat(el.dataset.to || '0');
  const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
  if (RM || to === 0) { el.textContent = pre + to.toLocaleString('en-US') + suf; return; }
  const dur = 1800, t0 = performance.now();
  const step = t => {
    const p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
    el.textContent = pre + Math.round(to * e).toLocaleString('en-US') + suf;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target;
    el.classList.add('in');
    $$('.count', el).forEach(c => { if (!c.dataset.done) { c.dataset.done = 1; countUp(c); } });
    if (el.classList.contains('count') && !el.dataset.done) { el.dataset.done = 1; countUp(el); }
    $$('.cb i', el).forEach(b => {
      const w = +b.dataset.w;
      b.style.backgroundSize = (10000 / Math.max(w, 1)) + '% 100%';
      setTimeout(() => (b.style.width = w + '%'), 150);
    });
    if (el.classList.contains('gauge')) setTimeout(() => ($('#g-fg').style.strokeDasharray = '42 100'), 200);
    io.unobserve(el);
  }
}, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
$$('.rv').forEach(el => io.observe(el));

/* ===== spotlight cards ===== */
document.addEventListener('pointermove', e => {
  const c = e.target.closest && e.target.closest('.spot');
  if (!c) return;
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
  c.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, { passive: true });

/* ===== click spark ===== */
(function spark() {
  if (RM) return;
  const cv = $('#spark'), cx = cv.getContext('2d');
  let sparks = [], dpr = 1, running = false;
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
  size(); addEventListener('resize', size);
  addEventListener('pointerdown', e => {
    const n = 9, t = performance.now();
    for (let i = 0; i < n; i++) sparks.push({ x: e.clientX, y: e.clientY, a: (Math.PI * 2 * i) / n + Math.random() * .3, t });
    if (!running) { running = true; requestAnimationFrame(draw); }
  });
  function draw(now) {
    cx.clearRect(0, 0, cv.width, cv.height);
    sparks = sparks.filter(s => now - s.t < 480);
    for (const s of sparks) {
      const p = (now - s.t) / 480, e = 1 - Math.pow(1 - p, 3);
      const d = e * 34, len = 12 * (1 - e);
      const x1 = s.x + Math.cos(s.a) * d, y1 = s.y + Math.sin(s.a) * d;
      const x2 = s.x + Math.cos(s.a) * (d + len), y2 = s.y + Math.sin(s.a) * (d + len);
      cx.strokeStyle = `rgba(143,227,255,${1 - p})`;
      cx.lineWidth = 2 * dpr; cx.lineCap = 'round';
      cx.beginPath(); cx.moveTo(x1 * dpr, y1 * dpr); cx.lineTo(x2 * dpr, y2 * dpr); cx.stroke();
    }
    if (sparks.length) requestAnimationFrame(draw); else { running = false; cx.clearRect(0, 0, cv.width, cv.height); }
  }
})();

/* ===== countdown ===== */
const cd = { d: $('#cd-d'), h: $('#cd-h'), m: $('#cd-m'), s: $('#cd-s') };
function tickCountdown() {
  const diff = Math.max(0, QDAY - Date.now());
  cd.d.textContent = String(Math.floor(diff / 864e5)).padStart(3, '0');
  cd.h.textContent = String(Math.floor(diff % 864e5 / 36e5)).padStart(2, '0');
  cd.m.textContent = String(Math.floor(diff % 36e5 / 6e4)).padStart(2, '0');
  cd.s.textContent = String(Math.floor(diff % 6e4 / 1e3)).padStart(2, '0');
}
tickCountdown(); setInterval(tickCountdown, 1000);

/* ===== ledger filler (slide 2) ===== */
(function ledger() {
  const box = $('#ledger'); if (!box) return;
  const hex = n => { let s = ''; for (let i = 0; i < n; i++) s += '0123456789abcdef'[Math.random() * 16 | 0]; return s; };
  let rows = '';
  for (let i = 0; i < 26; i++) {
    const hot = Math.random() < .28;
    rows += `<div>${hot ? '<span class="hot">' : ''}0${Math.random() < .5 ? 2 : 3}${hex(30)}...${hex(6)}${hot ? '  exposed</span>' : ''}</div>`;
  }
  box.innerHTML = `<div>${rows}${rows}</div>`;
})();

/* ===== lazy background videos (optional files) ===== */
const vio = new IntersectionObserver(entries => {
  for (const e of entries) {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.dataset.loaded) {
        v.dataset.loaded = 1;
        v.addEventListener('canplay', () => { v.classList.add('ready'); v.play().catch(() => {}); }, { once: true });
        v.addEventListener('error', () => v.remove(), { once: true });
        v.src = v.dataset.src;
        v.load();
      } else if (v.classList.contains('ready')) v.play().catch(() => {});
    } else if (v.classList.contains('ready')) v.pause();
  }
}, { rootMargin: '200px' });
if (!RM) $$('video[data-src]').forEach(v => vio.observe(v));

/* ===== pinned horizontal story ===== */
const story = $('#how'), track = $('#story-track'), dots = $$('.story-dots i');
function onScrollStory() {
  if (RM || innerWidth <= 820) { track.style.transform = ''; return; }
  const r = story.getBoundingClientRect();
  const total = story.offsetHeight - innerHeight;
  const p = clamp(-r.top / total, 0, 1);
  const slides = track.children, n = slides.length;
  const sw = slides[0].offsetWidth, gap = parseFloat(getComputedStyle(track).gap) || 0;
  // hold each slide centered, then glide to the next
  const f = p * (n - 1), base = Math.min(Math.floor(f), n - 2), fr = clamp((f - base - .25) / .5, 0, 1);
  const pos = base + fr * fr * (3 - 2 * fr);
  const x = (innerWidth - sw) / 2 - pos * (sw + gap);
  track.style.transform = `translate3d(${x}px,0,0)`;
  const idx = Math.round(pos);
  dots.forEach((d, i) => d.classList.toggle('on', i === idx));
}

let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => { onScrollProgress(); onScrollStory(); ticking = false; });
}, { passive: true });
addEventListener('resize', onScrollStory);
onScrollProgress(); onScrollStory();

/* ===== qubit sphere ===== */
const Q = (function qubit() {
  const cv = $('#qubit'); const cx = cv.getContext('2d');
  const small = innerWidth < 700;
  const N = small ? 650 : 1300;
  const GOLD = Math.PI * (3 - Math.sqrt(5));
  const pts = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = GOLD * i;
    pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, ph: Math.random() * 6.28, ox: 0, oy: 0 });
  }
  const rings = [
    { tilt: 1.15, rot: .5, n: 140, r: 1.42 },
    { tilt: -0.9, rot: 2.1, n: 140, r: 1.58 },
    { tilt: 0.25, rot: 1.0, n: 160, r: 1.78 }
  ];
  const PAL = {
    idle:      { a: [143, 227, 255], b: [217, 162, 95], spd: .16 },
    scanning:  { a: [123, 92, 255],  b: [143, 227, 255], spd: .9 },
    exposed:   { a: [255, 77, 94],   b: [255, 138, 92], spd: .3 },
    protected: { a: [92, 242, 181],  b: [143, 227, 255], spd: .2 },
    neutral:   { a: [246, 210, 154], b: [217, 162, 95], spd: .18 }
  };
  let st = 'idle', cA = [...PAL.idle.a], cB = [...PAL.idle.b], spd = PAL.idle.spd;
  let W = 0, H = 0, dpr = 1, ang = 0, tilt = .35, mx = -9999, my = -9999, tmx = 0, tmy = 0, visible = true, last = performance.now();

  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
  };
  size(); addEventListener('resize', size);
  addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect();
    mx = e.clientX - r.left; my = e.clientY - r.top;
    tmx = (e.clientX / innerWidth - .5); tmy = (e.clientY / innerHeight - .5);
  }, { passive: true });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { last = performance.now(); requestAnimationFrame(frame); } }).observe(cv);

  function frame(now) {
    if (!visible) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const P = PAL[st];
    for (let k = 0; k < 3; k++) { cA[k] = lerp(cA[k], P.a[k], .04); cB[k] = lerp(cB[k], P.b[k], .04); }
    spd = lerp(spd, P.spd, .03);
    ang += (RM ? 0 : spd) * dt;
    tilt = lerp(tilt, .35 + tmy * .5, .04);
    const yaw = ang + tmx * .6;

    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.clearRect(0, 0, W, H);
    const R = Math.min(W, H) * (small ? .34 : .3) * (1 + Math.sin(now / 1400) * .015);
    const ox = W * .5, oy = H * .5, f = 3.2;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), stt = Math.sin(tilt);

    // core glow
    const g = cx.createRadialGradient(ox, oy, 0, ox, oy, R * 1.25);
    g.addColorStop(0, `rgba(${cA[0] | 0},${cA[1] | 0},${cA[2] | 0},.22)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);

    const proj = (x, y, z) => {
      let x1 = x * cy - z * sy, z1 = x * sy + z * cy;
      let y1 = y * ct - z1 * stt, z2 = y * stt + z1 * ct;
      const s = f / (f + z2);
      return [ox + x1 * R * s, oy + y1 * R * s, z2, s];
    };

    // rings
    for (const rg of rings) {
      const ca = Math.cos(rg.tilt), sa = Math.sin(rg.tilt), cr = Math.cos(rg.rot + ang * .4), sr = Math.sin(rg.rot + ang * .4);
      for (let i = 0; i < rg.n; i++) {
        const t = i / rg.n * 6.283 + now / 4000;
        let x = Math.cos(t) * rg.r, y = 0, z = Math.sin(t) * rg.r;
        let y2 = y * ca - z * sa, z2 = y * sa + z * ca; y = y2; z = z2;
        let x2 = x * cr - y * sr; y2 = x * sr + y * cr; x = x2; y = y2;
        const [px, py, pz] = proj(x, y, z);
        const a = clamp(.5 - pz * .3, .08, .8);
        cx.fillStyle = `rgba(${cB[0] | 0},${cB[1] | 0},${cB[2] | 0},${a * .7})`;
        cx.fillRect(px, py, 1.4, 1.4);
      }
    }

    // sphere points
    for (const p of pts) {
      const [px0, py0, pz, s] = proj(p.x, p.y, p.z);
      // measurement collapse near cursor
      const dx = px0 - mx, dy = py0 - my, d2 = dx * dx + dy * dy;
      let tx = 0, ty = 0;
      if (d2 < 16000 && !RM) { const d = Math.sqrt(d2) || 1, k = (1 - d / 126) * 34; tx = dx / d * k; ty = dy / d * k; }
      p.ox = lerp(p.ox, tx, .12); p.oy = lerp(p.oy, ty, .12);
      const tw = .65 + Math.sin(now / 600 + p.ph) * .35;
      const front = clamp((1 - pz) * .5, 0, 1);
      const mix = (p.y + 1) * .5;
      const r = lerp(cA[0], cB[0], mix), gg = lerp(cA[1], cB[1], mix), b = lerp(cA[2], cB[2], mix);
      const a = (.12 + front * .78) * tw;
      const sz = (.6 + front * 1.5) * s;
      cx.fillStyle = `rgba(${r | 0},${gg | 0},${b | 0},${a})`;
      cx.beginPath(); cx.arc(px0 + p.ox, py0 + p.oy, sz, 0, 6.283); cx.fill();
    }

    // Bloch vector
    const th = now / 2600, phi = .9 + Math.sin(now / 3100) * .5;
    const vx = Math.sin(phi) * Math.cos(th), vy = -Math.cos(phi), vz = Math.sin(phi) * Math.sin(th);
    const [ex, ey] = proj(vx, vy, vz);
    const lg = cx.createLinearGradient(ox, oy, ex, ey);
    lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(255,255,255,.95)');
    cx.strokeStyle = lg; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(ox, oy); cx.lineTo(ex, ey); cx.stroke();
    cx.shadowColor = `rgb(${cA[0] | 0},${cA[1] | 0},${cA[2] | 0})`; cx.shadowBlur = 22;
    cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(ex, ey, 4.2, 0, 6.283); cx.fill();
    cx.shadowBlur = 0;

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { set: s => { st = PAL[s] ? s : 'idle'; } };
})();

/* ===== scanner ===== */
const form = $('#scanner'), input = $('#addr'), btn = $('.scan-btn', form);
const wrap = $('#report-wrap'), report = $('#report');
let chain = 'btc';
const NAMES = { btc: 'Bitcoin', eth: 'Ethereum', sol: 'Solana', base: 'Base', arb: 'Arbitrum', poly: 'Polygon' };
const PH = {
  btc: 'Paste a Bitcoin address (1..., 3... or bc1...)',
  eth: 'Paste an Ethereum address (0x...)',
  sol: 'Paste a Solana address',
  base: 'Paste a Base address (0x...)',
  arb: 'Paste an Arbitrum address (0x...)',
  poly: 'Paste a Polygon address (0x...)'
};
const RX = {
  btc: /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/,
  sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  evm: /^0x[a-fA-F0-9]{40}$/
};

$$('.chip').forEach(c => c.addEventListener('click', () => {
  $$('.chip').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
  c.classList.add('on'); c.setAttribute('aria-checked', 'true');
  chain = c.dataset.chain; input.placeholder = PH[chain];
  clearErr();
}));

// auto-pick chain from pasted address
input.addEventListener('input', () => {
  const v = input.value.trim();
  let guess = null;
  if (RX.btc.test(v)) guess = 'btc';
  else if (RX.evm.test(v) && !['eth', 'base', 'arb', 'poly'].includes(chain)) guess = 'eth';
  else if (RX.sol.test(v) && !/^(1|3)/.test(v)) guess = 'sol';
  if (guess && guess !== chain) $(`.chip[data-chain="${guess}"]`).click();
  clearErr();
});

function err(msg) {
  clearErr();
  const p = document.createElement('p'); p.className = 'scan-err'; p.id = 'scan-err'; p.textContent = msg;
  form.appendChild(p); input.setAttribute('aria-invalid', 'true');
}
function clearErr() { const e = $('#scan-err'); if (e) e.remove(); input.removeAttribute('aria-invalid'); }

function valid(v) {
  if (chain === 'btc') return RX.btc.test(v);
  if (chain === 'sol') return RX.sol.test(v);
  return RX.evm.test(v);
}

const wait = ms => new Promise(r => setTimeout(r, ms));

async function runTerminal(lines) {
  report.className = 'report';
  report.innerHTML = '<div class="term" id="term"></div>';
  wrap.hidden = false;
  const term = $('#term');
  for (const l of lines) {
    const prev = $('.cur', term); if (prev) { prev.classList.remove('cur'); prev.classList.add('ok'); prev.textContent = prev.textContent + '  done'; }
    const d = document.createElement('div'); d.className = 'cur'; d.textContent = l; term.appendChild(d);
    await wait(RM ? 0 : 420);
  }
}

const LABEL = { exposed: 'Exposed', protected: 'Protected', inherently_exposed: 'Exposed by design', no_private_key: 'No private key', contract: 'Smart contract', program: 'Program account' };
const TONE = { exposed: 'exposed', inherently_exposed: 'exposed', protected: 'protected', no_private_key: 'protected', contract: 'neutral', program: 'neutral' };

function todo(d, ch) {
  if (d.status === 'inherently_exposed' && ch === 'btc') return 'Taproot puts the public key inside the address. For long term storage a SegWit address (bc1q) that has never sent anything keeps the key hidden behind a hash.';
  if (d.status === 'no_private_key') return 'Nothing to migrate here. Check the wallet that controls this program instead.';
  if (d.status === 'inherently_exposed') return 'Every Solana address is its own public key, so there is no hash to hide behind. Real protection on Solana means a quantum resistant vault program. Those exist but are optional and still early.';
  if (d.status === 'exposed' && ch === 'btc') return 'Move long term funds to a fresh address that has never sent a transaction, and do not reuse addresses. Most modern wallets create a new receive address for you automatically.';
  if (d.status === 'exposed') return 'On EVM chains every send reveals the key, so a fresh address only stays hidden until its first send. Keep long term funds on an address you only ever receive to.';
  if (d.status === 'protected') return 'Keep it that way. The first send from this address puts its public key on-chain for good.';
  return 'Quantum risk here depends on how the keys behind this account are managed.';
}

function render(d) {
  const tone = TONE[d.status] || 'neutral';
  const label = LABEL[d.status] || d.status;
  const stats = [];
  if (d.outgoing_tx !== undefined) stats.push(['Outgoing transactions', Number(d.outgoing_tx).toLocaleString('en-US')]);
  if (d.total_tx !== undefined) stats.push(['Total transactions', Number(d.total_tx).toLocaleString('en-US')]);
  if (d.balance) stats.push(['Balance', d.balance]);
  if (d.total_received) stats.push(['Total received', d.total_received]);
  if (d.address_type) stats.push(['Address type', d.address_type]);
  if (d.public_key) stats.push(['Public key', d.public_key]);
  if (d.signature_scheme) stats.push(['Signature scheme', d.signature_scheme]);
  if (d.has_activity !== undefined) stats.push(['Activity', d.has_activity ? 'Yes' : 'None found']);

  const shareTxt = `Scanned my ${d.chain || NAMES[chain]} wallet for quantum exposure. Result: ${label}. Check yours:`;
  const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareTxt)}&url=${encodeURIComponent('https://qshld.tech')}`;

  report.className = 'report ' + tone;
  report.innerHTML = `
    <div class="r-head">
      <div class="r-status">${esc(label)}</div>
      <div class="r-chain">${esc(d.chain || NAMES[chain])}${d.scan_number ? ', scan #' + esc(Number(d.scan_number).toLocaleString('en-US')) : ''}</div>
    </div>
    ${stats.length ? `<div class="r-stats">${stats.map(([k, v]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>` : ''}
    <p class="r-detail">${esc(d.detail)}</p>
    <p class="r-todo">${esc(todo(d, chain))}</p>
    <div class="r-actions">
      <a class="share" href="${shareUrl}" target="_blank" rel="noopener">Share result on X</a>
      <button type="button" id="again">Scan another wallet</button>
    </div>`;
  $('#again').addEventListener('click', () => { input.value = ''; input.focus(); wrap.hidden = true; Q.set('idle'); });
  Q.set(tone);
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const v = input.value.trim();
  if (!v) { err('Paste a wallet address to scan.'); input.focus(); return; }
  if (!valid(v)) { err(`That does not look like a ${NAMES[chain]} address. Check it, or pick the right chain above.`); input.focus(); return; }
  clearErr();
  btn.disabled = true; form.classList.add('scanning'); Q.set('scanning');

  const fetchP = fetch(`${API}/api/scan?address=${encodeURIComponent(v)}&chain=${chain}`)
    .then(r => r.json().catch(() => ({ error: 'The scanner sent an unreadable reply. Try again.' })))
    .catch(() => ({ error: 'Could not reach the scanner. Check your connection and try again.' }));

  await runTerminal([
    `Address format: ${NAMES[chain]}`,
    `Connecting to ${NAMES[chain]} nodes`,
    'Reading signature history',
    'Checking public key exposure'
  ]);
  const data = await fetchP;

  btn.disabled = false; form.classList.remove('scanning');
  if (!data || data.error) {
    Q.set('idle');
    report.className = 'report neutral';
    report.innerHTML = `<div class="r-head"><div class="r-status">Scan stopped</div></div><p class="r-detail">${esc(data && data.error || 'Unknown error. Try again.')}</p>`;
    return;
  }
  render(data);
  wrap.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'nearest' });
});

/* ===== jump-to-scanner links ===== */
$$('[data-focus-scan]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
  setTimeout(() => input.focus({ preventScroll: true }), RM ? 0 : 650);
}));

/* ===== token contract ===== */
(function token() {
  if (!TOKEN.ca) return;
  $('#ca-val').textContent = TOKEN.ca;
  const copy = $('#ca-copy'); copy.hidden = false;
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(TOKEN.ca); copy.textContent = 'Copied'; }
    catch (e) { copy.textContent = 'Select and copy'; }
    setTimeout(() => (copy.textContent = 'Copy'), 1800);
  });
  if (TOKEN.buy) { const b = $('#ca-buy'); b.href = TOKEN.buy; b.hidden = false; }
})();

})();
