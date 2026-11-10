/* Turizmlink — kapalı beta giriş kilidi (gatekeeper).
   <head> içinde, diğer her şeyden önce yüklenir. Oturum sessionStorage'da
   "turizmlink_auth=true" olarak tutulur; sekme kapanana kadar sayfalar arası geçerli.
   Not: Bu istemci tarafı bir perdedir, gerçek bir güvenlik katmanı değildir. */
(function () {
  var KEY = 'turizmlink_auth';
  var PASS = 'turizm2026';
  var ok = false;
  try { ok = sessionStorage.getItem(KEY) === 'true'; } catch (e) {}
  if (ok) return;

  var root = document.documentElement;
  root.classList.add('tl-locked');

  var css =
    'html.tl-locked body>*:not(#tl-gate){display:none!important}' +
    'html.tl-locked,html.tl-locked body{overflow:hidden;background:#0f172a}' +
    '#tl-gate{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
    'padding:24px 16px;background:radial-gradient(1200px 600px at 50% -10%,#1e293b 0%,#0f172a 60%,#020617 100%);' +
    'font-family:"Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#e2e8f0}' +
    '#tl-gate .g-box{width:100%;max-width:380px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);' +
    'border-radius:20px;padding:36px 28px 28px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.45);backdrop-filter:blur(8px)}' +
    '#tl-gate .g-logo{width:56px;height:56px;margin:0 auto 14px;display:block}' +
    '#tl-gate h1{margin:0 0 8px;font-size:26px;font-weight:800;letter-spacing:-.02em;color:#fff}' +
    '#tl-gate p{margin:0 0 24px;font-size:13.5px;line-height:1.55;color:#94a3b8}' +
    '#tl-gate .g-tag{display:inline-block;margin-bottom:6px;font-size:11px;font-weight:700;letter-spacing:.08em;' +
    'text-transform:uppercase;color:#fbbf24}' +
    '#tl-gate input{width:100%;box-sizing:border-box;height:48px;padding:0 16px;border-radius:12px;font:inherit;font-size:15px;' +
    'color:#fff;background:rgba(15,23,42,.7);border:1px solid rgba(255,255,255,.14);outline:none;transition:border-color .15s,box-shadow .15s}' +
    '#tl-gate input::placeholder{color:#64748b}' +
    '#tl-gate input:focus{border-color:#fbbf24;box-shadow:0 0 0 3px rgba(251,191,36,.18)}' +
    '#tl-gate input.bad{border-color:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,.18)}' +
    '#tl-gate button{margin-top:12px;width:100%;height:48px;border:0;border-radius:12px;font:inherit;font-size:15px;font-weight:700;' +
    'cursor:pointer;color:#0f172a;background:linear-gradient(135deg,#fde68a,#f59e0b);transition:transform .1s,filter .15s}' +
    '#tl-gate button:hover{filter:brightness(1.05)}#tl-gate button:active{transform:scale(.98)}' +
    '#tl-gate .g-err{min-height:20px;margin:12px 0 0;font-size:13px;font-weight:600;color:#f87171}' +
    '#tl-gate .g-foot{margin-top:18px;font-size:11.5px;color:#475569}' +
    '@keyframes tlshake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}' +
    '#tl-gate .shake{animation:tlshake .3s}';
  var st = document.createElement('style');
  st.id = 'tl-gate-style';
  st.textContent = css;
  (document.head || root).appendChild(st);

  function mount() {
    if (document.getElementById('tl-gate')) return;
    var g = document.createElement('div');
    g.id = 'tl-gate';
    g.setAttribute('role', 'dialog');
    g.setAttribute('aria-modal', 'true');
    g.setAttribute('aria-labelledby', 'tl-gate-title');
    g.innerHTML =
      '<form class="g-box" novalidate autocomplete="off">' +
        '<img class="g-logo" src="assets/favicon.svg" alt="" />' +
        '<h1 id="tl-gate-title">Turizmlink</h1>' +
        '<span class="g-tag">Kapalı Beta Erişim Modu</span>' +
        '<p>Butik Oteller İçin Yeni Nesil Tavsiye Ağı</p>' +
        '<input type="password" id="tl-gate-pass" placeholder="Erişim Şifrenizi Girin" aria-label="Erişim şifresi" />' +
        '<button type="submit">Giriş Yap</button>' +
        '<div class="g-err" role="alert" aria-live="polite"></div>' +
        '<div class="g-foot">© ' + new Date().getFullYear() + ' Turizmlink · Davetli kullanıcılar içindir</div>' +
      '</form>';
    document.body.appendChild(g);

    var form = g.querySelector('form');
    var input = g.querySelector('input');
    var err = g.querySelector('.g-err');
    input.focus();
    input.addEventListener('input', function () { input.classList.remove('bad'); err.textContent = ''; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (input.value.trim() === PASS) {
        try { sessionStorage.setItem(KEY, 'true'); } catch (x) {}
        g.remove();
        st.remove();
        root.classList.remove('tl-locked');
        window.dispatchEvent(new Event('resize'));
      } else {
        err.textContent = 'Geçersiz şifre, lütfen davet kodunuzu kontrol edin.';
        input.classList.add('bad');
        form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
        input.select();
      }
    });
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
