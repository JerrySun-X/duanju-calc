# 项目接手文档（HANDOVER）

> 给接手者：这份文档让你在 **1 小时内**把项目跑起来，在 **1 周内**完成上线。
> 仓库：https://github.com/JerrySun-X/duanju-calc

## 1. 项目是什么

微信小程序「**短剧分账计算器 + 平台政策情报站**」：给短剧创作者算分账收入、回本线、利润，并提供七大平台（红果/抖音/快手/微信绿泡泡/爱奇艺/腾讯视频/优酷）的分账政策情报。

- 商业模式：基础计算免费；阶梯激励精确模型 + 政策变动提醒 **¥9.9/月卡、¥99/年卡**（个人主体可合规收款）
- 详细背景见 `产品方案-短剧分账计算器.md`
- 可交互原型（先看这个建立体感）：浏览器打开 `短剧分账计算器-小程序原型.html`

## 2. 架构：你的服务器怎么接进来

```
┌─────────────────────┐        ┌──────────────────────┐        ┌─────────────┐
│  微信小程序（客户端）  │  HTTP  │  你的服务器           │        │  微信平台    │
│                     │ ─────→ │  server-reference/   │ ─────→ │  支付/订阅消息 │
│  utils/api.js ──────┤  JSON  │  （或按契约自己实现）  │        │             │
│  utils/config.js    │        │                      │        │             │
└─────────────────────┘        └──────────────────────┘        └─────────────┘
         │
         └─ API_MODE='cloud' 时改走微信云开发（cloudfunctions/），无需你的服务器
```

**关键设计**：客户端所有网络请求都经过 `utils/api.js` 一个文件，通过 `utils/config.js` 的 `API_MODE` 切换后端：

- `API_MODE = 'server'`（默认）：请求你自己的服务器，契约见下文第 6 节
- `API_MODE = 'cloud'`：改调微信云开发云函数（`cloudfunctions/` 目录，共 4 个）

两种模式页面代码零改动，返回值形状一致。

## 3. 文件地图

| 路径 | 说明 | 你需要动的 |
|---|---|---|
| `duanju-calc-miniprogram/utils/config.js` | **全局配置，所有占位符都在这** | ✅ 必改 |
| `duanju-calc-miniprogram/utils/api.js` | 统一 API 层（双模式） | 一般不用 |
| `duanju-calc-miniprogram/utils/calc.js` | 分账计算引擎（纯函数） | 不用 |
| `duanju-calc-miniprogram/utils/data.js` | 平台参数 + 政策本地数据 | 每周更新政策 |
| `duanju-calc-miniprogram/utils/store.js` | 本地存储（权益/方案缓存） | 不用 |
| `duanju-calc-miniprogram/utils/cloud.js` | 云开发接入（仅 cloud 模式） | 不用 |
| `duanju-calc-miniprogram/pages/*` | 三个页面（计算器/情报站/会员） | 不用 |
| `duanju-calc-miniprogram/server-reference/` | **参考服务器，可直接部署** | ✅ 部署 |
| `duanju-calc-miniprogram/cloudfunctions/` | 云开发云函数（备选模式） | 不用 |
| `platform-policies.json` | 政策数据库源文件（服务端 seed 用） | 每周更新 |
| `短剧分账计算器-小程序原型.html` | 高保真原型 | 参考 |
| `产品方案-短剧分账计算器.md` | 产品方案 | 参考 |

## 4. 快速跑通（本地，约 15 分钟）

```bash
# ① 启动参考服务器
cd duanju-calc-miniprogram/server-reference
npm install
npm run seed
npm start
# → http://localhost:3000

# ② 打开小程序
# 微信开发者工具 → 导入 duanju-calc-miniprogram/ → 选测试号 AppID
# 编辑 utils/config.js：
#   API_MODE: 'server'（默认即是）
#   SERVER_BASE_URL: 'http://localhost:3000'
# 开发者工具 → 详情 → 本地设置 → 勾选「不校验合法域名」
# 编译后：计算器全功能可用；情报站显示「服务端」数据源；会员页可模拟开通并同步权益
```

## 5. 你的待办清单（上线前）

### 5.1 账号与资质（用你自己/你朋友的账号）
- [ ] 注册小程序，拿到 AppID（**个人主体即可**，2026-08 起个人可开通虚拟支付收款）
- [ ] 小程序认证 + ICP 备案
- [ ] 服务类目添加「**工具**」（虚拟支付要求）
- [ ] 开通虚拟支付：公众平台 → 支付与交易 → 虚拟支付（审核约 5 分钟），拿到 **OfferID**
- [ ] 创建道具：月卡 ¥9.9 / 年卡 ¥99（以道具直购实现，不依赖连续包月）
- [ ] （可选，广告增收）流量主：累计 UV 达标（约 1000）后申请，创建激励视频广告位
- [ ] （可选，政策推送）订阅消息：申请「政策更新提醒」模板，拿到模板 ID

### 5.2 代码配置（只改一个文件）
编辑 `duanju-calc-miniprogram/utils/config.js`：

| 配置项 | 填什么 |
|---|---|
| `SERVER_BASE_URL` | 你部署服务器的 https 域名 |
| `USE_WX_LOGIN` | 服务端配了 AppID/AppSecret 就 `true`（换设备权益不丢），否则 `false` |
| `SUBSCRIBE_TEMPLATE_ID` | 订阅消息模板 ID |
| `AD_ENABLED` / `AD_UNIT_ID` | 流量主广告位（不开广告就保持默认） |
| `VIRTUAL_PAY_OFFER_ID` | 虚拟支付 OfferID |

服务端环境变量见 `server-reference/.env.example`。

### 5.3 正式支付接入
`pages/profile/profile.js` 的 `onBuyTap` 中，把模拟开通替换为：

```js
wx.requestVirtualPayment({
  offerId: config.VIRTUAL_PAY_OFFER_ID,
  buyQuantity: 1,
  env: 0,               // 0 正式 1 沙箱
  currencyType: 'CNY',
  platform: 'android',  // iOS 端按微信要求处理（佣金 12%）
  success: (res) => {
    store.setPro(true)
    this.setData({ pro: true })
    api.activateEntitlement(this.data.plan, res.orderId || '')  // 传订单号，服务端可核验
  }
})
```

同时**必须**在服务端加订单核验（`server-reference/README.md` 有说明），防止绕过支付。

### 5.4 部署与域名
- [ ] 服务器部署 `server-reference`（pm2 守护），配好环境变量
- [ ] 域名加 HTTPS 证书
- [ ] 小程序后台 → 服务器域名 → request 合法域名添加你的域名
- [ ] iOS 支付：小程序「简称」设置好，微信 8.0.68+、中国大陆 App Store 账户
- [ ] 隐私指引：mp 后台声明收集 `storage` 与用户标识（openid/匿名 ID）

### 5.5 日常运营
- [ ] 每周一更新政策：改 `platform-policies.json` → 服务端重新 seed（或直接改 `data/db.json` 的 policies）→ 调 `/api/policy-notify` 推送
- [ ] 设置自己的 git 身份：`git config user.name "你的名字" && git config user.email "你的邮箱"`

## 6. API 契约（服务端必须实现）

所有返回统一形状 `{ "code": 0, ... }`；用户标识按优先级取 `x-code` 换发的 openid，其次请求头 `x-uid`。

| 方法 | 路径 | 请求 | 返回 |
|---|---|---|---|
| GET | `/api/health` | — | `{code:0, ok:true}` |
| GET | `/api/policies?type=all` | query: type | `{code:0, data:[政策...]}` |
| GET | `/api/entitlement` | header: x-uid/x-code | `{code:0, pro:bool, plan?, expireAt?}` |
| POST | `/api/entitlement` | body: `{plan:'month'\|'year', orderId?}` | `{code:0, pro:true, plan, expireAt}` |
| POST | `/api/subscribe` | body: `{enabled:bool}` | `{code:0}` |
| POST | `/api/policy-notify` | header: x-admin-key; body: `{title,summary,date}` | `{code:0, total, sent, failed}` |

政策对象字段：`id / plat / cat / date / impact(利好|注意|中性) / title / sum / src`。

数据模型（等价数据库表）：

```
entitlements[uid]  = { plan, orderId, expireAt, updatedAt }     // 权益，expireAt 过期即失效
subscriptions[uid] = { enabled, remaining, lastSentAt, updatedAt } // remaining=1 一次性订阅
policies[]         = 政策数组
```

## 7. 已知限制（接手后按需处理）

1. **一次性订阅**：订阅消息每条授权只能推 1 次，推送后需引导用户重新订阅（长期订阅仅限特定行业）
2. **匿名 ID 模式**：`USE_WX_LOGIN=false` 时，用户重装小程序权益不保留（配了 AppID/AppSecret 即可解决）
3. **订单核验**：参考服务器未核验支付订单，收费上线前必须补
4. **JSON 文件存储**：适合日活千级；上量后换数据库（只改 `loadDB/saveDB`）
5. **政策数据为行业估算**：分成比例与单价需以各平台当期官方规则校准，`utils/data.js` 每项可调

## 8. 常见问题

**Q：小程序能直接用测试号跑吗？**
能。导入时选测试号 AppID，勾选「不校验合法域名」，连本地 `http://localhost:3000` 即可全流程验证。

**Q：我的服务器不是 Node.js 怎么办？**
按第 6 节契约用任何语言重写即可，`server-reference` 只是参考实现，接口形状一致就能替换。

**Q：计算器需要服务器吗？**
不需要。分账计算全部在本地完成，服务器无响应时免费功能完整可用。

**Q：iOS 为什么不能直接买？**
iOS 虚拟商品走 Apple 通道（佣金 12%，45-60 天结算），需按微信文档配置小程序「简称」等；Android 费率 1%、T+3。两端都能直接在小程序内购买。

**Q：分账模型准吗？**
单价与分成比例来自平台公开规则 + 行业估算（`utils/data.js` 每项带说明），计算结果供决策参考，专业版支持按实际合同自定义。免责声明已在会员页常驻。
