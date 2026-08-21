// functions/api.js — Cloudflare Pages Function
// REFUSAL OS 傻瓜后台保存接口：用 GH_TOKEN 直接读写 GitHub 仓库。
// 可选密码保护：在 Cloudflare 设置 CONSOLE_PASSWORD 后，请求必须带 X-Console-Key。
const OWNER = 'Domasniu';
const REPO = 'refusal-site';
const BRANCH = 'main';

function b64encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function b64decode(str) {
  return decodeURIComponent(escape(atob(str)));
}

export async function onRequest(context) {
  const request = context.request;
  const env = context.env || {};

  const respond = (code, obj) => new Response(JSON.stringify(obj), {
    status: code,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

  if (request.method !== 'POST') return respond(405, { error: 'Method not allowed' });

  const password = env.CONSOLE_PASSWORD;
  if (password) {
    const key = request.headers.get('X-Console-Key') || '';
    if (key !== password) return respond(401, { error: '后台密码错误' });
  }

  const token = env.GH_TOKEN;
  if (!token) return respond(500, { error: 'GH_TOKEN 未配置：请在 Cloudflare 环境变量中添加 GH_TOKEN' });

  let payload;
  try { payload = await request.json(); } catch (e) { return respond(400, { error: 'invalid json' }); }

  const action = payload.action;
  const path = payload.path || '';
  if (!path) return respond(400, { error: 'missing path' });

  const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}`;

  async function gh(method, bodyObj) {
    const res = await fetch(apiUrl, {
      method,
      headers: {
        Authorization: 'token ' + token,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'refusal-os-console',
        'Content-Type': 'application/json',
      },
      body: bodyObj ? JSON.stringify(bodyObj) : undefined,
    });
    let json = null;
    try { json = await res.json(); } catch (e) { json = null; }
    return { status: res.status, json };
  }

  try {
    if (action === 'get') {
      const r = await gh('GET');
      if (r.status === 404) return respond(200, { data: null });
      if (r.status !== 200) return respond(r.status, { error: '读取失败：HTTP ' + r.status });
      const text = r.json && r.json.encoding === 'base64' ? b64decode(r.json.content) : '';
      return respond(200, { data: { sha: r.json.sha, text } });
    }

    if (action === 'put') {
      let sha = null;
      const existing = await gh('GET');
      if (existing.status === 200 && existing.json) sha = existing.json.sha;
      const body = {
        message: 'update: ' + path,
        content: payload.isBase64 ? payload.content : b64encode(payload.content),
        branch: BRANCH,
      };
      if (sha) body.sha = sha;
      const r = await gh('PUT', body);
      if (r.status !== 200 && r.status !== 201) return respond(r.status, { error: '写入失败：HTTP ' + r.status });
      return respond(200, { ok: true });
    }

    return respond(400, { error: 'unknown action' });
  } catch (e) {
    return respond(500, { error: e.message });
  }
}
