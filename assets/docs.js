(() => {
  const links = [...document.querySelectorAll('.doc-side a')];
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.remove('on'));
    const a = map.get(e.target.id); if (a) a.classList.add('on');
  }), { rootMargin: '-30% 0px -60% 0px' });
  document.querySelectorAll('.doc section[id]').forEach(s => io.observe(s));
})();
