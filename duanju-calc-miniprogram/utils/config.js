/**
 * config.js - 全局配置（接手者主要修改的文件）
 *
 * 所有需要替换的值都集中在这里，每项均有注释说明。
 * 修改后无需改动其他任何文件。
 */
module.exports = {
  /* ===== 接入模式 =====
   * 'server'：接入方自有服务器（默认，参考实现见 server-reference/ 目录）
   * 'cloud' ：微信云开发（云函数方案，见 cloudfunctions/ 目录）
   * 两种模式接口形状一致，页面代码无需任何改动 */
  API_MODE: 'server',

  /* 自有服务器地址
   * - 部署 server-reference 后填你的域名（须 https://，或 http:// 仅限开发）
   * - 必须添加到小程序后台：开发管理 → 服务器域名 → request 合法域名
   * - 本地开发可在开发者工具勾选「不校验合法域名」 */
  SERVER_BASE_URL: 'https://your-domain.com',

  /* 是否使用 wx.login 向服务端换取 openid
   * - true ：服务端配置了 AppID/AppSecret 时启用，用户标识稳定（换设备权益不丢）
   * - false：用设备匿名 ID，实现最简单，但重装小程序后权益需重新开通 */
  USE_WX_LOGIN: false,

  /* 微信云开发环境 ID（仅 API_MODE = 'cloud' 时需要） */
  CLOUD_ENV_ID: '',

  /* 订阅消息模板 ID
   * 获取：公众平台 → 功能 → 订阅消息 → 申请「政策更新提醒」模板 */
  SUBSCRIBE_TEMPLATE_ID: 'YOUR_SUBSCRIBE_TEMPLATE_ID',

  /* 激励视频广告位
   * 获取：流量主开通（累计 UV 达标）→ 广告位管理 → 创建激励视频广告位 */
  AD_ENABLED: false,
  AD_UNIT_ID: '',

  /* 虚拟支付 OfferID
   * 获取：公众平台 → 支付与交易 → 虚拟支付 → 开通后可见（个人主体已支持） */
  VIRTUAL_PAY_OFFER_ID: ''
}
