// pages/order/list.js - 订单列表页面
const app = getApp()

Page({
  data: {
  // 页面状态
  loading: true,
  loadError: false,

  // 当前状态
  currentStatus: 'all',

  // 状态列表
  statusList: [
      { key: 'all', name: '全部' },
      { key: 'pending', name: '待付款' },
      { key: 'paid', name: '待发货' },
      { key: 'shipped', name: '待收货' },
      { key: 'completed', name: '已完成' }
  ],

  // 订单列表
  orderList: [],

  // 字体大小
  fontSize: 'normal'
  },

  // 页面加载
  onLoad(options) {

  if (options.status) {
      this.setData({ currentStatus: options.status })
  }

  // 加载用户偏好
  this.loadUserPreferences()

  // 加载订单列表
  this.loadOrderList()
  },

  // 页面显示
  onShow() {

  // 重新加载订单列表
  this.loadOrderList()
  },

  // 下拉刷新
  onPullDownRefresh() {

  this.loadOrderList()

  setTimeout(() =>{
      wx.stopPullDownRefresh()
  }, 1000)
  },

  // 加载用户偏好
  loadUserPreferences() {
  const preferences = app.globalData.userPreferences || {}
  const fontSize = preferences.fontSize || 'normal'

  this.setData({ fontSize })
  },

  // 加载订单列表
  loadOrderList() {
  this.setData({ loading: true, loadError: false })
  try {
    // 从本地存储读取真实订单，无订单时显示空状态（不再自动生成 mock）
    const storedOrders = wx.getStorageSync('orders') || []
    let orderList = storedOrders

    // 规范化所有订单数据（统一字段格式）
    orderList = orderList.map(order => this.normalizeOrderData(order))

    // 根据状态筛选
    if (this.data.currentStatus !== 'all') {
      orderList = orderList.filter(item => item.status === this.data.currentStatus)
    }

    this.setData({ orderList, loading: false, loadError: false })
  } catch (e) {
    console.warn('加载订单列表失败', e)
    this.setData({ orderList: [], loading: false, loadError: true })
  }
  },

  // 重试加载列表
  retryLoadList() {
    this.loadOrderList()
  },

  // 规范化订单数据格式：统一字段名、生成显示文本和操作按钮
  normalizeOrderData(order) {
    // 统一字段名：checkout 创建的订单使用 items/shippingFee/couponDiscount
    if (order.items && !order.goods) {
      order.goods = order.items.map(item => ({
        id: item.id || item.productId,
        productId: item.productId,
        name: item.name,
        image: item.image,
        spec: item.specsText || '',
        price: item.price,
        count: item.quantity || item.count || 1
      }))
    }

    // 计算商品总件数
    if (!order.totalCount) {
      order.totalCount = (order.goods || []).reduce((sum, g) => sum + (g.count || 1), 0)
    }

    // 生成状态显示文本
    if (!order.statusText || !order.statusClass) {
      const statusMap = {
        pending: { statusText: '待付款', statusClass: 'pending' },
        paid: { statusText: '待发货', statusClass: 'paid' },
        shipped: { statusText: '待收货', statusClass: 'shipped' },
        completed: { statusText: '已完成', statusClass: 'completed' },
        cancelled: { statusText: '已取消', statusClass: 'cancelled' },
        refund: { statusText: '退款中', statusClass: 'refund' }
      }
      const mapped = statusMap[order.status] || statusMap['pending']
      order.statusText = mapped.statusText
      order.statusClass = mapped.statusClass
    }

    // 生成操作按钮
    if (!order.actions) {
      const actionsMap = {
        pending: { cancel: true, pay: true },
        paid: { remind: true },
        shipped: { confirm: true, afterSale: true },
        completed: { rebuy: true },
        cancelled: { rebuy: true }
      }
      order.actions = actionsMap[order.status] || {}
    }

    return order
  },

  // 生成模拟订单数据
  generateMockOrders() {
  const orders = [
      {
    id: '1001',
    status: 'pending',
    statusText: '待付款',
    statusClass: 'pending',
    createTime: '2024 - 04 - 30 10: 30: 00',
    totalPrice: '298.00',
    totalCount: 1,
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
    actions: {
          cancel: true
    }
      },
      {
    id: '1002',
    status: 'paid',
    statusText: '待发货',
    statusClass: 'paid',
    createTime: '2024 - 04 - 28 15: 20: 00',
    totalPrice: '596.00',
    totalCount: 2,
    goods: [
          {
      id: '1002 - 1',
      productId: '100002',
      name: '客厅茶几绣球花装饰',
      image: '/assets/products/product2.jpg',
      spec: '玻璃花器 - 丰富搭配',
      price: '298.00',
      count: 1
          },
          {
      id: '1002 - 2',
      productId: '100003',
      name: '餐厅餐桌牡丹花艺',
      image: '/assets/products/product3.jpg',
      spec: '金属花器 - 简约搭配',
      price: '298.00',
      count: 1
          }
    ],
    actions: {
          remind: true
    }
      },
      {
    id: '1003',
    status: 'shipped',
    statusText: '待收货',
    statusClass: 'shipped',
    createTime: '2024 - 04 - 25 09: 10: 00',
    totalPrice: '248.00',
    totalCount: 1,
    goods: [
          {
      id: '1003 - 1',
      productId: '100004',
      name: '卧室床头柜百合装饰',
      image: '/assets/products/product4.jpg',
      spec: '木质花器 - 简约搭配',
      price: '248.00',
      count: 1
          }
    ],
    actions: {
          confirm: true
    }
      },
      {
    id: '1004',
    status: 'completed',
    statusText: '已完成',
    statusClass: 'completed',
    createTime: '2024 - 04 - 15 14: 30: 00',
    totalPrice: '268.00',
    totalCount: 1,
    goods: [
          {
      id: '1004 - 1',
      productId: '100001',
      name: '玄关端景台永生花玫瑰摆件',
      image: '/assets/products/product1.jpg',
      spec: '陶瓷花器 - 简约搭配',
      price: '268.00',
      count: 1
          }
    ],
    actions: {
          rebuy: true
    }
      }
  ]

  return orders
  },

  //===== ==== = 用户交互事件 = ==== ==== =

  // 切换状态
  onStatusTap(e) {
  const status = e.currentTarget.dataset.status

  this.setData({ currentStatus: status })

  // 重新加载订单列表
  this.loadOrderList()
  },

  // 查看订单详情
  onOrderDetail(e) {
  const id = e.currentTarget.dataset.id

  wx.navigateTo({
      url: `/pages/order/detail?id=${id}`
  })
  },

  // 取消订单
  onCancelOrder(e) {
  const id = e.currentTarget.dataset.id

  wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      confirmText: '确定取消',
      confirmColor: "#2D8C7A",
      cancelText: '再想想',
      success: (res) =>{
    if (res.confirm) {
          this.doCancelOrder(id)
    }
      }
  })
  },

  // 执行取消订单
  doCancelOrder(id) {
  try {
    const orders = wx.getStorageSync('orders') || []
    const idx = orders.findIndex(o => o.id === id)
    if (idx >= 0) {
      orders[idx].status = 'cancelled'
      orders[idx].statusText = '已取消'
      orders[idx].statusClass = 'cancelled'
      orders[idx].actions = { rebuy: true }
      wx.setStorageSync('orders', orders)
      app.updateOrderCounts?.()
    }
  } catch (e) {
    console.warn('取消订单失败', e)
  }

  wx.showToast({
      title: '订单已取消',
      icon: 'success',
      duration: 1500
  })

  // 重新加载订单列表
  setTimeout(() =>{
      this.loadOrderList()
  }, 500)
  },

  // 去支付
  onPayOrder(e) {
  const id = e.currentTarget.dataset.id

  wx.showToast({
      title: '即将上线，敬请期待',
      icon: 'none',
      duration: 1500
  })
  },

  // 确认收货
  onConfirmOrder(e) {
  const id = e.currentTarget.dataset.id

  wx.showModal({
      title: '确认收货',
      content: '确认已收到商品？',
      confirmText: '确认',
      confirmColor: "#2D8C7A",
      cancelText: '再等等',
      success: (res) =>{
    if (res.confirm) {
          try {
      const orders = wx.getStorageSync('orders') || []
      const idx = orders.findIndex(o => o.id === id)
      if (idx >= 0) {
        orders[idx].status = 'completed'
        orders[idx].statusText = '已完成'
        orders[idx].statusClass = 'completed'
        orders[idx].actions = { rebuy: true }
        wx.setStorageSync('orders', orders)
        app.updateOrderCounts?.()
      }
          } catch (e) {
      console.warn('确认收货失败', e)
          }

          wx.showToast({
      title: '确认收货成功',
      icon: 'success',
      duration: 1500
          })

          // 重新加载订单列表
          setTimeout(() =>{
      this.loadOrderList()
          }, 500)
    }
      }
  })
  },

  // 去评价
  onReviewOrder(e) {
  const id = e.currentTarget.dataset.id

  wx.showToast({
      title: '即将上线，敬请期待',
      icon: 'none',
      duration: 1500
  })
  },

  // 申请售后
  onAfterSale(e) {
  const id = e.currentTarget.dataset.id

  wx.showToast({
      title: '即将上线，敬请期待',
      icon: 'none',
      duration: 1500
  })
  },

  // 再次购买
  onReBuy(e) {
  const id = e.currentTarget.dataset.id

  try {
    const orders = wx.getStorageSync('orders') || []
    const order = orders.find(o => o.id === id)
    const goodsList = order ? (order.goods || order.items || []) : []
    if (goodsList.length > 0) {
      let cartItems = wx.getStorageSync('cartItems') || []
      goodsList.forEach(goods => {
        const existIdx = cartItems.findIndex(c => c.productId === (goods.productId || goods.id))
        const qty = goods.count || goods.quantity || 1
        if (existIdx >= 0) {
          cartItems[existIdx].quantity += qty
        } else {
          cartItems.push({
            id: 'cart_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
            productId: goods.productId || goods.id,
            name: goods.name,
            image: goods.image,
            price: goods.price,
            quantity: qty,
            stock: goods.stock || 99,
            specsText: goods.spec || goods.specsText || '',
            selected: true
          })
        }
      })
      wx.setStorageSync('cartItems', cartItems)
      // 同步全局购物车数量
      const totalCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
      app.globalData.cartCount = totalCount
    }
  } catch (e) {
    console.warn('再次购买失败', e)
  }

  wx.showToast({ title: '已加入购物车', icon: 'success', duration: 1500 })
  },

  // 去逛逛
  onGoShopping() {
  wx.switchTab({
      url: '/pages/index/index'
  })
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
