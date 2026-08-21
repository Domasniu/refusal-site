/* ============================================================
   REFUSAL OS — 站点配置（站长工具修改的就是这个文件）
   ▸ 主题：theme 填上面 palettes.js 里的 id
   ▸ 作品：works 数组里加一行
   ▸ 音乐：netease 粘贴网易云外链播放器代码
   ▸ 视频：填主页链接，留空显示"即将上线"
   ============================================================ */
window.SITE_CONFIG = {
  /* -------- 主题 -------- */
  theme: 'cyber-cyan',

  /* -------- 主页文字 -------- */
  hero: {
    tags: 'HANDMADE · PAPER-CUT · DRAWING · CREATIVE',
    slogan: 'BUILDING WITH HANDS, THINKING WITH STORIES',
    desc: '用手作、剪纸与画笔记录灵感的赛博仓库。'
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

  /* -------- 音乐（粘贴网易云外链播放器代码） -------- */
  music: {
    netease: ''
  },

  /* -------- 作品分类 -------- */
  categories: [
    { id: 'handmade', label: '手工发饰' },
    { id: 'papercut', label: '剪纸' },
    { id: 'drawing',  label: '绘画' },
    { id: 'photo',    label: '摄影' }
  ],

  /* -------- 作品列表 -------- */
  works: [
    { id: 'W-001', cat: 'handmade', title: '蝴蝶结发箍',   img: 'assets/works/handmade-1-headband.jpg' },
    { id: 'W-002', cat: 'handmade', title: '蓝缎带蝴蝶结', img: 'assets/works/handmade-2-bow-pink.jpg' },
    { id: 'W-003', cat: 'handmade', title: '白玫瑰缎带结', img: 'assets/works/handmade-3-bow-rose.jpg' },
    { id: 'W-004', cat: 'papercut', title: '剪纸 · 武将',   img: 'assets/works/papercut-1.jpg' },
    { id: 'W-005', cat: 'drawing',  title: '乡间木屋线稿', img: 'assets/works/drawing-1-house.jpg' }
  ]
};
