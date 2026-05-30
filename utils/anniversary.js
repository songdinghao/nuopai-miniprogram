// utils/anniversary.js - 纪念日提醒数据模型
// 提供纪念日存储、计算、提醒触发功能

const STORAGE_KEY = 'user_anniversaries'

// 纪念日类型
const ANNIVERSARY_TYPES = [
  { id: 'wedding', name: '结婚纪念日', icon: '💍', giftKeyword: '永生花' },
  { id: 'love', name: '恋爱纪念日', icon: '💕', giftKeyword: '玫瑰花' },
  { id: 'birthday_spouse', name: '配偶生日', icon: '🎂', giftKeyword: '生日礼物' },
  { id: 'birthday_parent', name: '父母生日', icon: '👴', giftKeyword: '送长辈' },
  { id: 'birthday_child', name: '孩子生日', icon: '👶', giftKeyword: '儿童礼物' },
  { id: 'mother_day', name: '母亲节', icon: '🌷', giftKeyword: '康乃馨' },
  { id: 'father_day', name: '父亲节', icon: '🌻', giftKeyword: '送父亲' },
  { id: 'valentine', name: '情人节', icon: '🌹', giftKeyword: '玫瑰花' },
  { id: 'christmas', name: '圣诞节', icon: '🎄', giftKeyword: '圣诞礼物' },
  { id: 'custom', name: '自定义', icon: '📅', giftKeyword: '永生花' }
]

// 提醒提前天数配置
const REMINDER_DAYS = [7, 3, 1]

/**
  * 创建新的纪念日
  * @param {Object} data - 纪念日数据
  * @param {string} data.name - 纪念日名称
  * @param {string} data.type - 纪念日类型ID
  * @param {string} data.date - 日期 (MM - DD 或 YYYY - MM - DD)
  * @param {Array} data.reminderDays - 提前提醒天数 [7, 3, 1]
  * @param {string} data.note - 备注
  * @returns {Object} 创建的纪念日对象
  */
function createAnniversary(data) {
  const anniversaries = wx.getStorageSync(STORAGE_KEY) || []

  const newAnniversary = {
  id: 'anni_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
  name: data.name || '',
  type: data.type || 'custom',
  date: data.date || '',
  reminderDays: data.reminderDays || [7, 3, 1],
  note: data.note || '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  enabled: true
  }

  anniversaries.unshift(newAnniversary)
  wx.setStorageSync(STORAGE_KEY, anniversaries)

  return newAnniversary
}

/**
  * 获取所有纪念日
  * @returns {Array} 纪念日列表（带计算后的天数）
  */
function getAllAnniversaries() {
  const anniversaries = wx.getStorageSync(STORAGE_KEY) || []

  return anniversaries.filter(a =>a.enabled).map(a =>{
  const daysUntil = calculateDaysUntil(a.date)
  return {
      ...a,
      daysUntil,
      isUpcoming: daysUntil >=0 && daysUntil <=30,
      isPast: daysUntil < 0,
      isToday: daysUntil ===0
  }
  })
}

/**
  * 更新纪念日
  * @param {string} id - 纪念日ID
  * @param {Object} data - 更新的数据
  * @returns {boolean} 是否更新成功
  */
function updateAnniversary(id, data) {
  let anniversaries = wx.getStorageSync(STORAGE_KEY) || []
  const index = anniversaries.findIndex(a =>a.id ===id)

  if (index ===-1) return false

  anniversaries[index] = {
  ...anniversaries[index],
  ...data,
  updatedAt: Date.now()
  }

  wx.setStorageSync(STORAGE_KEY, anniversaries)
  return true
}

/**
  * 删除纪念日
  * @param {string} id - 纪念日ID
  * @returns {boolean} 是否删除成功
  */
function deleteAnniversary(id) {
  let anniversaries = wx.getStorageSync(STORAGE_KEY) || []
  const index = anniversaries.findIndex(a =>a.id ===id)

  if (index ===-1) return false

  // 软删除
  anniversaries[index].enabled = false
  wx.setStorageSync(STORAGE_KEY, anniversaries)
  return true
}

/**
  * 计算距离指定日期的天数
  * @param {string} dateStr - 日期字符串 (MM - DD 或 YYYY - MM - DD)
  * @returns {number} 距离天数（负数表示已过）
  */
function calculateDaysUntil(dateStr) {
  if (!dateStr) return 999

  const now = new Date()
  const currentYear = now.getFullYear()

  let targetDate
  if (dateStr.length ===5) {
  // MM - DD 格式，使用今年
  targetDate = new Date(currentYear, parseInt(dateStr.split('-')[0]) - 1, parseInt(dateStr.split('-')[1]))
  // 如果今年已过，算到明年
  if (targetDate < now) {
      targetDate = new Date(currentYear + 1, parseInt(dateStr.split('-')[0]) - 1, parseInt(dateStr.split('-')[1]))
  }
  } else {
  // YYYY - MM - DD 格式
  targetDate = new Date(dateStr)
  // 如果今年已过，算到明年
  if (targetDate < now) {
      targetDate = new Date(currentYear + 1, parseInt(dateStr.split('-')[1]) - 1, parseInt(dateStr.split('-')[2]))
  }
  }

  const diff = targetDate.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
  * 获取即将到来的纪念日列表（30天内）
  * @returns {Array} 即将到来的纪念日
  */
function getUpcomingAnniversaries() {
  const all = getAllAnniversaries()
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  return all
  .filter(a =>a.daysUntil >=0 && a.daysUntil <=30)
  .sort((a, b) =>a.daysUntil - b.daysUntil)
}

/**
  * 获取最近的即将到来纪念日
  * @returns {Object|null} 最近的纪念日
  */
function getNearestAnniversary() {
  const upcoming = getUpcomingAnniversaries()
  return upcoming.length > 0 ? upcoming[0] : null
}

/**
  * 检查是否需要发送提醒
  * @returns {Array} 需要提醒的纪念日列表
  */
function checkReminders() {
  const all = getAllAnniversaries()
  const reminders = []

  all.forEach(a =>{
  if (a.daysUntil < 0) return  // 已过的不提醒

  // 检查是否需要提醒
  a.reminderDays.forEach(day =>{
      if (a.daysUntil ===day) {
    reminders.push({
          id: a.id,
          name: a.name,
          type: a.type,
          daysUntil: a.daysUntil,
          date: a.date
    })
      }
  })
  })

  return reminders
}

/**
  * 根据纪念日类型获取推荐礼物关键词
  * @param {string} typeId - 纪念日类型ID
  * @returns {string} 推荐关键词
  */
function getGiftKeyword(typeId) {
  const type = ANNIVERSARY_TYPES.find(t =>t.id ===typeId)
  return type ? type.giftKeyword : '永生花'
}

/**
  * 获取纪念日类型列表
  * @returns {Array} 类型列表
  */
function getAnniversaryTypes() {
  return ANNIVERSARY_TYPES
}

/**
  * 获取纪念日类型名称
  * @param {string} typeId - 类型ID
  * @returns {string} 类型名称
  */
function getTypeName(typeId) {
  const type = ANNIVERSARY_TYPES.find(t =>t.id ===typeId)
  return type ? type.name : '自定义'
}

/**
  * 获取纪念日类型图标
  * @param {string} typeId - 类型ID
  * @returns {string} 图标
  */
function getTypeIcon(typeId) {
  const type = ANNIVERSARY_TYPES.find(t =>t.id ===typeId)
  return type ? type.icon : '📅'
}

module.exports = {
  createAnniversary,
  getAllAnniversaries,
  updateAnniversary,
  deleteAnniversary,
  calculateDaysUntil,
  getUpcomingAnniversaries,
  getNearestAnniversary,
  checkReminders,
  getGiftKeyword,
  getAnniversaryTypes,
  getTypeName,
  getTypeIcon,
  ANNIVERSARY_TYPES,
  REMINDER_DAYS
}
