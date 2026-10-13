/**
 * sendPolicyNotify - 政策更新推送（管理员手动触发）
 *
 * 使用方式：政策数据更新后，在云开发控制台「云函数 → sendPolicyNotify → 测试」
 * 传入参数：{ "title": "绿泡泡Q4激励解读", "summary": "IAA最高70%", "date": "2026-10-16" }
 *
 * 注意：
 * 1. 一次性订阅：每条订阅授权仅能推送 1 次，推送后 remaining 置 0，用户需重新订阅
 * 2. TEMPLATE_ID 需替换为后台申请的真实订阅消息模板 ID
 * 3. data 字段名（thing1/thing2/date3 等）以实际模板结构为准
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const TEMPLATE_ID = 'YOUR_SUBSCRIBE_TEMPLATE_ID'
const MAX_BATCH = 100

exports.main = async (event) => {
  const title = String(event.title || '平台分账政策更新').slice(0, 20)
  const summary = String(event.summary || '有新的分账政策动态，点击查看').slice(0, 20)
  const date = String(event.date || new Date().toISOString().slice(0, 10))

  let sent = 0
  let failed = 0
  let total = 0

  try {
    const res = await db.collection('subscriptions')
      .where({ notify: true, remaining: db.command.gt(0) })
      .limit(MAX_BATCH)
      .get()
    total = res.data.length

    for (const item of res.data) {
      try {
        await cloud.openapi.subscribeMessage.send({
          touser: item._openid,
          templateId: TEMPLATE_ID,
          page: 'pages/news/news',
          data: {
            thing1: { value: title },
            thing2: { value: summary },
            date3: { value: date }
          }
        })
        await db.collection('subscriptions').doc(item._openid).set({
          data: { notify: true, remaining: 0, lastSentAt: new Date() }
        })
        sent++
      } catch (e) {
        failed++
      }
    }
    return { code: 0, total: total, sent: sent, failed: failed }
  } catch (e) {
    return { code: 500, msg: e.message }
  }
}
