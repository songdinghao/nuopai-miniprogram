// pages/mom/settings/settings.js - 通知设置逻辑
const app = getApp()
const momNotification = require('../../../utils/mom-notification.js')

Page({
  data: {
  fontSizeClass: '',
  fontSizeLevel: 'normal',
  fontSizeText: '标准',
  notificationEnabled: true,
  subscribed: false,
  largeFontEnabled: false,
  showGuideCountdown: true,
  guideDaysLeft: 30
  },

  onLoad() {
  // 加载用户偏好
  app.loadUserPreferences()
  app.watchFontSizeChange(this.onFontSizeChange.bind(this))

  const prefs = app.globalData.userPreferences || {}
  const fontSize = prefs.fontSize || 'normal'
  this.setData({
      fontSizeClass: fontSize,
      fontSizeLevel: fontSize,
      fontSizeText: this._getFontSizeText(fontSize),
      largeFontEnabled: fontSize !== 'normal',
      notificationEnabled: prefs.momNotification !== false,
      subscribed: momNotification.isSubscribed()
  })

  this.getGuideDays()
  },

  onFontSizeChange(fontSize) {
  this.setData({
      fontSizeClass: fontSize,
      fontSizeLevel: fontSize,
      fontSizeText: this._getFontSizeText(fontSize)
  })
  },

  _getFontSizeText(level) {
  const map = { 'normal': '标准', 'large': '大', 'extra-large': '超大' }
  return map[level] || '标准'
  },

  getGuideDays() {
  const guideEndTime = wx.getStorageSync('mom_guide_end_time')
  if (guideEndTime) {
      const now = Date.now()
      const diff = guideEndTime - now
      if (diff > 0) {
    this.setData({ guideDaysLeft: Math.ceil(diff / (24 * 60 * 60 * 1000)) })
      } else {
    this.setData({ guideDaysLeft: 0 })
      }
  }
  },

  goBack() {
  wx.navigateBack()
  },

  // 切换收益提醒
  toggleNotification(e) {
  const enabled = e.detail.value
  this.setData({ notificationEnabled: enabled })

  // 保存偏好设置
  const prefs = app.globalData.userPreferences || {}
  prefs.momNotification = enabled
  wx.setStorageSync('userPreferences', prefs)
  app.globalData.userPreferences = prefs

  if (enabled) {
      wx.showToast({ title: '已开启收益提醒', icon: 'success' })
  } else {
      wx.showToast({ title: '已关闭收益提醒', icon: 'none' })
  }
  },

  // 订阅通知
  async handleSubscribe() {
  if (this.data.subscribed) {
      wx.showToast({ title: '已订阅', icon: 'success' })
      return
  }

  wx.showLoading({ title: '请求订阅...' })
  try {
      const agreed = await momNotification.requestSubscribe(momNotification.SUBSCRIBE_TEMPLATE_ID)
      this.setData({ subscribed: agreed })
      if (agreed) {
    wx.showToast({ title: '订阅成功', icon: 'success' })
      } else {
    wx.showToast({ title: '已取消订阅', icon: 'none' })
      }
  } catch (err) {
      wx.showToast({ title: '订阅失败', icon: 'none' })
  }
  wx.hideLoading()
  },

  // 切换大字版
  toggleLargeFont(e) {
  const enabled = e.detail.value
  this.setData({ largeFontEnabled: enabled })

  const newSize = enabled ? 'large' : 'normal'
  this.setFontSizeByLevel(newSize)
  },

  setFontSize(e) {
  const size = e.currentTarget.dataset.size
  this.setFontSizeByLevel(size)
  },

  setFontSizeByLevel(level) {
  const prefs = app.globalData.userPreferences || {}
  prefs.fontSize = level
  wx.setStorageSync('userPreferences', prefs)
  app.globalData.userPreferences = prefs

  this.setData({
      fontSizeLevel: level,
      fontSizeText: this._getFontSizeText(level),
      largeFontEnabled: level !== 'normal'
  })

  // 通知全局字体变化
  app.applyUserPreferences(prefs)
  },

  // 切换新手期倒计时
  toggleGuideCountdown(e) {
  const enabled = e.detail.value
  this.setData({ showGuideCountdown: enabled })

  const prefs = app.globalData.userPreferences || {}
  prefs.showGuideCountdown = enabled
  wx.setStorageSync('userPreferences', prefs)
  app.globalData.userPreferences = prefs
  }
})
