/* Turizmlink — Supabase bağlantısı (tek merkez).
   Bu "publishable" anahtar tarayıcıda herkese açık olacak şekilde tasarlanmıştır;
   veriyi koruyan şey anahtarın gizliliği değil, veritabanındaki RLS kurallarıdır
   (bkz. supabase/kurulum.sql):
   - Misafir: rezervasyonlar tablosuna yalnızca EKLEME yapabilir, okuyamaz.
   - Otel paneli: kayıtları yalnızca panel şifresiyle çalışan fonksiyonla okur/günceller.
   - Elçi: yalnızca kendi kodunun sayısını ve kazancını görür (kişisel veri yok). */
(function () {
  const SUPABASE_URL = 'https://stjapjlqogxzjbngmgei.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_Liq7KE2LudwZskNgF81kwA_qwIZVXUs';

  const lib = window.supabase;
  const client = lib && lib.createClient ? lib.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } }) : null;

  const NO_CLIENT = { message: 'Veritabanı kütüphanesi yüklenemedi. İnternet bağlantınızı kontrol edin.' };
  const wrap = async (fn) => {
    if (!client) return { data: null, error: NO_CLIENT };
    try { return await fn(); } catch (e) { return { data: null, error: { message: e?.message || 'Bağlantı hatası' } }; }
  };

  /** Misafir rezervasyonu: yalnızca ekleme (geri okuma yok → misafir verisi sızmaz). */
  const rezervasyonEkle = (row) => wrap(() => client.from('rezervasyonlar').insert(row));

  /** Otel paneli: tüm rezervasyonlar (panel şifresi veritabanında kontrol edilir). */
  const otelRezervasyonlari = (sifre) => wrap(() => client.rpc('otel_rezervasyonlari', { sifre }));

  /** Otel paneli: durum güncelle (bekliyor / onaylandi / reddedildi). */
  const rezervasyonDurum = (sifre, id, durum) => wrap(() => client.rpc('rezervasyon_durum', { sifre, rez_id: String(id), yeni_durum: durum }));

  /** Elçi: kod(lar) için yalnızca sayı ve kazanç özeti. */
  const elciOzeti = (kodlar) => wrap(() => client.rpc('elci_ozeti', { kodlar }));

  window.TLSupa = { ready: !!client, rezervasyonEkle, otelRezervasyonlari, rezervasyonDurum, elciOzeti };
})();
