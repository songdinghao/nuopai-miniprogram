// pages/promotion/promotion.js - 促销活动页面
const app = getApp()

Page({
  data: {
  // 字体大小
  fontSize: 'normal',

  // 页面状态
  loading: true,
  error: false,
  refreshing: false,

  // 当前活动ID
  activityId: '',

  // 轮播Banner
  banners: [
      { id: 'banner1', image: '/assets/banners/banner1.jpg', title: '限时特惠', link: '' },
      { id: 'banner2', image: '/assets/banners/banner2.jpg', title: '满减专区', link: '' },
      { id: 'banner3', image: '/assets/banners/banner3.jpg', title: '新品首发', link: '' }
  ],

  // 活动信息
  activity: null,

  // 活动商品列表
  products: [],

  // 活动规则
  rules: [
      '活动时间：即日起至活动结束为止',
      '满199减20，满299减50，满499减100',
      '活动商品数量有限，售完即止',
      '本活动最终解释权归诺派永生花所有'
  ],

  // 分页
  page: 1,
  pageSize: 10,
  hasMore: true,
  loadingMore: false
  },

  onLoad(options) {
  app.globalData.currentPage = 'promotion'

  // 加载字体偏好
  const preferences = app.globalData.userPreferences || {}
  this.setData({ fontSize: preferences.fontSize || 'normal' })

  const activityId = options.id || ''
  this.setData({ activityId })

  // 加载活动数据
  this.loadActivityData(activityId)
  },

  onShow() {
  },

  onPullDownRefresh() {
  this.setData({ refreshing: true })
  this.refreshData()
  },

  onReachBottom() {
  this.loadMoreProducts()
  },

  onShareAppMessage() {
  return {
      title: this.data.activity ? this.data.activity.title : '诺派永生花 - 促销活动',
      path: '/pages/promotion/promotion'
  }
  },

  // 加载活动数据
  loadActivityData(activityId) {
  this.setData({ loading: true, error: false })

  // 模拟API请求
  setTimeout(() =>{
      // 构建活动信息
      const activity = {
    id: activityId || 'promo_current',
    title: '春季特惠',
    subtitle: '满减优惠，限时抢购',
    startTime: '2026 - 04 - 01',
    endTime: '2026 - 05 - 31',
    tag: '限时',
    tagColor: "#2D8C7A"
      }

      const products = this.generateMockProducts(activityId)

      this.setData({
    loading: false,
    activity,
    products,
    page: 1,
    hasMore: products.length >=this.data.pageSize
      })
  }, 600)
  },

  // 生成模拟商品数据
  generateMockProducts(activityId) {
  const products = []
  const names = [
      '永生花玫瑰礼盒', '永生花绣球摆件', '永生花牡丹花艺',
      '永生花百合花瓶', '永生花康乃馨花篮', '永生花向日葵装饰',
      '永生花混搭花束', '永生花粉色礼盒', '永生花紫色系列',
      '永生花定制礼盒'
  ]

  for (let i = 0; i < 10; i++) {
      const price = 168 + Math.floor(Math.random() * 200)
      const originalPrice = price + 50 + Math.floor(Math.random() * 100)
      products.push({
    id: `promo_${i + 1}`,
    name: names[i] || `永生花精品${i + 1}`,
    image: `/assets/products/product-${(i % 6) + 1}.jpg`,
    price,
    originalPrice,
    sales: 100 + Math.floor(Math.random() * 1900),
    discount: Math.round((1 - price / originalPrice) * 10),
    tags: ['热销', '限时优惠']
      })
  }
  return products
  },

  // 刷新数据
  refreshData() {
  this.setData({ page: 1, hasMore: true })
  this.loadActivityData(this.data.activityId)

  setTimeout(() =>{
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
      wx.showToast({ title: '刷新成功', icon: 'success', duration: 1500 })
  }, 800)
  },

  // 加载更多
  loadMoreProducts() {
  if (!this.data.hasMore || this.data.loadingMore) return

  this.setData({ loadingMore: true })

  setTimeout(() =>{
      const newProducts = this.generateMockProducts(this.data.activityId)
      const allProducts = [...this.data.products, ...newProducts]

      this.setData({
    products: allProducts,
    loadingMore: false,
    page: this.data.page + 1,
    hasMore: this.data.page < 3
      })
  }, 600)
  },

  // 点击商品
  onProductTap(e) {
  const index = e.currentTarget.dataset.index
  const product = this.data.products[index]
  if (!product || !product.id) return
  wx.navigateTo({ url: `/pages/product/detail?id=${product.id}` })
  },

  // 点击Banner
  onBannerTap(e) {
  const index = e.currentTarget.dataset.index
  const banner = this.data.banners[index]
  if (banner && banner.link && banner.link.trim()) {
      wx.navigateTo({ url: banner.link })
  }
  },

  // 轮播变化
  onSwiperChange(e) {
  },

  // 字体大小变化回调
  onFontSizeChange(fontSize) {
  this.setData({ fontSize })
  }
})
