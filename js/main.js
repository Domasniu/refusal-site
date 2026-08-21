/* ============================================================
   REFUSAL OS — 交互逻辑（内容异步加载，支持 Decap CMS 在线编辑）
   ▸ 优先 fetch content/*.json（线上/服务器）
   ▸ 失败则回退 js/site-config.js 内置默认值（本地双击预览）
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG || {};
  var PAL = window.SITE_PALETTES || [];
  var MUSIC = [];        // 来自 content/music.json 的歌单
  var currentSong = null; // 当前播放的歌

  /* ---------- 异步加载线上内容（失败自动回退默认值） ---------- */
  function tryFetch(url) {
    return fetch(url, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  async function loadContent() {
    var site = await tryFetch('content/site.json');
    var works = await tryFetch('content/works.json');
    var cats = await tryFetch('content/categories.json');
    var music = await tryFetch('content/music.json');
    if (site) CFG = Object.assign({}, CFG, site);
    if (works && Array.isArray(works.works)) CFG.works = works.works;
    if (cats && Array.isArray(cats.categories)) CFG.categories = cats.categories;
    if (music && Array.isArray(music.playlist)) MUSIC = music.playlist;
    init();
  }

  /* ---------- 应用主题 ---------- */
  function applyTheme() {
    var p = PAL.filter(function (x) { return x.id === CFG.theme; })[0];
    if (!p) p = PAL[0];
    if (!p) return;
    var root = document.documentElement.style;
    root.setProperty('--bg', p.colors.bg);
    root.setProperty('--bg2', p.colors.bg2);
    root.setProperty('--panel', p.colors.panel);
    root.setProperty('--cyan', p.colors.cyan);
    root.setProperty('--magenta', p.colors.magenta);
    root.setProperty('--purple', p.colors.purple);
    root.setProperty('--yellow', p.colors.yellow);
    root.setProperty('--text', p.colors.text);
    root.setProperty('--dim', p.colors.dim);
  }

  /* ---------- 访客主题切换（localStorage 记忆，覆盖站长的默认主题） ---------- */
  var THEME_KEY = 'refusal-theme';
  function applyVisitorTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { saved = null; }
    if (!saved) return; // 没有访客偏好就用站长主题
    var p = PAL.filter(function (x) { return x.id === saved; })[0];
    if (!p) return;
    var root = document.documentElement.style;
    root.setProperty('--bg', p.colors.bg);
    root.setProperty('--bg2', p.colors.bg2);
    root.setProperty('--panel', p.colors.panel);
    root.setProperty('--cyan', p.colors.cyan);
    root.setProperty('--magenta', p.colors.magenta);
    root.setProperty('--purple', p.colors.purple);
    root.setProperty('--yellow', p.colors.yellow);
    root.setProperty('--text', p.colors.text);
    root.setProperty('--dim', p.colors.dim);
  }
  function initThemeToggle() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var cur = null;
      try { cur = localStorage.getItem(THEME_KEY); } catch (e) { cur = null; }
      if (!cur) cur = CFG.theme;
      var idx = -1;
      for (var i = 0; i < PAL.length; i++) if (PAL[i].id === cur) { idx = i; break; }
      var next = PAL[(idx + 1) % PAL.length];
      try { localStorage.setItem(THEME_KEY, next.id); } catch (e) {}
      var root = document.documentElement.style;
      root.setProperty('--bg', next.colors.bg);
      root.setProperty('--bg2', next.colors.bg2);
      root.setProperty('--panel', next.colors.panel);
      root.setProperty('--cyan', next.colors.cyan);
      root.setProperty('--magenta', next.colors.magenta);
      root.setProperty('--purple', next.colors.purple);
      root.setProperty('--yellow', next.colors.yellow);
      root.setProperty('--text', next.colors.text);
      root.setProperty('--dim', next.colors.dim);
      // 轻提示当前主题名
      var nm = next.name || next.id;
      var tip = document.createElement('div');
      tip.className = 'theme-tip';
      tip.textContent = '🎨 ' + nm;
      document.body.appendChild(tip);
      setTimeout(function () { tip.classList.add('out'); }, 900);
      setTimeout(function () { if (tip.parentNode) tip.parentNode.removeChild(tip); }, 1400);
    });
  }

  /* ---------- 渲染主页文字 ---------- */
  function renderHero() {
    var h = CFG.hero || {};
    document.getElementById('hero-tags').textContent = h.tags || '';
    document.getElementById('hero-slogan').textContent = h.slogan || '';
    document.getElementById('hero-desc').textContent = h.desc || '';
    var av = document.getElementById('avatar-img');
    if (av && CFG.avatar) av.src = CFG.avatar;
  }

  /* ---------- 渲染关于 / 联系 ---------- */
  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function renderText() {
    var about = String(CFG.about || '').split('\n');
    document.getElementById('about-card').innerHTML =
      about.map(function (s) { return '<p>' + escHtml(s) + '</p>'; }).join('');
    document.getElementById('contact-card').textContent = CFG.contact || '';
  }

  /* ---------- 渲染视频 ---------- */
  var VIDEO_DEFS = [
    { key: 'douyin',  name: '抖音',  icon: '🎵', cls: 'dy' },
    { key: 'bilibili',name: 'B站',   icon: '📺', cls: 'bili' },
    { key: 'youtube', name: 'YouTube', icon: '▶', cls: 'yt' }
  ];
  function renderVideo() {
    var box = document.getElementById('video-grid');
    var v = CFG.video || {};
    box.innerHTML = '';
    VIDEO_DEFS.forEach(function (d) {
      var url = v[d.key] || '';
      var card = document.createElement(url ? 'a' : 'div');
      card.className = 'media-card';
      if (url) { card.href = url; card.target = '_blank'; card.rel = 'noopener'; }
      card.innerHTML =
        '<div class="media-thumb ' + d.cls + '"><span class="media-icon">' + d.icon + '</span>' +
        '<span class="media-badge">' + d.name + '</span></div>' +
        '<div class="media-info">' + (url ? d.name + '主页 · 点击前往' : d.name + ' · 即将上线') + '</div>';
      box.appendChild(card);
    });
  }

  /* ---------- 渲染音乐（歌单切换） ---------- */
  function renderMusic() {
    var box = document.getElementById('music-box');
    if (!MUSIC || !MUSIC.length) {
      var code = (CFG.music && CFG.music.netease) || '';
      if (code && /<iframe/i.test(code)) {
        box.innerHTML = '<div class="netease-wrap">' + code + '</div>';
        box.classList.add('has-player');
      } else {
        box.classList.remove('has-player');
        box.innerHTML =
          '<div class="music-eq"><i></i><i></i><i></i><i></i><i></i></div>' +
          '<p class="music-txt">[ MUSIC CHANNEL ]<br>歌单为空，稍后添加</p>';
      }
      return;
    }
    var song = currentSong || MUSIC[0];
    box.classList.add('has-player');
    box.innerHTML =
      '<div class="music-player">' +
        '<iframe src="https://music.163.com/outchain/player?type=2&id=' + encodeURIComponent(song.id) + '&auto=0&height=66" frameborder="0" scrolling="no" referrerpolicy="no-referrer" loading="lazy" title="网易云音乐播放器"></iframe>' +
      '</div>' +
      '<ul class="music-list">' +
        MUSIC.map(function (s, i) {
          return '<li class="music-item' + (s.id === song.id ? ' on' : '') + '" data-i="' + i + '">' +
            '<span class="mi-title">' + escHtml(s.title) + '</span>' +
            '<span class="mi-artist">' + escHtml(s.artist || '') + '</span>' +
          '</li>';
        }).join('') +
      '</ul>';
    box.querySelectorAll('.music-item').forEach(function (li) {
      li.addEventListener('click', function () {
        currentSong = MUSIC[+li.dataset.i];
        renderMusic();
      });
    });
  }

  /* ---------- 开机画面 ---------- */
  var bootLines = [
    '> REFUSAL BIOS v2026.05 ................. [ OK ]',
    '> 加载手作模块 HANDCRAFT.SYS ........... [ OK ]',
    '> 加载剪纸模块 PAPERCUT.SYS ............ [ OK ]',
    '> 加载绘画模块 DRAWING.SYS ............. [ OK ]',
    '> 加载影像模块 VIDEO.SYS ............... [ OK ]',
    '> 加载音乐模块 MUSIC.SYS ............... [ OK ]',
    '> 校验身份: refusal· ................... [ OK ]',
    '> 系统就绪 — WELCOME TO REFUSAL OS',
    ''
  ];
  var term = document.getElementById('boot-terminal');
  var enterBtn = document.getElementById('boot-enter');

  async function typeLine(text) {
    var line = document.createElement('div');
    term.appendChild(line);
    if (text.indexOf('> ') === 0) {
      line.innerHTML = text.replace(/\[ OK \]/g, '<span class="ok">[ OK ]</span>')
        .replace(/WELCOME/, '<span class="warn">WELCOME</span>');
    } else {
      line.textContent = text;
    }
    var delay = text.indexOf('[ OK ]') >= 0 ? 160 : text.indexOf('WELCOME') >= 0 ? 500 : 120;
    await new Promise(function (r) { setTimeout(r, delay); });
  }

  async function boot() {
    term.innerHTML = '';
    for (var i = 0; i < bootLines.length; i++) await typeLine(bootLines[i]);
    enterBtn.classList.remove('hidden');
  }

  /* 返回访客自动跳过开机动画（sessionStorage 记忆，?boot=1 可强制重看） */
  function shouldSkipBoot() {
    if (new URLSearchParams(location.search).get('boot') === '1') return false;
    try { return sessionStorage.getItem('refusal-booted') === '1'; } catch (e) { return false; }
  }
  function markBooted() {
    try { sessionStorage.setItem('refusal-booted', '1'); } catch (e) {}
  }
  function skipBoot() {
    document.getElementById('boot').style.display = 'none';
    document.getElementById('os').classList.remove('hidden');
  }

  function enterOS() {
    document.getElementById('boot').classList.add('gone');
    document.getElementById('os').classList.remove('hidden');
    setTimeout(function () { document.getElementById('boot').style.display = 'none'; }, 650);
  }

  /* ---------- 时钟 ---------- */
  function tick() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    document.getElementById('clock').textContent = p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  /* ---------- 导航 ---------- */
  var currentFilter = 'all';
  function showSection(id) {
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.toggle('active', p.id === id); });
    document.querySelectorAll('.nav-link').forEach(function (l) { l.classList.toggle('active', l.dataset.sec === id); });
    if (id === 'works') renderWorks(currentFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- 作品区 ---------- */
  function catLabel(id) {
    var c = (CFG.categories || []).filter(function (x) { return x.id === id; })[0];
    return c ? c.label : id;
  }
  function renderFilters() {
    var box = document.getElementById('work-filters');
    box.innerHTML = '';
    var cats = [{ id: 'all', label: '全部' }].concat(CFG.categories || []);
    cats.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'filter-btn' + (c.id === currentFilter ? ' active' : '');
      b.textContent = c.label;
      b.dataset.cat = c.id;
      b.addEventListener('click', function () {
        currentFilter = c.id;
        renderFilters();
        renderWorks(currentFilter);
      });
      box.appendChild(b);
    });
  }
  function renderWorks(cat) {
    var grid = document.getElementById('work-grid');
    grid.innerHTML = '';
    var list = cat === 'all' ? (CFG.works || []) : (CFG.works || []).filter(function (w) { return w.cat === cat; });
    if (!list.length) {
      grid.innerHTML = '<p class="panel-note" style="grid-column:1/-1">[ 该分类暂无作品，敬请期待 ]</p>';
      return;
    }
    list.forEach(function (w) {
      var card = document.createElement('div');
      card.className = 'work-card';
      card.innerHTML =
        '<span class="work-id">' + escHtml(w.id) + '</span>' +
        '<img src="' + escHtml(w.img) + '" alt="' + escHtml(w.title) + '" loading="lazy" decoding="async">' +
        '<div class="work-meta"><span class="work-name">' + escHtml(w.title) + '</span>' +
        '<span class="work-cat">' + escHtml(catLabel(w.cat)) + '</span></div>' +
        (w.desc ? '<p class="work-desc">' + escHtml(w.desc) + '</p>' : '') +
        '<div class="cat-bar"></div>';
      card.addEventListener('click', function () { openLightbox(w); });
      grid.appendChild(card);
    });
  }

  /* ---------- 灯箱 ---------- */
  var lb = document.getElementById('lightbox');
  function openLightbox(w) {
    document.getElementById('lb-img').src = w.img;
    document.getElementById('lb-caption').textContent = w.id + ' · ' + w.title + ' · ' + catLabel(w.cat);
    var descEl = document.getElementById('lb-desc');
    if (w.desc) {
      descEl.textContent = w.desc;
      descEl.classList.remove('hidden');
    } else {
      descEl.textContent = '';
      descEl.classList.add('hidden');
    }
    lb.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lb.classList.add('hidden');
    document.body.style.overflow = '';
  }

  /* ---------- 首页统计 + 最新作品 ---------- */
  function renderHomeStats() {
    var box = document.getElementById('home-stats');
    if (!box) return;
    var wCount = (CFG.works || []).length;
    var cCount = (CFG.categories || []).length;
    box.innerHTML =
      '<div class="stat"><span class="stat-num">' + wCount + '</span><span class="stat-label">作品 / WORKS</span></div>' +
      '<div class="stat"><span class="stat-num">' + cCount + '</span><span class="stat-label">分类 / CATEGORIES</span></div>' +
      '<div class="stat"><span class="stat-num">ONLINE</span><span class="stat-label">状态 / STATUS</span></div>';
  }

  function renderLatestWorks() {
    var grid = document.getElementById('home-latest-grid');
    if (!grid) return;
    var latest = (CFG.works || []).slice(0, 4);
    if (!latest.length) { grid.innerHTML = '<p class="panel-note">[ 暂无作品 ]</p>'; return; }
    latest.forEach(function (w) {
      var card = document.createElement('div');
      card.className = 'work-card';
      card.innerHTML =
        '<span class="work-id">' + escHtml(w.id) + '</span>' +
        '<img src="' + escHtml(w.img) + '" alt="' + escHtml(w.title) + '" loading="lazy" decoding="async">' +
        '<div class="work-meta"><span class="work-name">' + escHtml(w.title) + '</span>' +
        '<span class="work-cat">' + escHtml(catLabel(w.cat)) + '</span></div>' +
        (w.desc ? '<p class="work-desc">' + escHtml(w.desc) + '</p>' : '') +
        '<div class="cat-bar"></div>';
      card.addEventListener('click', function () { openLightbox(w); });
      grid.appendChild(card);
    });
  }

  /* ---------- 返回顶部 ---------- */
  function initToTop() {
    var btn = document.getElementById('to-top');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('hidden', (window.scrollY || document.documentElement.scrollTop) < 300);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 初始化 ---------- */
  function init() {
    applyTheme();
    applyVisitorTheme();
    renderHero();
    renderText();
    renderVideo();
    renderMusic();
    renderFilters();
    renderWorks('all');
    renderHomeStats();
    renderLatestWorks();
    initThemeToggle();
    initToTop();

    enterBtn.addEventListener('click', function () { markBooted(); enterOS(); });
    if (shouldSkipBoot()) {
      skipBoot();
    } else if (new URLSearchParams(location.search).get('skip') === '1') {
      skipBoot();
    }
    boot();

    setInterval(tick, 1000);
    tick();

    document.querySelectorAll('[data-sec]').forEach(function (l) {
      l.addEventListener('click', function (e) {
        e.preventDefault();
        showSection(l.dataset.sec);
        history.replaceState(null, '', '#' + l.dataset.sec);
      });
    });
    window.addEventListener('hashchange', function () {
      var hid = location.hash.slice(1);
      if (hid && document.getElementById(hid)) showSection(hid);
    });
    if (location.hash && location.hash.length > 1) {
      var hid = location.hash.slice(1);
      if (document.getElementById(hid)) setTimeout(function () { showSection(hid); }, 800);
    }

    document.getElementById('lb-close').addEventListener('click', closeLightbox);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
  }

  loadContent();
})();
