/**
 * calc.js - 短剧分账计算引擎
 *
 * 统一模型：
 *   有效播放量   = 总播放量 × 有效播放率
 *   基础分账     = 有效播放量 ÷ 1000 × 千次单价 × 分成比例
 *   分账总收入   = 基础分账 + 阶梯激励加成
 *   利润         = 分账总收入 − 总成本
 *   回本线(播放) = 总成本 ÷ (千次单价 × 分成比例 × 有效播放率 ÷ 1000)
 *
 * 千次单价：
 *   IAA 平台     = 用户输入的 eCPM（元/千次有效播放）
 *   IAP 平台     = 1000 × 付费率 × 客单价
 *   会员分账平台 = 用户输入的分账单价（估算）
 */
function compute(p, o) {
  var views = o.views                 // 万次
  var validRate = o.validRate         // %
  var costWan = o.costWan             // 万元
  var pro = !!o.pro
  var toggles = o.toggles || {}

  var validPlays = views * 1e4 * validRate / 100

  var revPer1000
  if (p.mode === 'IAP') {
    revPer1000 = 1000 * (o.payRate / 100) * o.arpu
  } else {
    revPer1000 = o.price
  }

  var share = o.share
  var base = validPlays / 1000 * revPer1000 * share / 100

  var bonus = 0
  var bonusDesc = ''
  if (pro) {
    if (p.id === 'hongguo' && toggles.rare) {
      bonus += base * 0.2
      bonusDesc = '稀缺题材 +20%'
    }
    if (p.id === 'douyin' && toggles.sequel) {
      bonus += base * 0.2
      bonusDesc = '系列续作 +20%'
    }
    if (p.id === 'kuaishou') {
      var coef = 0
      if (toggles.duration) coef += 0.15
      if (toggles.finish) coef += 0.15
      if (toggles.series) coef += 0.20
      if (coef > 0) {
        var raw = base * coef
        bonus = Math.min(raw, p.bonusCap || Infinity)
        bonusDesc = '激励系数 +' + Math.round(coef * 100) + '%' + (raw > (p.bonusCap || Infinity) ? '（已封顶 20 万）' : '')
      }
    }
    if (p.id === 'iqiyi' && toggles.aigc) {
      bonus += base * 0.2
      bonusDesc = 'AIGC 补贴 +20%'
    }
    if (p.id === 'tencent') {
      var parts = []
      if (p.autoBonus && base > p.autoBonus.threshold) {
        bonus += (base - p.autoBonus.threshold) * p.autoBonus.rate
        parts.push('超 100 万 +15%')
      }
      if (toggles.series) {
        bonus += base * 0.10
        parts.push('系列化 +10%')
      }
      if (parts.length) bonusDesc = parts.join(' · ')
    }
  }

  var total = base + bonus
  var cost = costWan * 1e4
  var profit = total - cost
  var roi = cost > 0 ? total / cost : Infinity
  var perPlay = revPer1000 / 1000 * share / 100 * validRate / 100
  var beViews = perPlay > 0 ? cost / perPlay : Infinity // 单位：次

  return {
    base: base,
    bonus: bonus,
    bonusDesc: bonusDesc,
    total: total,
    cost: cost,
    profit: profit,
    roi: roi,
    beViews: beViews,
    validPlays: validPlays,
    perPlay: perPlay
  }
}

module.exports = {
  compute: compute
}
