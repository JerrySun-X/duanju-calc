/**
 * seed.js - 初始化数据：把仓库根目录的 platform-policies.json 导入服务器存储
 * 运行：npm run seed
 */
const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '..', '..', 'platform-policies.json')
const DATA_DIR = path.join(__dirname, 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

const policies = JSON.parse(fs.readFileSync(SRC, 'utf8')).policies

const db = {
  policies: policies,
  entitlements: {},
  subscriptions: {}
}

fs.mkdirSync(DATA_DIR, { recursive: true })
fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
console.log('已导入 ' + policies.length + ' 条政策 → ' + DB_FILE)
