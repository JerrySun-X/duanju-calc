const store = require('./utils/store.js')
const cloud = require('./utils/cloud.js')

App({
  onLaunch() {
    // 云能力初始化：失败/未开通时自动降级，不影响免费功能
    cloud.initCloud()
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
