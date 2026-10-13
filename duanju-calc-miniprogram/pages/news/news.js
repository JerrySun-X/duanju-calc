const { POLICIES, META } = require('../../utils/data.js')
const cloud = require('../../utils/cloud.js')
const store = require('../../utils/store.js')

// 云端政策缓存（模块级，切回 Tab 不重复请求）
var remotePolicies = null

Page({
  data: {
    cats: ['全部', '微信', '红果', '抖音', '快手', '爱奇艺', '腾讯视频', '优酷', '监管', '行业'],
    cat: '全部',
    list: [],
    pro: false,
    cloudReady: false,
    dataSource: '本地', // 本地 | 云端
    version: META.version
  },

  onShow() {
    cloud.initCloud()
    this.setData({ pro: store.isPro(), cloudReady: cloud.isCloudReady() })
    this.loadPolicies()
  },

  onShareAppMessage() {
    return { title: '短剧平台政策情报站 · 分账规则一网打尽', path: '/pages/news/news' }
  },

  onCatTap(e) {
    this.setData({ cat: e.currentTarget.dataset.cat })
    this.filterNews()
  },

  onSubscribeTap() {
    if (!this.data.pro) {
      wx.showToast({ title: '政策提醒为专业版功能', icon: 'none' })
      setTimeout(() => wx.switchTab({ url: '/pages/profile/profile' }), 400)
      return
    }
    // 需在小程序后台申请订阅消息模板，替换为真实模板 ID
    wx.requestSubscribeMessage({
      tmplIds: ['YOUR_SUBSCRIBE_TEMPLATE_ID'],
      success: (res) => {
        if (res['YOUR_SUBSCRIBE_TEMPLATE_ID'] === 'accept') {
          // 记录订阅授权到云端，供 sendPolicyNotify 推送使用
          cloud.callFunctionSafe('subscribe', { action: 'on' })
          wx.showToast({ title: '已订阅，更新时提醒你', icon: 'success' })
        } else {
          wx.showToast({ title: '你拒绝了订阅', icon: 'none' })
        }
      },
      fail: () => wx.showToast({ title: '订阅失败，请重试', icon: 'none' })
    })
  },

  /** 政策数据：先用本地渲染保证立即可见，再尝试拉取云端（热更新） */
  loadPolicies() {
    this.filterNews()
    if (!cloud.isCloudReady()) return
    cloud.callFunctionSafe('getPolicies', { type: 'all' }).then((res) => {
      if (res && res.code === 0 && Array.isArray(res.data) && res.data.length > 0) {
        remotePolicies = res.data
        this.setData({ dataSource: '云端' })
        this.filterNews()
      }
    })
  },

  filterNews() {
    const cat = this.data.cat
    const source = (remotePolicies && remotePolicies.length) ? remotePolicies : POLICIES
    const list = source
      .filter(n => cat === '全部' || n.cat === cat)
      .map(n => Object.assign({}, n, {
        impactCls: n.impact === '利好' ? 'lihao' : (n.impact === '注意' ? 'zhuyi' : 'neutral')
      }))
    this.setData({ list })
  }
})
