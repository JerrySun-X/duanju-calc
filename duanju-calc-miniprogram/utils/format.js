/**
 * format.js - 数值格式化工具
 */

/** 金额格式化：>=1亿 显示亿，>=1万 显示万 */
function fmtMoney(v) {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  var a = Math.abs(v)
  if (a >= 1e8) return '¥' + (v / 1e8).toFixed(2) + ' 亿'
  if (a >= 1e4) return '¥' + (v / 1e4).toFixed(2) + ' 万'
  return '¥' + Math.round(v).toLocaleString('zh-CN')
}

/** 短金额：用于对比图等紧凑场景，无货币符号 */
function fmtMoneyPlain(v) {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  var a = Math.abs(v)
  if (a >= 1e4) return (v / 1e4).toFixed(1) + '万'
  return Math.round(v).toLocaleString('zh-CN')
}

/** 播放量格式化：入参单位「万次」 */
function fmtViews(w) {
  if (typeof w !== 'number' || !isFinite(w)) return '—'
  if (w >= 10000) return (w / 10000).toFixed(2) + ' 亿次'
  return w.toFixed(0) + ' 万次'
}

/** 百分比 */
function fmtPct(v, digits) {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  return v.toFixed(digits == null ? 0 : digits) + '%'
}

module.exports = {
  fmtMoney: fmtMoney,
  fmtMoneyPlain: fmtMoneyPlain,
  fmtViews: fmtViews,
  fmtPct: fmtPct
}
