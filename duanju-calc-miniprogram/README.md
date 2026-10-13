# 短剧分账计算器 · 微信小程序

给做短剧的人做工具：**分账计算器 + 平台政策情报站**。
输入播放量、平台、分成比例、成本，自动算出分账收入、回本线、利润；聚合红果、抖音、快手、爱奇艺、腾讯视频、优酷、微信绿泡泡的最新分账政策。

- 技术栈：微信小程序原生（无构建步骤）+ 自有服务器或微信云开发（`utils/config.js` 一键切换）
- 数据基准：2026-10-13
- 商业化：基础计算免费；阶梯激励精确模型 + 政策变动提醒 ¥9.9/月 或 ¥99/年
- **接手者先读 [`HANDOVER.md`](./HANDOVER.md)**（架构、待办清单、API 契约）

---

## 一、目录结构

```
duanju-calc-miniprogram/
├── app.js / app.json / app.wxss   # 全局逻辑、路由与 TabBar 配置、全局样式
├── project.config.json            # 项目配置（AppID 占位，见下文）
├── sitemap.json
├── utils/
│   ├── calc.js                    # 分账计算引擎（纯函数，可单测）
│   ├── data.js                    # 平台政策数据库（核心数据资产）
│   ├── format.js                  # 金额/播放量格式化
│   ├── store.js                   # 本地存储（专业版状态、已存方案）
│   ├── config.js                  # ★ 全局配置：所有占位符集中在此（接手者主要改这个）
│   ├── api.js                     # ★ 统一 API 层：server/cloud 双模式，页面无感
│   └── cloud.js                   # 云开发接入层（仅 cloud 模式，无环境时自动降级）
├── pages/
│   ├── calculator/                # Tab1 计算器：平台切换/滑块测算/回本线/多平台对比/方案保存/激励视频解锁
│   ├── news/                      # Tab2 政策情报站：分类筛选/服务端热更新/订阅消息入口
│   └── profile/                   # Tab3 会员中心：定价/支付/权益同步/权益对比/已存方案
├── server-reference/              # ★ 自有服务器参考实现（Express，可直接部署）
├── cloudfunctions/                # 备选：微信云开发云函数（API_MODE='cloud' 时使用）
│   ├── getPolicies/               # 政策数据热更新（情报站数据源）
│   ├── entitlement/               # 专业版权益查询/开通记录
│   ├── subscribe/                 # 政策更新订阅授权记录
│   └── sendPolicyNotify/          # 政策更新推送（管理员触发）
└── HANDOVER.md                    # ★ 项目接手文档（架构/待办/API 契约/FAQ）
```

## 二、快速开始（3 步跑起来）

1. **导入项目**：微信开发者工具 → 导入 → 选择本目录 `duanju-calc-miniprogram/`
2. **AppID**：没有正式 AppID 时选「测试号 / 游客模式」即可编译预览（`project.config.json` 已填 `touristappid`）；有 AppID 后替换 `project.config.json` 中的 `appid` 字段
3. **编译**：点「编译」即可在模拟器看到三个 Tab，计算器全部功能可交互

> 当前会员支付为**模拟流程**（弹窗确认后直接开通），正式支付接入见第五节。

## 三、核心计算模型

```
有效播放量   = 总播放量 × 有效播放率
基础分账     = 有效播放量 ÷ 1000 × 千次单价 × 分成比例
分账总收入   = 基础分账 + 阶梯激励加成
利润         = 分账总收入 −（制作 + 投流 + 人力 + 算力AI）
回本线(播放) = 总成本 ÷（千次单价 × 分成比例 × 有效播放率 ÷ 1000）
```

千次单价按平台模式区分：IAA 平台 = eCPM；IAP 平台（抖音）= 1000 × 付费率 × 客单价；会员分账平台 = 分账单价（估算值，可调）。

平台参数（单价、分成区间、阶梯激励规则）集中在 `utils/data.js` 的 `PLATFORMS`，全部带公开来源与生效日期。

## 四、政策数据更新流程（产品的真正护城河）

**方式 A：改文件发版**（适合早期，日更以下频率）
编辑 `utils/data.js` 中的 `POLICIES`，同步更新 `META.version`，提审发版。

**方式 B：服务端热更新**（推荐，政策变化快时不依赖发版）
1. 自有服务器模式：改 `server-reference/data/db.json` 的 `policies`（或更新仓库根 `platform-policies.json` 后重新 `npm run seed`）
2. 云开发模式：建 `policies` 集合，字段对齐 `POLICIES`（`id / plat / cat / date / impact / title / sum / src`），部署 `cloudfunctions/getPolicies`
3. 客户端已自动拉取云端/服务端数据并回退本地（`pages/news/news.js` 的 `loadPolicies`），无需改造
4. 更新节奏：每周一固定发版；重大活动（如绿泡泡 Q4 激励）48 小时内跟进；每次更新后对订阅用户推送一次

## 五、服务器接入（两种模式，`utils/config.js` 一键切换）

### 5.1 现状总览

| 功能 | 依赖 | 当前状态 |
|---|---|---|
| 分账计算 / 回本线 / 多平台对比 | 无（纯本地计算） | ✅ 已完成 |
| 政策情报展示 | 无（本地数据） | ✅ 已完成 |
| 政策热更新 / 权益持久化 / 订阅推送 | 自有服务器**或**云开发 | ✅ 代码已接好，两种模式任选 |

**降级策略**：服务器不可达或未部署时，以上功能全部自动跳过，小程序以「免费工具」形态完整可用。

### 5.2 模式 A：自有服务器（默认，推荐接手者用）

`server-reference/` 是可直接部署的参考实现（Express + JSON 存储，零外部服务依赖）：

```bash
cd server-reference
npm install && npm run seed && npm start   # → http://localhost:3000
```

然后编辑 `utils/config.js`：`API_MODE: 'server'`，`SERVER_BASE_URL` 填你的服务器地址。
部署、域名白名单、订单核验等细节见 `server-reference/README.md`，API 契约见 `HANDOVER.md` 第六节。

### 5.3 模式 B：微信云开发（备选）

1. 开发者工具 → 云开发 → 开通环境，把环境 ID 填入 `utils/config.js` 的 `CLOUD_ENV_ID`，`API_MODE` 改为 `'cloud'`
2. 云开发控制台 → 数据库 → 新建 `entitlements`、`subscriptions`、`policies` 三个集合
3. 对 `cloudfunctions/` 下 4 个函数逐个右键「上传并部署（云端安装依赖）」
4. 订阅消息模板 ID 填入 `utils/config.js` 的 `SUBSCRIBE_TEMPLATE_ID` 与 `cloudfunctions/sendPolicyNotify/index.js`
5. 推送政策更新：云函数控制台 → sendPolicyNotify → 测试，传入 `{"title":"...","summary":"...","date":"..."}`（一次性订阅：用户需重新订阅才能收下一次）

### 5.4 正式支付接入

`pages/profile/profile.js` 的 `onBuyTap` 中，将模拟逻辑替换为：

```js
wx.requestVirtualPayment({
  offerId: config.VIRTUAL_PAY_OFFER_ID,  // 虚拟支付后台获取，配置在 utils/config.js
  buyQuantity: 1,
  env: 0,                     // 0 正式环境 1 沙箱
  currencyType: 'CNY',
  platform: 'android',
  success: (res) => {
    // 支付成功 → 写服务端权益，orderId 传虚拟支付订单号
    api.activateEntitlement(this.data.plan, res.orderId || '')
    store.setPro(true)
  }
})
```

> iOS 端需配置小程序「简称」并满足 Apple 支付要求（微信 8.0.68+、中国大陆 App Store 账户）；`offerId` / `AppKey` 在虚拟支付开通后获取。正式环境建议增加订单核验（虚拟支付订单查询 API）防刷。

## 六、商业化配置清单（正式上线前）

> **2026-08-31 起微信已向个人主体开放虚拟支付**（官方文档「虚拟支付：个人」），个人开发者无需注册公司即可合规收款。以下按个人主体整理。

| 项目 | 说明 | 状态 |
|---|---|---|
| 小程序认证 + ICP 备案 | 个人主体可完成，虚拟支付的前置条件 | 待配置 |
| 服务类目 | 必须包含「工具」；注意：信息发布/搜索查询等需电信资质的服务不在个人虚拟支付支持范围（本产品为工具+自整理图文，不受影响） | 待配置 |
| 虚拟支付开通 | 公众平台 → 支付与交易 → 虚拟支付：填身份与提现账户，审核约 5 分钟；记录 AppID / OfferID / 现网 AppKey，在道具管理创建月卡/年卡 | 待开通 |
| 正式支付流程 | `pages/profile/profile.js` 的 `onBuyTap` 中替换为 `wx.requestVirtualPayment`（接入代码见 5.4，骨架已接好） | 待替换参数 |
| 流量主（广告） | 累计独立访客（UV）达标即可申请（现行口径约 1000，以后台实时提示为准），个人主体可申请，无需公司；开通后创建激励视频广告位，把 ID 填入 `utils/config.js` 的 `AD_UNIT_ID` 并将 `AD_ENABLED` 置 `true` | 待申请 |
| 订阅消息模板 | 后台申请「政策更新提醒」模板，ID 填入 `utils/config.js` 的 `SUBSCRIBE_TEMPLATE_ID` | 待申请 |

**费率与限额（个人主体，2026-10 官方口径）**
- 限额：全终端月支付限额 **10 万元**（各终端合计，非各端分别）
- Android 等端：技术服务费 **1%**，**T+3** 结算
- iOS：走 Apple 支付，佣金 **12%**，约 **45-60 天** 结算（两端均可直接在小程序内购买，无需 H5）
- 退款：支付 180 天内退款退还手续费

**双变现通道设计**
1. **虚拟支付（主）**：月卡 ¥9.9 / 年卡 ¥99 道具直购。个人主体自动续费（连续包月）以官方文档为准，不作为唯一路径，产品上以「月卡/年卡一次性购买」为主
2. **流量主广告（辅）**：免费用户看激励视频解锁「单次精确计算」，既赚广告费又制造付费转化钩子

**合规红线**：虚拟商品不得引导至 App / 公众号 / H5 / 个人号 / 网站完成支付；混合型服务（虚拟+实物）需拆分为两笔交易。

## 七、上线检查清单

> 完整版（含账号资质、部署、域名、日常运营）见 [`HANDOVER.md`](./HANDOVER.md) 第五节。

- [ ] `project.config.json` 替换为正式 AppID
- [ ] 小程序认证 + ICP 备案完成（个人主体）
- [ ] 服务类目包含「工具」
- [ ] **服务器模式**：`server-reference` 已部署（pm2 守护）、环境变量已配、域名已加 request 合法域名
- [ ] **或云开发模式**：环境已开通、`CLOUD_ENV_ID` 已填入 `utils/config.js`、3 个集合已建、4 个云函数已部署
- [ ] `utils/config.js` 全部占位符已替换（`SERVER_BASE_URL` / `SUBSCRIBE_TEMPLATE_ID` / `AD_UNIT_ID` / `VIRTUAL_PAY_OFFER_ID`）
- [ ] 虚拟支付已开通，OfferID 已记录，月卡/年卡道具已创建发布
- [ ] 流量主申请（UV 达标后），激励视频广告位已配置
- [ ] iOS Apple 支付配置：小程序「简称」设置、微信客户端 8.0.68+、仅中国大陆 App Store 账户
- [ ] 用户隐私保护指引：本地存储测算参数（storage）；服务端收集用户标识（openid/匿名 ID）用于权益与订阅
- [ ] 服务端已加支付订单核验（收费上线前必须）
- [ ] 用 3-5 个真实短剧项目数据回测计算器（重点验证 IAA 回本线量级）

## 八、后续迭代路线

- V1.1 方案对比报告导出（专业版）
- V1.2 平台参数自定义（按实际合同改分成比例/单价）
- V1.3 投流 ROI 单独测算页（投流成本 vs 分账收入曲线）
- V1.4 每日分账速递（红果/腾讯/快手公开战报自动聚合）

## 九、免责声明

所有政策均为公开信息整理，分成比例与单价为行业估算参考值，实际以各平台当期官方规则与签约合同为准。本工具不构成投资建议。
