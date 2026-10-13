/**
 * cloud.js - 微信云开发接入层（仅 API_MODE = 'cloud' 时使用）
 *
 * server 模式下本模块不被初始化，页面经 utils/api.js 访问自有服务器。
 * 未开通云开发 / 游客模式 / 云函数未部署时，所有调用安全降级。
 */
var config = require('./config.js')

var ENV_ID = config.CLOUD_ENV_ID // 云开发环境 ID：在 utils/config.js 中配置

var cloudReady = false
var inited = false

/** 初始化云能力（幂等，app.onLaunch 与各页面 onShow 双保险） */
function initCloud() {
  if (inited) return cloudReady
  inited = true
  try {
    if (!wx.cloud) {
      console.warn('[cloud] 当前微信版本不支持云能力，已降级为本地模式')
      return false
    }
    var cfg = { traceUser: false }
    if (ENV_ID) cfg.env = ENV_ID
    wx.cloud.init(cfg)
    cloudReady = true
  } catch (e) {
    console.warn('[cloud] 初始化失败，已降级为本地模式', e)
    cloudReady = false
  }
  return cloudReady
}

function isCloudReady() {
  return cloudReady
}

/** 调用云函数，返回 Promise；失败 reject */
function callFunction(name, data) {
  return new Promise(function (resolve, reject) {
    if (!cloudReady) {
      reject(new Error('CLOUD_NOT_READY'))
      return
    }
    wx.cloud.callFunction({
      name: name,
      data: data || {},
      success: function (res) {
        resolve(res.result)
      },
      fail: function (e) {
        reject(e)
      }
    })
  })
}

/** 带降级的调用：云不可用或调用失败时 resolve(null)，由调用方走本地逻辑 */
function callFunctionSafe(name, data) {
  return callFunction(name, data).then(
    function (r) { return r },
    function () { return null }
  )
}

module.exports = {
  initCloud: initCloud,
  isCloudReady: isCloudReady,
  callFunction: callFunction,
  callFunctionSafe: callFunctionSafe
}
