/* Turizmlink — demo veri katmanı (localStorage). Backend gelene kadar mock "API". */
(function () {
  // v5: Casa Di Datça gerçek odaları (Capri dahil) ve fotoğrafları — eski demo verisi yerine yeni seed yüklenir.
  const KEY = 'turizmlink:v5';

  /* ---- Gelir modeli ----
     Satış: otel, misafirin ödediği tutar üzerinden toplam %7 öder → %5 elçiye (net), %2 Turizmlink'e.
     Misafir: elçi linkiyle gelen misafir liste fiyatından %5 doğrudan indirim alır.
     Barter (konaklama karşılığı içerik): otel eşleşme başına sabit hizmet bedeli öder.
     Hibrit: ikisi birden. */
  const PRICING = { TOTAL: 7, CREATOR: 5, PLATFORM: 2, GUEST: 5, BARTER_FEE: 1500 };

  const REGIONS = ['Datça', 'Bodrum', 'Fethiye', 'Kaş', 'Antalya', 'Kapadokya', 'Marmaris', 'Alaçatı', 'Göcek'];
  const CATEGORIES = {
    otel: { label: 'Otel', icon: 'building' },
    tekne: { label: 'Tekne', icon: 'boat' },
    tur: { label: 'Tur', icon: 'compass' },
    restoran: { label: 'Restoran', icon: 'utensils' },
    aktivite: { label: 'Aktivite', icon: 'waves' },
  };
  const MODELS = {
    commission: { label: 'Komisyon', filter: 'Sadece Komisyon', icon: 'percent', desc: `Her satıştan toplam %${PRICING.TOTAL}: %${PRICING.CREATOR} elçiye, %${PRICING.PLATFORM} Turizmlink'e. Misafire %${PRICING.GUEST} indirim.` },
    stay: { label: 'Barter', filter: 'Ücretsiz Konaklama (Barter)', icon: 'bed', desc: 'İçerik karşılığı ücretsiz konaklama; eşleşme başına sabit hizmet bedeli.' },
    hybrid: { label: 'Hibrit', filter: 'Hibrit', icon: 'sparkles', desc: `Ücretsiz konaklama + satışlardan %${PRICING.CREATOR} elçi komisyonu.` },
  };

  const CURRENT = { business: 'b5', creator: 'c1' };

  function seed() {
    const now = Date.now();
    const day = 86400000;
    return {
      businesses: [
        {
          id: 'b5', name: 'Casa Di Datça', region: 'Datça',
          tagline: 'Datça\'da taş mimari, havuz ve her biri bir İtalyan kentinin adını taşıyan odalar.',
          about: 'Taş kemerli villası, bahçe içindeki havuzu ve bambu gölgeli restoran terasıyla Casa Di Datça, Datça\'nın sakinliğini İtalyan esintisiyle buluşturur. Odalar Arezzo\'dan Portofino\'ya İtalyan kentlerinin adını taşır; şömineli kütüphane salonu ve manzaralı ortak alanlar misafirlere açıktır.',
          features: ['Açık havuz', 'Mamma Mia restoran & pizzeria', 'Kahvaltı', 'Şömineli kütüphane salonu', 'Geniş bahçe', 'Ücretsiz otopark'],
          // Fotoğraflar: assets/casadidatca (kaynak: GORSELLER/CASADIDATCA, tools/casadidatca-gorseller.sh ile rötuşlu)
          cover: 'assets/casadidatca/hero.jpg',
          gallery: [
            ['havuz-aksam', 'Akşam havuz başı'], ['tas-villa', 'Taş villa'], ['restoran-teras', 'Restoran terası'],
            ['kahvalti', 'Kahvaltı'], ['drone-gunbatimi', 'Gün batımında otel'], ['salon-manzara', 'Manzaralı salon'],
            ['somine-kutuphane', 'Şömineli kütüphane'], ['tas-kemer', 'Taş kemerler'], ['bahce-yolu', 'Bahçe yolu'], ['havuz-gece', 'Gece havuz'], ['capri-veranda', 'Capri bahçe evi verandası'],
          ].map(([f, t]) => ({ src: 'assets/casadidatca/gallery/' + f + '.jpg', thumb: 'assets/casadidatca/thumbs/' + f + '.jpg', title: t })),
          media: [
            ['villa-aksam', 'Taş villa, akşam', 'Story'], ['havuz', 'Havuz başı', 'Reels kapağı'], ['restoran', 'Restoran terası', 'Story'],
            ['kahvalti', 'Kahvaltı sofrası', 'Reels kapağı'], ['yesil-kapi', 'Yeşil kapı', 'Story'], ['tas-kemer', 'Taş kemerler', 'Story'],
            ['drone', 'Gün batımında Datça', 'Reels kapağı'], ['oda', 'Cinque Terre odası', 'Story'], ['capri-bahce', 'Capri bahçe evi', 'Story'],
          ].map(([f, t, fmt]) => ({ id: f, src: 'assets/casadidatca/story/' + f + '.jpg', thumb: 'assets/casadidatca/story/thumbs/' + f + '.jpg', title: t, format: fmt })),
          // Fiyatlar örnek değerdir; otel extranet → Takvim / Fiyat'tan günceller.
          rooms: [
            { id: 'cinque-terre', name: 'Cinque Terre', desc: 'Çift kişilik · manzaralı pencere kenarı', guests: 2, price: 7500, img: 'assets/casadidatca/rooms/cinque-terre.jpg' },
            { id: 'portofino', name: 'Portofino', desc: 'Çift kişilik · manzaralı pencere kenarı', guests: 2, price: 7500, img: 'assets/casadidatca/rooms/portofino.jpg' },
            { id: 'orvieto', name: 'Orvieto', desc: 'Çift kişilik', guests: 2, price: 7000, img: 'assets/casadidatca/rooms/orvieto.jpg' },
            { id: 'lerici', name: 'Lerici', desc: 'Çift kişilik · terasa açılır', guests: 2, price: 7500, img: 'assets/casadidatca/rooms/lerici.jpg' },
            { id: 'arezzo', name: 'Arezzo', desc: 'Çift + tek kişilik yatak', guests: 3, price: 8500, img: 'assets/casadidatca/rooms/arezzo.jpg' },
            { id: 'lucca', name: 'Lucca', desc: 'Tek kişilik yataklar + oturma köşesi', guests: 3, price: 8500, img: 'assets/casadidatca/rooms/lucca.jpg' },
            { id: 'garda', name: 'Garda', desc: 'Geniş oda · bahçeye açılan kapı', guests: 3, price: 9000, img: 'assets/casadidatca/rooms/garda.jpg' },
            { id: 'iseo', name: 'Iseo-Como-Maggiore', desc: 'Geniş oda · bahçeye açılan kapı', guests: 3, price: 9000, img: 'assets/casadidatca/rooms/iseo.jpg' },
            { id: 'capri', name: 'Capri', desc: 'Bahçe evi · veranda ve mutfak', guests: 4, price: 11000, img: 'assets/casadidatca/rooms/capri.jpg' },
            { id: 'elba', name: 'Elba', desc: 'Aile dairesi · mutfak ve oturma alanı', guests: 5, price: 12500, img: 'assets/casadidatca/rooms/elba.jpg' },
          ],
          // Otelin kapattığı günler (extranet'te yönetilecek)
          closed: [5, 6, 7, 19, 20].map((n) => isoDay(now + n * day)),
        },
        { id: 'b1', name: 'Mavi Koy Butik Otel', region: 'Bodrum' },
        { id: 'b2', name: 'Kaptan Yatçılık', region: 'Göcek' },
        { id: 'b3', name: 'Peri Bacası Cave Suites', region: 'Kapadokya' },
        { id: 'b4', name: 'Likya Rota Turizm', region: 'Kaş' },
      ],
      creators: [
        { id: 'c1', name: 'Ayşe Gezgin', handle: '@aysegezgin', platform: 'Instagram', followers: 48000 },
        { id: 'c2', name: 'Mert Rota', handle: '@mertrota', platform: 'YouTube', followers: 120000 },
        { id: 'c3', name: 'Deniz & Can', handle: '@ikimizyoldayiz', platform: 'TikTok', followers: 86000 },
      ],
      offers: [
        {
          id: 'o8', businessId: 'b5', title: 'Casa Di Datça — Konaklama + içerik iş birliği', category: 'otel', region: 'Datça',
          description: 'Taş mimarili, havuzlu butik otelimizi takipçilerine tanıtacak elçiler arıyoruz. Linkinle gelen misafir %5 indirim alır.',
          price: 7500, unit: 'gece', model: 'hybrid', stay: { nights: 2, guests: 2 },
          deliverables: ['1 dikey video (Reels/TikTok, min. 30 sn)', '3 Story (link sticker\'lı)', 'Google yorum'],
          minFollowers: 5000, active: true, createdAt: now - 1 * 3600000,
        },
        {
          id: 'o1', businessId: 'b1', title: 'Deniz Manzaralı Suit — 3 Gece', category: 'otel', region: 'Bodrum',
          description: 'Gümbet koyuna bakan butik otelimizde kahvaltı dahil deniz manzaralı suit. Sezon sonu kampanyamızı tanıtacak üreticiler arıyoruz.',
          price: 18500, model: 'hybrid', stay: { nights: 2, guests: 2 },
          deliverables: ['1 Reels (min. 30 sn)', '3 Story (link sticker\'lı)', 'Google yorum'],
          minFollowers: 10000, active: true, createdAt: now - 6 * day,
        },
        {
          id: 'o2', businessId: 'b2', title: 'Göcek 12 Ada Özel Tekne Turu', category: 'tekne', region: 'Göcek',
          description: '8 kişiye kadar özel gulet ile 12 Adalar turu. Öğle yemeği ve şnorkel ekipmanı dahil.',
          price: 24000, model: 'commission', stay: null,
          deliverables: ['Link\'i bio\'da 14 gün tutmak', '2 Story'],
          minFollowers: 5000, active: true, createdAt: now - 3 * day,
        },
        {
          id: 'o3', businessId: 'b3', title: 'Mağara Suit + Balon Turu Paketi', category: 'otel', region: 'Kapadokya',
          description: 'Gün doğumunda balon turu ve tarihi mağara odada 2 gece. Çift içerikleri için ideal.',
          price: 32000, model: 'stay', stay: { nights: 2, guests: 2 },
          deliverables: ['1 YouTube vlog veya 2 Reels', '5 Story', 'Ham fotoğraf kullanım hakkı'],
          minFollowers: 30000, active: true, createdAt: now - 1 * day,
        },
        {
          id: 'o4', businessId: 'b4', title: 'Kaş Dalış Deneyimi (Başlangıç)', category: 'aktivite', region: 'Kaş',
          description: 'PADI eğitmenleri eşliğinde 2 dalışlık tanışma paketi. Batık ve mağara dalış noktaları.',
          price: 3500, model: 'commission', stay: null,
          deliverables: ['1 TikTok / Reels', 'Link paylaşımı'],
          minFollowers: 3000, active: true, createdAt: now - 9 * day,
        },
        {
          id: 'o5', businessId: 'b4', title: 'Likya Yolu 3 Günlük Rehberli Yürüyüş', category: 'tur', region: 'Fethiye',
          description: 'Ölüdeniz – Kabak arası rehberli yürüyüş, pansiyon konaklama ve yemekler dahil.',
          price: 9800, model: 'hybrid', stay: { nights: 2, guests: 1 },
          deliverables: ['Blog yazısı veya YouTube videosu', '4 Story'],
          minFollowers: 8000, active: true, createdAt: now - 12 * day,
        },
        {
          id: 'o6', businessId: 'b1', title: 'Gün Batımı Tadım Menüsü', category: 'restoran', region: 'Bodrum',
          description: 'Otelimizin teras restoranında 7 tabaklık Ege tadım menüsü ve şarap eşleşmesi.',
          price: 2400, model: 'commission', stay: null,
          deliverables: ['1 Reels', '2 Story'],
          minFollowers: 5000, active: true, createdAt: now - 2 * day,
        },
        {
          id: 'o7', businessId: 'b2', title: 'Marmaris Gün Batımı Yelken Turu', category: 'tekne', region: 'Marmaris',
          description: 'Kaptanlı yelkenli ile 3 saatlik gün batımı turu; içecek ve meze ikramı dahil.',
          price: 4200, model: 'stay', stay: { nights: 1, guests: 2 },
          deliverables: ['1 Reels', '3 Story'],
          minFollowers: 15000, active: true, createdAt: now - 4 * day,
        },
      ],
      applications: [
        {
          id: 'a6', offerId: 'o8', creatorId: 'c1', status: 'approved', code: 'AYSE-DATCA',
          message: 'Ege rotası serimde Datça bölümünü Casa Di Datça\'da çekmek isterim.', clicks: 318, sales: 4, revenue: 85500,
          createdAt: now - 6 * day, decidedAt: now - 6 * day + 3600000,
        },
        {
          id: 'a7', offerId: 'o8', creatorId: 'c2', status: 'pending', code: null,
          message: 'Datça–Knidos vlog\'umda otelinizde konaklamak isterim. Ortalama izlenme 60B.', clicks: 0, sales: 0, revenue: 0,
          createdAt: now - 3 * 3600000,
        },
        {
          id: 'a8', offerId: 'o8', creatorId: 'c3', status: 'approved', code: 'DENIZCAN-DATCA',
          message: 'Çift olarak sakin koy tatili içerikleri üretiyoruz.', clicks: 190, sales: 2, revenue: 42750,
          createdAt: now - 9 * day, decidedAt: now - 8 * day,
        },
        {
          id: 'a1', offerId: 'o2', creatorId: 'c1', status: 'approved', code: 'AYSE-GCK12',
          message: 'Göcek koylarını Ege rotası serime eklemek isterim.', clicks: 412, sales: 5, revenue: 120000,
          createdAt: now - 2 * day, decidedAt: now - 2 * day + 3600000,
        },
        {
          id: 'a2', offerId: 'o4', creatorId: 'c1', status: 'pending', code: null,
          message: 'Dalış içeriklerim yüksek etkileşim alıyor.', clicks: 0, sales: 0, revenue: 0,
          createdAt: now - 1 * day,
        },
        {
          id: 'a3', offerId: 'o1', creatorId: 'c2', status: 'pending', code: null,
          message: 'Bodrum vlog\'umda otelinizi öne çıkarabilirim. Ortalama izlenme 60B.', clicks: 0, sales: 0, revenue: 0,
          createdAt: now - 5 * 3600000,
        },
        {
          id: 'a4', offerId: 'o1', creatorId: 'c3', status: 'approved', code: 'DENIZCAN-MAVI',
          message: 'Çift olarak balayı temalı içerik çekiyoruz.', clicks: 236, sales: 3, revenue: 55500,
          createdAt: now - 4 * day, decidedAt: now - 4 * day + 7200000,
        },
        {
          id: 'a5', offerId: 'o6', creatorId: 'c3', status: 'rejected', code: null,
          message: 'Yemek içerikleri de üretiyoruz.', clicks: 0, sales: 0, revenue: 0,
          createdAt: now - 3 * day, decidedAt: now - 2 * day,
        },
      ],
      // Misafir ön talepleri (hotel.html → extranet onayı → satış elçiye işlenir)
      requests: [
        {
          id: 'q1', businessId: 'b5', offerId: 'o8', code: 'AYSE-DATCA', roomId: 'cinque-terre', guestName: 'Elif K.', phone: '05xx xxx 12 34', guests: 2,
          checkIn: isoDay(now + 12 * day), checkOut: isoDay(now + 15 * day), nights: 3,
          list: 22500, discount: 1125, total: 21375, status: 'pending', createdAt: now - 2 * 3600000,
        },
      ],
    };
  }

  function isoDay(ts) { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* bozuk veri ya da erişim yok */ }
    const s = seed();
    save(s);
    return s;
  }
  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* yoksay */ }
  }

  let state = load();
  const uid = (p) => p + Math.random().toString(36).slice(2, 8);
  const pct = (amount, rate) => Math.round((amount * rate) / 100);

  function makeCode(creator, offer) {
    const name = creator.name.split(' ')[0].toLocaleUpperCase('tr-TR')
      .replace(/Ç/g, 'C').replace(/Ğ/g, 'G').replace(/İ/g, 'I').replace(/Ö/g, 'O').replace(/Ş/g, 'S').replace(/Ü/g, 'U')
      .replace(/[^A-Z]/g, '');
    return `${name}-${offer.id.toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  }

  const DB = {
    REGIONS, CATEGORIES, MODELS, PRICING, CURRENT, pct,

    reset() { state = seed(); save(state); },

    business(id) { return state.businesses.find((b) => b.id === id); },
    creator(id) { return state.creators.find((c) => c.id === id); },
    offer(id) { return state.offers.find((o) => o.id === id); },
    offers(filter = {}) {
      return state.offers
        .filter((o) => (filter.businessId ? o.businessId === filter.businessId : true))
        .filter((o) => (filter.activeOnly ? o.active : true))
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    createOffer(data) {
      const o = { id: uid('o'), active: true, createdAt: Date.now(), ...data };
      state.offers.push(o); save(state); return o;
    },
    toggleOffer(id) {
      const o = DB.offer(id); if (o) { o.active = !o.active; save(state); } return o;
    },

    applications(filter = {}) {
      return state.applications
        .filter((a) => (filter.creatorId ? a.creatorId === filter.creatorId : true))
        .filter((a) => (filter.offerId ? a.offerId === filter.offerId : true))
        .filter((a) => (filter.businessId ? DB.offer(a.offerId)?.businessId === filter.businessId : true))
        .filter((a) => (filter.status ? a.status === filter.status : true))
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    applicationFor(offerId, creatorId) {
      return state.applications.find((a) => a.offerId === offerId && a.creatorId === creatorId);
    },
    apply(offerId, creatorId, message) {
      if (DB.applicationFor(offerId, creatorId)) return null;
      const a = { id: uid('a'), offerId, creatorId, status: 'pending', code: null, message, clicks: 0, sales: 0, revenue: 0, createdAt: Date.now() };
      state.applications.push(a); save(state); return a;
    },
    decide(appId, approve) {
      const a = state.applications.find((x) => x.id === appId);
      if (!a || a.status !== 'pending') return a;
      a.status = approve ? 'approved' : 'rejected';
      a.decidedAt = Date.now();
      if (approve) a.code = makeCode(DB.creator(a.creatorId), DB.offer(a.offerId));
      save(state); return a;
    },
    // Eski kodlar (aliases) da geçerli kalır: elçi kodunu değiştirse bile paylaşılmış linkler kırılmaz.
    byCode(code) { return state.applications.find((a) => a.status === 'approved' && (a.code === code || (a.aliases || []).includes(code))); },
    trackClick(code) {
      const a = DB.byCode(code); if (a) { a.clicks++; save(state); } return a;
    },
    trackSale(code, amount) {
      const a = DB.byCode(code); if (a) { a.sales++; a.revenue += amount; save(state); } return a;
    },

    /* ---- Ön talepler ---- */
    requests(filter = {}) {
      return (state.requests || [])
        .filter((q) => (filter.businessId ? q.businessId === filter.businessId : true))
        .filter((q) => (filter.status ? q.status === filter.status : true))
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    createRequest(data) {
      state.requests = state.requests || [];
      const q = { id: uid('q'), status: 'pending', createdAt: Date.now(), ...data };
      state.requests.push(q); save(state); return q;
    },
    /** Otel ön talebi onaylarsa satış, varsa elçinin koduna işlenir. */
    decideRequest(id, approve) {
      const q = (state.requests || []).find((x) => x.id === id);
      if (!q || q.status !== 'pending') return q;
      q.status = approve ? 'approved' : 'rejected';
      q.decidedAt = Date.now();
      save(state);
      if (approve && q.code) DB.trackSale(q.code, q.total);
      return q;
    },
    /** Elçinin kodlarıyla gelen, otel onayı bekleyen ön talepler. */
    pendingRequestsFor(creatorId) {
      const codes = new Set(DB.applications({ creatorId, status: 'approved' }).flatMap((x) => [x.code, ...(x.aliases || [])]));
      return DB.requests({ status: 'pending' }).filter((q) => q.code && codes.has(q.code));
    },

    /** Elçi kendi ref kodunu belirler. Hata varsa { error } döner. */
    setCode(appId, raw) {
      const a = state.applications.find((x) => x.id === appId && x.status === 'approved');
      if (!a) return { error: 'Onaylı iş birliği bulunamadı.' };
      const code = String(raw || '').trim().toLocaleUpperCase('tr-TR')
        .replace(/Ç/g, 'C').replace(/Ğ/g, 'G').replace(/İ/g, 'I').replace(/Ö/g, 'O').replace(/Ş/g, 'S').replace(/Ü/g, 'U')
        .replace(/\s+/g, '-');
      if (!/^[A-Z0-9-]{4,20}$/.test(code)) return { error: 'Kod 4–20 karakter olmalı; harf, rakam ve tire kullanılabilir.' };
      if (code === a.code) return { code };
      if (state.applications.some((x) => x !== a && (x.code === code || (x.aliases || []).includes(code)))) return { error: 'Bu kod başka bir elçide kullanılıyor.' };
      a.aliases = [...new Set([...(a.aliases || []), a.code])].filter((c) => c !== code);
      a.code = code; save(state);
      return { code };
    },

    /* ---- Otel: takvim & fiyat ---- */
    toggleClosed(businessId, day) {
      const b = DB.business(businessId); if (!b) return false;
      b.closed = b.closed || [];
      const i = b.closed.indexOf(day);
      if (i >= 0) b.closed.splice(i, 1); else b.closed.push(day);
      save(state); return i < 0;
    },
    setRoomPrice(businessId, roomId, price) {
      const r = DB.business(businessId)?.rooms?.find((x) => x.id === roomId);
      if (!r || !(price > 0)) return null;
      r.price = Math.round(price); save(state); return r;
    },

    /** Misafir fiyatı: liste − %5 davet indirimi (yalnızca geçerli elçi koduyla). */
    guestPrice(list, hasRef) {
      const discount = hasRef ? pct(list, PRICING.GUEST) : 0;
      return { list, discount, total: list - discount };
    },

    /* ---- Gelir hesapları (tek kaynak) ---- */
    hasCommission(o) { return !!o && o.model !== 'stay'; },
    hasBarter(o) { return !!o && o.model !== 'commission'; },
    /** Bir başvurunun gelir dağılımı (ciro = misafirin ödediği): toplam %7, elçi %5, platform %2, barter hizmet bedeli. */
    split(app) {
      const o = DB.offer(app.offerId);
      const comm = DB.hasCommission(o) ? app.revenue : 0;
      const fee = app.status === 'approved' && DB.hasBarter(o) ? PRICING.BARTER_FEE : 0;
      return {
        pool: pct(comm, PRICING.TOTAL),
        creator: pct(comm, PRICING.CREATOR),
        platform: pct(comm, PRICING.PLATFORM),
        fee,
      };
    },
    commissionOf(app) { return DB.split(app).creator; },

    /** Elçi linki: misafiri otelin rezervasyon sayfasına (hotel.html) kodla götürür. */
    affiliateUrl(code) {
      return new URL(`hotel.html?ref=${encodeURIComponent(code)}`, location.href).href;
    },
  };

  window.DB = DB;
})();
