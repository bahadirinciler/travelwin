/* Turizmlink — panel uygulaması (hash router + görünümler)
   app.html (data-portal="creator") ve extranet.html (data-portal="business") bu dosyayı paylaşır. */
(function () {
  const { REGIONS, CATEGORIES, MODELS, PRICING, CURRENT, pct } = DB;
  const $app = document.getElementById('app');
  const $modal = document.getElementById('modal');
  const $modalCard = document.getElementById('modalCard');
  const $toast = document.getElementById('toast');
  const PORTAL = document.body.dataset.portal === 'business' ? 'business' : 'creator';
  const HOME_ROUTE = PORTAL === 'business' ? '/b/dashboard' : '/c/offers';

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

  // Rol, sayfanın kendisinden gelir (her portal tek role ait).
  const getRole = () => PORTAL;

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

  const { ic } = TLIcons;

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
      <a class="btn btn-ghost btn-sm" href="${esc(url)}" target="_blank" rel="noopener">${ic('external')} Test et</a></div>`;
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
      { href: '#/c/apps', label: 'Linklerim', icon: 'link' },
      { href: '#/c/earnings', label: 'Cüzdan', icon: 'wallet' },
    ],
    business: [
      { href: '#/b/dashboard', label: 'Panel', icon: 'grid' },
      { href: '#/b/offers', label: 'Tekliflerim', icon: 'tag' },
      { href: '#/b/requests', label: 'Ön talepler', icon: 'calendar' },
      { href: '#/b/apps', label: 'Başvurular', icon: 'inbox' },
      { href: '#/b/new', label: 'Yeni teklif', icon: 'plus' },
    ],
  };

  function renderNav(path) {
    const role = getRole();
    const items = NAV[role];
    const badges = role === 'business' ? {
      '#/b/apps': DB.applications({ businessId: CURRENT.business, status: 'pending' }).length,
      '#/b/requests': DB.requests({ businessId: CURRENT.business, status: 'pending' }).length,
    } : {};
    const isActive = (href) => path === href.slice(1);
    document.getElementById('topnav').innerHTML = items
      .map((i) => `<a href="${i.href}" class="${isActive(i.href) ? 'active' : ''}">${ic(i.icon)} ${i.label}${badges[i.href] ? `<span class="nav-count">${badges[i.href]}</span>` : ''}</a>`)
      .join('');
    document.getElementById('bottomnav').innerHTML = items
      .map((i) => `<a href="${i.href}" class="${isActive(i.href) ? 'active' : ''}">${ic(i.icon)}${i.label}${badges[i.href] ? `<span class="badge-dot">${badges[i.href]}</span>` : ''}</a>`)
      .join('');
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
      DB.hasCommission(o) ? `Satış başına toplam %${PRICING.TOTAL} (${money(pct(o.price, PRICING.TOTAL))}): %${PRICING.CREATOR} elçi, %${PRICING.PLATFORM} Turizmlink. Linkle gelen misafire %${PRICING.GUEST} indirim.` : '',
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
      <div class="page-head"><div><h1>Linklerim</h1><p>Onaylanan otellerde kişisel linkini paylaş; linkinle gelen misafir %${PRICING.GUEST} indirim alır, sen %${PRICING.CREATOR} kazanırsın.</p></div></div>
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
      <div class="page-head"><div><h1>Cüzdan</h1><p>Komisyon (%${PRICING.CREATOR}) ve konaklama karşılığı kazanımlarının özeti. %${PRICING.CREATOR} net komisyon: platform payını otel öder, senden kesinti yapılmaz.</p></div></div>
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
    const reqs = DB.requests({ businessId: biz.id, status: 'pending' });
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
        ${stat({ label: `Toplam komisyon (%${PRICING.TOTAL})`, value: money(sum.pool), sub: `${money(sum.creator)} üretici · ${money(sum.platform)} Turizmlink`, icon: 'percent' })}
        ${stat({ label: 'Barter hizmet bedeli', value: money(sum.fees), sub: `${sum.barter} eşleşme × ${money(PRICING.BARTER_FEE)}`, icon: 'bed' })}
        ${stat({ label: 'Tıklama', value: num.format(sum.clicks), sub: sum.clicks ? `Dönüşüm %${((sum.sales / sum.clicks) * 100).toFixed(1)}` : '', icon: 'pointer' })}
        ${stat({ label: 'Aktif teklif', value: offers.filter((o) => o.active).length, sub: `${approved.length} aktif üretici`, icon: 'tag' })}
      </div>

      <h2 class="section-title">Onay bekleyen ön talepler ${reqs.length ? `(${reqs.length})` : ''}</h2>
      ${reqs.length ? `<div class="list">${reqs.slice(0, 3).map(requestRow).join('')}</div>${reqs.length > 3 ? '<p><a href="#/b/requests">Tümünü gör →</a></p>' : ''}` : empty('calendar', 'Bekleyen ön talep yok', 'Misafir talepleri geldiğinde burada görünecek.')}

      <h2 class="section-title">Onay bekleyen başvurular ${pending.length ? `(${pending.length})` : ''}</h2>
      ${pending.length ? `<div class="list">${pending.slice(0, 3).map(appRow).join('')}</div>${pending.length > 3 ? '<p><a href="#/b/apps">Tümünü gör →</a></p>' : ''}` : empty('check', 'Bekleyen başvuru yok', 'Yeni başvurular geldiğinde burada görünecek.')}

      <h2 class="section-title">En iyi performans gösteren üreticiler</h2>
      ${approved.length ? `<div class="card table-wrap"><table>
        <thead><tr><th>Üretici</th><th>Teklif</th><th>Kod</th><th class="num">Tıklama</th><th class="num">Satış</th><th class="num">Ciro</th><th class="num">Toplam (%${PRICING.TOTAL})</th></tr></thead>
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
        ${a.status === 'approved' ? `<div class="row-extra">${linkBox(a.code)}<div class="mini-stats"><span>Tıklama <b>${num.format(a.clicks)}</b></span><span>Satış <b>${a.sales}</b></span><span>Ciro <b>${money(a.revenue)}</b></span>${DB.hasCommission(o) ? `<span>Toplam (%${PRICING.TOTAL}) <b>${money(s.pool)}</b></span>` : ''}${s.fee ? `<span>Hizmet bedeli <b>${money(s.fee)}</b></span>` : ''}</div></div>` : ''}
      </div>`;
  }

  /* ---------- İşletme: Ön talepler (misafir → otel onayı) ---------- */
  const fmtDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  function requestRow(q) {
    const b = DB.business(q.businessId);
    const room = b?.rooms?.find((r) => r.id === q.roomId);
    const a = q.code ? DB.byCode(q.code) : null;
    const c = a ? DB.creator(a.creatorId) : null;
    return `
      <div class="card row">
        <div class="row-icon cat-otel">${ic('calendar')}</div>
        <div>
          <div class="row-title">${esc(q.guestName)} <span class="muted" style="font-weight:500">${esc(q.phone || '')}</span></div>
          <div class="row-sub">${fmtDay(q.checkIn)} → ${fmtDay(q.checkOut)} · ${q.nights} gece · ${q.guests} kişi · ${esc(room?.name || '')} · ${ago(q.createdAt)}</div>
          <div class="mini-stats" style="margin-top:8px">
            <span>Liste <b>${money(q.list)}</b></span>
            ${q.discount ? `<span>Davet indirimi (%${PRICING.GUEST}) <b>− ${money(q.discount)}</b></span>` : ''}
            <span>Misafir öder <b>${money(q.total)}</b></span>
            ${c ? `<span>${ic('link')} ${esc(c.name)} · <code>${esc(q.code)}</code></span><span>Komisyon (%${PRICING.TOTAL}) <b>${money(pct(q.total, PRICING.TOTAL))}</b></span>` : '<span>Doğrudan talep · komisyon yok</span>'}
          </div>
        </div>
        <div class="row-actions">
          ${q.status === 'pending'
            ? `<button class="btn btn-danger btn-sm" data-action="decide-req" data-id="${q.id}" data-ok="0">${ic('x')} Reddet</button><button class="btn btn-success btn-sm" data-action="decide-req" data-id="${q.id}" data-ok="1">${ic('check')} Onayla</button>`
            : statusChip(q.status)}
        </div>
      </div>`;
  }

  let reqFilter = 'pending';
  function viewBusinessRequests() {
    const all = DB.requests({ businessId: CURRENT.business });
    const count = (st) => all.filter((q) => q.status === st).length;
    const list = reqFilter === 'all' ? all : all.filter((q) => q.status === reqFilter);
    const tabs = [['pending', 'Bekleyen'], ['approved', 'Onaylı'], ['rejected', 'Reddedilen'], ['all', 'Tümü']];
    return `
      <div class="page-head"><div><h1>Ön talepler</h1><p>Misafirler rezervasyon sayfanızdan tarih seçerek ön talep bırakır. Onayladığınızda satış, varsa elçinin koduna işlenir.</p></div>
        <a class="btn btn-ghost" href="hotel.html" target="_blank" rel="noopener">${ic('external')} Rezervasyon sayfanız</a></div>
      <div class="pills">${tabs.map(([k, l]) => `<button class="pill ${reqFilter === k ? 'active' : ''}" data-action="req-filter" data-f="${k}">${l} (${k === 'all' ? all.length : count(k)})</button>`).join('')}</div>
      ${list.length ? `<div class="list">${list.map(requestRow).join('')}</div>` : empty('calendar', 'Bu listede ön talep yok', 'Misafir talepleri geldiğinde burada görünecek.')}`;
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
        ? `Satış başına <b>toplam %${PRICING.TOTAL}: ${money(pct(price, PRICING.TOTAL))}</b> → ${money(pct(price, PRICING.CREATOR))} üreticiye (%${PRICING.CREATOR}), ${money(pct(price, PRICING.PLATFORM))} Turizmlink'e (%${PRICING.PLATFORM}).`
        : `Her satışta toplam <b>%${PRICING.TOTAL} komisyon</b>: %${PRICING.CREATOR} üreticiye, %${PRICING.PLATFORM} Turizmlink'e. Linkle gelen misafire %${PRICING.GUEST} indirim. Fiyat girince tutarlar hesaplanır.`}</span>`;
    }
  }

  /* ================= ROUTER ================= */
  const ROUTES = {
    '/c/offers': viewCreatorOffers,
    '/c/apps': viewCreatorApps,
    '/c/earnings': viewCreatorEarnings,
    '/b/dashboard': viewBusinessDashboard,
    '/b/offers': viewBusinessOffers,
    '/b/requests': viewBusinessRequests,
    '/b/apps': viewBusinessApps,
    '/b/new': viewBusinessNew,
  };

  let lastPath = null;
  function render() {
    const path = location.hash.slice(1) || '/';

    // Eski #/r/KOD linkleri artık misafir sayfasına (hotel.html) gider.
    const ref = path.match(/^\/r\/(.+)$/);
    if (ref) { location.replace(`hotel.html?ref=${encodeURIComponent(decodeURIComponent(ref[1]))}`); return; }

    // Her portal yalnızca kendi rotalarını açar; diğerleri portal ana ekranına döner.
    const prefix = PORTAL === 'business' ? '/b/' : '/c/';
    if (!ROUTES[path] || !path.startsWith(prefix)) { location.replace(`#${HOME_ROUTE}`); return; }

    const changed = path !== lastPath;
    lastPath = path;
    $app.innerHTML = ROUTES[path]();
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
      case 'decide-req': {
        const ok = el.dataset.ok === '1';
        const q = DB.decideRequest(id, ok);
        toast(ok ? (q.code ? `Onaylandı · satış ${q.code} koduna işlendi` : 'Ön talep onaylandı') : 'Ön talep reddedildi');
        rerender();
        break;
      }
      case 'req-filter':
        reqFilter = el.dataset.f;
        rerender();
        break;
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

  });

  window.addEventListener('hashchange', () => { closeModal(); render(); });
  window.addEventListener('storage', (e) => { if (e.key && e.key.startsWith('turizmlink:v')) rerender(); }); // başka sekmede satış olunca güncelle

  // Konsoldan demo verisini sıfırlamak için: Turizmlink.reset()
  window.Turizmlink = { reset() { DB.reset(); rerender(); toast('Demo verisi sıfırlandı'); } };

  render();
})();
