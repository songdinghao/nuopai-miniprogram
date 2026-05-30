// pages/scene/scene.js - 场景搭配页面（针对30 - 60岁主妇优化）
const app = getApp()
const storeConfig = require('../../config/store-config.js')

Page({
  data: {
  // 当前场景
  currentScene: 'all',
  sceneName: '全部场景',

  // 场景列表
  scenes: [
      { id: 'all', name: '全部场景', icon: 'all', desc: '浏览所有场景搭配', image: '/assets/scenes/all.jpg' },
      { id: 'xuanguan', name: '玄关', icon: 'entrance', desc: '入户第一眼，大气端庄', image: '/assets/scenes/xuanguan.jpg' },
      { id: 'keting', name: '客厅', icon: 'living', desc: '家人团聚，温馨空间', image: '/assets/scenes/keting.jpg' },
      { id: 'canting', name: '餐厅', icon: 'dining', desc: '美食相伴，好景常在', image: '/assets/scenes/canting.jpg' },
      { id: 'woshi', name: '卧室', icon: 'bedroom', desc: '温馨浪漫，好眠时光', image: '/assets/scenes/woshi.jpg' },
      { id: 'shufang', name: '书房', icon: 'study', desc: '书香花香，相得益彰', image: '/assets/scenes/shufang.jpg' },
      { id: 'songli', name: '送礼', icon: 'gift', desc: '精选好礼，用心呈现', image: '/assets/scenes/songli.jpg' }
  ],

  // 当前场景下的搭配商品
  combinations: [],

  // 购物车状态
  cartItems: [],

  // 页面状态
  loading: true,
  hasMore: true,
  page: 1,
  pageSize: 10,

  // 显示场景选择
  showSceneSelector: false,

  // 空状态
  emptyState: {
      show: false,
      icon: 'scene',
      title: '暂无场景搭配',
      desc: '我们正在为您准备更多精彩搭配'
  },

  // 字体大小
  fontSize: 'normal'
  },

  onLoad(options) {

  app.globalData.currentPage = 'scene'

  // 加载用户偏好
  this.loadUserPreferences()

  // 如果有传入场景ID，直接切换
  if (options.scene) {
      this.setData({ currentScene: options.scene })
  }

  this.initPageData()
  },

  onHide() {
    if (this.data.loading) {
      this.setData({ loading: false })
    }
  },

  onUnload() {
    if (this.data.loading) {
      this.setData({ loading: false })
    }
  },

  onShow() {

  // 更新购物车数量
  this.updateCartCount()
  },

  goBack() {
  wx.navigateBack()
  },

  onShareAppMessage() {
  return {
      title: '诺派永生花商城 - 场景搭配',
      path: '/pages/scene/scene'
  }
  },

  // 加载用户偏好
  loadUserPreferences() {
  const preferences = app.globalData.userPreferences || {}
  const fontSize = preferences.fontSize || 'normal'

  this.setData({ fontSize })

  // 应用字体大小
  this.applyFontSize(fontSize)
  },

  // 应用字体大小
  applyFontSize(fontSize) {
  },

  initPageData() {
  this.setData({ loading: true })

  setTimeout(() =>{
      this.loadSceneCombinations()
      this.setData({ loading: false })
  }, 500)
  },

  // 加载场景搭配
  loadSceneCombinations() {
  const currentScene = this.data.currentScene
  let sceneData = []

  if (currentScene ==='all') {
      // 全部场景，精选搭配
      sceneData = this.generateAllSceneCombinations()
  } else {
      // 特定场景的搭配
      sceneData = this.generateSceneCombinations(currentScene)
  }

  this.setData({
      combinations: sceneData,
      sceneName: this.data.scenes.find(s =>s.id ===currentScene)?.name || '全部场景'
  })

  // 检查是否为空
  if (sceneData.length ===0) {
      this.setData({ 'emptyState.show': true })
  } else {
      this.setData({ 'emptyState.show': false })
  }
  },

  // 生成全部场景的精选搭配
  generateAllSceneCombinations() {
  return [
      {
    id: 'combo - 1',
    title: '玄关端景台经典搭配',
    description: '入门第一眼，大气美观，让客人印象深刻',
    scene: 'xuanguan',
    sceneName: '玄关',
    image: '/assets/products/product1.jpg',
    products: [
          { id: '100001', name: '玫瑰永生花摆件', price: 268, image: '/assets/products/product1.jpg' },
          { id: '100002', name: '绣球装饰花', price: 298, image: '/assets/products/product2.jpg' }
    ],
    totalPrice: 566,
    saveText: '比单买省50元',
    tags: ['热门搭配', '玄关必备'],
    matchScore: 95
      },
      {
    id: 'combo - 2',
    title: '客厅茶几温馨套装',
    description: '三件套组合，完美搭配，让客厅更有品味',
    scene: 'keting',
    sceneName: '客厅',
    image: '/assets/products/product3.jpg',
    products: [
          { id: '100003', name: '牡丹花艺套装', price: 328, image: '/assets/products/product3.jpg' },
          { id: '100004', name: '卧室百合装饰', price: 248, image: '/assets/products/product4.jpg' }
    ],
    totalPrice: 576,
    saveText: '组合特惠',
    tags: ['经典搭配', '家庭首选'],
    matchScore: 92
      },
      {
    id: 'combo - 3',
    title: '餐厅餐桌花饰组合',
    description: '美食配美花，用餐好心情，让每一餐都是享受',
    scene: 'canting',
    sceneName: '餐厅',
    image: '/assets/products/product7.jpg',
    products: [
          { id: '100007', name: '餐厅花艺套装', price: 388, image: '/assets/products/product7.jpg' }
    ],
    totalPrice: 388,
    saveText: '热销款',
    tags: ['餐厅专用', '精美装饰'],
    matchScore: 90
      }
  ]
  },

  // 生成特定场景的搭配
  generateSceneCombinations(sceneId) {
  // 这里可以根据场景ID返回不同的搭配
  const allCombinations = this.generateAllSceneCombinations()
  const filtered = allCombinations.filter(c =>c.scene ===sceneId)

  return filtered.length > 0 ? filtered : allCombinations
  },

  // 更新购物车数量
  updateCartCount() {
  const cartItems = wx.getStorageSync('cartItems') || []
  this.setData({ cartItems })
  },

  // 切换场景
  onSceneTap(e) {
  const sceneId = e.currentTarget.dataset.id
  const sceneName = e.currentTarget.dataset.name

  this.setData({
      currentScene: sceneId,
      sceneName: sceneName,
      showSceneSelector: false
  })

  // 重新加载场景搭配
  this.loadSceneCombinations()
  },

  // 显示场景选择器
  toggleSceneSelector() {
  this.setData({ showSceneSelector: !this.data.showSceneSelector })
  },

  // 空状态点击（防止事件冒泡）
  emptyTap() {},

  // 查看搭配详情
  onCombinationTap(e) {
  const combination = e.currentTarget.dataset.combination

  // 这里可以跳转到搭配详情页
  wx.showToast({
      title: '查看搭配详情',
      icon: 'none'
  })
  },

  // 一键加购
  onAddToCartTap(e) {
  const combination = e.currentTarget.dataset.combination

  // 添加到购物车
  let cartItems = wx.getStorageSync('cartItems') || []

  combination.products.forEach(product =>{
      const existingIndex = cartItems.findIndex(item =>item.id ===product.id)
      if (existingIndex >=0) {
    cartItems[existingIndex].quantity +=1
      } else {
    cartItems.push({
          ...product,
          quantity: 1,
          selected: true
    })
      }
  })

  wx.setStorageSync('cartItems', cartItems)
  this.setData({ cartItems })

  // 显示成功提示
  wx.showToast({
      title: '已加入购物车',
      icon: 'success',
      duration: 1500
  })

  // 更新购物车角标
  if (app.updateTabBarBadge) {
      app.updateTabBarBadge()
  }
  },

  // 查看商品详情
  onProductTap(e) {
  const product = e.currentTarget.dataset.product

  wx.navigateTo({
      url: `/pages/product/detail?id=${product.id}`
  })
  },

  // 加载更多
  onLoadMore() {
  if (!this.data.hasMore) {
      return
  }

  this.setData({ loading: true })

  setTimeout(() =>{
      // 这里可以添加更多数据
      this.setData({
    loading: false,
    hasMore: false
      })
  }, 500)
  },

  // 切换显示场景详情
  toggleSceneDetail(e) {
  const index = e.currentTarget.dataset.index
  const combinations = [...this.data.combinations]
  combinations[index].expanded = !combinations[index].expanded
  this.setData({ combinations })
  },

  // 字体大小变化回调
  onFontSizeChange(fontSize) {
  this.setData({ fontSize })
  }
})
