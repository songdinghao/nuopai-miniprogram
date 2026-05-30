/**
  * mom - withdraw.js - 提现与兑换模块
  * 支持提现申请、提现记录、收益兑换商品/优惠券
  */
const momProgram = require('./mom-program.js')

const STORAGE_KEY_WITHDRAW = 'mom_withdraw_records'
const STORAGE_KEY_USER = 'mom_user_data'

/**
  * 获取用户数据
  */
function _getUserData() {
  const data = wx.getStorageSync(STORAGE_KEY_USER)
  if (data && data.momData) return data
  const app = getApp()
  if (app && app.globalData && app.globalData.userData) {
  return app.globalData.userData
  }
  return { momData: momProgram.getDefaultMomData() }
}

/**
  * 保存用户数据
  */
function _saveUserData(userData) {
  wx.setStorageSync(STORAGE_KEY_USER, userData)
  const app = getApp()
  if (app && app.globalData) {
  app.globalData.userData = userData
  }
}

/**
  * 检查提现条件
  * @param {Object} userData - 用户数据
  * @param {number} amount - 提现金额
  * @returns {Object} { allowed, reason, minAmount }
  */
function canWithdraw(userData, amount) {
  const momData = userData.momData || momProgram.getDefaultMomData()
  const minAmount = momData.momLevel ==='newbie'
  ? momProgram.MIN_WITHDRAWAL_NEWBIE
  : momProgram.MIN_WITHDRAWAL_REGULAR

  if (!momData.isMom) {
  return { allowed: false, reason: '请先开通兼职妈妈体验官', minAmount }
  }

  if (amount < minAmount) {
  return { allowed: false, reason: `最低${minAmount / 100}元起提`, minAmount }
  }

  const available = momData.settledEarnings || 0
  if (amount > available) {
  return { allowed: false, reason: `可提现余额不足，当前可提现${available.toFixed(2)}元`, minAmount }
  }

  return { allowed: true, reason: '', minAmount }
}

/**
  * 获取最低提现金额
  * @param {Object} userData
  * @returns {number}
  */
function getMinWithdrawAmount(userData) {
  const momData = userData.momData || momProgram.getDefaultMomData()
  return momData.momLevel ==='newbie'
  ? momProgram.MIN_WITHDRAWAL_NEWBIE
  : momProgram.MIN_WITHDRAWAL_REGULAR
}

/**
  * 提交提现申请（模拟）
  * @param {number} amount - 提现金额
  * @returns {Object} { success, record, error }
  */
function submitWithdraw(amount) {
  const userData = _getUserData()
  const check = canWithdraw(userData, amount)

  if (!check.allowed) {
  return { success: false, error: check.reason }
  }

  const momData = userData.momData

  // 扣除可提现金额
  momData.settledEarnings = Math.round(((momData.settledEarnings || 0) - amount) * 100) / 100

  // 生成提现记录
  const record = {
  id: `wd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  amount: amount,
  status: 'processing',       // processing / success / failed
  bankInfo: '微信零钱',
  createdAt: new Date().toISOString(),
  processedAt: null,
  fee: 0,                     // 模拟无手续费
  remark: ''
  }

  // 保存记录
  const records = wx.getStorageSync(STORAGE_KEY_WITHDRAW) || []
  records.unshift(record)
  wx.setStorageSync(STORAGE_KEY_WITHDRAW, records)
  _saveUserData(userData)

  // 模拟提现处理（1分钟后自动成功）
  setTimeout(() =>{
  const currentRecords = wx.getStorageSync(STORAGE_KEY_WITHDRAW) || []
  const idx = currentRecords.findIndex(r =>r.id ===record.id)
  if (idx !== -1) {
      currentRecords[idx].status = 'success'
      currentRecords[idx].processedAt = new Date().toISOString()
      wx.setStorageSync(STORAGE_KEY_WITHDRAW, currentRecords)
  }
  }, 60000)

  return { success: true, record }
}

/**
  * 获取提现记录列表
  * @param {Object} [filters] - { status }
  * @returns {Array}
  */
function getWithdrawHistory(filters) {
  const records = wx.getStorageSync(STORAGE_KEY_WITHDRAW) || []
  let result = records.sort((a, b) =>new Date(b.createdAt) - new Date(a.createdAt))

  if (filters && filters.status) {
  result = result.filter(r =>r.status ===filters.status)
  }

  return result
}

/**
  * 获取提现统计
  * @returns {Object} { totalWithdrawn, processingCount, successCount, failedCount }
  */
function getWithdrawStats() {
  const records = wx.getStorageSync(STORAGE_KEY_WITHDRAW) || []
  const stats = {
  totalWithdrawn: 0,
  processingCount: 0,
  successCount: 0,
  failedCount: 0
  }
  records.forEach(r =>{
  if (r.status ==='success') {
      stats.totalWithdrawn +=r.amount
      stats.successCount++
  } else if (r.status ==='processing') {
      stats.processingCount++
  } else if (r.status ==='failed') {
      stats.failedCount++
  }
  })
  stats.totalWithdrawn = Math.round(stats.totalWithdrawn * 100) / 100
  return stats
}

/**
  * 收益兑换商品
  * @param {string} earningId - 收益ID（从指定收益扣除）
  * @param {string|Object} product - 商品ID或商品对象
  * @returns {Object} { success, order, error }
  */
function exchangeToProduct(earningId, product) {
  const earnings = wx.getStorageSync('mom_earnings') || []
  const earning = earnings.find(e =>e.id ===earningId)

  if (!earning) {
  return { success: false, error: '收益记录不存在' }
  }

  if (earning.status !== momProgram.EARNING_STATUS.SETTLED) {
  return { success: false, error: '收益未到账，暂不可兑换' }
  }

  const productInfo = typeof product ==='string'
  ? { id: product, name: '商品', price: 0 }
  : product

  if (!productInfo.price || earning.amount < productInfo.price) {
  return { success: false, error: '收益余额不足，无法兑换该商品' }
  }

  const userData = _getUserData()
  const momData = userData.momData

  // 扣除收益
  const deductAmount = productInfo.price
  momData.settledEarnings = Math.round(((momData.settledEarnings || 0) - deductAmount) * 100) / 100
  momData.totalEarnings = Math.round(((momData.totalEarnings || 0) - deductAmount) * 100) / 100

  // 标记该收益已使用
  earning.status = momProgram.EARNING_STATUS.CANCELLED
  earning.exchangedTo = 'product'
  earning.exchangeInfo = { productId: productInfo.id, productName: productInfo.name, price: productInfo.price }
  wx.setStorageSync('mom_earnings', earnings)
  _saveUserData(userData)

  // 生成兑换订单
  const order = {
  id: `ex_p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  type: 'exchange_product',
  earningId: earningId,
  productId: productInfo.id,
  productName: productInfo.name,
  price: productInfo.price,
  status: 'completed',
  createdAt: new Date().toISOString()
  }

  return { success: true, order }
}

/**
  * 收益兑换优惠券
  * @param {string} earningId - 收益ID
  * @param {string|Object} coupon - 优惠券ID或对象
  * @returns {Object} { success, coupon, error }
  */
function exchangeToCoupon(earningId, coupon) {
  const earnings = wx.getStorageSync('mom_earnings') || []
  const earning = earnings.find(e =>e.id ===earningId)

  if (!earning) {
  return { success: false, error: '收益记录不存在' }
  }

  if (earning.status !== momProgram.EARNING_STATUS.SETTLED) {
  return { success: false, error: '收益未到账，暂不可兑换' }
  }

  const couponInfo = typeof coupon ==='string'
  ? { id: coupon, name: '优惠券', value: 0, cost: 0 }
  : coupon

  if (!couponInfo.cost || earning.amount < couponInfo.cost) {
  return { success: false, error: '收益余额不足，无法兑换该优惠券' }
  }

  const userData = _getUserData()
  const momData = userData.momData

  // 扣除收益
  const deductAmount = couponInfo.cost
  momData.settledEarnings = Math.round(((momData.settledEarnings || 0) - deductAmount) * 100) / 100
  momData.totalEarnings = Math.round(((momData.totalEarnings || 0) - deductAmount) * 100) / 100

  // 标记该收益已使用
  earning.status = momProgram.EARNING_STATUS.CANCELLED
  earning.exchangedTo = 'coupon'
  earning.exchangeInfo = { couponId: couponInfo.id, couponName: couponInfo.name, value: couponInfo.value, cost: couponInfo.cost }
  wx.setStorageSync('mom_earnings', earnings)
  _saveUserData(userData)

  // 生成兑换记录
  const exchangeRecord = {
  id: `ex_c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  type: 'exchange_coupon',
  earningId: earningId,
  couponId: couponInfo.id,
  couponName: couponInfo.name,
  couponValue: couponInfo.value,
  cost: couponInfo.cost,
  status: 'completed',
  createdAt: new Date().toISOString()
  }

  return { success: true, coupon: exchangeRecord }
}

/**
  * 获取可兑换的商品列表
  * 从 store-config.exchangeProducts 读取真实配置价格
  * @returns {Array}
  */
function getExchangeableProducts() {
  try {
  const storeConfig = require('../config/store-config.js')
  // 优先使用 store-config 中的兑换商品列表（价格为配置值，非随机）
  const exchangeProducts = storeConfig.exchangeProducts || storeConfig.getExchangeProductList?.() || []
  if (exchangeProducts.length > 0) {
      return exchangeProducts.map(p => ({
    id: p.id,
    name: p.name,
    price: p.useEarnings || Math.round(p.price * 0.3),  // 兑换所需收益
    image: p.image || '/assets/images/product-placeholder.png',
    stock: 99
      }))
  }
  // 回退：从分类生成（使用配置中的默认价格）
  const categories = storeConfig.categories || []
  return categories.map(cat => ({
      id: `exchange_${cat.id}`,
      name: `${cat.name}专区优惠`,
      price: 100,  // 默认100收益
      image: cat.icon || '/assets/images/product-placeholder.png',
      stock: 99
  }))
  } catch (e) {
  console.warn('[mom-withdraw] 读取商品配置失败:', e)
  return []
  }
}

/**
  * 获取可兑换优惠券列表
  * @returns {Array}
  */
function getExchangeableCoupons() {
  try {
  const storeConfig = require('../config/store-config.js')
  const couponTypes = storeConfig.marketing.coupons.types || []
  return couponTypes.map(c =>({
      id: `coupon_${c.id}`,
      name: c.name,
      value: c.amount,
      minAmount: c.minAmount,
      cost: Math.round(c.amount * 0.3), // 优惠券价值30%作为成本
      validDays: c.validDays
  }))
  } catch (e) {
  console.warn('[mom - withdraw] 读取优惠券配置失败: ', e)
  return []
  }
}

module.exports = {
  canWithdraw,
  getMinWithdrawAmount,
  submitWithdraw,
  getWithdrawHistory,
  getWithdrawStats,
  exchangeToProduct,
  exchangeToCoupon,
  getExchangeableProducts,
  getExchangeableCoupons
}
