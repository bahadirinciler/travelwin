/* Turizmlink — ana vitrin (index.html): ikonlar + hero komisyon simülatörü */
(function () {
  const { hydrate } = TLIcons;
  const { PRICING, pct } = DB;
  const tl = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
  const money = (n) => tl.format(Math.round(n || 0));

  hydrate();
  document.getElementById('year').textContent = new Date().getFullYear();
  document.querySelectorAll('[data-fee]').forEach((el) => (el.textContent = money(PRICING.BARTER_FEE)));

  // Navbar: kaydırınca gölge
  const nav = document.getElementById('lnav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Simülatör ----------
     Liste fiyatı = gecelik fiyat × satılan gece.
     Misafir %5 davet indirimiyle öder; komisyon (%7 = %5 elçi + %2 platform) ödenen tutar üzerinden, otel öder.
     Barter: otel elçiyi ağırlar (konaklama değeri) + eşleşme başı sabit hizmet bedeli. */
  const sim = { model: 'hybrid', price: 6000, nights: 30, matches: 1, stayNights: 2 };
  const RANGES = {
    price: { label: 'Ortalama gecelik oda fiyatı', min: 1000, max: 30000, step: 250, fmt: money, for: ['commission', 'stay', 'hybrid'] },
    nights: { label: 'Elçi linkiyle aylık satılan gece', min: 1, max: 150, step: 1, fmt: (n) => `${n} gece`, for: ['commission', 'hybrid'] },
    matches: { label: 'Ayda ağırlanan barter elçisi', min: 1, max: 6, step: 1, fmt: (n) => `${n} elçi`, for: ['stay', 'hybrid'] },
    stayNights: { label: 'Elçi başına ücretsiz gece', min: 1, max: 5, step: 1, fmt: (n) => `${n} gece`, for: ['stay', 'hybrid'] },
  };

  function calc() {
    const comm = sim.model !== 'stay';
    const barter = sim.model !== 'commission';
    const list = comm ? sim.price * sim.nights : 0;
    const discount = pct(list, PRICING.GUEST);
    const paid = list - discount;
    const creator = pct(paid, PRICING.CREATOR);
    const platform = pct(paid, PRICING.PLATFORM);
    const fees = barter ? PRICING.BARTER_FEE * sim.matches : 0;
    const giftNights = barter ? sim.stayNights * sim.matches : 0;
    const stayValue = giftNights * sim.price;
    return {
      comm, barter, list, discount, paid, creator, platform, fees, giftNights, stayValue,
      hotelNet: paid - creator - platform - fees,
    };
  }

  const fill = (k) => { const r = RANGES[k]; return `${(((sim[k] - r.min) / (r.max - r.min)) * 100).toFixed(1)}%`; };
  const row = (label, value, cls = '') => `<div class="res-row ${cls}"><span>${label}</span><b>${value}</b></div>`;

  function renderRanges() {
    document.getElementById('hsimRanges').innerHTML = Object.entries(RANGES)
      .filter(([, r]) => r.for.includes(sim.model))
      .map(([k, r]) => `
        <div class="range-field">
          <div class="range-top"><label for="hs-${k}">${r.label}</label><output id="hso-${k}" for="hs-${k}">${r.fmt(sim[k])}</output></div>
          <input type="range" id="hs-${k}" data-k="${k}" min="${r.min}" max="${r.max}" step="${r.step}" value="${sim[k]}" style="--p:${fill(k)}" />
        </div>`).join('');
  }

  function renderOut() {
    const r = calc();
    let html;
    if (r.comm) {
      const seg = (cls, v, label) => (v > 0 ? `<span class="${cls}" style="flex:${v}" title="${label}"></span>` : '');
      html = `
        <div class="hsim-main">
          <span class="res-label">Otelinize kalan aylık net gelir</span>
          <strong class="res-value">${money(r.hotelNet)}</strong>
          <div class="rs-bar" role="img" aria-label="Liste fiyatının dağılımı">
            ${seg('rs-biz', r.hotelNet, 'Otel')}${seg('rs-guest', r.discount, 'Misafir indirimi')}${seg('rs-creator', r.creator, 'Elçi')}${seg('rs-platform', r.platform + r.fees, 'Turizmlink')}
          </div>
          <div class="rs-legend"><span><i class="rs-biz"></i>Otel</span><span><i class="rs-guest"></i>Misafir %${PRICING.GUEST}</span><span><i class="rs-creator"></i>Elçi %${PRICING.CREATOR}</span><span><i class="rs-platform"></i>Turizmlink %${PRICING.PLATFORM}</span></div>
        </div>
        <div class="res-rows">
          ${row('Liste fiyatıyla satış', money(r.list))}
          ${row(`Misafire davet indirimi (%${PRICING.GUEST})`, `− ${money(r.discount)}`, 'neg')}
          ${row('Misafirin ödediği', money(r.paid))}
          ${row(`Toplam komisyon (%${PRICING.TOTAL})`, `− ${money(r.creator + r.platform)}`, 'neg')}
          ${r.barter ? row(`Barter hizmet bedeli (${sim.matches} × ${money(PRICING.BARTER_FEE)})`, `− ${money(r.fees)}`, 'neg') : ''}
          ${r.barter ? row('Ağırlanan elçi konaklaması', `${r.giftNights} gece · ${money(r.stayValue)}`, 'muted-row') : ''}
        </div>`;
    } else {
      html = `
        <div class="hsim-main">
          <span class="res-label">Aylık nakit maliyetiniz</span>
          <strong class="res-value">${money(r.fees)}</strong>
        </div>
        <div class="res-rows">
          ${row(`Barter hizmet bedeli (${sim.matches} × ${money(PRICING.BARTER_FEE)})`, money(r.fees))}
          ${row('Ağırlanan elçi konaklaması', `${r.giftNights} gece · ${money(r.stayValue)}`, 'muted-row')}
          ${row('Satış komisyonu', 'Yok', 'muted-row')}
          ${row('Kazanılan içerik', `${sim.matches} elçi kampanyası`, 'pos')}
        </div>`;
    }
    html += `
      <div class="hsim-minis">
        <div class="res-mini em"><span>Elçinin kazancı</span><strong>${money(r.creator)}</strong>${r.barter ? `<small>+ ${r.giftNights} gece konaklama</small>` : `<small>%${PRICING.CREATOR} net</small>`}</div>
        <div class="res-mini gold"><span>Misafirin tasarrufu</span><strong>${money(r.discount)}</strong><small>%${PRICING.GUEST} davet indirimi</small></div>
        <div class="res-mini"><span>Turizmlink payı</span><strong>${money(r.platform + r.fees)}</strong><small>${r.comm ? `%${PRICING.PLATFORM}` : ''}${r.comm && r.barter ? ' + ' : ''}${r.barter ? 'hizmet bedeli' : ''}</small></div>
      </div>`;
    document.getElementById('hsimOut').innerHTML = html;
  }

  function setModel(m) {
    sim.model = m;
    document.querySelectorAll('#hsimModel button').forEach((b) => {
      const on = b.dataset.model === m;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on);
    });
    renderRanges();
    renderOut();
  }

  document.getElementById('hsimModel').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-model]');
    if (b) setModel(b.dataset.model);
  });
  document.getElementById('hsimRanges').addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    sim[k] = +e.target.value;
    e.target.style.setProperty('--p', fill(k));
    document.getElementById(`hso-${k}`).textContent = RANGES[k].fmt(sim[k]);
    renderOut();
  });

  setModel(sim.model);
})();
