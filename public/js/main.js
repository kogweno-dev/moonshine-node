(function () {
  var nav = document.querySelector('.nav');
  var onScroll = function () { if (nav) nav.classList.toggle('scrolled', window.scrollY > 40); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  var burger = document.querySelector('.burger'), menu = document.getElementById('menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
      if (open) nav.classList.add('scrolled');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    });
  }

  var today = new Date().toISOString().slice(0, 10);
  document.querySelectorAll('input[type=date]').forEach(function (d) { d.min = today; });

  var chips = document.querySelectorAll('[data-filter]');
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.classList.remove('is-on'); });
      c.classList.add('is-on');
      var f = c.dataset.filter;
      document.querySelectorAll('.g-item[data-cat]').forEach(function (g) {
        g.hidden = !(f === 'all' || g.dataset.cat === f);
      });
    });
  });

  var tabs = document.querySelectorAll('[data-tab]');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.classList.remove('is-on'); });
      t.classList.add('is-on');
      document.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.dataset.panel !== t.dataset.tab; });
    });
  });

  var lb = document.querySelector('.lightbox');
  if (lb) {
    var img = lb.querySelector('img'), cap = lb.querySelector('p');
    var close = function () { lb.hidden = true; };
    document.querySelectorAll('.g-open').forEach(function (b) {
      b.addEventListener('click', function () {
        img.src = b.dataset.full; img.alt = b.dataset.cap; cap.textContent = b.dataset.cap; lb.hidden = false;
        lb.querySelector('.lb-close').focus();
      });
    });
    lb.addEventListener('click', function (e) { if (e.target !== img) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  document.querySelectorAll('.msg').forEach(function (m) { setTimeout(function () { m.style.display = 'none'; }, 7000); });
})();
