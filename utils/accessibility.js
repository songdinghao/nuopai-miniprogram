/**
  * accessibility.js - 无障碍适配工具
  * 支持无障碍标签设置、屏幕阅读器播报等功能
  */

// 屏幕阅读器播报队列
let announceQueue = []
let isAnnouncing = false

/**
  * 设置无障碍标签
  * 为小程序元素添加无障碍描述
  * @param {Object} element - 页面元素（通过 SelectorQuery 获取）
  * @param {string} label - 无障碍标签文本
  */
function setAriaLabel(element, label) {
  if (!element || !label) return

  try {
  // 小程序中使用 aria - label 属性
  element.setAttribute('aria - label', label)
  // 同时设置 role 属性
  element.setAttribute('role', 'img')
  } catch (error) {
  console.warn('[accessibility] 设置无障碍标签失败: ', error)
  }
}

/**
  * 屏幕阅读器播报
  * 使用 wx.createLivePusherContext 或 accessibility API
  * @param {string} message - 播报内容
  * @param {Object} options - 配置选项
  * @param {boolean} options.interrupt - 是否打断当前播报（默认false）
  * @param {number} options.delay - 播报延迟(ms)
  */
function announce(message, options = {}) {
  const { interrupt = false, delay = 0 } = options

  if (!message) return

  const announceItem = { message, interrupt, delay }

  if (interrupt) {
  // 打断模式：清空队列，立即播报
  announceQueue = [announceItem]
  if (isAnnouncing) {
      isAnnouncing = false
  }
  processAnnounceQueue()
  } else {
  // 非打断模式：加入队列
  announceQueue.push(announceItem)
  if (!isAnnouncing) {
      processAnnounceQueue()
  }
  }
}

/**
  * 处理播报队列
  * @private
  */
function processAnnounceQueue() {
  if (announceQueue.length ===0) {
  isAnnouncing = false
  return
  }

  isAnnouncing = true
  const item = announceQueue.shift()

  setTimeout(() =>{
  try {
      // 使用小程序无障碍API进行播报
      if (wx.announceAccessibility) {
    wx.announceAccessibility({
          text: item.message,
          success: () =>{
      // 播报成功，继续处理队列
      processAnnounceQueue()
          },
          fail: () =>{
      // 播报失败，使用备用方案
      fallbackAnnounce(item.message)
      processAnnounceQueue()
          }
    })
      } else {
    // 低版本基础库使用备用方案
    fallbackAnnounce(item.message)
    processAnnounceQueue()
      }
  } catch (error) {
      console.warn('[accessibility] 播报失败: ', error)
      processAnnounceQueue()
  }
  }, item.delay)
}

/**
  * 播报备用方案
  * 使用 wx.showToast 作为兜底
  * @private
  */
function fallbackAnnounce(message) {
  try {
  // 使用 toast 作为视觉替代
  wx.showToast({
      title: message.length > 7 ? message.slice(0, 7) + '...' : message,
      icon: 'none',
      duration: 2000
  })

  // 改变页面标题作为辅助提示
  const pages = getCurrentPages()
  if (pages.length > 0) {
      const currentPage = pages[pages.length - 1]
      wx.setNavigationBarTitle({
    title: message.length > 10 ? message.slice(0, 10) + '...' : message
      })
      // 2秒后恢复原标题
      setTimeout(() =>{
    wx.setNavigationBarTitle({
          title: currentPage.__title__ || '诺派永生花商城'
    })
      }, 2000)
  }
  } catch (error) {
  // 静默失败
  }
}

/**
  * 为按钮添加无障碍描述
  * @param {string} buttonSelector - 按钮选择器
  * @param {string} label - 描述文本
  * @param {Object} page - 页面实例
  */
function setButtonAriaLabel(buttonSelector, label, page) {
  if (!page) return

  try {
  const query = page.createSelectorQuery ? page.createSelectorQuery() : wx.createSelectorQuery()
  query.select(buttonSelector).fields({
      node: true,
      properties: ['aria - label', 'role']
  }).exec((res) =>{
      if (res && res[0]) {
    setAriaLabel(res[0].node, label)
      }
  })
  } catch (error) {
  console.warn('[accessibility] 设置按钮无障碍标签失败: ', error)
  }
}

/**
  * 为图片设置无障碍标签
  * @param {string} imageSelector - 图片选择器
  * @param {string} alt - 图片描述
  * @param {Object} page - 页面实例
  */
function setImageAlt(imageSelector, alt, page) {
  setButtonAriaLabel(imageSelector, alt, page)
}

/**
  * 获取关键交互点的无障碍描述
  * @param {string} action - 交互动作
  * @param {string} target - 交互目标
  * @returns {string} 无障碍描述文本
  */
function getAccessibilityLabel(action, target) {
  const labelMap = {
  'back': '返回',
  'close': '关闭',
  'search': '搜索',
  'cart': '购物车',
  'share': '分享',
  'collect': '收藏',
  'add_cart': '加入购物车',
  'buy_now': '立即购买',
  'voice_search': '语音搜索',
  'ar_preview': 'AR预览',
  'increase': '增加',
  'decrease': '减少',
  'confirm': '确认',
  'cancel': '取消',
  'more': '查看更多',
  'notification': '消息通知',
  'user_avatar': '用户头像',
  'back_to_top': '返回顶部'
  }

  const actionLabel = labelMap[action] || action
  return target ? `${actionLabel} ${target}` : actionLabel
}

/**
  * 在页面 onLoad 中初始化无障碍
  * @param {Object} page - 页面实例
  * @param {string} pageTitle - 页面标题
  */
function initPageAccessibility(page, pageTitle) {
  if (!page) return

  try {
  // 存储页面标题用于恢复
  page.__title__ = pageTitle

  // 设置页面标题（屏幕阅读器优先读取）
  wx.setNavigationBarTitle({
      title: pageTitle
  })

  // 页面加载完成后播报
  announce(`已进入${pageTitle}`, { delay: 500 })
  } catch (error) {
  console.warn('[accessibility] 初始化页面无障碍失败: ', error)
  }
}

module.exports = {
  setAriaLabel,
  announce,
  setButtonAriaLabel,
  setImageAlt,
  getAccessibilityLabel,
  initPageAccessibility
}
