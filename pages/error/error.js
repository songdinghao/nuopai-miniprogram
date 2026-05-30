// pages/error/error.js - 错误状态页面
const app = getApp()

Page({
  data: {
  // 错误类型
  errorType: 'notfound', // notfound, network, server, timeout, custom

  // 错误信息配置
  errorConfigs: {
      notfound: {
    icon: '🔍',
    title: '页面找不到',
    desc: '抱歉，您访问的页面不存在或已被删除',
    primaryBtn: '返回首页',
    primaryAction: 'backHome',
    secondaryBtn: '返回上一页',
    secondaryAction: 'goBack'
      },
      network: {
    icon: '📡',
    title: '网络连接失败',
    desc: '请检查网络设置后重试',
    primaryBtn: '重试',
    primaryAction: 'retry',
    secondaryBtn: '返回首页',
    secondaryAction: 'backHome'
      },
      server: {
    icon: '⚙',
    title: '服务器繁忙',
    desc: '服务器正在维护中，请稍后重试',
    primaryBtn: '重试',
    primaryAction: 'retry',
    secondaryBtn: '返回首页',
    secondaryAction: 'backHome'
      },
      timeout: {
    icon: '⏰',
    title: '请求超时',
    desc: '请求响应时间过长，请稍后重试',
    primaryBtn: '重试',
    primaryAction: 'retry',
    secondaryBtn: '返回首页',
    secondaryAction: 'backHome'
      },
      custom: {
    icon: '⚠',
    title: '出错了',
    desc: '出了点小问题，请稍后重试',
    primaryBtn: '重试',
    primaryAction: 'retry',
    secondaryBtn: '返回首页',
    secondaryAction: 'backHome'
      }
  },

  // 错误详情
  errorMessage: '',
  errorCode: ''
  },

  onLoad(options) {
  app.globalData.currentPage = 'error'

  const errorType = options.type || 'notfound'
  const errorMessage = decodeURIComponent(options.message || '')
  const errorCode = options.code || ''

  this.setData({
      errorType: this.data.errorConfigs[errorType] ? errorType : 'notfound',
      errorMessage,
      errorCode
  })
  },

  onShareAppMessage() {
  return {
      title: '诺派永生花商城',
      path: '/pages/index/index'
  }
  },

  // 主要按钮操作
  onPrimaryAction() {
  const config = this.data.errorConfigs[this.data.errorType]
  const action = config.primaryAction

  if (action ==='backHome') {
      this.backHome()
  } else if (action ==='goBack') {
      this.goBack()
  } else if (action ==='retry') {
      this.retry()
  }
  },

  // 次要按钮操作
  onSecondaryAction() {
  const config = this.data.errorConfigs[this.data.errorType]
  const action = config.secondaryAction

  if (action ==='backHome') {
      this.backHome()
  } else if (action ==='goBack') {
      this.goBack()
  } else if (action ==='retry') {
      this.retry()
  }
  },

  backHome() {
  wx.switchTab({ url: '/pages/index/index' })
  },

  goBack() {
  wx.navigateBack()
  },

  // 重试
  retry() {
  wx.showToast({ title: '正在重试...', icon: 'none' })
  // 触发全局重试事件
  const pages = getCurrentPages()
  if (pages.length > 1) {
      const prevPage = pages[pages.length - 2]
      if (prevPage && prevPage.retryLoad) {
    prevPage.retryLoad()
      }
      wx.navigateBack()
  } else {
      wx.switchTab({ url: '/pages/index/index' })
  }
  },

  // 查看错误详情（开发者用）
  onViewDetail() {
  if (this.data.errorMessage) {
      wx.showModal({
    title: '错误详情',
    content: `错误码：${this.data.errorCode || 'N/A'}\n错误信息：${this.data.errorMessage || 'N/A'}`,
    showCancel: false
      })
  }
  }
})
