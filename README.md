# cyberTrack

cyberTrack 是一个面向个人/单团队的“工程蓝图风”资产管理控制台，支持资产录入、到期提醒、数据备份/恢复、AI 资产分析，以及 Telegram 机器人通知。

**核心功能**
- 资产管理：VPS/域名/账号/手机号等资源的增删改查与分类浏览
- 到期提醒：每日定时扫描（Cron）+ 即时变更通知（新增/更新/删除）
- Telegram Bot：指令交互（/status /expiring /list /search 等）与通知推送
- 数据管理：导出备份、覆盖/合并导入、预检查与错误明细下载
- 汇率：服务端缓存 + 手动覆盖（避免第三方 API 波动）
- AI 资产顾问：多平台模型选择，服务端代理，Key 可选
- 主题：工程蓝图风 UI（网格底纹、虚线、准星标注）

---

## 目录结构（关键）
- `components/` 前端 UI 组件
- `services/` 前端服务层（API 调用、缓存逻辑）
- `functions/` Cloudflare Pages Functions（后端逻辑）
- `functions/api/v1/` 资源/设置/汇率 API
- `functions/services/telegram/` Telegram 机器人指令处理
- `functions/cron.ts` 每日定时到期扫描
- `functions/db/schema.ts` D1 数据表结构

---

## 本地运行
**前置条件**：Node.js 18+，npm

1. 安装依赖
   - `npm install`
2. 启动开发服务
   - `npm run dev`

---

## 部署（Cloudflare Pages）

### 1) 绑定 D1 数据库
在 Cloudflare 创建 D1 数据库，并在 `wrangler.toml` 中配置：
```
[[d1_databases]]
binding = "DB"
database_name = "cybertrack-db"
database_id = "YOUR_D1_DATABASE_ID"
```

### 2) 绑定 KV（汇率缓存 + 手动覆盖）
在 Cloudflare 创建 KV，并在 `wrangler.toml` 中配置：
```
[[kv_namespaces]]
binding = "CLOUDTRACK_KV"
id = "YOUR_KV_NAMESPACE_ID"
```

### 3) 配置环境变量（Cloudflare Pages -> Settings -> Environment variables）
**必需**
- `API_SECRET`：API 访问密钥（用于后端请求鉴权）

**可选（启用对应功能时才需配置）**
- `TELEGRAM_BOT_TOKEN`：Telegram Bot Token
- `OPENAI_API_KEY`
- `DEEPSEEK_API_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_SITE_URL`（可选）
- `OPENROUTER_APP_TITLE`（可选）
- `GITHUB_TOKEN`
- `GITHUB_MODELS_URL`（GitHub Models Chat Completions endpoint）
- `CUSTOM_AI_BASE_URL`（自建 OpenAI 兼容服务地址）
- `CUSTOM_AI_API_KEY`（可选）
- `API_KEY`（Gemini，保留兼容）

### 4) 部署
- `npm run build`
- 推送代码到 GitHub
- Cloudflare Pages 自动构建部署

---

## API 鉴权与访问模式
默认使用 `API_SECRET` 校验，请在请求头中携带：
```
X-API-Key: YOUR_API_SECRET
```

支持的访问模式（通过 `ACCESS_MODE` 环境变量控制）：
- `access-code`（默认）：只校验 `API_SECRET`
- `cloudflare`：只允许 Cloudflare Access 登录用户
- `hybrid`：Cloudflare Access 或 API_SECRET 其一满足即可

---

## Telegram 机器人

### 启用流程
1. 在设置页填写 Chat ID
2. 点击“一键激活 Webhook”
3. 在 Telegram 输入 `/` 查看命令菜单

### 如何获取 Chat ID
- 直接对机器人发送 `/start`，机器人会回显 Chat ID

### 内置指令示例
- `/start` 绑定并查看 Chat ID
- `/status` 资产概览
- `/expiring` 30 天内到期
- `/list` 资产列表
- `/search 关键词`

---

## 汇率说明
- 服务端优先返回手动覆盖的汇率
- 无覆盖时使用服务端缓存（24h）
- 缓存失效会请求实时汇率
- 请求失败自动回退默认汇率

---

## Cron（每日到期提醒）
`wrangler.toml` 已配置北京时间 09:00 触发：
```
[[triggers]]
crons = ["0 1 * * *"]
```

---

## AI 资产顾问（多平台）
支持 OpenAI、DeepSeek、OpenRouter、GitHub Models、自建公益站（OpenAI 兼容），均为 **可选**。
未配置的 AI 平台不会影响其他功能。

前端可选择：
- 平台
- 模型名称（支持手动输入）

### GitHub Models 示例
GitHub Models 的 `GITHUB_MODELS_URL` 需要填写完整 endpoint，例如：
```
https://models.inference.ai.azure.com/chat/completions
```

### 自建公益站（OpenAI 兼容）
- `CUSTOM_AI_BASE_URL`: 你的服务地址（如 `https://example.com`）
- 接口路径默认为 `/v1/chat/completions`

---

## 备份与导入

### 导出格式示例
```
{
  "metadata": {
    "version": 1,
    "exportedAt": "2026-02-04T09:00:00.000Z",
    "source": "cyber-track"
  },
  "resources": [
    {
      "id": "...",
      "name": "My VPS",
      "provider": "AWS",
      "expiryDate": "2026-12-01",
      "cost": 10,
      "currency": "USD",
      "type": "VPS",
      "tags": ["prod"]
    }
  ]
}
```

### 导入规则
- 支持覆盖/合并
- 合并模式优先按 `name + type + provider` 匹配
- 日期格式必须为 `YYYY-MM-DD`
- 支持错误明细下载

---

## 常见问题
**Q: 没配置某个 AI Key 会怎样？**
A: 只影响对应平台，其他功能不受影响。

**Q: 汇率显示 fallback 是什么？**
A: 实时 API 获取失败时的回退汇率，可手动覆盖。

---

## License
MIT
