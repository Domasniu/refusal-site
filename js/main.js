/* ============================================================
   REFUSAL OS — 交互逻辑（内容异步加载，支持 Decap CMS 在线编辑）
   ▸ 优先 fetch content/*.json（线上/服务器）
   ▸ 失败则回退 js/site-config.js 内置默认值（本地双击预览）
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG || {};
  var PAL = window.SITE_PALETTES || [];

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
    if (site) CFG = Object.assign({}, CFG, site);
    if (works && Array.isArray(works.works)) CFG.works = works.works;
    if (cats && Array.isArray(cats.categories)) CFG.categories = cats.categories;
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
  function renderText() {
    document.getElementById('about-card').innerHTML =
      String(CFG.about || '').split('\n').map(function (s) { return '<p>' + s + '</p>'; }).join('');
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

  /* ---------- 渲染音乐 ---------- */
  function renderMusic() {
    var box = document.getElementById('music-box');
    var code = (CFG.music && CFG.music.netease) || '';
    if (code && /<iframe/i.test(code)) {
      box.innerHTML = '<div class="netease-wrap">' + code + '</div>';
      box.classList.add('has-player');
    } else {
      box.classList.remove('has-player');
      box.innerHTML =
        '<div class="music-eq"><i></i><i></i><i></i><i></i><i></i></div>' +
        '<p class="music-txt">[ MUSIC CHANNEL ]<br>在后台「基础设置」中粘贴网易云外链播放器代码即可播放</p>';
    }
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
        '<span class="work-id">' + w.id + '</span>' +
        '<img src="' + w.img + '" alt="' + w.title + '" loading="lazy">' +
        '<div class="work-meta"><span class="work-name">' + w.title + '</span>' +
        '<span class="work-cat">' + catLabel(w.cat) + '</span></div>' +
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
    lb.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lb.classList.add('hidden');
    document.body.style.overflow = '';
  }

  /* ---------- 初始化 ---------- */
  function init() {
    applyTheme();
    renderHero();
    renderText();
    renderVideo();
    renderMusic();
    renderFilters();
    renderWorks('all');

    enterBtn.addEventListener('click', enterOS);
    if (new URLSearchParams(location.search).get('skip') === '1') {
      document.getElementById('boot').style.display = 'none';
      document.getElementById('os').classList.remove('hidden');
    }
    boot();

    setInterval(tick, 1000);
    tick();

    document.querySelectorAll('.nav-link').forEach(function (l) {
      l.addEventListener('click', function (e) {
        e.preventDefault();
        showSection(l.dataset.sec);
        history.replaceState(null, '', '#' + l.dataset.sec);
      });
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
