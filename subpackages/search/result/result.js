// pages/search/result/result.js - 搜索结果页面
const app = getApp()

Page({
  data: {
  // 搜索关键词
  keyword: '',

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
      { id: 'price - asc', name: '价格从低到高', selected: false },
      { id: 'price - desc', name: '价格从高到低', selected: false },
      { id: 'sales', name: '销量优先', selected: false }
  ],
  currentSortText: '默认排序',
  showSortMenu: false,

  // 商品列表
  productList: [],
  page: 1,
  pageSize: 10,
  hasMore: true,
  loading: false,
  firstLoad: true,

  // 空状态
  emptyState: {
      show: false,
      title: '未找到相关商品',
      desc: '试试其他关键词或筛选条件'
  },

  // 字体大小
  fontSize: 'normal'
  },

  onLoad(options) {

  this.loadUserPreferences()

  const keyword = options.keyword || ''
  this.setData({ keyword })

  if (keyword) {
      this.loadResults()
  }
  },

  onShow() {
  this.loadUserPreferences()
  },

  onPullDownRefresh() {
  this.setData({ page: 1, hasMore: true })
  this.loadResults().then(() =>{
      wx.stopPullDownRefresh()
  })
  },

  onReachBottom() {
  if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
  }
  },

  loadUserPreferences() {
  const preferences = app.globalData.userPreferences || {}
  const fontSize = preferences.fontSize || 'normal'
  this.setData({ fontSize })
  },

  // 加载搜索结果
  loadResults() {
  this.setData({ loading: true, firstLoad: false })

  return new Promise((resolve) =>{
      setTimeout(() =>{
    const results = this.generateMockProducts(this.data.pageSize)

    this.setData({
          productList: results,
          loading: false,
          hasMore: results.length >=this.data.pageSize,
          'emptyState.show': results.length ===0
    })
    resolve()
      }, 600)
  })
  },

  // 加载更多
  loadMore() {
  this.setData({ loading: true })

  setTimeout(() =>{
      const newItems = this.generateMockProducts(10, this.data.page * 10)
      const allItems = [...this.data.productList, ...newItems]

      this.setData({
    productList: allItems,
    loading: false,
    page: this.data.page + 1,
    hasMore: this.data.page < 3
      })
  }, 500)
  },

  // 分类筛选
  onCategoryTap(e) {
  const index = e.currentTarget.dataset.index
  const categories = this.data.categories.map((cat, i) =>({
      ...cat,
      selected: i ===index
  }))
  this.setData({ categories })
  this.loadResults()
  },

  // 显示/隐藏排序菜单
  toggleSort() {
  this.setData({ showSortMenu: !this.data.showSortMenu })
  },

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
  const selected = sortOptions.find(opt =>opt.selected)

  this.setData({
      sortOptions,
      currentSortText: selected.name,
      showSortMenu: false
  })
  this.loadResults()
  },

  // 点击商品
  onProductTap(e) {
  const product = e.currentTarget.dataset.product
  wx.navigateTo({
      url: `/pages/product/detail?id=${product.id}`
  })
  },

  // 生成模拟商品数据
  generateMockProducts(count, startIndex = 0) {
  const products = []
  const flowers = ['玫瑰', '绣球', '牡丹', '百合', '樱花', '向日葵']
  const colors = ['粉色', '红色', '白色', '紫色', '蓝色']

  for (let i = 0; i < count; i++) {
      const id = 200000 + startIndex + i
      const flower = flowers[i % flowers.length]
      const color = colors[i % colors.length]

      products.push({
    id: id.toString(),
    name: `${this.data.keyword || ''}${flower}${color}永生花礼盒`,
    image: `/assets/products/product-${(i % 6) + 1}.jpg`,
    price: 168 + Math.floor(Math.random() * 300),
    originalPrice: 268 + Math.floor(Math.random() * 300),
    sales: Math.floor(Math.random() * 2000),
    tags: ['热销', '包邮'].slice(0, Math.random() > 0.5 ? 1 : 2)
      })
  }
  return products
  },

  onShareAppMessage() {
  return {
      title: `"${this.data.keyword}" 搜索结果 - 诺派永生花`,
      path: `/subpackages/search/result/result?keyword=${encodeURIComponent(this.data.keyword)}`
  }
  },

  goBack() {
  wx.navigateBack({ delta: 1 })
  }
})
