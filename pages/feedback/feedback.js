// pages/feedback/feedback.js - 意见反馈页面
const app = getApp()

Page({
  data: {
    feedbackType: 'suggest',
    typeList: [
      { key: 'suggest', name: '功能建议' },
      { key: 'bug', name: '问题反馈' },
      { key: 'other', name: '其他' }
    ],
    content: '',
    contact: '',
    maxLength: 500
  },

  onLoad() {
    app.globalData.currentPage = 'feedback'
  },

  // 切换反馈类型
  onTypeTap(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ feedbackType: type })
  },

  // 输入内容
  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  // 输入联系方式
  onContactInput(e) {
    this.setData({ contact: e.detail.value })
  },

  // 提交反馈
  onSubmit() {
    const { content, contact, feedbackType } = this.data

    if (!content.trim()) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' })
      return
    }

    if (content.trim().length < 5) {
      wx.showToast({ title: '反馈内容至少5个字', icon: 'none' })
      return
    }

    wx.showLoading({ title: '提交中...', mask: true })

    // 模拟提交
    setTimeout(() => {
      wx.hideLoading()
      wx.showModal({
        title: '提交成功',
        content: '感谢您的反馈，我们会认真处理每一条建议！',
        confirmText: '返回',
        confirmColor: '#2D8C7A',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })

      app.trackEvent('feedback_submit', {
        type: feedbackType,
        length: content.length
      })
    }, 800)
  },

  onShareAppMessage() {
    return {
      title: '诺派永生花 - 意见反馈',
      path: '/pages/feedback/feedback'
    }
  }
})
