/* Turizmlink — panel uygulaması (hash router + görünümler)
   app.html (data-portal="creator") ve extranet.html (data-portal="business") bu dosyayı paylaşır. */
(function () {
  const { REGIONS, CATEGORIES, MODELS, PRICING, CURRENT, pct } = DB;
  const $app = document.getElementById('app');
  const $modal = document.getElementById('modal');
  const $modalCard = document.getElementById('modalCard');
  const $toast = document.getElementById('toast');
  const PORTAL = document.body.dataset.portal === 'business' ? 'business' : 'creator';
  const HOME_ROUTE = PORTAL === 'business' ? '/b/dashboard' : '/c/dashboard';

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
  // group: kenar menüde başlık; short: mobil alt menü etiketi; mobile:false → alt menüde gösterme
  const NAV = {
    creator: [
      { href: '#/c/dashboard', label: 'Panel', icon: 'grid' },
      { href: '#/c/offers', label: 'Oteller', icon: 'compass' },
      { href: '#/c/apps', label: 'Başvurular', icon: 'inbox' },
      { href: '#/c/media', label: 'Medya Kiti', icon: 'video' },
      { href: '#/c/earnings', label: 'Cüzdan', icon: 'wallet' },
    ],
    business: [
      { href: '#/b/dashboard', label: 'Dashboard', short: 'Panel', icon: 'grid', group: 'Otel yönetimi' },
      { href: '#/b/requests', label: 'Gelen Rezervasyon Talepleri', short: 'Talepler', icon: 'inbox', group: 'Otel yönetimi' },
      { href: '#/b/calendar', label: 'Takvim / Fiyat', short: 'Takvim', icon: 'calendar', group: 'Otel yönetimi' },
      { href: '#/b/payouts', label: 'Hakediş Raporu', short: 'Hakediş', icon: 'chart', group: 'Otel yönetimi' },
      { href: '#/b/apps', label: 'Elçi başvuruları', short: 'Elçiler', icon: 'users', group: 'Elçi programı' },
      { href: '#/b/offers', label: 'Tekliflerim', icon: 'tag', group: 'Elçi programı', mobile: false },
    ],
  };

  function renderNav(path) {
    const role = getRole();
    const items = NAV[role];
    const badges = role === 'business' ? {
      '#/b/apps': DB.applications({ businessId: CURRENT.business, status: 'pending' }).length,
      '#/b/requests': DB.requests({ businessId: CURRENT.business, status: 'pending' }).length,
    } : {};
    const isActive = (href) => path === href.slice(1) || (href === '#/b/offers' && path === '/b/new');
    const side = document.getElementById('sidenav');
    if (side) {
      const groups = [...new Set(items.map((i) => i.group))];
      side.innerHTML = groups.map((g) => `
        <div class="side-group"><div class="side-title">${g}</div>
          ${items.filter((i) => i.group === g).map((i) => `<a href="${i.href}" class="${isActive(i.href) ? 'active' : ''}">${ic(i.icon)}<span>${i.label}</span>${badges[i.href] ? `<span class="nav-count">${badges[i.href]}</span>` : ''}</a>`).join('')}
        </div>`).join('');
    } else {
      document.getElementById('topnav').innerHTML = items
        .map((i) => `<a href="${i.href}" class="${isActive(i.href) ? 'active' : ''}">${ic(i.icon)} ${i.label}${badges[i.href] ? `<span class="nav-count">${badges[i.href]}</span>` : ''}</a>`)
        .join('');
    }
    document.getElementById('bottomnav').innerHTML = items.filter((i) => i.mobile !== false)
      .map((i) => `<a href="${i.href}" class="${isActive(i.href) ? 'active' : ''}">${ic(i.icon)}${i.short || i.label}${badges[i.href] ? `<span class="badge-dot">${badges[i.href]}</span>` : ''}</a>`)
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

  /* ---------- Elçi: Panel (metrikler + link oluşturucu) ---------- */
  const lb = { appId: null };
  // Butik oteller (oda listesi olanlar) önce gelir; varsayılan seçim Casa Di Datça olur.
  function myApproved() {
    const isHotel = (a) => (DB.business(DB.offer(a.offerId)?.businessId)?.rooms?.length ? 1 : 0);
    return DB.applications({ creatorId: CURRENT.creator, status: 'approved' }).sort((x, y) => isHotel(y) - isHotel(x));
  }
  function hotelOf(a) { const o = DB.offer(a.offerId); return { o, b: o && DB.business(o.businessId) }; }

  function linkBuilderHtml() {
    const apps = myApproved();
    if (!apps.length) {
      return `<div class="card card-pad lb">${empty('link', 'Henüz linkin yok', 'Bir otele başvur; onaylandığında kendi ref kodunla link oluşturabilirsin.', '<a class="btn btn-primary" href="#/c/offers">Otelleri gör</a>')}</div>`;
    }
    if (!apps.some((a) => a.id === lb.appId)) lb.appId = apps[0].id;
    const cur = apps.find((a) => a.id === lb.appId);
    return `
      <section class="card card-pad lb" aria-labelledby="lb-title">
        <div class="lb-head">
          <span class="lb-ico">${ic('link')}</span>
          <div><h2 id="lb-title">Link Oluşturucu</h2><p>Ref kodunu kendin belirle; linkinle gelen misafir %${PRICING.GUEST} indirim alır, sen %${PRICING.CREATOR} net kazanırsın.</p></div>
        </div>
        <div class="lb-form">
          <div class="field"><label for="lb-app">Otel</label>
            <select class="select" id="lb-app">${apps.map((a) => { const { b, o } = hotelOf(a); return `<option value="${a.id}" ${a.id === cur.id ? 'selected' : ''}>${esc(b?.name || o?.title)}</option>`; }).join('')}</select></div>
          <div class="field"><label for="lb-code">Ref kodun</label>
            <input class="input lb-code" id="lb-code" value="${esc(cur.code)}" maxlength="20" autocomplete="off" spellcheck="false" placeholder="ör. AYSE-DATCA" />
            <span class="hint">4–20 karakter: harf, rakam ve tire.</span></div>
        </div>
        <div class="lb-out">
          <code id="lb-url">${esc(DB.affiliateUrl(cur.code))}</code>
          <button class="btn btn-success" data-action="lb-copy">${ic('copy')} Linkimi Kopyala</button>
          <a class="btn btn-ghost" id="lb-test" href="${esc(DB.affiliateUrl(cur.code))}" target="_blank" rel="noopener">${ic('external')} Önizle</a>
        </div>
      </section>`;
  }

  function viewCreatorDashboard() {
    const me = DB.creator(CURRENT.creator);
    const apps = myApproved();
    const clicks = apps.reduce((n, a) => n + a.clicks, 0);
    const balance = apps.reduce((n, a) => n + DB.commissionOf(a), 0);
    const pend = DB.pendingRequestsFor(me.id);
    const pendComm = pend.reduce((n, q) => n + pct(q.total, PRICING.CREATOR), 0);
    return `
      <div class="page-head"><div><h1>Merhaba ${esc(me.name.split(' ')[0])}</h1><p>${esc(me.handle)} · Turizmlink Elçisi · %${PRICING.CREATOR} net komisyon</p></div></div>
      <div class="grid grid-stats grid-3">
        ${stat({ label: 'Tıklanma Sayısı', value: num.format(clicks), sub: `${apps.length} aktif link`, icon: 'pointer' })}
        ${stat({ label: 'Bekleyen Rezervasyonlar', value: num.format(pend.length), sub: pend.length ? `Onaylanırsa +${money(pendComm)}` : 'Otel onayı bekleyen yok', icon: 'clock' })}
        ${stat({ label: `Kazanılan Toplam Bakiye (Net %${PRICING.CREATOR})`, value: money(balance), sub: 'Kesintisiz, cüzdanında', icon: 'wallet', highlight: true })}
      </div>
      <div id="lbWrap">${linkBuilderHtml()}</div>
      <h2 class="section-title">Bekleyen rezervasyonlar</h2>
      ${pend.length ? `<div class="card table-wrap"><table>
        <thead><tr><th>Otel</th><th>Tarih</th><th>Kod</th><th class="num">Tutar</th><th class="num">Kazancın (%${PRICING.CREATOR})</th></tr></thead>
        <tbody>${pend.map((q) => `<tr><td>${esc(DB.business(q.businessId)?.name)}</td><td>${fmtDay(q.checkIn)} → ${fmtDay(q.checkOut)}</td><td><code>${esc(q.code)}</code></td><td class="num">${money(q.total)}</td><td class="num"><b>${money(pct(q.total, PRICING.CREATOR))}</b></td></tr>`).join('')}</tbody>
      </table></div>` : empty('clock', 'Bekleyen rezervasyon yok', 'Linkinle gelen misafir talep bıraktığında, otel onayına kadar burada görünür.')}`;
  }

  /* ---------- Elçi: Medya Kiti ---------- */
  const media = { bizId: null };
  function viewCreatorMedia() {
    const apps = myApproved();
    const hotels = [...new Map(apps.map((a) => { const { b } = hotelOf(a); return [b?.id, { b, a }]; }).filter(([k]) => k)).values()];
    if (!hotels.length) {
      return `<div class="page-head"><div><h1>Medya Kiti</h1><p>Çalıştığın otellerin dikey (Story/Reels) görselleri.</p></div></div>
        ${empty('video', 'Henüz medya kiti yok', 'Bir otelle iş birliğin onaylandığında otelin dikey görselleri burada açılır.', '<a class="btn btn-primary" href="#/c/offers">Otelleri gör</a>')}`;
    }
    if (!hotels.some((h) => h.b.id === media.bizId)) media.bizId = hotels[0].b.id;
    const { b, a } = hotels.find((h) => h.b.id === media.bizId);
    const opts = { hotel: b.name, region: b.region, code: a.code };
    return `
      <div class="page-head"><div><h1>Medya Kiti</h1><p>${esc(b.name)} için dikey formatta (1080×1920) Story ve Reels görselleri. İndir, linkinle paylaş.</p></div></div>
      ${hotels.length > 1 ? `<div class="pills">${hotels.map((h) => `<button class="pill ${h.b.id === b.id ? 'active' : ''}" data-action="media-hotel" data-id="${h.b.id}">${esc(h.b.name)}</button>`).join('')}</div>` : ''}
      ${b.media?.length ? `
      <div class="info-box">${ic('info')}<span>Otelin kendi fotoğrafları, dikey (9:16) kesilmiş ve rötuşlanmış. <b>Kodlu indir</b>: otel adı ve ref kodun (<b>${esc(a.code)}</b>) görselin üstüne yazılır. <b>Yalın</b>: yazısız fotoğraf.</span></div>
      <div class="media-grid">
        ${b.media.map((m) => `
          <figure class="media-card">
            <div class="media-thumb photo"><img src="${esc(m.thumb)}" alt="${esc(m.title)} — ${esc(b.name)}" loading="lazy" />
              <span class="media-badge">${ic('video')} ${esc(m.format)}</span>
              <span class="mo-hotel">${esc(b.name)}</span>
              <span class="mo-foot"><b>${esc(m.title)}</b><i>%${PRICING.GUEST} indirim · KOD: ${esc(a.code)}</i></span>
            </div>
            <figcaption><div><b>${esc(m.title)}</b><small>9:16 · 1080×1920</small></div>
              <button class="btn btn-success btn-sm" data-action="media-photo" data-id="${esc(m.id)}">${ic('download')} Kodlu indir</button>
              <a class="btn btn-ghost btn-sm" href="${esc(m.src)}" download="${esc(b.id)}-${esc(m.id)}.jpg">Yalın</a></figcaption>
          </figure>`).join('')}
      </div>
      <h2 class="section-title">Şablonlar</h2>` : `<div class="info-box">${ic('info')}<span>Görseller Turizmlink şablonlarıyla hazırlanır; kodlu kartta ref kodun (<b>${esc(a.code)}</b>) yazılıdır. Otel kendi fotoğraflarını yükledikçe bu alan güncellenir.</span></div>`}
      <div class="media-grid">
        ${TLMedia.SCENES.filter((sc) => !b.media?.length || sc.promo).map((sc) => `
          <figure class="media-card">
            <div class="media-thumb"><img src="${TLMedia.dataUrl(TLMedia.svg(sc, opts))}" alt="${esc(sc.title)} — ${esc(b.name)}" loading="lazy" /><span class="media-badge">${ic(sc.promo ? 'sparkles' : 'video')} ${sc.format}</span></div>
            <figcaption><div><b>${esc(sc.title)}</b><small>9:16 · 1080×1920</small></div>
              <button class="btn btn-ghost btn-sm" data-action="media-dl" data-scene="${sc.id}">${ic('download')} İndir</button></figcaption>
          </figure>`).join('')}
      </div>`;
  }

  /* ---------- Üretici: Teklifler ---------- */
  function viewCreatorOffers() {
    const me = DB.creator(CURRENT.creator);
    return `
      <div class="page-head">
        <div><h1>Oteller</h1><p>Butik otellerin açık elçi teklifleri. Başvur, onaylanınca kendi linkini oluştur.</p></div>
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
      <div class="page-head"><div><h1>Başvurularım</h1><p>Onaylanan otellerde kişisel linkini paylaş; linkinle gelen misafir %${PRICING.GUEST} indirim alır, sen %${PRICING.CREATOR} kazanırsın.</p></div></div>
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

  /* ---------- Otel: Dashboard ---------- */
  function payoutRows(bizId) {
    return DB.applications({ businessId: bizId, status: 'approved' }).map((a) => {
      const o = DB.offer(a.offerId);
      const comm = DB.hasCommission(o) ? a.revenue : 0;
      return { a, c: DB.creator(a.creatorId), revenue: comm, creator: pct(comm, PRICING.CREATOR), platform: pct(comm, PRICING.PLATFORM), net: comm - pct(comm, PRICING.CREATOR) - pct(comm, PRICING.PLATFORM), fee: DB.split(a).fee };
    });
  }
  function payoutTotals(rows) {
    return rows.reduce((t, x) => { t.revenue += x.revenue; t.creator += x.creator; t.platform += x.platform; t.net += x.net; t.fee += x.fee; t.sales += x.a.sales; t.clicks += x.a.clicks; return t; },
      { revenue: 0, creator: 0, platform: 0, net: 0, fee: 0, sales: 0, clicks: 0 });
  }

  /** İçerik Üretici Ağırlama (barter) anahtarı */
  function hostingCard(biz) {
    const on = DB.hostingOn(biz.id);
    return `
      <div class="card host-card ${on ? 'on' : ''}">
        <span class="host-ico">${ic('bed')}</span>
        <div class="host-txt"><b>İçerik Üretici Ağırlama</b>
          <small>${on ? 'Açık · Elçiler barter tekliflerinizi görüyor; tanıtım karşılığı konaklama talep edebilir.' : 'Kapalı · Elçiler yalnızca komisyonlu iş birliği görür. Boş dönemlerinizde açabilirsiniz.'}</small></div>
        <button type="button" class="switch" role="switch" aria-checked="${on}" aria-label="İçerik Üretici Ağırlama" data-action="toggle-hosting"><span></span></button>
      </div>`;
  }

  function viewBusinessDashboard() {
    const biz = DB.business(CURRENT.business);
    const t = payoutTotals(payoutRows(biz.id));
    const reqs = DB.requests({ businessId: biz.id, status: 'pending' });
    const pending = DB.applications({ businessId: biz.id, status: 'pending' });
    const NET = 100 - PRICING.TOTAL;
    return `
      <div class="page-head">
        <div><h1>${esc(biz.name)}</h1><p class="flex" style="gap:6px">${ic('pin')} ${esc(biz.region)} · Turizmlink satış özeti</p></div>
        <a class="btn btn-ghost" href="hotel.html?h=${biz.id}" target="_blank" rel="noopener">${ic('external')} Rezervasyon sayfanız</a>
      </div>
      ${hostingCard(biz)}
      <div class="grid grid-stats">
        ${stat({ label: 'Toplam ciro', value: money(t.revenue), sub: `${t.sales} onaylı rezervasyon`, icon: 'trending', highlight: true })}
        ${stat({ label: 'Bekleyen talepler', value: reqs.length, sub: '2 saat içinde yanıtlayın', icon: 'clock' })}
        ${stat({ label: `Komisyon (%${PRICING.CREATOR} + %${PRICING.PLATFORM})`, value: money(t.creator + t.platform), sub: `${money(t.creator)} elçi · ${money(t.platform)} Turizmlink`, icon: 'percent' })}
        ${stat({ label: `Otele net aktarılacak (%${NET})`, value: money(t.net), sub: 'Hakediş raporunda detay', icon: 'wallet' })}
        ${stat({ label: 'Tıklama', value: num.format(t.clicks), sub: t.clicks ? `Dönüşüm %${((t.sales / t.clicks) * 100).toFixed(1)}` : '', icon: 'pointer' })}
      </div>

      <div class="sec-row"><h2 class="section-title">Gelen rezervasyon talepleri ${reqs.length ? `(${reqs.length})` : ''}</h2>${reqs.length ? '<a class="link-arrow" href="#/b/requests">Tümü ' + ic('arrow') + '</a>' : ''}</div>
      ${reqs.length ? requestTable(reqs.slice(0, 4)) : empty('inbox', 'Bekleyen talep yok', 'Misafir talepleri geldiğinde burada görünecek.')}

      <div class="sec-row"><h2 class="section-title">Onay bekleyen elçi başvuruları ${pending.length ? `(${pending.length})` : ''}</h2></div>
      ${pending.length ? `<div class="list">${pending.slice(0, 3).map(appRow).join('')}</div>` : empty('users', 'Bekleyen başvuru yok', 'Yeni elçi başvuruları burada görünecek.')}`;
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

  /* ---------- Otel: Gelen Rezervasyon Talepleri ---------- */
  const fmtDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  function requestTable(list) {
    return `<div class="card table-wrap"><table class="req-table">
      <thead><tr><th>Misafir Adı</th><th>Tarih</th><th class="num">Tutar</th><th>Ref Kodu</th><th class="act">İşlem</th></tr></thead>
      <tbody>${list.map((q) => {
        const room = DB.business(q.businessId)?.rooms?.find((r) => r.id === q.roomId);
        const a = q.code ? DB.byCode(q.code) : null;
        const c = a ? DB.creator(a.creatorId) : null;
        return `<tr>
          <td><b>${esc(q.guestName)}</b><small class="cell-sub">${esc(q.phone || '')} · ${q.guests} kişi</small></td>
          <td>${fmtDay(q.checkIn)} → ${fmtDay(q.checkOut)}<small class="cell-sub">${q.nights} gece · ${esc(room?.name || '')}</small></td>
          <td class="num"><b>${money(q.total)}</b>${q.discount ? `<small class="cell-sub"><s>${money(q.list)}</s> · %${PRICING.GUEST} ind.</small>` : ''}</td>
          <td>${q.code ? `<code class="ref-code">${esc(q.code)}</code><small class="cell-sub">${esc(c?.name || '')}</small>` : '<span class="muted">Doğrudan</span>'}</td>
          <td class="act">${q.status === 'pending'
            ? `<div class="act-btns"><button class="btn btn-success btn-sm" data-action="decide-req" data-id="${q.id}" data-ok="1">${ic('check')} Onayla</button><button class="btn btn-reject btn-sm" data-action="decide-req" data-id="${q.id}" data-ok="0">${ic('x')} Reddet</button></div>`
            : statusChip(q.status)}</td>
        </tr>`;
      }).join('')}</tbody></table></div>`;
  }

  let reqFilter = 'pending';
  function viewBusinessRequests() {
    const all = DB.requests({ businessId: CURRENT.business });
    const count = (st) => all.filter((q) => q.status === st).length;
    const list = reqFilter === 'all' ? all : all.filter((q) => q.status === reqFilter);
    const tabs = [['pending', 'Bekleyen'], ['approved', 'Onaylı'], ['rejected', 'Reddedilen'], ['all', 'Tümü']];
    return `
      <div class="page-head"><div><h1>Gelen Rezervasyon Talepleri</h1><p>Misafire 2 saat içinde onay sözü verildi. Onayladığınızda karttan çekim yapılır ve satış varsa elçinin koduna işlenir.</p></div></div>
      <div class="pills">${tabs.map(([k, l]) => `<button class="pill ${reqFilter === k ? 'active' : ''}" data-action="req-filter" data-f="${k}">${l} (${k === 'all' ? all.length : count(k)})</button>`).join('')}</div>
      ${list.length ? requestTable(list) : empty('inbox', 'Bu listede talep yok', 'Misafir talepleri geldiğinde burada görünecek.')}`;
  }

  /* ---------- Otel: Takvim / Fiyat ---------- */
  const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  // Takvim, bugünden sonraki ilk açık sezon ayından başlar (Kasım'da → Nisan).
  const calState = { month: (() => {
    const d = new Date();
    for (let i = 0; i < 400; i++, d.setDate(d.getDate() + 1)) if (DB.seasonOf(isoOf(d))) return new Date(d.getFullYear(), d.getMonth(), 1);
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  })() };

  // Fiyat formu alanları: [anahtar, etiket, tür] — tür 'pct' ise % olarak gösterilir
  const PRICE_FIELDS = [
    ['base', 'Temmuz · 1. kategori · 2 kişi', 'tl'], ['step', 'Kategori artışı (bir öncekine göre)', 'pct'],
    ['jun', 'Haziran = Temmuz −', 'pct'], ['may', 'Mayıs = Haziran −', 'pct'], ['apr', 'Nisan = Mayıs −', 'pct'],
    ['aug', 'Ağustos = Temmuz +', 'pct'], ['extra', 'Ek kişi (7+ yaş), kişi başı gecelik', 'tl'],
    ['single', 'Tek kişi indirimi, gecelik', 'tl'], ['roundTo', 'Yukarı yuvarlama katı', 'tl'],
  ];
  function readPricing(form) {
    const p = {};
    PRICE_FIELDS.forEach(([k, , t]) => { const v = +form.elements[k].value; p[k] = t === 'pct' ? v / 100 : v; });
    return p;
  }
  function priceMatrixHtml(biz, pricing) {
    const t = DB.seasonTable({ ...biz.pricing, ...pricing });
    const roomsOf = (c) => (biz.rooms || []).filter((r) => (r.cat || 1) === c).map((r) => r.name).join(', ') || '—';
    return `<table class="matrix"><thead><tr><th>Kategori</th>${DB.SEASONS.map((x) => `<th class="num">${x.label}<small>${x.range}</small></th>`).join('')}</tr></thead>
      <tbody>${[1, 2, 3, 4].map((c) => `<tr><td><b>${c}. kategori</b><small>${esc(roomsOf(c))}</small></td>${DB.SEASONS.map((x) => `<td class="num ${x.key === 'jul' || x.key === 'aug' ? 'peak' : ''}">${money(t[c][x.key])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  function viewBusinessCalendar() {
    const biz = DB.business(CURRENT.business);
    const closed = new Set(biz.closed || []);
    const booked = {};
    DB.requests({ businessId: biz.id, status: 'approved' }).forEach((q) => {
      for (let d = new Date(`${q.checkIn}T00:00:00`); isoOf(d) < q.checkOut; d.setDate(d.getDate() + 1)) booked[isoOf(d)] = (booked[isoOf(d)] || 0) + 1;
    });
    const pendingDays = new Set();
    DB.requests({ businessId: biz.id, status: 'pending' }).forEach((q) => {
      for (let d = new Date(`${q.checkIn}T00:00:00`); isoOf(d) < q.checkOut; d.setDate(d.getDate() + 1)) pendingDays.add(isoOf(d));
    });
    const m = calState.month;
    const lead = (new Date(m.getFullYear(), m.getMonth(), 1).getDay() + 6) % 7;
    const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const today = isoOf(new Date());
    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<span class="cal-pad"></span>';
    for (let d = 1; d <= days; d++) {
      const s = isoOf(new Date(m.getFullYear(), m.getMonth(), d));
      const past = s < today;
      const off = !!biz.pricing && !DB.seasonOf(s);
      const cls = [past ? 'is-past' : '', off && !past ? 'is-off' : '', closed.has(s) ? 'is-closed' : '', booked[s] ? 'is-booked' : '', pendingDays.has(s) ? 'is-pending' : '', s === today ? 'is-today' : ''].filter(Boolean).join(' ');
      cells += `<button type="button" class="xcal-day ${cls}" data-action="cal-toggle" data-day="${s}" ${past || off ? 'disabled' : ''} aria-pressed="${closed.has(s)}" aria-label="${s}${closed.has(s) ? ' kapalı' : ''}">
        <span>${d}</span>${booked[s] ? `<small>${booked[s]} rez.</small>` : closed.has(s) ? '<small>Kapalı</small>' : pendingDays.has(s) ? '<small>Talep</small>' : off && !past ? '<small>Sezon dışı</small>' : biz.pricing && !past ? `<small class="day-price">${money(DB.seasonTable(biz.pricing)[1][DB.seasonOf(s)]).replace('₺', '')}</small>` : ''}</button>`;
    }
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const P = biz.pricing;
    return `
      <div class="page-head"><div><h1>Takvim / Fiyat</h1><p>Satışa kapalı günleri işaretleyin, sezon fiyat kurallarını ve oda kategorilerini yönetin. Değişiklikler misafir rezervasyon sayfasına anında yansır.</p></div></div>
      <div class="cal-layout">
        <section class="card card-pad">
          <div class="cal-head">
            <button type="button" class="cal-nav" data-action="cal-nav" data-dir="-1" ${m > thisMonth ? '' : 'disabled'} aria-label="Önceki ay">${ic('arrow', 'flip')}</button>
            <strong>${m.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</strong>
            <button type="button" class="cal-nav" data-action="cal-nav" data-dir="1" aria-label="Sonraki ay">${ic('arrow')}</button>
          </div>
          <div class="xcal-grid">${['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((w) => `<span class="cal-wd">${w}</span>`).join('')}${cells}</div>
          <div class="cal-legend"><span><i class="lg-open"></i>Satışa açık</span><span><i class="lg-closed"></i>Kapalı</span><span><i class="lg-booked"></i>Rezervasyon</span><span><i class="lg-pending"></i>Bekleyen talep</span>${P ? '<span><i class="lg-off"></i>Sezon dışı</span>' : ''}</div>
          <p class="hint muted" style="margin:10px 0 0;font-size:12.5px">Sezon içindeki bir güne dokunarak satışa açın / kapatın. Gün üzerindeki fiyat: 1. kategori, 2 kişi. Sezon: 1 Nisan – 30 Ekim.</p>
        </section>
        <section class="card card-pad">
          <h2 class="gh-h2">Oda kategorileri</h2>
          <div class="price-list">
            ${(biz.rooms || []).map((r) => `
              <div class="price-row">
                ${r.img ? `<img class="price-img" src="${esc(r.img)}" alt="" loading="lazy" />` : ''}
                <div class="price-txt"><b>${esc(r.name)}</b><small>${r.guests} kişiye kadar${P ? ` · Temmuz ${money(DB.seasonTable(P)[r.cat || 1].jul)}` : ''}</small></div>
                ${P ? `<select class="select cat-select" form="priceForm" name="cat:${r.id}" aria-label="${esc(r.name)} kategorisi">${[1, 2, 3, 4].map((c) => `<option value="${c}" ${(r.cat || 1) === c ? 'selected' : ''}>${c}. kategori</option>`).join('')}</select>` : ''}
              </div>`).join('')}
          </div>
        </section>
      </div>
      ${P ? `
      <form class="card card-pad price-rules" id="priceForm">
        <div class="sec-row"><h2 class="gh-h2">Sezon fiyatları (2 kişi, gecelik, kahvaltı dahil)</h2></div>
        <div class="rule-grid">
          ${PRICE_FIELDS.map(([k, label, t]) => `<label class="rule"><span>${label}</span><span class="rule-in">${t === 'pct' ? '%' : '₺'}<input class="input" type="number" name="${k}" min="0" step="${t === 'pct' ? 1 : 50}" value="${t === 'pct' ? Math.round(P[k] * 100) : P[k]}" /></span></label>`).join('')}
        </div>
        <div class="table-wrap" id="priceMatrix">${priceMatrixHtml(biz, {})}</div>
        <div class="info-box">${ic('info')}<span>1–15 Eylül = Temmuz · 16 Eylül–30 Ekim = Mayıs. Fiyatlar yukarı ${money(P.roundTo)} katına yuvarlanır. 2 kişinin dışındaki her 7+ yaş kişi +${money(P.extra)}, tek kişi −${money(P.single)}, 0–6 yaş ücretsiz. Elçi linkiyle gelen misafir %${PRICING.GUEST} indirim görür.</span></div>
        <button class="btn btn-primary" type="submit">${ic('check')} Fiyatları ve kategorileri kaydet</button>
      </form>` : ''}`;
  }

  /* ---------- Otel: Hakediş Raporu ---------- */
  function viewBusinessPayouts() {
    const biz = DB.business(CURRENT.business);
    const rows = payoutRows(biz.id).sort((x, y) => y.revenue - x.revenue);
    const t = payoutTotals(rows);
    const NET = 100 - PRICING.TOTAL;
    return `
      <div class="page-head"><div><h1>Hakediş Raporu</h1><p>Onaylı rezervasyonların cirosu ve kesintiler. Ciro, misafirin ödediği (indirimli) tutardır.</p></div></div>
      <div class="payout-sum">
        <div><span>Toplam Ciro</span><strong>${money(t.revenue)}</strong></div>
        <div><span>Misafir/Elçi Komisyonu (%${PRICING.CREATOR})</span><strong class="neg">− ${money(t.creator)}</strong></div>
        <div><span>Turizmlink Hizmet Bedeli (%${PRICING.PLATFORM})</span><strong class="neg">− ${money(t.platform)}</strong></div>
        <div class="net"><span>Otele Net Aktarılacak Tutar (%${NET})</span><strong>${money(t.net)}</strong></div>
      </div>
      ${rows.length ? `<div class="card table-wrap"><table class="payout-table">
        <thead><tr><th>Elçi</th><th>Ref Kodu</th><th class="num">Rez.</th><th class="num">Toplam Ciro</th><th class="num">Misafir/Elçi Kom. (%${PRICING.CREATOR})</th><th class="num">Turizmlink (%${PRICING.PLATFORM})</th><th class="num">Otele Net (%${NET})</th></tr></thead>
        <tbody>${rows.map((x) => `<tr><td><b>${esc(x.c.name)}</b><small class="cell-sub">${esc(x.c.handle)}</small></td><td><code class="ref-code">${esc(x.a.code)}</code></td><td class="num">${x.a.sales}</td><td class="num">${money(x.revenue)}</td><td class="num neg">− ${money(x.creator)}</td><td class="num neg">− ${money(x.platform)}</td><td class="num"><b>${money(x.net)}</b></td></tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="2">Toplam</td><td class="num">${t.sales}</td><td class="num">${money(t.revenue)}</td><td class="num neg">− ${money(t.creator)}</td><td class="num neg">− ${money(t.platform)}</td><td class="num"><b>${money(t.net)}</b></td></tr></tfoot>
      </table></div>` : empty('chart', 'Henüz hakediş yok', 'Onaylanan ilk rezervasyondan sonra rapor burada oluşur.')}
      ${t.fee ? `<div class="info-box info-gold" style="margin-top:14px">${ic('bed')}<span>Barter eşleşmeleri için ayrıca <b>${money(t.fee)}</b> sabit hizmet bedeli faturalanır (komisyona dahil değildir).</span></div>` : ''}`;
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
    '/c/dashboard': viewCreatorDashboard,
    '/c/media': viewCreatorMedia,
    '/b/calendar': viewBusinessCalendar,
    '/b/payouts': viewBusinessPayouts,
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
      case 'lb-copy': {
        const input = document.getElementById('lb-code');
        const res = DB.setCode(lb.appId, input.value);
        if (res.error) { toast(res.error); input.focus(); break; }
        input.value = res.code;
        updateLbPreview();
        copy(DB.affiliateUrl(res.code));
        break;
      }
      case 'media-hotel':
        media.bizId = id;
        rerender();
        break;
      case 'media-dl': {
        const a = myApproved().find((x) => hotelOf(x).b?.id === media.bizId);
        const b = DB.business(media.bizId);
        const sc = TLMedia.SCENES.find((x) => x.id === el.dataset.scene);
        if (!a || !b || !sc) break;
        el.disabled = true;
        TLMedia.download(sc, { hotel: b.name, region: b.region, code: a.code }, `turizmlink-${b.id}-${sc.id}`)
          .then((fmt) => { toast(`Görsel indirildi (${fmt.toUpperCase()})`); el.disabled = false; });
        break;
      }
      case 'media-photo': {
        const a = myApproved().find((x) => hotelOf(x).b?.id === media.bizId);
        const b = DB.business(media.bizId);
        const m = b?.media?.find((x) => x.id === id);
        if (!a || !m) break;
        el.disabled = true;
        TLMedia.downloadPhoto(m, { hotel: b.name, region: b.region, code: a.code }, `turizmlink-${b.id}-${m.id}`)
          .then(() => toast('Kodlu görsel indirildi'))
          .catch(() => toast('Görsel hazırlanamadı, Yalın sürümü deneyin'))
          .finally(() => { el.disabled = false; });
        break;
      }
      case 'toggle-hosting': {
        const on = DB.setHosting(CURRENT.business, !DB.hostingOn(CURRENT.business));
        toast(on ? 'İçerik Üretici Ağırlama açıldı' : 'İçerik Üretici Ağırlama kapatıldı');
        rerender();
        break;
      }
      case 'cal-toggle': {
        const closed = DB.toggleClosed(CURRENT.business, el.dataset.day);
        toast(closed ? 'Gün satışa kapatıldı' : 'Gün satışa açıldı');
        rerender();
        break;
      }
      case 'cal-nav':
        calState.month = new Date(calState.month.getFullYear(), calState.month.getMonth() + +el.dataset.dir, 1);
        rerender();
        break;
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
    if (t.id === 'lb-code') { updateLbPreview(); return; }
    const pf = t.form?.id === 'priceForm' ? t.form : null;
    if (pf) {
      const biz = DB.business(CURRENT.business);
      document.getElementById('priceMatrix').innerHTML = priceMatrixHtml(biz, readPricing(pf));
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
    if (e.target.id === 'lb-app') {
      lb.appId = e.target.value;
      document.getElementById('lbWrap').innerHTML = linkBuilderHtml();
      return;
    }
    if (e.target.id === 'catFilter') {
      offerFilter.category = e.target.value;
      refreshOfferGrid();
    }
  });

  document.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;

    if (f.id === 'priceForm') {
      const p = readPricing(f);
      if (!(p.base > 0) || !(p.roundTo > 0) || Object.values(p).some((v) => !Number.isFinite(v) || v < 0)) { toast('Lütfen geçerli değerler girin'); return; }
      DB.setPricing(CURRENT.business, p);
      [...f.elements].filter((el) => el.name?.startsWith('cat:')).forEach((el) => DB.setRoomCat(CURRENT.business, el.name.slice(4), el.value));
      toast('Fiyatlar ve kategoriler kaydedildi');
      rerender();
      return;
    }

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

  // Link oluşturucu: yazarken önizleme (kayıt "Linkimi Kopyala" ile yapılır)
  function updateLbPreview() {
    const input = document.getElementById('lb-code');
    if (!input) return;
    const code = input.value.trim().toLocaleUpperCase('tr-TR').replace(/\s+/g, '-') || '…';
    const url = DB.affiliateUrl(code);
    document.getElementById('lb-url').textContent = url;
    document.getElementById('lb-test').href = url;
  }

  window.addEventListener('hashchange', () => { closeModal(); render(); });
  window.addEventListener('storage', (e) => { if (e.key && e.key.startsWith('turizmlink:v')) rerender(); }); // başka sekmede satış olunca güncelle

  // Konsoldan demo verisini sıfırlamak için: Turizmlink.reset()
  window.Turizmlink = { reset() { DB.reset(); rerender(); toast('Demo verisi sıfırlandı'); } };

  render();
})();
