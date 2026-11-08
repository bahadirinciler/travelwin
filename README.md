# Turizmlink — Butik Oteller İçin Tavsiye ve Satış Ağı (MVP)

turizmlink.com · statik HTML/CSS/JS, kurulum gerektirmez.

## Sayfalar

| Sayfa | Rol | İçerik |
|---|---|---|
| `index.html` | Ana vitrin | Değer önerisi, hero komisyon simülatörü, gelir modeli, 4 adım |
| `extranet.html` | Otelci | Sol menü: Dashboard, Gelen Rezervasyon Talepleri (Onayla/Reddet), Takvim/Fiyat, Hakediş Raporu (%5 / %2 / %93) + elçi başvuruları |
| `app.html` | Elçi / içerik üreticisi | Panel (tıklanma, bekleyen rezervasyon, net %5 bakiye) + Link Oluşturucu, Oteller, Başvurular, Medya Kiti (9:16 indirilebilir görseller), Cüzdan |
| `hotel.html?ref=KOD` | Misafir | Tebrik bandı (%5 Misafir İndirimi), üstü çizili brüt / net fiyat, takvim, 2 saat onay politikası penceresi, "Elçi Olun" yönlendirmesi |

## Çalıştırma

```bash
python3 -m http.server 5173
# http://localhost:5173
```

## Gelir modeli (`js/data.js` → `PRICING`)

- Satış komisyonu: otel, misafirin ödediği tutar üzerinden **toplam %7** öder → **%5 elçiye (net)**, **%2 Turizmlink'e**.
- Misafir: elçi linkiyle gelirse liste fiyatından **%5 doğrudan indirim**.
- Barter: içerik karşılığı konaklama; eşleşme başına sabit hizmet bedeli (₺1.500, varsayım).

## Akış

1. Otel extranet'te teklif açar → elçi app'ten başvurur → otel onaylar, elçiye kişisel link (`hotel.html?ref=KOD`) verilir.
2. Misafir linkle gelir (%5 indirim, tıklama kaydı) → tarih seçer, onay penceresinde kart bilgisini girer (demo: saklanmaz) → talep otele düşer.
3. Otel 2 saat içinde Gelen Rezervasyon Talepleri'nden onaylar → satış elçinin koduna işlenir, bakiyede %5 görünür, hakediş raporu güncellenir.
4. Elçi kodunu Link Oluşturucu'dan değiştirebilir; eski kodlar geçerli kalır (paylaşılmış linkler kırılmaz).

## Dosyalar

- `css/styles.css` — ortak tasarım sistemi (lacivert #0F172A, zümrüt #10B981, beyaz/gri)
- `js/icons.js` — ortak ikon seti · `js/data.js` — demo veri (localStorage `turizmlink:v3`)
- `js/home.js` — vitrin · `js/app.js` — paneller · `js/hotel.js` — misafir sayfası · `js/mediakit.js` — medya kiti görselleri
- `assets/favicon.svg` — TL logosu

Demo verisini sıfırlamak: panel sayfasında konsola `Turizmlink.reset()`.
