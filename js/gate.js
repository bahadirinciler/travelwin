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
    'html.tl-locked,html.tl-locked body{overflow:hidden;background:#faf8f5}' +
    '#tl-gate{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
    'padding:24px 16px;background:radial-gradient(900px 500px at 50% -10%,#f3e6d2 0%,#faf8f5 60%);' +
    'font-family:"Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1e2d2f}' +
    '#tl-gate .g-box{width:100%;max-width:400px;background:#fff;border:1px solid #e9e2d8;' +
    'border-radius:26px;padding:40px 30px 28px;text-align:center;box-shadow:0 30px 70px -30px rgba(30,45,47,.4)}' +
    '#tl-gate h1{margin:0 0 10px;font-family:"Playfair Display",Georgia,serif;font-size:34px;font-weight:600;letter-spacing:-.01em;color:#1e2d2f}' +
    '#tl-gate p{margin:0 0 26px;font-size:14px;line-height:1.55;color:#55605f}' +
    '#tl-gate .g-tag{display:inline-block;margin-bottom:8px;font-size:11px;font-weight:700;letter-spacing:.16em;' +
    'text-transform:uppercase;color:#d96b43}' +
    '#tl-gate input{width:100%;box-sizing:border-box;height:50px;padding:0 18px;border-radius:999px;font:inherit;font-size:15px;' +
    'color:#1e2d2f;background:#faf8f5;border:1px solid #e9e2d8;outline:none;transition:border-color .15s,box-shadow .15s;text-align:center}' +
    '#tl-gate input::placeholder{color:#9aa19f}' +
    '#tl-gate input:focus{border-color:#d96b43;box-shadow:0 0 0 3px rgba(217,107,67,.16)}' +
    '#tl-gate input.bad{border-color:#c4453b;box-shadow:0 0 0 3px rgba(196,69,59,.14)}' +
    '#tl-gate button{margin-top:12px;width:100%;height:50px;border:0;border-radius:999px;font:inherit;font-size:15px;font-weight:700;' +
    'cursor:pointer;color:#fff;background:#d96b43;box-shadow:0 14px 28px -14px rgba(217,107,67,.85);transition:transform .1s,background .15s}' +
    '#tl-gate button:hover{background:#c35a34}#tl-gate button:active{transform:scale(.98)}' +
    '#tl-gate .g-err{min-height:20px;margin:12px 0 0;font-size:13px;font-weight:600;color:#c4453b}' +
    '#tl-gate .g-foot{margin-top:16px;font-size:11.5px;color:#9aa19f}' +
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
