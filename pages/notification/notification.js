// pages/notification/notification.js - 消息通知页面
const app = getApp()
const notificationManager = require('../../utils/notification-manager.js')

Page({
  data: {
  // 页面状态
  loading: true,
  refreshing: false,
  isEmpty: false,

  // 通知列表
  filteredNotifications: [],
  unreadCount: 0,

  // 通知类型筛选
  currentTab: 'all',
  tabs: [
      { id: 'all', name: '全部' },
      { id: 'order', name: '订单' },
      { id: 'marketing', name: '营销' },
      { id: 'system', name: '系统' }
  ]
  },

  onLoad(options) {
  app.globalData.currentPage = 'notification'
  this.loadNotifications()
  },

  onShow() {
  // 每次显示时刷新未读数
  this.updateUnreadCount()
  },

  onPullDownRefresh() {
  this.setData({ refreshing: true })
  this.refreshNotifications()
  },

  onShareAppMessage() {
  return {
      title: '诺派永生花 - 消息通知',
      path: '/pages/notification/notification'
  }
  },

  // 加载通知列表
  loadNotifications() {
  this.setData({ loading: true })

  // 首次使用时初始化模拟数据
  notificationManager.initMockData()

  // 短延时模拟异步加载
  setTimeout(() =>{
      const notifications = notificationManager.getNotifications(this.data.currentTab)
      const unreadCount = notificationManager.getUnreadCount()

      this.setData({
    loading: false,
    filteredNotifications: notifications,
    unreadCount,
    isEmpty: notifications.length ===0
      })
  }, 300)
  },

  // 更新未读数量
  updateUnreadCount() {
  const unreadCount = notificationManager.getUnreadCount()
  this.setData({ unreadCount })
  },

  // 刷新通知
  refreshNotifications() {
  notificationManager.initMockData()
  const notifications = notificationManager.getNotifications(this.data.currentTab)
  const unreadCount = notificationManager.getUnreadCount()

  this.setData({
      filteredNotifications: notifications,
      unreadCount,
      isEmpty: notifications.length ===0
  })

  setTimeout(() =>{
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
      wx.showToast({ title: '刷新成功', icon: 'success', duration: 1500 })
  }, 500)
  },

  // 切换Tab
  onTabTap(e) {
  const tabId = e.currentTarget.dataset.tab
  this.setData({ currentTab: tabId })

  // 重新筛选
  const notifications = notificationManager.getNotifications(tabId)
  this.setData({
      filteredNotifications: notifications,
      isEmpty: notifications.length ===0
  })
  },

  // 点击通知
  onNotificationTap(e) {
  const index = e.currentTarget.dataset.index
  const notification = this.data.filteredNotifications[index]

  // 标记为已读
  if (!notification.isRead) {
      notificationManager.markAsRead(notification.id)
      this.updateUnreadCount()
  }

  // 根据类型跳转
  if (notification.type ==='order') {
      const orderId = notification.data && notification.data.orderId
      if (orderId) {
    wx.navigateTo({ url: `/pages/order/detail?id=${orderId}` })
      } else {
    wx.navigateTo({ url: '/pages/order/list' })
      }
  } else if (notification.type ==='marketing') {
      // 营销通知：跳转到促销页或显示详情
      const promoId = notification.data && notification.data.promotionId
      if (promoId) {
    wx.navigateTo({ url: `/pages/promotion/promotion?id=${promoId}` })
      } else {
    wx.showModal({
        title: notification.title,
        content: notification.summary,
        confirmText: '知道了',
        confirmColor: '#2D8C7A',
        showCancel: false
    })
      }
  } else if (notification.type ==='system') {
      // 系统通知：弹窗显示详情
      wx.showModal({
    title: notification.title,
    content: notification.summary,
    confirmText: '知道了',
    confirmColor: '#2D8C7A',
    showCancel: false
      })
  } else {
      wx.showModal({
    title: notification.title || '消息详情',
    content: notification.summary || '暂无详细信息',
    confirmText: '知道了',
    confirmColor: '#2D8C7A',
    showCancel: false
      })
  }

  // 追踪事件
  app.trackEvent('notification_click', {
      type: notification.type,
      id: notification.id
  })
  },

  // 全部已读
  onMarkAllRead() {
  if (this.data.unreadCount ===0) {
      wx.showToast({ title: '暂无未读消息', icon: 'none' })
      return
  }

  wx.showModal({
      title: '确认',
      content: '确定将所有消息标记为已读？',
      confirmColor: "#2D8C7A",
      success: (res) =>{
    if (res.confirm) {
          notificationManager.markAllAsRead()
          // 刷新当前列表
          const notifications = notificationManager.getNotifications(this.data.currentTab)
          this.setData({
      filteredNotifications: notifications,
      unreadCount: 0
          })
          wx.showToast({ title: '已全部标记为已读', icon: 'success' })

          app.trackEvent('notification_mark_all_read')
    }
      }
  })
  },

  // 删除通知
  onDeleteNotification(e) {
  const index = e.currentTarget.dataset.index
  const notification = this.data.filteredNotifications[index]

  notificationManager.deleteNotification(notification.id)

  // 重新加载当前筛选列表
  const notifications = notificationManager.getNotifications(this.data.currentTab)
  const unreadCount = notificationManager.getUnreadCount()

  this.setData({
      filteredNotifications: notifications,
      unreadCount,
      isEmpty: notifications.length ===0
  })

  wx.showToast({ title: '已删除', icon: 'success' })

  app.trackEvent('notification_delete', {
      type: notification.type
  })
  },

  // 点击空状态按钮
  onBackToHome() {
  wx.switchTab({ url: '/pages/index/index' })
  }
})
