// components/product - card/product - card.js - 商品卡片组件
Component({
  properties: {
  // 商品数据
  product: {
      type: Object,
      value: {
    id: 0,
    title: '',
    name: '',
    price: 0,
    originalPrice: 0,
    image: '',
    tags: [],
    sales: 0
      }
  },
  // 列表布局：grid - 网格(双列) / list - 列表(单行)
  layout: {
      type: String,
      value: 'grid'
  }
  },

  data: {
  imageLoaded: false,
  imageError: false
  },

  methods: {
  // 图片加载完成
  onImageLoad() {
      this.setData({ imageLoaded: true })
  },

  // 图片加载失败
  onImageError() {
      this.setData({ imageError: true })
  },

  // 点击商品卡片
  onTap() {
      const { id } = this.data.product
      if (id) {
    wx.navigateTo({
          url: `/pages/product/detail?id=${id}`
    })
      }
      this.triggerEvent('tap', { product: this.data.product })
  },

  // 点击加入购物车
  onAddCart(e) {
      if (e && e.stopPropagation) e.stopPropagation()
      this.triggerEvent('addcart', { product: this.data.product })
  }
  }
})
