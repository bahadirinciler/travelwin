/* TravelWin — demo veri katmanı (localStorage). Backend gelene kadar mock "API". */
(function () {
  // v2: gelir modeli revizyonu (sabit %15 havuz) — eski demo verisi yerine yeni seed yüklenir.
  const KEY = 'travelwin:v2';

  /* ---- Gelir modeli ----
     Komisyon: işletme satış başına %15 havuz açar → %12 içerik üreticisine, %3 Travelwin'e.
     Barter (konaklama karşılığı): işletme eşleşme başına sabit hizmet bedeli öder.
     Hibrit: ikisi birden. */
  const PRICING = { POOL: 15, CREATOR: 12, PLATFORM: 3, BARTER_FEE: 1500 };

  const REGIONS = ['Bodrum', 'Fethiye', 'Kaş', 'Antalya', 'Kapadokya', 'Marmaris', 'Alaçatı', 'Göcek'];
  const CATEGORIES = {
    otel: { label: 'Otel', icon: 'building' },
    tekne: { label: 'Tekne', icon: 'boat' },
    tur: { label: 'Tur', icon: 'compass' },
    restoran: { label: 'Restoran', icon: 'utensils' },
    aktivite: { label: 'Aktivite', icon: 'waves' },
  };
  const MODELS = {
    commission: { label: 'Komisyon', filter: 'Sadece Komisyon', icon: 'percent', desc: `Her satıştan %${PRICING.POOL} havuz: %${PRICING.CREATOR} üreticiye, %${PRICING.PLATFORM} Travelwin'e.` },
    stay: { label: 'Barter', filter: 'Ücretsiz Konaklama (Barter)', icon: 'bed', desc: 'İçerik karşılığı ücretsiz konaklama; eşleşme başına sabit hizmet bedeli.' },
    hybrid: { label: 'Hibrit', filter: 'Hibrit', icon: 'sparkles', desc: `Ücretsiz konaklama + satışlardan %${PRICING.CREATOR} üretici komisyonu.` },
  };

  const CURRENT = { business: 'b1', creator: 'c1' };

  function seed() {
    const now = Date.now();
    const day = 86400000;
    return {
      businesses: [
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
    };
  }

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
    byCode(code) { return state.applications.find((a) => a.code === code && a.status === 'approved'); },
    trackClick(code) {
      const a = DB.byCode(code); if (a) { a.clicks++; save(state); } return a;
    },
    trackSale(code, amount) {
      const a = DB.byCode(code); if (a) { a.sales++; a.revenue += amount; save(state); } return a;
    },

    /* ---- Gelir hesapları (tek kaynak) ---- */
    hasCommission(o) { return !!o && o.model !== 'stay'; },
    hasBarter(o) { return !!o && o.model !== 'commission'; },
    /** Bir başvurunun gelir dağılımı: havuz (%15), üretici (%12), platform (%3), barter hizmet bedeli. */
    split(app) {
      const o = DB.offer(app.offerId);
      const comm = DB.hasCommission(o) ? app.revenue : 0;
      const fee = app.status === 'approved' && DB.hasBarter(o) ? PRICING.BARTER_FEE : 0;
      return {
        pool: pct(comm, PRICING.POOL),
        creator: pct(comm, PRICING.CREATOR),
        platform: pct(comm, PRICING.PLATFORM),
        fee,
      };
    },
    commissionOf(app) { return DB.split(app).creator; },

    affiliateUrl(code) {
      return `${location.origin}${location.pathname}#/r/${code}`;
    },
  };

  window.DB = DB;
})();
