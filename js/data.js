/* Turizmlink — demo veri katmanı (localStorage). Backend gelene kadar mock "API". */
(function () {
  // v9: Tavsiye & paylaşım modeli (%12 toplam feragat) — barter/hibrit kaldırıldı, yeni seed yüklenir.
  const KEY = 'turizmlink:v9';

  /* ---- Gelir modeli: Tavsiye ve Organik İçerik (UGC) Motoru ----
     Tüm oranlar odanın LİSTE fiyatı üzerinden (10.000 ₺ → 500 + 500 + 200):
     %5 Paylaşım indirimi → misafire (karşılığında oteli etiketleyerek paylaşım = organik içerik)
     %5 Tavsiye komisyonu → linkle satışı getiren elçiye (link yoksa bu maliyet yok)
     %2 Platform payı     → Turizmlink (rezervasyon + link takip altyapısı)
     Otele net %88. */
  const PRICING = { GUEST: 5, CREATOR: 5, PLATFORM: 2, TOTAL: 12, NET: 88 };

  const REGIONS = ['Datça', 'Bodrum', 'Fethiye', 'Kaş', 'Antalya', 'Kapadokya', 'Marmaris', 'Alaçatı', 'Göcek'];
  const CATEGORIES = {
    otel: { label: 'Otel', icon: 'building' },
    tekne: { label: 'Tekne', icon: 'boat' },
    tur: { label: 'Tur', icon: 'compass' },
    restoran: { label: 'Restoran', icon: 'utensils' },
    aktivite: { label: 'Aktivite', icon: 'waves' },
  };
  const MODELS = {
    commission: { label: 'Tavsiye', filter: 'Tavsiye komisyonu', icon: 'percent', desc: `Linkle gelen her rezervasyondan liste fiyatının %${PRICING.CREATOR}'i elçiye.` },
  };

  const CURRENT = { business: 'b5', creator: 'c1' };

  function seed() {
    const now = Date.now();
    const day = 86400000;
    const SY = seasonYear(new Date(now)); // örnek tarihler için gelecek açık sezonun yılı
    return {
      businesses: [
        {
          id: 'b5', name: 'Casa Di Datça', region: 'Datça',
          // Bilgiler: casadidatca.com + otel sahibi (deniz mesafesi)
          tagline: 'Eski Datça\'nın karşısında, 10 dönümlük vadide taş mimarili butik otel.',
          about: 'Sadece 12 özel oda: her biri farklı dekore edilmiş, yüksek tavanlı ve aydınlık. Oda & kahvaltı konseptinde kahvaltı her sabah özenle hazırlanır; otelin Mamma Mia restoran & pizzeriası yeni sezonda açılıyor. Selvili bahçeler, taş yollar, geniş verandalar ve havuz başında sakin bir tatil.',
          features: ['Kahvaltı dahil', 'Açık havuz', 'Denize 3 km · 7–8 dk', 'Eski Datça\'ya birkaç dakika', 'Mamma Mia restoran & pizzeria (yeni sezon)', 'Evcil hayvan kabul edilir'],
          info: [
            ['Sezon', 'Nisan – Ekim sonu'], ['Konsept', 'Oda & kahvaltı'], ['Restoran', 'Mamma Mia · yeni sezonda açılıyor'],
            ['Deniz', '3 km · araçla 7–8 dakika'], ['Koylar', 'Birçok koy ve plaj araçla 10–15 dakika'],
            ['Çocuk', '7 yaş ve üzeri yetişkin sayılır'], ['Evcil hayvan', 'Kabul edilir'],
          ],
          address: 'Datça Mah. Küme 1 Evleri No: 6, Datça / Muğla',
          phone: '0544 633 34 35',
          // Fotoğraflar: assets/casadidatca (kaynak: GORSELLER/CASADIDATCA, tools/casadidatca-gorseller.sh ile rötuşlu)
          cover: 'assets/casadidatca/hero.jpg',
          gallery: [
            ['havuz-aksam', 'Akşam havuz başı'], ['tas-villa', 'Taş villa'], ['restoran-teras', 'Mamma Mia terası'],
            ['kahvalti', 'Kahvaltı'], ['drone-gunbatimi', 'Gün batımında otel'], ['salon-manzara', 'Manzaralı salon'],
            ['somine-kutuphane', 'Şömineli kütüphane'], ['tas-kemer', 'Taş kemerler'], ['bahce-yolu', 'Bahçe yolu'], ['havuz-gece', 'Gece havuz'], ['capri-veranda', 'Capri bahçe evi verandası'],
          ].map(([f, t]) => ({ src: 'assets/casadidatca/gallery/' + f + '.jpg', thumb: 'assets/casadidatca/thumbs/' + f + '.jpg', title: t })),
          media: [
            ['villa-aksam', 'Taş villa, akşam', 'Story'], ['havuz', 'Havuz başı', 'Reels kapağı'], ['restoran', 'Mamma Mia terası', 'Story'],
            ['kahvalti', 'Kahvaltı sofrası', 'Reels kapağı'], ['yesil-kapi', 'Yeşil kapı', 'Story'], ['tas-kemer', 'Taş kemerler', 'Story'],
            ['drone', 'Gün batımında Datça', 'Reels kapağı'], ['oda', 'Cinque Terre odası', 'Story'], ['capri-bahce', 'Capri bahçe evi', 'Story'],
          ].map(([f, t, fmt]) => ({ id: f, src: 'assets/casadidatca/story/' + f + '.jpg', thumb: 'assets/casadidatca/story/thumbs/' + f + '.jpg', title: t, format: fmt })),
          // Sezonluk fiyat kuralları (otel sahibi, 2026-11): Temmuz 1. kategori 2 kişi 9.000 ₺, her kategori +%10;
          // Haziran = Temmuz −%20, Mayıs = Haziran −%10, Nisan = Mayıs −%10, Ağustos = Temmuz +%10,
          // 1–15 Eylül = Temmuz, 16 Eylül–30 Ekim = Mayıs; 2 kişi dışındaki her 7+ yaş kişi +2.000 ₺, tek kişi −1.000 ₺; yukarı 100 ₺'ye yuvarla.
          pricing: { base: 9000, step: 0.10, jun: 0.20, may: 0.10, apr: 0.10, aug: 0.10, extra: 2000, single: 1000, roundTo: 100, cats: 4 },
          rooms: [
            { id: 'lerici', name: 'Lerici', desc: 'Çift kişilik · terasa açılır', guests: 2, cat: 1, img: 'assets/casadidatca/rooms/lerici.jpg' },
            { id: 'orvieto', name: 'Orvieto', desc: 'Çift kişilik', guests: 2, cat: 1, img: 'assets/casadidatca/rooms/orvieto.jpg' },
            { id: 'arezzo', name: 'Arezzo', desc: 'Çift + tek kişilik yatak', guests: 3, cat: 1, img: 'assets/casadidatca/rooms/arezzo.jpg' },
            { id: 'lucca', name: 'Lucca', desc: 'Tek kişilik yataklar + oturma köşesi', guests: 3, cat: 2, img: 'assets/casadidatca/rooms/lucca.jpg' },
            { id: 'portofino', name: 'Portofino', desc: 'Çift kişilik · manzaralı pencere kenarı', guests: 2, cat: 2, img: 'assets/casadidatca/rooms/portofino.jpg' },
            { id: 'cinque-terre', name: 'Cinque Terre', desc: 'Çift kişilik · manzaralı pencere kenarı', guests: 2, cat: 3, img: 'assets/casadidatca/rooms/cinque-terre.jpg' },
            { id: 'garda', name: 'Garda', desc: 'Geniş oda · bahçeye açılan kapı', guests: 3, cat: 3, img: 'assets/casadidatca/rooms/garda.jpg' },
            { id: 'iseo', name: 'Iseo-Como-Maggiore', desc: 'Geniş oda · bahçeye açılan kapı', guests: 3, cat: 3, img: 'assets/casadidatca/rooms/iseo.jpg' },
            { id: 'capri', name: 'Capri', desc: 'Bahçe evi · veranda ve mutfak', guests: 4, cat: 4, img: 'assets/casadidatca/rooms/capri.jpg' },
            { id: 'elba', name: 'Elba', desc: 'Aile dairesi · mutfak ve oturma alanı', guests: 5, cat: 4, img: 'assets/casadidatca/rooms/elba.jpg' },
          ],
          // Otelin kapattığı günler (extranet'te yönetilecek) — örnek: gelecek sezondan birkaç gün
          closed: ['06-05', '06-06', '07-18', '07-19', '08-14', '08-15'].map((md) => `${SY}-${md}`),
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
          id: 'o8', businessId: 'b5', title: 'Casa Di Datça — Elçi tavsiye programı', category: 'otel', region: 'Datça',
          description: 'Taş mimarili, havuzlu butik otelimizi sevdiklerine önerecek elçiler arıyoruz. Linkinle gelen misafir %5 indirimle kalır, sen her rezervasyondan %5 nakit kazanırsın.',
          price: 9000, unit: 'gece', model: 'commission', stay: null,
          deliverables: ['1 dikey video (Reels/TikTok, min. 30 sn)', '3 Story (link sticker\'lı)', 'Google yorum'],
          minFollowers: 5000, active: true, createdAt: now - 1 * 3600000,
        },
        {
          id: 'o1', businessId: 'b1', title: 'Deniz Manzaralı Suit — 3 Gece', category: 'otel', region: 'Bodrum',
          description: 'Gümbet koyuna bakan butik otelimizde kahvaltı dahil deniz manzaralı suit. Sezon sonu kampanyamızı tanıtacak üreticiler arıyoruz.',
          price: 18500, model: 'commission', stay: null,
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
          price: 32000, model: 'commission', stay: null,
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
          price: 9800, model: 'commission', stay: null,
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
          price: 4200, model: 'commission', stay: null,
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
          checkIn: `${SY}-07-10`, checkOut: `${SY}-07-13`, nights: 3,
          list: 32700, discount: 1635, total: 31065, status: 'pending', createdAt: now - 2 * 3600000,
        },
      ],
    };
  }

  /* ---------- Sezon & fiyat motoru (hotel.html, extranet ve Excel aynı kuralları kullanır) ---------- */
  const SEASONS = [
    { key: 'apr', label: 'Nisan', range: '1–30 Nisan' }, { key: 'may', label: 'Mayıs', range: '1–31 Mayıs' },
    { key: 'jun', label: 'Haziran', range: '1–30 Haziran' }, { key: 'jul', label: 'Temmuz', range: '1–31 Temmuz' },
    { key: 'aug', label: 'Ağustos', range: '1–31 Ağustos' }, { key: 'sep1', label: 'Eylül (1. yarı)', range: '1–15 Eylül' },
    { key: 'sep2', label: 'Eylül–Ekim', range: '16 Eylül – 30 Ekim' },
  ];
  /** ISO gün → sezon anahtarı; sezon dışıysa null (otel 1 Nisan – 30 Ekim açık). */
  function seasonOf(iso) {
    const m = +iso.slice(5, 7), d = +iso.slice(8, 10);
    return ({ 4: 'apr', 5: 'may', 6: 'jun', 7: 'jul', 8: 'aug' })[m]
      || (m === 9 ? (d <= 15 ? 'sep1' : 'sep2') : m === 10 && d <= 30 ? 'sep2' : null);
  }
  /** Bugünden sonraki ilk açık sezonun yılı. */
  function seasonYear(date) {
    const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    return m > 10 || (m === 10 && d > 30) ? y + 1 : y;
  }
  /** Kategori × sezon → 2 kişilik gecelik fiyat tablosu ({1: {apr, may, ...}, 2: ...}). */
  function seasonTable(p) {
    const up = (x) => Math.ceil(Math.round(x * 100) / 100 / p.roundTo) * p.roundTo;
    const out = {};
    for (let c = 1; c <= (p.cats || 4); c++) {
      const jul = p.base * Math.pow(1 + p.step, c - 1);
      const jun = jul * (1 - p.jun), may = jun * (1 - p.may), apr = may * (1 - p.apr), aug = jul * (1 + p.aug);
      out[c] = { apr: up(apr), may: up(may), jun: up(jun), jul: up(jul), aug: up(aug), sep1: up(jul), sep2: up(may) };
    }
    return out;
  }
  /** Bir gecenin fiyatı (persons = 7 yaş ve üzeri kişi sayısı); sezon dışıysa null. */
  function nightPriceOf(biz, room, iso, persons = 2) {
    if (!biz?.pricing) return room.price; // sezon kuralı olmayan işletme: sabit fiyat
    const key = seasonOf(iso);
    if (!key) return null;
    const base = seasonTable(biz.pricing)[room.cat || 1][key];
    if (persons <= 1) return base - biz.pricing.single;
    return base + Math.max(0, persons - 2) * biz.pricing.extra;
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
      if (approve && q.code) DB.trackSale(q.code, q.list); // ciro = liste fiyatı (brüt)
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
    /* ---- Sezonluk fiyat ---- */
    SEASONS, seasonOf, seasonTable,
    nightPrice: nightPriceOf,
    /** Konaklama teklifi: gece gece fiyat (sezon geçişleri dahil). Sezon dışı gece varsa { error }. */
    stayQuote(biz, room, checkIn, checkOut, persons = 2) {
      const nights = [];
      for (let d = new Date(`${checkIn}T00:00:00`); isoDay(d) < checkOut; d.setDate(d.getDate() + 1)) {
        const iso = isoDay(d);
        const price = nightPriceOf(biz, room, iso, persons);
        if (price == null) return { error: 'season', date: iso };
        nights.push({ date: iso, season: biz.pricing ? seasonOf(iso) : null, price });
      }
      return { nights, list: nights.reduce((n, x) => n + x.price, 0) };
    },
    /** Odanın en düşük 2 kişilik gecelik fiyatı ("…'den başlayan"). */
    fromPrice(biz, room) {
      if (!biz?.pricing) return room.price;
      return Math.min(...Object.values(seasonTable(biz.pricing)[room.cat || 1]));
    },
    setPricing(businessId, p) {
      const b = DB.business(businessId); if (!b) return null;
      b.pricing = { ...b.pricing, ...p }; save(state); return b.pricing;
    },
    setRoomCat(businessId, roomId, cat) {
      const r = DB.business(businessId)?.rooms?.find((x) => x.id === roomId);
      if (!r) return null;
      r.cat = Math.min(4, Math.max(1, +cat || 1)); save(state); return r;
    },

    /** Misafir fiyatı: liste − %5 paylaşım indirimi (misafir paylaşım jestini onayladıysa). */
    guestPrice(list, share) {
      const discount = share ? pct(list, PRICING.GUEST) : 0;
      return { list, discount, total: list - discount };
    },

    /* ---- Gelir hesapları (tek kaynak) — hepsi liste fiyatı üzerinden ---- */
    /** Bir elçinin getirdiği ciro (liste fiyatı) için dağılım: %5 misafir, %5 elçi, %2 platform, %88 otel. */
    split(app) {
      const list = app.revenue || 0;
      const guest = pct(list, PRICING.GUEST), creator = pct(list, PRICING.CREATOR), platform = pct(list, PRICING.PLATFORM);
      return { list, guest, creator, platform, net: list - guest - creator - platform };
    },
    commissionOf(app) { return DB.split(app).creator; },
    /** Tek rezervasyonun dağılımı: elçi payı yalnızca ref koduyla gelen satışta; misafir indirimi paylaşım jestiyle. */
    requestSplit(q) {
      const creator = q.code ? pct(q.list, PRICING.CREATOR) : 0;
      const platform = pct(q.list, PRICING.PLATFORM);
      return { list: q.list, discount: q.discount || 0, paid: q.total, creator, platform, net: q.total - creator - platform };
    },

    /** Elçi linki: misafiri otelin rezervasyon sayfasına (hotel.html) kodla götürür. */
    affiliateUrl(code) {
      return new URL(`hotel.html?ref=${encodeURIComponent(code)}`, location.href).href;
    },
  };

  window.DB = DB;
})();
