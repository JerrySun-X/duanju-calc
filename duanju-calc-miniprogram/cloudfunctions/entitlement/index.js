/**
 * entitlement - 专业版权益云函数
 *
 * action=get  查询当前用户专业版权益（以云端为准，过期自动失效）
 * action=set  开通权益并写入云端（支付成功后由客户端调用）
 *
 * 依赖集合：entitlements（doc 以 OPENID 为 ID）
 * 字段：plan(month|year) / orderId / startAt / expireAt / updatedAt
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const openid = cloud.getWXContext().OPENID
  if (!openid) return { code: 401, msg: '未获取到用户标识' }

  const action = event.action

  try {
    if (action === 'get') {
      let rec = null
      try {
        const r = await db.collection('entitlements').doc(openid).get()
        rec = r.data
      } catch (e) {
        rec = null // 记录不存在
      }
      if (!rec) return { code: 0, pro: false }
      const valid = rec.expireAt && new Date(rec.expireAt).getTime() > Date.now()
      return { code: 0, pro: !!valid, plan: rec.plan, expireAt: rec.expireAt }
    }

    if (action === 'set') {
      const plan = event.plan === 'year' ? 'year' : 'month'
      const days = plan === 'year' ? 365 : 30
      const now = new Date()
      const expireAt = new Date(now.getTime() + days * 24 * 3600 * 1000)
      await db.collection('entitlements').doc(openid).set({
        data: {
          plan: plan,
          orderId: event.orderId || '',
          startAt: now,
          expireAt: expireAt,
          updatedAt: now
        }
      })
      return { code: 0, pro: true, plan: plan, expireAt: expireAt }
    }

    return { code: 400, msg: 'unknown action' }
  } catch (e) {
    return { code: 500, msg: e.message }
  }
}
