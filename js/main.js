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
  var MOMENTS = [];      // 来自 content/moments.json 的生活动态

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
    var moments = await tryFetch('content/moments.json');
    if (site) CFG = Object.assign({}, CFG, site);
    if (works && Array.isArray(works.works)) CFG.works = works.works;
    if (cats && Array.isArray(cats.categories)) CFG.categories = cats.categories;
    if (music && Array.isArray(music.playlist)) MUSIC = music.playlist;
    if (moments && Array.isArray(moments.moments)) MOMENTS = moments.moments;
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

  /* ---------- 渲染音乐（自定义播放器，支持网易云外链 + 自传文件） ---------- */
  function initMusicPlayer() {
    if (!window.REFUSAL_PLAYER) return;
    var box = document.getElementById('music-box');
    var list = (MUSIC && MUSIC.length) ? MUSIC : (CFG.playlist || []);
    // 无歌单时回退到 site-config 里的网易云 iframe 代码
    if (!list.length) {
      var code = (CFG.music && CFG.music.netease) || '';
      if (code && /<iframe/i.test(code)) {
        if (box) { box.innerHTML = '<div class="netease-wrap">' + code + '</div>'; box.classList.add('has-player'); }
      } else if (box) {
        box.classList.remove('has-player');
        box.innerHTML =
          '<div class="music-eq"><i></i><i></i><i></i><i></i><i></i></div>' +
          '<p class="music-txt">[ MUSIC CHANNEL ]<br>歌单为空，稍后添加</p>';
      }
      return;
    }
    var ui = {
      panel: document.getElementById('player-panel'),
      cover: document.getElementById('p-cover'),
      title: document.getElementById('p-title'),
      artist: document.getElementById('p-artist'),
      playBtn: document.getElementById('p-play'),
      prevBtn: document.getElementById('p-prev'),
      nextBtn: document.getElementById('p-next'),
      modeBtn: document.getElementById('p-mode'),
      muteBtn: document.getElementById('p-mute'),
      volBar: document.getElementById('p-vol'),
      volFill: document.getElementById('p-vol-fill'),
      progBar: document.getElementById('p-bar'),
      progFill: document.getElementById('p-fill'),
      curTime: document.getElementById('p-cur'),
      durTime: document.getElementById('p-dur'),
      status: document.getElementById('p-status'),
      lrcBox: document.getElementById('p-lrc'),
      list: document.getElementById('p-list'),
      mini: document.getElementById('mini-player'),
      miniCover: document.getElementById('mp-cover'),
      miniTitle: document.getElementById('mp-title'),
      miniArtist: document.getElementById('mp-artist'),
      miniPlay: document.getElementById('mp-play'),
      miniPrev: document.getElementById('mp-prev'),
      miniNext: document.getElementById('mp-next'),
      miniFill: document.getElementById('mp-fill'),
      hmCover: document.getElementById('hm-cover'),
      hmTitle: document.getElementById('hm-title'),
      hmArtist: document.getElementById('hm-artist'),
      hmPlay: document.getElementById('hm-play'),
      hmPrev: document.getElementById('hm-prev'),
      hmNext: document.getElementById('hm-next'),
      hmBar: document.getElementById('hm-bar'),
      hmFill: document.getElementById('hm-fill'),
      hmCur: document.getElementById('hm-cur'),
      hmDur: document.getElementById('hm-dur')
    };
    // 首页播放器与迷你播放器事件（复用同一套逻辑）
    if (ui.hmPlay) ui.hmPlay.addEventListener('click', function () { window.REFUSAL_PLAYER.togglePlay(); });
    if (ui.hmPrev) ui.hmPrev.addEventListener('click', function () { window.REFUSAL_PLAYER.prev(); });
    if (ui.hmNext) ui.hmNext.addEventListener('click', function () { window.REFUSAL_PLAYER.next(); });
    if (ui.hmBar) ui.hmBar.addEventListener('click', function (e) {
      var r = ui.hmBar.getBoundingClientRect();
      window.REFUSAL_PLAYER.seek && window.REFUSAL_PLAYER.seek((e.clientX - r.left) / r.width);
    });
    // 播放器状态变化时同步首页播放器
    window.REFUSAL_PLAYER.setOnState(function () {
      var song = window.REFUSAL_PLAYER.getCurrent();
      if (!song) return;
      if (ui.hmTitle) ui.hmTitle.textContent = song.title || '—';
      if (ui.hmArtist) ui.hmArtist.textContent = song.artist || '';
      if (ui.hmCover) {
        ui.hmCover.style.backgroundImage = song.cover ? 'url(' + song.cover + ')' : '';
        ui.hmCover.classList.toggle('noimg', !song.cover);
      }
      if (ui.hmPlay) ui.hmPlay.textContent = window.REFUSAL_PLAYER.isPlaying() ? '⏸' : '▶';
    });
    // 首次同步一次
    var firstSong = window.REFUSAL_PLAYER.getCurrent();
    if (firstSong && ui.hmTitle) {
      ui.hmTitle.textContent = firstSong.title || '—';
      ui.hmArtist.textContent = firstSong.artist || '';
      if (ui.hmCover) {
        ui.hmCover.style.backgroundImage = firstSong.cover ? 'url(' + firstSong.cover + ')' : '';
        ui.hmCover.classList.toggle('noimg', !firstSong.cover);
      }
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

  /* ---------- 灯箱（支持多图切换） ---------- */
  var lb = document.getElementById('lightbox');
  var lbImages = [];   // 当前作品的图片列表
  var lbIndex = 0;
  var lbDesc = '';
  var lbCaption = '';
  function showLbImage(i) {
    if (!lbImages.length) return;
    if (i < 0) i = lbImages.length - 1;
    if (i >= lbImages.length) i = 0;
    lbIndex = i;
    document.getElementById('lb-img').src = lbImages[i];
    var countEl = document.getElementById('lb-count');
    if (lbImages.length > 1) {
      countEl.textContent = (i + 1) + ' / ' + lbImages.length;
      countEl.classList.remove('hidden');
      document.getElementById('lb-prev').classList.remove('hidden');
      document.getElementById('lb-next').classList.remove('hidden');
    } else {
      countEl.classList.add('hidden');
      document.getElementById('lb-prev').classList.add('hidden');
      document.getElementById('lb-next').classList.add('hidden');
    }
  }
  function openLightbox(w) {
    lbImages = (w.images && w.images.length) ? w.images.slice() : (w.img ? [w.img] : []);
    lbIndex = 0;
    lbCaption = w.id + ' · ' + w.title + ' · ' + catLabel(w.cat);
    lbDesc = w.desc || '';
    document.getElementById('lb-caption').textContent = lbCaption;
    var descEl = document.getElementById('lb-desc');
    if (lbDesc) {
      descEl.textContent = lbDesc;
      descEl.classList.remove('hidden');
    } else {
      descEl.textContent = '';
      descEl.classList.add('hidden');
    }
    showLbImage(0);
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
    // 旧版"最新作品"网格已被首页分类模块轮播替代
  }

  /* ---------- 首页分类模块轮播 ---------- */
  function renderHomeCats() {
    var box = document.getElementById('home-cats');
    if (!box) return;
    box.innerHTML = '';
    var cats = CFG.categories || [];
    cats.forEach(function (c) {
      var list = (CFG.works || []).filter(function (w) { return w.cat === c.id; });
      if (!list.length) return; // 空分类不显示
      var sec = document.createElement('div');
      sec.className = 'home-cat-sec';
      var head = document.createElement('div');
      head.className = 'home-cat-head';
      head.innerHTML =
        '<span class="home-cat-name">' + escHtml(c.label) + '</span>' +
        '<span class="home-cat-count">' + list.length + ' 件</span>' +
        '<a href="#works" data-sec="works" data-cat="' + escHtml(c.id) + '" class="home-cat-more">查看全部 →</a>';
      sec.appendChild(head);
      var track = document.createElement('div');
      track.className = 'cat-carousel';
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
        track.appendChild(card);
      });
      sec.appendChild(track);
      box.appendChild(sec);
    });
    // 分类"查看全部"跳转到作品区并应用筛选
    box.querySelectorAll('.home-cat-more').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        currentFilter = a.dataset.cat || 'all';
        showSection('works');
        renderFilters();
        renderWorks(currentFilter);
        history.replaceState(null, '', '#works');
      });
    });
  }

  /* ---------- 生活动态（说说） ---------- */
  function momentTypeLabel(m) {
    if (m.video) return '视频';
    if (m.images && m.images.length) return '图片';
    return '文字';
  }
  function renderMoments() {
    var grid = document.getElementById('moment-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!MOMENTS.length) {
      grid.innerHTML = '<p class="panel-note">[ 暂无动态，敬请期待 ]</p>';
      return;
    }
    MOMENTS.slice().reverse().forEach(function (m) {
      var card = document.createElement('div');
      card.className = 'moment-card';
      var media = '';
      if (m.video) {
        media = '<video class="moment-video" src="' + escHtml(m.video) + '" controls preload="metadata"></video>';
      } else if (m.images && m.images.length) {
        var first = m.images[0];
        media = '<div class="moment-media' + (m.images.length > 1 ? ' multi' : '') + '">' +
          '<img src="' + escHtml(first) + '" alt="" loading="lazy" decoding="async" data-imgs="' + escHtml(JSON.stringify(m.images)) + '">' +
          (m.images.length > 1 ? '<span class="moment-count">' + m.images.length + ' 图</span>' : '') +
          '</div>';
      }
      card.innerHTML =
        '<div class="moment-head">' +
          '<span class="moment-type">' + momentTypeLabel(m) + '</span>' +
          '<span class="moment-date">' + escHtml(m.date || '') + '</span>' +
        '</div>' +
        (m.text ? '<div class="moment-text">' + escHtml(m.text) + '</div>' : '') +
        media;
      // 多图点击 → 灯箱
      var img = card.querySelector('.moment-media img');
      if (img) {
        img.addEventListener('click', function () {
          var arr = [];
          try { arr = JSON.parse(img.dataset.imgs || '[]'); } catch (e) { arr = [img.src]; }
          lbImages = arr;
          lbIndex = 0;
          lbCaption = m.date + ' · 动态';
          lbDesc = m.text || '';
          document.getElementById('lb-caption').textContent = lbCaption;
          var descEl = document.getElementById('lb-desc');
          if (lbDesc) { descEl.textContent = lbDesc; descEl.classList.remove('hidden'); }
          else { descEl.textContent = ''; descEl.classList.add('hidden'); }
          showLbImage(0);
          lb.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
        });
      }
      grid.appendChild(card);
    });
  }

  /* ---------- 站内搜索 ---------- */
  function searchPanelOpen() {
    document.getElementById('search-panel').classList.remove('hidden');
    var inp = document.getElementById('search-input');
    inp.value = '';
    document.getElementById('search-results').innerHTML = '';
    setTimeout(function () { inp.focus(); }, 50);
  }
  function searchPanelClose() {
    document.getElementById('search-panel').classList.add('hidden');
  }
  function doSearch(q) {
    var results = document.getElementById('search-results');
    q = (q || '').trim().toLowerCase();
    if (!q) { results.innerHTML = ''; return; }
    var html = '';
    // 搜索作品
    var works = (CFG.works || []).filter(function (w) {
      return (w.title || '').toLowerCase().indexOf(q) >= 0 ||
             (w.desc || '').toLowerCase().indexOf(q) >= 0 ||
             (w.id || '').toLowerCase().indexOf(q) >= 0 ||
             catLabel(w.cat).toLowerCase().indexOf(q) >= 0;
    });
    // 搜索分类
    var cats = (CFG.categories || []).filter(function (c) {
      return (c.label || '').toLowerCase().indexOf(q) >= 0 || (c.id || '').toLowerCase().indexOf(q) >= 0;
    });
    // 搜索动态
    var moments = MOMENTS.filter(function (m) {
      return (m.text || '').toLowerCase().indexOf(q) >= 0;
    });
    if (!works.length && !cats.length && !moments.length) {
      results.innerHTML = '<p class="search-empty">[ 未找到与「' + escHtml(q) + '」相关的内容 ]</p>';
      return;
    }
    if (cats.length) {
      html += '<div class="search-group"><div class="search-group-title">分类</div>';
      cats.forEach(function (c) {
        html += '<div class="search-item search-cat" data-cat="' + escHtml(c.id) + '">🏷️ ' + escHtml(c.label) + '</div>';
      });
      html += '</div>';
    }
    if (works.length) {
      html += '<div class="search-group"><div class="search-group-title">作品 (' + works.length + ')</div>';
      works.slice(0, 8).forEach(function (w) {
        html += '<div class="search-item search-work" data-id="' + escHtml(w.id) + '">' +
          '<img src="' + escHtml(w.img) + '" alt="" class="search-thumb">' +
          '<span class="search-txt">' + escHtml(w.title) + ' · ' + escHtml(catLabel(w.cat)) + '</span>' +
          '</div>';
      });
      html += '</div>';
    }
    if (moments.length) {
      html += '<div class="search-group"><div class="search-group-title">动态 (' + moments.length + ')</div>';
      moments.slice(0, 5).forEach(function (m) {
        html += '<div class="search-item search-moment" data-id="' + escHtml(m.id) + '">💬 ' +
          escHtml((m.text || '').slice(0, 40)) + '</div>';
      });
      html += '</div>';
    }
    results.innerHTML = html;
    // 绑定点击
    results.querySelectorAll('.search-work').forEach(function (el) {
      el.addEventListener('click', function () {
        var w = (CFG.works || []).filter(function (x) { return x.id === el.dataset.id; })[0];
        if (w) { searchPanelClose(); showSection('works'); openLightbox(w); }
      });
    });
    results.querySelectorAll('.search-cat').forEach(function (el) {
      el.addEventListener('click', function () {
        searchPanelClose();
        currentFilter = el.dataset.cat;
        showSection('works');
        renderFilters();
        renderWorks(currentFilter);
      });
    });
    results.querySelectorAll('.search-moment').forEach(function (el) {
      el.addEventListener('click', function () {
        searchPanelClose();
        showSection('life');
      });
    });
  }
  function initSearch() {
    var openBtn = document.getElementById('search-open');
    var closeBtn = document.getElementById('search-close');
    var inp = document.getElementById('search-input');
    if (openBtn) openBtn.addEventListener('click', searchPanelOpen);
    if (closeBtn) closeBtn.addEventListener('click', searchPanelClose);
    if (inp) {
      inp.addEventListener('input', function () { doSearch(inp.value); });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') doSearch(inp.value);
        if (e.key === 'Escape') { searchPanelClose(); inp.blur(); }
      });
    }
    document.addEventListener('keydown', function (e) {
      // Ctrl/Cmd + K 打开搜索
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchPanelOpen();
      }
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
    initMusicPlayer();
    renderFilters();
    renderWorks('all');
    renderHomeStats();
    renderHomeCats();
    renderMoments();
    initThemeToggle();
    initToTop();
    initSearch();

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
    document.getElementById('lb-prev').addEventListener('click', function () { showLbImage(lbIndex - 1); });
    document.getElementById('lb-next').addEventListener('click', function () { showLbImage(lbIndex + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeLightbox(); searchPanelClose(); }
      if (!lb.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft') showLbImage(lbIndex - 1);
        if (e.key === 'ArrowRight') showLbImage(lbIndex + 1);
      }
    });
  }

  loadContent();
})();
