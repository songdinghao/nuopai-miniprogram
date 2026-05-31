// pages/user/history/history.js - 浏览历史页面
Page({
  data: {
    historyList: [],
    isEmpty: true,
    loading: true
  },

  onLoad() {
    this.loadHistory()
  },

  onShow() {
    this.loadHistory()
  },

  onPullDownRefresh() {
    this.loadHistory()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  },

  loadHistory() {
    try {
      const history = wx.getStorageSync('browse_history') || []
      // 格式化时间
      const historyList = history.map(item => ({
        ...item,
        timeText: this.formatTime(item.timestamp)
      }))
      this.setData({
        historyList,
        isEmpty: historyList.length === 0,
        loading: false
      })
    } catch (e) {
      console.warn('加载浏览历史失败', e)
      this.setData({ loading: false, isEmpty: true })
    }
  },

  formatTime(timestamp) {
    if (!timestamp) return ''
    const now = Date.now()
    const diff = now - timestamp
    const oneMinute = 60 * 1000
    const oneHour = 60 * oneMinute
    const oneDay = 24 * oneHour

    if (diff < oneMinute) return '刚刚'
    if (diff < oneHour) return Math.floor(diff / oneMinute) + '分钟前'
    if (diff < oneDay) return Math.floor(diff / oneHour) + '小时前'
    if (diff < 7 * oneDay) return Math.floor(diff / oneDay) + '天前'

    const date = new Date(timestamp)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  },

  // 点击商品
  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product/detail?id=${id}`
    })
  },

  // 删除单条记录
  onDeleteItem(e) {
    const id = e.currentTarget.dataset.id
    let history = wx.getStorageSync('browse_history') || []
    history = history.filter(item => item.id !== id)
    wx.setStorageSync('browse_history', history)
    this.loadHistory()
    wx.showToast({ title: '已删除', icon: 'success', duration: 1000 })
  },

  // 清空浏览历史
  onClearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有浏览历史吗？',
      confirmText: '清空',
      confirmColor: '#e64340',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('browse_history')
          this.loadHistory()
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  },

  onShareAppMessage() {
    return {
      title: '诺派永生花 - 高品质永生花产品',
      path: '/pages/index/index'
    }
  }
})
