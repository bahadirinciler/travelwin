/* Turizmlink — ana vitrin (index.html): ikonlar + navbar gölgesi */
(function () {
  TLIcons.hydrate();
  document.getElementById('year').textContent = new Date().getFullYear();
  const nav = document.getElementById('lnav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
