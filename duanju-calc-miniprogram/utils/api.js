/**
 * api.js - 统一 API 层
 *
 * 对页面屏蔽后端差异：
 *   - config.API_MODE = 'server'：请求接入方自有服务器（HTTP JSON）
 *   - config.API_MODE = 'cloud' ：调用微信云函数
 * 两种模式返回值形状一致：{ code: 0, data: ... }，失败时 reject 或返回 null。
 *
 * 用户标识：优先 wx.login 换取 openid（config.USE_WX_LOGIN = true 且服务端已配置），
 * 否则使用设备匿名 ID（存 storage，重装小程序后会变）。
 */
var config = require('./config.js')
var cloud = require('./cloud.js')

function isServerMode() {
  return config.API_MODE === 'server'
}

/** 设备匿名 ID（服务端模式的兜底用户标识） */
function getUid() {
  var uid = wx.getStorageSync('duanju_uid')
  if (!uid) {
    uid = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10)
    wx.setStorageSync('duanju_uid', uid)
  }
  return uid
}

/** 获取 wx.login code（未启用时返回空串） */
function loginCode() {
  return new Promise(function (resolve) {
    if (!config.USE_WX_LOGIN) {
      resolve('')
      return
    }
    wx.login({
      success: function (r) { resolve(r.code || '') },
      fail: function () { resolve('') }
    })
  })
}

/** 服务端模式通用请求 */
function request(path, method, data) {
  return loginCode().then(function (code) {
    return new Promise(function (resolve, reject) {
      wx.request({
        url: config.SERVER_BASE_URL.replace(/\/+$/, '') + path,
        method: method || 'GET',
        data: data || {},
        header: {
          'content-type': 'application/json',
          'x-uid': getUid(),
          'x-code': code
        },
        success: function (res) {
          if (res.statusCode >= 200 && res.statusCode < 300 && res.data && typeof res.data === 'object') {
            resolve(res.data)
          } else {
            reject(new Error('HTTP ' + res.statusCode))
          }
        },
        fail: function (e) {
          reject(e)
        }
      })
    })
  })
}

/* ================= 业务接口（页面只调用这几个） ================= */

/** 政策列表：type = 'all' 或分类（微信/红果/抖音/快手/爱奇艺/腾讯视频/优酷/监管/行业） */
function getPolicies(type) {
  if (isServerMode()) {
    return request('/api/policies?type=' + encodeURIComponent(type || 'all'), 'GET')
  }
  return cloud.callFunctionSafe('getPolicies', { type: type || 'all' })
}

/** 查询专业版权益 */
function getEntitlement() {
  if (isServerMode()) {
    return request('/api/entitlement', 'GET')
  }
  return cloud.callFunctionSafe('entitlement', { action: 'get' })
}

/** 开通专业版权益（支付成功后调用；orderId 传虚拟支付订单号） */
function activateEntitlement(plan, orderId) {
  if (isServerMode()) {
    return request('/api/entitlement', 'POST', { plan: plan, orderId: orderId || '' })
  }
  return cloud.callFunctionSafe('entitlement', { action: 'set', plan: plan, orderId: orderId || '' })
}

/** 订阅开关：enabled = true 开启政策更新提醒 */
function setSubscribe(enabled) {
  if (isServerMode()) {
    return request('/api/subscribe', 'POST', { enabled: !!enabled })
  }
  return cloud.callFunctionSafe('subscribe', { action: enabled ? 'on' : 'off' })
}

module.exports = {
  isServerMode: isServerMode,
  getPolicies: getPolicies,
  getEntitlement: getEntitlement,
  activateEntitlement: activateEntitlement,
  setSubscribe: setSubscribe,
  request: request
}
