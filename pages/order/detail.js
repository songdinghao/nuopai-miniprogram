// pages/order/detail.js - 订单详情页面
const app = getApp()

Page({
  data: {
  // 订单ID
  orderId: '',

  // 页面状态
  loading: true,
  loadError: false,

  // 订单信息
  orderInfo: null,

  // 状态信息
  statusInfo: {
      icon: '📦',
      text: '待发货',
      desc: '商家正在准备发货'
  },

  // 字体大小
  fontSize: 'normal'
  },

  // 页面加载
  onLoad(options) {

  const orderId = options.id || ''
  this.setData({ orderId })

  // 加载用户偏好
  this.loadUserPreferences()

  // 加载订单详情
  this.loadOrderDetail()
  },

  // 页面显示
  onShow() {
  },

  // 加载用户偏好
  loadUserPreferences() {
  const preferences = app.globalData.userPreferences || {}
  const fontSize = preferences.fontSize || 'normal'

  this.setData({ fontSize })
  },

  // 加载订单详情
  loadOrderDetail() {
  const orderId = this.data.orderId

  if (!orderId) {
    this.setData({ loading: false, loadError: true })
    return
  }

  this.setData({ loading: true, loadError: false })

  try {
    // 优先从 localStorage 读取真实订单数据
    const orders = wx.getStorageSync('orders') || []
    const orderInfo = orders.find(o => o.id === orderId)

    // 如果本地存储中找到了该订单，规范化数据格式
    if (orderInfo) {
      const normalized = this.normalizeOrderData(orderInfo)
      this.setData({
        orderInfo: normalized,
        statusInfo: this.getStatusInfo(normalized.status),
        loading: false,
        loadError: false
      })
      return
    }

    // 没找到则用模拟数据兜底
    const mockOrder = this.generateMockOrderDetail()
    this.setData({
      orderInfo: mockOrder,
      statusInfo: this.getStatusInfo(mockOrder.status),
      loading: false,
      loadError: false
    })
  } catch (e) {
    console.warn('读取订单存储失败', e)
    this.setData({ loading: false, loadError: true, orderInfo: null })
  }
  },

  // 规范化订单数据格式：统一字段名、生成 actions
  normalizeOrderData(order) {
  // 统一字段名：checkout 创建的订单使用 items/shippingFee/couponDiscount，
  // 模板期望 goods/freightPrice/couponPrice
  if (order.items && !order.goods) {
    order.goods = order.items.map(item => ({
      id: item.id || item.productId,
      productId: item.productId,
      name: item.name,
      image: item.image,
      spec: item.specsText || this._buildSpecText(item.attrs),
      price: item.price,
      count: item.quantity || item.count || 1
    }))
  }
  if (order.shippingFee !== undefined && order.freightPrice === undefined) {
    order.freightPrice = order.shippingFee
  }
  if (order.couponDiscount !== undefined && order.couponPrice === undefined) {
    order.couponPrice = order.couponDiscount
  }

  // 如果 actions 已经是数组格式，直接返回
  if (Array.isArray(order.actions)) return order

  // 根据订单状态生成对应的操作按钮
  const statusActionsMap = {
      pending: [
    { key: 'cancel', text: '取消订单', primary: false },
    { key: 'pay', text: '去支付', primary: true }
      ],
      paid: [
    { key: 'remind', text: '提醒发货', primary: false }
      ],
      shipped: [
    { key: 'confirm', text: '确认收货', primary: true },
    { key: 'afterSale', text: '申请售后', primary: false }
      ],
      completed: [
    { key: 'rebuy', text: '再次购买', primary: true }
      ],
      cancelled: [
    { key: 'rebuy', text: '再次购买', primary: true }
      ],
      refund: [
    { key: 'rebuy', text: '再次购买', primary: true }
      ]
  }

  order.actions = statusActionsMap[order.status] || []
  return order
  },

  // 生成模拟订单详情数据
  generateMockOrderDetail() {
  return {
      id: this.data.orderId || '1001',
      orderNo: 'NP202404301030001',
      status: 'shipped',
      createTime: '2024 - 04 - 30 10: 30: 00',
      payTime: '2024 - 04 - 30 10: 35: 00',
      shipTime: '2024 - 04 - 30 14: 20: 00',
      payMethod: '微信支付',
      goodsPrice: '298.00',
      freightPrice: '0.00',
      couponPrice: '20.00',
      totalPrice: '278.00',
      address: {
    name: '张女士',
    phone: '138****8888',
    province: '上海市',
    city: '上海市',
    district: '浦东新区',
    detail: '陆家嘴街道XX花园1号楼101室'
      },
      goods: [
    {
          id: '1001 - 1',
          productId: '100001',
          name: '玄关端景台永生花玫瑰摆件',
          image: '/assets/products/product1.jpg',
          spec: '陶瓷花器 - 简约搭配',
          price: '298.00',
          count: 1
    }
      ],
      actions: this.filterActions([
    { key: 'confirm', text: '确认收货', primary: true },
    { key: 'afterSale', text: '申请售后', primary: false }
      ])
  }
  },

  // 构建规格文本（将 attrs 对象转为中文文本）
  _buildSpecText(attrs) {
  if (!attrs) return ''
  const map = {
    vaseType: { ceramic: '陶瓷花器', glass: '玻璃花器', wood: '木质花器', metal: '金属花器' },
    flowerMatch: { simple: '简约搭配', rich: '丰富搭配', luxury: '奢华搭配' },
    packaging: { standard: '标准包装', gift: '礼品包装', premium: '豪华包装' }
  }
  const parts = []
  if (attrs.vaseType) parts.push(map.vaseType[attrs.vaseType] || attrs.vaseType)
  if (attrs.flowerMatch) parts.push(map.flowerMatch[attrs.flowerMatch] || attrs.flowerMatch)
  if (attrs.packaging) parts.push(map.packaging[attrs.packaging] || attrs.packaging)
  return parts.join(' · ')
  },

  // 过滤操作按钮（与WXML渲染条件和onActionTap处理逻辑对齐）
  filterActions(actions) {
  // 当前已实现的操作（对应onActionTap中的switch分支）
  const implementedActions = ['cancel', 'pay', 'confirm', 'remind', 'afterSale', 'rebuy', 'review']

  return actions.filter(action => implementedActions.includes(action.key))
  },

  getStatusInfo(status) {
  const statusMap = {
      pending: {
    icon: '💳',
    text: '待付款',
    desc: '请在30分钟内完成支付'
      },
      paid: {
    icon: '📦',
    text: '待发货',
    desc: '商家正在准备发货'
      },
      shipped: {
    icon: '🚚',
    text: '待收货',
    desc: '商品已发出，请注意查收'
      },
      completed: {
    icon: '✅',
    text: '已完成',
    desc: '感谢您的购买'
      },
      cancelled: {
    icon: '❌',
    text: '已取消',
    desc: '订单已取消'
      }
  }

  return statusMap[status] || statusMap['pending']
  },

  //===== ==== = 用户交互事件 = ==== ==== =

  // 查看商品详情
  onGoodsDetail(e) {
  const productId = e.currentTarget.dataset.id

  wx.navigateTo({
      url: `/pages/product/detail?id=${productId}`
  })
  },

  // 点击操作按钮
  onActionTap(e) {
  const action = e.currentTarget.dataset.action

  switch (action) {
      case 'cancel':
    this.onCancelOrder()
    break
      case 'pay':
    this.onPayOrder()
    break
      case 'confirm':
    this.onConfirmOrder()
    break
      case 'remind':
    this.onRemindShip()
    break
      case 'review':
    this.onReviewOrder()
    break
      case 'afterSale':
    this.onAfterSale()
    break
      case 'rebuy':
    this.onReBuy()
    break
  }
  },

  // 取消订单
  onCancelOrder() {
  wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      confirmText: '确定取消',
      confirmColor: "#2D8C7A",
      cancelText: '再想想',
      success: (res) =>{
    if (res.confirm) {
          this.updateOrderStatus('cancelled')

          wx.showToast({
      title: '订单已取消',
      icon: 'success',
      duration: 1500
          })

          setTimeout(() =>{
      wx.navigateBack()
          }, 500)
    }
      }
  })
  },

  // 去支付
  onPayOrder() {
  wx.showToast({
      title: '即将上线，敬请期待',
      icon: 'none',
      duration: 1500
  })
  },

  // 提醒发货
  onRemindShip() {
  wx.showToast({
      title: '已提醒卖家尽快发货',
      icon: 'success',
      duration: 1500
  })
  },

  // 确认收货
  onConfirmOrder() {
  wx.showModal({
      title: '确认收货',
      content: '确认已收到商品？',
      confirmText: '确认',
      confirmColor: "#2D8C7A",
      cancelText: '再等等',
      success: (res) =>{
    if (res.confirm) {
          // 更新订单状态到本地存储
          this.updateOrderStatus('completed')

          wx.showToast({
      title: '确认收货成功',
      icon: 'success',
      duration: 1500
          })

          // 跳转回订单列表页
          setTimeout(() =>{
      wx.navigateBack()
          }, 500)
    }
      }
  })
  },

  // 更新本地存储中的订单状态
  updateOrderStatus(newStatus) {
  try {
      const orders = wx.getStorageSync('orders') || []
      const idx = orders.findIndex(o =>o.id === this.data.orderId)
      if (idx >= 0) {
    orders[idx].status = newStatus
    // 同步更新状态文本（确保订单列表页也能正确显示）
    const statusTextMap = {
      pending: '待付款', paid: '待发货', shipped: '待收货',
      completed: '已完成', cancelled: '已取消', refund: '退款中'
    }
    const statusClassMap = {
      pending: 'pending', paid: 'paid', shipped: 'shipped',
      completed: 'completed', cancelled: 'cancelled', refund: 'refund'
    }
    orders[idx].statusText = statusTextMap[newStatus] || newStatus
    orders[idx].statusClass = statusClassMap[newStatus] || newStatus
    wx.setStorageSync('orders', orders)
    // 同步更新全局订单计数
    app.updateOrderCounts?.()
    // 即时更新页面显示
    const updatedOrder = this.normalizeOrderData(orders[idx])
    this.setData({
        orderInfo: updatedOrder,
        statusInfo: this.getStatusInfo(newStatus)
    })
      }
  } catch (e) {
      console.warn('更新订单状态失败', e)
  }
  },

  // 去评价
  onReviewOrder() {
  wx.showToast({
      title: '即将上线，敬请期待',
      icon: 'none',
      duration: 1500
  })
  },

  // 申请售后
  onAfterSale() {
  wx.showToast({
      title: '即将上线，敬请期待',
      icon: 'none',
      duration: 1500
  })
  },

  // 再次购买
  onReBuy() {
  try {
    const product = this.data.orderInfo?.goods
    if (product && product.length) {
      let cartItems = wx.getStorageSync('cartItems') || []
      product.forEach(goods => {
        const qty = goods.count || goods.quantity || 1
        const existIdx = cartItems.findIndex(c => c.productId === goods.productId)
        if (existIdx >= 0) {
          cartItems[existIdx].quantity += qty
        } else {
          cartItems.push({
            id: 'cart_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
            productId: goods.productId,
            name: goods.name,
            image: goods.image,
            price: goods.price,
            quantity: qty,
            specsText: goods.spec || '',
            selected: true
          })
        }
      })
      wx.setStorageSync('cartItems', cartItems)
      // 同步全局购物车数量
      const totalCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
      getApp().globalData.cartCount = totalCount
    }
  } catch (e) {
    console.warn('再次购买失败', e)
  }
  wx.showToast({ title: '已加入购物车', icon: 'success', duration: 1500 })
  },

  // 分享
  onShareAppMessage() {
  return {
      title: '诺派永生花 - 高品质永生花产品',
      path: '/pages/index/index'
  }
  },

  // 字体大小变化回调
  onFontSizeChange(fontSize) {
  this.setData({ fontSize })
  }
})
