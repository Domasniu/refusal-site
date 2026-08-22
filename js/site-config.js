/* ============================================================
   REFUSAL OS — 站点配置（站长工具修改的就是这个文件）
   ▸ 主题：theme 填上面 palettes.js 里的 id
   ▸ 作品：works 数组里加一行
   ▸ 音乐：netease 粘贴网易云外链播放器代码
   ▸ 视频：填主页链接，留空显示"即将上线"
   ============================================================ */
window.SITE_CONFIG = {
  /* -------- 头像 -------- */
  avatar: 'assets/avatar.jpg',

  /* -------- 主题 -------- */
  theme: 'cyber-cyan',

  /* -------- 站点名 / 主页文字 -------- */
  siteName: 'refusal· 的宝藏仓库',
  contactEmail: 'hello@refusal.site',
  hero: {
    kicker: "HELLO,I'M\nrefusal·",
    status: '正在收集新灵感',
    tags: '手工制作 · 剪纸 · 绘画 · 创意',
    slogan: '做喜欢的东西\n记录灵感的赛博仓库',
    desc: '这里收录了我的手作、剪纸、视觉、3D、画画等灵感。',
    hashTags: '#手工 #视觉设计 #美少女 #游戏天才',
    titleScale: 1
  },

  /* -------- 侧栏导航（配置化，cat 可选：跳转作品区并筛选分类） -------- */
  nav: [
    { id: 'home', label: '我的主页', icon: '🏠' },
    { id: 'life', label: '我的动态', icon: '💬' },
    { id: 'works', label: '我的作品', icon: '🎨' },
    { id: 'works', label: '宠物日常', icon: '🐾', cat: 'pet' },
    { id: 'works', label: '我的摄影', icon: '📷', cat: 'photo' },
    { id: 'video', label: '我的视频', icon: '🎬' },
    { id: 'music', label: '我的音乐', icon: '🎵' },
    { id: 'about', label: '关于我', icon: '👤' },
    { id: 'contact', label: '联系方式', icon: '✉️' },
    { id: 'home', label: '小游戏', icon: '🎮' }
  ],

  /* -------- 首页模块（配置化：moments=最新动态 / works=作品 / note=便签） -------- */
  homeModules: [
    { type: 'moments', title: '生活动态', sub: '记录日常，分享心情', sec: 'life' },
    { type: 'works', title: '最新作品', sub: '记录日常，分享心情', sec: 'works' },
    { type: 'works', title: '宠物日常', sub: '记录日常，分享心情', cat: 'pet', sec: 'works' },
    { type: 'works', title: '摄影', sub: '随便拍拍', cat: 'photo', sec: 'works' }
  ],
  note: '希望记录自己，留下回忆。',

  /* -------- 面板标题（配置化） -------- */
  secTitles: {
    works: '我的作品 / WORKS',
    video: '我的视频 / VIDEO',
    music: '我的音乐 / MUSIC',
    life: '我的动态 / LIFE',
    about: '关于我 / ABOUT',
    contact: '联系方式 / CONTACT'
  },

  /* -------- 自我介绍 / 联系 -------- */
  about: '这里是一段自我介绍（占位）。\n喜欢手工、剪纸、绘画，正在用作品一点点填满这个赛博空间。',
  contact: '联系方式占位 —— 微信 / 邮箱 / 抖音 @refusal',

  /* -------- 视频（留空=显示"即将上线"） -------- */
  video: {
    douyin: '',
    bilibili: '',
    youtube: ''
  },

  /* -------- 音乐（歌单：netease=网易云外链 / file=自传 mp3） -------- */
  music: {
    netease: ''
  },

  /* -------- 内置歌单（本地双击预览时使用，线上以 content/music.json 为准） -------- */
  playlist: [
    { type: 'file', url: 'assets/music/song-001.mp3', title: 'Oceanside', artist: 'Lainey Lou', cover: '', lrc: '' },
    { type: 'netease', id: '347230', title: '海阔天空', artist: 'Beyond', cover: '', lrc: '' }
  ],

  /* -------- 作品分类 -------- */
  categories: [
    { id: 'handmade', label: '手工发饰' },
    { id: 'papercut', label: '剪纸' },
    { id: 'drawing',  label: '绘画' },
    { id: 'photo',    label: '摄影' },
    { id: 'landscape', label: '风景' },
    { id: 'people',   label: '人物' },
    { id: 'pet',      label: '宠物' }
  ],

  /* -------- 作品列表（images 为多图，第一张与 img 一致） -------- */
  works: [
    { id: 'W-001', cat: 'handmade', title: '蝴蝶结发箍', img: 'assets/works/handmade-1-headband.jpg', images: ['assets/works/handmade-1-headband.jpg', 'assets/works/微信图片_20260821152752_3_38.jpg'], desc: '缎带手工蝴蝶结发箍，粉色系，适合日常搭配。' },
    { id: 'W-002', cat: 'handmade', title: '蓝缎带蝴蝶结', img: 'assets/works/handmade-2-bow-pink.jpg', images: ['assets/works/handmade-2-bow-pink.jpg'], desc: '蓝色缎带蝴蝶结，手工缝制，细节精致。' },
    { id: 'W-003', cat: 'handmade', title: '白玫瑰缎带结', img: 'assets/works/handmade-3-bow-rose.jpg', images: ['assets/works/handmade-3-bow-rose.jpg'], desc: '白玫瑰造型缎带结，优雅温婉。' },
    { id: 'W-004', cat: 'papercut', title: '剪纸 · 武将', img: 'assets/works/papercut-1.jpg', images: ['assets/works/papercut-1.jpg'], desc: '武将主题剪纸作品，线条利落，气势十足。' },
    { id: 'W-005', cat: 'drawing', title: '乡间木屋线稿', img: 'assets/works/drawing-1-house.jpg', images: ['assets/works/drawing-1-house.jpg'], desc: '乡间木屋钢笔线稿，记录旅途中的静谧风景。' }
  ],

  /* -------- 生活动态（说说）：type=text/image/video，视频填 video 字段 -------- */
  moments: [
    { id: 'M-001', type: 'text', date: '2026-08-22', text: '新作品完成啦！今天做了个蝴蝶结发箍，粉粉的很喜欢～', images: [], video: '' },
    { id: 'M-002', type: 'image', date: '2026-08-21', text: '窗外下了一整天的雨，宅家画线稿。', images: ['assets/works/drawing-1-house.jpg'], video: '' }
  ]
};
