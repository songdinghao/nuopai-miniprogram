// pages/mom/home/home.js - 兼职妈妈首页逻辑
const app = getApp()
const momNotification = require('../../../utils/mom-notification.js')

Page({
  data: {
  fontSizeClass: '',
  // 收益摘要字段（与wxml匹配）
  totalEarnings: '0.00',
  pendingEarnings: '0.00',
  settledEarnings: '0.00',
  momLevel: 'newbie',
  momLevelLabel: '新手体验官',
  newbieDaysLeft: 30,
  inviteCode: 'NP****',
  // 月度数据
  monthlyShareCount: 0,
  monthlyOrders: 0,
  monthlyEarnings: '0.00',
  // 引导弹窗
  showGuide: true,
  guideDaysLeft: 23,
  stepIndex: 1,
  hasNewSetting: true,
  // 收益记录（mock数据，实际应从服务端获取后更新）
  records: [
      {
    id: '1',
    productName: '粉色玫瑰永生花礼盒',
    productImage: '/assets/images/product-placeholder.png',
    amount: '15.00',
    status: 'settled',
    statusText: '已到账',
    createTime: '2026 - 04 - 30 14: 20'
      },
      {
    id: '2',
    productName: '蓝色绣球永生花摆件',
    productImage: '/assets/images/product-placeholder.png',
    amount: '12.00',
    status: 'settled',
    statusText: '已到账',
    createTime: '2026 - 04 - 29 10: 15'
      },
      {
    id: '3',
    productName: '白色蝴蝶兰永生花',
    productImage: '/assets/images/product-placeholder.png',
    amount: '18.50',
    status: 'pending',
    statusText: '待结算',
    createTime: '2026 - 04 - 28 16: 30'
      }
  ]
  },

  onLoad() {
  // 加载用户偏好设置
  app.loadUserPreferences()

  const prefs = app.globalData.userPreferences || {}
  this.setData({ fontSizeClass: prefs.fontSize || 'normal' })

  // 检查新手期
  this.checkGuideStatus()

  // 检查通知订阅状态
  this.checkNotificationStatus()
  },

  onShow() {
  // 刷新收益数据
  this.refreshEarnings()
  },

  onFontSizeChange(fontSize) {
  this.setData({ fontSizeClass: fontSize })
  },

  checkGuideStatus() {
  // 模拟检查新手期状态
  // 实际场景从服务端获取
  const guideEndTime = wx.getStorageSync('mom_guide_end_time')
  if (guideEndTime) {
      const now = Date.now()
      const diff = guideEndTime - now
      if (diff > 0) {
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000))
    this.setData({
          showGuide: true,
          guideDaysLeft: days
    })
    // 计算步骤
    const elapsed = 30 - days
    if (elapsed < 7) this.setData({ stepIndex: 0 })
    else if (elapsed < 20) this.setData({ stepIndex: 1 })
    else this.setData({ stepIndex: 2 })
      } else {
    this.setData({ showGuide: false })
      }
  } else {
      // 首次进入，设置新手期30天
      const endTime = Date.now() + 30 * 24 * 60 * 60 * 1000
      wx.setStorageSync('mom_guide_end_time', endTime)
  }
  },

  checkNotificationStatus() {
  const subscribed = momNotification.isSubscribed()
  this.setData({ hasNewSetting: !subscribed })
  },

  refreshEarnings() {
  // 从 globalData 读取真实数据
  const momData = app.globalData.momData || {}
  this.setData({
      totalEarnings: (momData.totalEarnings || 0).toFixed(2),
      pendingEarnings: (momData.pendingEarnings || 0).toFixed(2),
      settledEarnings: (momData.settledEarnings || 0).toFixed(2)
  })
  },

  //===WXML bindtap 别名（映射到已有方法）===onMaterialTap() { this.goToMaterials() },
  onRewardsTap() { this.goToEarnings() },
  onWithdrawTap() { this.goToWithdraw() },
  onRulesTap() { this.goToRules() },
  onServiceTap() { this.contactCustomerService() },
  onNotificationTap() { this.goToSettings() },
  onGuideDone() {
  this.setData({ showGuide: false })
  wx.setStorageSync('mom_guide_done', true)
  },

  // 跳转到规则说明页
  goToRules() {
  wx.navigateTo({ url: '/pages/mom/rules/rules' })
  },

  // 跳转到通知设置
  goToSettings() {
  wx.navigateTo({ url: '/pages/mom/settings/settings' })
  },

  // 跳转到常见问题
  goToFaq() {
  wx.navigateTo({ url: '/pages/mom/faq/faq' })
  },

  // 跳转到素材库
  goToMaterials() {
  wx.navigateTo({ url: '/pages/mom/materials/materials' })
  },

  // 跳转到我的奖励
  goToEarnings() {
  wx.navigateTo({ url: '/pages/mom/earnings/earnings' })
  },

  // 跳转到提现
  goToWithdraw() {
  wx.navigateTo({ url: '/pages/mom/withdraw/withdraw' })
  },

  // 联系客服（使用微信官方客服按钮）
  contactCustomerService() {
  wx.showActionSheet({
      itemList: ['在线客服', '常见问题'],
      success: (res) =>{
    if (res.tapIndex ===0) {
          // 使用微信官方客服功能
          if (wx.openCustomerServiceChat) {
      wx.openCustomerServiceChat({
              extInfo: { url: '' },
              success: () =>{},
              fail: (err) =>{
        console.warn('[mom] 打开客服失败: ', err)
        wx.showModal({
                  title: '提示',
                  content: '暂无法打开客服，您可以查看常见问题或稍后再试',
                  confirmText: '查看常见问题',
                  success: (r) =>{
          if (r.confirm) wx.navigateTo({ url: '/pages/mom/faq/faq' })
                  }
        })
              }
      })
          } else {
      wx.showModal({
              title: '提示',
              content: '暂无法打开客服，您可以查看常见问题或稍后再试',
              cancelText: '取消',
              confirmText: '查看常见问题',
              success: (modalRes) =>{
        if (modalRes.confirm) {
                  wx.navigateTo({ url: '/pages/mom/faq/faq' })
        }
              }
      })
          }
    } else if (res.tapIndex ===1) {
          wx.navigateTo({ url: '/pages/mom/faq/faq' })
    }
      }
  })
  },

  // 查看全部记录
  viewAllRecords() {
  wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  // 去逛逛（从空状态跳转到首页）
  goShopping() {
  wx.switchTab({ url: '/pages/index/index' })
  }
})
