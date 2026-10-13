const { compute } = require('../../utils/calc.js')
const { PLATFORMS, BENCHMARKS } = require('../../utils/data.js')
const F = require('../../utils/format.js')
const store = require('../../utils/store.js')
const config = require('../../utils/config.js')

Page({
  data: {
    platforms: PLATFORMS,
    platformId: 'lpaopao',
    platform: null,
    isIAP: false,
    views: 500,
    validRate: 70,
    price: 8,
    payRate: 5,
    arpu: 30,
    share: 70,
    shareMode: null,
    toggles: {},
    costText: { prod: '40', traffic: '60', labor: '8', ai: '1.5' },
    pro: false,
    tempPro: false,      // 看激励视频获得的单次精确计算权限
    adEnabled: config.AD_ENABLED,  // 流量主开通并配置广告位后，在 utils/config.js 置 true
    adUnitId: config.AD_UNIT_ID,   // 激励视频广告位 ID（adunit-xxxx）
    result: null,
    compare: [],
    saved: [],
    benchmarks: BENCHMARKS,
    priceRange: { min: 3, max: 15, step: 0.5 },
    shareRange: { min: 50, max: 100, step: 1 }
  },

  onLoad() {
    this.applyPlatform(store.getPlatformId())
  },

  onShow() {
    this.setData({ pro: store.isPro(), saved: store.getSaved() })
    this.refresh()
  },

  onShareAppMessage() {
    return {
      title: '短剧回本线计算器 · 五大平台分账一测便知',
      path: '/pages/calculator/calculator'
    }
  },

  onShareTimeline() {
    return { title: '短剧回本线计算器' }
  },

  /* ---------- 平台 ---------- */
  applyPlatform(id) {
    const p = PLATFORMS.find(x => x.id === id) || PLATFORMS[0]
    const d = {
      platformId: p.id,
      platform: p,
      isIAP: p.mode === 'IAP',
      shareMode: p.shareModes ? p.shareModes[0].id : null,
      price: p.price,
      share: p.share,
      toggles: {},
      shareRange: { min: p.shareRange[0], max: p.shareRange[1], step: 1 }
    }
    if (p.mode === 'IAP') {
      d.payRate = p.payRate
      d.arpu = p.arpu
    }
    // priceRange 兜底：IAP 平台不使用单价滑块，但 state 结构保持一致
    var pr = p.priceRange || [2, 15]
    d.priceRange = {
      min: pr[0],
      max: pr[1],
      step: pr[1] - pr[0] > 20 ? 1 : 0.5
    }
    this.setData(d)
    store.setPlatformId(p.id)
    this.refresh()
  },

  onPlatformTap(e) {
    this.applyPlatform(e.currentTarget.dataset.id)
  },

  /* ---------- 滑块 ---------- */
  onViewsChanging(e) {
    this.setData({ views: e.detail.value })
    this.refresh()
  },
  onValidChanging(e) {
    this.setData({ validRate: e.detail.value })
    this.refresh()
  },
  onPriceChanging(e) {
    this.setData({ price: e.detail.value })
    this.refresh()
  },
  onPayRateChanging(e) {
    this.setData({ payRate: e.detail.value })
    this.refresh()
  },
  onArpuChanging(e) {
    this.setData({ arpu: e.detail.value })
    this.refresh()
  },
  onShareChanging(e) {
    this.setData({ share: e.detail.value })
    this.refresh()
  },

  onShareModeTap(e) {
    const m = this.data.platform.shareModes.find(x => x.id === e.currentTarget.dataset.id)
    if (!m) return
    this.setData({ shareMode: m.id, share: m.share })
    this.refresh()
  },

  /* ---------- 激励开关 ---------- */
  onToggleTap(e) {
    const id = e.currentTarget.dataset.id
    if (!this.data.pro) {
      wx.showToast({ title: '阶梯激励为专业版功能', icon: 'none' })
      setTimeout(() => wx.switchTab({ url: '/pages/profile/profile' }), 400)
      return
    }
    const toggles = this.data.toggles
    toggles[id] = !toggles[id]
    this.setData({ toggles })
    this.refresh()
  },

  /* ---------- 成本 ---------- */
  onCostInput(e) {
    const field = e.currentTarget.dataset.field
    const costText = this.data.costText
    costText[field] = e.detail.value
    this.setData({ costText })
    this.refresh()
  },

  /* ---------- 激励视频：看广告解锁单次精确计算 ---------- */
  onAdUnlockTap() {
    if (this.data.pro) return
    if (!this.data.adEnabled || !this.data.adUnitId) {
      wx.showToast({ title: '广告位配置后可用（见 README 第六节）', icon: 'none' })
      return
    }
    if (!this.rewardedAd) {
      this.rewardedAd = wx.createRewardedVideoAd({ adUnitId: this.data.adUnitId })
      this.rewardedAd.onClose((res) => {
        if (res && res.isEnded) {
          this.setData({ tempPro: true })
          this.refresh()
          wx.showToast({ title: '本次精确计算已解锁', icon: 'success' })
        } else {
          wx.showToast({ title: '需完整观看才可解锁', icon: 'none' })
        }
      })
    }
    this.rewardedAd.show().catch(() => {
      this.rewardedAd.load()
        .then(() => this.rewardedAd.show())
        .catch(() => wx.showToast({ title: '广告加载失败，稍后再试', icon: 'none' }))
    })
  },

  /* ---------- 保存方案 ---------- */
  onSaveTap() {
    const max = this.data.pro ? 99 : 2
    if (this.data.saved.length >= max) {
      wx.showToast({ title: this.data.pro ? '保存异常，请稍后再试' : '免费版最多保存 2 个方案', icon: 'none' })
      setTimeout(() => wx.switchTab({ url: '/pages/profile/profile' }), 400)
      return
    }
    const r = this.currentResult()
    const p = this.data.platform
    const item = {
      id: Date.now(),
      name: p.name + ' · ' + this.data.views + '万播放',
      meta: '播放 ' + this.data.views + '万 · 分成 ' + this.data.share + '% · 成本 ' + this.totalCostWan() + '万 · 收入 ' + F.fmtMoney(r.total),
      profit: r.profit,
      profitText: F.fmtMoney(r.profit),
      profitColor: r.profit >= 0 ? '#F54A45' : '#00B42A'
    }
    const saved = [item].concat(this.data.saved)
    store.setSaved(saved)
    this.setData({ saved })
    wx.showToast({ title: '方案已保存', icon: 'success' })
  },

  /* ---------- 计算 ---------- */
  totalCostWan() {
    const c = this.data.costText
    return ['prod', 'traffic', 'labor', 'ai'].reduce((s, k) => s + (parseFloat(c[k]) || 0), 0)
  },

  currentResult() {
    return compute(this.data.platform, {
      views: this.data.views,
      validRate: this.data.validRate,
      price: this.data.price,
      payRate: this.data.payRate,
      arpu: this.data.arpu,
      share: this.data.share,
      costWan: this.totalCostWan(),
      pro: this.data.pro || this.data.tempPro,
      toggles: this.data.toggles
    })
  },

  refresh() {
    const r = this.currentResult()
    const beWan = r.beViews / 1e4
    const cover = isFinite(beWan) && beWan > 0
      ? Math.min(this.data.views / beWan * 100, 999)
      : (r.cost === 0 ? 100 : 0)

    const result = {
      totalText: F.fmtMoney(r.total),
      bonusVisible: r.bonus > 0,
      bonusText: '其中平台激励加成 +' + F.fmtMoney(r.bonus) + '（' + r.bonusDesc + '）',
      costText: F.fmtMoney(r.cost),
      profitText: F.fmtMoney(r.profit),
      profitColor: r.profit >= 0 ? '#FF6B61' : '#7ED77A',
      roiText: isFinite(r.roi) ? r.roi.toFixed(2) + ' ×' : '—',
      beViewsText: isFinite(beWan) ? F.fmtViews(beWan) : '零成本',
      beWidth: Math.min(cover, 100) + '%',
      beOver: cover >= 100,
      beCoverText: r.cost === 0
        ? '零成本，播放即盈利'
        : (cover >= 100 ? '已超过回本线' : '覆盖率 ' + cover.toFixed(0) + '%'),
      bePerText: (isFinite(r.roi) && r.roi > 0)
        ? '每万次播放分账 ' + F.fmtMoneyPlain(r.total / this.data.views) + ' 元'
        : '每万次播放分账 —'
    }

    // 多平台对比：统一用各平台默认参数、基础模式，保证可比
    const compare = PLATFORMS.map(p => {
      const rr = compute(p, {
        views: this.data.views,
        validRate: this.data.validRate,
        price: p.price,
        payRate: p.payRate,
        arpu: p.arpu,
        share: p.share,
        costWan: this.totalCostWan(),
        pro: false,
        toggles: {}
      })
      return {
        id: p.id,
        name: p.name,
        color: p.color,
        total: rr.total,
        profit: rr.profit,
        cur: p.id === this.data.platformId
      }
    }).sort((a, b) => b.total - a.total)
    const max = Math.max.apply(null, compare.map(x => x.total).concat([1]))
    compare.forEach(x => {
      x.width = (x.total / max * 100).toFixed(1) + '%'
      x.totalText = F.fmtMoneyPlain(x.total)
      x.profitText = F.fmtMoneyPlain(x.profit)
    })

    this.setData({ result, compare })
  }
})
