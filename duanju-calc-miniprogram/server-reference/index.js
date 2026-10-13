/**
 * 短剧分账计算器 · 参考服务器
 *
 * 实现小程序所需的全部 API 契约（见 ../HANDOVER.md「API 契约」一节）。
 * 存储为 JSON 文件（data/db.json），零外部服务依赖，适合验证与早期运营；
 * 上量后可平滑替换为 MySQL/PostgreSQL/MongoDB（只改 loadDB/saveDB 两个函数）。
 *
 * 运行：
 *   npm install
 *   npm run seed     # 首次：导入政策数据（读取仓库根目录 platform-policies.json）
 *   npm start        # 默认监听 3000 端口
 *
 * 配置（环境变量，见 .env.example）：
 *   WX_APPID / WX_APPSECRET   小程序凭据（用于 wx.login 换 openid、订阅消息推送）
 *   WX_TEMPLATE_ID            订阅消息模板 ID
 *   ADMIN_KEY                 政策推送接口的管理员密钥
 *   PORT                      服务端口，默认 3000
 */
const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(express.json({ limit: '1mb' }))

const DATA_DIR = path.join(__dirname, 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

const CONFIG = {
  appId: process.env.WX_APPID || '',
  appSecret: process.env.WX_APPSECRET || '',
  templateId: process.env.WX_TEMPLATE_ID || '',
  adminKey: process.env.ADMIN_KEY || 'dev-admin-key-change-me',
  port: parseInt(process.env.PORT || '3000', 10)
}

/* ---------------- 存储 ---------------- */
function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
  } catch (e) {
    return { policies: [], entitlements: {}, subscriptions: {} }
  }
}
function saveDB(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const tmp = DB_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2))
  fs.renameSync(tmp, DB_FILE)
}

/* ---------------- 用户标识 ----------------
 * 优先：x-code（客户端 wx.login 的 code）经 jscode2session 换 openid（稳定，换设备权益不丢）
 * 兜底：x-uid（客户端生成的设备匿名 ID）
 * code → openid 的结果按 code 短时缓存，避免重复请求微信接口。 */
const codeCache = new Map()

async function resolveUid(req) {
  const code = req.header('x-code')
  if (code && CONFIG.appId && CONFIG.appSecret) {
    if (codeCache.has(code)) return codeCache.get(code)
    try {
      const r = await fetch('https://api.weixin.qq.com/cgi-bin/jscode2session' +
        '?appid=' + encodeURIComponent(CONFIG.appId) +
        '&secret=' + encodeURIComponent(CONFIG.appSecret) +
        '&js_code=' + encodeURIComponent(code) +
        '&grant_type=authorization_code')
      const j = await r.json()
      if (j.openid) {
        codeCache.set(code, j.openid)
        setTimeout(() => codeCache.delete(code), 4 * 60 * 1000) // code 5 分钟过期
        return j.openid
      }
      console.warn('[auth] jscode2session 失败:', j.errmsg || j.errcode)
    } catch (e) {
      console.warn('[auth] jscode2session 异常:', e.message)
    }
  }
  return req.header('x-uid') || 'anonymous'
}

/* ---------------- 微信 access_token（订阅消息推送用） ---------------- */
let tokenCache = { value: '', expireAt: 0 }
async function getAccessToken() {
  if (tokenCache.value && Date.now() < tokenCache.expireAt) return tokenCache.value
  const r = await fetch('https://api.weixin.qq.com/cgi-bin/token' +
    '?grant_type=client_credential&appid=' + encodeURIComponent(CONFIG.appId) +
    '&secret=' + encodeURIComponent(CONFIG.appSecret))
  const j = await r.json()
  if (!j.access_token) throw new Error('获取 access_token 失败: ' + (j.errmsg || j.errcode))
  tokenCache = { value: j.access_token, expireAt: Date.now() + (j.expires_in - 300) * 1000 }
  return j.access_token
}

/* ---------------- 路由 ---------------- */

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, ok: true, time: new Date().toISOString() })
})

// 政策列表：GET /api/policies?type=all|微信|红果|...
app.get('/api/policies', (req, res) => {
  const db = loadDB()
  const type = req.query.type || 'all'
  const list = type === 'all'
    ? db.policies
    : db.policies.filter(p => p.cat === type)
  res.json({ code: 0, data: list })
})

// 权益查询：GET /api/entitlement
app.get('/api/entitlement', async (req, res) => {
  const uid = await resolveUid(req)
  const db = loadDB()
  const rec = db.entitlements[uid]
  if (!rec) return res.json({ code: 0, pro: false })
  const valid = rec.expireAt && new Date(rec.expireAt).getTime() > Date.now()
  res.json({ code: 0, pro: !!valid, plan: rec.plan, expireAt: rec.expireAt })
})

// 权益开通：POST /api/entitlement  { plan: 'month'|'year', orderId?: string }
// 注意：正式环境必须在此核验虚拟支付订单（订单查询 API 或支付回调），此处为参考实现直接记账
app.post('/api/entitlement', async (req, res) => {
  const uid = await resolveUid(req)
  const plan = req.body && req.body.plan === 'year' ? 'year' : 'month'
  const days = plan === 'year' ? 365 : 30
  const db = loadDB()
  const expireAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString()
  db.entitlements[uid] = {
    plan: plan,
    orderId: (req.body && req.body.orderId) || '',
    expireAt: expireAt,
    updatedAt: new Date().toISOString()
  }
  saveDB(db)
  console.log('[entitlement] 开通:', uid, plan, '→', expireAt)
  res.json({ code: 0, pro: true, plan: plan, expireAt: expireAt })
})

// 订阅开关：POST /api/subscribe  { enabled: true|false }
app.post('/api/subscribe', async (req, res) => {
  const uid = await resolveUid(req)
  const enabled = !!(req.body && req.body.enabled)
  const db = loadDB()
  db.subscriptions[uid] = {
    enabled: enabled,
    remaining: enabled ? 1 : 0, // 一次性订阅：每条授权可推送 1 次
    updatedAt: new Date().toISOString()
  }
  saveDB(db)
  res.json({ code: 0 })
})

// 政策推送（管理员触发）：
// POST /api/policy-notify   header: x-admin-key
// body: { title, summary, date }
app.post('/api/policy-notify', async (req, res) => {
  if (req.header('x-admin-key') !== CONFIG.adminKey) {
    return res.status(401).json({ code: 401, msg: 'unauthorized' })
  }
  if (!CONFIG.appId || !CONFIG.appSecret || !CONFIG.templateId) {
    return res.status(500).json({ code: 500, msg: '未配置 WX_APPID/WX_APPSECRET/WX_TEMPLATE_ID' })
  }
  const title = String((req.body && req.body.title) || '平台分账政策更新').slice(0, 20)
  const summary = String((req.body && req.body.summary) || '有新的分账政策动态，点击查看').slice(0, 20)
  const date = String((req.body && req.body.date) || new Date().toISOString().slice(0, 10))

  const db = loadDB()
  const targets = Object.keys(db.subscriptions)
    .filter(uid => db.subscriptions[uid].enabled && db.subscriptions[uid].remaining > 0)
    .slice(0, 100) // 单批最多 100，超出应分批或改群发接口

  let sent = 0
  let failed = 0
  try {
    const token = await getAccessToken()
    for (const uid of targets) {
      try {
        const r = await fetch('https://api.weixin.qq.com/cgi-bin/message/subscribe/send' +
          '?access_token=' + encodeURIComponent(token), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            touser: uid,
            template_id: CONFIG.templateId,
            page: 'pages/news/news',
            // 字段名以实际订阅消息模板结构为准
            data: {
              thing1: { value: title },
              thing2: { value: summary },
              date3: { value: date }
            }
          })
        })
        const j = await r.json()
        if (j.errcode === 0) {
          db.subscriptions[uid].remaining = 0
          db.subscriptions[uid].lastSentAt = new Date().toISOString()
          sent++
        } else {
          console.warn('[notify] 推送失败:', uid, j.errmsg)
          failed++
        }
      } catch (e) {
        failed++
      }
    }
    saveDB(db)
    res.json({ code: 0, total: targets.length, sent: sent, failed: failed })
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message })
  }
})

/* ---------------- 启动 ---------------- */
app.listen(CONFIG.port, () => {
  console.log('短剧分账计算器 API 服务器已启动')
  console.log('  端口:        ' + CONFIG.port)
  console.log('  健康检查:    http://localhost:' + CONFIG.port + '/api/health')
  console.log('  微信凭据:    ' + (CONFIG.appId ? '已配置' : '未配置（uid 匿名模式，订阅消息不可用）'))
  console.log('  数据文件:    ' + DB_FILE)
})
