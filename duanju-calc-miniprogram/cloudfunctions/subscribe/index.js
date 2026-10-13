/**
 * subscribe - 政策更新订阅记录
 *
 * action=on  记录订阅授权（remaining=1，一次性订阅仅可推送一次）
 * action=off 关闭订阅
 *
 * 依赖集合：subscriptions（doc 以 OPENID 为 ID）
 * 字段：notify / remaining / lastSentAt / updatedAt
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const openid = cloud.getWXContext().OPENID
  if (!openid) return { code: 401, msg: '未获取到用户标识' }

  const action = event.action

  try {
    if (action === 'on') {
      await db.collection('subscriptions').doc(openid).set({
        data: { notify: true, remaining: 1, updatedAt: new Date() }
      })
      return { code: 0 }
    }
    if (action === 'off') {
      await db.collection('subscriptions').doc(openid).set({
        data: { notify: false, updatedAt: new Date() }
      })
      return { code: 0 }
    }
    return { code: 400, msg: 'unknown action' }
  } catch (e) {
    return { code: 500, msg: e.message }
  }
}
