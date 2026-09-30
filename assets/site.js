/* imely Creator — shared interactions */
(function () {
  var doc = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header: elevate on scroll + reading progress */
  var header = document.querySelector('.site-header');
  var progress = document.querySelector('.progress');
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (progress) {
      var max = doc.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var toggle = document.querySelector('.menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.mobile-sheet a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* Close language menu on outside click */
  document.addEventListener('click', function (e) {
    document.querySelectorAll('details.lang[open]').forEach(function (d) {
      if (!d.contains(e.target)) d.removeAttribute('open');
    });
  });

  /* Reveal on scroll */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) {
      // Elements already on screen animate in right away instead of waiting for the observer.
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        el.classList.add('is-visible');
      } else {
        io.observe(el);
      }
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Cursor-follow glow on cards */
  document.querySelectorAll('.block').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* Campaign deadlines: statuses and CTAs switch automatically once a campaign ends */
  function setStatus(el, over) {
    var live = el.getAttribute('data-live-label');
    var ended = el.getAttribute('data-ended-label') || 'Đã kết thúc';
    el.classList.toggle('status-live', !over);
    el.classList.toggle('status-ended', over);
    el.innerHTML = over ? ended : '<span class="dot" aria-hidden="true"></span>' + live;
  }

  function tickDeadlines() {
    var now = Date.now();
    document.querySelectorAll('[data-ends]').forEach(function (el) {
      var end = new Date(el.getAttribute('data-ends')).getTime();
      var over = now > end;
      var left = Math.max(end - now, 0);
      var role = el.getAttribute('data-role');

      if (role === 'status') {
        setStatus(el, over);
      } else if (role === 'left') {
        var days = Math.floor(left / 86400000);
        el.textContent = days >= 1 ? 'còn ' + days + ' ngày' : 'hạn chót hôm nay';
      } else if (role === 'countdown') {
        var parts = {
          d: Math.floor(left / 86400000),
          h: Math.floor(left / 3600000) % 24,
          m: Math.floor(left / 60000) % 60,
          s: Math.floor(left / 1000) % 60
        };
        el.querySelectorAll('[data-cd]').forEach(function (n) {
          var v = parts[n.getAttribute('data-cd')];
          n.textContent = v < 10 ? '0' + v : String(v);
        });
      } else if (role === 'while-live') {
        el.hidden = over;
      } else if (role === 'when-over') {
        el.hidden = !over;
      }
    });
  }

  if (document.querySelector('[data-ends]')) {
    tickDeadlines();
    setInterval(tickDeadlines, 1000);
  }

  /* Scrollspy for tab bars and tables of contents */
  document.querySelectorAll('[data-spy]').forEach(function (nav) {
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var indicator = nav.querySelector('.tab-indicator');
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });

    function activate(link) {
      links.forEach(function (a) { a.classList.toggle('is-active', a === link); });
      if (indicator && link) {
        indicator.style.width = link.offsetWidth + 'px';
        indicator.style.transform = 'translateX(' + link.offsetLeft + 'px)';
      }
    }

    function update() {
      var offset = window.innerHeight * 0.32;
      var current = links[0];
      targets.forEach(function (t, i) {
        if (t && t.getBoundingClientRect().top - offset <= 0) current = links[i];
      });
      activate(current);
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* Filter chips */
  document.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var scope = document.querySelector(group.getAttribute('data-filter-group'));
    if (!scope) return;
    var buttons = group.querySelectorAll('button[data-filter]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-filter');
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        scope.setAttribute('data-active-filter', f);
        applyFilters(scope);
      });
    });
  });

  function applyFilters(scope) {
    var f = scope.getAttribute('data-active-filter') || 'all';
    var qInput = document.querySelector('[data-faq-search][data-scope="#' + scope.id + '"]');
    var q = qInput ? qInput.value.trim().toLowerCase() : '';
    var shown = 0;
    scope.querySelectorAll('[data-filter-item]').forEach(function (item) {
      var tags = (item.getAttribute('data-tags') || '').split(' ');
      var matchTag = f === 'all' || tags.indexOf(f) !== -1;
      var matchText = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
      var visible = matchTag && matchText;
      item.classList.toggle('is-hidden', !visible);
      if (visible) shown++;
    });
    var empty = scope.querySelector('.faq-empty');
    if (empty) empty.classList.toggle('is-shown', shown === 0);
  }

  /* FAQ search */
  document.querySelectorAll('[data-faq-search]').forEach(function (input) {
    var scope = document.querySelector(input.getAttribute('data-scope'));
    if (!scope) return;
    input.addEventListener('input', function () {
      applyFilters(scope);
      if (input.value.trim()) {
        scope.querySelectorAll('[data-filter-item]:not(.is-hidden) details').forEach(function (d) { d.open = true; });
      }
    });
  });

  /* Pre-submit checklist progress */
  document.querySelectorAll('.tick-list').forEach(function (list) {
    var bar = document.querySelector(list.getAttribute('data-progress'));
    var boxes = list.querySelectorAll('input[type="checkbox"]');
    function update() {
      var n = 0;
      boxes.forEach(function (b) { if (b.checked) n++; });
      if (bar) bar.style.width = (n / boxes.length * 100) + '%';
    }
    boxes.forEach(function (b) { b.addEventListener('change', update); });
    update();
  });
})();
