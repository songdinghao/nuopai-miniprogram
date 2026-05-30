// components/ar - preview/ar - preview.js - AR预览入口组件
Component({
  properties: {
  // 商品ID
  productId: {
      type: Number,
      value: 0
  },
  // 商品图片
  productImage: {
      type: String,
      value: ''
  },
  // 按钮类型：icon - 图标 / button - 按钮 / floating - 悬浮
  type: {
      type: String,
      value: 'icon'
  }
  },

  data: {
  arSupported: false,
  checking: true
  },

  lifetimes: {
  attached() {
      this.checkARSupport()
  }
  },

  methods: {
  // 检查AR支持
  checkARSupport() {
      try {
    const app = getApp()
    const supported = app.globalData.arSupported ===true
    this.setData({
          arSupported: supported,
          checking: false
    })
      } catch (err) {
    // 降级检测
    const supported = !!wx.createCameraContext
    this.setData({
          arSupported: supported,
          checking: false
    })
      }
  },

  // 点击AR预览
  onTap() {
      if (!this.data.arSupported) {
    wx.showToast({
          title: '当前设备不支持AR功能',
          icon: 'none',
          duration: 2000
    })
    return
      }

      wx.navigateTo({
    url: `/pages/ar/ar?productId=${this.data.productId}&image=${encodeURIComponent(this.data.productImage)}`,
    fail: (err) => {
        console.error('AR页面跳转失败:', err)
        wx.showToast({
            title: '打开AR预览失败',
            icon: 'none',
            duration: 2000
        })
    }
      })

      this.triggerEvent('tap', {
    productId: this.data.productId
      })
  },

  // 进入AR页面入口
  enterAR() {
      this.onTap()
  }
  }
})
