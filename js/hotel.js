/* Turizmlink — misafir rezervasyon sayfası (hotel.html)
   ?ref=KOD → elçi linki: %5 davet indirimi + tıklama kaydı. ?h=b5 → doğrudan otel (indirimsiz).
   Misafir tarih seçip ön talep bırakır; otel extranet'ten onaylayınca satış elçinin koduna işlenir. */
(function () {
  const { ic, hydrate } = TLIcons;
  const { PRICING } = DB;
  const $root = document.getElementById('hotel');
  const $band = document.getElementById('discBand');
  const $toast = document.getElementById('toast');
  const $modal = document.getElementById('modal');
  const $modalCard = document.getElementById('modalCard');

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tl = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
  const money = (n) => tl.format(Math.round(n || 0));
  let toastTimer;
  function toast(msg) {
    $toast.textContent = msg; $toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $toast.classList.remove('show'), 2600);
  }

  /* ---------- Türkçe ek yardımcıları (ünlü uyumu) ---------- */
  const lastVowel = (w) => (w.toLocaleLowerCase('tr-TR').match(/[aıoueiöü](?=[^aıoueiöü]*$)/) || ['e'])[0];
  const endsVowel = (w) => /[aıoueiöü]$/i.test(w.toLocaleLowerCase('tr-TR'));
  /** "Ayşe Gezgin" → "Ayşe Gezgin'in", "Mert Rota" → "Mert Rota'nın" */
  function genitive(name) {
    const w = name.trim().split(/\s+/).pop();
    const v = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' }[lastVowel(w)];
    return `${name}'${endsVowel(w) ? 'n' : ''}${v}n`;
  }
  /** "Casa Di Datça" → "Casa Di Datça'dasınız" */
  function locativeYou(name) {
    const w = name.trim().split(/\s+/).pop();
    const back = 'aıou'.includes(lastVowel(w));
    const hard = /[çfhkpsşt]$/i.test(w.toLocaleLowerCase('tr-TR'));
    return `${name}'${hard ? 't' : 'd'}${back ? 'asınız' : 'esiniz'}`;
  }

  /* ---------- Tarih yardımcıları (yerel gün, ISO yyyy-mm-dd) ---------- */
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const nightsBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
  const fmtLong = (s) => parse(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' });
  const today = iso(new Date());

  /* ---------- Hangi otel, hangi elçi? ---------- */
  const params = new URLSearchParams(location.search);
  const code = (params.get('ref') || '').trim();
  const app = code ? DB.byCode(code) : null;
  const refOffer = app ? DB.offer(app.offerId) : null;
  const biz = DB.business(refOffer?.businessId || params.get('h') || 'b5') || DB.business('b5');
  const offer = refOffer || DB.offers({ businessId: biz.id, activeOnly: true })[0] || null;
  const creator = app ? DB.creator(app.creatorId) : null;
  const hasRef = !!app;

  // Odalar: otelin oda listesi yoksa teklif paketini tek "oda" olarak göster.
  const rooms = biz.rooms?.length ? biz.rooms : offer ? [{ id: 'pkg', name: offer.title, guests: offer.stay?.guests || 2, price: offer.price }] : [];

  // Tıklama: aynı oturumda bir kez say.
  if (hasRef) {
    try {
      const k = `turizmlink:clicked:${code}`;
      if (!sessionStorage.getItem(k)) { DB.trackClick(code); sessionStorage.setItem(k, '1'); }
    } catch (e) { DB.trackClick(code); }
  }

  /* ---------- Davet indirimi bandı ---------- */
  if (hasRef) {
    $band.innerHTML = `<div class="lwrap disc-in"><span class="disc-spark" aria-hidden="true">✨</span><span>${esc(genitive(creator.name))} tavsiyesiyle ${esc(locativeYou(biz.name))}. Rezervasyonunuza özel <b>%${PRICING.GUEST} Misafir İndirimi</b> tanımlandı.</span><code>${esc(code)}</code></div>`;
    $band.hidden = false;
  } else if (code) {
    $band.innerHTML = `<div class="lwrap disc-in">${ic('info')}<span>Bu davet linki geçersiz veya süresi dolmuş. Liste fiyatıyla ön talep bırakabilirsiniz.</span></div>`;
    $band.classList.add('disc-muted');
    $band.hidden = false;
  }
  document.getElementById('gHotelName').textContent = biz.name;
  document.title = `${biz.name} — Rezervasyon · Turizmlink`;

  /* ---------- Durum ---------- */
  const start = new Date();
  const thisMonth = new Date(start.getFullYear(), start.getMonth(), 1);
  // Takvim, bugünden sonraki ilk açık sezon gününün ayından başlar (Kasım'da → Nisan).
  function firstOpenMonth() {
    if (!biz.pricing) return thisMonth;
    for (let d = new Date(start), i = 0; i < 400; i++, d = addDays(d, 1)) {
      if (DB.seasonOf(iso(d))) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return thisMonth;
  }
  const st = {
    roomId: rooms[0]?.id,
    checkIn: null, checkOut: null, guests: 2, kids: 0,
    month: firstOpenMonth(),
  };
  const room = () => rooms.find((r) => r.id === st.roomId) || rooms[0];
  const offSeason = (s) => !!biz.pricing && !DB.seasonOf(s);
  const seasonLabel = (k) => DB.SEASONS.find((x) => x.key === k)?.label || '';

  // Kapalı günler: otelin kapattığı tarihler + seçili odada onaylanmış konaklamalar.
  function blockedSet() {
    const set = new Set(biz.closed || []);
    DB.requests({ businessId: biz.id, status: 'approved' })
      .filter((q) => q.roomId === st.roomId)
      .forEach((q) => { for (let d = parse(q.checkIn); iso(d) < q.checkOut; d = addDays(d, 1)) set.add(iso(d)); });
    return set;
  }

  /** Seçili oda + tarih + kişi için teklif: gece gece sezon fiyatı, sonra %5 misafir indirimi. */
  function quote(r = room()) {
    if (!st.checkIn || !st.checkOut) return null;
    const persons = Math.max(1, Math.min(st.guests, r.guests));
    const sq = DB.stayQuote(biz, r, st.checkIn, st.checkOut, persons);
    if (sq.error) return null;
    // aynı sezon + aynı fiyattaki geceleri grupla
    const groups = [];
    sq.nights.forEach((n) => {
      const g = groups[groups.length - 1];
      if (g && g.season === n.season && g.price === n.price) g.count++;
      else groups.push({ season: n.season, price: n.price, count: 1 });
    });
    return { nights: sq.nights.length, groups, persons, ...DB.guestPrice(sq.list, hasRef) };
  }

  /* ---------- Takvim ---------- */
  const WD = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  function calendarHtml() {
    const m = st.month;
    const first = new Date(m.getFullYear(), m.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // pazartesi ile başla
    const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const blocked = blockedSet();
    const canPrev = m > thisMonth;
    const monthOff = biz.pricing && Array.from({ length: days }, (_, i) => iso(new Date(m.getFullYear(), m.getMonth(), i + 1))).every(offSeason);
    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<span class="cal-pad"></span>';
    for (let d = 1; d <= days; d++) {
      const s = iso(new Date(m.getFullYear(), m.getMonth(), d));
      const past = s < today;
      // Çıkış günü seçilirken: o gün kapalı/sezon dışı olsa da önceki gece açıksa çıkış yapılabilir.
      const asCheckout = st.checkIn && !st.checkOut && s > st.checkIn && !offSeason(iso(addDays(parse(s), -1))) && !blocked.has(iso(addDays(parse(s), -1)));
      const off = offSeason(s) && !asCheckout;
      const closed = blocked.has(s) && !asCheckout;
      const cls = [
        past ? 'is-past' : '', off && !past ? 'is-off' : '', closed ? 'is-closed' : '',
        s === st.checkIn ? 'is-start' : '', s === st.checkOut ? 'is-end' : '',
        st.checkIn && st.checkOut && s > st.checkIn && s < st.checkOut ? 'is-range' : '',
        s === today ? 'is-today' : '',
      ].filter(Boolean).join(' ');
      cells += `<button type="button" class="cal-day ${cls}" data-day="${s}" ${past || closed || off ? 'disabled' : ''} aria-label="${fmtLong(s)}${closed ? ' (dolu)' : off ? ' (sezon dışı)' : ''}">${d}</button>`;
    }
    return `
      <div class="cal">
        <div class="cal-head">
          <button type="button" class="cal-nav" data-cal="-1" ${canPrev ? '' : 'disabled'} aria-label="Önceki ay">${ic('arrow', 'flip')}</button>
          <strong>${m.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</strong>
          <button type="button" class="cal-nav" data-cal="1" aria-label="Sonraki ay">${ic('arrow')}</button>
        </div>
        <div class="cal-grid">${WD.map((w) => `<span class="cal-wd">${w}</span>`).join('')}${cells}</div>
        ${monthOff ? `<p class="cal-note">${ic('info')} Otel 1 Nisan – 30 Ekim arasında açıktır.</p>` : ''}
        <div class="cal-legend"><span><i class="lg-sel"></i>Seçili</span><span><i class="lg-closed"></i>Dolu / kapalı</span>${biz.pricing ? '<span><i class="lg-off"></i>Sezon dışı</span>' : ''}</div>
      </div>`;
  }

  function summaryHtml() {
    const q = quote();
    const r = room();
    if (!q) {
      return `<div class="sum-empty">${ic('calendar')} ${st.checkIn ? 'Şimdi çıkış tarihini seçin.' : 'Takvimden giriş ve çıkış tarihini seçin.'}</div>`;
    }
    return `
      <div class="sum-dates"><div><span>Giriş</span><b>${fmtLong(st.checkIn)}</b></div><div><span>Çıkış</span><b>${fmtLong(st.checkOut)}</b></div></div>
      <div class="sum-rows">
        ${q.groups.map((g) => `<div><span>${g.season ? `${seasonLabel(g.season)} · ` : ''}${g.count} gece × ${money(g.price)}</span><b>${money(g.count * g.price)}</b></div>`).join('')}
        ${biz.pricing && q.persons !== 2 ? `<div class="sum-note"><span>${q.persons === 1 ? `Tek kişi: gecelik −${money(biz.pricing.single)} dahil` : `${q.persons} kişi: gecelik +${money((q.persons - 2) * biz.pricing.extra)} dahil`}${st.kids ? ` · ${st.kids} çocuk (0–6 yaş) ücretsiz` : ''}</span></div>` : st.kids ? `<div class="sum-note"><span>${st.kids} çocuk (0–6 yaş) ücretsiz</span></div>` : ''}
        ${hasRef ? `<div class="sum-disc"><span>${ic('gift')} Misafir indirimi (%${PRICING.GUEST})</span><b>− ${money(q.discount)}</b></div>` : ''}
        <div class="sum-total"><span>${hasRef ? 'Net fiyat' : 'Toplam'}</span><span class="price-pair">${hasRef ? `<s>${money(q.list)}</s>` : ''}<b>${money(q.total)}</b></span></div>
      </div>`;
  }

  /** Oda kartı fiyatı: tarih seçiliyse o konaklamanın gecelik ortalaması, değilse en düşük sezon fiyatı. */
  function roomPriceHtml(x) {
    const q = quote(x);
    let list, label;
    if (q) { list = Math.round(q.list / q.nights); label = q.groups.length > 1 ? '/ gece (ort.)' : '/ gece'; }
    else { list = DB.fromPrice(biz, x); label = biz.pricing ? "/ gece'den · 2 kişi" : '/ gece'; }
    const net = DB.guestPrice(list, hasRef).total;
    return `<span class="gh-room-price" data-rp="${x.id}">${hasRef ? `<s>${money(list)}</s>` : ''}<b>${money(net)}</b><small>${label}</small></span>`;
  }

  /** Seçili odanın sezon fiyat tablosu (2 kişi, gecelik). */
  function seasonTableHtml(r) {
    if (!biz.pricing) return '';
    const t = DB.seasonTable(biz.pricing)[r.cat || 1];
    return `<details class="gh-prices"><summary>${ic('calendar')} ${esc(r.name)} · sezon fiyatları (2 kişi, gecelik)</summary>
      <div class="table-wrap"><table><thead><tr><th>Dönem</th><th class="num">Fiyat</th>${hasRef ? `<th class="num">Size özel (−%${PRICING.GUEST})</th>` : ''}</tr></thead>
      <tbody>${DB.SEASONS.map((x) => `<tr><td>${x.range}</td><td class="num">${money(t[x.key])}</td>${hasRef ? `<td class="num"><b>${money(DB.guestPrice(t[x.key], true).total)}</b></td>` : ''}</tr>`).join('')}</tbody></table></div>
      <p class="gh-note">${ic('info')} 2 kişinin dışındaki her kişi (7 yaş ve üzeri) gecelik +${money(biz.pricing.extra)} · tek kişi −${money(biz.pricing.single)} · 0–6 yaş ücretsiz.</p></details>`;
  }

  function render() {
    const r = room();
    if (st.guests > r.guests) st.guests = r.guests;
    $root.innerHTML = `
      <section class="gh-hero">
        <div class="gh-cover ${biz.cover ? 'has-photo' : 'cover-otel'}">
          ${biz.cover ? `<img src="${esc(biz.cover)}" alt="${esc(biz.name)}" fetchpriority="high" />` : `<span class="cover-ico" aria-hidden="true">${ic('sun')}</span>`}
          ${biz.gallery?.length ? `<button type="button" class="gh-all" data-gal="0">${ic('grid')} ${biz.gallery.length} fotoğraf</button>` : ''}
          <div class="gh-cover-txt"><span class="chip chip-glass">${ic('pin')} ${esc(biz.region)}</span><span class="chip chip-glass">${ic('building')} Butik otel</span></div>
        </div>
        <div class="gh-head">
          <h1>${esc(biz.name)}</h1>
          <p>${esc(biz.tagline || offer?.description || '')}</p>
        </div>
      </section>

      ${biz.gallery?.length ? `<div class="gh-gallery" aria-label="Fotoğraf galerisi">
        ${biz.gallery.slice(0, 5).map((g, i) => `<button type="button" class="gh-shot ${i === 0 ? 'big' : ''}" data-gal="${i}" aria-label="${esc(g.title)} — büyüt"><img src="${esc(g.thumb)}" alt="${esc(g.title)}" loading="lazy" />${i === 4 && biz.gallery.length > 5 ? `<span class="gh-more">+${biz.gallery.length - 5}</span>` : ''}</button>`).join('')}
      </div>` : ''}

      <div class="gh-grid">
        <div class="gh-main">
          ${biz.about ? `<section class="card card-pad"><h2 class="gh-h2">Otel hakkında</h2><p class="gh-p">${esc(biz.about)}</p>
            ${biz.features?.length ? `<ul class="gh-feats">${biz.features.map((f) => `<li>${ic('check')} ${esc(f)}</li>`).join('')}</ul>` : ''}
            ${biz.address || biz.phone ? `<div class="gh-contact">
              ${biz.address ? `<a href="https://maps.google.com/?q=${encodeURIComponent(biz.name + ', ' + biz.address)}" target="_blank" rel="noopener">${ic('pin')}<span><small>Adres</small>${esc(biz.address)}</span></a>` : ''}
              ${biz.phone ? `<a href="tel:+90${biz.phone.replace(/\D/g, '').replace(/^0/, '')}">${ic('phone')}<span><small>Telefon</small>${esc(biz.phone)}</span></a>` : ''}
            </div>` : ''}
            ${biz.info?.length ? `<dl class="gh-info">${biz.info.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}</section>` : ''}

          <section class="card card-pad">
            <h2 class="gh-h2">Oda seçin</h2>
            <div class="gh-rooms" role="radiogroup" aria-label="Oda">
              ${rooms.map((x) => `
                <label class="gh-room ${x.id === st.roomId ? 'active' : ''}">
                  <input type="radio" name="room" value="${x.id}" ${x.id === st.roomId ? 'checked' : ''} />
                  ${x.img ? `<span class="gh-room-img"><img src="${esc(x.img)}" alt="${esc(x.name)} odası" loading="lazy" /></span>` : `<span class="gh-room-ico">${ic('bed')}</span>`}
                  <span class="gh-room-txt"><b>${esc(x.name)}</b>${x.desc ? `<small>${esc(x.desc)}</small>` : ''}<small>${x.guests} kişiye kadar</small></span>
                  ${roomPriceHtml(x)}
                </label>`).join('')}
            </div>
            ${seasonTableHtml(r)}
          </section>

          <section class="card card-pad">
            <h2 class="gh-h2">Tarih seçin</h2>
            <div id="calWrap">${calendarHtml()}</div>
          </section>
        </div>

        <aside class="gh-side">
          <form class="card card-pad gh-book" id="reqForm" novalidate>
            <div class="gh-book-head"><h2 class="gh-h2">Rezervasyon talebi</h2>${hasRef ? `<span class="chip chip-gold">${ic('gift')} %${PRICING.GUEST} misafir indirimi</span>` : ''}</div>
            <div class="gh-room-sel">${ic('bed')} ${esc(r.name)}</div>
            <div id="sumWrap">${summaryHtml()}</div>
            <div class="form-grid">
              <div class="field"><label for="g-guests">Kişi (7+ yaş)</label><select class="select" id="g-guests" name="guests">${Array.from({ length: r.guests }, (_, i) => i + 1).map((n) => `<option ${n === st.guests ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
              <div class="field"><label for="g-kids">Çocuk (0–6 yaş)</label><select class="select" id="g-kids" name="kids">${[0, 1, 2].map((n) => `<option value="${n}" ${n === st.kids ? 'selected' : ''}>${n ? `${n} · ücretsiz` : 'Yok'}</option>`).join('')}</select></div>
              <div class="field full"><label for="g-phone">Telefon</label><input class="input" id="g-phone" name="phone" type="tel" autocomplete="tel" required placeholder="05xx xxx xx xx" /></div>
              <div class="field full"><label for="g-name">Ad soyad</label><input class="input" id="g-name" name="guestName" autocomplete="name" required placeholder="Adınız ve soyadınız" /></div>
            </div>
            <button class="btn btn-accent btn-block btn-book" type="submit">${ic('calendar')} Rezervasyon talebi gönder</button>
            <p class="gh-note">${ic('shield')} Şimdi ödeme alınmaz. Kartınızdan çekim, otel talebinizi onayladıktan sonra yapılır.</p>
          </form>
        </aside>
      </div>`;
  }

  function refreshPrices() {
    document.getElementById('sumWrap').innerHTML = summaryHtml();
    $root.querySelectorAll('[data-rp]').forEach((el) => { el.outerHTML = roomPriceHtml(rooms.find((x) => x.id === el.dataset.rp)); });
  }
  function refreshBooking() {
    document.getElementById('calWrap').innerHTML = calendarHtml();
    refreshPrices();
  }

  if (!rooms.length) {
    $root.innerHTML = `<div class="empty"><div class="empty-ico">${ic('building')}</div><h3>Otel bulunamadı</h3><p>Bu bağlantıya ait aktif bir otel yok.</p><a class="btn btn-primary" href="index.html">Turizmlink</a></div>`;
    return;
  }
  render();

  /* ---------- Olaylar ---------- */
  /* ---------- Galeri (lightbox) ---------- */
  let galIdx = 0;
  function galleryHtml() {
    const g = biz.gallery[galIdx];
    return `
      <div class="lightbox">
        <button class="modal-close lb-close" data-close aria-label="Kapat">${ic('x')}</button>
        <img src="${esc(g.src)}" alt="${esc(g.title)}" />
        <div class="lb-bar">
          <button type="button" class="cal-nav" data-galnav="-1" aria-label="Önceki">${ic('arrow', 'flip')}</button>
          <span><b>${esc(g.title)}</b> · ${galIdx + 1} / ${biz.gallery.length}</span>
          <button type="button" class="cal-nav" data-galnav="1" aria-label="Sonraki">${ic('arrow')}</button>
        </div>
      </div>`;
  }
  function openGallery(i) { galIdx = i; openModal(galleryHtml()); $modalCard.classList.add('modal-photo'); }
  $modalCard.addEventListener('click', (e) => {
    const b = e.target.closest('[data-galnav]');
    if (!b) return;
    galIdx = (galIdx + +b.dataset.galnav + biz.gallery.length) % biz.gallery.length;
    $modalCard.innerHTML = galleryHtml();
  });
  document.addEventListener('keydown', (e) => {
    if ($modal.hidden || !$modalCard.classList.contains('modal-photo')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      galIdx = (galIdx + (e.key === 'ArrowRight' ? 1 : -1) + biz.gallery.length) % biz.gallery.length;
      $modalCard.innerHTML = galleryHtml();
    }
  });

  $root.addEventListener('click', (e) => {
    const gal = e.target.closest('[data-gal]');
    if (gal) { openGallery(+gal.dataset.gal); return; }
    const nav = e.target.closest('[data-cal]');
    if (nav) {
      st.month = new Date(st.month.getFullYear(), st.month.getMonth() + +nav.dataset.cal, 1);
      document.getElementById('calWrap').innerHTML = calendarHtml();
      return;
    }
    const day = e.target.closest('.cal-day');
    if (!day || day.disabled) return;
    const s = day.dataset.day;
    if (!st.checkIn || st.checkOut || s <= st.checkIn) {
      st.checkIn = s; st.checkOut = null;
    } else {
      const blocked = blockedSet();
      for (let d = parse(st.checkIn); iso(d) < s; d = addDays(d, 1)) {
        if (blocked.has(iso(d))) { toast('Seçtiğiniz aralıkta dolu bir gün var.'); return; }
        if (offSeason(iso(d))) { toast('Seçtiğiniz aralık sezon dışı günler içeriyor (otel 1 Nisan – 30 Ekim açık).'); return; }
      }
      st.checkOut = s;
    }
    refreshBooking();
  });

  $root.addEventListener('change', (e) => {
    if (e.target.name === 'room') {
      st.roomId = e.target.value;
      // Seçili aralık yeni odada doluysa sıfırla.
      if (st.checkIn) {
        const blocked = blockedSet();
        const end = st.checkOut || iso(addDays(parse(st.checkIn), 1));
        for (let d = parse(st.checkIn); iso(d) < end; d = addDays(d, 1)) if (blocked.has(iso(d))) { st.checkIn = st.checkOut = null; break; }
      }
      render();
    } else if (e.target.id === 'g-guests') {
      st.guests = Math.min(room().guests, Math.max(1, +e.target.value || 1));
      refreshPrices();
    } else if (e.target.id === 'g-kids') {
      st.kids = +e.target.value;
      refreshPrices();
    }
  });

  /* ---------- Onay penceresi (modal) ---------- */
  let pending = null; // { name, phone, guests, quote }
  function openModal(html) {
    $modalCard.innerHTML = html;
    $modalCard.classList.remove('modal-photo');
    $modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $modalCard.querySelector('input, button:not(.modal-close)')?.focus({ preventScroll: true });
  }
  function closeModal() { $modal.hidden = true; document.body.style.overflow = ''; }
  $modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$modal.hidden) closeModal(); });

  function confirmHtml() {
    const { name, guests, kids, quote: q } = pending;
    return `
      <div class="modal-head">
        <div><span class="eyebrow">${ic('shield')} Güvenli talep</span><h2 id="modalTitle" style="font-size:22px;margin-top:10px">Rezervasyon talebinizi onaylayın</h2></div>
        <button class="modal-close" data-close aria-label="Kapat">${ic('x')}</button>
      </div>
      <form class="modal-body" id="confirmForm" novalidate>
        <div class="cf-sum">
          <div class="cf-sum-top"><b>${esc(biz.name)}</b><span>${esc(room().name)}</span></div>
          <div class="cf-sum-grid">
            <div><span>Giriş</span><b>${fmtLong(st.checkIn)}</b></div>
            <div><span>Çıkış</span><b>${fmtLong(st.checkOut)}</b></div>
            <div><span>Misafir</span><b>${esc(name)} · ${guests} kişi${kids ? ` + ${kids} çocuk` : ''}</b></div>
            <div><span>${q.nights} gece</span><b class="price-pair">${q.discount ? `<s>${money(q.list)}</s>` : ''}${money(q.total)}</b></div>
          </div>
          ${q.discount ? `<div class="cf-disc">${ic('gift')} %${PRICING.GUEST} misafir indirimi: ${money(q.discount)} tasarruf</div>` : ''}
        </div>

        <div class="cf-policy">${ic('clock')}<p><b>Otelimiz talebinizi 2 saat içinde onaylayacaktır,</b> onay sonrası kartınızdan çekim yapılacaktır. Onay gelmezse hiçbir ücret alınmaz.</p></div>

        <fieldset class="cf-card">
          <legend>${ic('lock')} Kart bilgileri</legend>
          <div class="form-grid">
            <div class="field full"><label for="cc-name">Kart üzerindeki isim</label><input class="input" id="cc-name" autocomplete="cc-name" value="${esc(name)}" required /></div>
            <div class="field full"><label for="cc-num">Kart numarası</label><input class="input" id="cc-num" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" maxlength="19" required /></div>
            <div class="field"><label for="cc-exp">Son kullanma</label><input class="input" id="cc-exp" inputmode="numeric" autocomplete="cc-exp" placeholder="AA/YY" maxlength="5" required /></div>
            <div class="field"><label for="cc-cvc">CVC</label><input class="input" id="cc-cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4" required /></div>
          </div>
          <p class="cf-demo">${ic('info')} Demo sürüm: kart bilgisi hiçbir yere gönderilmez ve kaydedilmez. Lütfen gerçek kart bilgisi girmeyin.</p>
        </fieldset>

        <label class="cf-check"><input type="checkbox" id="cf-ok" required /> <span>Rezervasyon koşullarını ve iptal politikasını okudum, kabul ediyorum.</span></label>
        <div class="cf-actions">
          <button type="button" class="btn btn-ghost" data-close>Vazgeç</button>
          <button type="submit" class="btn btn-accent">${ic('check')} Talebi onayla</button>
        </div>
      </form>`;
  }

  function doneHtml(req) {
    return `
      <div class="modal-body done-body">
        <button class="modal-close done-close" data-close aria-label="Kapat">${ic('x')}</button>
        <div class="done-ico">${ic('check')}</div>
        <h2 id="modalTitle">Talebiniz otele iletildi</h2>
        <p>${esc(biz.name)} · ${esc(room().name)}<br>${fmtLong(req.checkIn)} → ${fmtLong(req.checkOut)} · ${req.nights} gece</p>
        <div class="gh-done-total">${money(req.total)}${req.discount ? `<small>${money(req.discount)} misafir indirimi dahil</small>` : ''}</div>
        <div class="cf-policy">${ic('clock')}<p>Otelimiz talebinizi <b>2 saat içinde</b> onaylayacak; onay sonrası kartınızdan çekim yapılacak ve <b>${esc(req.phone)}</b> numarasına bilgi verilecek.</p></div>

        <div class="ambassador">
          <div class="amb-ico">${ic('sparkles')}</div>
          <h3>Siz de paylaşıp her rezervasyondan %${PRICING.CREATOR} kazanmak ister misiniz?</h3>
          <p>Konakladığınız oteli önerin; linkinizle gelen misafir %${PRICING.GUEST} indirim alsın, siz her onaylı rezervasyondan %${PRICING.CREATOR} net kazanın.</p>
          <a class="btn btn-accent btn-block" href="app.html">${ic('camera')} Turizmlink Elçisi Olun ${ic('arrow')}</a>
        </div>
      </div>`;
  }

  $root.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const q = quote();
    if (!q) { toast('Lütfen giriş ve çıkış tarihini seçin.'); return; }
    const name = f.guestName.value.trim();
    const phone = f.phone.value.trim();
    if (!name || !phone) { toast('Ad soyad ve telefon gerekli.'); (name ? f.phone : f.guestName).focus(); return; }
    pending = { name, phone, guests: q.persons, kids: st.kids, quote: q };
    openModal(confirmHtml());
  });

  // Kart alanları: basit biçimlendirme
  $modalCard.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'cc-num') t.value = t.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
    if (t.id === 'cc-exp') { const d = t.value.replace(/\D/g, '').slice(0, 4); t.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; }
    if (t.id === 'cc-cvc') t.value = t.value.replace(/\D/g, '').slice(0, 4);
  });

  $modalCard.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.id !== 'confirmForm' || !pending) return;
    const num = f.querySelector('#cc-num').value.replace(/\D/g, '');
    const exp = f.querySelector('#cc-exp').value;
    const cvc = f.querySelector('#cc-cvc').value;
    const err =
      !f.querySelector('#cc-name').value.trim() ? ['cc-name', 'Kart üzerindeki ismi girin.'] :
      num.length < 15 ? ['cc-num', 'Kart numarasını kontrol edin.'] :
      !/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp) ? ['cc-exp', 'Son kullanma tarihini AA/YY biçiminde girin.'] :
      cvc.length < 3 ? ['cc-cvc', 'CVC kodunu girin.'] :
      !f.querySelector('#cf-ok').checked ? ['cf-ok', 'Devam etmek için koşulları onaylayın.'] : null;
    if (err) { toast(err[1]); f.querySelector(`#${err[0]}`).focus(); return; }

    // Kart bilgisi saklanmaz; yalnızca talep kaydedilir.
    const { name, phone, guests, kids, quote: q } = pending;
    const req = DB.createRequest({
      businessId: biz.id, offerId: offer?.id || null, code: hasRef ? code : null, roomId: st.roomId,
      guestName: name, phone, guests, kids,
      checkIn: st.checkIn, checkOut: st.checkOut, nights: q.nights,
      list: q.list, discount: q.discount, total: q.total,
    });
    pending = null;
    $modalCard.innerHTML = doneHtml(req);
    const form = document.getElementById('reqForm');
    if (form) form.outerHTML = `
      <div class="card card-pad gh-done">
        <div class="empty-ico">${ic('check')}</div>
        <h2 class="gh-h2">Talebiniz alındı</h2>
        <p>${fmtLong(req.checkIn)} → ${fmtLong(req.checkOut)} · ${money(req.total)}</p>
        <p class="gh-note">${ic('clock')} Otel onayı en geç 2 saat içinde.</p>
        <a class="btn btn-ghost btn-block" href="app.html">${ic('sparkles')} Elçi olun, %${PRICING.CREATOR} kazanın</a>
      </div>`;
  });

  hydrate();
})();
