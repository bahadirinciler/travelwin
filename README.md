# TravelWin — Turizm Affiliate MVP

Turizm işletmeleri (otel, tekne, tur, restoran, aktivite) ile içerik üreticilerini buluşturan affiliate platformunun tıklanabilir MVP'si. Bağımlılık yok: saf HTML + CSS + JavaScript.

## Çalıştırma
```bash
python3 -m http.server 5173
# http://localhost:5173
```

## Gelir modeli
- **Komisyon:** İşletme her satışta **%15 komisyon havuzu** açar → **%12 içerik üreticisine**, **%3 Travelwin'e**.
- **Barter (ücretsiz konaklama):** İşletme, onaylanan her eşleşme için **sabit hizmet bedeli** öder (varsayılan ₺1.500).
- **Hibrit:** Ücretsiz konaklama + satışlardan komisyon.

Oranlar ve hizmet bedeli tek yerde tanımlı: `js/data.js` → `PRICING`.

## Akış
1. **İşletme** teklif açar → bölge, kategori, fiyat, kazanç modeli (Sadece Komisyon / Ücretsiz Konaklama (Barter) / Hibrit), beklenen içerikler.
2. **Üretici** bölgesine göre teklifleri filtreler, detayına bakar, notla başvurur (min. takipçi kontrolü).
3. İşletme başvuruyu **onaylar** → üreticiye özel kod ve affiliate link (`#/r/KOD`) oluşur.
4. Link açıldığında **tıklama**, rezervasyon tamamlanınca **satış + ciro** kaydedilir; havuz, üretici payı ve hizmet bedeli panellerde hesaplanır. Ana sayfadaki **kazanç simülatörü** aynı kurallarla tahmini kazancı gösterir.

Sağ üstteki **Üretici / İşletme** anahtarıyla roller arasında geçiş yapılır.

## Yapı
- `index.html` — kabuk (üst bar, mobil alt menü, modal, toast)
- `css/styles.css` — tasarım sistemi, mobil uyumlu düzen
- `js/data.js` — demo veri + mock API (`localStorage`), backend'e geçişte değişecek tek katman
- `js/app.js` — hash router ve görünümler

Demo verisini sıfırlamak için tarayıcı konsolunda: `TravelWin.reset()`

## Sonraki adımlar
- Gerçek backend + kimlik doğrulama (işletme / üretici hesapları)
- Sunucu taraflı tıklama takibi, cookie penceresi, kanal entegrasyonları (booking engine)
- Komisyon ödemeleri ve fatura, konaklama rezervasyon takvimi
- Üretici profili / sosyal medya istatistik doğrulaması
