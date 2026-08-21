// netlify/functions/content-api.js
// REFUSAL OS 傻瓜后台的保存接口 —— 绕开 Git Gateway，直接用 GitHub API。
// 通过 Netlify 环境变量 GH_TOKEN（GitHub 经典 PAT，需勾选 repo 权限）读写仓库。
'use strict';
const https = require('https');

const OWNER = 'Domasniu';
const REPO = 'refusal-site';
const BRANCH = 'main';

function ghApi(method, apiPath, token, bodyObj) {
  return new Promise((resolve, reject) => {
    const body = bodyObj ? JSON.stringify(bodyObj) : null;
    const options = {
      hostname: 'api.github.com',
      path: apiPath,
      method: method,
      headers: {
        Authorization: 'token ' + token,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'refusal-os-console',
        'Content-Type': 'application/json',
        'Content-Length': body ? Buffer.byteLength(body) : 0,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        let json = null;
        try { json = data ? JSON.parse(data) : null; } catch (e) { json = null; }
        resolve({ status: res.statusCode, json });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function b64encode(s) {
  return Buffer.from(String(s), 'utf8').toString('base64');
}

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json; charset=utf-8' };
  const respond = (code, obj) => ({ statusCode: code, headers, body: JSON.stringify(obj) });

  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed' });
  }

  const token = process.env.GH_TOKEN;
  if (!token) {
    return respond(500, { error: 'GH_TOKEN 未配置：请在 Netlify 环境变量中添加 GH_TOKEN（GitHub 经典 token，repo 权限）' });
  }

  let payload;
  try { payload = JSON.parse(event.body || '{}'); } catch (e) {
    return respond(400, { error: 'invalid json' });
  }

  const action = payload.action;
  const path = payload.path || '';
  if (!path) return respond(400, { error: 'missing path' });

  const apiPath = '/repos/' + OWNER + '/' + REPO + '/contents/' + encodeURI(path);

  try {
    if (action === 'get') {
      const r = await ghApi('GET', apiPath, token);
      if (r.status === 404) return respond(200, { data: null });
      if (r.status !== 200) return respond(r.status, { error: '读取失败：HTTP ' + r.status });
      const text = r.json && r.json.encoding === 'base64'
        ? Buffer.from(r.json.content, 'base64').toString('utf8')
        : '';
      return respond(200, { data: { sha: r.json.sha, text } });
    }

    if (action === 'put') {
      let sha = null;
      const existing = await ghApi('GET', apiPath, token);
      if (existing.status === 200 && existing.json) sha = existing.json.sha;

      const body = {
        message: 'update: ' + path,
        content: payload.isBase64 ? payload.content : b64encode(payload.content),
        branch: BRANCH,
      };
      if (sha) body.sha = sha;

      const r = await ghApi('PUT', apiPath, token, body);
      if (r.status !== 200 && r.status !== 201) {
        return respond(r.status, { error: '写入失败：HTTP ' + r.status });
      }
      return respond(200, { ok: true });
    }

    return respond(400, { error: 'unknown action' });
  } catch (e) {
    return respond(500, { error: e.message });
  }
};
