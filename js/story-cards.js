/* Turizmlink — misafirin kişisel elçi kodu ve 9:16 hikâye kartları (HTML5 Canvas).
   Rezervasyon kaydına dokunmaz; yalnızca onay ekranında görsel üretir. */
(function () {
  const W = 1080, H = 1920;
  const C = { ink: '#1E2D2F', terra: '#D96B43', linen: '#FAF8F5', peach: '#F7B48F' };
  const SERIF = '"Playfair Display", Georgia, serif';
  const SANS = '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif';

  /* ---------- Kişisel elçi kodu: ad soyad → "ahmetyilmaz-k4p" ----------
     Sonek e-postadan türetilir: aynı misafir hep aynı kodu alır, adaşlar karışmaz. */
  const TRMAP = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u' };
  const slug = (s) => String(s || '').toLocaleLowerCase('tr-TR').replace(/[çğıöşü]/g, (c) => TRMAP[c])
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  function hash36(s) {
    let h = 2166136261;
    for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36).slice(-3).padStart(3, '0');
  }
  function codeFor(name, email) {
    const base = (slug(name) || slug(String(email || '').split('@')[0]) || 'elci').slice(0, 15);
    return `${base}-${hash36(String(email || name).trim().toLowerCase())}`;
  }

  /* ---------- Yardımcılar ---------- */
  const imgCache = new Map();
  function loadImg(src) {
    if (!imgCache.has(src)) imgCache.set(src, new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src;
    }));
    return imgCache.get(src);
  }
  let fontsReady;
  function loadFonts() {
    if (!fontsReady) {
      const sample = 'Bekle bizi İŞĞÜÇÖ ışğüçö %5 —';
      const list = [`700 100px ${SERIF}`, `600 100px ${SERIF}`, `italic 500 100px ${SERIF}`, `600 40px ${SANS}`, `700 40px ${SANS}`, `800 40px ${SANS}`];
      const all = Promise.all(list.map((f) => (document.fonts ? document.fonts.load(f, sample) : Promise.resolve()).catch(() => {})));
      fontsReady = Promise.race([all, new Promise((r) => setTimeout(r, 3500))]);
    }
    return fontsReady;
  }
  function coverImg(ctx, img, x, y, w, h) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const s = Math.max(w / iw, h / ih), sw = w / s, sh = h / s;
    ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  const setFont = (ctx, spec, size, fam) => { ctx.font = `${spec} ${size}px ${fam}`; };
  const track = (ctx, px) => { if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`; };
  function wrap(ctx, text, maxW) {
    const lines = []; let cur = '';
    for (const w of String(text).split(/\s+/)) {
      const t = cur ? `${cur} ${w}` : w;
      if (cur && ctx.measureText(t).width > maxW) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  // Metni en fazla maxLines satıra sığacak en büyük punto ile böler.
  function fit(ctx, text, spec, fam, size, min, maxW, maxLines) {
    for (let s = size; s >= min; s -= 4) {
      setFont(ctx, spec, s, fam);
      const lines = wrap(ctx, text, maxW);
      if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxW)) return { size: s, lines };
    }
    setFont(ctx, spec, min, fam);
    return { size: min, lines: wrap(ctx, text, maxW) };
  }
  function shade(ctx, y0, y1, a0, a1) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, `rgba(16,26,28,${a0})`); g.addColorStop(1, `rgba(16,26,28,${a1})`);
    ctx.fillStyle = g; ctx.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0));
  }
  function photoOr(ctx, img, x, y, w, h) {
    if (img) coverImg(ctx, img, x, y, w, h);
    else { ctx.fillStyle = C.ink; ctx.fillRect(x, y, w, h); }
  }

  /* ---------- Şablonlar ---------- */
  // 1) Klasik: tam ekran fotoğraf, "Bekle bizi [Otel]!", konum, %5 rozeti, link kartı
  function drawKlasik(ctx, d, img) {
    photoOr(ctx, img, 0, 0, W, H);
    shade(ctx, 0, 380, 0.55, 0);
    shade(ctx, H * 0.38, H, 0, 0.94);
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    setFont(ctx, '600', 50, SERIF); track(ctx, 0); ctx.fillStyle = '#fff'; ctx.fillText('Turizmlink', 80, 140);

    // Alttan yukarı yerleşim
    const cardH = 160, cardY = H - 110 - cardH;
    rrect(ctx, 80, cardY, 920, cardH, 30); ctx.fillStyle = C.linen; ctx.fill();
    setFont(ctx, '800', 24, SANS); track(ctx, 5); ctx.fillStyle = C.terra; ctx.fillText('DAVET LİNKİM', 124, cardY + 58);
    track(ctx, 0); const l = fit(ctx, d.linkText, '700', SANS, 40, 24, 830, 1);
    ctx.fillStyle = C.ink; ctx.fillText(l.lines[0], 124, cardY + 116);

    setFont(ctx, '700', 34, SANS);
    const pill = '%5 Ayrıcalıklı Davet Kodu Aktif';
    const pw = ctx.measureText(pill).width + 84, ph = 80, py = cardY - 44 - ph;
    rrect(ctx, 80, py, pw, ph, 40); ctx.fillStyle = C.terra; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(pill, 122, py + 52);

    setFont(ctx, '700', 30, SANS); track(ctx, 6); ctx.fillStyle = 'rgba(255,255,255,.86)';
    const locY = py - 56; ctx.fillText(d.location.toLocaleUpperCase('tr-TR'), 82, locY);
    track(ctx, 0);

    const t = fit(ctx, `${d.name}!`, '700', SERIF, 132, 76, 920, 2);
    const lh = t.size * 1.06;
    let y = locY - 64 - lh * (t.lines.length - 1);
    ctx.fillStyle = '#fff';
    t.lines.forEach((ln, i) => ctx.fillText(ln, 76, y + i * lh));
    setFont(ctx, 'italic 500', 92, SERIF); ctx.fillStyle = C.peach; ctx.fillText('Bekle bizi', 80, y - t.size * 0.98);
  }

  // 2) Rota: keten zemin, çerçeveli fotoğraf, "[Bölge] Kaçamağı Başlıyor", davet kutusu
  function drawRota(ctx, d, img) {
    ctx.fillStyle = C.linen; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic';
    setFont(ctx, '600', 46, SERIF); track(ctx, 0); ctx.fillStyle = C.ink; ctx.textAlign = 'left'; ctx.fillText('Turizmlink', 80, 128);
    setFont(ctx, '800', 24, SANS); track(ctx, 6); ctx.fillStyle = C.terra; ctx.textAlign = 'right';
    ctx.fillText(`ROTA · ${d.region.toLocaleUpperCase('tr-TR')}`, 1000, 124); ctx.textAlign = 'left'; track(ctx, 0);

    const px = 80, py = 172, pw = 920, ph = 1010;
    ctx.save(); rrect(ctx, px, py, pw, ph, 44); ctx.clip(); photoOr(ctx, img, px, py, pw, ph);
    const g = ctx.createLinearGradient(0, py + ph - 260, 0, py + ph); g.addColorStop(0, 'rgba(16,26,28,0)'); g.addColorStop(1, 'rgba(16,26,28,.55)');
    ctx.fillStyle = g; ctx.fillRect(px, py + ph - 260, pw, 260); ctx.restore();
    setFont(ctx, '700', 32, SANS);
    const chip = d.name, cw = Math.min(ctx.measureText(chip).width + 64, 840);
    rrect(ctx, px + 36, py + ph - 36 - 76, cw, 76, 38); ctx.fillStyle = C.linen; ctx.fill();
    ctx.fillStyle = C.ink; ctx.fillText(chip, px + 68, py + ph - 36 - 26, 776);

    // Başlık
    const t = fit(ctx, `${d.region} Kaçamağı`, '700', SERIF, 120, 70, 920, 1);
    let y = py + ph + 40 + t.size;
    ctx.fillStyle = C.ink; ctx.fillText(t.lines[0], 78, y);
    setFont(ctx, 'italic 500', t.size, SERIF); ctx.fillStyle = C.terra; ctx.fillText('Başlıyor.', 80, y + t.size * 1.08);

    // Davet kutusu (alta yaslı)
    setFont(ctx, '700', 37, SANS);
    const msg = wrap(ctx, 'Benim davet linkimle %5 indirimli yerini ayırt', 840);
    const lk = fit(ctx, d.linkText, '700', SANS, 36, 22, 830, 1);
    const boxH = 70 + msg.length * 54 + 30 + lk.size + 56, boxY = H - 96 - boxH;
    rrect(ctx, 80, boxY, 920, boxH, 34); ctx.fillStyle = C.ink; ctx.fill();
    setFont(ctx, '700', 37, SANS); ctx.fillStyle = '#fff';
    msg.forEach((m, i) => ctx.fillText(m, 124, boxY + 92 + i * 54));
    setFont(ctx, '700', lk.size, SANS); ctx.fillStyle = C.peach;
    ctx.fillText(lk.lines[0], 124, boxY + 92 + (msg.length - 1) * 54 + 30 + lk.size + 14);
  }

  // 3) Minimal: yalnız atmosfer fotoğrafı + zarif serif imza
  function drawMinimal(ctx, d, img) {
    photoOr(ctx, img, 0, 0, W, H);
    shade(ctx, H * 0.45, H, 0, 0.82);
    shade(ctx, 0, 300, 0.25, 0);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const t = fit(ctx, d.name, 'italic 500', SERIF, 128, 72, 900, 2);
    const lh = t.size * 1.08;
    const sigY = H - 330;
    const top = sigY - 70 - lh * (t.lines.length - 1);
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2 - 60, top - t.size - 40); ctx.lineTo(W / 2 + 60, top - t.size - 40); ctx.stroke();
    ctx.fillStyle = '#fff';
    t.lines.forEach((ln, i) => ctx.fillText(ln, W / 2, top + i * lh));
    setFont(ctx, '500', 44, SERIF); track(ctx, 2); ctx.fillStyle = C.peach;
    ctx.fillText('— Turizmlink Özel Seçkisi', W / 2, sigY);
    track(ctx, 0);
    setFont(ctx, '600', 28, SANS); ctx.fillStyle = 'rgba(255,255,255,.72)';
    const lk = fit(ctx, d.linkText, '600', SANS, 28, 20, 900, 1);
    ctx.fillText(lk.lines[0], W / 2, H - 110);
    ctx.textAlign = 'left';
  }

  const TEMPLATES = [
    { id: 'klasik', label: 'Klasik', draw: drawKlasik },
    { id: 'rota', label: 'Rota', draw: drawRota },
    { id: 'minimal', label: 'Minimal', draw: drawMinimal },
  ];

  // d: { name, region, location, link, photos: { klasik, rota, minimal } } → <canvas 1080×1920>
  async function render(id, d) {
    const tpl = TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
    await loadFonts();
    const img = await loadImg(d.photos?.[tpl.id] || d.photos?.klasik).catch(() => null);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    tpl.draw(ctx, { ...d, linkText: String(d.link).replace(/^https?:\/\//, '') }, img);
    return cv;
  }
  const toBlob = (cv) => new Promise((res) => { try { cv.toBlob((b) => res(b), 'image/png'); } catch (e) { res(null); } });

  window.TLStory = { codeFor, slug, TEMPLATES: TEMPLATES.map(({ id, label }) => ({ id, label })), render, toBlob };
})();
