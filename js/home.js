/* Turizmlink — ana vitrin (index.html): ikonlar + hero komisyon simülatörü */
(function () {
  const { hydrate } = TLIcons;
  const { PRICING, pct } = DB;
  const tl = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
  const money = (n) => tl.format(Math.round(n || 0));

  hydrate();
  document.getElementById('year').textContent = new Date().getFullYear();

  // Navbar: kaydırınca gölge
  const nav = document.getElementById('lnav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Simülatör (tek model: satış komisyonu) ----------
     Toplam satış hacmi = gecelik fiyat × satılan gece (liste fiyatı).
     Misafir %5 davet indirimiyle öder; %7 kesinti (elçi %5 + Turizmlink %2) misafirin ödediği tutar üzerinden;
     otelin kasasına ödenen tutarın %93'ü kalır. */
  const sim = { price: 6000, nights: 20 };
  const RANGES = {
    price: { label: 'Ortalama gecelik fiyat', min: 1000, max: 30000, step: 250, fmt: money },
    nights: { label: 'Ayda satılan gece sayısı', min: 1, max: 150, step: 1, fmt: (n) => `${n} gece` },
  };
  const NET = 100 - PRICING.TOTAL;

  function calc() {
    const volume = sim.price * sim.nights;
    const discount = pct(volume, PRICING.GUEST);
    const paid = volume - discount;
    const cut = pct(paid, PRICING.CREATOR) + pct(paid, PRICING.PLATFORM);
    return { volume, discount, paid, cut, net: paid - cut };
  }

  const fill = (k) => { const r = RANGES[k]; return `${(((sim[k] - r.min) / (r.max - r.min)) * 100).toFixed(1)}%`; };

  document.getElementById('hsimRanges').innerHTML = Object.entries(RANGES).map(([k, r]) => `
    <div class="range-field">
      <div class="range-top"><label for="hs-${k}">${r.label}</label><output id="hso-${k}" for="hs-${k}">${r.fmt(sim[k])}</output></div>
      <input type="range" id="hs-${k}" data-k="${k}" min="${r.min}" max="${r.max}" step="${r.step}" value="${sim[k]}" style="--p:${fill(k)}" />
    </div>`).join('');

  function renderOut() {
    const r = calc();
    document.getElementById('hsimOut').innerHTML = `
      <div class="res-rows">
        <div class="res-row"><span>Toplam satış hacmi</span><b>${money(r.volume)}</b></div>
        <div class="res-row neg"><span>Misafir indirimi (%${PRICING.GUEST})</span><b>− ${money(r.discount)}</b></div>
        <div class="res-row neg"><span>Turizmlink & elçi toplam kesintisi (%${PRICING.TOTAL})<small>Misafirin ödediği ${money(r.paid)} üzerinden</small></span><b>− ${money(r.cut)}</b></div>
      </div>
      <div class="hsim-net">
        <span class="res-label">Otelin kasasına kalan net tutar (%${NET})</span>
        <strong class="res-value">${money(r.net)}</strong>
      </div>`;
  }

  document.getElementById('hsimRanges').addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    sim[k] = +e.target.value;
    e.target.style.setProperty('--p', fill(k));
    document.getElementById(`hso-${k}`).textContent = RANGES[k].fmt(sim[k]);
    renderOut();
  });

  renderOut();
})();
