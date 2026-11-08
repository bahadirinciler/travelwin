# Turizmlink — Butik Oteller İçin Tavsiye ve Satış Ağı (MVP)

turizmlink.com · statik HTML/CSS/JS, kurulum gerektirmez.

## Sayfalar

| Sayfa | Rol | İçerik |
|---|---|---|
| `index.html` | Ana vitrin | Değer önerisi, hero komisyon simülatörü, gelir modeli, 4 adım |
| `extranet.html` | Otelci | Panel (ciro, komisyon), ön talep onayları, elçi başvuruları, teklifler |
| `app.html` | Elçi / içerik üreticisi | Teklifler, kişisel linkler, cüzdan (%5) |
| `hotel.html?ref=KOD` | Misafir | %5 davet indirimi bandı, otel vitrini (Casa Di Datça), ön talep takvimi |

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
2. Misafir linkle gelir (%5 indirim, tıklama kaydı) → tarih seçip ön talep bırakır.
3. Otel extranet → Ön talepler'de onaylar → satış elçinin koduna işlenir, cüzdanda %5 görünür.

## Dosyalar

- `css/styles.css` — ortak tasarım sistemi (lacivert / beyaz / altın / zümrüt)
- `js/icons.js` — ortak ikon seti · `js/data.js` — demo veri (localStorage `turizmlink:v3`)
- `js/home.js` — vitrin · `js/app.js` — paneller · `js/hotel.js` — misafir sayfası

Demo verisini sıfırlamak: panel sayfasında konsola `Turizmlink.reset()`.
