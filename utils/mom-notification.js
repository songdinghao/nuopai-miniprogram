/**
  * mom - notification.js - 兼职妈妈收益通知模块
  * 支持收益到账通知、每日发送限制、订阅请求
  */

// 订阅消息模板ID（需在微信公众平台配置后替换）
// 前往 mp.weixin.qq.com -> 功能 -> 订阅消息 -> 选用模板 获取
const SUBSCRIBE_TEMPLATE_ID = ''

// Storage keys
const STORAGE_KEY_DAILY = 'mom_notification_daily'
const STORAGE_KEY_SUBSCRIBED = 'mom_notification_subscribed'

/**
  * 检查当日是否已发送过通知
  * @param {string} userId - 用户ID
  * @returns {boolean} 今日是否已达到上限
  */
function checkDailyLimit(userId) {
  if (!userId) return true

  const today = new Date()
  const dateStr = today.getFullYear() + '-' +
  String(today.getMonth() + 1).padStart(2, '0') + '-' +
  String(today.getDate()).padStart(2, '0')

  const records = wx.getStorageSync(STORAGE_KEY_DAILY) || {}
  const dailyKey = userId + '_' + dateStr
  const count = records[dailyKey] || 0

  // 单日最多1条
  if (count >=1) {
  return false
  }
  return true // 还可以发送
}

/**
  * 记录当日通知发送
  * @param {string} userId - 用户ID
  */
function _recordDailySend(userId) {
  const today = new Date()
  const dateStr = today.getFullYear() + '-' +
  String(today.getMonth() + 1).padStart(2, '0') + '-' +
  String(today.getDate()).padStart(2, '0')

  const records = wx.getStorageSync(STORAGE_KEY_DAILY) || {}
  const dailyKey = userId + '_' + dateStr
  records[dailyKey] = (records[dailyKey] || 0) + 1
  wx.setStorageSync(STORAGE_KEY_DAILY, records)
}

/**
  * 发送收益到账通知（模拟实现）
  * 实际场景需配合微信服务端推送
  * @param {Object} orderInfo - 订单信息
  * @param {string} orderInfo.orderId - 订单ID
  * @param {string} orderInfo.userId - 用户ID
  * @param {number} orderInfo.amount - 收益金额
  * @param {string} orderInfo.productName - 商品名称
  * @returns {Object|null} 通知结果
  */
function sendSettlementNotification(orderInfo) {
  if (!orderInfo || !orderInfo.userId) {
  console.warn('[mom - notification] 通知发送失败：缺少用户信息')
  return null
  }

  // 检查每日限制
  if (!checkDailyLimit(orderInfo.userId)) {
  return { success: false, reason: 'daily_limit' }
  }

  // 检查是否已订阅通知
  const subscribed = wx.getStorageSync(STORAGE_KEY_SUBSCRIBED)
  if (!subscribed) {
  return { success: false, reason: 'not_subscribed' }
  }

  // 模拟推送通知到微信服务通知
  // 实际场景需调用微信服务端API发送模板消息
  const notificationData = {
  title: '分享津贴到账通知',
  message: `恭喜！来自「${orderInfo.productName || '商品'}」的分享津贴 ¥${(orderInfo.amount || 0).toFixed(2)} 已到账`,
  orderId: orderInfo.orderId,
  amount: orderInfo.amount,
  time: new Date().toISOString(),
  type: 'settlement'
  }

  // 记录到本地通知列表
  const notificationManager = require('./notification-manager.js')
  notificationManager.createNotification({
  type: notificationManager.NOTIFICATION_TYPES.MARKETING,
  title: notificationData.title,
  summary: notificationData.message,
  data: { orderId: orderInfo.orderId, amount: orderInfo.amount, type: 'mom_settlement' }
  })

  // 记录当日发送
  _recordDailySend(orderInfo.userId)

  return { success: true, data: notificationData }
}

/**
  * 请求用户订阅通知
  * 使用微信订阅消息API
  * @param {string} tmplId - 模板ID（可选，新版订阅消息模板ID）
  * @returns {Promise < boolean > } 是否同意订阅
  */
function requestSubscribe(tmplId) {
  return new Promise((resolve) =>{
  // 检查是否已经订阅过
  const subscribed = wx.getStorageSync(STORAGE_KEY_SUBSCRIBED)
  if (subscribed) {
      resolve(true)
      return
  }

  const templateId = tmplId || ''

  // 检查 tmplIds 是否为空，为空则不调用 wx.requestSubscribeMessage
  if (!templateId) {
      resolve(false)
      return
  }

  // 使用 wx.requestSubscribeMessage 请求订阅
  // 配合新版一次性订阅消息（notify_type = 2001）
  wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success: (res) =>{
    // 判断用户是否同意
    const agreed = templateId ? (res[templateId] ==='accept') : true
    if (agreed) {
          wx.setStorageSync(STORAGE_KEY_SUBSCRIBED, true)
          resolve(true)
    } else {
          resolve(false)
    }
      },
      fail: (err) =>{
    // 订阅失败，不自动标记为已订阅
    console.warn('[mom - notification] 订阅请求失败: ', err)
    resolve(false)
      }
  })
  })
}

/**
  * 检查用户是否已订阅通知
  * @returns {boolean}
  */
function isSubscribed() {
  return !!wx.getStorageSync(STORAGE_KEY_SUBSCRIBED)
}

/**
  * 取消订阅通知
  */
function unsubscribe() {
  wx.setStorageSync(STORAGE_KEY_SUBSCRIBED, false)
}

module.exports = {
  SUBSCRIBE_TEMPLATE_ID,
  sendSettlementNotification,
  checkDailyLimit,
  requestSubscribe,
  isSubscribed,
  unsubscribe
}
