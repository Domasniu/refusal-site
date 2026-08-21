# REFUSAL OS — 个人网站交接文档

> 最后更新：2026-08-22 · 仓库：https://github.com/Domasniu/refusal-site
> 线上地址：https://refusal-site.pages.dev/ · 站长后台：https://refusal-site.pages.dev/console/

---

## 〇、2026-08-22 更新记录（播放器/幻灯片/图片显示修复）

本次修复三个问题：
1. **音乐播放器不工作**：`main.js` 从未调用 `REFUSAL_PLAYER.init()`，播放器未初始化（歌单空、按钮无效）。已在 `initMusicPlayer()` 末尾补上初始化调用。同时 `player.js` 增加"播放失败自动跳下一首"（网易云外链失效不再卡死），并支持 `noAuto` 模式（进站不强制自动播放，符合浏览器策略）。
2. **首页分类模块幻灯片播放**：从"横向滚动条"升级为**真正的幻灯片**——一次显示一张大图 + 自动播放（4s/张，悬停暂停）+ 左右箭头 + 指示器圆点。控件在进入系统后初始化（`initCarousels()`，因为 hidden 容器测量为 0 会导致控件不生成）。
3. **图片裁剪严重**：作品卡片图片从 `height:210px; object-fit:cover` 改为**按原始比例完整显示**（`height:auto; max-height:340px; object-fit:contain`），竖图不再被截断；首页幻灯片大图区域用 `object-fit:contain` 完整展示。

**歌单清理**：`song-002.mp3` 与 `song-001.mp3` 为同一文件（sha256 一致，重复上传），已删除文件并从歌单移除；重复的网易云 Oceanside(3023862) 也移除。当前歌单：自传 Oceanside（song-001.mp3）+ 网易云海阔天空(347230)。

---

## 〇-2、2026-08-22 二次更新（播放进度/加载反馈/图片渐入/首页美化）

用户反馈"播放器不显示进度、播放时总在加载、图片加载慢、首页不美观"，本次修复：

1. **首页播放器进度不更新**：`player.js` 的 `syncProgress()` 此前只更新音乐面板和迷你播放器，**漏掉首页播放器**（`hmFill`/`hmCur`/`hmDur`）。已补上，首页"正在播放"现在正常显示时长和进度（已验证：播放后时间走动、进度条填充）。
2. **加载反馈**：`ensureAudio()` 增加 `waiting`/`stalled`/`canplay`/`playing` 事件，缓冲时显示"加载中…"，`preload` 从 metadata 改为 auto（自传 mp3 秒开）。
3. **图片加载优化**：首页轮播第一张 eager、其余 lazy（加速首屏）；所有作品图/动态图加载完成渐入（`img.loaded` 淡入，不再突兀闪现）；`slide-img` 区域加渐变底衬。
4. **首页美化**：
   - Hero 区：赛博网格背景 + 四角描边装饰（终端窗口感）
   - 统计卡片：加 emoji 图标 + 数字滚动动画 + hover 顶部光条
   - 正在播放：播放时整卡青色发光（`.home-music.playing`），封面仅在播放时旋转（`spinning` class）
   - 分类模块：标题加分类 emoji 图标（🎀✂️🎨📷…）
5. **数据同步**：合并了用户后台新增内容（作品 W-006 宠物 lucky、分类 pet 等），歌单仍为自传 Oceanside + 网易云海阔天空。

---

## 〇-3、2026-08-22 三次更新（首页加动态模块 / LIFE 页小红书风格）

用户反馈：首页只有作品展示、没有动态展示、浪费空间；参考小红书（RED）和 xinghuisama 博客首页设计。

1. **首页新增「最新动态 / LATEST MOMENTS」模块**：在"正在播放"和"作品分类"之间插入，展示最新 4 条动态的小红书风格图文卡片（图+文字+类型徽章+日期），点击图片打开灯箱、纯文字跳转 LIFE 面板。卡片数 <4 时 `auto-fit` 自适应列宽（2 张各占一半，不显窄）。
2. **LIFE 页改小红书风格**：从单列网格改为**双列瀑布流**（移动端 1 列）；卡片结构改为"头部（类型+日期）→ 大图 → 文字"（`.has-img` 用 order 排序），hover 抬升 + 卡片入场动画。
3. **空动态过滤**：`isEmptyMoment()` 过滤无文字且无图且无视频的空白动态（数据保留在 moments.json，后台可管理，渲染时跳过）。当前有效动态 2 条（M-002 图+文、M-003 图）。
4. 首页布局顺序：Hero → 统计卡片 → 正在播放 → **最新动态** → 作品分类幻灯片。

---

## 一、项目概述

「REFUSAL OS」是 refusal· 的个人作品集网站，采用 **赛博朋克 OS 系统界面** 风格：
开机 BIOS 引导动画 → 进入主系统（顶栏 + 侧边导航 + 面板切换），展示手工发饰 / 剪纸 / 绘画 / 摄影等作品，含自定义音乐播放器、生活动态（说说）、站内搜索。

**技术栈**：纯静态 HTML/CSS/JS（无框架），数据驱动（`content/*.json`），托管于 Cloudflare Pages，后台通过 Cloudflare Pages Function + GitHub API 直写仓库实现内容管理。

---

## 二、目录结构

```
refusal-site/
├── index.html              # 主页面（开机画面 + OS 界面 + 搜索 + 播放器 + 灯箱）
├── _headers                # Cloudflare 缓存与安全头配置
├── robots.txt              # 搜索引擎规则
├── sitemap.xml             # 站点地图
├── css/
│   └── style.css           # 全部样式（赛博朋克主题、响应式、播放器、轮播、动态卡片）
├── js/
│   ├── palettes.js         # 主题色板（6 套配色，后台不修改）
│   ├── site-config.js      # 内置默认配置（本地双击预览回退值）
│   ├── player.js           # 自定义音乐播放器（audio 元素 + 自绘 UI）
│   └── main.js             # 核心交互逻辑（渲染、搜索、灯箱、导航、动态）
├── content/
│   ├── site.json           # 站点设置（头像/主题/主页文字/关于/联系/视频/音乐）
│   ├── works.json          # 作品列表（支持多图 images[]）
│   ├── categories.json     # 作品分类
│   ├── music.json          # 歌单（netease 外链 / file 自传 mp3）
│   └── moments.json        # 生活动态（文字/图片/视频）
├── assets/
│   ├── avatar.jpg          # 头像
│   ├── og-cover.png        # 社交分享图（1200×630）
│   ├── works/              # 作品图片
│   ├── music/              # 自传音乐文件
│   └── moments/            # 动态图片/视频
├── console/
│   └── index.html          # 站长后台（登录 + 内容管理）
└── functions/
    └── api.js              # Cloudflare Pages Function（后台保存接口）
```

---

## 三、核心功能说明

### 1. 开机引导
- 首次访问播放 BIOS 打字动画；返回访客自动跳过（sessionStorage 记忆）
- `?boot=1` 强制重看，`?skip=1` 强制跳过

### 2. 导航与面板
- 侧边导航：HOME / WORKS 作品 / VIDEO 视频 / MUSIC 音乐 / LIFE 动态 / ABOUT / CONTACT
- 面板切换基于 hash（如 `#works`），支持前进后退

### 3. 首页
- Hero 区（头像 + 打字标题 + 标语 + 按钮）
- 统计卡片（作品数 / 分类数 / 状态）
- **正在播放**（与音乐播放器联动）
- **分类模块轮播**：按分类分模块，每模块横向滑动展示该分类作品，点"查看全部"进入作品区并应用筛选

### 4. 作品区
- 分类筛选按钮（全部 + 各分类，后台可增删）
- 作品卡片：封面 + 标题 + 分类 + 描述 + ID 徽章
- **多图支持**：点击作品打开灯箱，多图时可左右切换（按钮 + 键盘 ← →），显示"2 / 3"计数

### 5. 站内搜索
- 顶栏 🔍 按钮 或 **Ctrl/Cmd + K** 打开
- 搜索范围：作品标题/描述/ID/分类名 + 动态文字
- 结果分组显示（分类 / 作品 / 动态），点击跳转

### 6. 音乐播放器（自定义）
- **歌单两种来源**：
  - `{ type: 'netease', id: '3023862' }` → 网易云外链播放（有版权限制，部分歌失效）
  - `{ type: 'file', url: 'assets/music/xxx.mp3' }` → 自传 mp3（推荐，稳定）
- 功能：播放/暂停、上下首、可拖拽进度条、音量/静音、循环/单曲/随机模式、可选 LRC 歌词
- 全局悬浮迷你播放器（左下角）+ HOME 面板播放器 + MUSIC 面板完整播放器，三者同步
- 偏好记忆（localStorage：音量/模式）

### 7. 生活动态（说说）
- LIFE 面板展示动态卡片：文字 + 图片（多图点开灯箱）+ 视频
- 按日期倒序排列

### 8. 灯箱
- 支持多图切换、左右箭头、键盘方向键、Esc 关闭、描述显示

---

## 四、站长后台（console/）

地址：`https://refusal-site.pages.dev/console/`

**登录**：输入后台密码（Cloudflare 环境变量 `CONSOLE_PASSWORD`），存 localStorage。

**功能**（登录后）：
1. **界面主题**：点色板切换 6 套配色
2. **头像**：上传替换（覆盖 `assets/avatar.jpg`）
3. **主页文字**：标签/标语/介绍
4. **自我介绍/联系**
5. **音乐**：填网易云歌曲 ID 或上传 mp3 文件，编辑歌名/歌手/歌词
6. **视频链接**：抖音/B站/YouTube 主页（留空显示"即将上线"）
7. **作品**：添加作品（传图）、**追加多图**（"＋加图"）、换主图、删图、编辑标题/分类/描述
8. **作品分类**：增删分类（有作品引用的分类不可删）
9. **生活动态**：添加动态、传多图、传视频、编辑文字/日期

**保存**：点「💾 保存并发布」→ 通过 `/api`（GitHub API）写入仓库 → Cloudflare Pages 自动重新部署，1-2 分钟后生效。

---

## 五、部署与维护

### 部署架构
- **托管**：Cloudflare Pages（连接 GitHub 仓库 `Domasniu/refusal-site`，分支 `main`，构建命令无、输出目录根目录）
- **自动部署**：任何 push 到 main 触发重新构建；后台保存也是 push 到仓库 → 同样触发

### 环境变量（Cloudflare Pages → Settings → Environment variables）
| 变量 | 用途 |
|---|---|
| `GH_TOKEN` | GitHub 经典 PAT（repo 权限），后台读写仓库用 |
| `CONSOLE_PASSWORD` | 后台登录密码（可选，设置后必须带密码） |

### 缓存策略（_headers）
- `css/*`、`js/*`：一年强缓存 immutable
- `assets/*`：1 小时
- `content/*.json`：no-store（后台修改立即生效）
- `index.html`：no-cache

---

## 六、内容数据格式

### works.json（作品，支持多图）
```json
{
  "works": [
    {
      "id": "W-001",
      "cat": "handmade",
      "title": "蝴蝶结发箍",
      "img": "assets/works/handmade-1-headband.jpg",
      "images": ["assets/works/handmade-1-headband.jpg", "assets/works/其他图.jpg"],
      "desc": "描述文字"
    }
  ]
}
```
> `img` 为主图（必须），`images` 为全部图（含主图，可多张），`desc` 可选。

### categories.json（分类）
```json
{ "categories": [ { "id": "handmade", "label": "手工发饰" } ] }
```
> `id` 英文唯一标识，`label` 中文显示名。当前已有：手工发饰/剪纸/绘画/摄影/风景/人物/宠物。

### music.json（歌单）
```json
{ "playlist": [
  { "type": "netease", "id": "3023862", "title": "Oceanside", "artist": "Lainey Lou", "cover": "", "lrc": "" },
  { "type": "file", "url": "assets/music/song-001.mp3", "title": "歌名", "artist": "歌手", "cover": "", "lrc": "" }
] }
```
> `lrc` 为可选 LRC 歌词文本（`[00:12.34]歌词` 格式）。

### moments.json（动态）
```json
{ "moments": [
  {
    "id": "M-001",
    "type": "text",
    "date": "2026-08-22",
    "text": "文字内容",
    "images": ["assets/moments/img-001.jpg"],
    "video": ""
  }
] }
```
> type 自动判断：有 video → 视频；有 images → 图片；否则文字。视频示例：`"video": "assets/moments/video-001.mp4"`。

### site.json（站点设置）
```json
{
  "avatar": "assets/avatar.jpg",
  "theme": "cyber-cyan",
  "hero": { "tags": "...", "slogan": "...", "desc": "..." },
  "about": "自我介绍",
  "contact": "联系方式",
  "video": { "douyin": "", "bilibili": "", "youtube": "" },
  "music": {}
}
```

---

## 七、主题配色

定义在 `js/palettes.js`，6 套：`cyber-cyan`（赛博青·默认）/ `neon-magenta`（霓虹品红）/ `violet-dream`（紫罗兰）/ `matrix-green`（矩阵绿）/ `amber-terminal`（琥珀）/ `blood-red`（血红）。
- 站长在后台切换（写入 site.json 的 theme）
- 访客点顶栏 🎨 循环切换（localStorage 覆盖，仅影响本人）

---

## 八、常见操作指南

| 想做什么 | 怎么做 |
|---|---|
| 上传新作品 | 后台 → ⑦作品 → ＋添加作品 → 选图 → 填标题/分类 → 保存 |
| 给作品加第二张图 | 后台 → ⑦作品 → 该作品「＋加图」→ 多选图片 → 保存 |
| 添加风景/人物/宠物照片 | 后台 → ⑧分类 加新分类（或直接用已有）→ ⑦添加作品选该分类 → 保存 |
| 上传自己的音乐 | 后台 → ⑤音乐 → ⬆️上传音乐文件 → 保存（或直接放 assets/music/ 并改 music.json） |
| 添加网易云歌曲 | 后台 → ⑤音乐 → 填歌曲 ID → 保存（ID = 网易云歌曲页 URL 里 /song?id= 后的数字） |
| 发一条说说 | 后台 → ⑨生活动态 → ＋添加动态 → 写文字/传图/传视频 → 保存 |
| 换头像 | 后台 → ②头像 → 更换头像 → 保存 |
| 改主页文案 | 后台 → ③主页文字 → 保存 |
| 搜索站内内容 | 顶栏 🔍 或 Ctrl+K |
| 访客换配色 | 顶栏 🎨 |

---

## 九、已知限制与注意事项

1. **网易云外链有版权限制**：部分 VIP/付费歌曲外链失效（播放器提示"播放失败"）。自传 mp3 最稳定。
2. **GitHub 单文件限制 100MB**：上传大视频请压缩（建议 < 20MB，手机竖屏压缩）。
3. **后台保存是串行逐文件上传**：图片多时保存稍慢，属正常。
4. **console 登录密码存 localStorage**：本机浏览器记住密码，换设备需重输。
5. **部署有 1-2 分钟延迟**：后台保存后不要立刻刷新判断。
6. **`sameAs` JSON-LD 为空**：如有社交主页可填入 index.html 的 Person 结构化数据。
7. 音乐播放依赖浏览器自动播放策略：首次需用户点击播放（属正常浏览器限制）。

---

## 十、Git 工作流（开发用）

```bash
git clone https://github.com/Domasniu/refusal-site.git
cd refusal-site
# 改代码后
git add -A
git commit -m "描述改动"
git push origin main     # 触发 Cloudflare Pages 自动部署
```

> 注意：后台保存也会 push 到 main。**本地改动前先 `git pull`**，避免冲突。

---

## 十一、开发环境与工具链（本机）

- **本地仓库路径**：`D:\DeepseekHarness\refusal-site`
- **Node**：`C:\Program Files\nodejs\node.exe`（v24.19.0，dsh 需要 ≥ 22.19）
- **Git**：`C:\Program Files\Git\bin\git.exe`（仓库已配置身份 `Domasniu`）
- **视觉引擎（modlens）**：已配置千问 `qwen-vl-max`（OpenAI 兼容），配置在 `C:\Users\12619\.modlens\config.json`
  - 当前模型不支持直接读图，用 `npx @liustack/modlens analyze -i <图片路径>` 读图
  - 密钥轮换方式：`"<新key>" | npx @liustack/modlens config set openai.apiKey`
- **本机完整会话交接文档**：`D:\DeepseekHarness\SESSION_HANDOVER.md`（含凭证位置、未完成事项、常用命令，**未纳入本仓库**）

---

*文档由 DeepSeek Harness 协助编写，供 refusal· 本人或后续维护者使用。*
