/* Turizmlink — Medya Kiti: otel için dikey (1080×1920, Story/Reels) örnek görseller.
   Gerçek fotoğraf/video otel tarafından yüklenene kadar marka uyumlu SVG sahneler üretir;
   "İndir" PNG'ye çevirip cihaza kaydeder (olmazsa SVG indirir). */
(function () {
  const W = 1080, H = 1920;
  const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  const x = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** Sahne kataloğu (otel bağımsız; başlıklar otel adıyla birleşir). */
  const SCENES = [
    { id: 'sunset', format: 'Story', title: 'Gün batımı terası', caption: 'Ege\'nin en uzun gün batımı', sky: ['#f6c98b', '#e9a978', '#7fb3c9'], sea: ['#2f7d9a', '#0f3b55'], sun: '#ffe2a0', deco: 'hills' },
    { id: 'stone', format: 'Reels kapağı', title: 'Taş oda sabahı', caption: 'Taş duvarlar, serin sabahlar', sky: ['#e2e8f0', '#cbd5e1', '#94a3b8'], sea: ['#475569', '#1e293b'], sun: '#f8fafc', deco: 'houses' },
    { id: 'pool', format: 'Story', title: 'Bahçe & havuz', caption: 'Bademler arasında serin bir mola', sky: ['#bfe9f5', '#86d3e8', '#d1fae5'], sea: ['#10b981', '#047857'], sun: '#fff7d6', deco: 'pool' },
    { id: 'breakfast', format: 'Reels kapağı', title: 'Ege kahvaltısı', caption: 'Yerel üreticilerden her sabah', sky: ['#fef3c7', '#fde68a', '#fcd34d'], sea: ['#d97706', '#92400e'], sun: '#ffffff', deco: 'table' },
    { id: 'bay', format: 'Story', title: 'Koylar 10 dakika', caption: 'Turkuaz koylara kısa bir yol', sky: ['#a5f3fc', '#67e8f9', '#22d3ee'], sea: ['#0891b2', '#164e63'], sun: '#ffffff', deco: 'boat' },
    { id: 'promo', format: 'Story şablonu', title: 'Kodlu davet kartı', caption: 'Linkimle %5 misafir indirimi', promo: true },
  ];

  function decoSvg(s) {
    switch (s.deco) {
      case 'hills':
        return `<path d="M0 1080 Q 220 930 430 1040 T 820 1000 T 1080 1050 V 1160 H 0Z" fill="#7c5a3a" opacity=".55"/>
                <path d="M0 1120 Q 300 1020 560 1110 T 1080 1090 V 1180 H 0Z" fill="#5b3f27" opacity=".7"/>`;
      case 'houses':
        return [0, 1, 2, 3].map((i) => {
          const hx = 90 + i * 240, hy = 900 - (i % 2) * 60;
          return `<rect x="${hx}" y="${hy}" width="200" height="${260 + (i % 2) * 60}" rx="6" fill="#d6cbbd"/><rect x="${hx + 70}" y="${hy + 120}" width="60" height="90" rx="30" fill="#334155"/><path d="M${hx - 10} ${hy} L${hx + 100} ${hy - 70} L${hx + 210} ${hy}Z" fill="#b9a891"/>`;
        }).join('');
      case 'pool':
        return `<rect x="140" y="1180" width="800" height="300" rx="40" fill="#5eead4" stroke="#f8fafc" stroke-width="18"/>
                <path d="M190 1300 q 60 -30 120 0 t 120 0 t 120 0 t 120 0 t 120 0" stroke="#ffffff" stroke-width="10" fill="none" opacity=".7"/>
                <circle cx="900" cy="1000" r="120" fill="#047857" opacity=".8"/><rect x="890" y="1000" width="20" height="200" fill="#5b3f27"/>`;
      case 'table':
        return `<rect x="0" y="1150" width="${W}" height="${H - 1150}" fill="#f5efe6"/>
                ${[[300, 1380, 150, '#ffffff'], [700, 1350, 170, '#ffffff']].map(([cx, cy, r, f]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" stroke="#e7dccb" stroke-width="10"/>`).join('')}
                <circle cx="300" cy="1380" r="70" fill="#ef4444" opacity=".8"/><circle cx="700" cy="1350" r="80" fill="#fbbf24" opacity=".85"/>`;
      case 'boat':
        return `<path d="M380 1240 h 320 l -60 70 h -200z" fill="#f8fafc"/><rect x="535" y="1040" width="10" height="200" fill="#f8fafc"/><path d="M545 1050 L 690 1220 H 545Z" fill="#ffffff" opacity=".9"/>`;
      default: return '';
    }
  }

  /** opts: { hotel, region, code } */
  function svg(scene, opts = {}) {
    const hotel = (opts.hotel || 'Otel').toLocaleUpperCase('tr-TR');
    const code = opts.code || '';
    if (scene.promo) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
        <defs><radialGradient id="g1" cx="85%" cy="0%" r="70%"><stop offset="0" stop-color="#10b981" stop-opacity=".45"/><stop offset="1" stop-color="#10b981" stop-opacity="0"/></radialGradient>
        <radialGradient id="g2" cx="0%" cy="100%" r="70%"><stop offset="0" stop-color="#34d399" stop-opacity=".3"/><stop offset="1" stop-color="#34d399" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="#0f172a"/><rect width="${W}" height="${H}" fill="url(#g1)"/><rect width="${W}" height="${H}" fill="url(#g2)"/>
        <text x="540" y="300" text-anchor="middle" font-family="${FONT}" font-size="40" font-weight="700" letter-spacing="10" fill="#34d399">${x(hotel)}</text>
        <text x="540" y="380" text-anchor="middle" font-family="${FONT}" font-size="34" fill="#cbd5e1">${x(opts.region || '')}</text>
        <text x="540" y="860" text-anchor="middle" font-family="${FONT}" font-size="360" font-weight="800" fill="#ffffff">%5</text>
        <text x="540" y="980" text-anchor="middle" font-family="${FONT}" font-size="64" font-weight="700" fill="#ffffff">misafir indirimi</text>
        <text x="540" y="1060" text-anchor="middle" font-family="${FONT}" font-size="40" fill="#94a3b8">linkimle yapılan rezervasyonlarda</text>
        <rect x="190" y="1260" width="700" height="170" rx="40" fill="#10b981"/>
        <text x="540" y="1335" text-anchor="middle" font-family="${FONT}" font-size="34" font-weight="700" fill="#022c22">KOD</text>
        <text x="540" y="1395" text-anchor="middle" font-family="${FONT}" font-size="52" font-weight="800" fill="#022c22">${x(code || 'KODUNUZ')}</text>
        <text x="540" y="1700" text-anchor="middle" font-family="${FONT}" font-size="36" font-weight="700" fill="#ffffff">turizmlink.com</text>
      </svg>`;
    }
    const [s1, s2, s3] = scene.sky;
    const [w1, w2] = scene.sea;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset=".55" stop-color="${s2}"/><stop offset="1" stop-color="${s3}"/></linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${w1}"/><stop offset="1" stop-color="${w2}"/></linearGradient>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#0f172a" stop-opacity="0"/><stop offset="1" stop-color="#0f172a" stop-opacity=".85"/></linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#sky)"/>
      <circle cx="760" cy="640" r="170" fill="${scene.sun}" opacity=".9"/>
      <rect y="1100" width="${W}" height="${H - 1100}" fill="url(#sea)"/>
      <path d="M0 1180 q 90 -26 180 0 t 180 0 t 180 0 t 180 0 t 180 0 t 180 0" stroke="#ffffff" stroke-opacity=".35" stroke-width="6" fill="none"/>
      ${decoSvg(scene)}
      <rect width="${W}" height="${H}" fill="url(#fade)"/>
      <text x="80" y="300" font-family="${FONT}" font-size="38" font-weight="700" letter-spacing="8" fill="#ffffff">${x(hotel)}</text>
      <text x="80" y="1560" font-family="${FONT}" font-size="84" font-weight="800" fill="#ffffff">${x(scene.title)}</text>
      <text x="80" y="1640" font-family="${FONT}" font-size="42" fill="#e2e8f0">${x(scene.caption)}</text>
      <rect x="80" y="1710" width="${code ? 920 : 560}" height="110" rx="55" fill="#10b981"/>
      <text x="130" y="1780" font-family="${FONT}" font-size="40" font-weight="800" fill="#022c22">%5 indirim${code ? ` · KOD: ${x(code)}` : ' · turizmlink.com'}</text>
    </svg>`;
  }

  const dataUrl = (s) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;

  function save(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /** PNG olarak indir; tarayıcı izin vermezse SVG indir. */
  function download(scene, opts, filename) {
    const s = svg(scene, opts);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement('canvas'); c.width = W; c.height = H;
          c.getContext('2d').drawImage(img, 0, 0, W, H);
          c.toBlob((b) => {
            if (b) { save(b, `${filename}.png`); resolve('png'); } else { save(new Blob([s], { type: 'image/svg+xml' }), `${filename}.svg`); resolve('svg'); }
          }, 'image/png');
        } catch (e) { save(new Blob([s], { type: 'image/svg+xml' }), `${filename}.svg`); resolve('svg'); }
      };
      img.onerror = () => { save(new Blob([s], { type: 'image/svg+xml' }), `${filename}.svg`); resolve('svg'); };
      img.src = dataUrl(s);
    });
  }

  /* ---------- Gerçek fotoğraflar: dikey görsel + otel adı + ref kodu bandı ---------- */
  function roundRect(c, x0, y0, w, h, r) {
    c.beginPath(); c.moveTo(x0 + r, y0); c.arcTo(x0 + w, y0, x0 + w, y0 + h, r); c.arcTo(x0 + w, y0 + h, x0, y0 + h, r);
    c.arcTo(x0, y0 + h, x0, y0, r); c.arcTo(x0, y0, x0 + w, y0, r); c.closePath();
  }
  /** item: { src, title }, opts: { hotel, code } → JPEG indirir (kodlu bant ile). */
  function downloadPhoto(item, opts, filename) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const c = cv.getContext('2d');
        // kapla (cover)
        const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
        const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
        c.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
        // üst ve alt karartma
        let g = c.createLinearGradient(0, 0, 0, 420); g.addColorStop(0, 'rgba(15,23,42,.55)'); g.addColorStop(1, 'rgba(15,23,42,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, 420);
        g = c.createLinearGradient(0, H - 760, 0, H); g.addColorStop(0, 'rgba(15,23,42,0)'); g.addColorStop(1, 'rgba(15,23,42,.88)');
        c.fillStyle = g; c.fillRect(0, H - 760, W, 760);
        c.fillStyle = '#fff'; c.textBaseline = 'alphabetic';
        c.font = `700 40px ${FONT}`; c.letterSpacing = '8px';
        c.fillText((opts.hotel || '').toLocaleUpperCase('tr-TR'), 80, 170);
        c.letterSpacing = '0px';
        c.font = `800 84px ${FONT}`; c.fillText(item.title, 80, H - 330);
        c.font = `500 42px ${FONT}`; c.fillStyle = '#e2e8f0'; c.fillText(opts.region ? `${opts.region} · turizmlink.com` : 'turizmlink.com', 80, H - 260);
        const label = `%5 indirim${opts.code ? ` · KOD: ${opts.code}` : ''}`;
        c.font = `800 42px ${FONT}`;
        const w = Math.min(W - 160, c.measureText(label).width + 100);
        c.fillStyle = '#10b981'; roundRect(c, 80, H - 200, w, 110, 55); c.fill();
        c.fillStyle = '#022c22'; c.fillText(label, 130, H - 130);
        cv.toBlob((b) => { if (b) { save(b, `${filename}.jpg`); resolve('jpg'); } else reject(new Error('toBlob')); }, 'image/jpeg', 0.9);
      };
      img.onerror = reject;
      img.src = item.src;
    });
  }

  window.TLMedia = { SCENES, svg, dataUrl, download, downloadPhoto };
})();
