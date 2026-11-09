# Turizmlink — Butik Oteller İçin Tavsiye ve Paylaşım Ağı (MVP)

turizmlink.com · statik HTML/CSS/JS, kurulum gerektirmez.

## Sayfalar

| Sayfa | Rol | İçerik |
|---|---|---|
| `index.html` | Ana vitrin | Hero + 3 büyük yönlendirme butonu, OTA (%15–25) vs Turizmlink (%12) karşılaştırması, 3 adım |
| `extranet.html` | Otelci | Sol menü: Dashboard, Gelen Rezervasyon Talepleri (Onayla/Reddet), Takvim/Fiyat, Hakediş Raporu (%5 / %5 / %2 / %88) + elçi başvuruları; dashboard'da 10.000 ₺ örnekli net matematik kartı |
| `app.html` | Elçi / içerik üreticisi | Panel (3 adım, referans linki, yönlendirilen misafir, %5 nakit bakiye), Oteller, Başvurular, Medya Kiti (9:16 indirilebilir görseller), Cüzdan |
| `hotel.html?ref=KOD` | Misafir | "%5 Paylaşım İndiriminiz Hazır! 🎁" bandı, Liste / Paylaşım indirimi / Ödenecek net özeti, paylaşım onay kutusu, takvim, 2 saat onay penceresi, teşekkür mesajı |

## Çalıştırma

```bash
python3 -m http.server 5173
# http://localhost:5173
```

## Gelir modeli (`js/data.js` → `PRICING`)

Tüm oranlar **liste fiyatı** üzerinden; toplam feragat **%12**, otele **net %88**:
- **%5 Paylaşım indirimi** → misafire (oteli etiketleyerek paylaşma jestini onaylarsa; organik içerik/UGC).
- **%5 Tavsiye komisyonu** → linkle satışı getiren elçiye (link yoksa bu maliyet yok).
- **%2 Platform payı** → Turizmlink (rezervasyon + link takip altyapısı).

## Akış

1. Otel extranet'te teklif açar → elçi app'ten başvurur → otel onaylar, elçiye kişisel link (`hotel.html?ref=KOD`) verilir.
2. Misafir linkle gelir (tıklama kaydı, paylaşım jestiyle %5 indirim) → tarih seçer, onay penceresinde kart bilgisini girer (demo: saklanmaz) → talep otele düşer.
3. Otel 2 saat içinde Gelen Rezervasyon Talepleri'nden onaylar → satış elçinin koduna işlenir, bakiyede %5 görünür, hakediş raporu güncellenir.
4. Elçi kodunu Link Oluşturucu'dan değiştirebilir; eski kodlar geçerli kalır (paylaşılmış linkler kırılmaz).

## Dosyalar

- `css/styles.css` — ortak tasarım sistemi (lacivert #0F172A, zümrüt #10B981, beyaz/gri)
- `js/icons.js` — ortak ikon seti · `js/data.js` — demo veri (localStorage `turizmlink:v9`)
- `js/home.js` — vitrin · `js/app.js` — paneller · `js/hotel.js` — misafir sayfası · `js/mediakit.js` — medya kiti görselleri
- `assets/favicon.svg` — TL logosu

Demo verisini sıfırlamak: panel sayfasında konsola `Turizmlink.reset()`.
