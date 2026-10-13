/**
 * store.js - 本地存储封装
 * 存储：专业版状态、已保存方案、上次选择的平台
 */
var KEY = 'duanju_calc_v1'

function read() {
  try {
    return wx.getStorageSync(KEY) || {}
  } catch (e) {
    return {}
  }
}

function write(obj) {
  try {
    wx.setStorageSync(KEY, obj)
  } catch (e) {}
}

module.exports = {
  isPro: function () {
    return !!read().pro
  },
  setPro: function (v) {
    var d = read()
    d.pro = !!v
    write(d)
  },
  getSaved: function () {
    return read().saved || []
  },
  setSaved: function (list) {
    var d = read()
    d.saved = list
    write(d)
  },
  getPlatformId: function () {
    return read().platformId || 'lpaopao'
  },
  setPlatformId: function (id) {
    var d = read()
    d.platformId = id
    write(d)
  },
  /** 通用状态合并 */
  patch: function (obj) {
    var d = read()
    for (var k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) d[k] = obj[k]
    }
    write(d)
  }
}
