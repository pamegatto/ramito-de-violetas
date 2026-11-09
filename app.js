(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const app = $('#app');
  const FLORES = { violeta: 'Violeta', margarita: 'Margarita', girasol: 'Girasol', rosa: 'Rosa', tulipan: 'Tulipán' };
  const MAX = 7;
  const base = location.origin + location.pathname;
  const state = { f: ['violeta', 'violeta', 'violeta'], p: FRASES[0], t: '', d: '' };

  // ---- Link: toda la tarjeta viaja codificada en el #hash, sin servidor ----
  const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const dec = h => {
    try {
      const o = JSON.parse(decodeURIComponent(escape(atob(h.replace(/-/g, '+').replace(/_/g, '/')))));
      const f = (Array.isArray(o.f) ? o.f : []).filter(x => FLORES[x]).slice(0, MAX);
      if (!f.length) return null;
      return { f, p: String(o.p || '').slice(0, 280), t: String(o.t || '').slice(0, 40), d: String(o.d || '').slice(0, 40) };
    } catch { return null; }
  };

  // ---- Ramo en SVG ----
  function bouquet(f) {
    const S = [[150, 100], [98, 135], [202, 135], [150, 162], [62, 182], [238, 182], [150, 205]];
    let stems = '', leaves = '', heads = '';
    f.forEach((id, i) => {
      const [x, y] = S[i];
      stems += `<path d="M${x} ${y}Q${(x + 150) / 2} ${(y + 300) / 2 + 10} 150 300" stroke="#4f8a4b" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      const lx = x + (150 - x) * .45, ly = y + (300 - y) * .45;
      leaves += `<ellipse cx="${lx}" cy="${ly}" rx="14" ry="6" fill="#6aa965" transform="rotate(${x < 150 ? -35 : 35} ${lx} ${ly})"/>`;
      heads += `<g transform="translate(${x} ${y})"><g class="bloom" style="--d:${(i * .12).toFixed(2)}s"><use href="#f-${id}" transform="scale(.85) rotate(${i * 41})"/></g></g>`;
    });
    return `<svg viewBox="0 0 300 340" role="img" aria-label="Ramo de flores">${stems}${leaves}${heads}` +
      `<path d="M70 232 L230 232 L168 332 L132 332Z" fill="#f4e7d0" stroke="#d9c4a0" stroke-width="2"/>` +
      `<path d="M118 258 L182 258 L168 332 L132 332Z" fill="#e3d0f5" opacity=".75"/>` +
      `<path d="M150 262 l-24 -13 v26z M150 262 l24 -13 v26z" fill="#6b3fa8"/><circle cx="150" cy="262" r="5" fill="#4f2a82"/></svg>`;
  }

  // ---- Tarjeta (el texto se inserta con textContent, nunca como HTML) ----
  function card(s) {
    const a = document.createElement('article');
    a.className = 'card';
    a.innerHTML = bouquet(s.f) + '<p class="to"></p><blockquote></blockquote><p class="from"></p>';
    $('.to', a).textContent = s.t ? `Para ${s.t}` : '';
    $('blockquote', a).textContent = s.p;
    $('.from', a).textContent = s.d ? `— ${s.d}` : '';
    return a;
  }

  // ---- Botones para compartir ----
  function shareBar(text, copyText) {
    const q = encodeURIComponent(text);
    const bar = document.createElement('div');
    bar.className = 'actions';
    bar.innerHTML =
      `<a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${q}">WhatsApp</a>` +
      `<a class="btn" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=${q}">X</a>` +
      (navigator.share ? '<button class="btn" data-a="share">Más opciones</button>' : '') +
      '<button class="btn ghost" data-a="copy">Copiar</button>';
    bar.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.a === 'share') navigator.share({ text }).catch(() => {});
      if (b.dataset.a === 'copy') {
        navigator.clipboard.writeText(copyText).then(() => { b.textContent = '¡Copiado!'; setTimeout(() => (b.textContent = 'Copiar'), 1800); },
          () => { b.textContent = 'No se pudo copiar'; });
      }
    };
    return bar;
  }

  // ---- Pantalla 1: armar el ramito ----
  function editor() {
    app.innerHTML = `
      <header class="hero"><h1>Ramito de violetas</h1><p>Armá un ramito, escribile unas palabras y mandáselo a alguien que quieras.</p></header>
      <section class="step"><h2>1 · Elegí las flores <small>hasta ${MAX}</small></h2>
        <div class="picker">${Object.entries(FLORES).map(([id, n]) =>
          `<button class="pick" data-id="${id}" aria-label="Agregar ${n}"><svg viewBox="-50 -50 100 100"><use href="#f-${id}"/></svg>${n}</button>`).join('')}</div>
        <button class="link" id="undo">Quitar la última</button></section>
      <section class="step"><h2>2 · Elegí una frase o escribí la tuya</h2>
        <select id="frase" aria-label="Frases"></select>
        <textarea id="txt" maxlength="280" aria-label="Tu mensaje"></textarea></section>
      <section class="step"><h2>3 · ¿Para quién es?</h2>
        <div class="row"><input id="to" maxlength="40" placeholder="Para" aria-label="Para"><input id="from" maxlength="40" placeholder="De (opcional)" aria-label="De"></div></section>
      <section class="step"><h2>Tu tarjeta</h2><div id="preview"></div><div id="bar"></div></section>`;

    const sel = $('#frase');
    sel.innerHTML = FRASES.map((f, i) => `<option value="${i}">${f.length > 58 ? f.slice(0, 58) + '…' : f}</option>`).join('');
    $('#txt').value = state.p;

    const redraw = () => {
      $('#preview').replaceChildren(card(state));
      const link = base + '#c=' + enc(state);
      $('#bar').replaceChildren(shareBar(`${state.t ? state.t + ', t' : 'T'}e mandé un ramito de violetas 💜 ${link}`, link));
    };
    $('.picker').onclick = e => {
      const b = e.target.closest('.pick');
      if (b && state.f.length < MAX) { state.f.push(b.dataset.id); redraw(); }
    };
    $('#undo').onclick = () => { if (state.f.length > 1) { state.f.pop(); redraw(); } };
    sel.onchange = () => { state.p = FRASES[sel.value]; $('#txt').value = state.p; redraw(); };
    $('#txt').oninput = e => { state.p = e.target.value; redraw(); };
    $('#to').oninput = e => { state.t = e.target.value.trim(); redraw(); };
    $('#from').oninput = e => { state.d = e.target.value.trim(); redraw(); };
    redraw();
  }

  // ---- Pantalla 2: quien recibe el ramito ----
  function receiver(s) {
    app.innerHTML = `
      <header class="hero small"><h1>Te mandaron un ramito de violetas</h1></header>
      <div id="preview"></div>
      <section class="reply"><h2>¿Te llegó? Contalo</h2><div id="bar"></div></section>
      <p class="foot"><a href="${base}">Armá uno y mandáselo a alguien</a></p>`;
    $('#preview').replaceChildren(card(s));
    const text = `Recibí mi ramito de violetas 💜 ${base}`;
    $('#bar').replaceChildren(shareBar(text, text));
  }

  function route() {
    const m = location.hash.match(/^#c=(.+)$/);
    const data = m && dec(m[1]);
    window.scrollTo(0, 0);
    data ? receiver(data) : editor();
  }
  addEventListener('hashchange', route);
  route();
})();
