/* ============================================================
   REFUSAL OS — 自定义音乐播放器
   ▸ 原生 <audio> + 自绘 UI（进度条 / 音量 / 循环模式 / 歌单 / 可选歌词）
   ▸ 歌单项支持两种来源：
     - { type:'netease', id:'3023862', ... }  → 网易云外链播放
     - { type:'file', url:'assets/music/xxx.mp3', ... } → 自传文件
   ▸ 全局悬浮迷你播放器 + 面板播放器共享同一个 audio 实例
   ============================================================ */
(function () {
  'use strict';

  var audio = null;           // 共享 audio 元素
  var playlist = [];          // 歌单
  var index = -1;             // 当前曲目下标
  var isPlaying = false;
  var mode = 'loop';          // loop | single | random
  var volume = 0.8;
  var muted = false;
  var durations = {};         // 记忆每首歌时长
  var lyricLines = [];        // 当前歌词 [{time, text}]
  var lyricIdx = -1;
  var ui = {};                // DOM 引用
  var onState = null;         // 状态变化回调（首页/迷你同步）
  var errorCount = 0;         // 连续播放失败计数（用于自动跳过失效歌曲）

  /* ---------- 工具 ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function songUrl(song) {
    if (!song) return '';
    if (song.type === 'file') return song.url || '';
    if (song.type === 'netease' || song.id) {
      return 'https://music.163.com/song/media/outer/url?id=' + encodeURIComponent(song.id) + '.mp3';
    }
    return song.url || '';
  }
  function coverOf(song) {
    return (song && song.cover) || '';
  }

  /* ---------- 歌词解析（LRC） ---------- */
  function parseLrc(text) {
    var lines = [];
    if (!text) return lines;
    var re = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
    String(text).split('\n').forEach(function (raw) {
      var m, found = false;
      re.lastIndex = 0;
      while ((m = re.exec(raw)) !== null) {
        var t = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + (parseInt(m[3] || '0', 10) / 1000);
        var txt = raw.replace(re, '').trim();
        if (txt) { lines.push({ time: t, text: txt }); found = true; }
      }
      if (!found && raw.trim()) {
        // 无时间标签的整段（如标题），放在 0 秒
        lines.push({ time: 0, text: raw.trim() });
      }
    });
    lines.sort(function (a, b) { return a.time - b.time; });
    return lines;
  }

  /* ---------- 状态记忆 ---------- */
  function savePref() {
    try {
      localStorage.setItem('refusal-player', JSON.stringify({ mode: mode, volume: volume }));
    } catch (e) {}
  }
  function loadPref() {
    try {
      var p = JSON.parse(localStorage.getItem('refusal-player') || '{}');
      if (p.mode) mode = p.mode;
      if (typeof p.volume === 'number') volume = p.volume;
    } catch (e) {}
  }

  /* ---------- 播放核心 ---------- */
  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = 'metadata';
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', function () { isPlaying = true; setStatus(''); syncAll(); });
    audio.addEventListener('pause', function () { isPlaying = false; syncAll(); });
    // 缓冲/加载反馈
    audio.addEventListener('waiting', function () { if (!audio.paused) setStatus('加载中，请稍候…'); });
    audio.addEventListener('stalled', function () { if (!audio.paused) setStatus('网络缓冲中…'); });
    audio.addEventListener('canplay', function () { setStatus(''); });
    audio.addEventListener('playing', function () { setStatus(''); });
    audio.addEventListener('error', onAudioError);
    return audio;
  }

  function setStatus(msg) {
    if (ui.status) ui.status.textContent = msg || '';
  }

  /* 播放失败：自动尝试下一首，全部失败才提示 */
  function onAudioError() {
    errorCount++;
    if (errorCount >= playlist.length) {
      setStatus('播放失败，可能是版权限制或链接失效');
      return;
    }
    setStatus('当前歌曲无法播放，正在尝试下一首…');
    var a = ensureAudio();
    if (!a.paused) a.pause();
    setTimeout(function () { playIndex(index + 1, true); }, 400);
  }

  function playIndex(i, auto) {
    if (!playlist.length) return;
    if (i < 0) i = playlist.length - 1;
    if (i >= playlist.length) i = 0;
    index = i;
    errorCount = 0;
    var song = playlist[index];
    var src = songUrl(song);
    var a = ensureAudio();
    if (!src) { setStatus('该歌曲没有可用的音频链接'); return; }
    a.src = src;
    a.volume = muted ? 0 : volume;
    if (auto !== false) {
      a.play().catch(function () { setStatus('浏览器阻止了自动播放，请点击播放'); });
    }
    lyricLines = parseLrc(song.lrc || '');
    lyricIdx = -1;
    if (ui.lrcBox) {
      ui.lrcBox.innerHTML = '';
      ui.lrcBox.classList.toggle('hidden', !lyricLines.length);
      delete ui.lrcBox.dataset.built;
    }
    setStatus('');
    syncAll();
    if (onState) onState();
  }

  function togglePlay() {
    var a = ensureAudio();
    if (!playlist.length) return;
    if (index < 0) { playIndex(0); return; }
    if (a.paused) a.play().catch(function () {}); else a.pause();
  }
  function nextSong() {
    if (!playlist.length) return;
    if (mode === 'random') playIndex(Math.floor(Math.random() * playlist.length));
    else playIndex(index + 1);
  }
  function prevSong() {
    if (!playlist.length) return;
    var a = ensureAudio();
    if (a.currentTime > 3) { a.currentTime = 0; return; }
    if (mode === 'random') playIndex(Math.floor(Math.random() * playlist.length));
    else playIndex(index - 1);
  }
  function toggleMode() {
    mode = mode === 'loop' ? 'single' : mode === 'single' ? 'random' : 'loop';
    savePref();
    syncAll();
  }
  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    muted = volume === 0;
    var a = ensureAudio();
    a.volume = muted ? 0 : volume;
    savePref();
    syncAll();
  }
  function toggleMute() {
    muted = !muted;
    var a = ensureAudio();
    a.volume = muted ? 0 : volume;
    savePref();
    syncAll();
  }
  function seek(ratio) {
    var a = ensureAudio();
    if (!isFinite(a.duration) || a.duration <= 0) return;
    a.currentTime = ratio * a.duration;
    syncAll();
  }

  /* ---------- 事件 ---------- */
  function onTimeUpdate() {
    if (!audio) return;
    syncProgress();
    // 歌词滚动
    if (lyricLines.length && ui.lrcBox) {
      var t = audio.currentTime;
      var idx = -1;
      for (var i = 0; i < lyricLines.length; i++) {
        if (lyricLines[i].time <= t + 0.05) idx = i; else break;
      }
      if (idx !== lyricIdx) {
        lyricIdx = idx;
        var children = ui.lrcBox.children;
        for (var k = 0; k < children.length; k++) {
          children[k].classList.toggle('on', k === idx);
        }
        if (idx >= 0 && children[idx] && children[idx].scrollIntoView) {
          children[idx].scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
    }
  }
  function onLoadedMetadata() {
    if (!audio) return;
    durations[index] = audio.duration;
    syncAll();
  }
  function onEnded() {
    if (mode === 'single') {
      audio.currentTime = 0;
      audio.play().catch(function () {});
      return;
    }
    nextSong();
  }

  /* ---------- 渲染 ---------- */
  function currentSong() { return playlist[index] || null; }

  /* 封面旋转：黑胶唱片播放时始终旋转；小封面有图才旋转 */
  function syncSpin() {
    if (!ui) return;
    if (ui.cover) ui.cover.classList.toggle('spinning', isPlaying);
    [ui.miniCover, ui.hmCover].forEach(function (el) {
      if (!el) return;
      if (isPlaying && !el.classList.contains('noimg')) el.classList.add('spinning');
      else el.classList.remove('spinning');
    });
  }

  function syncAll() {
    syncProgress();
    syncSpin();
    renderMini();
    renderPanel();
    renderList();
    syncControls();
    if (onState) onState();
  }

  function syncProgress() {
    if (!ui) return;
    var a = audio;
    var d = (a && isFinite(a.duration) && a.duration > 0) ? a.duration : (durations[index] || 0);
    var t = (a && isFinite(a.currentTime)) ? a.currentTime : 0;
    var ratio = d > 0 ? Math.min(1, t / d) : 0;
    if (ui.curTime) ui.curTime.textContent = fmt(t);
    if (ui.durTime) ui.durTime.textContent = fmt(d);
    if (ui.hmCur) ui.hmCur.textContent = fmt(t);
    if (ui.hmDur) ui.hmDur.textContent = fmt(d);
    if (ui.progFill) ui.progFill.style.width = (ratio * 100) + '%';
    if (ui.hmFill) ui.hmFill.style.width = (ratio * 100) + '%';
    if (ui.miniFill) ui.miniFill.style.width = (ratio * 100) + '%';
    if (ui.progBar && ui.progBar.dataset.drag !== '1') {
      ui.progBar.dataset.ratio = String(ratio);
    }
    if (ui.hmBar && ui.hmBar.dataset.drag !== '1') {
      ui.hmBar.dataset.ratio = String(ratio);
    }
  }

  /* 进度条拖动（面板 + 首页） */
  function bindDrag(bar, fill, onSeek) {
    if (!bar) return;
    var dragging = false;
    function update(e) {
      var r = bar.getBoundingClientRect();
      var ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      if (fill) fill.style.width = (ratio * 100) + '%';
      return ratio;
    }
    bar.addEventListener('mousedown', function (e) {
      dragging = true;
      bar.dataset.drag = '1';
      update(e);
    });
    window.addEventListener('mousemove', function (e) {
      if (dragging) update(e);
    });
    window.addEventListener('mouseup', function (e) {
      if (!dragging) return;
      dragging = false;
      delete bar.dataset.drag;
      onSeek(update(e));
    });
    bar.addEventListener('click', function (e) {
      onSeek(update(e));
    });
  }

  function renderMini() {
    if (!ui.mini) return;
    var song = currentSong();
    ui.mini.classList.toggle('hidden', !song);
    if (!song) return;
    ui.miniTitle.textContent = song.title || '未知歌曲';
    ui.miniArtist.textContent = song.artist || '';
    ui.miniPlay.textContent = isPlaying ? '⏸' : '▶';
    var cv = coverOf(song);
    ui.miniCover.style.backgroundImage = cv ? 'url(' + cv + ')' : '';
    ui.miniCover.classList.toggle('noimg', !cv);
  }

  function renderPanel() {
    if (!ui.panel) return;
    var song = currentSong();
    if (!song) {
      ui.panel.classList.add('hidden');
      return;
    }
    ui.panel.classList.remove('hidden');
    ui.title.textContent = song.title || '未知歌曲';
    ui.artist.textContent = song.artist || '';
    var cv = coverOf(song);
    var label = ui.cover ? ui.cover.querySelector('.vinyl-label') : null;
    if (label) {
      label.style.backgroundImage = cv ? 'url(' + cv + ')' : '';
      label.classList.toggle('noimg', !cv);
    }
    ui.playBtn.textContent = isPlaying ? '⏸' : '▶';
    ui.modeBtn.textContent = mode === 'loop' ? '🔁' : mode === 'single' ? '🔂' : '🔀';
    ui.modeBtn.title = mode === 'loop' ? '列表循环' : mode === 'single' ? '单曲循环' : '随机播放';
    ui.muteBtn.textContent = muted ? '🔇' : '🔊';
    ui.volFill.style.width = (volume * 100) + '%';
    // 歌词
    if (ui.lrcBox) {
      if (lyricLines.length) {
        ui.lrcBox.classList.remove('hidden');
        if (!ui.lrcBox.dataset.built) {
          ui.lrcBox.innerHTML = lyricLines.map(function (l, i) {
            return '<p class="lrc-line' + (i === 0 ? ' on' : '') + '">' + esc(l.text) + '</p>';
          }).join('');
          ui.lrcBox.dataset.built = '1';
        }
      } else {
        ui.lrcBox.classList.add('hidden');
      }
    }
  }

  function renderList() {
    if (!ui.list) return;
    ui.list.innerHTML = '';
    playlist.forEach(function (s, i) {
      var li = document.createElement('li');
      li.className = 'p-item' + (i === index ? ' on' : '');
      var cv = coverOf(s);
      var dur = durations[i] ? fmt(durations[i]) : '';
      li.innerHTML =
        '<span class="p-item-cover">' + (cv ? '<img src="' + esc(cv) + '" alt="">' : '🎵') + '</span>' +
        '<span class="p-idx">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="p-info"><span class="p-title">' + esc(s.title || '未知歌曲') + '</span>' +
        '<span class="p-artist">' + esc(s.artist || '') + '</span></span>' +
        (dur ? '<span class="p-item-dur">' + dur + '</span>' : '') +
        '<span class="p-tag">' + (s.type === 'file' ? '自传' : '云') + '</span>';
      li.addEventListener('click', function () {
        if (i === index) { togglePlay(); } else { playIndex(i); }
      });
      ui.list.appendChild(li);
    });
  }

  function syncControls() {
    if (!ui) return;
    if (ui.playBtn) ui.playBtn.textContent = isPlaying ? '⏸' : '▶';
    if (ui.miniPlay) ui.miniPlay.textContent = isPlaying ? '⏸' : '▶';
  }

  /* ---------- 初始化 ---------- */
  function bindEvents() {
    // 面板播放器
    if (ui.playBtn) ui.playBtn.addEventListener('click', togglePlay);
    if (ui.prevBtn) ui.prevBtn.addEventListener('click', prevSong);
    if (ui.nextBtn) ui.nextBtn.addEventListener('click', nextSong);
    if (ui.modeBtn) ui.modeBtn.addEventListener('click', toggleMode);
    if (ui.muteBtn) ui.muteBtn.addEventListener('click', toggleMute);
    if (ui.volBar) {
      ui.volBar.addEventListener('click', function (e) {
        var r = ui.volBar.getBoundingClientRect();
        setVolume((e.clientX - r.left) / r.width);
      });
    }
    if (ui.progBar) {
      bindDrag(ui.progBar, ui.progFill, seek);
    }
    if (ui.hmBar) {
      bindDrag(ui.hmBar, ui.hmFill, seek);
    }
    // 迷你播放器
    if (ui.miniPlay) ui.miniPlay.addEventListener('click', togglePlay);
    if (ui.miniPrev) ui.miniPrev.addEventListener('click', prevSong);
    if (ui.miniNext) ui.miniNext.addEventListener('click', nextSong);
    if (ui.mini) ui.mini.addEventListener('click', function (e) {
      // 点击非按钮区域 → 跳到 MUSIC 面板
      if (e.target.closest && !e.target.closest('button')) {
        var link = document.querySelector('[data-sec="music"]');
        if (link) link.click();
      }
    });
  }

  function init(opts) {
    opts = opts || {};
    playlist = opts.playlist || [];
    ui = opts.ui || {};
    loadPref();
    bindEvents();
    if (playlist.length && !opts.noAuto) {
      playIndex(0, true);
    } else if (playlist.length) {
      // noAuto：只预载第一首（显示歌名/时长），不自动播放
      playIndex(0, false);
    } else {
      syncAll();
    }
  }

  function setPlaylist(list) {
    playlist = list || [];
    if (playlist.length) playIndex(0, true);
    else { index = -1; syncAll(); }
  }

  function setOnState(fn) { onState = fn; }

  window.REFUSAL_PLAYER = {
    init: init,
    setPlaylist: setPlaylist,
    setOnState: setOnState,
    togglePlay: togglePlay,
    next: nextSong,
    prev: prevSong,
    seek: seek,
    getCurrent: currentSong,
    isPlaying: function () { return isPlaying; }
  };
})();
