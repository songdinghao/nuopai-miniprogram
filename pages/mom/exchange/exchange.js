const app = getApp()
const momEarnings = require('../../../utils/mom-earnings.js')
const storeConfig = require('../../../config/store-config.js')

Page({
  data: {
  availableAmount: 0,
  products: [],
  targetProduct: null,
  confirmVisible: false
  },

  onShow() {
  const userData = momEarnings.getMomUserData()
  const momData = userData.momData || {}
  const allProducts = storeConfig.getExchangeProductList ? storeConfig.getExchangeProductList() : []

  this.setData({
      availableAmount: momData.settledEarnings || 0,
      products: allProducts.slice(0, 10)
  })
  },

  onSelectProduct(e) {
  const product = this.data.products[e.currentTarget.dataset.index]
  if (!product) return

  const price = product.price || 0
  if (this.data.availableAmount < price * 0.5) {
      wx.showToast({ title: '收益不足，无法兑换', icon: 'none' })
      return
  }

  this.setData({ targetProduct: product, confirmVisible: true })
  },

  onConfirmExchange() {
  const product = this.data.targetProduct
  if (!product) { this.setData({ confirmVisible: false }); return }

  const result = momEarnings.performExchange(product)
  if (result.success) {
      wx.showToast({
    title: result.needPay > 0 ? `兑换成功，需补差价¥${result.needPay}` : '兑换成功',
    icon: 'none'
      })
  } else {
      wx.showToast({ title: result.reason || '兑换失败', icon: 'none' })
  }

  this.setData({ confirmVisible: false, targetProduct: null })
  this.onShow()
  },

  onCancelConfirm() {
  this.setData({ confirmVisible: false, targetProduct: null })
  }
})
