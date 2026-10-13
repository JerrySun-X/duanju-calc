const store = require('./utils/store.js')
const config = require('./utils/config.js')
const cloud = require('./utils/cloud.js')

App({
  onLaunch() {
    // 云能力仅在 cloud 模式下初始化；server 模式下不依赖任何后端，免费功能完整可用
    if (config.API_MODE === 'cloud') {
      cloud.initCloud()
    }
    this.globalData.cloudReady = cloud.isCloudReady()
    this.globalData.pro = store.isPro()
    this.globalData.policyVersion = require('./utils/data.js').META.version
  },
  globalData: {
    pro: false,
    cloudReady: false,
    userInfo: null,
    policyVersion: ''
  }
})
