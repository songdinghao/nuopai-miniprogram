// pages/user/collection/collection.js - 收藏列表页面
Page({
  data: {
    collectionList: [],
    isEmpty: true,
    loading: true,
    // 左滑删除相关
    startX: 0,
    currentIndex: -1
  },

  onLoad() {
    this.loadCollections()
  },

  onShow() {
    this.loadCollections()
  },

  onPullDownRefresh() {
    this.loadCollections()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  },

  loadCollections() {
    try {
      const collections = wx.getStorageSync('userCollections') || []
      // 格式化时间和添加滑动偏移
      const collectionList = collections.map(item => ({
        ...item,
        timeText: this.formatTime(item.collectTime),
        offset: 0
      }))
      this.setData({
        collectionList,
        isEmpty: collectionList.length === 0,
        loading: false,
        currentIndex: -1
      })
    } catch (e) {
      console.warn('加载收藏列表失败', e)
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
    // 如果有滑动偏移，先收起
    if (this.data.currentIndex >= 0) {
      this.resetSwipe()
      return
    }
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product/detail?id=${id}`
    })
  },

  // 左滑开始
  onTouchStart(e) {
    this.setData({
      startX: e.touches[0].clientX
    })
  },

  // 左滑移动
  onTouchMove(e) {
    const index = e.currentTarget.dataset.index
    const startX = this.data.startX
    const moveX = e.touches[0].clientX
    const diff = startX - moveX

    // 只处理左滑
    if (diff > 10) {
      const offset = Math.min(diff, 120)
      const key = `collectionList[${index}].offset`
      this.setData({
        [key]: offset,
        currentIndex: index
      })
    }
  },

  // 左滑结束
  onTouchEnd(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.collectionList[index]
    if (!item) return

    // 如果滑动距离大于60，展开删除按钮
    if (item.offset > 60) {
      const key = `collectionList[${index}].offset`
      this.setData({ [key]: 120, currentIndex: index })
    } else {
      // 回弹
      const key = `collectionList[${index}].offset`
      this.setData({ [key]: 0, currentIndex: -1 })
    }
  },

  // 收起滑动
  resetSwipe() {
    const { currentIndex, collectionList } = this.data
    if (currentIndex >= 0 && currentIndex < collectionList.length) {
      const key = `collectionList[${currentIndex}].offset`
      this.setData({ [key]: 0, currentIndex: -1 })
    }
  },

  // 删除收藏
  onDeleteItem(e) {
    const id = e.currentTarget.dataset.id
    let collections = wx.getStorageSync('userCollections') || []
    collections = collections.filter(item => item.id !== id)
    wx.setStorageSync('userCollections', collections)
    this.loadCollections()
    wx.showToast({ title: '已取消收藏', icon: 'success', duration: 1000 })
  },

  // 清空收藏
  onClearCollections() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有收藏吗？',
      confirmText: '清空',
      confirmColor: '#e64340',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userCollections')
          this.loadCollections()
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  },

  // 去逛逛
  onGoHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  onShareAppMessage() {
    return {
      title: '诺派永生花 - 高品质永生花产品',
      path: '/pages/index/index'
    }
  }
})
