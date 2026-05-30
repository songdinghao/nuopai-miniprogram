// utils/group - buy.js - 拼团数据模型与工具函数
const storeConfig = require('../config/store-config.js')

// 拼团配置
const GROUP_BUY_CONFIG = storeConfig.groupBuy

/**
  * 生成拼团ID
  */
function generateGroupId() {
  return 'GB' + Date.now() + Math.random().toString(36).slice(2, 8).toUpperCase()
}

/**
  * 获取拼团类型配置
  * @param {string} typeId - 'group2' | 'group3'
  */
function getGroupTypeConfig(typeId) {
  return GROUP_BUY_CONFIG.types.find(t =>t.id ===typeId) || GROUP_BUY_CONFIG.types[0]
}

/**
  * 计算拼团价格
  * @param {number} originalPrice - 原价
  * @param {string} typeId - 拼团类型ID
  */
function calcGroupPrice(originalPrice, typeId) {
  const config = getGroupTypeConfig(typeId)
  return Math.round(originalPrice * config.discountRate * 100) / 100
}

/**
  * 计算团长价格（在拼团价基础上额外优惠）
  * @param {number} originalPrice - 原价
  * @param {string} typeId - 拼团类型ID
  */
function calcLeaderPrice(originalPrice, typeId) {
  const groupPrice = calcGroupPrice(originalPrice, typeId)
  const config = getGroupTypeConfig(typeId)
  return Math.round(groupPrice * (1 - config.leaderBonusRate) * 100) / 100
}

/**
  * 创建新拼团
  * @param {Object} params
  * @param {string} params.productId - 商品ID
  * @param {string} params.productName - 商品名称
  * @param {number} params.originalPrice - 原价
  * @param {string} params.mainImage - 商品主图
  * @param {string} params.skuId - SKU ID
  * @param {Object} params.skuAttrs - SKU 属性
  * @param {number} params.skuPrice - SKU 价格
  * @param {string} params.typeId - 拼团类型ID
  * @param {string} params.leaderId - 团长用户ID
  * @param {string} params.leaderName - 团长用户名
  * @param {string} params.leaderAvatar - 团长头像
  * @returns {Object} 拼团对象
  */
function createGroup(params) {
  const config = getGroupTypeConfig(params.typeId)
  const groupPrice = calcGroupPrice(params.skuPrice, params.typeId)
  const leaderPrice = calcLeaderPrice(params.skuPrice, params.typeId)
  const now = Date.now()

  return {
  id: generateGroupId(),
  productId: params.productId,
  productName: params.productName,
  originalPrice: params.originalPrice,
  mainImage: params.mainImage,
  skuId: params.skuId,
  skuAttrs: params.skuAttrs,
  skuPrice: params.skuPrice,
  typeId: params.typeId,
  typeConfig: config,
  groupPrice: groupPrice,
  leaderPrice: leaderPrice,
  // 团长信息
  leader: {
      id: params.leaderId,
      name: params.leaderName,
      avatar: params.leaderAvatar
  },
  // 参团成员
  members: [
      {
    id: params.leaderId,
    name: params.leaderName,
    avatar: params.leaderAvatar,
    role: 'leader',
    joinTime: now
      }
  ],
  // 状态: 'pending' | 'success' | 'expired'
  status: 'pending',
  // 时间信息
  createTime: now,
  expireTime: now + config.defaultDuration * 60 * 60 * 1000,
  successTime: null,
  // 统计
  currentCount: 1,
  needCount: config.minPeople - 1
  }
}

/**
  * 加入拼团
  * @param {Object} group - 拼团对象
  * @param {Object} member - 成员信息 {id, name, avatar}
  * @returns {Object} 更新后的拼团对象
  */
function joinGroup(group, member) {
  if (group.status !== 'pending') {
  throw new Error('该拼团已结束')
  }
  if (isGroupExpired(group)) {
  throw new Error('该拼团已过期')
  }
  if (group.members.length >=group.typeConfig.maxPeople) {
  throw new Error('该拼团人数已满')
  }
  if (group.members.some(m =>m.id ===member.id)) {
  throw new Error('您已在该拼团中')
  }

  group.members.push({
  id: member.id,
  name: member.name,
  avatar: member.avatar,
  role: 'member',
  joinTime: Date.now()
  })
  group.currentCount = group.members.length
  group.needCount = group.typeConfig.minPeople - group.members.length

  // 判断是否成团
  if (group.members.length >=group.typeConfig.minPeople) {
  group.status = 'success'
  group.successTime = Date.now()
  group.needCount = 0
  }

  return group
}

/**
  * 检查拼团是否过期
  */
function isGroupExpired(group) {
  return Date.now() > group.expireTime
}

/**
  * 获取拼团剩余时间（毫秒）
  */
function getGroupRemainingTime(group) {
  if (group.status !== 'pending') return 0
  const remaining = group.expireTime - Date.now()
  return Math.max(0, remaining)
}

/**
  * 格式化剩余时间为 HH: MM: SS
  */
function formatRemainingTime(ms) {
  if (ms <=0) return '00: 00: 00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`
}

function padZero(num) {
  return num < 10 ? '0' + num : String(num)
}

/**
  * 获取拼团状态文本
  */
function getGroupStatusText(group) {
  switch (group.status) {
  case 'pending':
      if (isGroupExpired(group)) return '已过期'
      return '待成团'
  case 'success':
      return '已成团'
  case 'expired':
      return '已过期'
  default:
      return '未知'
  }
}

/**
  * 从本地存储加载所有拼团
  */
function loadGroups() {
  return wx.getStorageSync('groupBuyGroups') || []
}

/**
  * 保存单个拼团到本地存储
  */
function saveGroup(group) {
  const groups = loadGroups()
  const index = groups.findIndex(g =>g.id ===group.id)
  if (index >=0) {
  groups[index] = group
  } else {
  groups.unshift(group)
  }
  wx.setStorageSync('groupBuyGroups', groups)
}

/**
  * 根据商品ID获取活跃拼团列表
  */
function getActiveGroupsByProduct(productId) {
  const groups = loadGroups()
  return groups.filter(g =>{
  if (g.productId !== productId) return false
  if (g.status ==='success') return true
  if (g.status ==='expired') return false
  // 待成团但已过期
  if (isGroupExpired(g)) {
      g.status = 'expired'
      saveGroup(g)
      return false
  }
  return true
  })
}

/**
  * 获取拼团社交证明文案
  */
function getGroupSocialProof(productId) {
  const groups = loadGroups()
  const successCount = groups.filter(g =>g.productId ===productId && g.status ==='success').length
  const activeCount = groups.filter(g =>g.productId ===productId && g.status ==='pending').length

  return {
  successCount,
  activeCount,
  text: `已${successCount > 0 ? successCount + '人拼团成功' : '有' + activeCount + '个拼团进行中'}`
  }
}

module.exports = {
  GROUP_BUY_CONFIG,
  generateGroupId,
  getGroupTypeConfig,
  calcGroupPrice,
  calcLeaderPrice,
  createGroup,
  joinGroup,
  isGroupExpired,
  getGroupRemainingTime,
  formatRemainingTime,
  getGroupStatusText,
  loadGroups,
  saveGroup,
  getActiveGroupsByProduct,
  getGroupSocialProof
}
