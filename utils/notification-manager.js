// utils/notification - manager.js - 消息通知管理器
// 提供通知的增删改查、已读管理、未读计数功能

const STORAGE_KEY = 'app_notifications'

// 通知类型定义
const NOTIFICATION_TYPES = {
  ORDER: 'order',
  MARKETING: 'marketing',
  SYSTEM: 'system'
}

const TYPE_NAMES = {
  order: '订单通知',
  marketing: '营销通知',
  system: '系统通知'
}

const TYPE_ICONS = {
  order: '/assets/icons/notification-order.png',
  marketing: '/assets/icons/notification-marketing.png',
  system: '/assets/icons/notification-system.png'
}

/**
  * 生成唯一ID
  */
function generateId() {
  return 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

/**
  * 获取所有通知
  * @param {string} [type] - 按类型筛选 (order/marketing/system)
  * @param {string} [status] - 按状态筛选 (read/unread)
  * @returns {Array} 通知列表
  */
function getNotifications(type, status) {
  let notifications = wx.getStorageSync(STORAGE_KEY) || []

  if (type && type !== 'all') {
  notifications = notifications.filter(n =>n.type ===type)
  }

  if (status ==='unread') {
  notifications = notifications.filter(n =>!n.isRead)
  } else if (status ==='read') {
  notifications = notifications.filter(n =>n.isRead)
  }

  // 按时间降序排列
  return notifications.sort((a, b) =>{
  const timeA = new Date(a.createTime).getTime()
  const timeB = new Date(b.createTime).getTime()
  return timeB - timeA
  }).map(n =>({
  ...n,
  typeName: TYPE_NAMES[n.type] || '系统通知',
  avatar: TYPE_ICONS[n.type] || TYPE_ICONS.system
  }))
}

/**
  * 获取通知（对外暴露的便捷方法，支持筛选）
  * @param {string} [type] - 按类型筛选
  * @param {string} [status] - 按状态筛选
  * @returns {Array} 通知列表
  */
function getNotificationList(type, status) {
  return getNotifications(type, status)
}

/**
  * 创建通知
  * @param {Object} data - 通知数据
  * @param {string} data.type - 通知类型 (order/marketing/system)
  * @param {string} data.title - 通知标题
  * @param {string} data.summary - 内容摘要
  * @param {Object} [data.data] - 附加数据（如订单ID等）
  * @returns {Object} 创建的通知对象
  */
function createNotification(data) {
  const notifications = wx.getStorageSync(STORAGE_KEY) || []

  const notification = {
  id: generateId(),
  type: data.type || NOTIFICATION_TYPES.SYSTEM,
  title: data.title || '',
  summary: data.summary || '',
  data: data.data || null,
  isRead: false,
  createTime: new Date().toISOString(),
  updateTime: new Date().toISOString()
  }

  notifications.unshift(notification)

  // 最多保留100条通知，超出则删除最旧的
  if (notifications.length > 100) {
  notifications.splice(100)
  }

  wx.setStorageSync(STORAGE_KEY, notifications)

  return notification
}

/**
  * 标记单条通知为已读
  * @param {string} notificationId - 通知ID
  * @returns {boolean} 是否操作成功
  */
function markAsRead(notificationId) {
  const notifications = wx.getStorageSync(STORAGE_KEY) || []
  const index = notifications.findIndex(n =>n.id ===notificationId)

  if (index ===-1) return false

  notifications[index].isRead = true
  notifications[index].updateTime = new Date().toISOString()

  wx.setStorageSync(STORAGE_KEY, notifications)
  return true
}

/**
  * 标记所有通知为已读
  */
function markAllAsRead() {
  const notifications = wx.getStorageSync(STORAGE_KEY) || []

  notifications.forEach(n =>{
  n.isRead = true
  n.updateTime = new Date().toISOString()
  })

  wx.setStorageSync(STORAGE_KEY, notifications)
}

/**
  * 删除单条通知
  * @param {string} id - 通知ID
  * @returns {boolean} 是否删除成功
  */
function deleteNotification(id) {
  let notifications = wx.getStorageSync(STORAGE_KEY) || []
  const index = notifications.findIndex(n =>n.id ===id)

  if (index ===-1) return false

  notifications.splice(index, 1)
  wx.setStorageSync(STORAGE_KEY, notifications)
  return true
}

/**
  * 获取未读通知数量
  * @returns {number} 未读数量
  */
function getUnreadCount() {
  const notifications = wx.getStorageSync(STORAGE_KEY) || []
  return notifications.filter(n =>!n.isRead).length
}

/**
  * 初始化模拟数据（首次使用时生成）
  */
function initMockData() {
  const notifications = wx.getStorageSync(STORAGE_KEY)
  if (notifications && notifications.length > 0) return

  const mockNotifications = [
  {
      id: generateId(),
      type: 'order',
      title: '订单已发货',
      summary: '您的订单 #20260430001 已发货，物流单号：SF1234567890',
      data: { orderId: '20260430001', expressNo: 'SF1234567890' },
      isRead: false,
      createTime: '2026 - 04 - 30T10: 30: 00.000Z',
      updateTime: '2026 - 04 - 30T10: 30: 00.000Z'
  },
  {
      id: generateId(),
      type: 'order',
      title: '订单已支付',
      summary: '您的订单 #20260429003 已支付成功，我们将尽快为您发货',
      data: { orderId: '20260429003' },
      isRead: false,
      createTime: '2026 - 04 - 29T15: 20: 00.000Z',
      updateTime: '2026 - 04 - 29T15: 20: 00.000Z'
  },
  {
      id: generateId(),
      type: 'marketing',
      title: '春季特惠活动',
      summary: '春季特惠来袭！满199减20，满299减50，全场包邮，快来抢购吧',
      data: { promotionId: 'spring2026' },
      isRead: false,
      createTime: '2026 - 04 - 28T09: 00: 00.000Z',
      updateTime: '2026 - 04 - 28T09: 00: 00.000Z'
  },
  {
      id: generateId(),
      type: 'system',
      title: '系统维护通知',
      summary: '系统将于2026年5月1日凌晨2: 00 - 4: 00进行维护升级，期间可能影响正常使用',
      data: null,
      isRead: false,
      createTime: '2026 - 04 - 27T18: 00: 00.000Z',
      updateTime: '2026 - 04 - 27T18: 00: 00.000Z'
  },
  {
      id: generateId(),
      type: 'order',
      title: '订单已完成',
      summary: '您的订单 #20260425002 已完成，感谢您的购买，欢迎再次光临',
      data: { orderId: '20260425002' },
      isRead: true,
      createTime: '2026 - 04 - 26T14: 30: 00.000Z',
      updateTime: '2026 - 04 - 26T14: 30: 00.000Z'
  },
  {
      id: generateId(),
      type: 'marketing',
      title: '积分翻倍活动',
      summary: '5月1日 - 5月7日，购买永生花商品享双倍积分，积分可抵现金使用',
      data: { promotionId: 'doublePoints' },
      isRead: true,
      createTime: '2026 - 04 - 25T10: 00: 00.000Z',
      updateTime: '2026 - 04 - 25T10: 00: 00.000Z'
  },
  {
      id: generateId(),
      type: 'marketing',
      title: '您有一张优惠券待领取',
      summary: '新人专享20元优惠券已发放到您的账户，满100元即可使用，有效期30天',
      data: { couponId: 'new_user_20' },
      isRead: true,
      createTime: '2026 - 04 - 24T08: 30: 00.000Z',
      updateTime: '2026 - 04 - 24T08: 30: 00.000Z'
  },
  {
      id: generateId(),
      type: 'system',
      title: '隐私政策更新',
      summary: '我们更新了隐私政策，请您查阅最新版本，感谢您的信任与支持',
      data: null,
      isRead: true,
      createTime: '2026 - 04 - 23T16: 00: 00.000Z',
      updateTime: '2026 - 04 - 23T16: 00: 00.000Z'
  },
  {
      id: generateId(),
      type: 'order',
      title: '退款已到账',
      summary: '您的退款订单 #20260420001 已处理完成，退款金额¥298.00已原路返回',
      data: { orderId: '20260420001', refundAmount: 298 },
      isRead: true,
      createTime: '2026 - 04 - 22T11: 20: 00.000Z',
      updateTime: '2026 - 04 - 22T11: 20: 00.000Z'
  },
  {
      id: generateId(),
      type: 'system',
      title: '版本更新通知',
      summary: '小程序已更新至v1.1.0版本，新增AR预览功能，优化搜索体验',
      data: { version: '1.1.0' },
      isRead: true,
      createTime: '2026 - 04 - 21T09: 00: 00.000Z',
      updateTime: '2026 - 04 - 21T09: 00: 00.000Z'
  }
  ]

  wx.setStorageSync(STORAGE_KEY, mockNotifications)
}

/**
  * 生成订单状态变更通知
  * @param {Object} orderData - 订单数据
  */
function notifyOrderStatusChange(orderData) {
  const messages = {
  paid: { title: '订单已支付', summary: `您的订单 #${orderData.orderId} 已支付成功，我们将尽快为您发货` },
  shipped: { title: '订单已发货', summary: `您的订单 #${orderData.orderId} 已发货，物流单号：${orderData.expressNo || '待更新'}` },
  completed: { title: '订单已完成', summary: `您的订单 #${orderData.orderId} 已完成，感谢您的购买` },
  refund: { title: '退款已处理', summary: `您的退款订单 #${orderData.orderId} 已处理完成，退款金额¥${orderData.amount}已原路返回` }
  }

  const message = messages[orderData.status]
  if (!message) return null

  return createNotification({
  type: NOTIFICATION_TYPES.ORDER,
  title: message.title,
  summary: message.summary,
  data: { orderId: orderData.orderId, status: orderData.status }
  })
}

/**
  * 生成优惠券到期提醒通知
  * @param {Object} couponData - 优惠券数据
  */
function notifyCouponExpiring(couponData) {
  return createNotification({
  type: NOTIFICATION_TYPES.MARKETING,
  title: '优惠券即将到期',
  summary: `您有 ${couponData.count || 1} 张优惠券即将在 ${couponData.days} 天后到期，请尽快使用`,
  data: { couponId: couponData.couponId, daysLeft: couponData.days }
  })
}

/**
  * 生成纪念日提醒通知
  * @param {Object} anniversaryData - 纪念日数据
  */
function notifyAnniversaryReminder(anniversaryData) {
  const dayText = anniversaryData.daysUntil ===0
  ? '今天'
  : `还有 ${anniversaryData.daysUntil} 天`

  return createNotification({
  type: NOTIFICATION_TYPES.MARKETING,
  title: `纪念日提醒`,
  summary: `${dayText}是${anniversaryData.name}，别忘了准备礼物哦`,
  data: { anniversaryId: anniversaryData.id, daysUntil: anniversaryData.daysUntil }
  })
}

/**
  * 生成系统公告通知
  * @param {Object} systemData - 系统公告数据
  */
function notifySystemAnnouncement(systemData) {
  return createNotification({
  type: NOTIFICATION_TYPES.SYSTEM,
  title: systemData.title,
  summary: systemData.summary,
  data: systemData.data || null
  })
}

/**
  * 清除所有通知
  */
function clearAll() {
  wx.setStorageSync(STORAGE_KEY, [])
}

module.exports = {
  NOTIFICATION_TYPES,
  getNotifications,
  getNotificationList,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  initMockData,
  notifyOrderStatusChange,
  notifyCouponExpiring,
  notifyAnniversaryReminder,
  notifySystemAnnouncement,
  clearAll
}
