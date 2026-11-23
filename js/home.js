/* Turizmlink — ana sayfa (butik otel koleksiyonu) */
(function () {
  const { ic, hydrate } = TLIcons;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tl = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
  const money = (n) => tl.format(Math.round(n || 0));

  /* ---------- Elçi kodu (URL ?ref= veya 30 gün hafıza) ---------- */
  const ref = DB.activeRef();
  const refApp = ref ? DB.byCode(ref) : null;
  const refName = refApp ? DB.creator(refApp.creatorId)?.name : '';
  const hotelUrl = (id) => `hotel.html?h=${encodeURIComponent(id)}${ref ? `&ref=${encodeURIComponent(ref)}` : ''}`;

  /* ---------- Koleksiyon ----------
     live: rezervasyona açık gerçek otel (fiyat DB'den). Diğerleri "Çok yakında" vitrini;
     rezervasyon almaz, fiyat göstermez. */
  const casa = DB.business('b5');
  const casaFrom = casa ? Math.min(...casa.rooms.map((r) => DB.fromPrice(casa, r))) : 0;
  const HOTELS = [
    casa && { id: casa.id, live: true, name: casa.name, region: casa.region, tags: ['Taş Mimari', 'Selvili Bahçeler'], img: casa.cover, from: casaFrom },
    { id: 'mavi-koy', name: 'Mavi Koy Butik Otel', region: 'Bodrum', tags: ['Beyaz Mimari', 'Sonsuzluk Havuzu'], img: 'assets/stock/bodrum.jpg' },
    { id: 'likya-teras', name: 'Likya Teras Evleri', region: 'Kaş', tags: ['Deniz Manzarası', 'Sakin Koylar'], img: 'assets/stock/kas.jpg' },
    { id: 'beyaz-avlu', name: 'Beyaz Avlu Konak', region: 'Alaçatı', tags: ['Taş Sokaklar', 'Rüzgârlı Akşamlar'], img: 'assets/stock/alacati.jpg' },
    { id: 'koy-evi', name: 'Koy Evi Göcek', region: 'Göcek', tags: ['Ahşap Teras', 'Koy Manzarası'], img: 'assets/stock/gocek.jpg' },
  ].filter(Boolean);
  const REGIONS = ['Tümü', ...new Set(HOTELS.map((h) => h.region))];
  let region = 'Tümü';

  function card(h) {
    const inner = `
      <div class="hcard-media">
        <img src="${esc(h.img)}" alt="${esc(h.name)}, ${esc(h.region)}" loading="lazy" />
        <span class="hcard-badge ${h.live ? '' : 'soon'}">${h.live ? '%10 Kapora ile Yerini Ayırt' : 'Çok Yakında'}</span>
      </div>
      <div class="hcard-body">
        <div class="hcard-top">
          <h3>${esc(h.name)}</h3>
          <span class="hcard-loc">${ic('pin')} ${esc(h.region)}</span>
        </div>
        <p class="hcard-tags">${h.tags.map(esc).join(' <span aria-hidden="true">•</span> ')}</p>
        ${h.live
          ? `<p class="hcard-price"><s>${money(h.from)}</s> <b>${money(DB.guestPrice(h.from, true).total)}</b> <small>/ gece'den</small></p>`
          : `<p class="hcard-price soon">Davetli ön açılış yakında</p>`}
      </div>`;
    return h.live
      ? `<a class="hcard" href="${hotelUrl(h.id)}" data-region="${esc(h.region)}">${inner}</a>`
      : `<article class="hcard is-soon" data-region="${esc(h.region)}" aria-label="${esc(h.name)} — çok yakında">${inner}</article>`;
  }

  function render() {
    document.getElementById('regions').innerHTML = REGIONS.map((r) =>
      `<button type="button" role="tab" class="region ${r === region ? 'active' : ''}" aria-selected="${r === region}" data-region="${esc(r)}">${esc(r)}</button>`).join('');
    const list = HOTELS.filter((h) => region === 'Tümü' || h.region === region);
    document.getElementById('hgrid').innerHTML = list.map(card).join('');
  }

  document.getElementById('regions').addEventListener('click', (e) => {
    const b = e.target.closest('[data-region]');
    if (!b) return;
    region = b.dataset.region;
    render();
  });

  /* ---------- Elçi daveti şeridi ---------- */
  const amb = document.getElementById('amb');
  amb.innerHTML = ref
    ? `<span class="amb-ico">${ic('gift')}</span><p><b>${esc(refName || 'Elçimizin')} davetiyle geldiniz:</b> Tüm butik otellerde size özel %5 ayrıcalıklı fiyat aktif.${refName ? '' : ` <code>${esc(ref.toLocaleUpperCase('tr-TR'))}</code>`}</p>`
    : `<span class="amb-ico">${ic('sparkles')}</span><p><b>Sen de arkadaşın gibi elçi ol,</b> hemen kazanmaya başla.</p><a class="mbtn mbtn-ghost" href="app.html">Elçi Ol ${ic('arrow')}</a>`;
  amb.classList.toggle('amb-invite', !ref);
  amb.hidden = false;

  /* ---------- Menü: hero üstünde şeffaf, kaydırınca krem ---------- */
  const nav = document.getElementById('mnav');
  const onScroll = () => nav.classList.toggle('mnav-solid', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  document.getElementById('year').textContent = new Date().getFullYear();
  render();
  hydrate();
})();
