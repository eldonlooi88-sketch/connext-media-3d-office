# Connext Media 3D AI Team Office

可公开访问的 3D AI 团队办公室（Three.js）。

## 功能
- 每个 Bot 独立工位 / 房间、专属颜色与角色
- 总监室、美术总监室、会议室（显示 BTC 行情）、开放工位、休息区、茶水间
- 旁边独立法庭区（法官、检察官、辩护律师、12 名陪审员）
- 实时状态显示：working / thinking / browsing / needs-help / idle / done
- 昼夜切换、演示模式（自动切换状态 + 完成撒彩带）
- 手机友好（触控旋转缩放）
- 老板 Eldon (COO) 主题

## 本地运行
直接用浏览器打开 `index.html`（需要网络加载 Three.js CDN）。

或使用任意静态服务器：
```bash
npx serve .
```

## 后端状态接口（可选，用于真实上报）

将以下代码保存为 `server.js`，安装依赖后运行：

```bash
npm init -y
npm install express express-rate-limit
node server.js
```

**server.js**（示例，使用 JSON 文件存储）：

```js
const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const limiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
app.use('/api/', limiter);

const DATA_FILE = path.join(__dirname, 'bots-status.json');
const TOKEN = process.env.REPORT_TOKEN || 'connext-secret-token-change-me';

function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { bots: [] }; }
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/bots', (req, res) => {
  res.json(loadData());
});

app.post('/api/report', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const { bot, status, message } = req.body;
  if (!bot || !status) return res.status(400).json({ error: 'Missing bot or status' });

  const data = loadData();
  let entry = data.bots.find(b => b.id === bot);
  if (!entry) {
    entry = { id: bot, status, message, updated: new Date().toISOString() };
    data.bots.push(entry);
  } else {
    entry.status = status;
    entry.message = message || '';
    entry.updated = new Date().toISOString();
  }
  saveData(data);
  res.json({ ok: true });
});

app.listen(3000, () => console.log('Backend running on :3000'));
```

### 上报示例
```bash
curl -X POST http://localhost:3000/api/report \
  -H "Authorization: Bearer connext-secret-token-change-me" \
  -H "Content-Type: application/json" \
  -d '{"bot":"grok","status":"working","message":"生成日报"}'
```

前端可轮询 `/api/bots` 更新状态（当前演示版使用本地模拟）。

## 部署
- 前端：GitHub Pages（本仓库根目录即可）
- 后端：部署到 Render / Railway / Vercel Serverless，设置环境变量 `REPORT_TOKEN`

## 隐私与安全
- 上报必须带有效 Token
- 内置请求限流
- 不存储敏感信息，仅状态与短消息
- 密钥通过环境变量管理

岗位可随时在前端 `js/main.js` 的 `BOTS` 数组中增删修改。
