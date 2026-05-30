/**
  * 诺派永生花 - 兼职妈妈体验官模块
  * 数据模型与核心业务逻辑
  */

// 默认兼职妈妈用户数据
const DEFAULT_MOM_DATA = {
  isMom: false,
  momSince: null,
  momLevel: 'newbie',       // newbie(新手30天内)/regular(常规)
  totalEarnings: 0,
  pendingEarnings: 0,
  settledEarnings: 0,
  monthlyOrders: 0,
  inviteCode: null,
  notificationEnabled: true
}

// 新手期天数
const NEWBIE_DAYS = 30

// 分享津贴比例（按商品类型）
// 爆款商品10%，定制款商品20%
const COMMISSION_RATES = {
  default: 0.10,            // 默认10%（爆款）
  premium: 0.20,            // 高端/定制款20%
  promotion: 0.10           // 促销/爆款10%
}

// 友伴首单奖励金额（元）
const REFERRAL_BONUS = 28

// 月度成长奖励比例
const GROWTH_MILESTONES = [
  { threshold: 5, bonusRate: 0.05, label: '满5单 + 5%' },
  { threshold: 10, bonusRate: 0.10, label: '满10单 + 10%' }
]

// 最低提现金额（单位：分，1000分 = 10元，与 api-server 对齐）
const MIN_WITHDRAWAL = 1000

// 按等级的最低提现金额（单位：分，与 api-server 对齐）
const MIN_WITHDRAWAL_NEWBIE = 1000
const MIN_WITHDRAWAL_REGULAR = 1000

// 收益结算等待天数
const SETTLE_WAIT_DAYS = 7

// 收益状态
const EARNING_STATUS = {
  PENDING: 'pending',
  SETTLED: 'settled',
  CANCELLED: 'cancelled'
}

// 收益类型
const EARNING_TYPE = {
  SHARE: 'share',         // 基础分享津贴
  REFERRAL: 'referral',   // 友伴首单奖励
  GROWTH: 'growth'        // 月度成长奖励
}

// 模拟时间（用于测试，正常为null则使用真实时间）
let _simulatedTime = null

/**
  * 获取默认的兼职妈妈数据结构
  * @returns {Object} momData
  */
function getDefaultMomData() {
  return { ...DEFAULT_MOM_DATA }
}

/**
  * 设置模拟时间（用于测试）
  * @param {Date|null} time
  */
function setSimulatedTime(time) {
  _simulatedTime = time
}

/**
  * 获取当前时间（支持模拟）
  * @returns {Date}
  */
function getCurrentTime() {
  return _simulatedTime || new Date()
}

/**
  * 检查并升级用户等级（新手期是否结束）
  * @param {Object} userData - 用户数据（含 momData）
  * @returns {Object} 更新后的 momData
  */
function checkAndUpgradeLevel(userData) {
  const momData = userData.momData || { ...DEFAULT_MOM_DATA }

  if (!momData.isMom || !momData.momSince) {
  return momData
  }

  if (momData.momLevel ==='newbie') {
  const momSince = new Date(momData.momSince)
  const now = getCurrentTime()
  const daysSince = Math.floor((now - momSince) / (1000 * 60 * 60 * 24))

  if (daysSince >=NEWBIE_DAYS) {
      momData.momLevel = 'regular'
  }
  }

  return momData
}

/**
  * 计算分享津贴
  * @param {number} orderAmount - 订单金额
  * @param {string} productType - 商品类型（default/premium/promotion）
  * @returns {number} 津贴金额
  */
function calculateShareCommission(orderAmount, productType = 'default') {
  const rate = COMMISSION_RATES[productType] || COMMISSION_RATES.default
  return Math.round(orderAmount * rate * 100) / 100
}

/**
  * 检查提现条件
  * @param {Object} userData - 用户数据
  * @param {number} amount - 提现金额
  * @returns {Object} { allowed: boolean, reason: string }
  */
function canWithdraw(userData, amount) {
  const momData = userData.momData || { ...DEFAULT_MOM_DATA }

  if (!momData.isMom) {
  return { allowed: false, reason: '请先开通兼职妈妈体验官' }
  }

  // 根据等级获取最低提现金额
  const momLevel = momData.momLevel || 'newbie'
  const minAmount = momLevel ==='newbie' ? MIN_WITHDRAWAL_NEWBIE : MIN_WITHDRAWAL_REGULAR

  if (amount < minAmount) {
  return { allowed: false, reason: `最低提现金额为${minAmount / 100}元` }
  }

  // 单笔提现上限
  if (amount > 500) {
  return { allowed: false, reason: '单笔提现上限为500元' }
  }

  const available = momData.settledEarnings
  if (amount > available) {
  return { allowed: false, reason: `可提现余额不足，当前可提现${available}元` }
  }

  return { allowed: true, reason: '' }
}

/**
  * 生成邀请码（使用 crypto 防碰撞）
  * @param {string} userId - 用户ID
  * @returns {string} 邀请码
  */
function generateInviteCode(userId) {
  const crypto = require('crypto')
  const prefix = 'NP'
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8)
  const suffix = userId ? userId.toString().slice(-4).toUpperCase() : '0000'
  return `${prefix}${randomPart}${suffix}`
}

/**
  * 创建收益记录
  * @param {Object} params
  * @param {string} params.type - 收益类型（share/referral/growth）
  * @param {string} params.orderId - 订单ID
  * @param {number} params.orderAmount - 订单金额
  * @param {number} params.amount - 收益金额
  * @param {string} [params.productName] - 商品名称
  * @param {string} [params.productImage] - 商品图片
  * @returns {Object} 收益记录
  */
function createEarningRecord({ type, orderId, orderAmount, amount, productName, productImage }) {
  const now = getCurrentTime()
  const settleDate = new Date(now.getTime() + SETTLE_WAIT_DAYS * 24 * 60 * 60 * 1000)

  return {
  id: `earn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  type: type || EARNING_TYPE.SHARE,
  orderId: orderId || '',
  orderAmount: orderAmount || 0,
  amount: Math.round((amount || 0) * 100) / 100,
  productName: productName || '',
  productImage: productImage || '/assets/images/product-placeholder.png',
  status: EARNING_STATUS.PENDING,
  createdAt: now.toISOString(),
  settledAt: null,
  settleDays: SETTLE_WAIT_DAYS,
  settleDate: settleDate.toISOString()
  }
}

/**
  * 添加收益并更新用户数据
  * @param {Object} userData - 用户数据（会直接修改）
  * @param {string} type - 收益类型
  * @param {Object} orderInfo - 订单信息
  * @param {string} [orderInfo.orderId] - 订单ID
  * @param {number} [orderInfo.orderAmount] - 订单金额
  * @param {number} [orderInfo.amount] - 收益金额
  * @param {string} [orderInfo.productName] - 商品名称
  * @param {string} [orderInfo.productImage] - 商品图片
  * @returns {Object} 创建的收益记录
  */
function addEarning(userData, type, orderInfo) {
  const momData = userData.momData || { ...DEFAULT_MOM_DATA }
  if (!momData.isMom) {
  return null
  }

  // 自动计算收益金额
  let amount = orderInfo.amount
  if (!amount && orderInfo.orderAmount) {
  const productType = orderInfo.productType || 'default'
  amount = calculateShareCommission(orderInfo.orderAmount, productType)
  }

  const record = createEarningRecord({
  type: type || EARNING_TYPE.SHARE,
  orderId: orderInfo.orderId,
  orderAmount: orderInfo.orderAmount,
  amount: amount,
  productName: orderInfo.productName,
  productImage: orderInfo.productImage
  })

  // 更新用户数据
  momData.totalEarnings = (momData.totalEarnings || 0) + record.amount
  momData.pendingEarnings = (momData.pendingEarnings || 0) + record.amount

  return record
}

/**
  * 结算一笔收益（将pending转为settled）
  * @param {Object} userData - 用户数据（会直接修改）
  * @param {Object} earningRecord - 收益记录
  * @returns {Object|null} 更新后的收益记录，失败返回null
  */
function settleEarning(userData, earningRecord) {
  if (!earningRecord || earningRecord.status !== EARNING_STATUS.PENDING) {
  return null
  }

  const momData = userData.momData
  if (!momData) return null

  const now = getCurrentTime()

  earningRecord.status = EARNING_STATUS.SETTLED
  earningRecord.settledAt = now.toISOString()

  momData.pendingEarnings = Math.max(0, (momData.pendingEarnings || 0) - earningRecord.amount)
  momData.settledEarnings = (momData.settledEarnings || 0) + earningRecord.amount

  return earningRecord
}

/**
  * 取消一笔收益（退款等场景）
  * @param {Object} userData - 用户数据（会直接修改）
  * @param {Object} earningRecord - 收益记录
  * @returns {Object|null} 更新后的收益记录，失败返回null
  */
function cancelEarning(userData, earningRecord) {
  if (!earningRecord || earningRecord.status ===EARNING_STATUS.CANCELLED) {
  return null
  }

  const momData = userData.momData
  if (!momData) return null

  const wasPending = earningRecord.status ===EARNING_STATUS.PENDING
  const wasSettled = earningRecord.status ===EARNING_STATUS.SETTLED

  earningRecord.status = EARNING_STATUS.CANCELLED

  if (wasPending) {
  momData.pendingEarnings = Math.max(0, (momData.pendingEarnings || 0) - earningRecord.amount)
  }
  if (wasSettled) {
  momData.settledEarnings = Math.max(0, (momData.settledEarnings || 0) - earningRecord.amount)
  }
  momData.totalEarnings = Math.max(0, (momData.totalEarnings || 0) - earningRecord.amount)

  return earningRecord
}

/**
  * 时间模拟器 - 用于测试N日后到账
  * @param {number} days - 向前推进的天数
  * @returns {Date} 模拟后的日期
  */
function simulateTimeTravel(days) {
  const now = new Date()
  now.setDate(now.getDate() + days)
  _simulatedTime = now
  return now
}

module.exports = {
  DEFAULT_MOM_DATA,
  NEWBIE_DAYS,
  COMMISSION_RATES,
  MIN_WITHDRAWAL,
  MIN_WITHDRAWAL_NEWBIE,
  MIN_WITHDRAWAL_REGULAR,
  SETTLE_WAIT_DAYS,
  EARNING_STATUS,
  EARNING_TYPE,
  getDefaultMomData,
  getCurrentTime,
  setSimulatedTime,
  checkAndUpgradeLevel,
  calculateShareCommission,
  canWithdraw,
  generateInviteCode,
  createEarningRecord,
  addEarning,
  settleEarning,
  cancelEarning,
  simulateTimeTravel
}
