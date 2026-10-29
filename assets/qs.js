(() => {
'use strict';
const API = 'https://qshld-api-production.up.railway.app';
const TOKEN = { ca: '', buy: '' };
const QDAY = Date.UTC(2029, 5, 1);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOBILE = () => innerWidth <= 700;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ease = t => t * t * (3 - 2 * t);

/* smooth scroll */
let lenis = null;
function startLenis() {
  if (RM || !window.Lenis) return;
  lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
  const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  lenis.on('scroll', onScroll);
}
function goTo(y) { if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' }); }

/* split headings into words */
$$('[data-split]').forEach(h => {
  let i = 0;
  const out = document.createDocumentFragment();
  const addWord = (word, cls) => {
    const w = document.createElement('span'); w.className = 'w';
    const s = document.createElement('span'); s.textContent = word; s.style.setProperty('--i', i++);
    if (cls) s.className = cls;
    w.appendChild(s); out.appendChild(w); out.appendChild(document.createTextNode(' '));
  };
  [...h.childNodes].forEach(n => {
    if (n.nodeType === 3) n.textContent.split(/\s+/).filter(Boolean).forEach(w => addWord(w));
    else n.textContent.split(/\s+/).filter(Boolean).forEach(w => addWord(w, n.className));
  });
  h.textContent = ''; h.appendChild(out);
});

/* intro */
const intro = $('#intro');
let seen = false;
try { seen = sessionStorage.getItem('qs-intro') === '1'; sessionStorage.setItem('qs-intro', '1'); } catch (e) {}
function revealHero() { $$('.hero .rv, .hero [data-split]').forEach(el => el.classList.add('in')); }
if (RM || seen) { intro.remove(); revealHero(); }
else setTimeout(() => { intro.classList.add('out'); setTimeout(revealHero, 250); setTimeout(() => intro.remove(), 1200); }, 1250);

/* reveals, counters, bars, gauge */
function countUp(el) {
  const to = +el.dataset.to || 0, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
  if (RM || !to) { el.textContent = pre + to.toLocaleString('en-US') + suf; return; }
  const t0 = performance.now(), dur = 2000;
  const step = t => { const p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4); el.textContent = pre + Math.round(to * e).toLocaleString('en-US') + suf; if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target; el.classList.add('in');
  [el, ...$$('.count', el)].forEach(c => { if (c.classList.contains('count') && !c.dataset.done) { c.dataset.done = 1; countUp(c); } });
  $$('.cb i', el).forEach(b => {
    const w = +b.dataset.w, col = w < 25 ? 'var(--alarm)' : w < 45 ? 'var(--gold)' : w < 80 ? 'var(--ice)' : 'var(--safe)';
    b.style.background = col; b.style.boxShadow = `0 0 14px ${col}`;
    setTimeout(() => (b.style.width = w + '%'), 150);
  });
  if (el.id === 'gauge') setTimeout(() => ($('#g-fg').style.strokeDasharray = '42 100'), 250);
  io.unobserve(el);
}), { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
$$('.rv, [data-split]').forEach(el => { if (!el.closest('.hero')) io.observe(el); });

/* spotlight */
document.addEventListener('pointermove', e => {
  const c = e.target.closest && e.target.closest('.tier'); if (!c) return;
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, { passive: true });

/* hero parallax */
const hero = $('#hero');
if (!RM) hero.addEventListener('pointermove', e => {
  const x = (e.clientX / innerWidth - .5) * -24, y = (e.clientY / innerHeight - .5) * -16;
  hero.style.setProperty('--px', x + 'px'); hero.style.setProperty('--py', y + 'px');
}, { passive: true });

/* videos */
function loadVideo(v) {
  if (v.dataset.loaded) return; v.dataset.loaded = 1;
  v.addEventListener('canplay', () => { v.classList.add('ready'); v.play().catch(() => {}); }, { once: true });
  v.addEventListener('error', () => v.remove(), { once: true });
  v.src = v.dataset.src; v.load();
}
const vio = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting) { loadVideo(v); if (v.classList.contains('ready')) v.play().catch(() => {}); }
  else if (v.classList.contains('ready')) v.pause();
}), { rootMargin: '300px' });
if (!RM) $$('video[data-src]').forEach(v => { if (v.hasAttribute('data-eager')) loadVideo(v); vio.observe(v); });

/* countdown */
const cd = ['d', 'h', 'm', 's'].map(k => $('#cd-' + k));
function tick() {
  const d = Math.max(0, QDAY - Date.now());
  const v = [Math.floor(d / 864e5), Math.floor(d % 864e5 / 36e5), Math.floor(d % 36e5 / 6e4), Math.floor(d % 6e4 / 1e3)];
  cd.forEach((el, i) => (el.textContent = String(v[i]).padStart(i ? 2 : 3, '0')));
}
tick(); setInterval(tick, 1000);

/* story */
const story = $('#how'), layers = $$('.layer'), chapters = $$('.chapter'), rail = $$('.rail button');
let activeCh = -1;
function storyPos() {
  const total = story.offsetHeight - innerHeight;
  const p = clamp(-story.getBoundingClientRect().top / total, 0, 1);
  return p * (layers.length - 1);
}
function onStory() {
  if (MOBILE() || RM) { layers.forEach(l => (l.style.clipPath = '')); return; }
  const f = storyPos();
  layers.forEach((l, i) => {
    const m = $('.media', l);
    if (i === 0) { l.style.clipPath = 'none'; m.style.setProperty('--s', 1.04); return; }
    const r = ease(clamp((f - (i - 1) - .2) / .6, 0, 1));
    l.style.clipPath = `inset(${(1 - r) * 100}% 0 0 0)`;
    m.style.setProperty('--s', 1.18 - .14 * r);
  });
  const idx = Math.round(clamp(f, 0, layers.length - 1));
  if (idx !== activeCh) {
    activeCh = idx;
    chapters.forEach((c, i) => c.classList.toggle('on', i === idx));
    rail.forEach((b, i) => b.classList.toggle('on', i === idx));
    layers.forEach((l, i) => { const v = $('video', l); if (!v) return; if (Math.abs(i - idx) <= 1) { loadVideo(v); v.play && v.classList.contains('ready') && v.play().catch(() => {}); } else if (v.classList.contains('ready')) v.pause(); });
  }
}
const copyBox = $('.story-copy');
function placeChapters() {
  const mob = MOBILE() || RM;
  chapters.forEach((c, i) => { const dest = mob ? layers[i] : copyBox; if (c.parentNode !== dest) dest.appendChild(c); });
  activeCh = -1; onStory();
}
placeChapters();
matchMedia('(max-width: 700px)').addEventListener('change', placeChapters);
rail.forEach(b => b.addEventListener('click', () => {
  const total = story.offsetHeight - innerHeight, i = +b.dataset.go;
  goTo(story.offsetTop + total * (i / (layers.length - 1)));
}));

/* progress + nav */
const prog = $('#progress'), navwrap = $('#navwrap');
let lastY = 0;
function onScroll() {
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
  navwrap.classList.toggle('hide', y > lastY && y > 300);
  lastY = y;
  onStory();
}
let ticking = false;
addEventListener('scroll', () => { if (lenis || ticking) return; ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); }, { passive: true });
addEventListener('resize', onStory);
onScroll();

/* scanner */
const form = $('#scanner'), input = $('#addr'), btn = $('button[type=submit]', form);
const wrap = $('#report-wrap'), report = $('#report');
let chain = 'btc';
const NAMES = { btc: 'Bitcoin', eth: 'Ethereum', sol: 'Solana', base: 'Base', arb: 'Arbitrum', poly: 'Polygon' };
const RX = { btc: /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/, sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, evm: /^0x[a-fA-F0-9]{40}$/ };
const setTint = t => { hero.classList.remove('t-exposed', 't-protected', 't-scanning'); if (t) hero.classList.add('t-' + t); };

$$('.chip').forEach(c => c.addEventListener('click', () => {
  $$('.chip').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
  c.classList.add('on'); c.setAttribute('aria-checked', 'true');
  chain = c.dataset.chain; input.placeholder = 'Paste a ' + NAMES[chain] + ' address'; clearErr();
}));
input.addEventListener('input', () => {
  const v = input.value.trim(); let g = null;
  if (RX.btc.test(v)) g = 'btc';
  else if (RX.evm.test(v) && !['eth', 'base', 'arb', 'poly'].includes(chain)) g = 'eth';
  else if (RX.sol.test(v) && !/^(1|3)/.test(v)) g = 'sol';
  if (g && g !== chain) $(`.chip[data-chain="${g}"]`).click();
  clearErr();
});
function err(m) { clearErr(); const p = document.createElement('p'); p.className = 'scan-err'; p.id = 'scan-err'; p.textContent = m; form.appendChild(p); input.setAttribute('aria-invalid', 'true'); }
function clearErr() { const e = $('#scan-err'); if (e) e.remove(); input.removeAttribute('aria-invalid'); }
const valid = v => chain === 'btc' ? RX.btc.test(v) : chain === 'sol' ? RX.sol.test(v) : RX.evm.test(v);
const wait = ms => new Promise(r => setTimeout(r, ms));

async function terminal(lines) {
  report.className = 'report'; report.innerHTML = '<div class="term" id="term"></div>'; wrap.hidden = false;
  const term = $('#term');
  for (const l of lines) {
    const prev = $('.cur', term); if (prev) { prev.classList.remove('cur'); prev.classList.add('ok'); }
    const d = document.createElement('div'); d.className = 'cur'; d.textContent = l; term.appendChild(d);
    await wait(RM ? 0 : 450);
  }
}
const LABEL = { exposed: 'Exposed', protected: 'Protected', inherently_exposed: 'Exposed by design', no_private_key: 'No private key', contract: 'Smart contract', program: 'Program account' };
const TONE = { exposed: 'exposed', inherently_exposed: 'exposed', protected: 'protected', no_private_key: 'protected', contract: 'neutral', program: 'neutral' };
function todo(d) {
  if (d.status === 'inherently_exposed' && chain === 'btc') return 'Taproot puts the public key inside the address. For long term storage a SegWit address (bc1q) that has never sent anything keeps the key hidden behind a hash.';
  if (d.status === 'inherently_exposed') return 'Every Solana address is its own public key, so there is no hash to hide behind. Real protection on Solana means a quantum resistant vault program. Those exist but are optional and still early.';
  if (d.status === 'no_private_key') return 'Nothing to migrate here. Check the wallet that controls this program instead.';
  if (d.status === 'exposed' && chain === 'btc') return 'Move long term funds to a fresh address that has never sent a transaction, and do not reuse addresses. Most modern wallets create a new receive address for you.';
  if (d.status === 'exposed') return 'On EVM chains every send reveals the key, so a fresh address only stays hidden until its first send. Keep long term funds on an address you only ever receive to.';
  if (d.status === 'protected') return 'Keep it that way. The first send from this address puts its public key on-chain for good.';
  return 'Quantum risk here depends on how the keys behind this account are managed.';
}
function render(d) {
  const tone = TONE[d.status] || 'neutral', label = LABEL[d.status] || d.status, st = [];
  if (d.outgoing_tx !== undefined) st.push(['Outgoing transactions', Number(d.outgoing_tx).toLocaleString('en-US')]);
  if (d.total_tx !== undefined) st.push(['Total transactions', Number(d.total_tx).toLocaleString('en-US')]);
  if (d.balance) st.push(['Balance', d.balance]);
  if (d.total_received) st.push(['Total received', d.total_received]);
  if (d.address_type) st.push(['Address type', d.address_type]);
  if (d.public_key) st.push(['Public key', d.public_key]);
  if (d.signature_scheme) st.push(['Signature scheme', d.signature_scheme]);
  const share = `https://x.com/intent/tweet?text=${encodeURIComponent(`Scanned my ${d.chain || NAMES[chain]} wallet for quantum exposure. Result: ${label}. Check yours:`)}&url=${encodeURIComponent('https://qshld.tech')}`;
  report.className = 'report ' + tone;
  report.innerHTML = `<div class="r-head"><div class="r-status">${esc(label)}</div><div class="r-chain">${esc(d.chain || NAMES[chain])}</div></div>
    ${st.length ? `<div class="r-stats">${st.map(([k, v]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>` : ''}
    <p class="r-detail">${esc(d.detail)}</p><p class="r-todo">${esc(todo(d))}</p>
    <div class="r-actions"><a class="btn btn-gold" href="${share}" target="_blank" rel="noopener">Share result on X</a><button type="button" class="btn btn-ghost" id="again">Scan another wallet</button></div>`;
  $('#again').addEventListener('click', () => { input.value = ''; input.focus(); wrap.hidden = true; setTint(null); });
  setTint(tone === 'neutral' ? null : tone);
}
form.addEventListener('submit', async e => {
  e.preventDefault();
  const v = input.value.trim();
  if (!v) { err('Paste a wallet address to scan.'); input.focus(); return; }
  if (!valid(v)) { err(`That does not look like a ${NAMES[chain]} address. Check it, or pick the right chain above.`); input.focus(); return; }
  clearErr(); btn.disabled = true; form.classList.add('scanning'); setTint('scanning');
  const fp = fetch(`${API}/api/scan?address=${encodeURIComponent(v)}&chain=${chain}`)
    .then(r => r.json().catch(() => ({ error: 'The scanner sent an unreadable reply. Try again.' })))
    .catch(() => ({ error: 'Could not reach the scanner. Check your connection and try again.' }));
  await terminal([`Address format: ${NAMES[chain]}`, `Connecting to ${NAMES[chain]} nodes`, 'Reading signature history', 'Checking public key exposure']);
  const d = await fp;
  btn.disabled = false; form.classList.remove('scanning');
  if (!d || d.error) { setTint(null); report.className = 'report neutral'; report.innerHTML = `<div class="r-head"><div class="r-status">Scan stopped</div></div><p class="r-detail">${esc(d && d.error || 'Unknown error. Try again.')}</p>`; return; }
  render(d);
});

/* jump to scanner + anchors */
$$('[data-focus-scan]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); goTo(0); setTimeout(() => input.focus({ preventScroll: true }), RM ? 0 : 900); }));
$$('a[href^="#"]:not([data-focus-scan])').forEach(a => a.addEventListener('click', e => {
  const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault(); goTo(t.getBoundingClientRect().top + scrollY - 20);
}));

/* token */
if (TOKEN.ca) {
  $('#ca-val').textContent = TOKEN.ca;
  const c = $('#ca-copy'); c.hidden = false;
  c.addEventListener('click', async () => { try { await navigator.clipboard.writeText(TOKEN.ca); c.textContent = 'Copied'; } catch (e) { c.textContent = 'Select and copy'; } setTimeout(() => (c.textContent = 'Copy'), 1800); });
  if (TOKEN.buy) { const b = $('#ca-buy'); b.href = TOKEN.buy; b.hidden = false; }
}

if (document.readyState === 'complete') startLenis(); else addEventListener('load', startLenis);
})();
