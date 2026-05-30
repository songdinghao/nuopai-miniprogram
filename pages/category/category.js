// pages/category/category.js - 分类页面（针对30 - 60岁主妇优化）
const app = getApp()
const storeConfig = require('../../config/store-config.js')
const api = require('../../utils/api.js')
const productsData = require('../../data/products.js')

Page({
  data: {
  // 页面状态
  loading: true,
  refreshing: false,
  hasMore: true,
  loadingMore: false,
  loadError: false,
  loadMoreFailed: false,
  hasActiveFilters: false,

  // 分页参数
  page: 1,
  pageSize: 10,
  total: 0,

  // 分类信息
  categoryId: '',
  categoryName: '',
  categoryInfo: null,
  subCategories: [],

  // 筛选条件
  filters: {
      // 价格区间
      priceRange: '',
      currentPriceRangeName: '', // WXML预计算（不支持箭头函数）
      priceRanges: storeConfig.priceRanges,

      // 花材类型
      flowerType: '',
      currentFlowerTypeName: '', // WXML预计算
      flowerTypes: storeConfig.flowerTypes,

      // 颜色
      color: '',
      colors: storeConfig.colors,

      // 风格
      style: '',
      styles: storeConfig.styles,

      // 场景
      scene: '',
      scenes: storeConfig.categories.map(cat =>({ id: cat.id, name: cat.name })),

  // 排序方式
  sort: 'default',
  currentSortName: '默认排序', // 预计算排序名称（WXML不支持箭头函数）
  sortOptions: [
    { id: 'default', name: '默认排序', icon: 'sort' },
    { id: 'sales_desc', name: '销量最高', icon: 'fire' },
    { id: 'price_asc', name: '价格最低', icon: 'price - down' },
    { id: 'price_desc', name: '价格最高', icon: 'price - up' },
    { id: 'newest', name: '最新上架', icon: 'time' }
      ]
  },

  // 商品列表
  products: [],

  // 筛选面板状态
  filterPanelVisible: false,
  currentFilterTab: 'price', // price, flower, color, style, scene

  // 用户偏好
  fontSize: 'normal',

  // 搜索相关
  searchKeyword: '',
  showSearchInput: false,

  // 购物车角标（本地 reactivable 字段）
  cartCount: 0,

  // 排序面板状态
  sortPanelVisible: false,
  currentSortTab: 'default',

  // 分类列表（WXML 无法直接访问 JS 模块变量，需存入 data）
  storeConfigCategories: [],

  // 用户信息（用于分享邀请参数）
  userInfo: null
  },

  // 页面加载
  onLoad(options) {

  app.globalData.currentPage = 'category'

  // 追踪页面访问
  app.trackEvent('page_view', { 
      page: 'category',
      category_id: options.id || 'all',
      category_name: options.name || '全部'
  })

  const categoryId = options.id || ''
  const categoryName = decodeURIComponent(options.name || '全部商品')

  this.setData({
      categoryId,
      categoryName,
      storeConfigCategories: storeConfig.categories,
      userInfo: app.globalData.userInfo || null
  })

  // 加载分类信息
  this.loadCategoryInfo(categoryId)

  // 加载用户偏好
  this.loadUserPreferences()

  this.updateCurrentSortName()

  // 加载商品列表
  this.loadProducts()
  },

  // 更新当前排序名称（预计算，WXML 不支持箭头函数）
  updateCurrentSortName() {
  const filters = this.data.filters
  const option = filters.sortOptions.find(item =>item.id ===filters.sort)
  this.setData({
      'filters.currentSortName': option ? option.name : '排序'
  })
  this.updateFilterBadgeNames()
  },

  // 更新筛选条件徽标名称（预计算，WXML 不支持箭头函数）
  updateFilterBadgeNames() {
  const filters = this.data.filters
  const priceRange = filters.priceRanges.find(item => item.id === filters.priceRange)
  const flowerType = filters.flowerTypes.find(item => item.id === filters.flowerType)
  this.setData({
      'filters.currentPriceRangeName': priceRange ? priceRange.name : '',
      'filters.currentFlowerTypeName': flowerType ? flowerType.name : ''
  })
  },

  // 页面显示
  onShow() {

  // 更新购物车数量
  this.updateCartCount()

  // 同步用户信息（登录/退出后返回此页时更新）
  this.setData({ userInfo: app.globalData.userInfo || null })

  // 检查筛选条件变化
  this.checkFilterChanges()
  },

  // 页面初次渲染完成
  onReady() {
  },

  // 页面隐藏
  onHide() {
  },

  // 页面卸载
  onUnload() {
  },

  // 下拉刷新
  onPullDownRefresh() {

  this.setData({ refreshing: true })

  // 重新加载数据
  this.refreshData()
  },

  // 上拉加载更多
  onReachBottom() {

  // 加载更多商品
  this.loadMoreProducts()
  },

  // 分享
  onShareAppMessage() {

  const shareInfo = {
      title: `${this.data.categoryName} - 诺派永生花商城`,
      path: `/pages/category/category?id=${this.data.categoryId}&name=${encodeURIComponent(this.data.categoryName)}`,
      imageUrl: '/assets/share/category-share.jpg'
  }

  if (this.data.userInfo?.id) {
      shareInfo.path +=`&inviter=${this.data.userInfo.id}`
  }

  // 追踪分享事件
  app.trackEvent('share', { 
      page: 'category', 
      category_id: this.data.categoryId,
      category_name: this.data.categoryName
  })

  return shareInfo
  },

  // 分享到朋友圈
  onShareTimeline() {

  // 追踪朋友圈分享
  app.trackEvent('share_timeline', { 
      page: 'category',
      category_id: this.data.categoryId
  })

  return {
      title: `发现${this.data.categoryName}，超多精美永生花！`,
      query: `id=${this.data.categoryId}&name=${encodeURIComponent(this.data.categoryName)}`,
      imageUrl: '/assets/share/timeline-category.jpg'
  }
  },

  // 加载分类信息
  loadCategoryInfo(categoryId) {
  if (!categoryId) {
      // 全部商品
      this.setData({
    categoryInfo: {
          id: '',
          name: '全部商品',
          description: '所有永生花商品',
          icon: '/assets/icons/category-all.png'
    },
    subCategories: storeConfig.categories
      })
      return
  }

  // 查找指定分类
  const category = storeConfig.categories.find(cat =>cat.id ===categoryId)
  if (category) {
      this.setData({
    categoryInfo: category,
    subCategories: category.subCategories || []
      })
  } else {
      // 分类不存在，使用默认
      this.setData({
    categoryInfo: {
          id: categoryId,
          name: this.data.categoryName,
          description: '永生花商品',
          icon: '/assets/icons/category-default.png'
    },
    subCategories: []
      })
  }
  },

  // 加载用户偏好
  loadUserPreferences() {
  const preferences = app.globalData.userPreferences || {}
  const fontSize = preferences.fontSize || 'normal'

  this.setData({ fontSize })
  },

  // 计算是否启用了筛选条件
  computeHasActiveFilters() {
  const { filters } = this.data
  return !!(filters.priceRange || filters.flowerType || filters.color || filters.style || filters.scene)
  },

  // 加载商品列表（真实API）
  loadProducts() {
  this.setData({ loading: true, loadError: false, loadMoreFailed: false })

  const params = this.buildRequestParams()
  const hasActiveFilters = this.computeHasActiveFilters()

  // 优先使用本地产品数据（即时展示）
  try {
    let localProducts = productsData.getAllProducts()
    // 按分类筛选
    if (params.category) {
      localProducts = localProducts.filter(p => p.category === params.category)
    }
    // 其他本地筛选
    if (params.minPrice) localProducts = localProducts.filter(p => p.price >= params.minPrice)
    if (params.maxPrice) localProducts = localProducts.filter(p => p.price <= params.maxPrice)
    if (params.flowerType) localProducts = localProducts.filter(p => p.flowerType === params.flowerType)
    if (params.color) localProducts = localProducts.filter(p => p.color === params.color)
    if (params.style) localProducts = localProducts.filter(p => p.style === params.style)
    if (params.scene) localProducts = localProducts.filter(p => p.sceneId === params.scene)
    // 排序
    if (params.sort === 'price_asc') localProducts.sort((a, b) => a.price - b.price)
    else if (params.sort === 'price_desc') localProducts.sort((a, b) => b.price - a.price)
    else if (params.sort === 'sales') localProducts.sort((a, b) => b.sales - a.sales)
    // 分页
    const total = localProducts.length
    const start = (params.page - 1) * params.limit
    const pagedProducts = localProducts.slice(start, start + params.limit)
    
    this.setData({
      loading: false,
      products: pagedProducts,
      total,
      page: params.page,
      hasMore: start + params.limit < total,
      loadError: false,
      hasActiveFilters
    })
  } catch (e) {
    console.warn('[category] 本地数据加载失败，尝试API:', e)
    // 降级到API
    this._loadProductsFromApi(params, hasActiveFilters)
    return
  }

  // 异步刷新API（后台更新）
  this._loadProductsFromApi(params, hasActiveFilters)
  },

  _loadProductsFromApi(params, hasActiveFilters) {
    api.product.getProducts(params).then(result => {
      if (result.error) return
      const products = this.enrichProducts(result.products || [])
      const total = result.total || products.length
      if (products.length > 0) {
        this.setData({
          products,
          total,
          page: 1,
          hasMore: products.length < total,
          loadError: false,
          hasActiveFilters
        })
      }
      app.trackEvent('category_products_loaded', {
        category_id: this.data.categoryId,
        product_count: products.length,
        filters: JSON.stringify(params)
      })
    }).catch(() => {
      if (!this.data.products || this.data.products.length === 0) {
        this.setData({ loading: false, loadError: true, products: [], hasActiveFilters })
      }
    })
  },

  // 构建请求参数（匹配 api.js 字段名）
  buildRequestParams() {
  const { filters, categoryId, page, pageSize } = this.data

  const params = {
      page,
      limit: pageSize,
      sort: 'default'
  }

  if (categoryId) params.category = categoryId

  // 添加筛选条件（camelCase 匹配 api.js）
  if (filters.priceRange) {
      const range = filters.priceRanges.find(r =>r.id ===filters.priceRange)
      if (range) {
    params.minPrice = range.min
    params.maxPrice = range.max
      }
  }

  if (filters.flowerType) params.flowerType = filters.flowerType
  if (filters.color) params.color = filters.color
  if (filters.style) params.style = filters.style
  if (filters.scene) params.scene = filters.scene

  // 排序映射
  switch (filters.sort) {
      case 'sales_desc': params.sort = 'sales'; break
      case 'price_asc': params.sort = 'price_asc'; break
      case 'price_desc': params.sort = 'price_desc'; break
      case 'newest': params.sort = 'new'; break
  }

  return params
  },

  // 为产品列表补充预计算字段（WXML 不支持箭头函数）
  enrichProducts(products) {
  return products.map(item =>({
      ...item,
      sceneName: storeConfig.categories.find(cat =>cat.id ===item.scene)?.name || '',
      discountPercent: item.originalPrice > item.price
    ? Math.round((1 - item.price / item.originalPrice) * 100) : 0
  }))
  },

  // 刷新数据
  refreshData() {
  this.setData({ page: 1, hasMore: true, refreshing: true, loadMoreFailed: false })

  const params = this.buildRequestParams()
  api.product.getProducts(params).then(result => {
    wx.stopPullDownRefresh()
    if (result.error) {
      this.setData({ refreshing: false, loadError: true })
      wx.showToast({ title: '刷新失败', icon: 'none' })
      return
    }
    const products = this.enrichProducts(result.products || [])
    const total = result.total || products.length
    this.setData({
      refreshing: false,
      products,
      total,
      hasMore: products.length < total,
      loadError: false
    })
    wx.showToast({ title: '刷新成功', icon: 'success', duration: 1500 })
    app.trackEvent('category_refresh', { category_id: this.data.categoryId })
  }).catch(() => {
    wx.stopPullDownRefresh()
    this.setData({ refreshing: false, loadError: true })
    wx.showToast({ title: '网络连接失败，请检查网络后重试', icon: 'none' })
  })
  },

  // 加载更多商品
  loadMoreProducts() {
  if (!this.data.hasMore || this.data.loadingMore) {
      return
  }

  this.setData({ loadingMore: true })

  const params = this.buildRequestParams()
  params.page = this.data.page + 1

  api.product.getProducts(params).then(result => {
    if (result.error) {
      this.setData({ loadingMore: false, hasMore: false })
      return
    }
    const newProducts = this.enrichProducts(result.products || [])
    const allProducts = [...this.data.products, ...newProducts]
    const total = result.total || allProducts.length
    this.setData({
      products: allProducts,
      page: params.page,
      hasMore: allProducts.length < total,
      loadingMore: false
    })
    app.trackEvent('category_load_more', {
      category_id: this.data.categoryId,
      page: params.page,
      product_count: newProducts.length
    })
  }).catch(() => {
    this.setData({ loadingMore: false, hasMore: false, loadMoreFailed: true })
  })
  },

  // 重试加载更多
  retryLoadMore() {
  this.setData({ loadMoreFailed: false, hasMore: true })
  this.loadMoreProducts()
  },

  // 更新购物车数量
  updateCartCount() {
  const cartCount = app.globalData.cartCount || 0
  this.setData({ cartCount })
  },

  // 检查筛选条件变化
  checkFilterChanges() {
  // 这里可以检查URL参数或其他来源的筛选条件变化
  },

  //===== ==== = 用户交互事件 = ==== ==== =

  // 点击商品
  onProductTap(e) {
  const index = e.currentTarget.dataset.index
  const product = this.data.products[index]

  // 追踪点击事件
  app.trackEvent('category_product_click', {
      product_id: product.id,
      product_name: product.name,
      category_id: this.data.categoryId,
      price: product.price
  })

  // 跳转到商品详情页
  wx.navigateTo({
      url: `/pages/product/detail?id=${product.id}`
  })
  },

  // 点击分类标签
  onCategoryTabTap(e) {
  const categoryId = e.currentTarget.dataset.id
  const category = storeConfig.categories.find(cat =>cat.id ===categoryId)

  if (category) {
      // 跳转到对应分类
      wx.switchTab({
    url: `/pages/category/category`
      })
  }
  },

  // 点击排序
  onSortTap(e) {
  const sort = e.currentTarget.dataset.sort

  this.setData({
      'filters.sort': sort,
      filterPanelVisible: false
  })

  // 更新排序名称
  this.updateCurrentSortName()

  // 重新加载数据
  this.refreshData()

  // 追踪排序事件
  app.trackEvent('category_sort', {
      category_id: this.data.categoryId,
      sort_type: sort
  })
  },

  // 点击筛选条件
  onFilterTap(e) {
  const filterType = e.currentTarget.dataset.type
  const filterValue = e.currentTarget.dataset.value

  if (filterType ==='priceRange') {
      this.setData({
    'filters.priceRange': filterValue ===this.data.filters.priceRange ? '' : filterValue
      })
  } else if (filterType ==='flowerType') {
      this.setData({
    'filters.flowerType': filterValue ===this.data.filters.flowerType ? '' : filterValue
      })
  } else if (filterType ==='color') {
      this.setData({
    'filters.color': filterValue ===this.data.filters.color ? '' : filterValue
      })
  } else if (filterType ==='style') {
      this.setData({
    'filters.style': filterValue ===this.data.filters.style ? '' : filterValue
      })
  } else if (filterType ==='scene') {
      this.setData({
    'filters.scene': filterValue ===this.data.filters.scene ? '' : filterValue
      })
  }

  // 更新筛选徽标名称
  this.updateFilterBadgeNames()

  // 自动关闭筛选面板（选标签即生效）
  this.setData({ filterPanelVisible: false })

  // 重新加载数据
  setTimeout(() =>{
      this.refreshData()
  }, 300)

  // 追踪筛选事件
  app.trackEvent('category_filter', {
      category_id: this.data.categoryId,
      filter_type: filterType,
      filter_value: filterValue
  })
  },

  // 显示排序面板
  onShowSortPanel() {
    this.setData({
      sortPanelVisible: true,
      currentSortTab: 'default'
    })
  },

  // 隐藏排序面板
  onHideSortPanel() {
    this.setData({ sortPanelVisible: false })
  },

  // 选择排序方式
  onSortOptionTap(e) {
    const sort = e.currentTarget.dataset.sort
    this.setData({
      'filters.sort': sort,
      sortPanelVisible: false
    })
    this.updateCurrentSortName()
    this.refreshData()
  },

  // 显示筛选面板
  onShowFilterPanel() {
  this.setData({
      filterPanelVisible: true,
      currentFilterTab: 'price'
  })
  },

  // 隐藏筛选面板
  onHideFilterPanel() {
  this.setData({ filterPanelVisible: false })
  },

  // 切换筛选标签
  onFilterTabTap(e) {
  const tab = e.currentTarget.dataset.tab
  this.setData({ currentFilterTab: tab })
  },

  // 重置筛选条件
  onResetFilters() {
  this.setData({
      'filters.priceRange': '',
      'filters.flowerType': '',
      'filters.color': '',
      'filters.style': '',
      'filters.scene': '',
      loadMoreFailed: false
  })

  // 更新筛选徽标名称
  this.updateFilterBadgeNames()

  // 关闭筛选面板
  this.setData({ filterPanelVisible: false })

  // 重新加载数据
  this.refreshData()

  // 追踪重置事件
  app.trackEvent('category_filter_reset', {
      category_id: this.data.categoryId
  })
  },

  // 确认筛选
  onConfirmFilters() {
  this.setData({ filterPanelVisible: false })

  // 重新加载数据
  this.refreshData()
  },

  // 点击搜索
  onSearchTap() {
  this.setData({ showSearchInput: true })
  },

  // 搜索输入
  onSearchInput(e) {
  this.setData({ searchKeyword: e.detail.value })
  },

  // 搜索确认
  onSearchConfirm(e) {
  const keyword = e.detail.value || this.data.searchKeyword

  if (keyword.trim()) {
      // 跳转到搜索结果页
      wx.navigateTo({
    url: `/subpackages/search/result/result?keyword=${encodeURIComponent(keyword)}&category=${this.data.categoryId}`
      })

      // 追踪搜索事件
      app.trackEvent('category_search', {
    category_id: this.data.categoryId,
    keyword: keyword
      })
  }

  this.setData({
      showSearchInput: false,
      searchKeyword: ''
  })
  },

  // 取消搜索
  onSearchCancel() {
  this.setData({
      showSearchInput: false,
      searchKeyword: ''
  })
  },

  // 商品图片加载失败
  onProductImageError(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const products = this.data.products.map(item => {
      if (item.id === id) {
        return { ...item, _imageError: true }
      }
      return item
    })
    this.setData({ products })
  },

  // 点击购物车
  onCartTap() {

  // 跳转到购物车页面
  wx.switchTab({
      url: '/pages/cart/cart'
  })

  // 追踪购物车点击事件
  app.trackEvent('cart_click', { page: 'category' })
  },

  // 点击返回首页
  onBackToHome() {
  wx.switchTab({
      url: '/pages/index/index'
  })
  },

  // 字体大小变化回调
  onFontSizeChange(fontSize) {
  this.setData({ fontSize })
  },

  // 登录状态变化回调
  onLoginStatusChange(isLogin) {
  // 这里可以处理登录状态变化
  },

  // 网络状态变化回调
  onNetworkStatusChange(networkType) {

  if (networkType ==='none') {
      wx.showToast({
    title: '网络已断开',
    icon: 'none'
      })
  }
  },

  // 加入购物车
  onAddToCart(e) {
  const index = e.currentTarget.dataset.index
  const product = this.data.products[index]
  if (!product) return

  const cartItems = wx.getStorageSync('cartItems') || []

  // 查找是否已存在相同商品（使用 productId 统一标识）
  const existingIndex = cartItems.findIndex(item =>item.productId ===product.id)
  if (existingIndex > -1) {
      cartItems[existingIndex].quantity = (cartItems[existingIndex].quantity || 1) + 1
  } else {
      cartItems.push({
    productId: product.id,
    name: product.name,
    image: product.image || `/assets/products/product-${(product.id % 6) + 1}.jpg`,
    price: product.price || 0,
    originalPrice: product.originalPrice || product.price,
    quantity: 1,
    selected: true,
    addTime: Date.now()
      })
  }

  wx.setStorageSync('cartItems', cartItems)

  wx.showToast({
      title: '已加入购物车',
      icon: 'success',
      duration: 1500
  })

  this.updateCartBadge()
  this.updateCartCount()
  app.trackEvent('add_to_cart', { product: product.name, page: 'category' })
  },

  // 更新购物车角标
  updateCartBadge() {
  const cartItems = wx.getStorageSync('cartItems') || []
  const count = cartItems.reduce((sum, item) =>sum + (item.quantity || 0), 0)
  // 同步到全局数据，避免 updateCartCount 读取过期值
  app.globalData.cartCount = count
  this.setData({ cartCount: count })
  if (count > 0) {
      wx.setTabBarBadge({
    index: 2,
    text: String(count > 99 ? '99+' : count)
      })
  } else {
      wx.removeTabBarBadge({ index: 2 })
  }
  }
})
