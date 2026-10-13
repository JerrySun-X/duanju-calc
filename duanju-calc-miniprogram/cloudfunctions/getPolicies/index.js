/**
 * getPolicies - 政策情报站数据源（云函数）
 *
 * 用途：政策数据热更新。后台改云数据库 policies 集合，
 * 小程序无需重新发版即可拉取最新政策。
 *
 * 部署：微信开发者工具 → cloudfunctions/getPolicies → 右键「上传并部署（云端安装依赖）」
 * 数据结构见 utils/data.js 中 POLICIES 的字段（id/plat/cat/date/impact/title/sum/src/sort）
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const type = event.type || 'all'

  try {
    let query = db.collection('policies')
    if (type !== 'all') {
      query = query.where({ cat: type })
    }
    const res = await query
      .orderBy('sort', 'desc')
      .limit(50)
      .get()

    return { code: 0, data: res.data }
  } catch (e) {
    return { code: -1, msg: e.message }
  }
}
