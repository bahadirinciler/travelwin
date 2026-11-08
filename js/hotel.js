/* Turizmlink — misafir rezervasyon sayfası (hotel.html)
   ?ref=KOD → elçi linki: %5 davet indirimi + tıklama kaydı. ?h=b5 → doğrudan otel (indirimsiz).
   Misafir tarih seçip ön talep bırakır; otel extranet'ten onaylayınca satış elçinin koduna işlenir. */
(function () {
  const { ic, hydrate } = TLIcons;
  const { PRICING } = DB;
  const $root = document.getElementById('hotel');
  const $band = document.getElementById('discBand');
  const $toast = document.getElementById('toast');

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tl = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
  const money = (n) => tl.format(Math.round(n || 0));
  let toastTimer;
  function toast(msg) {
    $toast.textContent = msg; $toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $toast.classList.remove('show'), 2600);
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
    $band.innerHTML = `<div class="lwrap disc-in">${ic('gift')}<span><b>%${PRICING.GUEST} Davet İndirimi</b> uygulandı · ${esc(creator.name)} (${esc(creator.handle)}) önerisiyle geldiniz</span><code>${esc(code)}</code></div>`;
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
  const st = {
    roomId: rooms.find((r) => r.id === 'r2')?.id || rooms[0]?.id,
    checkIn: null, checkOut: null, guests: 2,
    month: new Date(start.getFullYear(), start.getMonth(), 1),
  };
  const room = () => rooms.find((r) => r.id === st.roomId) || rooms[0];

  // Kapalı günler: otelin kapattığı tarihler + seçili odada onaylanmış konaklamalar.
  function blockedSet() {
    const set = new Set(biz.closed || []);
    DB.requests({ businessId: biz.id, status: 'approved' })
      .filter((q) => q.roomId === st.roomId)
      .forEach((q) => { for (let d = parse(q.checkIn); iso(d) < q.checkOut; d = addDays(d, 1)) set.add(iso(d)); });
    return set;
  }

  function quote() {
    if (!st.checkIn || !st.checkOut) return null;
    const nights = nightsBetween(st.checkIn, st.checkOut);
    return { nights, ...DB.guestPrice(nights * room().price, hasRef) };
  }

  /* ---------- Takvim ---------- */
  const WD = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  function calendarHtml() {
    const m = st.month;
    const first = new Date(m.getFullYear(), m.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // pazartesi ile başla
    const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const blocked = blockedSet();
    const canPrev = m > new Date(start.getFullYear(), start.getMonth(), 1);
    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<span class="cal-pad"></span>';
    for (let d = 1; d <= days; d++) {
      const s = iso(new Date(m.getFullYear(), m.getMonth(), d));
      const past = s < today;
      const closed = blocked.has(s);
      const cls = [
        past ? 'is-past' : '', closed ? 'is-closed' : '',
        s === st.checkIn ? 'is-start' : '', s === st.checkOut ? 'is-end' : '',
        st.checkIn && st.checkOut && s > st.checkIn && s < st.checkOut ? 'is-range' : '',
        s === today ? 'is-today' : '',
      ].filter(Boolean).join(' ');
      cells += `<button type="button" class="cal-day ${cls}" data-day="${s}" ${past || closed ? 'disabled' : ''} aria-label="${fmtLong(s)}${closed ? ' (dolu)' : ''}">${d}</button>`;
    }
    return `
      <div class="cal">
        <div class="cal-head">
          <button type="button" class="cal-nav" data-cal="-1" ${canPrev ? '' : 'disabled'} aria-label="Önceki ay">${ic('arrow', 'flip')}</button>
          <strong>${m.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</strong>
          <button type="button" class="cal-nav" data-cal="1" aria-label="Sonraki ay">${ic('arrow')}</button>
        </div>
        <div class="cal-grid">${WD.map((w) => `<span class="cal-wd">${w}</span>`).join('')}${cells}</div>
        <div class="cal-legend"><span><i class="lg-sel"></i>Seçili</span><span><i class="lg-closed"></i>Dolu / kapalı</span></div>
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
        <div><span>${money(r.price)} × ${q.nights} gece</span><b>${money(q.list)}</b></div>
        ${hasRef ? `<div class="sum-disc"><span>${ic('gift')} Davet indirimi (%${PRICING.GUEST})</span><b>− ${money(q.discount)}</b></div>` : ''}
        <div class="sum-total"><span>Toplam</span><b>${money(q.total)}</b></div>
      </div>`;
  }

  function render() {
    const r = room();
    $root.innerHTML = `
      <section class="gh-hero">
        <div class="gh-cover cover-otel"><span class="cover-ico" aria-hidden="true">${ic('sun')}</span>
          <div class="gh-cover-txt"><span class="chip chip-glass">${ic('pin')} ${esc(biz.region)}</span><span class="chip chip-glass">${ic('building')} Butik otel</span></div>
        </div>
        <div class="gh-head">
          <h1>${esc(biz.name)}</h1>
          <p>${esc(biz.tagline || offer?.description || '')}</p>
        </div>
      </section>

      <div class="gh-grid">
        <div class="gh-main">
          ${biz.about ? `<section class="card card-pad"><h2 class="gh-h2">Otel hakkında</h2><p class="gh-p">${esc(biz.about)}</p>
            ${biz.features?.length ? `<ul class="gh-feats">${biz.features.map((f) => `<li>${ic('check')} ${esc(f)}</li>`).join('')}</ul>` : ''}</section>` : ''}

          <section class="card card-pad">
            <h2 class="gh-h2">Oda seçin</h2>
            <div class="gh-rooms" role="radiogroup" aria-label="Oda">
              ${rooms.map((x) => `
                <label class="gh-room ${x.id === st.roomId ? 'active' : ''}">
                  <input type="radio" name="room" value="${x.id}" ${x.id === st.roomId ? 'checked' : ''} />
                  <span class="gh-room-ico">${ic('bed')}</span>
                  <span class="gh-room-txt"><b>${esc(x.name)}</b><small>${x.guests} kişiye kadar</small></span>
                  <span class="gh-room-price">${hasRef ? `<s>${money(x.price)}</s>` : ''}<b>${money(hasRef ? DB.guestPrice(x.price, true).total : x.price)}</b><small>/ gece</small></span>
                </label>`).join('')}
            </div>
          </section>

          <section class="card card-pad">
            <h2 class="gh-h2">Tarih seçin</h2>
            <div id="calWrap">${calendarHtml()}</div>
          </section>
        </div>

        <aside class="gh-side">
          <form class="card card-pad gh-book" id="reqForm" novalidate>
            <div class="gh-book-head"><h2 class="gh-h2">Ön talep oluştur</h2>${hasRef ? `<span class="chip chip-gold">${ic('gift')} %${PRICING.GUEST} indirim</span>` : ''}</div>
            <div class="gh-room-sel">${ic('bed')} ${esc(r.name)}</div>
            <div id="sumWrap">${summaryHtml()}</div>
            <div class="form-grid">
              <div class="field"><label for="g-guests">Kişi</label><select class="select" id="g-guests" name="guests">${Array.from({ length: r.guests }, (_, i) => i + 1).map((n) => `<option ${n === Math.min(st.guests, r.guests) ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
              <div class="field"><label for="g-phone">Telefon</label><input class="input" id="g-phone" name="phone" type="tel" autocomplete="tel" required placeholder="05xx xxx xx xx" /></div>
              <div class="field full"><label for="g-name">Ad soyad</label><input class="input" id="g-name" name="guestName" autocomplete="name" required placeholder="Adınız ve soyadınız" /></div>
            </div>
            <button class="btn btn-accent btn-block" type="submit">${ic('send')} Ön talep gönder</button>
            <p class="gh-note">${ic('shield')} Ödeme alınmaz. Otel müsaitliği onayladığında sizinle iletişime geçer; rezervasyon onayla kesinleşir.</p>
          </form>
        </aside>
      </div>`;
  }

  function refreshBooking() {
    document.getElementById('calWrap').innerHTML = calendarHtml();
    document.getElementById('sumWrap').innerHTML = summaryHtml();
  }

  if (!rooms.length) {
    $root.innerHTML = `<div class="empty"><div class="empty-ico">${ic('building')}</div><h3>Otel bulunamadı</h3><p>Bu bağlantıya ait aktif bir otel yok.</p><a class="btn btn-primary" href="index.html">Turizmlink</a></div>`;
    return;
  }
  render();

  /* ---------- Olaylar ---------- */
  $root.addEventListener('click', (e) => {
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
      st.guests = +e.target.value;
    }
  });

  $root.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const q = quote();
    if (!q) { toast('Lütfen giriş ve çıkış tarihini seçin.'); return; }
    const name = f.guestName.value.trim();
    const phone = f.phone.value.trim();
    if (!name || !phone) { toast('Ad soyad ve telefon gerekli.'); (name ? f.phone : f.guestName).focus(); return; }
    const req = DB.createRequest({
      businessId: biz.id, offerId: offer?.id || null, code: hasRef ? code : null, roomId: st.roomId,
      guestName: name, phone, guests: +f.guests.value,
      checkIn: st.checkIn, checkOut: st.checkOut, nights: q.nights,
      list: q.list, discount: q.discount, total: q.total,
    });
    f.outerHTML = `
      <div class="card card-pad gh-done">
        <div class="empty-ico">${ic('check')}</div>
        <h2 class="gh-h2">Ön talebiniz iletildi</h2>
        <p>${esc(biz.name)} · ${esc(room().name)}<br>${fmtLong(req.checkIn)} → ${fmtLong(req.checkOut)} · ${req.nights} gece</p>
        <div class="gh-done-total">${money(req.total)}${req.discount ? `<small>${money(req.discount)} davet indirimi dahil</small>` : ''}</div>
        <p class="gh-note">${ic('clock')} Otel talebinizi inceleyip sizi <b>${esc(phone)}</b> numarasından arayacak.</p>
        <a class="btn btn-ghost btn-block" href="extranet.html#/b/requests" target="_blank" rel="noopener">${ic('external')} Demo: otel panelinde gör</a>
      </div>`;
  });

  hydrate();
})();
