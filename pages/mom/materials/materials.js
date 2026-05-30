// pages/mom/materials/materials.js - 素材库页面逻辑
const app = getApp()
const materials = require('../../../utils/mom-materials.js')

Page({
  data: {
  fontSizeClass: '',
  currentTab: 0,
  categories: [],
  products: [],
  selectedProductId: null,
  selectedProduct: null,
  // 海报Tab
  posterPreview: null,
  // 文案Tab
  copyList: [],
  // 店铺码Tab
  storeQR: null,
  showPosterModal: false
  },

  onLoad() {
  app.loadUserPreferences()
  app.watchFontSizeChange(this.onFontSizeChange.bind(this))

  const prefs = app.globalData.userPreferences || {}
  this.setData({ fontSizeClass: prefs.fontSize || 'normal' })

  this.initData()
  },

  onFontSizeChange(fontSize) {
  this.setData({ fontSizeClass: fontSize })
  },

  initData() {
  const categories = materials.getMaterialCategories()
  const products = materials.getProducts()
  const storeQR = materials.generateStoreQR('demo_user')

  this.setData({
      categories,
      products,
      storeQR
  })
  },

  // Tab切换（避免与wx.switchTab API同名）
  switchMaterialTab(e) {
  const index = e.currentTarget.dataset.index
  if (index ===this.data.currentTab) return

  this.setData({
      currentTab: index,
      selectedProductId: null,
      selectedProduct: null,
      posterPreview: null,
      copyList: []
  })
  },

  // 选择商品
  selectProduct(e) {
  const productId = e.currentTarget.dataset.productId
  const product = materials.getProductById(productId)

  if (!product) return

  this.setData({
      selectedProductId: productId,
      selectedProduct: product
  })

  const currentTab = this.data.currentTab

  if (currentTab ===0) {
      // 海报Tab - 生成海报
      this.generatePoster(product)
  } else if (currentTab ===1) {
      // 文案Tab - 生成文案
      this.generateCopy(productId)
  }
  },

  // 生成海报预览
  generatePoster(product) {
  wx.showLoading({ title: '生成海报中...', mask: true })

  setTimeout(() =>{
      const poster = materials.generatePoster(product, 'demo_user')
      this.setData({
    posterPreview: poster,
    showPosterModal: true
      })
      wx.hideLoading()
  }, 800)
  },

  // 关闭海报预览弹窗
  closePosterModal() {
  this.setData({ showPosterModal: false })
  },

  // 保存海报到相册
  savePoster() {
  const poster = this.data.posterPreview
  if (!poster) return

  wx.showLoading({ title: '保存中...', mask: true })

  // 模拟保存海报（小程序中可用 wx.downloadFile + wx.saveImageToPhotosAlbum）
  setTimeout(() =>{
      wx.hideLoading()
      wx.showModal({
    title: '保存成功',
    content: `海报已保存到相册\n商品：${poster.title}\n价格：${poster.price}`,
    showCancel: false,
    confirmText: '知道了',
    confirmColor: "#2D8C7A"
      })
  }, 1000)
  },

  // 生成文案
  generateCopy(productId) {
  wx.showLoading({ title: '生成文案中...', mask: true })

  setTimeout(() =>{
      const copyList = materials.generateCopy(productId)
      this.setData({ copyList })
      wx.hideLoading()
  }, 600)
  },

  // 复制文案
  copyCopy(e) {
  const text = e.currentTarget.dataset.text
  if (!text) return

  wx.setClipboardData({
      data: text,
      success: () =>{
    wx.showToast({ title: '已复制', icon: 'success' })
      }
  })
  },

  // 一键复制所有文案
  copyAllCopy() {
  const list = this.data.copyList
  if (!list || list.length ===0) {
      wx.showToast({ title: '暂无文案可复制', icon: 'none' })
      return
  }

  const allText = list.map(item =>item.text).join('\n\n---\n\n')
  wx.setClipboardData({
      data: allText,
      success: () =>{
    wx.showToast({ title: `已复制${list.length}条文案`, icon: 'success' })
      }
  })
  },

  // 保存店铺码到相册
  saveStoreQR() {
  wx.showLoading({ title: '保存中...', mask: true })

  setTimeout(() =>{
      wx.hideLoading()
      wx.showModal({
    title: '保存成功',
    content: '店铺码已保存到相册，快去分享给好友吧！',
    showCancel: false,
    confirmText: '知道了',
    confirmColor: "#2D8C7A"
      })
  }, 1000)
  }
})
