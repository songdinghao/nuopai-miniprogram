// pages/order/checkout.js - 订单结算页面逻辑
const app = getApp()
const storeConfig = require('../../config/store-config.js')
const groupBuy = require('../../utils/group-buy.js')
const couponManager = require('../../utils/coupon-manager.js')
const pointsManager = require('../../utils/points-manager.js')
const analytics = require('../../utils/analytics.js')

Page({
  data: {
  // 页面状态
  loading: true,
  loadError: false,

  // 订单来源: 'direct_buy' | 'cart'
  orderSource: 'cart',

  // 拼团相关
  groupBuyId: '',
  groupBuyInfo: null,
  isGroupBuyOrder: false,

  // 订单数据
  orderItems: [],
  selectedAddress: null,
  selectedCoupon: null,
  availableCoupons: [],
  remark: '',

  // 价格数据
  goodsPrice: '0.00',
  shippingFee: '0.00',
  couponDiscount: '0.00',
  totalPrice: '0.00',

  // 积分抵扣
  pointsBalance: 0,       // 可用积分
  pointsDeductAmount: 0,  // 积分抵扣金额
  usePoints: true,        // 是否使用积分
  maxPointsDeduct: 0,     // 最大可抵扣金额

  // 满减优惠
  fullReductionDiscount: 0,
  fullReductionLabel: '',
  nextThreshold: 0,
  nextDiscount: 0,

  // 用户偏好
  fontSize: 'normal',

  // 支付相关
  showPayModal: false,
  payMethod: 'wechat',

  // 防重复提交
  isSubmitting: false,

  // 登录状态（游客模式）
  needLogin: false
  },

  // 页面加载
  onLoad(options) {

  app.globalData.currentPage = 'checkout'

  // 记录订单来源
  const orderSource = options.from ==='direct_buy' ? 'direct_buy' : 'cart'

  // 检查是否为拼团订单
  const groupBuyId = options.groupBuyId || ''

  this.setData({ 
      orderSource,
      groupBuyId: groupBuyId
  })

  // 追踪页面访问
  app.trackEvent('page_view', { 
      page: 'checkout',
      from: orderSource,
      groupBuyId: groupBuyId || ''
  })

  // 加载用户偏好
  this.loadUserPreferences()

  // 加载订单数据
  this.loadOrderData()
  },

  // 页面显示（从地址选择页返回时刷新地址）
  onShow() {
    this.refreshSelectedAddress()
  },

  // 刷新选中的收货地址
  refreshSelectedAddress() {
    const addresses = wx.getStorageSync('addressList') || []
    const selectedId = this.data.selectedAddress?.id
    // 优先使用用户之前选中的地址，其次使用默认地址
    const address = addresses.find(a => a.id === selectedId) ||
                    addresses.find(a => a.isDefault) ||
                    addresses[0] || null
    this.setData({ selectedAddress: address })
  },

  // 加载用户偏好
  loadUserPreferences() {
  const preferences = app.globalData.userPreferences || {}
  const fontSize = preferences.fontSize || 'normal'

  this.setData({ fontSize })
  },

  // 加载订单数据
  loadOrderData() {
  this.setData({ loading: true })

  try {
      // 根据订单来源读取对应的临时订单 key
      const orderSource = this.data.orderSource
      const tempOrderKey = orderSource ==='direct_buy' ? 'tempOrder_direct' : 'tempOrder_cart'
      const tempOrder = wx.getStorageSync(tempOrderKey)

      if (!tempOrder || !tempOrder.items || tempOrder.items.length ===0) {
    wx.showToast({
          title: '订单数据异常',
          icon: 'none',
          duration: 2000
    })

    setTimeout(() =>{
          wx.navigateBack()
    }, 1500)

    return
      }

      // 加载默认地址
      const addresses = wx.getStorageSync('addressList') || []
      const defaultAddress = addresses.find(addr =>addr.isDefault) || addresses[0]

      // 加载可用优惠券（使用coupon - manager）
      const allUnused = couponManager.getCoupons('unused')
      const goodsPriceNum = tempOrder.items.reduce((sum, item) =>sum + (item.price * item.quantity), 0)
      const availableCoupons = []
      allUnused.forEach(c =>{
    const check = couponManager.canUseCoupon(c, goodsPriceNum)
    if (check.available) {
          availableCoupons.push(c)
    }
      })

      // 推荐最优优惠券
      const best = couponManager.getBestCoupon(goodsPriceNum, allUnused)
      let selectedCoupon = null
      if (best) {
    selectedCoupon = {
          id: best.coupon.id,
          name: best.coupon.name,
          value: best.discount,
          condition: best.coupon.condition,
          conditionText: best.coupon.conditionText,
          couponData: best.coupon
    }
      }

      // 检查是否为拼团订单
      const isGroupBuyOrder = tempOrder.isGroupBuy ===true
      const groupBuyId = this.data.groupBuyId || tempOrder.groupId || ''
      let groupBuyInfo = null

      if (isGroupBuyOrder && groupBuyId) {
    // 加载拼团信息
    const groups = groupBuy.loadGroups()
    groupBuyInfo = groups.find(g =>g.id ===groupBuyId)
      }

      // 为每个商品预计算规格文本（WXML不支持带参函数调用）
      const orderItems = tempOrder.items.map(item => ({
        ...item,
        specsText: item.specsText || this.getSpecsText(item.attrs)
      }))

      // 计算价格 - 拼团使用拼团价
      const shippingFee = goodsPriceNum >=99 ? 0 : 8 // 满99包邮

      // 加载积分余额
      const pointsBalance = pointsManager.getPoints()

      this.setData({
    orderItems: orderItems,
    selectedAddress: defaultAddress || null,
    availableCoupons,
    selectedCoupon,
    goodsPrice: goodsPriceNum.toFixed(2),
    shippingFee: shippingFee.toFixed(2),
    isGroupBuyOrder,
    groupBuyId,
    groupBuyInfo,
    pointsBalance,
    loading: false,
    loadError: false
      })

      // 计算总价
      this.calculateTotalPrice()

  } catch (error) {
      console.error('加载订单数据失败', error)

      this.setData({ loading: false, loadError: true })
  }
  },

  getSpecsText(attrs) {
  if (!attrs) return ''

  const vaseTypeMap = {
    'ceramic': '陶瓷花器',
    'glass': '玻璃花器',
    'wood': '木质花器',
    'metal': '金属花器'
  }
  const flowerMatchMap = {
    'simple': '简约搭配',
    'rich': '丰富搭配',
    'luxury': '奢华搭配'
  }
  const packagingMap = {
    'standard': '标准包装',
    'gift': '礼品包装',
    'premium': '豪华包装'
  }

  const parts = []
  if (attrs.vaseType) parts.push(vaseTypeMap[attrs.vaseType] || attrs.vaseType)
  if (attrs.flowerMatch) parts.push(flowerMatchMap[attrs.flowerMatch] || attrs.flowerMatch)
  if (attrs.packaging) parts.push(packagingMap[attrs.packaging] || attrs.packaging)

  return parts.join(' · ') || '默认规格'
  },

  // 计算总价
  calculateTotalPrice() {
  const goodsPrice = parseFloat(this.data.goodsPrice) || 0
  const shippingFee = parseFloat(this.data.shippingFee) || 0

  // 使用coupon - manager计算实际折扣
  let couponDiscount = 0
  if (this.data.selectedCoupon && this.data.selectedCoupon.couponData) {
      couponDiscount = couponManager.calculateDiscount(this.data.selectedCoupon.couponData, goodsPrice)
  } else if (this.data.selectedCoupon) {
      couponDiscount = this.data.selectedCoupon.value || 0
  }

  // 满减计算：原价 → 优惠券 → 满减 → 积分抵扣 → 实付
  const afterCoupon = goodsPrice - couponDiscount
  let fullReductionDiscount = 0
  let fullReductionLabel = ''
  let nextThreshold = 0
  let nextDiscount = 0

  const fullReductionList = (storeConfig.marketing && storeConfig.marketing.promotions && storeConfig.marketing.promotions.fullReduction) || []
  if (fullReductionList.length > 0) {
      // 按门槛从高到低排序，找到满足条件的最大优惠
      const sorted = [...fullReductionList].sort((a, b) => b.threshold - a.threshold)
      for (const rule of sorted) {
        if (afterCoupon >= rule.threshold) {
          fullReductionDiscount = rule.discount
          fullReductionLabel = rule.label
          break
        }
      }

      // 计算下一档满减
      const sortedAsc = [...fullReductionList].sort((a, b) => a.threshold - b.threshold)
      for (const rule of sortedAsc) {
        if (afterCoupon < rule.threshold) {
          nextThreshold = Math.round((rule.threshold - afterCoupon) * 100) / 100
          nextDiscount = rule.discount
          break
        }
      }
  }

  // 积分抵扣计算：原价 → 优惠券 → 满减 → 积分抵扣 → 实付
  const afterReduction = goodsPrice + shippingFee - couponDiscount - fullReductionDiscount
  let pointsDeductAmount = 0
  let maxPointsDeduct = 0

  if (this.data.usePoints && this.data.pointsBalance > 0) {
      // 调用 points-manager 的 calculateDeductible，传入优惠后金额
      const result = pointsManager.calculateDeductible(0.2, afterReduction)
      maxPointsDeduct = result.deductAmount
      // 积分抵扣不能使实付低于 0.01 元
      pointsDeductAmount = Math.min(maxPointsDeduct, Math.max(0, afterReduction - 0.01))
      pointsDeductAmount = Math.round(pointsDeductAmount * 100) / 100
  }

  const totalPrice = Math.max(0.01, afterReduction - pointsDeductAmount)

  this.setData({
      couponDiscount: couponDiscount.toFixed(2),
      fullReductionDiscount: fullReductionDiscount,
      fullReductionLabel: fullReductionLabel,
      nextThreshold: nextThreshold,
      nextDiscount: nextDiscount,
      pointsDeductAmount: pointsDeductAmount,
      maxPointsDeduct: maxPointsDeduct,
      totalPrice: (afterReduction - pointsDeductAmount <= 0 ? 0.01 : totalPrice).toFixed(2)
  })
  },

  // 选择收货地址
  onSelectAddress() {
  wx.navigateTo({
      url: '/pages/user/address/address?from=checkout'
  })

  // 追踪事件
  app.trackEvent('checkout_select_address')
  },

  // 选择优惠券
  onSelectCoupon() {
  if (this.data.availableCoupons.length ===0) {
      wx.showToast({
    title: '暂无可用优惠券',
    icon: 'none',
    duration: 2000
      })
      return
  }

  // 显示优惠券选择弹窗
  const available = this.data.availableCoupons
  const goodsPrice = parseFloat(this.data.goodsPrice) || 0

  const items = available.map(c =>{
      const discount = couponManager.calculateDiscount(c, goodsPrice)
      return `${c.name} (-¥${discount.toFixed(1)})`
  }).concat(['不使用优惠券'])

  // 标记当前选中的优惠券
  const currentId = this.data.selectedCoupon?.id

  wx.showActionSheet({
      itemList: items,
      success: (res) =>{
    if (res.tapIndex ===available.length) {
          // 不使用优惠券
          this.setData({ selectedCoupon: null })
    } else {
          // 选择优惠券
          const selected = available[res.tapIndex]
          const discount = couponManager.calculateDiscount(selected, goodsPrice)
          this.setData({
      selectedCoupon: {
              id: selected.id,
              name: selected.name,
              value: discount,
              condition: selected.condition,
              conditionText: selected.conditionText,
              couponData: selected
      }
          })
    }

    this.calculateTotalPrice()
      }
  })

  // 追踪事件
  app.trackEvent('checkout_select_coupon')
  },

  // 切换积分抵扣开关
  onTogglePoints(e) {
  const usePoints = e.detail.value
  this.setData({ usePoints })
  this.calculateTotalPrice()

  app.trackEvent('checkout_toggle_points', { use: usePoints })
  },

  // 订单备注输入
  onRemarkInput(e) {
  this.setData({ remark: e.detail.value })
  },

  // 提交订单
  onSubmitOrder() {
  // 游客模式：检查登录状态，未登录则跳转登录页
  if (!app.globalData.isLogin) {
      wx.showToast({
    title: '请先登录再结算',
    icon: 'none',
    duration: 1500
      })
      setTimeout(() =>{
    wx.navigateTo({
          url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/order/checkout')
    })
      }, 1500)
      return
  }

  // 验证收货地址
  if (!this.data.selectedAddress) {
      wx.showToast({
    title: '请选择收货地址',
    icon: 'none',
    duration: 2000
      })
      return
  }

  // 检查库存
  const outOfStockItems = this.data.orderItems.filter(item => item.stock !== undefined && item.stock <= 0)
  if (outOfStockItems.length > 0) {
      wx.showToast({
    title: '部分商品已售罄，请返回修改',
    icon: 'none',
    duration: 2000
      })
      return
  }

  // 显示支付弹窗
  this.setData({ showPayModal: true })

  // 追踪事件
  app.trackEvent('checkout_submit', {
      total_price: this.data.totalPrice
  })
  },

  // 隐藏支付弹窗
  onHidePayModal() {
  this.setData({ showPayModal: false })
  },

  // 选择支付方式
  onSelectPayMethod(e) {
  const method = e.currentTarget.dataset.method
  this.setData({ payMethod: method })
  },

  // 支付
  onPay() {
  // 防重复提交
  if (this.data.isSubmitting) return
  this.setData({ isSubmitting: true })

  this.setData({ showPayModal: false })

  wx.showLoading({
      title: '创建订单中...',
      mask: true
  })

  // TODO: Replace with real API - 创建订单
  setTimeout(() =>{
      // 创建订单数据
      const orderId = 'ORD' + Date.now() + Math.random().toString(36).slice(2, 8)
      const orderData = {
    id: orderId,
    orderNo: orderId,
    items: this.data.orderItems,
    goods: this.data.orderItems.map(item => ({
      id: item.id || item.productId,
      productId: item.productId,
      name: item.name,
      image: item.image,
      spec: item.specsText || '',
      price: item.price,
      count: item.quantity || 1
    })),
    address: this.data.selectedAddress,
    coupon: this.data.selectedCoupon,
    remark: this.data.remark,
    goodsPrice: this.data.goodsPrice,
    shippingFee: this.data.shippingFee,
    freightPrice: this.data.shippingFee,
    couponDiscount: this.data.couponDiscount,
    couponPrice: this.data.couponDiscount,
    fullReductionDiscount: this.data.fullReductionDiscount,
    fullReductionLabel: this.data.fullReductionLabel,
    pointsDeductAmount: this.data.pointsDeductAmount,
    usePoints: this.data.usePoints,
    totalPrice: this.data.totalPrice,
    totalCount: this.data.orderItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
    payMethod: this.data.payMethod,
    status: 'paid',
    statusText: '待发货',
    statusClass: 'paid',
    actions: { remind: true },
    createTime: new Date().toISOString(),
    isGroupBuy: this.data.isGroupBuyOrder,
    groupBuyId: this.data.groupBuyId,
    groupBuyInfo: this.data.groupBuyInfo ? {
          id: this.data.groupBuyInfo.id,
          typeId: this.data.groupBuyInfo.typeId,
          productId: this.data.groupBuyInfo.productId,
          groupPrice: this.data.groupBuyInfo.groupPrice,
          leaderPrice: this.data.groupBuyInfo.leaderPrice,
          members: this.data.groupBuyInfo.members
    } : null
      }

      // 扣减积分（降级处理：失败不影响下单）
      // TODO 上线后积分扣减应在服务端完成
      if (this.data.usePoints && this.data.pointsDeductAmount > 0) {
        try {
          const pointsToDeduct = this.data.pointsDeductAmount * 100 // 1元=100积分
          const deductResult = pointsManager.redeemPoints(pointsToDeduct, '积分抵扣现金', orderId)
          if (!deductResult.success) {
            console.warn('[checkout] 积分扣减失败（不影响下单）:', deductResult.message)
          }
        } catch (e) {
          console.warn('[checkout] 积分扣减异常（不影响下单）:', e)
        }
      }

      // 保存订单到本地（持久化存储）
      try {
    const orders = wx.getStorageSync('orders') || []
    orders.unshift(orderData)
    wx.setStorageSync('orders', orders)
      } catch (e) {
    console.error('订单持久化失败: ', e)
      }

      // 清空购物车中已购买的商品
      const cartItems = wx.getStorageSync('cartItems') || []
      const remainingItems = cartItems.filter(item =>!item.selected)
      wx.setStorageSync('cartItems', remainingItems)

      // 更新全局购物车数量
      app.globalData.cartCount = remainingItems.reduce((sum, item) =>sum + (item.quantity || 1), 0)

      // 清空临时订单（根据来源清除对应的 key）
      const tempOrderKey = this.data.orderSource ==='direct_buy' ? 'tempOrder_direct' : 'tempOrder_cart'
      wx.removeStorageSync(tempOrderKey)

      // 恢复提交状态
      this.setData({ isSubmitting: false })

      wx.hideLoading()

      wx.showToast({
    title: '下单成功',
    icon: 'success',
    duration: 2000
      })

      // 追踪事件
      app.trackEvent('order_paid', {
    order_id: orderId,
    total_price: this.data.totalPrice
      })

      // 埋点：购买成功
      analytics.trackPurchase(orderId, this.data.totalPrice, this.data.orderItems)

      // 更新用户订单计数 & 检查优惠券发放条件
      try {
        const prevCount = wx.getStorageSync('user_order_count') || 0
        const newCount = prevCount + 1
        wx.setStorageSync('user_order_count', newCount)

        // 根据订单数量自动发放优惠券
        const couponResult = couponManager.checkAndDistributeCoupons()
        if (couponResult.firstOrder) {
          app.trackEvent('coupon_distributed', { type: 'first_order', amount: couponResult.firstOrder.value })
        }
        if (couponResult.repurchase) {
          app.trackEvent('coupon_distributed', { type: 'repurchase', amount: couponResult.repurchase.value })
        }
      } catch (e) {
        console.warn('[checkout] 更新订单计数/发放优惠券失败', e)
      }

      // 跳转到订单详情页
      setTimeout(() =>{
    wx.redirectTo({
          url: `/pages/order/detail?id=${orderId}`
    })
      }, 1500)

  }, 400)
  },

  onBack() {
  wx.navigateBack()
  },

  retryLoadOrderData() {
    this.loadOrderData()
  },

  // 字体大小变化回调
  onFontSizeChange(fontSize) {
  this.setData({ fontSize })
  }
})
