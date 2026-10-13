const store = require('../../utils/store.js')
const config = require('../../utils/config.js')
const api = require('../../utils/api.js')
const { META } = require('../../utils/data.js')

Page({
  data: {
    pro: false,
    plan: 'year',
    saved: [],
    version: META.version,
    features: [
      { name: '基础分账计算', free: true },
      { name: '回本线测算', free: true },
      { name: '多平台对比', free: true },
      { name: '阶梯激励精确计算', free: false },
      { name: '平台参数自定义', free: false },
      { name: '方案保存 / 对比导出', free: false },
      { name: '政策变动微信提醒', free: false }
    ]
  },

  onShow() {
    this.setData({ pro: store.isPro(), saved: store.getSaved() })
    this.syncEntitlement()
  },

  onShareAppMessage() {
    return { title: '短剧分账计算器专业版 · 开机前先算账', path: '/pages/profile/profile' }
  },

  /** 权益同步：服务端可用时以服务端为准（换设备/重装不丢权益，过期自动失效） */
  syncEntitlement() {
    api.getEntitlement().then((res) => {
      if (!res || res.code !== 0) return
      const local = store.isPro()
      if (res.pro && !local) {
        store.setPro(true)
        this.setData({ pro: true })
        wx.showToast({ title: '专业版权益已恢复', icon: 'success' })
      } else if (!res.pro && local) {
        // 服务端无有效权益（过期或已退款）→ 本地降级
        store.setPro(false)
        this.setData({ pro: false })
        wx.showToast({ title: '专业版权益已过期', icon: 'none' })
      }
    })
  },

  onPlanTap(e) {
    this.setData({ plan: e.currentTarget.dataset.plan })
  },

  onBuyTap() {
    const isYear = this.data.plan === 'year'
    wx.showModal({
      title: '确认开通专业版',
      content: (isYear ? '年卡 ¥99（365 天）' : '月卡 ¥9.9（30 天）') + '\n演示环境为模拟支付，正式版将调起虚拟支付',
      confirmText: '开通',
      success: (res) => {
        if (!res.confirm) return
        // 正式版：wx.requestVirtualPayment 调起虚拟支付（个人主体已开放，见 README）
        // OfferID 在 utils/config.js 的 VIRTUAL_PAY_OFFER_ID 中配置
        store.setPro(true)
        this.setData({ pro: true })
        wx.showToast({ title: '开通成功（模拟）', icon: 'success' })
        // 权益写入服务端：换设备/重装可恢复；orderId 在正式支付时传入虚拟支付订单号
        api.activateEntitlement(this.data.plan, '')
      }
    })
  },

  onCancelTap() {
    wx.showModal({
      title: '取消专业版',
      content: '取消后阶梯激励、方案保存、政策提醒将不可用。确定取消？（模拟）',
      success: (res) => {
        if (!res.confirm) return
        store.setPro(false)
        this.setData({ pro: false })
        wx.showToast({ title: '已取消（模拟）', icon: 'none' })
      }
    })
  },

  onClearSaved() {
    if (!this.data.saved.length) return
    wx.showModal({
      title: '清空方案',
      content: '确定清空全部已保存方案？',
      success: (res) => {
        if (!res.confirm) return
        store.setSaved([])
        this.setData({ saved: [] })
        wx.showToast({ title: '已清空', icon: 'success' })
      }
    })
  }
})
