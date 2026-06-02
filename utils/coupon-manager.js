/**
  * coupon - manager.js - 优惠券管理器
  * 负责优惠券的本地数据管理、状态查询、领取和使用逻辑
  * 预留 API 接口，后续可切换为服务端数据
  */

//=========== ==== ==== = 数据结构定义 = ========== ==== ==== =
/**
  * @typedef {Object} Coupon
  * @property {string} id - 优惠券ID
  * @property {string} name - 优惠券名称
  * @property {'full - reduction'|'discount'|'no - threshold'} type - 优惠券类型
  * @property {number} value - 面值：满减/无门槛类型为金额(元)，折扣类型为折扣百分比(如85表示85折)
  * @property {number} condition - 使用条件：满多少元可用(0表示无门槛)
  * @property {string} conditionText - 使用条件展示文本
  * @property {string} description - 优惠券描述
  * @property {string} startTime - 有效期开始时间
  * @property {string} endTime - 有效期结束时间
  * @property {'unused'|'used'|'expired'} status - 使用状态
  * @property {string} usedTime - 使用时间
  * @property {string|null} category - 限制品类(null表示全场通用)
  * @property {boolean} claimable - 是否可从领券中心领取
  */

//=========== ==== ==== = 模拟数据 = ========== ==== ==== =

/** 可领取的优惠券池（领券中心展示） */
const CLAIMABLE_COUPONS = [
  {
  id: 'pool_001',
  name: '新人专享券',
  type: 'full - reduction',
  value: 15,
  condition: 199,
  conditionText: '满199元可用',
  description: '首单可用，新用户专享',
  category: null,
  claimable: true
  },
  {
  id: 'pool_002',
  name: '全场通用券',
  type: 'full - reduction',
  value: 30,
  condition: 299,
  conditionText: '满299元可用',
  description: '全品类通用',
  category: null,
  claimable: true
  },
  {
  id: 'pool_003',
  name: '大额满减券',
  type: 'full - reduction',
  value: 60,
  condition: 499,
  conditionText: '满499元可用',
  description: '全品类通用',
  category: null,
  claimable: true
  },
  {
  id: 'pool_004',
  name: '母亲节专享券',
  type: 'full - reduction',
  value: 20,
  condition: 200,
  conditionText: '满200元可用',
  description: '限母亲节系列商品',
  category: 'mothers - day',
  claimable: true
  },
  {
  id: 'pool_005',
  name: '直播专享券',
  type: 'full - reduction',
  value: 25,
  condition: 199,
  conditionText: '满199元可用',
  description: '直播时段专享',
  category: null,
  claimable: true
  },
  {
  id: 'pool_006',
  name: '无门槛券',
  type: 'no - threshold',
  value: 10,
  condition: 0,
  conditionText: '无门槛',
  description: '全场通用',
  category: null,
  claimable: true
  },
  {
  id: 'pool_007',
  name: '85折优惠券',
  type: 'discount',
  value: 85,
  condition: 200,
  conditionText: '满200元可用，享85折',
  description: '折扣上限50元',
  category: null,
  claimable: true
  },
  {
  id: 'pool_008',
  name: '邀请奖励券',
  type: 'full - reduction',
  value: 30,
  condition: 200,
  conditionText: '满200元可用',
  description: '邀请好友成功奖励',
  category: null,
  claimable: true
  }
]

/** 生成用户已拥有的优惠券（包含各状态） */
function generateUserCoupons() {
  const now = Date.now()
  const day = 86400000

  const coupons = []

  // 未使用：新人专享券（15天有效）
  coupons.push({
  id: 'c001',
  name: '新人专享券',
  type: 'full - reduction',
  value: 15,
  condition: 199,
  conditionText: '满199元可用',
  description: '首单可用',
  startTime: '2026 - 04 - 20',
  endTime: new Date(now + 15 * day).toISOString().slice(0, 10),
  status: 'unused',
  usedTime: '',
  category: null
  })

  // 未使用：全场满减券（30天有效）
  coupons.push({
  id: 'c002',
  name: '全场满减券',
  type: 'full - reduction',
  value: 30,
  condition: 299,
  conditionText: '满299元可用',
  description: '全品类通用',
  startTime: '2026 - 04 - 15',
  endTime: new Date(now + 30 * day).toISOString().slice(0, 10),
  status: 'unused',
  usedTime: '',
  category: null
  })

  // 未使用：大额满减券（20天有效）
  coupons.push({
  id: 'c003',
  name: '大额满减券',
  type: 'full - reduction',
  value: 60,
  condition: 499,
  conditionText: '满499元可用',
  description: '全品类通用',
  startTime: '2026 - 04 - 10',
  endTime: new Date(now + 20 * day).toISOString().slice(0, 10),
  status: 'unused',
  usedTime: '',
  category: null
  })

  // 未使用：85折优惠券
  coupons.push({
  id: 'c008',
  name: '85折优惠券',
  type: 'discount',
  value: 85,
  condition: 200,
  conditionText: '满200元可用，享85折',
  description: '折扣上限50元',
  startTime: '2026 - 04 - 01',
  endTime: new Date(now + 25 * day).toISOString().slice(0, 10),
  status: 'unused',
  usedTime: '',
  category: null
  })

  // 未使用：无门槛券
  coupons.push({
  id: 'c009',
  name: '无门槛券',
  type: 'no - threshold',
  value: 8,
  condition: 0,
  conditionText: '无门槛',
  description: '全场通用',
  startTime: '2026 - 04 - 25',
  endTime: new Date(now + 10 * day).toISOString().slice(0, 10),
  status: 'unused',
  usedTime: '',
  category: null
  })

  // 已使用
  coupons.push({
  id: 'c004',
  name: '新人专享券',
  type: 'full - reduction',
  value: 15,
  condition: 199,
  conditionText: '满199元可用',
  description: '首单可用',
  startTime: '2026 - 03 - 01',
  endTime: '2026 - 04 - 01',
  status: 'used',
  usedTime: '2026 - 03 - 25',
  category: null
  })

  coupons.push({
  id: 'c005',
  name: '无门槛券',
  type: 'no - threshold',
  value: 10,
  condition: 0,
  conditionText: '无门槛',
  description: '全场通用',
  startTime: '2026 - 02 - 01',
  endTime: '2026 - 03 - 01',
  status: 'used',
  usedTime: '2026 - 02 - 28',
  category: null
  })

  // 已过期
  coupons.push({
  id: 'c006',
  name: '全场满减券',
  type: 'full - reduction',
  value: 30,
  condition: 299,
  conditionText: '满299元可用',
  description: '全品类通用',
  startTime: '2025 - 12 - 01',
  endTime: '2025 - 12 - 31',
  status: 'expired',
  usedTime: '',
  category: null
  })

  coupons.push({
  id: 'c007',
  name: '新人专享券',
  type: 'full - reduction',
  value: 15,
  condition: 199,
  conditionText: '满199元可用',
  description: '首单可用',
  startTime: '2025 - 11 - 01',
  endTime: '2025 - 11 - 30',
  status: 'expired',
  usedTime: '',
  category: null
  })

  return coupons
}

//=========== ==== ==== = 状态管理 = ========== ==== ==== =

/** 获取本地存储的用户优惠券 */
function loadCouponsFromStorage() {
  try {
  const stored = wx.getStorageSync('userCoupons')
  if (stored && stored.length > 0) {
      return updateCouponStatuses(stored)
  }
  } catch (e) {
  console.warn('[coupon - manager] 读取本地优惠券失败', e)
  }
  return null
}

/** 将优惠券保存到本地 */
function saveCouponsToStorage(coupons) {
  try {
  wx.setStorageSync('userCoupons', coupons)
  } catch (e) {
  console.warn('[coupon - manager] 保存优惠券失败', e)
  }
}

/** 初始化优惠券数据（首次使用时生成默认数据） */
function initCoupons() {
  let coupons = loadCouponsFromStorage()
  if (!coupons) {
  coupons = generateUserCoupons()
  saveCouponsToStorage(coupons)
  }
  return coupons
}

/** 更新优惠券状态（自动标记过期） */
function updateCouponStatuses(coupons) {
  const now = new Date()
  let changed = false

  const updated = coupons.map(c =>{
  if (c.status ==='unused' && c.endTime) {
      const endDate = new Date(c.endTime)
      if (endDate < now) {
    changed = true
    return { ...c, status: 'expired' }
      }
  }
  return c
  })

  if (changed) {
  saveCouponsToStorage(updated)
  }

  return updated
}

//=========== ==== ==== = 防刷常量 = ========== ==== ==== =
const COOLDOWN_KEY = 'coupon_claim_cooldown'

//=========== ==== ==== = 核心函数 = ========== ==== ==== =

/**
  * 获取指定状态的优惠券列表
  * @param {'unused'|'used'|'expired'|'all'} status - 筛选状态
  * @returns {Coupon[]}
  */
function getCoupons(status = 'all') {
  const coupons = initCoupons()

  if (status ==='all') return coupons
  return coupons.filter(c =>c.status ===status)
}

/**
  * 获取可领取的优惠券列表（领券中心）
  * @returns {Array}
  */
function getClaimableCoupons() {
  const userCoupons = initCoupons()
  const claimedNames = userCoupons.map(c =>c.name)

  return CLAIMABLE_COUPONS.map(pool =>({
  ...pool,
  claimed: claimedNames.includes(pool.name)
  }))
}

/**
  * 判断优惠券是否可用
  * @param {Coupon} coupon - 优惠券对象
  * @param {number} cartAmount - 购物车/订单商品金额
  * @param {string} [category] - 订单商品品类（用于品类限制判断）
  * @returns {{available: boolean, reason: string}}
  */
function canUseCoupon(coupon, cartAmount, category) {
  // 检查状态
  if (coupon.status !== 'unused') {
  return { available: false, reason: '优惠券不可用' }
  }

  // 检查有效期
  if (coupon.endTime) {
  const now = new Date()
  const endDate = new Date(coupon.endTime)
  if (endDate < now) {
      return { available: false, reason: '优惠券已过期' }
  }
  }

  // 检查使用门槛
  if (coupon.type ==='full - reduction' || coupon.type ==='discount') {
  if (coupon.condition > 0 && cartAmount < coupon.condition) {
      return {
    available: false,
    reason: `未达到使用条件，需满${coupon.condition}元`
      }
  }
  }

  // 检查品类限制
  if (coupon.category && category && coupon.category !== category) {
  return { available: false, reason: '不适用于当前商品品类' }
  }

  return { available: true, reason: '' }
}

/**
  * 计算优惠券实际优惠金额
  * @param {Coupon} coupon
  * @param {number} cartAmount
  * @returns {number} 优惠金额（元）
  */
function calculateDiscount(coupon, cartAmount) {
  // 校验使用门槛：未达到满减条件时返回0
  if (coupon.condition > 0 && cartAmount < coupon.condition) {
    return 0
  }

  if (coupon.type ==='full - reduction' || coupon.type ==='no - threshold') {
  // 优惠金额不应超过购物车金额
  return Math.min(coupon.value, cartAmount)
  }

  if (coupon.type ==='discount') {
  // 折扣券：value = 85表示85折，即减免15%
  const discountPercent = (100 - coupon.value) / 100
  let discount = Math.round(cartAmount * discountPercent * 100) / 100
  // 折扣上限（从description中解析或默认50元上限）
  const maxDiscount = 50
  return Math.min(discount, maxDiscount)
  }

  return 0
}

/**
  * 从可用优惠券中获取最优优惠券
  * @param {number} cartAmount - 订单商品金额
  * @param {Coupon[]} coupons - 待选优惠券列表
  * @param {string} [category] - 订单商品品类
  * @returns {{coupon: Coupon|null, discount: number, index: number}|null}
  */
function getBestCoupon(cartAmount, coupons, category) {
  if (!coupons || coupons.length ===0) {
  return null
  }

  let best = null
  let maxDiscount = 0

  coupons.forEach((coupon, index) =>{
  const check = canUseCoupon(coupon, cartAmount, category)
  if (!check.available) return

  const discount = calculateDiscount(coupon, cartAmount)
  if (discount > maxDiscount) {
      maxDiscount = discount
      best = { coupon, discount, index }
  }
  })

  return best
}

/**
  * 获取可用的优惠券数量
  * @param {number} cartAmount
  * @param {string} [category]
  * @returns {number}
  */
function getAvailableCount(cartAmount, category) {
  const coupons = getCoupons('unused')
  return coupons.filter(c =>canUseCoupon(c, cartAmount, category).available).length
}

/**
  * 领取优惠券
  * @param {string} couponId - 优惠券池ID
  * @returns {{success: boolean, message: string}}
  */
function claimCoupon(couponId) {
  // TODO: 上线后防刷逻辑应在服务端实现（userId + couponId 唯一约束）

  // 查找可领取的优惠券定义
  const template = CLAIMABLE_COUPONS.find(c =>c.id ===couponId)
  if (!template) {
  return { success: false, message: '优惠券不存在' }
  }

  // 防刷检查：同一 couponId 24小时内不可重复领取
  try {
    const cooldownMap = wx.getStorageSync(COOLDOWN_KEY) || {}
    const lastClaimTime = cooldownMap[couponId] || 0
    const now = Date.now()
    const COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24小时
    if (now - lastClaimTime < COOLDOWN_MS) {
      const remainHours = Math.ceil((COOLDOWN_MS - (now - lastClaimTime)) / 3600000)
      return { success: false, message: `领取过于频繁，请${remainHours}小时后再试` }
    }
  } catch (e) {
    console.warn('[coupon-manager] 读取领券冷却数据失败', e)
  }

  // 检查是否已领取同类券
  const userCoupons = initCoupons()
  const alreadyClaimed = userCoupons.some(c =>c.name ===template.name && c.status ==='unused')
  if (alreadyClaimed) {
  return { success: false, message: '您已领取过此优惠券' }
  }

  // 创建新优惠券
  const now = new Date()
  const endDate = new Date(now.getTime() + 30 * 86400000) // 默认30天有效期
  const newCoupon = {
  id: 'uc_' + Date.now(),
  name: template.name,
  type: template.type,
  value: template.value,
  condition: template.condition,
  conditionText: template.conditionText,
  description: template.description,
  startTime: now.toISOString().slice(0, 10),
  endTime: endDate.toISOString().slice(0, 10),
  status: 'unused',
  usedTime: '',
  category: template.category
  }

  // 保存
  userCoupons.push(newCoupon)
  saveCouponsToStorage(userCoupons)

  // 记录领券冷却时间
  try {
    const cooldownMap = wx.getStorageSync(COOLDOWN_KEY) || {}
    cooldownMap[couponId] = Date.now()
    wx.setStorageSync(COOLDOWN_KEY, cooldownMap)
  } catch (e) {
    console.warn('[coupon-manager] 保存领券冷却数据失败', e)
  }

  return { success: true, message: '领取成功', coupon: newCoupon }
}

//=========== ==== ==== = API预留接口 = ========== ==== ==== =

/**
  * 从服务端获取优惠券列表（预留）
  * @param {'unused'|'used'|'expired'} status
  * @returns {Promise < Coupon[] > }
  */
function fetchCouponsFromServer(status) {
  // TODO: 替换为真实API调用
  return new Promise((resolve) =>{
  const coupons = getCoupons(status)
  resolve(coupons)
  })
}

/**
  * 领取优惠券API（预留）
  * @param {string} couponId
  * @returns {Promise < {success: boolean, message: string} > }
  */
function claimCouponFromServer(couponId) {
  // TODO: 替换为真实API调用
  return new Promise((resolve) =>{
  const result = claimCoupon(couponId)
  resolve(result)
  })
}

//=========== ==== ==== = 首单优惠 & 复购券 = ========== ==== ==== =

/**
  * 检查用户是否为首单用户
  * @param {string} [userId] - 用户ID（暂用本地存储判断）
  * @returns {boolean} true 表示首单用户（尚未完成过订单）
  */
function isFirstOrder(userId) {
  try {
    const orderCount = wx.getStorageSync('user_order_count') || 0
    return orderCount <= 0
  } catch (e) {
    console.warn('[coupon-manager] 检查首单状态失败', e)
    return false
  }
}

/**
  * 发放首单优惠券（首单完成后自动调用）
  * @returns {{success: boolean, message: string, coupon: Object|null}}
  */
function claimFirstOrderCoupon() {
  try {
    // 检查是否已发放过
    const hasClaimed = wx.getStorageSync('has_claimed_first_order_coupon')
    if (hasClaimed) {
      return { success: false, message: '首单优惠券已发放', coupon: null }
    }

    // 从配置读取首单券定义
    const storeConfig = require('../config/store-config.js')
    const couponDef = storeConfig.marketing.coupons.firstOrder

    // 创建优惠券
    const now = new Date()
    const endDate = new Date(now.getTime() + couponDef.validDays * 86400000)
    const newCoupon = {
      id: 'first_order_' + Date.now(),
      name: couponDef.name,
      type: 'full-reduction',
      value: couponDef.amount,
      condition: couponDef.minAmount,
      conditionText: '满' + couponDef.minAmount + '元可用',
      description: '首单专属优惠',
      startTime: now.toISOString().slice(0, 10),
      endTime: endDate.toISOString().slice(0, 10),
      status: 'unused',
      usedTime: '',
      category: null
    }

    // 保存优惠券
    const userCoupons = initCoupons()
    userCoupons.push(newCoupon)
    saveCouponsToStorage(userCoupons)

    // 标记已发放
    wx.setStorageSync('has_claimed_first_order_coupon', true)

    // 记录新发优惠券提醒（供首页弹窗读取）
    wx.setStorageSync('new_coupon_notice', {
      name: couponDef.name,
      amount: couponDef.amount,
      time: Date.now()
    })

    return { success: true, message: '首单优惠券发放成功', coupon: newCoupon }
  } catch (e) {
    console.warn('[coupon-manager] 发放首单优惠券失败', e)
    return { success: false, message: '发放失败', coupon: null }
  }
}

/**
  * 发放复购券（第二单完成后自动调用）
  * @returns {{success: boolean, message: string, coupon: Object|null}}
  */
function claimRepurchaseCoupon() {
  try {
    // 检查是否已发放过
    const hasClaimed = wx.getStorageSync('has_claimed_repurchase_coupon')
    if (hasClaimed) {
      return { success: false, message: '复购券已发放', coupon: null }
    }

    // 从配置读取复购券定义
    const storeConfig = require('../config/store-config.js')
    const couponDef = storeConfig.marketing.coupons.repurchase

    // 创建优惠券
    const now = new Date()
    const endDate = new Date(now.getTime() + couponDef.validDays * 86400000)
    const newCoupon = {
      id: 'repurchase_' + Date.now(),
      name: couponDef.name,
      type: 'full-reduction',
      value: couponDef.amount,
      condition: couponDef.minAmount,
      conditionText: '满' + couponDef.minAmount + '元可用',
      description: '回头客专享优惠',
      startTime: now.toISOString().slice(0, 10),
      endTime: endDate.toISOString().slice(0, 10),
      status: 'unused',
      usedTime: '',
      category: null
    }

    // 保存优惠券
    const userCoupons = initCoupons()
    userCoupons.push(newCoupon)
    saveCouponsToStorage(userCoupons)

    // 标记已发放
    wx.setStorageSync('has_claimed_repurchase_coupon', true)

    // 记录新发优惠券提醒（供首页弹窗读取）
    wx.setStorageSync('new_coupon_notice', {
      name: couponDef.name,
      amount: couponDef.amount,
      time: Date.now()
    })

    return { success: true, message: '复购券发放成功', coupon: newCoupon }
  } catch (e) {
    console.warn('[coupon-manager] 发放复购券失败', e)
    return { success: false, message: '发放失败', coupon: null }
  }
}

/**
  * 检查并发放优惠券（订单完成后统一调用）
  * 根据 user_order_count 自动判断应发放哪种券
  * @returns {{firstOrder: Object|null, repurchase: Object|null}}
  */
function checkAndDistributeCoupons() {
  const result = { firstOrder: null, repurchase: null }

  try {
    const orderCount = wx.getStorageSync('user_order_count') || 0

    // 第一单完成后发放首单券
    if (orderCount === 1) {
      const r = claimFirstOrderCoupon()
      if (r.success) result.firstOrder = r.coupon
    }

    // 第二单完成后发放复购券
    if (orderCount === 2) {
      const r = claimRepurchaseCoupon()
      if (r.success) result.repurchase = r.coupon
    }
  } catch (e) {
    console.warn('[coupon-manager] 检查发放优惠券失败', e)
  }

  return result
}

module.exports = {
  // 核心函数
  getCoupons,
  getClaimableCoupons,
  canUseCoupon,
  calculateDiscount,
  getBestCoupon,
  getAvailableCount,
  claimCoupon,

  // 内部管理
  initCoupons,
  updateCouponStatuses,

  // API预留
  fetchCouponsFromServer,
  claimCouponFromServer,

  // 首单优惠 & 复购券
  isFirstOrder,
  claimFirstOrderCoupon,
  claimRepurchaseCoupon,
  checkAndDistributeCoupons
}
