// pages/ar/ar.js - AR预览页面逻辑（针对30 - 55岁家庭主妇优化）
const app = getApp()

Page({
  data: {
  loading: true,
  error: false,
  errorTitle: '',
  errorDesc: '',
  cameraPosition: 'back',
  showPlacementHint: true,
  placementHint: '移动手机寻找平面',
  productPlaced: false,
  productSelected: false,
  selectedProductId: '',
  productInfo: null,
  productList: [
      {
    id: '1',
    name: '粉色玫瑰花瓶',
    image: '/assets/products/product-1.jpg',
    price: 168
      },
      {
    id: '2',
    name: '白色绣球花',
    image: '/assets/products/product-2.jpg',
    price: 258
      },
      {
    id: '3',
    name: '紫色薰衣草瓶',
    image: '/assets/products/product-3.jpg',
    price: 198
      },
      {
    id: '4',
    name: '红色康乃馨瓶',
    image: '/assets/products/product-4.jpg',
    price: 228
      }
  ],
  showHelpModal: false,
  showPhotoPreview: false,
  capturedPhoto: '',
  fontSize: 'normal',
  highContrast: false,
  darkMode: false
  },

  onLoad(options) {
  app.globalData.currentPage = 'ar'

  this.loadSettings()

  if (options.productId) {
      this.selectProductById(options.productId)
  }

  this.initCamera()
  },

  onShow() {
  this.loadSettings()
  },

  onShareAppMessage() {
  return {
      title: '诺派永生花 - AR预览',
      path: '/pages/ar/ar'
  }
  },

  loadSettings() {
  const settings = wx.getStorageSync('settings') || {}
  this.setData({
      fontSize: settings.fontSize || 'normal',
      highContrast: settings.highContrast || false,
      darkMode: settings.darkMode || false
  })
  },

  initCamera() {
  const that = this

  wx.getSetting({
      success(res) {
    if (!res.authSetting['scope.camera']) {
          wx.authorize({
      scope: 'scope.camera',
      success() {
              that.startCamera()
      },
      fail() {
              that.showError(
        '需要相机权限',
        '请点击"设置"开启相机权限，以便使用AR预览功能'
              )
      }
          })
    } else {
          that.startCamera()
    }
      },
      fail() {
    that.showError(
          '获取权限失败',
          '请检查网络或稍后重试'
    )
      }
  })
  },

  startCamera() {
  const that = this
  setTimeout(() =>{
      that.setData({
    loading: false,
    error: false
      })
  }, 1000)
  },

  showError(title, desc) {
  this.setData({
      loading: false,
      error: true,
      errorTitle: title,
      errorDesc: desc
  })
  },

  retry() {
  this.setData({
      loading: true,
      error: false
  })
  this.initCamera()
  },

  goBack() {
  wx.navigateBack()
  },

  onCameraReady() {
  },

  onCameraError(err) {
  console.error('相机错误', err)
  this.showError(
      '相机启动失败',
      '请检查相机权限或稍后重试'
  )
  },

  // 图片加载失败处理
  onImageError(e) {
    console.warn('AR图片加载失败', e)
  },

  selectProductById(productId) {
  const product = this.data.productList.find(p =>p.id ===productId)
  if (product) {
      this.setData({
    selectedProductId: productId,
    productInfo: product,
    productSelected: true,
    showPlacementHint: true,
    productPlaced: false
      })
  }
  },

  selectProduct(e) {
  const productId = e.currentTarget.dataset.id
  const product = this.data.productList.find(p =>p.id ===productId)
  this.setData({
      selectedProductId: productId,
      productInfo: product,
      productSelected: true,
      showPlacementHint: true,
      productPlaced: false
  })

  app.trackEvent('ar_select_product', { productId })
  },

  placeProduct() {
  if (!this.data.productSelected) return

  this.setData({
      showPlacementHint: false,
      productPlaced: true
  })

  app.trackEvent('ar_place_product', { 
      productId: this.data.selectedProductId 
  })

  wx.showToast({
      title: '商品已放置',
      icon: 'success',
      duration: 1500
  })
  },

  resetPlacement() {
  this.setData({
      showPlacementHint: true,
      productPlaced: false
  })
  },

  switchCamera() {
  const newPosition = this.data.cameraPosition ==='back' ? 'front' : 'back'
  this.setData({
      cameraPosition: newPosition
  })
  },

  takePhoto() {
  const that = this
  const ctx = wx.createCameraContext()

  ctx.takePhoto({
      quality: 'high',
      success(res) {
    that.setData({
          capturedPhoto: res.tempImagePath,
          showPhotoPreview: true
    })

    app.trackEvent('ar_take_photo', {
          productId: that.data.selectedProductId
    })
      },
      fail(err) {
    console.error('拍照失败', err)
    wx.showToast({
          title: '拍照失败',
          icon: 'none'
    })
      }
  })
  },

  closePhotoPreview() {
  this.setData({
      showPhotoPreview: false,
      capturedPhoto: ''
  })
  },

  savePhoto() {
  const that = this
  wx.saveImageToPhotosAlbum({
      filePath: this.data.capturedPhoto,
      success() {
    wx.showToast({
          title: '已保存到相册',
          icon: 'success'
    })
    that.closePhotoPreview()
      },
      fail() {
    wx.showModal({
          title: '保存失败',
          content: '需要相册权限才能保存图片',
          showCancel: false
    })
      }
  })
  },

  showHelp() {
  this.setData({
      showHelpModal: true
  })
  },

  hideHelp() {
  this.setData({
      showHelpModal: false
  })
  },

  viewProduct() {
  if (!this.data.productInfo) return

  wx.navigateTo({
      url: `/pages/product/detail?id=${this.data.productInfo.id}`
  })
  },

  addToCart() {
  if (!this.data.productInfo) return

  const cart = wx.getStorageSync('cart') || []
  const existingItem = cart.find(item =>item.id ===this.data.productInfo.id)

  if (existingItem) {
      existingItem.quantity++
  } else {
      cart.push({
    ...this.data.productInfo,
    quantity: 1
      })
  }

  wx.setStorageSync('cart', cart)

  wx.showToast({
      title: '已加入购物车',
      icon: 'success'
  })

  app.trackEvent('ar_add_to_cart', {
      productId: this.data.productInfo.id
  })
  }
})
