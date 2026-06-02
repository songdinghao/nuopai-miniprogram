/**
  * mom - earnings.js - 兼职妈妈收益管理模块
  * 基于 localStorage 的收益CRUD、结算检查、提现/兑换记录
  */

const momProgram = require('./mom-program.js')
const subscribeMsg = require('./subscribe-message.js')

// localStorage 存储键名
const STORAGE_KEYS = {
  EARNINGS: 'mom_earnings_list',
  WITHDRAWALS: 'mom_withdrawals_list',
  EXCHANGES: 'mom_exchanges_list',
  USER_MOM_DATA: 'mom_user_data'
}

/**
  * 获取所有收益记录
  * @returns {Array} 收益记录列表（按时间倒序）
  */
function getEarningsList() {
  try {
  const data = wx.getStorageSync(STORAGE_KEYS.EARNINGS) || '[]'
  return typeof data ==='string' ? JSON.parse(data) : data
  } catch (e) {
  console.error('[mom - earnings] 读取收益列表失败: ', e)
  return []
  }
}

/**
  * 保存收益列表
  * @param {Array} list
  */
function saveEarningsList(list) {
  try {
  wx.setStorageSync(STORAGE_KEYS.EARNINGS, list)
  } catch (e) {
  console.error('[mom - earnings] 保存收益列表失败: ', e)
  }
}

/**
  * 获取用户mom数据
  * 注意: mom-withdraw.js 中的 _getUserData() 存在重复实现，
  *       两处读取同一 STORAGE_KEY ('mom_user_data')，
  *       后续应抽取为公共方法以避免逻辑漂移。
  * @returns {Object}
  */
function getMomUserData() {
  try {
  const data = wx.getStorageSync(STORAGE_KEYS.USER_MOM_DATA)
  return data || { momData: momProgram.getDefaultMomData() }
  } catch (e) {
  return { momData: momProgram.getDefaultMomData() }
  }
}

/**
  * 保存用户mom数据
  * @param {Object} userData
  */
function saveMomUserData(userData) {
  try {
  wx.setStorageSync(STORAGE_KEYS.USER_MOM_DATA, userData)
  } catch (e) {
  console.error('[mom - earnings] 保存用户数据失败: ', e)
  }
}

/**
  * 添加一笔收益
  * @param {string} type - 收益类型 (share/referral/growth)
  * @param {Object} orderInfo - 订单信息
  * @returns {Object|null} 创建的收益记录
  */
function addEarning(type, orderInfo) {
  const userData = getMomUserData()
  const record = momProgram.addEarning(userData, type, orderInfo)
  if (!record) return null

  // 保存到收益列表
  const list = getEarningsList()
  list.unshift(record)
  saveEarningsList(list)
  saveMomUserData(userData)

  // 好友下单时构建通知数据，存入待推送队列
  // TODO: 后端应消费 pending_notifications 队列调用微信API发送订阅消息
  if (type === momProgram.EARNING_TYPE.SHARE && orderInfo.orderId) {
    try {
      let pendingNotifications = wx.getStorageSync('pending_notifications') || []
      if (!Array.isArray(pendingNotifications)) pendingNotifications = []
      const notificationData = subscribeMsg.buildFriendOrderData(
        orderInfo.orderId,
        orderInfo.productType || '商城订单',
        orderInfo.orderAmount || 0,
        record.amount
      )
      pendingNotifications.push({
        ...notificationData,
        _createdAt: new Date().toISOString(),
        _status: 'pending'
      })
      wx.setStorageSync('pending_notifications', pendingNotifications)
    } catch (e) {
      console.error('[mom-earnings] 保存好友下单通知失败:', e)
    }
  }

  return record
}

/**
  * 结算一笔收益
  * @param {string} earningId - 收益记录ID
  * @returns {Object|null} 更新后的记录
  */
function settleEarning(earningId) {
  const userData = getMomUserData()
  const list = getEarningsList()
  const index = list.findIndex(item =>item.id ===earningId)
  if (index ===-1) return null

  const record = list[index]
  const updated = momProgram.settleEarning(userData, record)
  if (!updated) return null

  list[index] = updated
  saveEarningsList(list)
  saveMomUserData(userData)

  return updated
}

/**
  * 取消一笔收益
  * @param {string} earningId - 收益记录ID
  * @returns {Object|null} 更新后的记录
  */
function cancelEarning(earningId) {
  const userData = getMomUserData()
  const list = getEarningsList()
  const index = list.findIndex(item =>item.id ===earningId)
  if (index ===-1) return null

  const record = list[index]
  const updated = momProgram.cancelEarning(userData, record)
  if (!updated) return null

  list[index] = updated
  saveEarningsList(list)
  saveMomUserData(userData)

  return updated
}

/**
  * 自动检查所有待结算收益，将已到结算日期的转为已到账
  * 每次同步保存用户数据变更
  * @returns {number} 本次结算的笔数
  */
function autoCheckSettlements() {
  const userData = getMomUserData()
  const list = getEarningsList()
  const now = momProgram.getCurrentTime()
  let settledCount = 0

  // 读取现有待推送通知队列
  let pendingNotifications = []
  try {
    pendingNotifications = wx.getStorageSync('pending_notifications') || []
    if (!Array.isArray(pendingNotifications)) pendingNotifications = []
  } catch (e) {
    pendingNotifications = []
  }

  const updatedList = list.map(record =>{
  if (record.status !== momProgram.EARNING_STATUS.PENDING) return record
  if (!record.settleDate) return record

  const settleDate = new Date(record.settleDate)
  if (now >=settleDate) {
      const updated = momProgram.settleEarning(userData, record)
      if (updated) {
    settledCount++

    // 构建收益结算通知数据，存入待推送队列
    // TODO: 后端应消费 pending_notifications 队列调用微信API发送订阅消息
    const totalBalance = (userData.momData && userData.momData.settledEarnings) || 0
    const notificationData = subscribeMsg.buildEarningSettledData(updated.amount, totalBalance)
    pendingNotifications.push({
      ...notificationData,
      _createdAt: new Date().toISOString(),
      _status: 'pending'
    })

    return updated
      }
  }
  return record
  })

  if (settledCount > 0) {
  saveEarningsList(updatedList)
  saveMomUserData(userData)
  // 保存待推送通知队列
  try {
    wx.setStorageSync('pending_notifications', pendingNotifications)
  } catch (e) {
    console.error('[mom-earnings] 保存待推送通知队列失败:', e)
  }
  }

  return settledCount
}

//===== 提现记录 = ====

/**
  * 获取所有提现记录
  * @returns {Array}
  */
function getWithdrawalsList() {
  try {
  const data = wx.getStorageSync(STORAGE_KEYS.WITHDRAWALS) || '[]'
  return typeof data ==='string' ? JSON.parse(data) : data
  } catch (e) {
  return []
  }
}

/**
  * 保存提现记录
  * @param {Array} list
  */
function saveWithdrawalsList(list) {
  try {
  wx.setStorageSync(STORAGE_KEYS.WITHDRAWALS, list)
  } catch (e) {
  console.error('[mom - earnings] 保存提现记录失败: ', e)
  }
}

/**
  * 执行提现
  * @param {number} amount - 提现金额
  * @returns {Object} { success, reason, record }
  */
function performWithdrawal(amount) {
  const userData = getMomUserData()
  const momData = userData.momData

  // 检查提现条件
  const check = momProgram.canWithdraw(userData, amount)
  if (!check.allowed) {
  return { success: false, reason: check.reason, record: null }
  }

  // 生成提现记录
  const now = new Date()
  const record = {
  id: `wd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  amount: amount,
  status: 'completed',
  account: '微信零钱',
  createdAt: now.toISOString(),
  completedAt: now.toISOString()
  }

  // 扣除已到账收益
  momData.settledEarnings = Math.max(0, (momData.settledEarnings || 0) - amount)

  // 保存
  const list = getWithdrawalsList()
  list.unshift(record)
  saveWithdrawalsList(list)
  saveMomUserData(userData)

  return { success: true, reason: '', record }
}

//===== 兑换记录 = ====

/**
  * 获取所有兑换记录
  * @returns {Array}
  */
function getExchangesList() {
  try {
  const data = wx.getStorageSync(STORAGE_KEYS.EXCHANGES) || '[]'
  return typeof data ==='string' ? JSON.parse(data) : data
  } catch (e) {
  return []
  }
}

/**
  * 保存兑换记录
  * @param {Array} list
  */
function saveExchangesList(list) {
  try {
  wx.setStorageSync(STORAGE_KEYS.EXCHANGES, list)
  } catch (e) {
  console.error('[mom - earnings] 保存兑换记录失败: ', e)
  }
}

/**
  * 执行收益兑换商品
  * @param {Object} product - 商品信息 { id, name, image, price, useEarnings }
  * @returns {Object} { success, reason, record }
  */
function performExchange(product) {
  if (!product || !product.useEarnings) {
  return { success: false, reason: '商品信息有误', record: null }
  }

  const userData = getMomUserData()
  const momData = userData.momData
  const costEarnings = product.useEarnings

  // 检查余额
  if ((momData.settledEarnings || 0) < costEarnings) {
  return { success: false, reason: '收益余额不足', record: null }
  }

  // 生成兑换记录
  const now = new Date()
  const record = {
  id: `ex_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  productId: product.id || '',
  productName: product.name || '商品',
  productImage: product.image || '/assets/images/product-placeholder.png',
  price: product.price || 0,
  costEarnings: costEarnings,
  status: 'completed',
  createdAt: now.toISOString()
  }

  // 扣減收益
  momData.settledEarnings = Math.max(0, (momData.settledEarnings || 0) - costEarnings)

  // 保存
  const list = getExchangesList()
  list.unshift(record)
  saveExchangesList(list)
  saveMomUserData(userData)

  return { success: true, reason: '', record }
}

/**
  * 获取收益统计数据
  * @returns {Object} { total, pending, settled, count }
  */
function getEarningsStats() {
  const userData = getMomUserData()
  const momData = userData.momData || momProgram.getDefaultMomData()
  return {
  total: momData.totalEarnings || 0,
  pending: momData.pendingEarnings || 0,
  settled: momData.settledEarnings || 0,
  monthlyOrders: momData.monthlyOrders || 0
  }
}

/**
  * 筛选收益记录
  * @param {string} typeFilter - 类型筛选 (''/share/referral/growth)
  * @returns {Array}
  */
function getFilteredEarnings(typeFilter) {
  const list = getEarningsList()
  if (!typeFilter) return list
  return list.filter(item =>item.type ===typeFilter)
}

module.exports = {
  STORAGE_KEYS,
  getEarningsList,
  addEarning,
  settleEarning,
  cancelEarning,
  autoCheckSettlements,
  getWithdrawalsList,
  performWithdrawal,
  getExchangesList,
  performExchange,
  getEarningsStats,
  getFilteredEarnings,
  getMomUserData,
  saveMomUserData
}
