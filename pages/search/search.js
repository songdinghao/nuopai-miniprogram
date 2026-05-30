// pages/search/search.js - 搜索页面（针对30 - 60岁主妇优化）
const app = getApp()
const storeConfig = require('../../config/store-config.js')
const api = require('../../utils/api.js')
const productsData = require('../../data/products.js')

Page({
  data: {
  // 字体大小
  fontSize: 'normal',

  // 搜索关键词
  searchKeyword: '',

  // 搜索历史
  searchHistory: [],

  // 热搜词
  hotKeywords: [
      { id: 1, name: '永生花', hot: true },
      { id: 2, name: '客厅摆件', hot: true },
      { id: 3, name: '玄关装饰', hot: false },
      { id: 4, name: '母亲节礼物', hot: true },
      { id: 5, name: '玫瑰', hot: false },
      { id: 6, name: '绣球', hot: false }
  ],

  // 搜索联想
  suggestions: [],
  showSuggestions: false,
  suggestionSource: [], // 联想词源数据

  // 分类筛选
  categories: [
      { id: 'all', name: '全部', selected: true },
      { id: 'xuanguan', name: '玄关', selected: false },
      { id: 'keting', name: '客厅', selected: false },
      { id: 'canting', name: '餐厅', selected: false },
      { id: 'songli', name: '送礼', selected: false }
  ],

  // 排序方式
  sortOptions: [
      { id: 'default', name: '默认排序', selected: true },
      { id: 'price-asc', name: '价格从低到高', selected: false },
      { id: 'price-desc', name: '价格从高到低', selected: false },
      { id: 'sales', name: '销量优先', selected: false }
  ],

  // 当前排序文本
  currentSortText: '默认排序',

  // 显示排序菜单
  showSortMenu: false,

  // 搜索结果
  searchResults: [],

  // 页面状态
  loading: false,
  searching: false,
  hasMore: true,
  page: 1,
  pageSize: 10,

  // 语音搜索状态
  voiceSearching: false,
  voiceResult: '',

  // 显示模式
  showSearchInput: true, // 是否显示搜索输入区域
  showHistory: true, // 是否显示搜索历史
  showHotKeywords: true, // 是否显示热搜词

  // 空状态
  emptyState: {
      show: false,
      icon: 'search',
      title: '搜索你想要的',
      desc: '输入关键词，找到心仪的商品'
  }
  },

  onLoad(options) {

  app.globalData.currentPage = 'search'

  // 加载字体偏好
  const preferences = app.globalData.userPreferences || {}
  this.setData({ fontSize: preferences.fontSize || 'normal' })

  // 加载搜索历史
  this.loadSearchHistory()

  this.initSuggestionSource()

  // 如果有传入关键词，直接搜索
  if (options.keyword) {
      this.setData({ searchKeyword: decodeURIComponent(options.keyword) })
      this.performSearch()
  }
  },

  onShow() {

  // 更新搜索历史
  this.loadSearchHistory()
  },

  onHide() {
    clearTimeout(this._searchInputTimer)
  },

  onUnload() {
  // 清除搜索输入防抖定时器
  clearTimeout(this._searchInputTimer)
  },

  onShareAppMessage() {
  return {
      title: '诺派永生花商城 - 搜索',
      path: '/pages/search/search'
  }
  },

  // 加载搜索历史
  loadSearchHistory() {
  const history = wx.getStorageSync('searchHistory') || []
  this.setData({ searchHistory: history })

  // 更新空状态
  if (history.length ===0 && this.data.searchKeyword ==='') {
      this.setData({
    'emptyState.show': true,
    'emptyState.title': '搜索你想要的',
    'emptyState.desc': '输入关键词，找到心仪的商品'
      })
  }
  },

  initSuggestionSource() {
  // 从商品名称、热搜词、分类名等构建联想词源
  const productNames = [
      '永生花玫瑰摆件', '永生花绣球装饰', '永生花牡丹花艺',
      '永生花百合摆件', '永生花康乃馨花篮', '永生花向日葵',
      '客厅茶几绣球花装饰', '玄关端景台永生花', '餐厅餐桌牡丹花艺',
      '玄关摆件', '客厅摆件', '玄关装饰', '客厅装饰', '餐厅花艺',
      '卧室装饰', '书房装饰', '商务送礼', '节日礼品',
      '母亲节礼物', '情人节礼物', '新年礼物',
      '粉色永生花', '红色永生花', '白色永生花', '紫色永生花',
      '玫瑰', '绣球', '牡丹', '百合', '康乃馨', '向日葵',
      '永生花礼盒', '永生花钥匙扣', '永生花音乐盒', '永生花相框',
      '定制永生花', '永生花diy材料包'
  ]
  this.setData({ suggestionSource: productNames })
  },

  // 生成搜索联想
  generateSuggestions(keyword) {
  if (!keyword || keyword.trim() ==='') {
      this.setData({ suggestions: [], showSuggestions: false })
      return
  }

  const trimmed = keyword.trim()
  const source = this.data.suggestionSource

  // 匹配联想词
  let matched = source.filter(name =>name.includes(trimmed))

  // 按匹配度排序：前缀匹配优先
  matched.sort((a, b) =>{
      const aPrefix = a.startsWith(trimmed) ? 1 : 0
      const bPrefix = b.startsWith(trimmed) ? 1 : 0
      if (aPrefix !== bPrefix) return bPrefix - aPrefix
      return a.length - b.length
  })

  // 最多显示8条
  matched = matched.slice(0, 8)

  // 标记高亮位置
  matched = matched.map(text =>{
      const index = text.indexOf(trimmed)
      return {
    text,
    highlightStart: index,
    highlightEnd: index + trimmed.length
      }
  })

  this.setData({ suggestions: matched, showSuggestions: matched.length > 0 })
  },

  // 搜索框输入
  onSearchInput(e) {
  const keyword = e.detail.value
  this.setData({ searchKeyword: keyword })

  // 清空搜索结果，显示历史记录
  if (keyword ==='') {
      clearTimeout(this._searchInputTimer)
      this.setData({
    searchResults: [],
    suggestions: [],
    showSuggestions: false,
    showHistory: true,
    showHotKeywords: true
      })
      return
  }

  // 300ms 防抖处理，避免每次输入都触发搜索联想
  clearTimeout(this._searchInputTimer)
  this._searchInputTimer = setTimeout(() =>{
      if (keyword.trim()) {
    this.generateSuggestions(keyword)
      } else {
    this.setData({ suggestions: [], showSuggestions: false })
      }
  }, 300)
  },

  // 搜索框确认
  onSearchConfirm(e) {
  const keyword = e.detail.value.trim()
  if (!keyword) {
      wx.showToast({
    title: '请输入搜索内容',
    icon: 'none'
      })
      return
  }

  this.setData({ searchKeyword: keyword })
  this.performSearch()
  },

  // 点击搜索按钮
  onSearchTap() {
  const keyword = this.data.searchKeyword.trim()
  if (!keyword) {
      wx.showToast({
    title: '请输入搜索内容',
    icon: 'none'
      })
      return
  }

  this.performSearch()
  },

  // 清空搜索
  onClearSearch() {
  this.setData({
      searchKeyword: '',
      searchResults: [],
      suggestions: [],
      showSuggestions: false,
      showHistory: true,
      showHotKeywords: true,
      'emptyState.show': true,
      'emptyState.title': '搜索你想要的',
      'emptyState.desc': '输入关键词，找到心仪的商品'
  })
  },

  // 执行搜索（真实API）
  performSearch() {
  const keyword = this.data.searchKeyword.trim()
  if (!keyword) return

  // 保存搜索历史
  this.saveToSearchHistory(keyword)

  // 显示搜索状态
  this.setData({
      searching: true,
      loading: true,
      showHistory: false,
      showHotKeywords: false,
      searchResults: [],
      page: 1,
      hasMore: true
  })

  // 追踪搜索事件
  app.trackEvent('search', { keyword, source: 'search-page' })

  // 构建搜索参数
  const selectedCategory = this.data.categories.find(c => c.selected)
  const selectedSort = this.data.sortOptions.find(s => s.selected)
  const params = {
    keyword,
    page: 1,
    limit: this.data.pageSize
  }
  if (selectedCategory && selectedCategory.id !== 'all') {
    params.category = selectedCategory.id
  }
  if (selectedSort) {
    switch (selectedSort.id) {
      case 'price-asc': params.sort = 'price_asc'; break
      case 'price-desc': params.sort = 'price_desc'; break
      case 'sales': params.sort = 'sales'; break
    }
  }

  // 首先使用本地数据搜索
  try {
    const allProducts = productsData.getAllProducts()
    const kw = keyword.toLowerCase()
    const matchedProducts = allProducts.filter(
      p => p.name.toLowerCase().includes(kw) || 
           (p.description && p.description.toLowerCase().includes(kw))
    )
    const total = matchedProducts.length
    const products = matchedProducts.slice(0, this.data.pageSize)
    
    this.setData({
      searching: false,
      loading: false,
      searchResults: products,
      total,
      hasMore: products.length < total,
      'emptyState.show': products.length === 0,
      'emptyState.title': products.length === 0 ? '未找到相关商品' : '',
      'emptyState.desc': products.length === 0 ? '试试其他关键词' : ''
    })
  } catch (e) {
    console.warn('[search] 本地搜索失败:', e)
  }

  // 异步API搜索（后台刷新）
  api.product.searchProducts(keyword, 1, this.data.pageSize).then(result => {
    if (result.error) {
      this.setData({
        searching: false, loading: false,
        'emptyState.show': true,
        'emptyState.title': '网络异常',
        'emptyState.desc': '搜索失败，请检查网络后重试'
      })
      return
    }
    const products = result.products || []
    const total = result.total || products.length

    if (products.length === 0) {
      this.setData({
        searching: false, loading: false,
        searchResults: [],
        'emptyState.show': true,
        'emptyState.title': '未找到相关商品',
        'emptyState.desc': '试试其他关键词吧'
      })
    } else {
      this.setData({
        searching: false, loading: false,
        searchResults: products,
        hasMore: products.length < total,
        'emptyState.show': false
      })
    }
  }).catch(() => {
    this.setData({
      searching: false, loading: false,
      'emptyState.show': true,
      'emptyState.title': '网络异常',
      'emptyState.desc': '搜索失败，请检查网络后重试'
    })
  })
  },

  // 保存搜索历史
  saveToSearchHistory(keyword) {
  let history = wx.getStorageSync('searchHistory') || []

  // 移除已存在的相同关键词
  history = history.filter(item =>item !== keyword)

  // 添加到开头
  history.unshift(keyword)

  // 限制历史记录数量（最多20条）
  if (history.length > 20) {
      history = history.slice(0, 20)
  }

  // 保存到本地存储
  wx.setStorageSync('searchHistory', history)

  // 更新页面数据
  this.setData({ searchHistory: history })
  },

  // 点击搜索历史
  onHistoryTap(e) {
  const index = e.currentTarget.dataset.index
  const keyword = this.data.searchHistory[index]

  this.setData({ searchKeyword: keyword })
  this.performSearch()
  },

  // 点击热搜词
  onHotKeywordTap(e) {
  const index = e.currentTarget.dataset.index
  const keyword = this.data.hotKeywords[index].name

  this.setData({ searchKeyword: keyword })
  this.performSearch()
  },

  // 清空搜索历史
  onClearHistory() {
  wx.showModal({
      title: '确认清空',
      content: '确定要清空搜索历史吗？',
      confirmText: '清空',
      confirmColor: "#2D8C7A",
      success: (res) =>{
    if (res.confirm) {
          wx.removeStorageSync('searchHistory')
          this.setData({ searchHistory: [] })

          wx.showToast({
      title: '已清空',
      icon: 'success'
          })
    }
      }
  })
  },

  // 删除单条搜索历史
  onDeleteHistoryItem(e) {
  const index = e.currentTarget.dataset.index
  const keyword = this.data.searchHistory[index]

  let history = this.data.searchHistory.filter((item, i) =>i !== index)
  wx.setStorageSync('searchHistory', history)
  this.setData({ searchHistory: history })
  },

  // 点击搜索联想词
  onSuggestionTap(e) {
  const index = e.currentTarget.dataset.index
  const keyword = this.data.suggestions[index].text

  this.setData({ 
      searchKeyword: keyword,
      showSuggestions: false,
      suggestions: []
  })
  this.performSearch()
  },

  // 隐藏联想浮层
  onHideSuggestions() {
  this.setData({ showSuggestions: false })
  },

  // 分类筛选
  onCategoryTap(e) {
  const index = e.currentTarget.dataset.index
  const categories = this.data.categories.map((cat, i) =>({
      ...cat,
      selected: i ===index
  }))

  this.setData({ categories })

  // 重新搜索
  if (this.data.searchKeyword) {
      this.performSearch()
  }
  },

  goBack() {
  wx.navigateBack()
  },

  // 显示排序菜单
  toggleSort() {
  this.setData({ showSortMenu: !this.data.showSortMenu })
  },

  // 隐藏排序菜单
  hideSortMenu() {
  this.setData({ showSortMenu: false })
  },

  // 排序选择
  onSortTap(e) {
  const index = e.currentTarget.dataset.index
  const sortOptions = this.data.sortOptions.map((opt, i) =>({
      ...opt,
      selected: i ===index
  }))

  const selectedSort = sortOptions.find(opt =>opt.selected)

  this.setData({ 
      sortOptions,
      currentSortText: selectedSort.name,
      showSortMenu: false
  })

  // 重新搜索
  if (this.data.searchKeyword) {
      this.performSearch()
  }
  },

  // 点击商品
  onProductTap(e) {
  const index = e.currentTarget.dataset.index
  const product = this.data.searchResults[index]

  // 追踪点击事件
  app.trackEvent('search_result_click', {
      product_id: product.id,
      product_name: product.name,
      position: index
  })

  // 跳转到商品详情页
  wx.navigateTo({
      url: `/pages/product/detail?id=${product.id}`
  })
  },

  // 加载更多
  onLoadMore() {
  if (!this.data.hasMore || this.data.loading) {
      return
  }

  this.setData({ loading: true })
  const nextPage = this.data.page + 1

  api.product.searchProducts(this.data.searchKeyword, nextPage, this.data.pageSize).then(result => {
    if (result.error) {
      this.setData({ loading: false, hasMore: false })
      return
    }
    const newResults = result.products || []
    const allResults = [...this.data.searchResults, ...newResults]
    const total = result.total || allResults.length
    this.setData({
      searchResults: allResults,
      loading: false,
      page: nextPage,
      hasMore: allResults.length < total
    })
  }).catch(() => {
    this.setData({ loading: false, hasMore: false })
  })
  },

  // 开始语音搜索
  onVoiceSearchTap() {

  // 检查语音权限
  if (!app.globalData.voiceSupported) {
      wx.showModal({
    title: '提示',
    content: '您的设备不支持语音搜索功能',
    showCancel: false
      })
      return
  }

  // 显示语音搜索状态
  this.setData({ voiceSearching: true })

  // 开始录音
  app.startVoiceRecognition()

  // 追踪语音搜索事件
  app.trackEvent('voice_search_start', { page: 'search' })
  },

  // 停止语音搜索
  onVoiceSearchStop() {

  this.setData({ voiceSearching: false })

  // 停止录音
  if (app.voiceRecorderManager) {
      app.voiceRecorderManager.stop()
  }
  },

  // 语音识别结果
  onVoiceResult(result) {
  if (result && result.text) {
      this.setData({
    voiceResult: result.text,
    searchKeyword: result.text,
    voiceSearching: false
      })

      // 执行搜索
      setTimeout(() =>{
    this.performSearch()
      }, 300)
  }
  },

  // 字体大小变化回调
  onFontSizeChange(fontSize) {
  this.setData({ fontSize })
  }
})

