/**
  * points - manager.js - 积分管理器
  * 负责积分的本地数据管理、获取/消耗和明细查询
  * 预留 API 接口，后续可切换为服务端数据
  */

//=========== ==== ==== = 积分来源类型 = ========== ==== ==== =
const POINTS_SOURCES = {
  REGISTER: { type: 'earn', desc: '新用户注册奖励', points: 100 },
  INVITE: { type: 'earn', desc: '邀请好友奖励', points: 50 },
  DAILY_CHECKIN: { type: 'earn', desc: '每日签到奖励', points: 5 },
  SHOPPING: { type: 'earn', desc: '购物获得积分', points: null }, // 按金额计算
  REVIEW: { type: 'earn', desc: '评价商品奖励', points: 50 },
  SHARE: { type: 'earn', desc: '分享获得积分', points: 10 },
  BIRTHDAY: { type: 'earn', desc: '生日奖励', points: 100 },
  REDEEM_COUPON: { type: 'spend', desc: '积分兑换优惠券', points: null },
  REDEEM_GOODS: { type: 'spend', desc: '积分兑换商品', points: null },
  DEDUCT_ORDER: { type: 'spend', desc: '积分抵扣现金', points: null }
}

/**
  * @typedef {Object} PointsRecord
  * @property {string} id - 记录ID
  * @property {number} points - 积分变动数量（正数为获得，负数为消耗）
  * @property {string} source - 来源说明
  * @property {'earn'|'spend'} type - 变动类型
  * @property {string} time - 变动时间
  * @property {string} [orderNo] - 关联订单号
  */

//=========== ==== ==== = 模拟数据 = ========== ==== ==== =

/** 生成初始积分明细数据 */
function generateHistory() {
  const now = Date.now()
  const day = 86400000
  const items = []

  const records = [
  { source: POINTS_SOURCES.REGISTER, delta: 100, dayOffset: 30 },
  { source: POINTS_SOURCES.INVITE, delta: 50, dayOffset: 28 },
  { source: POINTS_SOURCES.DAILY_CHECKIN, delta: 5, dayOffset: 27 },
  { source: POINTS_SOURCES.DAILY_CHECKIN, delta: 5, dayOffset: 26 },
  { source: POINTS_SOURCES.SHOPPING, delta: 350, dayOffset: 25, orderNo: 'ORD20260325100' },
  { source: POINTS_SOURCES.REVIEW, delta: 50, dayOffset: 24 },
  { source: POINTS_SOURCES.SHARE, delta: 10, dayOffset: 23 },
  { source: POINTS_SOURCES.DAILY_CHECKIN, delta: 5, dayOffset: 22 },
  { source: POINTS_SOURCES.REDEEM_COUPON, delta: -300, dayOffset: 20 },
  { source: POINTS_SOURCES.DAILY_CHECKIN, delta: 5, dayOffset: 19 },
  { source: POINTS_SOURCES.DAILY_CHECKIN, delta: 5, dayOffset: 18 },
  { source: POINTS_SOURCES.SHOPPING, delta: 200, dayOffset: 16, orderNo: 'ORD20260316101' },
  { source: POINTS_SOURCES.DEDUCT_ORDER, delta: -50, dayOffset: 16 },
  { source: POINTS_SOURCES.DAILY_CHECKIN, delta: 5, dayOffset: 15 },
  { source: POINTS_SOURCES.INVITE, delta: 50, dayOffset: 14 },
  { source: POINTS_SOURCES.DAILY_CHECKIN, delta: 5, dayOffset: 13 },
  { source: POINTS_SOURCES.BIRTHDAY, delta: 100, dayOffset: 12 },
  { source: POINTS_SOURCES.DAILY_CHECKIN, delta: 5, dayOffset: 11 },
  { source: POINTS_SOURCES.SHOPPING, delta: 500, dayOffset: 10, orderNo: 'ORD20260320102' },
  { source: POINTS_SOURCES.REVIEW, delta: 50, dayOffset: 9 },
  { source: POINTS_SOURCES.DAILY_CHECKIN, delta: 5, dayOffset: 8 },
  { source: POINTS_SOURCES.SHARE, delta: 10, dayOffset: 7 },
  { source: POINTS_SOURCES.DAILY_CHECKIN, delta: 5, dayOffset: 6 },
  { source: POINTS_SOURCES.DAILY_CHECKIN, delta: 5, dayOffset: 5 },
  { source: POINTS_SOURCES.REDEEM_GOODS, delta: -500, dayOffset: 4 },
  { source: POINTS_SOURCES.DAILY_CHECKIN, delta: 5, dayOffset: 3 },
  { source: POINTS_SOURCES.SHOPPING, delta: 280, dayOffset: 2, orderNo: 'ORD20260428103' },
  { source: POINTS_SOURCES.REVIEW, delta: 50, dayOffset: 1 }
  ]

  records.forEach((r, i) =>{
  const time = new Date(now - r.dayOffset * day)
  items.push({
      id: `p${i}`,
      points: r.delta,
      source: r.source.desc,
      type: r.source.type,
      time: `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')} ${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`,
      orderNo: r.orderNo || ''
  })
  })

  return items
}

/** 计算积分总数 */
function calculateTotal(history) {
  return history.reduce((sum, item) =>sum + item.points, 0)
}

//=========== ==== ==== = 状态管理 = ========== ==== ==== =

/** 获取本地存储的积分数据 */
function loadFromStorage() {
  try {
  const data = wx.getStorageSync('userPointsData')
  if (data && data.history && data.history.length > 0) {
      return data
  }
  } catch (e) {
  console.warn('[points - manager] 读取本地积分数据失败', e)
  }
  return null
}

/** 保存积分数据到本地 */
function saveToStorage(data) {
  try {
  wx.setStorageSync('userPointsData', data)
  } catch (e) {
  console.warn('[points - manager] 保存积分数据失败', e)
  }
}

/** 初始化积分数据 */
function initPointsData() {
  let data = loadFromStorage()

  if (!data) {
  const history = generateHistory()
  data = {
      total: calculateTotal(history),
      history
  }
  saveToStorage(data)
  }

  return data
}

//=========== ==== ==== = 核心函数 = ========== ==== ==== =

/**
  * 获取当前积分总数
  * @returns {number}
  */
function getPoints() {
  const data = initPointsData()
  return data.total
}

/**
  * 获取积分明细列表
  * @param {number} [page = 1]
  * @param {number} [pageSize = 20]
  * @returns {{list: PointsRecord[], total: number, hasMore: boolean}}
  */
function getPointsHistory(page = 1, pageSize = 20) {
  const data = initPointsData()
  const allHistory = data.history

  const start = (page - 1) * pageSize
  const end = start + pageSize
  const list = allHistory.slice(start, end)

  return {
  list,
  total: data.total,
  hasMore: end < allHistory.length
  }
}

/**
  * 获取完整的积分明细列表（不分页）
  * @returns {PointsRecord[]}
  */
function getAllHistory() {
  const data = initPointsData()
  return data.history
}

/**
  * 增加积分
  * @param {number} amount - 增加数量
  * @param {string} source - 积分来源说明
  * @param {string} [orderNo] - 关联订单号
  * @returns {{success: boolean, total: number, record: PointsRecord}}
  */
function addPoints(amount, source, orderNo) {
  const data = initPointsData()
  const now = new Date()

  const record = {
  id: 'p_' + Date.now(),
  points: amount,
  source,
  type: 'earn',
  time: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
  orderNo: orderNo || ''
  }

  data.history.unshift(record)
  data.total = calculateTotal(data.history)
  saveToStorage(data)

  return { success: true, total: data.total, record }
}

/**
  * 消耗积分
  * @param {number} amount - 消耗数量（正数）
  * @param {string} source - 消耗说明
  * @param {string} [orderNo] - 关联订单号
  * @returns {{success: boolean, total: number, record: PointsRecord|null, message: string}}
  */
function redeemPoints(amount, source, orderNo) {
  const data = initPointsData()

  if (data.total < amount) {
  return { success: false, total: data.total, record: null, message: '积分不足' }
  }

  const now = new Date()
  const record = {
  id: 'p_' + Date.now(),
  points: -amount,
  source,
  type: 'spend',
  time: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
  orderNo: orderNo || ''
  }

  data.history.unshift(record)
  data.total = calculateTotal(data.history)
  saveToStorage(data)

  return { success: true, total: data.total, record, message: '积分消耗成功' }
}

/**
  * 计算可抵扣金额（100积分 = 1元）
  * @param {number} [maxDeductRatio = 0.2] - 最高抵扣比例
  * @param {number} [orderAmount = 0] - 订单金额
  * @returns {{deductPoints: number, deductAmount: number, total: number}}
  */
function calculateDeductible(maxDeductRatio = 0.2, orderAmount = 0) {
  const total = getPoints()

  // 计算可抵扣金额：100积分 = 1元
  const maxByPoints = Math.floor(total / 100)

  if (orderAmount <=0) {
  return { deductPoints: total, deductAmount: maxByPoints, total }
  }

  // 受限于最高抵扣比例
  const maxByRatio = Math.floor(orderAmount * maxDeductRatio)
  const deductAmount = Math.min(maxByPoints, maxByRatio)
  const deductPoints = deductAmount * 100

  return { deductPoints, deductAmount, total }
}

//=========== ==== ==== = API预留接口 = ========== ==== ==== =

/**
  * 从服务端获取积分数据（预留）
  * @returns {Promise < {total: number, history: PointsRecord[]} > }
  */
function fetchPointsFromServer() {
  // TODO: 替换为真实API调用
  return new Promise((resolve) =>{
  const data = initPointsData()
  resolve({ total: data.total, history: data.history })
  })
}

/**
  * 同步积分到服务端（预留）
  * @param {Object} data
  * @returns {Promise < {success: boolean} > }
  */
function syncPointsToServer(data) {
  // TODO: 替换为真实API调用
  return new Promise((resolve) =>{
  resolve({ success: true })
  })
}

module.exports = {
  // 来源定义
  POINTS_SOURCES,

  // 核心函数
  getPoints,
  getPointsHistory,
  getAllHistory,
  addPoints,
  redeemPoints,
  calculateDeductible,

  // 内部管理
  initPointsData,

  // API预留
  fetchPointsFromServer,
  syncPointsToServer
}
