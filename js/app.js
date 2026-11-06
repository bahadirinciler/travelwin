/* TravelWin — tek sayfa uygulama (hash router + görünümler) */
(function () {
  const { REGIONS, CATEGORIES, MODELS, PRICING, CURRENT, pct } = DB;
  const $app = document.getElementById('app');
  const $modal = document.getElementById('modal');
  const $modalCard = document.getElementById('modalCard');
  const $toast = document.getElementById('toast');
  const ROLE_KEY = 'travelwin:role';

  /* ---------- Yardımcılar ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tl = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
  const num = new Intl.NumberFormat('tr-TR');
  const money = (n) => tl.format(Math.round(n || 0));
  const compact = (n) => new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  function ago(ts) {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return 'şimdi';
    if (m < 60) return `${m} dk önce`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} sa önce`;
    return `${Math.round(h / 24)} gün önce`;
  }

  function getRole() {
    try { return localStorage.getItem(ROLE_KEY) || 'creator'; } catch (e) { return 'creator'; }
  }
  function setRole(r) {
    try { localStorage.setItem(ROLE_KEY, r); } catch (e) { /* yoksay */ }
  }

  let toastTimer;
  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove('show'), 2400);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (_) { /* yoksay */ }
      ta.remove();
    }
    toast('Link kopyalandı');
  }

  function openModal(html) {
    $modalCard.innerHTML = html;
    $modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $modalCard.querySelector('textarea, input, button:not(.modal-close)')?.focus({ preventScroll: true });
  }
  function closeModal() {
    $modal.hidden = true;
    document.body.style.overflow = '';
  }

  /* ---------- İkon seti (çizgi ikonlar, 24px grid) ---------- */
  const ICONS = {
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    userplus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    bed: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    boat: '<path d="M22 18H2a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4Z"/><path d="M21 14 10 2 3 14h18Z"/><path d="M10 2v16"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    trending: '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/>',
    utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    waves: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
    sparkles: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M21 5h-4"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    grid: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    copy: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    pointer: '<path d="m4 4 7.07 17 2.51-7.39L21 11.07z"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    calculator: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/>',
  };
  const ic = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  /* ---------- Küçük bileşenler ---------- */
  const cat = (o) => CATEGORIES[o.category] || { label: o.category, icon: 'pin' };

  function rewardChips(o) {
    const out = [];
    if (DB.hasCommission(o)) out.push(`<span class="chip chip-commission">${ic('percent')} %${PRICING.CREATOR} komisyon</span>`);
    if (DB.hasBarter(o) && o.stay) out.push(`<span class="chip chip-stay">${ic('bed')} ${o.stay.nights} gece · ${o.stay.guests} kişi</span>`);
    return out.join('');
  }

  function statusChip(status) {
    const map = { pending: ['Beklemede', 'chip-pending', 'clock'], approved: ['Onaylandı', 'chip-approved', 'check'], rejected: ['Reddedildi', 'chip-rejected', 'x'] };
    const [label, cls, icn] = map[status];
    return `<span class="chip ${cls}">${ic(icn)} ${label}</span>`;
  }

  function stat({ label, value, sub = '', icon = '', highlight = false }) {
    return `<div class="card stat ${highlight ? 'highlight' : ''}">${icon ? `<span class="stat-ico">${ic(icon)}</span>` : ''}<div class="label">${label}</div><div class="value">${value}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
  }

  function linkBox(code) {
    const url = DB.affiliateUrl(code);
    return `<div class="link-box"><code title="${esc(url)}">${esc(url)}</code>
      <button class="btn btn-primary btn-sm" data-action="copy" data-url="${esc(url)}">${ic('copy')} Kopyala</button>
      <a class="btn btn-ghost btn-sm" href="#/r/${esc(code)}" target="_blank" rel="noopener">${ic('external')} Test et</a></div>`;
  }

  function empty(icon, title, text, cta = '') {
    return `<div class="empty"><div class="empty-ico">${ic(icon)}</div><h3>${title}</h3><p>${text}</p>${cta}</div>`;
  }

  function offerCard(o) {
    const b = DB.business(o.businessId);
    const c = cat(o);
    return `
      <article class="card offer-card" tabindex="0" data-action="open-offer" data-id="${o.id}">
        <div class="offer-cover cover-${o.category}">
          <div class="chips"><span class="chip chip-glass">${ic(c.icon)} ${c.label}</span><span class="chip chip-glass">${ic('pin')} ${esc(o.region)}</span></div>
          <span class="cover-ico" aria-hidden="true">${ic(c.icon)}</span>
          <span class="model-badge model-${o.model}">${ic(MODELS[o.model].icon)} ${MODELS[o.model].label}</span>
        </div>
        <div class="offer-body">
          <div class="offer-title">${esc(o.title)}</div>
          <div class="offer-meta"><span>${ic('building')} ${esc(b?.name)}</span><span class="offer-price">${money(o.price)}</span></div>
          <div class="offer-reward">${rewardChips(o)}</div>
        </div>
      </article>`;
  }

  /* ---------- Navigasyon ---------- */
  const NAV = {
    creator: [
      { href: '#/c/offers', label: 'Teklifler', icon: 'compass' },
      { href: '#/c/apps', label: 'Başvurularım', icon: 'inbox' },
      { href: '#/c/earnings', label: 'Kazançlar', icon: 'wallet' },
    ],
    business: [
      { href: '#/b/dashboard', label: 'Panel', icon: 'grid' },
      { href: '#/b/offers', label: 'Tekliflerim', icon: 'tag' },
      { href: '#/b/apps', label: 'Başvurular', icon: 'inbox' },
      { href: '#/b/new', label: 'Yeni teklif', icon: 'plus' },
    ],
  };

  function renderNav(path) {
    const role = getRole();
    const items = NAV[role];
    const pending = role === 'business' ? DB.applications({ businessId: CURRENT.business, status: 'pending' }).length : 0;
    const isActive = (href) => path === href.slice(1);
    document.getElementById('topnav').innerHTML = items
      .map((i) => `<a href="${i.href}" class="${isActive(i.href) ? 'active' : ''}">${ic(i.icon)} ${i.label}${i.href === '#/b/apps' && pending ? `<span class="nav-count">${pending}</span>` : ''}</a>`)
      .join('');
    document.getElementById('bottomnav').innerHTML = items
      .map((i) => `<a href="${i.href}" class="${isActive(i.href) ? 'active' : ''}">${ic(i.icon)}${i.label}${i.href === '#/b/apps' && pending ? `<span class="badge-dot">${pending}</span>` : ''}</a>`)
      .join('');
    document.querySelectorAll('#roleSwitch button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.role === role);
      btn.setAttribute('aria-selected', btn.dataset.role === role);
    });
  }

  /* ---------- Teklif filtreleri (ana sayfa + üretici sayfası ortak) ---------- */
  const offerFilter = { region: 'all', category: 'all', model: 'all', q: '' };

  function filteredOffers() {
    const q = offerFilter.q.trim().toLocaleLowerCase('tr-TR');
    return DB.offers({ activeOnly: true }).filter((o) =>
      (offerFilter.region === 'all' || o.region === offerFilter.region) &&
      (offerFilter.category === 'all' || o.category === offerFilter.category) &&
      (offerFilter.model === 'all' || o.model === offerFilter.model) &&
      (!q || `${o.title} ${o.description} ${DB.business(o.businessId)?.name}`.toLocaleLowerCase('tr-TR').includes(q))
    );
  }

  function offerGridHtml(limit) {
    let list = filteredOffers();
    if (limit) list = list.slice(0, limit);
    return list.length
      ? `<div class="grid grid-cards">${list.map(offerCard).join('')}</div>`
      : empty('search', 'Eşleşen teklif yok', 'Farklı bir kazanç modeli, bölge veya filtre deneyin.');
  }

  function modelFilterBar() {
    const all = DB.offers({ activeOnly: true });
    const count = (k) => (k === 'all' ? all.length : all.filter((o) => o.model === k).length);
    const opts = [['all', 'Tümü', 'grid'], ...Object.entries(MODELS).map(([k, m]) => [k, m.filter, m.icon])];
    return `<div class="model-filter" role="group" aria-label="Kazanç modeline göre filtrele">
      ${opts.map(([k, l, i]) => `<button class="mf-btn mf-${k} ${offerFilter.model === k ? 'active' : ''}" data-action="filter-model" data-model="${k}" aria-pressed="${offerFilter.model === k}">${ic(i)} ${l}<span class="mf-count">${count(k)}</span></button>`).join('')}
    </div>`;
  }

  function refreshOfferGrid() {
    const grid = document.getElementById('offerGrid');
    if (grid) grid.innerHTML = offerGridHtml(+grid.dataset.limit || 0);
  }

  /* ================= GÖRÜNÜMLER ================= */

  /* ---------- Kazanç simülatörü ---------- */
  const sim = { role: 'creator', model: 'hybrid', revenue: 250000, nights: 2, nightValue: 6000, matches: 2 };
  const SIM_RANGES = {
    revenue: { label: 'Aylık affiliate ciro', min: 0, max: 2000000, step: 10000, fmt: money, for: ['commission', 'hybrid'] },
    nights: { label: 'Eşleşme başı konaklama', min: 1, max: 7, step: 1, fmt: (n) => `${n} gece`, for: ['stay', 'hybrid'] },
    nightValue: { label: 'Gecelik konaklama değeri', min: 1000, max: 20000, step: 500, fmt: money, for: ['stay', 'hybrid'] },
    matches: { label: 'Aylık barter eşleşmesi', min: 1, max: 10, step: 1, fmt: (n) => `${n} eşleşme`, for: ['stay', 'hybrid'] },
  };

  function simCalc() {
    const comm = sim.model !== 'stay';
    const barter = sim.model !== 'commission';
    const revenue = comm ? sim.revenue : 0;
    const pool = pct(revenue, PRICING.POOL);
    const creatorComm = pct(revenue, PRICING.CREATOR);
    const platformComm = pct(revenue, PRICING.PLATFORM);
    const fees = barter ? PRICING.BARTER_FEE * sim.matches : 0;
    const stayValue = barter ? sim.nights * sim.nightValue * sim.matches : 0;
    return {
      comm, barter, revenue, pool, creatorComm, platformComm, fees, stayValue,
      totalNights: barter ? sim.nights * sim.matches : 0,
      creatorTotal: creatorComm + stayValue,
      businessNet: revenue - pool - fees,
      platformTotal: platformComm + fees,
      roas: pool + fees ? revenue / (pool + fees) : 0,
    };
  }

  const resRow = (label, value, cls = '') => `<div class="res-row ${cls}"><span>${label}</span><b>${value}</b></div>`;

  function simResultsHtml() {
    const r = simCalc();
    let main;
    if (sim.role === 'creator') {
      main = `
        <span class="res-label">Aylık toplam kazancın</span>
        <strong class="res-value">${money(r.creatorTotal)}</strong>
        <div class="res-rows">
          ${r.comm ? resRow(`Satış komisyonu (%${PRICING.CREATOR})`, money(r.creatorComm)) : ''}
          ${r.barter ? resRow('Ücretsiz konaklama değeri', money(r.stayValue)) : ''}
          ${r.barter ? resRow('Toplam konaklama', `${r.totalNights} gece`) : ''}
          ${resRow('Platform kesintisi', 'Yok — işletme öder', 'muted-row')}
        </div>`;
    } else {
      main = r.comm ? `
        <span class="res-label">Aylık net affiliate gelirin</span>
        <strong class="res-value">${money(r.businessNet)}</strong>
        <div class="res-rows">
          ${resRow('Affiliate ciro', money(r.revenue))}
          ${resRow(`Komisyon havuzu (%${PRICING.POOL})`, `− ${money(r.pool)}`, 'neg')}
          ${r.barter ? resRow(`Barter hizmet bedeli (${sim.matches} × ${money(PRICING.BARTER_FEE)})`, `− ${money(r.fees)}`, 'neg') : ''}
          ${r.barter ? resRow('Verilen konaklama (ayni)', `${r.totalNights} gece · ${money(r.stayValue)}`, 'muted-row') : ''}
          ${resRow('Pazarlama getirisi (ROAS)', `${r.roas.toFixed(1).replace('.', ',')}x`, 'pos')}
        </div>` : `
        <span class="res-label">Aylık nakit maliyetin</span>
        <strong class="res-value">${money(r.fees)}</strong>
        <div class="res-rows">
          ${resRow(`Barter hizmet bedeli (${sim.matches} × ${money(PRICING.BARTER_FEE)})`, money(r.fees))}
          ${resRow('Verilen konaklama (ayni)', `${r.totalNights} gece · ${money(r.stayValue)}`, 'muted-row')}
          ${resRow('Satış komisyonu', 'Yok', 'muted-row')}
          ${resRow('Kazanılan içerik', `${sim.matches} üretici kampanyası`, 'pos')}
        </div>`;
    }

    const other = sim.role === 'creator'
      ? { label: 'İşletmenin net geliri', value: r.comm ? money(r.businessNet) : `${money(r.fees)} maliyet`, cls: '' }
      : { label: 'Üreticinin kazancı', value: money(r.creatorTotal), cls: 'em' };

    const split = r.comm && r.revenue > 0 ? `
      <div class="res-split">
        <div class="rs-bar" role="img" aria-label="Ciro dağılımı: işletme %${100 - PRICING.POOL}, üretici %${PRICING.CREATOR}, Travelwin %${PRICING.PLATFORM}">
          <span class="rs-biz" style="flex:${100 - PRICING.POOL}"></span><span class="rs-creator" style="flex:${PRICING.CREATOR}"></span><span class="rs-platform" style="flex:${PRICING.PLATFORM}"></span>
        </div>
        <div class="rs-legend">
          <span><i class="rs-biz"></i>İşletme %${100 - PRICING.POOL}</span><span><i class="rs-creator"></i>Üretici %${PRICING.CREATOR}</span><span><i class="rs-platform"></i>Travelwin %${PRICING.PLATFORM}</span>
        </div>
      </div>` : '';

    return `
      <div class="res-main">${main}</div>
      ${split}
      <div class="res-others">
        <div class="res-mini ${other.cls}"><span>${other.label}</span><strong>${other.value}</strong></div>
        <div class="res-mini gold"><span>Travelwin payı</span><strong>${money(r.platformTotal)}</strong></div>
      </div>
      <button class="btn btn-accent res-cta" data-action="go-role" data-role="${sim.role}">${sim.role === 'creator' ? 'Teklifleri keşfet' : 'İlk teklifini yayınla'} ${ic('arrow')}</button>`;
  }

  const rangeFill = (k) => {
    const r = SIM_RANGES[k];
    return `${(((sim[k] - r.min) / (r.max - r.min)) * 100).toFixed(1)}%`;
  };

  function simSection() {
    const roles = [['creator', 'İçerik üreticisiyim', 'camera'], ['business', 'İşletmeyim', 'building']];
    return `
      <section class="sim" id="simulator" aria-labelledby="sim-title">
        <div class="sim-head">
          <div>
            <span class="eyebrow eyebrow-gold">${ic('calculator')} Kazanç / komisyon simülatörü</span>
            <h2 id="sim-title">Kazancını saniyeler içinde hesapla</h2>
            <p>Sürgülerle ciroyu ve konaklamayı değiştir; işletme, üretici ve Travelwin paylarını anında gör.</p>
          </div>
          <div class="seg-toggle" role="group" aria-label="Kimin gözünden hesaplansın?">
            ${roles.map(([k, l, i]) => `<button class="${sim.role === k ? 'active' : ''}" data-action="sim-role" data-role="${k}" aria-pressed="${sim.role === k}">${ic(i)} ${l}</button>`).join('')}
          </div>
        </div>
        <div class="sim-body">
          <div class="sim-controls">
            <div class="sim-label">Kazanç modeli</div>
            <div class="seg-toggle seg-full" role="group" aria-label="Kazanç modeli">
              ${Object.entries(MODELS).map(([k, m]) => `<button class="${sim.model === k ? 'active' : ''}" data-action="sim-model" data-model="${k}" aria-pressed="${sim.model === k}">${ic(m.icon)} ${m.label}</button>`).join('')}
            </div>
            ${Object.entries(SIM_RANGES).map(([k, r]) => `
              <div class="range-field" ${r.for.includes(sim.model) ? '' : 'hidden'}>
                <div class="range-top"><label for="sim-${k}">${r.label}</label><output id="out-${k}" for="sim-${k}">${r.fmt(sim[k])}</output></div>
                <input type="range" id="sim-${k}" data-sim="${k}" min="${r.min}" max="${r.max}" step="${r.step}" value="${sim[k]}" style="--p:${rangeFill(k)}" />
                <div class="range-scale"><span>${r.fmt(r.min)}</span><span>${r.fmt(r.max)}</span></div>
              </div>`).join('')}
            <div class="pool-explainer">
              <div class="pool-title">${ic('info')} Gelir paylaşımı nasıl işler?</div>
              <div class="pool-bar"><span class="pb-creator" style="flex:${PRICING.CREATOR}">%${PRICING.CREATOR} üretici</span><span class="pb-platform" style="flex:${PRICING.PLATFORM}">%${PRICING.PLATFORM}</span></div>
              <p>İşletme her satışta <b>%${PRICING.POOL} komisyon havuzu</b> açar: %${PRICING.CREATOR}'si içerik üreticisine, %${PRICING.PLATFORM}'ü Travelwin'e. Barter eşleşmelerinde işletme eşleşme başına <b>${money(PRICING.BARTER_FEE)} sabit hizmet bedeli</b> öder.</p>
            </div>
          </div>
          <div class="sim-results" id="simResults" aria-live="polite">${simResultsHtml()}</div>
        </div>
      </section>`;
  }

  function rerenderSim() {
    const el = document.getElementById('simulator');
    if (el) el.outerHTML = simSection();
  }

  /* ---------- Landing ---------- */
  function viewHome() {
    const offers = DB.offers({ activeOnly: true });
    const regionCount = new Set(offers.map((o) => o.region)).size;
    const stayCount = offers.filter((o) => DB.hasBarter(o)).length;

    const entries = [
      {
        key: 'biz', role: 'business', icon: 'building', eyebrow: 'İşletmeler için', title: 'Doluluğunu Artır',
        lead: 'Otel, tekne, tur ve deneyim işletmeleri için performansa dayalı pazarlama.',
        points: [
          `Sadece gerçekleşen satışa %${PRICING.POOL} komisyon öde`,
          'Bölgene ilgi duyan doğrulanmış üreticilerle eşleş',
          'Rezervasyon, tıklama ve ROAS\'ı canlı izle',
        ],
        cta: 'İşletme olarak başla', meta: 'Otel · Tekne · Tur · Restoran',
      },
      {
        key: 'creator', role: 'creator', icon: 'camera', eyebrow: 'İçerik üreticileri için', title: 'Seyahat Et & Kazan',
        lead: 'Instagram, TikTok, YouTube ve blog üreticileri için bölgesel iş birlikleri.',
        points: [
          `Linkinden gelen her satıştan %${PRICING.CREATOR} komisyon`,
          'İçerik karşılığı ücretsiz konaklama (barter)',
          'Komisyondan platform kesintisi yok',
        ],
        cta: 'Üretici olarak başla', meta: `${offers.length} aktif teklif · ${stayCount} konaklama fırsatı`,
      },
    ];

    const steps = [
      { icon: 'userplus', title: 'Kayıt Ol', text: 'İşletme teklifini yayınlar; içerik üreticisi profilini oluşturup bölgesindeki tekliflere başvurur.',
        demo: `<span class="demo-chip">${ic('building')} Mavi Koy Otel</span><span class="demo-chip">${ic('camera')} @aysegezgin</span>` },
      { icon: 'link', title: 'Link Al', text: 'Başvuru onaylandığında üreticiye özel, takip edilebilir affiliate link anında oluşur.',
        demo: `<span class="demo-chip demo-link">${ic('link')} travelwin.app/r/AYSE-O1</span>` },
      { icon: 'send', title: 'Paylaş', text: 'Deneyim Reels, Story, vlog ya da blogda linkle paylaşılır; her tıklama ve rezervasyon kaydedilir.',
        demo: `<span class="demo-chip">${ic('pointer')} 412 tıklama</span><span class="demo-chip">${ic('check')} 5 satış</span>` },
      { icon: 'wallet', title: 'Komisyon Kazan', text: `Her satışta %${PRICING.POOL} havuzun %${PRICING.CREATOR}'si üreticiye geçer. Barter'da konaklama ücretsiz.`,
        demo: `<span class="demo-chip demo-money">${ic('percent')} %${PRICING.CREATOR} üretici</span><span class="demo-chip demo-gold">${ic('bed')} 2 gece</span>` },
    ];

    return `
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <span class="hero-badge">${ic('award')} Turizme özel affiliate ağı</span>
          <h1 id="hero-title">Doluluğu artıran, <em>seyahati kazandıran</em> iş ortaklığı</h1>
          <p class="lead">Oteller, tekneler ve deneyim sağlayıcıları; güvenilir içerik üreticileriyle eşleşir. Şeffaf %${PRICING.POOL} komisyon havuzu, ücretsiz konaklama ve canlı performans takibi tek platformda.</p>
          <div class="hero-stats">
            <div><strong>%${PRICING.CREATOR}</strong><span>üretici komisyonu</span></div>
            <div><strong>${offers.length}</strong><span>aktif teklif</span></div>
            <div><strong>${regionCount}</strong><span>bölge</span></div>
          </div>
        </div>
        <div class="entry-grid">
          ${entries.map((e) => `
            <article class="entry entry-${e.key}">
              <div class="entry-top">
                <span class="entry-ico">${ic(e.icon)}</span>
                <div><span class="entry-eyebrow">${e.eyebrow}</span><h2>${e.title}</h2></div>
              </div>
              <p>${e.lead}</p>
              <ul class="entry-points">${e.points.map((p) => `<li><span class="ep-check">${ic('check')}</span>${p}</li>`).join('')}</ul>
              <div class="entry-foot">
                <button class="btn btn-entry" data-action="go-role" data-role="${e.role}">${e.cta} ${ic('arrow')}</button>
                <span class="entry-meta">${e.meta}</span>
              </div>
            </article>`).join('')}
        </div>
      </section>

      <section class="how" aria-labelledby="how-title">
        <div class="sec-head center">
          <span class="eyebrow">Nasıl çalışır?</span>
          <h2 id="how-title">Dört adımda kazanmaya başla</h2>
          <p>Kayıttan komisyona kadar tüm süreç şeffaf ve takip edilebilir.</p>
        </div>
        <ol class="steps4">
          ${steps.map((s, i) => `
            <li class="step4">
              <span class="step4-num">Adım 0${i + 1}</span>
              <span class="step4-ico">${ic(s.icon)}</span>
              <h3>${s.title}</h3>
              <p>${s.text}</p>
              <div class="flow-demo">${s.demo}</div>
            </li>`).join('')}
        </ol>
      </section>

      ${simSection()}

      <section class="offers-sec" aria-labelledby="offers-title">
        <div class="sec-head">
          <div><span class="eyebrow">İlanlar</span><h2 id="offers-title">Açık iş birliği teklifleri</h2></div>
          <a href="#/c/offers" class="link-arrow" data-action="go-role-link" data-role="creator">Tümünü gör ${ic('arrow')}</a>
        </div>
        ${modelFilterBar()}
        <div id="offerGrid" data-limit="6">${offerGridHtml(6)}</div>
      </section>`;
  }

  /* ---------- Üretici: Teklifler ---------- */
  function viewCreatorOffers() {
    const me = DB.creator(CURRENT.creator);
    return `
      <div class="page-head">
        <div><h1>Merhaba ${esc(me.name.split(' ')[0])}</h1><p>Bölgendeki işletmelerin açık iş birliği teklifleri.</p></div>
      </div>
      ${modelFilterBar()}
      <div class="pills" role="group" aria-label="Bölge">
        ${['all', ...REGIONS].map((r) => `<button class="pill ${offerFilter.region === r ? 'active' : ''}" data-action="filter-region" data-region="${r}">${r === 'all' ? 'Tüm bölgeler' : ic('pin') + ' ' + r}</button>`).join('')}
      </div>
      <div class="filters">
        <input class="input" type="search" id="offerSearch" placeholder="Otel, tekne, tur ara…" value="${esc(offerFilter.q)}" aria-label="Ara" />
        <select class="select" id="catFilter" aria-label="Kategori">
          <option value="all">Tüm kategoriler</option>
          ${Object.entries(CATEGORIES).map(([k, v]) => `<option value="${k}" ${offerFilter.category === k ? 'selected' : ''}>${v.label}</option>`).join('')}
        </select>
      </div>
      <div id="offerGrid">${offerGridHtml()}</div>`;
  }

  function offerDetail(id) {
    const o = DB.offer(id);
    if (!o) return;
    const b = DB.business(o.businessId);
    const c = cat(o);
    const role = getRole();
    const me = DB.creator(CURRENT.creator);
    const existing = DB.applicationFor(o.id, me.id);
    const eligible = me.followers >= (o.minFollowers || 0);

    let action = '';
    if (role === 'creator') {
      if (existing) {
        action = `<div class="card card-pad"><div class="flex"><strong>Başvurun</strong>${statusChip(existing.status)}</div>
          ${existing.status === 'approved' ? `<p class="muted" style="margin:10px 0">Kişisel affiliate linkin:</p>${linkBox(existing.code)}` : ''}
          ${existing.status === 'pending' ? `<p class="muted" style="margin:8px 0 0">İşletme başvurunu inceliyor. Onaylandığında linkin burada ve “Başvurularım” sayfasında görünecek.</p>` : ''}</div>`;
      } else {
        action = `
          <form id="applyForm" data-id="${o.id}" class="flex" style="flex-direction:column;align-items:stretch">
            <div class="field"><label for="applyMsg">İşletmeye notun</label>
              <textarea class="textarea" id="applyMsg" required maxlength="500" placeholder="Kitlenden, içerik fikrinden ve paylaşım planından bahset…"></textarea>
              <span class="hint">Profil: ${esc(me.handle)} · ${esc(me.platform)} · ${compact(me.followers)} takipçi</span>
            </div>
            <button class="btn btn-primary btn-block" type="submit" ${eligible ? '' : 'disabled'}>Başvuru gönder</button>
            ${eligible ? '' : `<span class="hint" style="color:var(--danger)">Bu teklif için en az ${num.format(o.minFollowers)} takipçi gerekiyor.</span>`}
          </form>`;
      }
    }

    const splitNote = [
      DB.hasCommission(o) ? `Satış başına %${PRICING.POOL} havuz (${money(pct(o.price, PRICING.POOL))}): %${PRICING.CREATOR} üretici, %${PRICING.PLATFORM} Travelwin.` : '',
      DB.hasBarter(o) ? `Barter eşleşmesinde işletme ${money(PRICING.BARTER_FEE)} sabit hizmet bedeli öder.` : '',
    ].filter(Boolean).join(' ');

    openModal(`
      <div class="detail-cover cover-${o.category}"><span class="cover-ico" aria-hidden="true">${ic(c.icon)}</span></div>
      <div class="modal-head">
        <div><div class="flex" style="margin-bottom:8px"><span class="chip">${ic(c.icon)} ${c.label}</span><span class="chip">${ic('pin')} ${esc(o.region)}</span><span class="chip model-chip-${o.model}">${ic(MODELS[o.model].icon)} ${MODELS[o.model].filter}</span></div>
          <h2 style="font-size:22px">${esc(o.title)}</h2><div class="muted" style="margin-top:4px">${esc(b?.name)}</div></div>
        <button class="modal-close" data-close aria-label="Kapat">${ic('x')}</button>
      </div>
      <div class="modal-body">
        <p style="margin:0;color:var(--ink-2)">${esc(o.description)}</p>
        <div class="kv">
          <div><span>Paket fiyatı</span><strong>${money(o.price)}</strong></div>
          ${DB.hasCommission(o) ? `<div><span>Satış başı üretici kazancı</span><strong>%${PRICING.CREATOR} · ${money(pct(o.price, PRICING.CREATOR))}</strong></div>` : ''}
          ${o.stay && DB.hasBarter(o) ? `<div><span>Ücretsiz konaklama</span><strong>${o.stay.nights} gece · ${o.stay.guests} kişi</strong></div>` : ''}
          <div><span>Min. takipçi</span><strong>${num.format(o.minFollowers || 0)}</strong></div>
        </div>
        <div class="info-box">${ic('info')}<span>${splitNote}</span></div>
        <div><strong>Beklenen içerikler</strong><ul class="deliverables">${o.deliverables.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>
        ${action}
      </div>`);
  }

  /* ---------- Üretici: Başvurularım ---------- */
  function viewCreatorApps() {
    const apps = DB.applications({ creatorId: CURRENT.creator });
    const rows = apps.map((a) => {
      const o = DB.offer(a.offerId);
      if (!o) return '';
      const c = cat(o);
      return `
        <div class="card row">
          <div class="row-icon cat-${o.category}">${ic(c.icon)}</div>
          <div><div class="row-title">${esc(o.title)}</div><div class="row-sub">${esc(DB.business(o.businessId)?.name)} · ${esc(o.region)} · ${MODELS[o.model].label} · ${ago(a.createdAt)}</div></div>
          <div class="row-actions">${statusChip(a.status)}</div>
          ${a.status === 'approved' ? `<div class="row-extra">${linkBox(a.code)}
            <div class="mini-stats"><span>Tıklama <b>${num.format(a.clicks)}</b></span><span>Satış <b>${a.sales}</b></span><span>Ciro <b>${money(a.revenue)}</b></span>${DB.hasCommission(o) ? `<span>Komisyonun (%${PRICING.CREATOR}) <b>${money(DB.commissionOf(a))}</b></span>` : ''}${o.stay && DB.hasBarter(o) ? `<span>${ic('bed')} <b>${o.stay.nights} gece</b> konaklama hakkı</span>` : ''}</div></div>` : ''}
        </div>`;
    }).join('');
    return `
      <div class="page-head"><div><h1>Başvurularım</h1><p>Onaylanan iş birliklerinde affiliate linkini paylaş, satışları takip et.</p></div></div>
      ${apps.length ? `<div class="list">${rows}</div>` : empty('inbox', 'Henüz başvurun yok', 'Teklifleri keşfedip ilk başvurunu yap.', '<a class="btn btn-primary" href="#/c/offers">Teklifleri gör</a>')}`;
  }

  /* ---------- Üretici: Kazançlar ---------- */
  function viewCreatorEarnings() {
    const approved = DB.applications({ creatorId: CURRENT.creator, status: 'approved' });
    const t = approved.reduce((acc, a) => {
      acc.clicks += a.clicks; acc.sales += a.sales; acc.revenue += a.revenue; acc.comm += DB.commissionOf(a);
      const o = DB.offer(a.offerId); if (o?.stay && DB.hasBarter(o)) acc.nights += o.stay.nights;
      return acc;
    }, { clicks: 0, sales: 0, revenue: 0, comm: 0, nights: 0 });
    const conv = t.clicks ? ((t.sales / t.clicks) * 100).toFixed(1) : '0';
    return `
      <div class="page-head"><div><h1>Kazançlar</h1><p>Komisyon (%${PRICING.CREATOR}) ve konaklama karşılığı kazanımlarının özeti. Komisyonundan platform kesintisi yapılmaz.</p></div></div>
      <div class="grid grid-stats">
        ${stat({ label: `Toplam komisyon (%${PRICING.CREATOR})`, value: money(t.comm), sub: 'Ödeme bekleyen', icon: 'wallet', highlight: true })}
        ${stat({ label: 'Konaklama hakkı', value: `${t.nights} gece`, sub: 'Barter / hibrit', icon: 'bed' })}
        ${stat({ label: 'Tıklama', value: num.format(t.clicks), icon: 'pointer' })}
        ${stat({ label: 'Satış', value: num.format(t.sales), sub: `Dönüşüm %${conv}`, icon: 'check' })}
        ${stat({ label: 'Getirdiğin ciro', value: money(t.revenue), icon: 'trending' })}
      </div>
      <h2 class="section-title">İş birliği bazında</h2>
      ${approved.length ? `<div class="card table-wrap"><table>
        <thead><tr><th>Teklif</th><th>Model</th><th class="num">Tıklama</th><th class="num">Satış</th><th class="num">Ciro</th><th class="num">Komisyon (%${PRICING.CREATOR})</th></tr></thead>
        <tbody>${approved.map((a) => { const o = DB.offer(a.offerId); return `<tr><td>${esc(o?.title)}</td><td>${MODELS[o?.model]?.label || ''}</td><td class="num">${num.format(a.clicks)}</td><td class="num">${a.sales}</td><td class="num">${money(a.revenue)}</td><td class="num"><b>${money(DB.commissionOf(a))}</b></td></tr>`; }).join('')}</tbody>
      </table></div>` : empty('wallet', 'Henüz onaylı iş birliği yok', 'Başvurun onaylandığında kazançların burada görünür.')}`;
  }

  /* ---------- İşletme: Panel ---------- */
  function viewBusinessDashboard() {
    const biz = DB.business(CURRENT.business);
    const offers = DB.offers({ businessId: biz.id });
    const apps = DB.applications({ businessId: biz.id });
    const approved = apps.filter((a) => a.status === 'approved');
    const pending = apps.filter((a) => a.status === 'pending');
    const sum = approved.reduce((acc, a) => {
      const s = DB.split(a);
      acc.revenue += a.revenue; acc.clicks += a.clicks; acc.sales += a.sales;
      acc.pool += s.pool; acc.creator += s.creator; acc.platform += s.platform;
      if (s.fee) { acc.fees += s.fee; acc.barter++; }
      return acc;
    }, { revenue: 0, clicks: 0, sales: 0, pool: 0, creator: 0, platform: 0, fees: 0, barter: 0 });
    return `
      <div class="page-head">
        <div><h1>${esc(biz.name)}</h1><p class="flex" style="gap:6px">${ic('pin')} ${esc(biz.region)} · Affiliate performansınız</p></div>
        <a class="btn btn-primary" href="#/b/new">${ic('plus')} Yeni teklif</a>
      </div>
      <div class="grid grid-stats">
        ${stat({ label: 'Affiliate ciro', value: money(sum.revenue), sub: `${sum.sales} rezervasyon`, icon: 'trending', highlight: true })}
        ${stat({ label: `Komisyon havuzu (%${PRICING.POOL})`, value: money(sum.pool), sub: `${money(sum.creator)} üretici · ${money(sum.platform)} Travelwin`, icon: 'percent' })}
        ${stat({ label: 'Barter hizmet bedeli', value: money(sum.fees), sub: `${sum.barter} eşleşme × ${money(PRICING.BARTER_FEE)}`, icon: 'bed' })}
        ${stat({ label: 'Tıklama', value: num.format(sum.clicks), sub: sum.clicks ? `Dönüşüm %${((sum.sales / sum.clicks) * 100).toFixed(1)}` : '', icon: 'pointer' })}
        ${stat({ label: 'Aktif teklif', value: offers.filter((o) => o.active).length, sub: `${approved.length} aktif üretici`, icon: 'tag' })}
      </div>

      <h2 class="section-title">Onay bekleyen başvurular ${pending.length ? `(${pending.length})` : ''}</h2>
      ${pending.length ? `<div class="list">${pending.slice(0, 3).map(appRow).join('')}</div>${pending.length > 3 ? '<p><a href="#/b/apps">Tümünü gör →</a></p>' : ''}` : empty('check', 'Bekleyen başvuru yok', 'Yeni başvurular geldiğinde burada görünecek.')}

      <h2 class="section-title">En iyi performans gösteren üreticiler</h2>
      ${approved.length ? `<div class="card table-wrap"><table>
        <thead><tr><th>Üretici</th><th>Teklif</th><th>Kod</th><th class="num">Tıklama</th><th class="num">Satış</th><th class="num">Ciro</th><th class="num">Havuz (%${PRICING.POOL})</th></tr></thead>
        <tbody>${[...approved].sort((a, b) => b.revenue - a.revenue).map((a) => { const c = DB.creator(a.creatorId); const o = DB.offer(a.offerId); return `<tr><td><b>${esc(c.name)}</b> <span class="muted">${esc(c.handle)}</span></td><td>${esc(o.title)}</td><td><code>${esc(a.code)}</code></td><td class="num">${num.format(a.clicks)}</td><td class="num">${a.sales}</td><td class="num"><b>${money(a.revenue)}</b></td><td class="num">${money(DB.split(a).pool)}</td></tr>`; }).join('')}</tbody>
      </table></div>` : empty('chart', 'Henüz veri yok', 'Bir başvuruyu onayladığınızda performans burada görünür.')}`;
  }

  function appRow(a) {
    const c = DB.creator(a.creatorId);
    const o = DB.offer(a.offerId);
    const s = DB.split(a);
    const initials = c.name.split(' ').map((w) => w[0]).filter((ch) => /\p{L}/u.test(ch)).slice(0, 2).join('');
    return `
      <div class="card row">
        <div class="row-icon avatar">${esc(initials)}</div>
        <div>
          <div class="row-title">${esc(c.name)} <span class="muted" style="font-weight:500">${esc(c.handle)}</span></div>
          <div class="row-sub">${esc(c.platform)} · ${compact(c.followers)} takipçi · <b>${esc(o?.title)}</b> · ${MODELS[o?.model]?.label || ''} · ${ago(a.createdAt)}</div>
          ${a.message ? `<div style="margin-top:6px;font-size:14px;color:var(--ink-2)">“${esc(a.message)}”</div>` : ''}
        </div>
        <div class="row-actions">
          ${a.status === 'pending'
            ? `<button class="btn btn-danger btn-sm" data-action="decide" data-id="${a.id}" data-ok="0">${ic('x')} Reddet</button><button class="btn btn-success btn-sm" data-action="decide" data-id="${a.id}" data-ok="1">${ic('check')} Onayla & link ver</button>`
            : statusChip(a.status)}
        </div>
        ${a.status === 'approved' ? `<div class="row-extra">${linkBox(a.code)}<div class="mini-stats"><span>Tıklama <b>${num.format(a.clicks)}</b></span><span>Satış <b>${a.sales}</b></span><span>Ciro <b>${money(a.revenue)}</b></span>${DB.hasCommission(o) ? `<span>Havuz (%${PRICING.POOL}) <b>${money(s.pool)}</b></span>` : ''}${s.fee ? `<span>Hizmet bedeli <b>${money(s.fee)}</b></span>` : ''}</div></div>` : ''}
      </div>`;
  }

  /* ---------- İşletme: Başvurular ---------- */
  let appFilter = 'pending';
  function viewBusinessApps() {
    const all = DB.applications({ businessId: CURRENT.business });
    const count = (s) => all.filter((a) => a.status === s).length;
    const list = appFilter === 'all' ? all : all.filter((a) => a.status === appFilter);
    const tabs = [['pending', 'Bekleyen'], ['approved', 'Onaylı'], ['rejected', 'Reddedilen'], ['all', 'Tümü']];
    return `
      <div class="page-head"><div><h1>Başvurular</h1><p>Üreticileri inceleyin; onayladığınız anda kişisel affiliate link oluşturulur.</p></div></div>
      <div class="pills">${tabs.map(([k, l]) => `<button class="pill ${appFilter === k ? 'active' : ''}" data-action="app-filter" data-f="${k}">${l} (${k === 'all' ? all.length : count(k)})</button>`).join('')}</div>
      ${list.length ? `<div class="list">${list.map(appRow).join('')}</div>` : empty('inbox', 'Bu listede başvuru yok', 'Filtreyi değiştirerek diğer başvurulara bakabilirsiniz.')}`;
  }

  /* ---------- İşletme: Tekliflerim ---------- */
  function viewBusinessOffers() {
    const offers = DB.offers({ businessId: CURRENT.business });
    return `
      <div class="page-head"><div><h1>Tekliflerim</h1><p>Yayındaki iş birliği teklifleriniz.</p></div><a class="btn btn-primary" href="#/b/new">${ic('plus')} Yeni teklif</a></div>
      ${offers.length ? `<div class="list">${offers.map((o) => {
        const apps = DB.applications({ offerId: o.id });
        const c = cat(o);
        return `<div class="card row">
          <div class="row-icon cat-${o.category}">${ic(c.icon)}</div>
          <div><div class="row-title">${esc(o.title)} ${o.active ? '' : '<span class="chip">Pasif</span>'}</div>
            <div class="row-sub">${esc(o.region)} · ${money(o.price)} · ${MODELS[o.model].filter} · ${apps.length} başvuru (${apps.filter((a) => a.status === 'pending').length} bekleyen)</div>
            <div class="flex" style="margin-top:8px">${rewardChips(o)}</div></div>
          <div class="row-actions">
            <button class="btn btn-ghost btn-sm" data-action="open-offer" data-id="${o.id}">${ic('eye')} Önizle</button>
            <button class="btn btn-ghost btn-sm" data-action="toggle-offer" data-id="${o.id}">${o.active ? 'Yayından kaldır' : 'Yayınla'}</button>
          </div></div>`;
      }).join('')}</div>` : empty('tag', 'Henüz teklif yok', 'İlk teklifinizi oluşturarak üreticilere ulaşın.', '<a class="btn btn-primary" href="#/b/new">Teklif oluştur</a>')}`;
  }

  /* ---------- İşletme: Yeni teklif ---------- */
  function viewBusinessNew() {
    const biz = DB.business(CURRENT.business);
    return `
      <div class="page-head"><div><h1>Yeni teklif</h1><p>Üreticilere ne sunduğunuzu ve karşılığında ne beklediğinizi belirtin.</p></div></div>
      <form id="offerForm" class="card card-pad">
        <div class="form-grid">
          <div class="field full"><label for="f-title">Teklif başlığı</label><input class="input" id="f-title" name="title" required maxlength="80" placeholder="ör. Deniz manzaralı suit — 3 gece" /></div>
          <div class="field"><label for="f-cat">Kategori</label><select class="select" id="f-cat" name="category">${Object.entries(CATEGORIES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></div>
          <div class="field"><label for="f-region">Bölge</label><select class="select" id="f-region" name="region">${REGIONS.map((r) => `<option ${r === biz.region ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
          <div class="field full"><label for="f-desc">Açıklama</label><textarea class="textarea" id="f-desc" name="description" required maxlength="600" placeholder="Deneyimi ve aradığınız içerik tarzını anlatın…"></textarea></div>
          <div class="field"><label for="f-price">Paket satış fiyatı (₺)</label><input class="input" id="f-price" name="price" type="number" min="1" step="1" required placeholder="12000" /></div>
          <div class="field"><label for="f-min">Min. takipçi</label><input class="input" id="f-min" name="minFollowers" type="number" min="0" step="500" value="5000" /></div>

          <div class="field full"><label>Kazanç modeli</label>
            <div class="segment">
              ${Object.entries(MODELS).map(([k, m], i) => `<input type="radio" name="model" id="m-${k}" value="${k}" ${i === 0 ? 'checked' : ''}><label for="m-${k}"><strong>${ic(m.icon)} ${m.filter}</strong>${m.desc}</label>`).join('')}
            </div>
          </div>

          <div class="field full" data-show="commission hybrid"><div class="info-box" id="splitInfo"></div></div>
          <div class="field" data-show="stay hybrid"><label for="f-nights">Ücretsiz gece</label><input class="input" id="f-nights" name="nights" type="number" min="1" max="14" value="2" /></div>
          <div class="field" data-show="stay hybrid"><label for="f-guests">Kişi sayısı</label><input class="input" id="f-guests" name="guests" type="number" min="1" max="10" value="2" /></div>
          <div class="field full" data-show="stay hybrid"><div class="info-box info-gold">${ic('bed')}<span>Barter eşleşmelerinde onaylanan her üretici için <b>${money(PRICING.BARTER_FEE)} sabit hizmet bedeli</b> uygulanır.</span></div></div>

          <div class="field full"><label for="f-deliv">Beklenen içerikler</label><textarea class="textarea" id="f-deliv" name="deliverables" required placeholder="Her satıra bir madde&#10;1 Reels (min. 30 sn)&#10;3 Story (link sticker'lı)"></textarea><span class="hint">Her satır ayrı bir madde olarak gösterilir.</span></div>
        </div>
        <div class="flex" style="margin-top:20px;justify-content:flex-end">
          <a class="btn btn-ghost" href="#/b/offers">Vazgeç</a>
          <button class="btn btn-primary" type="submit">Teklifi yayınla</button>
        </div>
      </form>`;
  }

  function syncOfferForm(form) {
    const model = form.querySelector('input[name="model"]:checked').value;
    form.querySelectorAll('[data-show]').forEach((el) => {
      const show = el.dataset.show.split(' ').includes(model);
      el.hidden = !show;
      el.querySelectorAll('input').forEach((i) => (i.disabled = !show));
    });
    const price = +form.price.value || 0;
    const info = form.querySelector('#splitInfo');
    if (info) {
      info.innerHTML = `${ic('percent')}<span>${price
        ? `Satış başına <b>%${PRICING.POOL} havuz: ${money(pct(price, PRICING.POOL))}</b> → ${money(pct(price, PRICING.CREATOR))} üreticiye (%${PRICING.CREATOR}), ${money(pct(price, PRICING.PLATFORM))} Travelwin'e (%${PRICING.PLATFORM}).`
        : `Her satışta toplam <b>%${PRICING.POOL} komisyon havuzu</b>: %${PRICING.CREATOR} üreticiye, %${PRICING.PLATFORM} Travelwin'e. Fiyat girince tutarlar hesaplanır.`}</span>`;
    }
  }

  /* ---------- Affiliate yönlendirme / rezervasyon ---------- */
  function viewReferral(code, clickCounted) {
    const a = DB.byCode(code);
    const o = a && DB.offer(a.offerId);
    if (!o) return empty('link', 'Geçersiz link', 'Bu affiliate link bulunamadı veya artık aktif değil.', '<a class="btn btn-primary" href="#/">Ana sayfa</a>');
    const c = DB.creator(a.creatorId);
    const b = DB.business(o.businessId);
    const cg = cat(o);
    return `
      <div class="booking">
        <div class="ref-banner">${ic('sparkles')} ${esc(c.name)} önerisiyle geldiniz${clickCounted ? ' · tıklama kaydedildi' : ''}</div>
        <div class="card" style="overflow:hidden">
          <div class="detail-cover cover-${o.category}"><span class="cover-ico" aria-hidden="true">${ic(cg.icon)}</span></div>
          <div class="card-pad">
            <div class="muted">${esc(b.name)} · ${esc(o.region)}</div>
            <h1 style="font-size:24px;margin:6px 0 10px">${esc(o.title)}</h1>
            <p style="color:var(--ink-2);margin:0 0 18px">${esc(o.description)}</p>
            <form id="bookForm" data-code="${esc(code)}" class="form-grid">
              <div class="field"><label for="b-date">Tarih</label><input class="input" id="b-date" type="date" required /></div>
              <div class="field"><label for="b-qty">Paket adedi</label><select class="select" id="b-qty" name="qty">${[1, 2, 3].map((n) => `<option value="${n}">${n}</option>`).join('')}</select></div>
              <div class="full flex"><span class="muted">Toplam</span><span class="spacer"></span><strong style="font-size:22px" id="b-total" data-price="${o.price}">${money(o.price)}</strong></div>
              <button class="btn btn-accent btn-block full" type="submit">Rezervasyonu tamamla</button>
              <span class="hint full muted" style="font-size:12px;text-align:center">Demo: ödeme alınmaz, satış affiliate koduna (${esc(code)}) işlenir.</span>
            </form>
          </div>
        </div>
      </div>`;
  }

  /* ================= ROUTER ================= */
  const ROUTES = {
    '/': viewHome,
    '/c/offers': viewCreatorOffers,
    '/c/apps': viewCreatorApps,
    '/c/earnings': viewCreatorEarnings,
    '/b/dashboard': viewBusinessDashboard,
    '/b/offers': viewBusinessOffers,
    '/b/apps': viewBusinessApps,
    '/b/new': viewBusinessNew,
  };

  let lastPath = null;
  function render() {
    const path = location.hash.slice(1) || '/';
    const changed = path !== lastPath;
    lastPath = path;

    // Rol, rota önekinden türetilir; böylece doğrudan link açılınca menü doğru olur.
    if (path.startsWith('/c/') && getRole() !== 'creator') setRole('creator');
    if (path.startsWith('/b/') && getRole() !== 'business') setRole('business');

    let html;
    const ref = path.match(/^\/r\/(.+)$/);
    if (ref) {
      const code = decodeURIComponent(ref[1]);
      const counted = changed ? !!DB.trackClick(code) : false;
      html = viewReferral(code, counted);
    } else {
      html = (ROUTES[path] || viewHome)();
    }
    $app.innerHTML = html;
    renderNav(path);
    if (changed) { window.scrollTo(0, 0); $app.focus({ preventScroll: true }); }

    const form = document.getElementById('offerForm');
    if (form) syncOfferForm(form);
  }

  function rerender() { lastPath = location.hash.slice(1) || '/'; render(); }

  /* ================= OLAYLAR ================= */
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) return closeModal();
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const { action, id } = el.dataset;

    switch (action) {
      case 'go-role':
        setRole(el.dataset.role);
        location.hash = el.dataset.role === 'creator' ? '#/c/offers' : '#/b/dashboard';
        break;
      case 'go-role-link':
        setRole(el.dataset.role);
        break;
      case 'open-offer':
        offerDetail(id);
        break;
      case 'filter-region':
        offerFilter.region = el.dataset.region;
        document.querySelectorAll('[data-action="filter-region"]').forEach((p) => p.classList.toggle('active', p === el));
        refreshOfferGrid();
        break;
      case 'filter-model':
        offerFilter.model = el.dataset.model;
        document.querySelectorAll('[data-action="filter-model"]').forEach((b) => {
          b.classList.toggle('active', b === el);
          b.setAttribute('aria-pressed', b === el);
        });
        refreshOfferGrid();
        break;
      case 'sim-role':
        sim.role = el.dataset.role;
        rerenderSim();
        break;
      case 'sim-model':
        sim.model = el.dataset.model;
        rerenderSim();
        break;
      case 'copy':
        copy(el.dataset.url);
        break;
      case 'decide': {
        const ok = el.dataset.ok === '1';
        const a = DB.decide(id, ok);
        toast(ok ? `Onaylandı · link: ${a.code}` : 'Başvuru reddedildi');
        rerender();
        break;
      }
      case 'app-filter':
        appFilter = el.dataset.f;
        rerender();
        break;
      case 'toggle-offer': {
        const o = DB.toggleOffer(id);
        toast(o.active ? 'Teklif yayında' : 'Teklif yayından kaldırıldı');
        rerender();
        break;
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$modal.hidden) closeModal();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.offer-card')) {
      e.preventDefault();
      offerDetail(e.target.dataset.id);
    }
  });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.sim) {
      const k = t.dataset.sim;
      sim[k] = +t.value;
      t.style.setProperty('--p', rangeFill(k));
      document.getElementById(`out-${k}`).textContent = SIM_RANGES[k].fmt(sim[k]);
      document.getElementById('simResults').innerHTML = simResultsHtml();
      return;
    }
    if (t.id === 'offerSearch') {
      offerFilter.q = t.value;
      refreshOfferGrid();
      return;
    }
    const form = t.closest('#offerForm');
    if (form) syncOfferForm(form);
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'catFilter') {
      offerFilter.category = e.target.value;
      refreshOfferGrid();
    } else if (e.target.id === 'b-qty') {
      const t = document.getElementById('b-total');
      t.textContent = money(+t.dataset.price * +e.target.value);
    }
  });

  document.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;

    if (f.id === 'applyForm') {
      const msg = f.querySelector('#applyMsg').value.trim();
      if (!msg) return;
      DB.apply(f.dataset.id, CURRENT.creator, msg);
      closeModal();
      toast('Başvurun gönderildi');
      location.hash = '#/c/apps';
    }

    if (f.id === 'offerForm') {
      const d = Object.fromEntries(new FormData(f));
      const model = d.model;
      const offer = DB.createOffer({
        businessId: CURRENT.business,
        title: d.title.trim(),
        category: d.category,
        region: d.region,
        description: d.description.trim(),
        price: Math.max(1, +d.price),
        minFollowers: Math.max(0, +d.minFollowers || 0),
        model,
        stay: model === 'commission' ? null : { nights: +d.nights || 1, guests: +d.guests || 1 },
        deliverables: d.deliverables.split('\n').map((s) => s.trim()).filter(Boolean),
      });
      toast(`“${offer.title}” yayında`);
      location.hash = '#/b/offers';
    }

    if (f.id === 'bookForm') {
      const qty = +f.qty.value;
      const t = document.getElementById('b-total');
      const amount = +t.dataset.price * qty;
      DB.trackSale(f.dataset.code, amount);
      f.outerHTML = `<div class="empty" style="border-style:solid"><div class="empty-ico">${ic('check')}</div><h3>Rezervasyon alındı</h3><p>${money(amount)} tutarındaki satış affiliate koduna işlendi. Panellerde anında görünür.</p><a class="btn btn-ghost" href="#/">Ana sayfa</a></div>`;
    }
  });

  document.querySelectorAll('#roleSwitch button').forEach((btn) =>
    btn.addEventListener('click', () => {
      setRole(btn.dataset.role);
      location.hash = btn.dataset.role === 'creator' ? '#/c/offers' : '#/b/dashboard';
    })
  );

  window.addEventListener('hashchange', () => { closeModal(); render(); });
  window.addEventListener('storage', (e) => { if (e.key && e.key.startsWith('travelwin:v')) rerender(); }); // başka sekmede satış olunca güncelle

  // Konsoldan demo verisini sıfırlamak için: TravelWin.reset()
  window.TravelWin = { reset() { DB.reset(); rerender(); toast('Demo verisi sıfırlandı'); } };

  render();
})();
