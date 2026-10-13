# 参考服务器（server-reference）

小程序后端的最小可运行实现，**5 分钟跑通全流程**。你可以直接用它上线，也可以按 `../HANDOVER.md` 的 API 契约用自己的技术栈重写。

## 快速开始

```bash
cd server-reference
npm install
npm run seed    # 首次：导入 12 条政策数据（读仓库根目录 platform-policies.json）
npm start       # 启动，默认 http://localhost:3000
```

验证：

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/policies
```

## API 一览

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/health` | 健康检查 | 无 |
| GET | `/api/policies?type=all\|微信\|红果...` | 政策列表 | 无 |
| GET | `/api/entitlement` | 查询专业版权益 | 用户标识 |
| POST | `/api/entitlement` | 开通权益 `{plan, orderId}` | 用户标识 |
| POST | `/api/subscribe` | 订阅开关 `{enabled}` | 用户标识 |
| POST | `/api/policy-notify` | 政策推送（管理员） | `x-admin-key` 头 |

**用户标识**：请求头 `x-uid`（客户端匿名 ID）。若配置了 `WX_APPID`/`WX_APPSECRET` 且小程序端 `USE_WX_LOGIN=true`，客户端会带 `x-code`，服务端自动换取 openid（换设备权益不丢）。

**政策推送**：更新政策数据后调用（示例）：

```bash
curl -X POST http://localhost:3000/api/policy-notify \
  -H "Content-Type: application/json" \
  -H "x-admin-key: dev-admin-key-change-me" \
  -d '{"title":"绿泡泡Q4激励","summary":"IAA最高70%","date":"2026-10-16"}'
```

## 配置

复制 `.env.example` 为 `.env` 或直接在部署平台设置环境变量：

| 变量 | 说明 | 必填 |
|---|---|---|
| `WX_APPID` / `WX_APPSECRET` | 小程序凭据，用于 openid 与订阅消息 | 订阅消息必填 |
| `WX_TEMPLATE_ID` | 订阅消息模板 ID | 订阅消息必填 |
| `ADMIN_KEY` | 推送接口密钥 | 是 |
| `PORT` | 端口，默认 3000 | 否 |

## 数据存储

JSON 文件 `data/db.json`（首次运行 seed 后生成）：

- `policies[]`：政策列表
- `entitlements{}`：用户权益，key 为用户标识，值 `{plan, orderId, expireAt, updatedAt}`
- `subscriptions{}`：订阅记录，值 `{enabled, remaining, lastSentAt, updatedAt}`

上量后替换为数据库时，只需改 `index.js` 里的 `loadDB` / `saveDB` 两个函数。

## 部署要点

1. **HTTPS**：小程序 `wx.request` 要求 https 域名（开发期可在开发者工具关闭域名校验）
2. **域名白名单**：把域名加到小程序后台「开发管理 → 服务器域名 → request 合法域名」
3. **进程守护**：用 pm2 / systemd / 平台托管保持常驻，例如 `pm2 start index.js --name duanju-calc`
4. **备份**：定期备份 `data/db.json`

## 正式收款前必改

`POST /api/entitlement` 当前是「调用即开通」的参考实现。上线收费前必须加**订单核验**：用虚拟支付订单查询 API 或支付回调确认订单真实有效后再记账，防止绕过支付刷权益。
