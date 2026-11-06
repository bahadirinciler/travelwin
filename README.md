# TravelWin — Turizm Affiliate MVP

Turizm işletmeleri (otel, tekne, tur, restoran, aktivite) ile içerik üreticilerini buluşturan affiliate platformunun tıklanabilir MVP'si. Bağımlılık yok: saf HTML + CSS + JavaScript.

## Çalıştırma
```bash
python3 -m http.server 5173
# http://localhost:5173
```

## Akış
1. **İşletme** teklif açar → bölge, kategori, fiyat, kazanç modeli (Komisyon / Konaklama karşılığı / Hibrit), beklenen içerikler.
2. **Üretici** bölgesine göre teklifleri filtreler, detayına bakar, notla başvurur (min. takipçi kontrolü).
3. İşletme başvuruyu **onaylar** → üreticiye özel kod ve affiliate link (`#/r/KOD`) oluşur.
4. Link açıldığında **tıklama**, rezervasyon tamamlanınca **satış + ciro** kaydedilir; komisyon panellerde hesaplanır.

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
