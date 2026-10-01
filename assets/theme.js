/* imely Creator: light / dark theme.
   The inline script in <head> sets html[data-theme] before first paint; this file
   wires the toggles, remembers the choice and follows OS changes in "system" mode. */
(function () {
  var root = document.documentElement;
  var KEY = 'imely-theme';
  var ORDER = ['system', 'light', 'dark'];
  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  function getPref() {
    try {
      var p = localStorage.getItem(KEY);
      return p === 'light' || p === 'dark' ? p : 'system';
    } catch (e) {
      return 'system';
    }
  }

  function setPref(p) {
    try {
      if (p === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, p);
    } catch (e) { /* private mode: theme still applies for this page view */ }
  }

  function apply(pref, animate) {
    var theme = pref === 'system' ? (mq.matches ? 'dark' : 'light') : pref;
    if (animate) {
      root.classList.add('theme-anim');
      window.setTimeout(function () { root.classList.remove('theme-anim'); }, 400);
    }
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-theme-pref', pref);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a1017' : '#fbfdfd');

    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      var label = btn.getAttribute('data-label-' + pref);
      if (label) {
        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);
      }
    });
    document.querySelectorAll('[data-theme-set]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-theme-set') === pref ? 'true' : 'false');
    });
  }

  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-theme-toggle]');
    var set = e.target.closest('[data-theme-set]');
    var next;
    if (toggle) next = ORDER[(ORDER.indexOf(getPref()) + 1) % ORDER.length];
    else if (set) next = set.getAttribute('data-theme-set');
    else return;
    setPref(next);
    apply(next, true);
  });

  function onSystemChange() {
    if (getPref() === 'system') apply('system', true);
  }
  if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
  else if (mq.addListener) mq.addListener(onSystemChange);

  // Another tab changed the theme
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) apply(getPref(), true);
  });

  apply(getPref(), false);
})();
