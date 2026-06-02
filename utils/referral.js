// utils/referral.js - 老客邀新数据模型
// 提供邀请码生成、邀请记录存储、奖励规则

const STORAGE_KEY_INVITEES = 'referral_invitees'
const STORAGE_KEY_MY_INVITER = 'referral_my_inviter'
const STORAGE_KEY_REWARDS = 'referral_rewards'
const STORAGE_KEY_INVITE_CODE = 'referral_invite_code'

// 奖励规则配置
const REWARD_RULES = {
  // 新客奖励：注册即送新人优惠券
  newUser: {
  couponId: 'new_user_referral',
  title: '邀请好友专享券',
  amount: 20,
  minAmount: 100,
  validDays: 30
  },
  // 老客奖励：每成功邀请一人获得积分
  inviter: {
  points: 500,        // 邀请成功获得积分
  couponId: 'invite_reward',
  couponTitle: '邀请礼券',
  couponAmount: 10,
  couponMinAmount: 80,
  couponValidDays: 15
  },
  // 阶梯奖励
  tiered: [
  { count: 3, points: 2000, title: '邀请3人成就' },
  { count: 5, points: 5000, title: '邀请5人成就' },
  { count: 10, points: 12000, title: '邀请10人成就' }
  ]
}

/**
  * 生成邀请码（基于用户ID加密）
  * @param {string} userId - 用户ID
  * @returns {string} 邀请码
  */
function generateInviteCode(userId) {
  if (!userId) return ''
  // 使用 crypto.randomBytes 防止碰撞（与 mom-program.js 保持一致）
  const crypto = require('crypto')
  const userPart = userId.slice(-4).toUpperCase()
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8)
  return userPart + randomPart
}

/**
  * 获取或创建当前用户的邀请码
  * @param {string} userId - 用户ID
  * @returns {string} 邀请码
  */
function getInviteCode(userId) {
  if (!userId) return ''

  let code = wx.getStorageSync(STORAGE_KEY_INVITE_CODE)
  if (code) return code

  code = generateInviteCode(userId)
  wx.setStorageSync(STORAGE_KEY_INVITE_CODE, code)
  return code
}

/**
  * 保存邀请记录（新客注册时调用）
  * @param {string} inviterCode - 邀请人的邀请码
  * @param {string} newUserId - 新注册用户ID
  */
function saveReferralRecord(inviterCode, newUserId) {
  if (!inviterCode || !newUserId) return

  let invitees = wx.getStorageSync(STORAGE_KEY_INVITEES) || []

  // 检查是否已记录过
  const exists = invitees.some(r =>r.newUserId ===newUserId)
  if (exists) return

  invitees.push({
  inviterCode,
  newUserId,
  inviteTime: Date.now(),
  converted: false,   // 是否完成转化（下单）
  orderCount: 0
  })

  wx.setStorageSync(STORAGE_KEY_INVITEES, invitees)
}

/**
  * 标记被邀请用户已转化（首次下单时调用）
  * @param {string} newUserId - 新用户ID
  */
function markConverted(newUserId) {
  let invitees = wx.getStorageSync(STORAGE_KEY_INVITEES) || []
  let updated = false

  invitees = invitees.map(r =>{
  if (r.newUserId ===newUserId && !r.converted) {
      updated = true
      return { ...r, converted: true, orderCount: (r.orderCount || 0) + 1 }
  }
  // 增加订单次数
  if (r.newUserId ===newUserId) {
      return { ...r, orderCount: (r.orderCount || 0) + 1 }
  }
  return r
  })

  if (updated) {
  wx.setStorageSync(STORAGE_KEY_INVITEES, invitees)
  }
}

/**
  * 获取当前用户的邀请统计
  * @param {string} userId - 当前用户ID
  * @returns {Object} { total, converted, pending, rewards }
  */
function getReferralStats(userId) {
  const inviteCode = getInviteCode(userId)
  const invitees = wx.getStorageSync(STORAGE_KEY_INVITEES) || []
  const rewards = wx.getStorageSync(STORAGE_KEY_REWARDS) || {}

  // 过滤属于当前用户的邀请记录
  const myInvitees = invitees.filter(r =>r.inviterCode ===inviteCode)

  const total = myInvitees.length
  const converted = myInvitees.filter(r =>r.converted).length
  const pending = total - converted

  return {
  total,
  converted,
  pending,
  inviteCode,
  rewards
  }
}

/**
  * 发放老客邀请奖励（转化时调用）
  * @param {string} inviterCode - 邀请人邀请码
  */
function giveInviterReward(inviterCode) {
  const rewards = wx.getStorageSync(STORAGE_KEY_REWARDS) || {}

  // 记录积分奖励
  rewards.points = (rewards.points || 0) + REWARD_RULES.inviter.points

  // 发放优惠券（存到用户优惠券列表）
  let userCoupons = wx.getStorageSync('userCoupons') || []
  const newCoupon = {
  id: REWARD_RULES.inviter.couponId + '_' + Date.now(),
  title: REWARD_RULES.inviter.couponTitle,
  amount: REWARD_RULES.inviter.couponAmount,
  minAmount: REWARD_RULES.inviter.couponMinAmount,
  expireDate: new Date(Date.now() + REWARD_RULES.inviter.couponValidDays * 24 * 60 * 60 * 1000).toISOString(),
  status: 'unused'
  }
  userCoupons.push(newCoupon)
  wx.setStorageSync('userCoupons', userCoupons)

  // 累计邀请数量
  rewards.invitedCount = (rewards.invitedCount || 0) + 1

  // 检查阶梯奖励
  REWARD_RULES.tiered.forEach(tier =>{
  if (rewards.invitedCount ===tier.count && !rewards[`tier_${tier.count}_claimed`]) {
      rewards.points = (rewards.points || 0) + tier.points
      rewards[`tier_${tier.count}_claimed`] = true
  }
  })

  wx.setStorageSync(STORAGE_KEY_REWARDS, rewards)

  return {
  points: REWARD_RULES.inviter.points,
  coupon: newCoupon,
  totalPoints: rewards.points
  }
}

/**
  * 发放新人优惠券（新用户注册时调用）
  */
function giveNewUserReferralCoupon() {
  const hasGiven = wx.getStorageSync('hasGivenNewUserCoupon')
  if (hasGiven) return null

  const newCoupon = {
  id: REWARD_RULES.newUser.couponId + '_' + Date.now(),
  title: REWARD_RULES.newUser.title,
  amount: REWARD_RULES.newUser.amount,
  minAmount: REWARD_RULES.newUser.minAmount,
  expireDate: new Date(Date.now() + REWARD_RULES.newUser.validDays * 24 * 60 * 60 * 1000).toISOString(),
  status: 'unused'
  }

  let userCoupons = wx.getStorageSync('userCoupons') || []
  userCoupons.push(newCoupon)
  wx.setStorageSync('userCoupons', userCoupons)
  wx.setStorageSync('hasGivenNewUserCoupon', true)

  return newCoupon
}

/**
  * 获取奖励说明文本
  * @returns {Array} 奖励规则说明列表
  */
function getRewardRules() {
  return [
  {
      icon: '🎁',
      title: '新客奖励',
      desc: `注册即送 ¥${REWARD_RULES.newUser.amount} 新人专享券（满¥${REWARD_RULES.newUser.minAmount}可用）`
  },
  {
      icon: '🌟',
      title: '老客奖励',
      desc: `每成功邀请1位好友，您可获得 ${REWARD_RULES.inviter.points} 积分和 ¥${REWARD_RULES.inviter.couponAmount} 邀请礼券`
  },
  {
      icon: '🏆',
      title: '阶梯成就',
      desc: REWARD_RULES.tiered.map(t =>`邀请 ${t.count} 人：额外奖励 ${t.points} 积分`
      ).join('\n')
  }
  ]
}

/**
  * 保存当前用户的邀请人
  * @param {string} inviterCode 
  */
function setMyInviter(inviterCode) {
  if (!inviterCode) return
  wx.setStorageSync(STORAGE_KEY_MY_INVITER, inviterCode)
}

/**
  * 获取当前用户的邀请人
  * @returns {string} 
  */
function getMyInviter() {
  return wx.getStorageSync(STORAGE_KEY_MY_INVITER) || ''
}

module.exports = {
  generateInviteCode,
  getInviteCode,
  saveReferralRecord,
  markConverted,
  getReferralStats,
  giveInviterReward,
  giveNewUserReferralCoupon,
  getRewardRules,
  setMyInviter,
  getMyInviter,
  REWARD_RULES
}
