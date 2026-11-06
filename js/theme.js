// Chọn theme: tự động (theo hệ thống) → sáng → tối. Chạy trong <head> để áp dụng trước khi vẽ trang.
(function () {
  var KEY = 'bhxh-theme-v1';
  var ORDER = ['auto', 'light', 'dark'];
  var LABEL = { auto: 'Theme: tự động theo máy', light: 'Theme: sáng', dark: 'Theme: tối' };
  var ICON = {
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>',
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
  };

  function load() {
    try { var v = localStorage.getItem(KEY); return ORDER.indexOf(v) >= 0 ? v : 'auto'; } catch (e) { return 'auto'; }
  }
  function save(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* bỏ qua */ }
  }
  function apply(v) {
    if (v === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', v);
  }

  var current = load();
  apply(current);

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    function render() {
      btn.innerHTML = ICON[current];
      btn.setAttribute('aria-label', LABEL[current] + ' (bấm để đổi)');
      btn.title = LABEL[current];
    }
    btn.addEventListener('click', function () {
      current = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
      apply(current);
      save(current);
      render();
    });
    render();
  });
})();
