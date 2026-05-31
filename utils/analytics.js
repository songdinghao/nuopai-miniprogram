/**
 * analytics.js - 埋点工具模块
 * 提供便捷的埋点方法，配合 app.trackEvent 使用
 */

/**
 * 埋点事件上报
 * @param {string} eventName - 事件名称
 * @param {object} params - 事件参数
 */
function trackEvent(eventName, params = {}) {
  try {
    const app = getApp()
    if (app && app.trackEvent) {
      app.trackEvent(eventName, params)
    }
  } catch (e) {
    console.warn('[analytics] trackEvent 失败:', e)
  }
}

/**
 * 页面浏览埋点
 * @param {string} pageName - 页面名称
 * @param {object} [extra] - 额外参数
 */
function trackPageView(pageName, extra = {}) {
  trackEvent('page_view', {
    page: pageName,
    ...extra
  })
}

/**
 * 购买事件埋点
 * @param {string} orderId - 订单ID
 * @param {string|number} amount - 支付金额
 * @param {Array} items - 商品列表
 */
function trackPurchase(orderId, amount, items = []) {
  trackEvent('purchase', {
    order_id: orderId,
    amount: parseFloat(amount) || 0,
    items: items.map(item => ({
      product_id: item.productId || item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity || item.count || 1
    })),
    item_count: items.length
  })
}

/**
 * 商品浏览埋点
 * @param {string} productId - 商品ID
 * @param {string} name - 商品名称
 * @param {number} price - 商品价格
 */
function trackProductView(productId, name, price) {
  trackEvent('product_view', {
    product_id: productId,
    name: name,
    price: price
  })
}

/**
 * 上报埋点队列到服务器
 * TODO: 接入真实端点后替换 URL
 * @returns {Promise<boolean>} 是否上报成功
 */
function flushQueue() {
  return new Promise((resolve) => {
    try {
      const queue = wx.getStorageSync('analytics_queue') || []
      if (queue.length === 0) {
        resolve(true)
        return
      }

      const app = getApp()
      // TODO: 接入真实端点
      const url = (app && app.globalData && app.globalData.config && app.globalData.config.analyticsUrl)
        || 'https://wechat.zzjgsw.com/api/analytics/batch'

      wx.request({
        url: url,
        method: 'POST',
        data: { events: queue },
        header: { 'Content-Type': 'application/json' },
        timeout: 5000,
        success: (res) => {
          if (res.statusCode === 200) {
            // 上报成功，清空队列
            wx.setStorageSync('analytics_queue', [])
            resolve(true)
          } else {
            resolve(false)
          }
        },
        fail: () => {
          resolve(false)
        }
      })
    } catch (e) {
      console.warn('[analytics] flushQueue 失败:', e)
      resolve(false)
    }
  })
}

/**
 * 获取队列中待上报事件数量
 * @returns {number}
 */
function getQueueSize() {
  try {
    const queue = wx.getStorageSync('analytics_queue') || []
    return queue.length
  } catch (e) {
    return 0
  }
}

module.exports = {
  trackEvent,
  trackPageView,
  trackPurchase,
  trackProductView,
  flushQueue,
  getQueueSize
}
