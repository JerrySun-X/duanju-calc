# 短剧分账计算器 · 项目仓库

给做短剧的人做工具：**分账计算器 + 平台政策情报站**（微信小程序，个人主体可运营）。

## 仓库结构

| 目录/文件 | 说明 |
|---|---|
| `duanju-calc-miniprogram/` | **小程序完整源码**（原生，无构建步骤），导入微信开发者工具即可运行 |
| `duanju-calc-miniprogram/HANDOVER.md` | **项目接手文档**：架构、待办清单、API 契约、FAQ（接手者先读这个） |
| `duanju-calc-miniprogram/server-reference/` | **自有服务器参考实现**（Express，可直接部署，5 分钟跑通） |
| `duanju-calc-miniprogram/cloudfunctions/` | 备选：微信云开发云函数（权益/订阅/政策推送/政策热更新） |
| `duanju-calc-miniprogram/utils/config.js` | 全局配置：所有占位符集中在此一个文件 |
| `短剧分账计算器-小程序原型.html` | 高保真可交互原型（浏览器打开即用，先看这个了解产品） |
| `产品方案-短剧分账计算器.md` | 产品方案：定位、计算模型、数据更新 SOP、商业模式、排期 |
| `platform-policies.json` | 平台政策数据库（7 平台参数 + 12 条政策 + 行业基准，带来源） |

## 快速开始

```bash
# 方式一：直接体验小程序（测试号 AppID）
# 微信开发者工具 → 导入 duanju-calc-miniprogram/ → 编译

# 方式二：跑通完整闭环（含服务器）
cd duanju-calc-miniprogram/server-reference
npm install && npm run seed && npm start
# 然后把 utils/config.js 的 SERVER_BASE_URL 改为服务器地址
```

详细部署与配置指南见 `duanju-calc-miniprogram/README.md` 与 `duanju-calc-miniprogram/HANDOVER.md`。

## 商业化

基础计算免费；阶梯激励精确模型 + 政策变动提醒 ¥9.9/月 或 ¥99/年。
个人主体已可合规收款（2026-08-31 起微信向个人开放虚拟支付，月限额 10 万，Android 费率 1% / iOS 12%）。

## 数据基准

2026-10-13。政策为公开信息整理，分成比例与单价为行业估算参考值，实际以各平台当期官方规则与签约合同为准，不构成投资建议。
