// pages/cart/cart.js - 购物车页面逻辑
const app = getApp()
const storeConfig = require('../../config/store-config.js')
const analytics = require('../../utils/analytics.js')

Page({
  data: {
  // 页面状态
  loading: true,
  loadError: false,

  // 购物车数据
  cartItems: [],
  isEditing: false,

  // 统计数据
  totalCount: 0,
  selectedCount: 0,
  totalPrice: '0.00',
  isAllSelected: false,

  // 凑单提示
  tipText: '',

  // 用户偏好
  fontSize: 'normal',

  // 弹窗状态
  showDeleteConfirm: false,

  // 游客模式
  isLogin: false
  },

  // 页面加载
  onLoad(options) {

  app.globalData.currentPage = 'cart'

  // 追踪页面访问
  app.trackEvent('page_view', { 
      page: 'cart'
  })

  // 加载用户偏好
  this.loadUserPreferences()

  // 加载购物车数据
  this.loadCartData()
  },

  // 页面显示
  onShow() {

  // 埋点：页面浏览
  analytics.trackPageView('cart')

  // 更新登录状态
  this.setData({ isLogin: app.globalData.isLogin })

  // 重新加载购物车数据
  this.loadCartData()

  // 更新购物车数量
  this.updateCartCount()
  },

  // 页面隐藏
  onHide() {
    if (this.data.loading) {
      this.setData({ loading: false })
    }
  },

  // 页面卸载
  onUnload() {
    if (this.data.loading) {
      this.setData({ loading: false })
    }
  },

  // 加载用户偏好
  loadUserPreferences() {
  const preferences = app.globalData.userPreferences || {}
  const fontSize = preferences.fontSize || 'normal'

  this.setData({ fontSize })
  },

  // 加载购物车数据
  loadCartData() {
  this.setData({ loading: true, loadError: false })

  try {
      // 从本地存储加载购物车数据
      const cartItems = wx.getStorageSync('cartItems') || []

      // 为每个商品添加库存信息、预处理规格文本和生成ID
      const itemsWithStock = cartItems.map((item, idx) =>({
    ...item,
    id: item.id || ('cart_' + Date.now() + '_' + idx),
    stock: item.stock || 99,
    selected: item.selected !== false, // 默认选中
    specsText: this.getSpecsText(item.attrs)
      }))

      this.setData({ 
    cartItems: itemsWithStock,
    loading: false,
    loadError: false
      })

      // 计算统计数据
      this.calculateStats()

  } catch (error) {
      console.error('加载购物车失败', error)

      this.setData({
    cartItems: [],
    loading: false,
    loadError: true
      })

      wx.showToast({
    title: '购物车加载失败，请稍后重试',
    icon: 'none',
    duration: 2000
      })
  }
  },

  // 重试加载购物车
  retryLoadCart() {
    this.loadCartData()
  },

  // 保存购物车数据
  saveCartData() {
  try {
      wx.setStorageSync('cartItems', this.data.cartItems)

      // 更新全局购物车数量
      this.updateCartCount()

  } catch (error) {
      console.error('保存购物车失败', error)
  }
  },

  // 更新购物车数量
  updateCartCount() {
  const totalCount = this.data.cartItems.reduce((sum, item) =>sum + (item.quantity || 1), 0)
  app.globalData.cartCount = totalCount

  this.setData({ totalCount })

  // 同步更新TabBar角标（购物车页面必须自己更新角标，不能依赖app.onShow）
  if (totalCount > 0) {
      wx.setTabBarBadge({
    index: 2,
    text: totalCount > 99 ? '99+' : String(totalCount)
      })
  } else {
      wx.removeTabBarBadge({ index: 2 })
  }
  },

  // 计算统计数据
  calculateStats() {
  const cartItems = this.data.cartItems

  // 计算选中商品数量
  const selectedCount = cartItems.filter(item =>item.selected).length

  // 计算选中商品总价
  const totalPrice = cartItems
      .filter(item =>item.selected)
      .reduce((sum, item) =>sum + (item.price * item.quantity), 0)

  // 检查是否全选
  const isAllSelected = cartItems.length > 0 && cartItems.every(item =>item.selected)

  this.setData({
      selectedCount,
      totalPrice: totalPrice.toFixed(2),
      isAllSelected
  })

  // 计算凑单提示
  this.calculateTip(totalPrice)
  },

  // 计算凑单提示（满减优先，其次包邮）
  calculateTip(selectedTotal) {
  let tipText = ''

  // 没有选中商品时不显示提示
  if (selectedTotal <= 0 || this.data.selectedCount === 0) {
      this.setData({ tipText: '' })
      return
  }

  // 读取包邮门槛
  const freeShippingTemplate = storeConfig.shippingTemplates.find(t => t.type === 'free')
  const freeShippingThreshold = freeShippingTemplate && freeShippingTemplate.conditions[0]
      ? freeShippingTemplate.conditions[0].minAmount : 99

  // 读取满减活动（按门槛从高到低排序）
  const fullReductions = (storeConfig.marketing && storeConfig.marketing.promotions
      && storeConfig.marketing.promotions.fullReduction) || []
  const sortedReductions = [...fullReductions].sort((a, b) => b.threshold - a.threshold)

  // 1. 优先检查满减提示
  // 找到当前已满足的最高满减
  let matchedReduction = null
  for (const fr of sortedReductions) {
      if (selectedTotal >= fr.threshold) {
      matchedReduction = fr
      break
      }
  }

  if (matchedReduction) {
      // 已满足某个满减档位，检查是否接近下一档
      const higherReduction = sortedReductions.find(fr => fr.threshold > matchedReduction.threshold)
      if (higherReduction) {
      const gap = higherReduction.threshold - selectedTotal
      if (gap > 0) {
          tipText = `再买¥${gap.toFixed(0)}可减¥${higherReduction.discount} 🏷️`
      }
      } else {
      // 已是最高档，显示已享受提示
      tipText = `已享${matchedReduction.label} ✅`
      }

      if (!tipText) {
      tipText = `已享${matchedReduction.label} ✅`
      }
  } else {
      // 未满足任何满减，找到最近的一档
      const nextReduction = [...sortedReductions].reverse().find(fr => selectedTotal < fr.threshold)
      if (nextReduction) {
      const gap = nextReduction.threshold - selectedTotal
      tipText = `再买¥${gap.toFixed(0)}可减¥${nextReduction.discount} 🏷️`
      }
  }

  // 2. 如果没有满减提示（理论上有满减配置就不会走到这），回退到包邮提示
  if (!tipText) {
      if (selectedTotal >= freeShippingThreshold) {
      tipText = '已享包邮 ✅'
      } else {
      const gap = freeShippingThreshold - selectedTotal
      tipText = `再买¥${gap.toFixed(0)}享包邮 📦`
      }
  }

  this.setData({ tipText })
  },

  // 获取规格文本 - 使用内联映射显示中文名称
  getSpecsText(attrs) {
  if (!attrs) return ''

  // SKU属性值 → 中文名称映射（与 detail.js generateSkuData 的 SKU 数据对应）
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

  // 切换编辑模式
  onToggleEdit() {
  this.setData({
      isEditing: !this.data.isEditing
  })

  // 追踪事件
  app.trackEvent('cart_edit_mode', { 
      mode: this.data.isEditing ? 'edit' : 'view'
  })
  },

  // 切换商品选中状态
  onToggleSelect(e) {
  const index = e.currentTarget.dataset.index
  const cartItems = [...this.data.cartItems]

  cartItems[index].selected = !cartItems[index].selected

  this.setData({ cartItems })
  this.calculateStats()
  this.saveCartData()

  // 追踪事件
  app.trackEvent('cart_toggle_select', { 
      index,
      selected: cartItems[index].selected
  })
  },

  // 全选/取消全选
  onToggleSelectAll() {
  const isAllSelected = !this.data.isAllSelected
  const cartItems = this.data.cartItems.map(item =>({
      ...item,
      selected: isAllSelected
  }))

  this.setData({ cartItems, isAllSelected })
  this.calculateStats()
  this.saveCartData()

  // 追踪事件
  app.trackEvent('cart_toggle_select_all', { 
      selected: isAllSelected
  })
  },

  // 增加商品数量
  onIncreaseQuantity(e) {
  const index = e.currentTarget.dataset.index
  const cartItems = [...this.data.cartItems]
  const item = cartItems[index]

  if (item.quantity >=item.stock) {
      wx.showToast({
    title: '库存不足',
    icon: 'none',
    duration: 2000
      })
      return
  }

  item.quantity +=1

  this.setData({ cartItems })
  this.calculateStats()
  this.saveCartData()

  // 追踪事件
  app.trackEvent('cart_quantity_change', { 
      index,
      action: 'increase',
      quantity: item.quantity
  })
  },

  // 减少商品数量
  onDecreaseQuantity(e) {
  const index = e.currentTarget.dataset.index
  const cartItems = [...this.data.cartItems]
  const item = cartItems[index]

  if (item.quantity <=1) {
      // 数量为1时，询问是否删除
      wx.showModal({
    title: '提示',
    content: '确定要删除这件商品吗？',
    success: (res) =>{
          if (res.confirm) {
      this.doDeleteItem(index)
          }
    }
      })
      return
  }

  item.quantity -=1

  this.setData({ cartItems })
  this.calculateStats()
  this.saveCartData()

  // 追踪事件
  app.trackEvent('cart_quantity_change', { 
      index,
      action: 'decrease',
      quantity: item.quantity
  })
  },

  // 输入商品数量
  onQuantityInput(e) {
  const index = e.currentTarget.dataset.index
  const inputValue = e.detail.value
  const cartItems = [...this.data.cartItems]
  const item = cartItems[index]

  // 校验数量：输入为空、0、负数时默认为1
  let quantity = parseInt(inputValue)
  let needsCorrection = false

  if (isNaN(quantity) || quantity < 1) {
      quantity = 1
      needsCorrection = true
  }
  if (quantity > item.stock) {
      quantity = item.stock
      needsCorrection = true
  }

  item.quantity = quantity

  this.setData({ cartItems })
  this.calculateStats()
  this.saveCartData()

  // 提示用户数量已自动修正
  if (needsCorrection) {
      wx.showToast({
    title: '数量已调整为有效值',
    icon: 'none',
    duration: 1500
      })
  }
  },

  // 删除商品
  onDeleteItem(e) {
  const index = e.currentTarget.dataset.index

  wx.showModal({
      title: '提示',
      content: '确定要删除这件商品吗？',
      success: (res) =>{
    if (res.confirm) {
          this.doDeleteItem(index)
    }
      }
  })
  },

  // 执行删除商品
  doDeleteItem(index) {
  const cartItems = [...this.data.cartItems]
  const deletedItem = cartItems.splice(index, 1)[0]

  this.setData({ cartItems })
  this.calculateStats()
  this.saveCartData()

  wx.showToast({
      title: '已删除',
      icon: 'success',
      duration: 1500
  })

  // 追踪事件
  app.trackEvent('cart_remove', { 
      product_id: deletedItem.productId,
      quantity: deletedItem.quantity
  })
  },

  // 显示删除确认弹窗
  onShowDeleteConfirm() {
  this.setData({ showDeleteConfirm: true })
  },

  // 隐藏删除确认弹窗
  onHideDeleteConfirm() {
  this.setData({ showDeleteConfirm: false })
  },

  // 确认删除选中商品
  onConfirmDelete() {
  const cartItems = this.data.cartItems.filter(item =>!item.selected)
  const deletedCount = this.data.cartItems.length - cartItems.length

  this.setData({ 
      cartItems,
      showDeleteConfirm: false,
      isEditing: false
  })
  this.calculateStats()
  this.saveCartData()

  wx.showToast({
      title: `已删除${deletedCount}件商品`,
      icon: 'success',
      duration: 1500
  })

  // 追踪事件
  app.trackEvent('cart_batch_delete', { 
      count: deletedCount
  })
  },

  // 结算/删除选中
  onCheckout() {
  if (this.data.isEditing) {
      // 编辑模式：删除选中
      if (this.data.selectedCount ===0) {
    wx.showToast({
          title: '请选择要删除的商品',
          icon: 'none',
          duration: 2000
    })
    return
      }

      this.onShowDeleteConfirm()

  } else {
      // 非编辑模式：去结算
      if (this.data.selectedCount ===0) {
    wx.showToast({
          title: '请选择要结算的商品',
          icon: 'none',
          duration: 2000
    })
    return
      }

      // 保存选中商品到临时订单（购物车结算专用 key）
      const selectedItems = this.data.cartItems.filter(item =>item.selected)
      wx.setStorageSync('tempOrder_cart', {
    items: selectedItems,
    totalPrice: this.data.totalPrice,
    createTime: Date.now()
      })

      // 游客模式：检查登录状态，未登录则跳转登录页
      if (!app.globalData.isLogin) {
    wx.showToast({
          title: '请先登录再结算',
          icon: 'none',
          duration: 1500
    })
    setTimeout(() =>{
          wx.navigateTo({
      url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/order/checkout') + '&mergeCart=true'
          })
    }, 1500)
    return
      }

      // 跳转到结算页面
      wx.navigateTo({
    url: '/pages/order/checkout'
      })

      // 追踪事件
      app.trackEvent('cart_checkout', { 
    product_count: selectedItems.length,
    total_price: this.data.totalPrice
      })
  }
  },

  // 点击商品查看详情
  onProductTap(e) {
  const index = e.currentTarget.dataset.index
  const item = this.data.cartItems[index]

  wx.navigateTo({
      url: `/pages/product/detail?id=${item.productId}`
  })

  // 追踪事件
  app.trackEvent('cart_view_product', { 
      product_id: item.productId
  })
  },

  onBackToHome() {
  wx.switchTab({
      url: '/pages/index/index'
  })
  },

  // 跳转登录页（游客模式）
  onLoginTap() {
  wx.navigateTo({
      url: '/pages/login/login'
  })

  // 追踪事件
  app.trackEvent('guest_to_login', {
      from_page: 'cart'
  })
  },

  // 分享
  onShareAppMessage() {
  const count = this.data.cartItems.length
  return {
      title: count > 0 ? `我选了${count}件精美永生花，快来看看吧` : '诺派永生花商城 - 精美家居装饰',
      path: '/pages/index/index',
      imageUrl: '/assets/share/homepage-share.jpg'
  }
  },

  // 分享到朋友圈
  onShareTimeline() {
  return {
      title: '诺派永生花商城 - 精美家居装饰，让家更温馨',
      query: '',
      imageUrl: '/assets/share/timeline-share.jpg'
  }
  },

  // 字体大小变化回调
  onFontSizeChange(fontSize) {
  this.setData({ fontSize })
  }
})
