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
    return Promise.race([
      fetch(url, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; }),
      new Promise(function (resolve) { setTimeout(function () { resolve(null); }, 6000); })
    ]).catch(function () { return null; });
  }

  async function loadContent() {
    var all = await Promise.all([
      tryFetch('content/site.json'),
      tryFetch('content/works.json'),
      tryFetch('content/categories.json'),
      tryFetch('content/music.json'),
      tryFetch('content/moments.json')
    ]);
    var site = all[0], works = all[1], cats = all[2], music = all[3], moments = all[4];
    if (site) CFG = Object.assign({}, CFG, site);
    if (works && Array.isArray(works.works)) CFG.works = works.works;
    if (cats) {
      if (Array.isArray(cats.categories)) CFG.categories = cats.categories;
      if (Array.isArray(cats.petCategories)) CFG.petCategories = cats.petCategories;
      if (Array.isArray(cats.photoCategories)) CFG.photoCategories = cats.photoCategories;
    }
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
    var el;
    // 侧栏名字：按换行拆成「小字 HELLO」+「大字 refusal·」两段
    var kickerRaw = String(h.kicker || "HELLO, I'M\nrefusal·");
    var kickerLines = kickerRaw.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var kickerHi = kickerLines.length > 1 ? kickerLines[0] : '';
    var kickerName = kickerLines.length > 1 ? kickerLines[1] : (kickerLines[0] || 'refusal·');
    if ((el = document.getElementById('hero-kicker'))) {
      el.innerHTML = '';
      if (kickerHi) {
        var hi = document.createElement('span');
        hi.className = 'sk-hi';
        hi.textContent = kickerHi;
        el.appendChild(hi);
      }
      var nm = document.createElement('span');
      nm.className = 'sk-name';
      nm.textContent = kickerName;
      el.appendChild(nm);
    }
    if ((el = document.getElementById('wm-kicker'))) {
      el.textContent = (kickerHi ? kickerHi + ' ' : '') + kickerName;
    }
    if ((el = document.getElementById('hero-slogan'))) {
      el.innerHTML = '';
      String(h.slogan || '').split('\n').filter(function (l) { return l.trim(); }).forEach(function (line, i) {
        var s = document.createElement('span');
        s.className = 'hero-slogan-line' + (i === 1 ? ' alt' : '');
        s.textContent = line;
        el.appendChild(s);
      });
    }
    if ((el = document.getElementById('hero-desc'))) el.textContent = h.desc || '';
    // 话题标签 → 胶囊样式
    if ((el = document.getElementById('hero-hashtags'))) {
      el.innerHTML = '';
      String(h.hashTags || '').split(/\s+/).filter(Boolean).forEach(function (t) {
        var s = document.createElement('span');
        s.className = 'hero-tag-pill';
        s.textContent = t;
        el.appendChild(s);
      });
    }
    if ((el = document.getElementById('side-status'))) el.textContent = h.status || '';
    if ((el = document.getElementById('home-contact-email'))) el.textContent = CFG.contactEmail || 'hello@refusal.site';
    if ((el = document.getElementById('home-note-text'))) el.textContent = CFG.note || '';
    // 标题字号（可配置缩放）
    var ts = parseFloat(h.titleScale);
    if (!isFinite(ts) || ts <= 0) ts = 1;
    document.documentElement.style.setProperty('--title-scale', ts);
    // 所有页签标题字号（单独配置缩放）
    var sts = parseFloat(CFG.secTitleScale);
    if (!isFinite(sts) || sts <= 0) sts = 1;
    document.documentElement.style.setProperty('--sec-title-scale', sts);
    // 站点名
    if (CFG.siteName) {
      var logo = document.querySelector('.os-logo');
      if (logo && !logo.dataset.custom) { logo.textContent = '💠 ' + CFG.siteName; logo.dataset.custom = '1'; }
      document.title = CFG.siteName + ' | REFUSAL OS';
    }
    var av = document.getElementById('avatar-img');
    if (av && CFG.avatar) av.src = CFG.avatar;
  }

  /* ---------- 渲染全局侧栏导航（配置化） ---------- */
  function renderNav() {
    var box = document.getElementById('side-nav');
    if (!box) return;
    var nav = (CFG.nav && CFG.nav.length) ? CFG.nav : [
      { id: 'home', label: '我的主页', icon: '🏠' },
      { id: 'life', label: '我的动态', icon: '💬' },
      { id: 'works', label: '我的作品', icon: '🎨' },
      { id: 'video', label: '我的视频', icon: '🎬' },
      { id: 'music', label: '我的音乐', icon: '🎵' },
      { id: 'about', label: '关于我', icon: '👤' },
      { id: 'contact', label: '联系方式', icon: '✉️' },
      { id: 'game', label: '小游戏', icon: '🎮' }
    ];
    box.innerHTML = '';
    nav.forEach(function (n) {
      var a = document.createElement('a');
      a.className = 'side-nav-link';
      a.href = '#' + n.id;
      a.dataset.sec = n.id;
      if (n.cat) a.dataset.cat = n.cat;
      a.innerHTML = '<span class="sn-ico">' + (n.icon || '▸') + '</span><span class="sn-label">' + escHtml(n.label) + '</span>';
      box.appendChild(a);
    });
    // 重新绑定面板切换（统一由 showSection 处理，避免重复绑定）
    box.querySelectorAll('[data-sec]').forEach(function (l) {
      l.addEventListener('click', function (e) {
        e.preventDefault();
        currentFilter = l.dataset.cat || 'all';
        showSection(l.dataset.sec);
        history.replaceState(null, '', '#' + l.dataset.sec);
      });
    });
    // 激活态同步
    function syncActive() {
      var cur = location.hash.slice(1) || 'home';
      box.querySelectorAll('[data-sec]').forEach(function (l) {
        l.classList.toggle('active', l.dataset.sec === cur);
      });
    }
    window.addEventListener('hashchange', syncActive);
    syncActive();
  }

  /* ---------- 渲染关于 / 联系 ---------- */
  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // 缩略图路径：大图 work-001.jpg → 缩略图 work-001-thumb.jpg
  function thumbPath(p) { return String(p || '').replace(/(\.\w+)$/, '-thumb$1'); }
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
      hmDur: document.getElementById('hm-dur'),
      lrcToggle: document.getElementById('p-lrc-toggle')
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
      var hmBox = document.querySelector('.side-music');
      if (hmBox) hmBox.classList.toggle('playing', window.REFUSAL_PLAYER.isPlaying());
      if (!song) return;
      if (ui.hmTitle) ui.hmTitle.textContent = song.title || '—';
      if (ui.hmArtist) ui.hmArtist.textContent = song.artist || '';
      if (ui.hmCover) {
        ui.hmCover.style.backgroundImage = song.cover ? 'url(' + song.cover + ')' : '';
        ui.hmCover.classList.toggle('noimg', !song.cover);
      }
      if (ui.hmPlay) ui.hmPlay.textContent = window.REFUSAL_PLAYER.isPlaying() ? '⏸' : '▶';
    });
    // 初始化播放器（传入歌单 + 全部 UI 引用）
    // noAuto: true —— 不自动播放，避免浏览器自动播放策略拦截，用户点击后再播放
    window.REFUSAL_PLAYER.init({ playlist: list, ui: ui, noAuto: true });
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
  // 兜底：即使初始化卡住，也保证「进入系统」按钮可用（4 秒后强制显示）
  if (enterBtn) {
    enterBtn.addEventListener('click', function () { markBooted(); enterOS(); });
    setTimeout(function () { enterBtn.classList.remove('hidden'); }, 4000);
  }

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
    document.getElementById('clock').textContent =
      d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
      p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  /* ---------- 导航 ---------- */
  var currentFilter = 'all';
  var petFilter = 'all';
  var photoFilter = 'all';
  function showSection(id) {
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.toggle('active', p.id === id); });
    document.querySelectorAll('.side-nav-link, .nav-link').forEach(function (l) {
      l.classList.toggle('active', l.dataset.sec === id);
    });
    if (id !== 'game') snPause(); // 离开小游戏面板自动暂停
    if (id === 'works') { renderFilters(); renderWorks(currentFilter); }
    else if (id === 'pet') { renderSubcatFilters('pet'); renderCatPanel('pet'); }
    else if (id === 'photo') { renderSubcatFilters('photo'); renderCatPanel('photo'); }
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
    // 作品面板：排除宠物/摄影（它们有独立分区）
    var cats = [{ id: 'all', label: '全部' }].concat((CFG.categories || []).filter(function (c) {
      return c.id !== 'pet' && c.id !== 'photo';
    }));
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
  function renderWorkList(gridId, list) {
    var grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';
    if (!list.length) {
      grid.innerHTML = '<p class="panel-note" style="grid-column:1/-1">[ 该分区暂无内容，敬请期待 ]</p>';
      return;
    }
    list.forEach(function (w) {
      var card = document.createElement('div');
      card.className = 'work-card';
      var hasImg = !!(w.images && w.images.length) || !!w.img;
      var hasVideo = !!(w.videos && w.videos.length);
      var singleVideo = !hasImg && hasVideo && w.videos.length === 1;
      var mediaHTML;
      if (hasImg) {
        mediaHTML = '<img src="' + escHtml(thumbPath(w.img)) + '" data-fb="' + escHtml(w.img) + '" alt="' + escHtml(w.title) + '" loading="lazy" decoding="async">';
      } else if (hasVideo) {
        // 纯视频作品：显示视频首帧预览 + 播放角标
        mediaHTML = '<div class="work-thumb-video"><video src="' + escHtml(w.videos[0]) + '" muted playsinline preload="metadata"></video><span class="work-video-play">▶</span></div>';
      } else {
        mediaHTML = '<div class="work-thumb-empty">🎬</div>';
      }
      card.innerHTML =
        '<span class="work-id">' + escHtml(w.id) + '</span>' +
        mediaHTML +
        (hasVideo ? '<span class="work-video-badge">🎬 ' + w.videos.length + '</span>' : '') +
        '<div class="work-meta"><span class="work-name">' + escHtml(w.title) + '</span>' +
        '<span class="work-cat">' + escHtml(catLabel(w.cat)) + (w.subcat ? ' · ' + escHtml(w.subcat) : '') + '</span></div>' +
        (w.desc ? '<p class="work-desc">' + escHtml(w.desc) + '</p>' : '') +
        '<div class="cat-bar"></div>';
      card.addEventListener('click', function () {
        // 单视频作品：和「动态」一致，点卡片直接内联播放；多图/多视频则打开灯箱
        if (singleVideo) {
          var v = card.querySelector('.work-thumb-video video');
          if (v) {
            if (v.paused) {
              v.muted = false; v.controls = true; v.play();
              var badge = card.querySelector('.work-video-play');
              if (badge) badge.style.display = 'none';
            } else { v.pause(); }
          }
        } else {
          openLightbox(w);
        }
      });
      grid.appendChild(card);
    });
  }
  function renderWorks(cat) {
    // 最新在前（作品无日期字段，按添加顺序倒序）
    var list = (CFG.works || []).slice().reverse().filter(function (w) { return w.cat !== 'pet' && w.cat !== 'photo'; });
    if (cat !== 'all') list = list.filter(function (w) { return w.cat === cat; });
    renderWorkList('work-grid', list);
  }
  function subcatList(cat) {
    var seen = [];
    var conf = cat === 'pet' ? (CFG.petCategories || []) : (CFG.photoCategories || []);
    conf.forEach(function (c) { if (c && c.label && seen.indexOf(c.label) < 0) seen.push(c.label); });
    (CFG.works || []).forEach(function (w) {
      if (w.cat === cat && w.subcat && seen.indexOf(w.subcat) < 0) seen.push(w.subcat);
    });
    return seen;
  }
  function renderSubcatFilters(cat) {
    var box = document.getElementById(cat + '-filters');
    if (!box) return;
    box.innerHTML = '';
    var cur = (cat === 'pet' ? petFilter : photoFilter) || 'all';
    var items = [{ id: 'all', label: '全部' }].concat(subcatList(cat).map(function (s) {
      return { id: s, label: s };
    }));
    items.forEach(function (it) {
      var b = document.createElement('button');
      b.className = 'filter-btn' + (it.id === cur ? ' active' : '');
      b.textContent = it.label;
      b.dataset.cat = it.id;
      b.addEventListener('click', function () {
        if (cat === 'pet') petFilter = it.id; else photoFilter = it.id;
        renderSubcatFilters(cat);
        renderCatPanel(cat);
      });
      box.appendChild(b);
    });
  }
  function renderCatPanel(cat) {
    // 最新在前
    var list = (CFG.works || []).slice().reverse().filter(function (w) { return w.cat === cat; });
    var f = (cat === 'pet' ? petFilter : photoFilter) || 'all';
    if (f !== 'all') list = list.filter(function (w) { return w.subcat === f; });
    renderWorkList(cat + '-grid', list);
  }

  /* ---------- 灯箱（支持多图切换） ---------- */
  var lb = document.getElementById('lightbox');
  var lbItems = [];   // 当前作品的图片列表
  var lbIndex = 0;
  var lbDesc = '';
  var lbCaption = '';
  function showLbItem(i, muted) {
    if (!lbItems.length) return;
    if (i < 0) i = lbItems.length - 1;
    if (i >= lbItems.length) i = 0;
    lbIndex = i;
    var item = lbItems[i];
    if (typeof item === 'string') item = { type: 'image', src: item };
    var imgEl = document.getElementById('lb-img');
    var vidEl = document.getElementById('lb-video');
    if (item.type === 'video') {
      imgEl.style.display = 'none';
      vidEl.style.display = '';
      vidEl.muted = !!muted;
      vidEl.src = item.src;
      var _p = vidEl.play();
      if (_p && _p.catch) _p.catch(function () {});
    } else {
      vidEl.style.display = 'none';
      vidEl.pause();
      imgEl.style.display = '';
      imgEl.src = item.src;
    }
    var countEl = document.getElementById('lb-count');
    if (lbItems.length > 1) {
      countEl.textContent = (i + 1) + ' / ' + lbItems.length;
      countEl.classList.remove('hidden');
      document.getElementById('lb-prev').classList.remove('hidden');
      document.getElementById('lb-next').classList.remove('hidden');
    } else {
      countEl.classList.add('hidden');
      document.getElementById('lb-prev').classList.add('hidden');
      document.getElementById('lb-next').classList.add('hidden');
    }
    var playBtn = document.getElementById('lb-play');
    if (playBtn) { if (lbItems.length > 1) playBtn.classList.remove('hidden'); else playBtn.classList.add('hidden'); }
  }
  var lbTimer = null;      // 图片自动切换定时器
  var lbGuard = null;      // 视频播放兜底定时器
  var lbAuto = false;      // 自动播放是否开启
  function lbStopAuto() {
    lbAuto = false;
    if (lbTimer) { clearTimeout(lbTimer); lbTimer = null; }
    if (lbGuard) { clearTimeout(lbGuard); lbGuard = null; }
    var pb = document.getElementById('lb-play');
    if (pb) pb.textContent = '▶';
    var v = document.getElementById('lb-video');
    if (v) { v.onended = null; v.onerror = null; }
  }
  function lbAutoAdvance() {
    if (!lbAuto) return;
    showLbItem(lbIndex + 1, true);
    lbSchedule();
  }
  function lbSchedule() {
    if (!lbAuto) return;
    if (lbTimer) { clearTimeout(lbTimer); lbTimer = null; }
    if (lbGuard) { clearTimeout(lbGuard); lbGuard = null; }
    var item = lbItems[lbIndex];
    var v = document.getElementById('lb-video');
    if (item && item.type === 'video') {
      // 视频：静音播放，播完自动切下一张；3 秒内没播起来就跳过
      var done = false;
      function fin() {
        if (done) return; done = true;
        if (lbGuard) { clearTimeout(lbGuard); lbGuard = null; }
        lbAutoAdvance();
      }
      v.onended = fin;
      v.onerror = fin;
      lbGuard = setTimeout(fin, 3000);
      var p = v.play();
      if (p && p.then) p.then(function () { if (lbGuard) { clearTimeout(lbGuard); lbGuard = null; } }).catch(fin);
      else if (lbGuard) { clearTimeout(lbGuard); lbGuard = null; }
    } else {
      lbTimer = setTimeout(lbAutoAdvance, 3000);
    }
  }
  function lbToggleAuto() {
    if (lbAuto) { lbStopAuto(); return; }
    if (lbItems.length <= 1) return;
    lbAuto = true;
    document.getElementById('lb-play').textContent = '⏸';
    lbSchedule();
  }
  function showLightbox(imgs, caption, desc, startIndex) {
    lbItems = (imgs && imgs.length ? imgs : []).map(function (it) {
      return (typeof it === 'string') ? { type: 'image', src: it } : it;
    }).filter(function (it) { return it && it.src; });
    lbIndex = (typeof startIndex === 'number' && startIndex >= 0 && startIndex < lbItems.length) ? startIndex : 0;
    lbCaption = caption || '';
    lbDesc = desc || '';
    document.getElementById('lb-caption').textContent = lbCaption;
    var descEl = document.getElementById('lb-desc');
    if (lbDesc) {
      descEl.textContent = lbDesc;
      descEl.classList.remove('hidden');
    } else {
      descEl.textContent = '';
      descEl.classList.add('hidden');
    }
    if (!lbItems.length) return;
    showLbItem(lbIndex);
    lb.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function openLightbox(w) {
    var imgs = (w.images && w.images.length) ? w.images.slice() : (w.img ? [w.img] : []);
    var vids = (w.videos && w.videos.length) ? w.videos.slice() : [];
    var items = imgs.map(function (p) { return { type: 'image', src: p }; })
      .concat(vids.map(function (p) { return { type: 'video', src: p }; }));
    showLightbox(items, w.id + ' · ' + w.title + ' · ' + catLabel(w.cat), w.desc || '');
  }
  function closeLightbox() {
    lb.classList.add('hidden');
    document.body.style.overflow = '';
    lbStopAuto();
    var v = document.getElementById('lb-video');
    if (v) { v.pause(); v.src = ''; }
  }

  /* ---------- 首页模块（配置化：homeModules 数组驱动） ---------- */
  function renderHomeModules() {
    var box = document.getElementById('home-modules');
    if (!box) return;
    box.innerHTML = '';
    var modules = (CFG.homeModules && CFG.homeModules.length) ? CFG.homeModules : [
      { type: 'moments', title: '生活动态', sub: '记录日常，分享心情', sec: 'life' },
      { type: 'works', title: '最新作品', sub: '记录日常，分享心情', sec: 'works' },
      { type: 'pet', title: '宠物日常', sub: '记录日常，分享心情', sec: 'pet' },
      { type: 'photo', title: '摄影', sub: '随便拍拍', sec: 'photo' }
    ];
    var carouselOn = CFG.homeCarousel !== false; // 默认开启自动轮播
    var sizeCls = 'size-large';
    if (CFG.homeCardSize === 'compact') sizeCls = 'size-compact';
    else if (CFG.homeCardSize === 'normal') sizeCls = 'size-normal';
    // 大标题「最新动态」
    var stitle = document.createElement('div');
    stitle.className = 'home-sec-title';
    stitle.innerHTML = '<span class="tick">▸</span> 最新动态';
    box.appendChild(stitle);
    // 分类卡片展示区
    var grid = document.createElement('div');
    grid.className = 'home-cat-cards ' + sizeCls;
    modules.forEach(function (mod) {
      var media = collectModuleMedia(mod);
      var hasMedia = media.length > 0;
      // 静态封面：取最新的一张图片（无图片则用 🎬 占位）
      var thumb = null;
      for (var k = 0; k < media.length; k++) {
        if (media[k].type === 'image') { thumb = media[k].src; break; }
      }
      var card = document.createElement('div');
      card.className = 'home-cat-card' + (hasMedia ? '' : ' empty');
      var thumbHTML;
      if (!hasMedia) {
        thumbHTML = '<div class="hcc-thumb hcc-thumb-empty"><span class="hcc-empty-ico">🖼️</span></div>';
      } else if (carouselOn && media.length > 1) {
        // 自动轮播：图片定时切换 / 视频静音播放
        var slides = media.map(function (it, i) {
          if (it.type === 'video') {
            return '<video class="hcc-slide" src="' + escHtml(it.src) + '" muted playsinline preload="metadata"></video>';
          }
          return '<img class="hcc-slide" src="' + escHtml(thumbPath(it.src)) + '" data-fb="' + escHtml(it.src) + '" alt="" decoding="async"' + (i === 0 ? '' : ' loading="lazy"') + '>';
        }).join('');
        var dots = '<span class="hcc-dots">' + media.map(function (_, i) { return '<i' + (i === 0 ? ' class="on"' : '') + '></i>'; }).join('') + '</span>';
        thumbHTML = '<div class="hcc-thumb"><div class="hcc-carousel">' + slides + '</div>' + dots + '</div>';
      } else if (thumb) {
        thumbHTML = '<div class="hcc-thumb"><img src="' + escHtml(thumbPath(thumb)) + '" data-fb="' + escHtml(thumb) + '" alt="' + escHtml(mod.title || '') + '" loading="lazy" decoding="async"></div>';
      } else {
        thumbHTML = '<div class="hcc-thumb hcc-thumb-empty"><span class="hcc-empty-ico">🎬</span></div>';
      }
      card.innerHTML =
        thumbHTML +
        '<div class="hcc-body">' +
          '<span class="hcc-title">' + escHtml(mod.title || '') + '</span>' +
          (mod.sub ? '<span class="hcc-sub">' + escHtml(mod.sub) + '</span>' : '') +
        '</div>' +
        (hasMedia ? '<div class="hcc-likes">❤ ' + escHtml(mod.likes || '999') + '</div>' : '');
      if (carouselOn && media.length > 1) initCardCarousel(card);
      card.addEventListener('click', function () {
        if (card.dataset.swiping === '1') return; // 刚滑动/点过圆点，忽略这次点击
        if (hasMedia) {
          var startIdx = parseInt(card.dataset.slide, 10) || 0;
          showLightbox(media, mod.title || '', mod.sub || '', startIdx);
        } else if (mod.sec) {
          currentFilter = mod.cat || 'all';
          showSection(mod.sec);
          if (mod.sec === 'works') { renderFilters(); renderWorks(currentFilter); }
          history.replaceState(null, '', '#' + mod.sec);
        }
      });
      grid.appendChild(card);
    });
    box.appendChild(grid);
  }

  /* 首页卡片自动轮播：自动定时切换 + 手动滑动/点击圆点切换 */
  function initCardCarousel(card) {
    var root = card.querySelector('.hcc-carousel');
    if (!root) return;
    var slides = Array.prototype.slice.call(root.children);
    var dots = card.querySelectorAll('.hcc-dots i');
    var idx = 0;
    var timer = null;
    var startX = null, startY = null, dragging = false;
    function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }
    function pauseVideos() {
      slides.forEach(function (s) {
        if (s.tagName === 'VIDEO') { s.pause(); s.currentTime = 0; }
      });
    }
    function show(i) {
      idx = (i + slides.length) % slides.length;
      card.dataset.slide = String(idx);
      slides.forEach(function (s, k) { s.classList.toggle('on', k === idx); });
      if (dots.length) dots.forEach(function (d, k) { d.classList.toggle('on', k === idx); });
    }
    function next() { clearTimer(); pauseVideos(); show(idx + 1); play(); }
    function prev() { clearTimer(); pauseVideos(); show(idx - 1); play(); }
    function play() {
      // 图片/视频都按 3 秒定时切换；视频不自动播放（省内存），点卡片打开灯箱后再播放
      clearTimer();
      timer = setTimeout(next, 3000);
    }
    function markSwiped() {
      // 标记刚滑动/点过圆点，忽略紧随其后的 click，避免误开灯箱
      card.dataset.swiping = '1';
      setTimeout(function () { delete card.dataset.swiping; }, 120);
    }
    function onSwipe(dx, dy) {
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
        markSwiped();
        if (dx < 0) next(); else prev();
      }
    }
    // 触摸滑动（手机）
    root.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX; startY = e.touches[0].clientY; dragging = true;
    }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (!dragging) return;
      dragging = false;
      onSwipe(e.changedTouches[0].clientX - startX, e.changedTouches[0].clientY - startY);
    });
    // 鼠标拖拽滑动（桌面）
    root.addEventListener('mousedown', function (e) {
      startX = e.clientX; startY = e.clientY; dragging = true;
      e.preventDefault();
    });
    root.addEventListener('mouseup', function (e) {
      if (!dragging) return;
      dragging = false;
      onSwipe(e.clientX - startX, e.clientY - startY);
    });
    root.addEventListener('mouseleave', function () { dragging = false; });
    // 圆点点击切换
    if (dots.length) {
      dots.forEach(function (d, k) {
        d.addEventListener('click', function (e) {
          e.stopPropagation();
          markSwiped();
          clearTimer(); pauseVideos(); show(k); play();
        });
      });
    }
    show(0);
    play();
  }

  /* 收集某分类卡片的全部媒体（图片 + 视频），统一按"最新在前"排序，供灯箱切换 */
  function collectModuleMedia(mod) {
    var items = [];
    if (mod.type === 'moments') {
      var moments = sortMomentsDesc(MOMENTS.filter(function (m) { return !isEmptyMoment(m); }));
      moments.forEach(function (m) {
        (m.images || []).forEach(function (im) { items.push({ type: 'image', src: im }); });
        var vids = (m.videos && m.videos.length) ? m.videos : (m.video ? [m.video] : []);
        vids.forEach(function (v) { items.push({ type: 'video', src: v }); });
      });
    } else if (mod.type === 'works' || mod.type === 'pet' || mod.type === 'photo') {
      // 作品无日期字段：按添加顺序，最新（数组末尾）在前
      var works = (CFG.works || []).slice().reverse();
      if (mod.type === 'pet') works = works.filter(function (w) { return w.cat === 'pet'; });
      else if (mod.type === 'photo') works = works.filter(function (w) { return w.cat === 'photo'; });
      else works = works.filter(function (w) { return w.cat !== 'pet' && w.cat !== 'photo'; });
      works.forEach(function (w) {
        var list = (w.images && w.images.length) ? w.images : (w.img ? [w.img] : []);
        list.forEach(function (im) { items.push({ type: 'image', src: im }); });
        (w.videos || []).forEach(function (v) { items.push({ type: 'video', src: v }); });
      });
    }
    return items;
  }

  /* 动态按日期倒序（最新在前）；同一天按数组顺序倒序（后添加的更新） */
  function sortMomentsDesc(list) {
    return list
      .map(function (m, i) { return { m: m, i: i }; })
      .sort(function (a, b) {
        var da = String(a.m.date || '').replace(/[^0-9]/g, '');
        var db = String(b.m.date || '').replace(/[^0-9]/g, '');
        if (da !== db) return da > db ? -1 : 1;
        return b.i - a.i;
      })
      .map(function (x) { return x.m; });
  }

  /* ---------- 空动态判断（renderHomeModules / renderMoments 共用） ---------- */
  function isEmptyMoment(m) {
    return !(m.text || (m.images && m.images.length) || (m.videos && m.videos.length) || m.video);
  }

  /* ---------- 生活动态（说说） ---------- */
  function renderMoments() {
    var grid = document.getElementById('moment-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var list = sortMomentsDesc(MOMENTS.filter(function (m) { return !isEmptyMoment(m); }));
    if (!list.length) {
      grid.innerHTML = '<p class="panel-note">[ 暂无动态，敬请期待 ]</p>';
      return;
    }
    list.forEach(function (m, idx) {
      var videos = (m.videos && m.videos.length) ? m.videos : (m.video ? [m.video] : []);
      var imgs = m.images || [];
      var mediaItems = imgs.map(function (p) { return { type: 'image', src: p }; })
        .concat(videos.map(function (p) { return { type: 'video', src: p }; }));
      var hasMedia = mediaItems.length > 0;
      var card = document.createElement('div');
      card.className = 'moment-card' + (hasMedia ? ' has-media' : ' text-only');
      card.style.animationDelay = (idx * 40) + 'ms';
      var media = '';
      var countBadge = mediaItems.length > 1 ? '<span class="moment-count">' + mediaItems.length + '</span>' : '';
      if (imgs.length) {
        var first = imgs[0];
        media = '<div class="moment-media">' +
          '<img src="' + escHtml(thumbPath(first)) + '" data-fb="' + escHtml(first) + '" alt="" loading="lazy" decoding="async">' +
          '<span class="moment-type">图片</span>' +
          countBadge +
          '</div>';
      } else if (videos.length) {
        media = '<div class="moment-media">' +
          '<video class="moment-video" src="' + escHtml(videos[0]) + '" preload="metadata" muted playsinline></video>' +
          '<span class="moment-type">视频</span>' +
          '<span class="moment-play">▶</span>' +
          countBadge +
          '</div>';
      }
      card.innerHTML =
        media +
        (m.text ? '<div class="moment-text">' + escHtml(m.text) + '</div>' : '') +
        (m.tags ? '<div class="moment-tags">' + String(m.tags).split(/\s+/).filter(Boolean).map(function (t) { return '<span class="moment-tag">' + escHtml(t) + '</span>'; }).join('') + '</div>' : '') +
        '<div class="moment-foot">' +
          '<span class="moment-date">' + escHtml(m.date || '') + '</span>' +
          '<span class="moment-likes">❤ ' + escHtml(m.likes || '999') + '</span>' +
        '</div>';
      // 点击媒体：多图/多视频/混合 → 打开灯箱切换；单视频 → 内联播放
      var mediaEl = card.querySelector('.moment-media');
      if (mediaEl) {
        mediaEl.addEventListener('click', function () {
          if (mediaItems.length > 1) {
            showLightbox(mediaItems, m.date + ' · 动态', m.text || '');
          } else if (videos.length && !imgs.length) {
            var v = card.querySelector('.moment-media video');
            if (v) {
              if (v.paused) {
                v.muted = false; v.controls = true; v.play();
                var b = card.querySelector('.moment-play');
                if (b) b.style.display = 'none';
              } else { v.pause(); }
            }
          } else {
            showLightbox(imgs, m.date + ' · 动态', m.text || '');
          }
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
    // 顶栏搜索框（对齐交互图）
    var topSearch = document.getElementById('topbar-search');
    if (topSearch) {
      topSearch.addEventListener('focus', function(){ document.getElementById('search-panel').classList.remove('hidden'); });
      topSearch.addEventListener('input', function(){ doSearch(topSearch.value); document.getElementById('search-panel').classList.remove('hidden'); });
      topSearch.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ searchPanelClose(); topSearch.blur(); } });
    }
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

  /* ---------- 图片加载完成渐入（避免突兀闪现；兼容缓存图片） ---------- */
  function markImgLoaded(img) {
    if (!img || img.classList.contains('loaded')) return;
    // 缓存图片 complete 为 true 且 naturalWidth>0，直接显示
    if (img.complete && img.naturalWidth > 0) img.classList.add('loaded');
  }
  function initImgFade() {
    var selector = '.work-card img, .moment-media img, .hm-moment-media img, .compact-thumb img, .hcc-thumb img';
    document.addEventListener('load', function (e) {
      var t = e.target;
      if (t && t.tagName === 'IMG' && t.closest && t.closest(selector)) {
        t.classList.add('loaded');
      }
    }, true);
    // 缩略图加载失败（旧图无缩略图）→ 回退到原图
    document.addEventListener('error', function (e) {
      var t = e.target;
      if (t && t.tagName === 'IMG' && t.dataset.fb && !t.dataset.fellback) {
        t.dataset.fellback = '1';
        t.src = t.dataset.fb;
      }
    }, true);
    // 兜底：内容异步渲染，轮询检查已加载/缓存的图片
    var iv = setInterval(function () {
      var pending = document.querySelectorAll(selector + ':not(.loaded)');
      if (!pending.length) { clearInterval(iv); return; }
      pending.forEach(markImgLoaded);
    }, 500);
    setTimeout(function () { clearInterval(iv); }, 20000);
    // 立即检查一次（DOM 已就绪的图片）
    document.querySelectorAll(selector).forEach(markImgLoaded);
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

  /* ---------- 面板标题配置化 ---------- */
  var SEC_TITLES = {
    works: '我的作品 / WORKS',
    pet: '宠物日常 / PET',
    photo: '我的摄影 / PHOTO',
    video: '我的视频 / VIDEO',
    music: '我的音乐 / MUSIC',
    game: '小游戏 / MINI GAME',
    life: '我的动态 / LIFE',
    about: '关于我 / ABOUT',
    contact: '联系方式 / CONTACT'
  };
  function renderSecTitles() {
    Object.keys(SEC_TITLES).forEach(function (id) {
      var el = document.getElementById('sec-title-' + id);
      if (!el) return;
      var t = (CFG.secTitles && CFG.secTitles[id]) || SEC_TITLES[id];
      el.innerHTML = '<span class="tick">▸</span> ' + escHtml(t);
    });
  }

  /* ---------- 小游戏：贪吃蛇 ---------- */
  var SN = {
    cv: null, ctx: null, N: 18, cell: 20,
    snake: [], dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
    food: null, score: 0, best: 0,
    running: false, dead: false, timer: null
  };
  function snBest() {
    try { return parseInt(localStorage.getItem('refusal-snake-best'), 10) || 0; } catch (e) { return 0; }
  }
  function snSaveBest() {
    try { localStorage.setItem('refusal-snake-best', String(SN.best)); } catch (e) {}
  }
  function snUpdateScore() {
    var s = document.getElementById('game-score');
    var b = document.getElementById('game-best');
    if (s) s.textContent = String(SN.score);
    if (b) b.textContent = String(SN.best);
  }
  function snSpawnFood() {
    var p;
    do {
      p = { x: Math.floor(Math.random() * SN.N), y: Math.floor(Math.random() * SN.N) };
    } while (SN.snake.some(function (s) { return s.x === p.x && s.y === p.y; }));
    return p;
  }
  function snReset() {
    var c = Math.floor(SN.N / 2);
    SN.snake = [{ x: c, y: c }, { x: c - 1, y: c }, { x: c - 2, y: c }];
    SN.dir = { x: 1, y: 0 }; SN.nextDir = { x: 1, y: 0 };
    SN.score = 0; SN.dead = false;
    SN.food = snSpawnFood();
  }
  function snOverlay(title, hint, btn) {
    var ov = document.getElementById('game-overlay');
    if (!ov) return;
    ov.classList.remove('hidden');
    var t = document.getElementById('go-title');
    var h = document.getElementById('go-hint');
    var b = document.getElementById('game-start');
    if (t) t.textContent = title;
    if (h) h.innerHTML = hint;
    if (b) b.textContent = btn;
  }
  function snHideOverlay() {
    var ov = document.getElementById('game-overlay');
    if (ov) ov.classList.add('hidden');
  }
  function snDraw() {
    if (!SN.ctx || !SN.cv) return;
    var ctx = SN.ctx, n = SN.N, c = SN.cell, w = SN.cv.width;
    ctx.clearRect(0, 0, w, w);
    ctx.fillStyle = '#060a16';
    ctx.fillRect(0, 0, w, w);
    ctx.strokeStyle = 'rgba(0,240,255,.07)';
    ctx.lineWidth = 1;
    for (var i = 0; i <= n; i++) {
      ctx.beginPath(); ctx.moveTo(i * c, 0); ctx.lineTo(i * c, w); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * c); ctx.lineTo(w, i * c); ctx.stroke();
    }
    if (SN.food) {
      ctx.fillStyle = '#ff2d95';
      ctx.shadowColor = '#ff2d95'; ctx.shadowBlur = 12;
      ctx.fillRect(SN.food.x * c + 4, SN.food.y * c + 4, c - 8, c - 8);
      ctx.shadowBlur = 0;
    }
    SN.snake.forEach(function (s, i) {
      ctx.fillStyle = i === 0 ? '#00f0ff' : 'rgba(0,240,255,' + Math.max(0.25, 0.8 - i * 0.05) + ')';
      if (i === 0) { ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 14; }
      ctx.fillRect(s.x * c + 1, s.y * c + 1, c - 2, c - 2);
      ctx.shadowBlur = 0;
    });
  }
  function snGameOver() {
    SN.dead = true; SN.running = false;
    snStopLoop();
    snDraw();
    snOverlay('💀 GAME OVER', '本局得分 ' + SN.score + ' · 最高 ' + SN.best, '↻ 再来一局');
  }
  function snStep() {
    SN.dir = SN.nextDir;
    var head = SN.snake[0];
    var nx = head.x + SN.dir.x, ny = head.y + SN.dir.y;
    if (nx < 0 || ny < 0 || nx >= SN.N || ny >= SN.N) { snGameOver(); return; }
    if (SN.snake.some(function (s) { return s.x === nx && s.y === ny; })) { snGameOver(); return; }
    SN.snake.unshift({ x: nx, y: ny });
    if (SN.food && nx === SN.food.x && ny === SN.food.y) {
      SN.score++;
      if (SN.score > SN.best) { SN.best = SN.score; snSaveBest(); }
      SN.food = snSpawnFood();
    } else {
      SN.snake.pop();
    }
    snDraw();
    snUpdateScore();
  }
  function snStartLoop() {
    snStopLoop();
    SN.timer = setInterval(snStep, 140);
  }
  function snStopLoop() {
    if (SN.timer) { clearInterval(SN.timer); SN.timer = null; }
  }
  function snStart() {
    if (SN.running) return;
    if (SN.dead) snReset();
    SN.running = true;
    snHideOverlay();
    snDraw();
    snUpdateScore();
    snStartLoop();
  }
  function snPause() {
    if (!SN.running) return;
    SN.running = false;
    snStopLoop();
    snOverlay('⏸ 已暂停', '按空格或点击按钮继续', '▶ 继续');
  }
  function snToggle() {
    if (SN.running) snPause();
    else snStart();
  }
  function snSetDir(x, y) {
    if (SN.dir.x === -x && SN.dir.y === -y) return; // 禁止 180° 掉头
    if (SN.dir.x === x && SN.dir.y === y) return;
    SN.nextDir = { x: x, y: y };
  }
  function initGame() {
    var cv = document.getElementById('game-canvas');
    if (!cv) return;
    SN.cv = cv;
    SN.ctx = cv.getContext('2d');
    SN.cell = cv.width / SN.N;
    SN.best = snBest();
    snReset();
    snDraw();
    snUpdateScore();
    var startBtn = document.getElementById('game-start');
    if (startBtn) startBtn.addEventListener('click', snToggle);
    // 方向按钮（移动端）
    document.querySelectorAll('.dpad-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = b.dataset.dir;
        if (d === 'up') snSetDir(0, -1);
        else if (d === 'down') snSetDir(0, 1);
        else if (d === 'left') snSetDir(-1, 0);
        else if (d === 'right') snSetDir(1, 0);
        if (!SN.running && !SN.dead) snStart();
      });
    });
    // 键盘（仅小游戏面板激活时生效）
    document.addEventListener('keydown', function (e) {
      var gamePanel = document.getElementById('game');
      if (!gamePanel || !gamePanel.classList.contains('active')) return;
      var k = e.key;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); snSetDir(0, -1); }
      else if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); snSetDir(0, 1); }
      else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); snSetDir(-1, 0); }
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); snSetDir(1, 0); }
      else if (k === ' ') { e.preventDefault(); snToggle(); }
    });
  }

  /* ---------- 初始化 ---------- */
  function init() {
    applyTheme();
    applyVisitorTheme();
    renderHero();
    renderNav();
    renderSecTitles();
    renderText();
    renderVideo();
    initMusicPlayer();
    renderFilters();
    renderWorks('all');
    renderHomeModules();
    renderMoments();
    initImgFade();
    initThemeToggle();
    initToTop();
    initSearch();
    initGame();

    if (shouldSkipBoot()) {
      skipBoot();
    } else if (new URLSearchParams(location.search).get('skip') === '1') {
      skipBoot();
    }
    boot();

    setInterval(tick, 1000);
    tick();

    document.querySelectorAll('[data-sec]').forEach(function (l) {
      if (l.closest('#side-nav')) return; // 侧栏导航已在 renderNav 绑定
      l.addEventListener('click', function (e) {
        e.preventDefault();
        currentFilter = l.dataset.cat || 'all';
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
    document.getElementById('lb-prev').addEventListener('click', function () { showLbItem(lbIndex - 1); });
    document.getElementById('lb-next').addEventListener('click', function () { showLbItem(lbIndex + 1); });
    document.getElementById('lb-play').addEventListener('click', lbToggleAuto);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeLightbox(); searchPanelClose();
        if (window.REFUSAL_PLAYER && window.REFUSAL_PLAYER.closeLrc) window.REFUSAL_PLAYER.closeLrc();
      }
      if (!lb.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft') showLbItem(lbIndex - 1);
        if (e.key === 'ArrowRight') showLbItem(lbIndex + 1);
      }
    });
  }

  loadContent();
})();
