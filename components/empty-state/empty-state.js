// components/empty - state/empty - state.js - 空状态组件
Component({
  properties: {
  // 空状态类型
  type: {
      type: String,
      value: 'default' // default / cart / search / order / coupon / network
  },
  // 自定义图标（emoji或文字）
  icon: {
      type: String,
      value: ''
  },
  // 标题
  title: {
      type: String,
      value: ''
  },
  // 描述文字
  description: {
      type: String,
      value: ''
  },
  // 操作按钮文本（空字符串时隐藏按钮）
  buttonText: {
      type: String,
      value: ''
  },
  // 按钮跳转路径
  buttonUrl: {
      type: String,
      value: ''
  }
  },

  data: {
  displayIcon: '',
  displayTitle: '',
  displayDesc: ''
  },

  observers: {
  type(type) {
      this.updateContent(type)
  },
  'icon, title, description'(icon, title, desc) {
      // 如果手动设置了值，优先使用
      if (icon || title || desc) {
    this.setData({
          displayIcon: icon || this.data.displayIcon,
          displayTitle: title || this.data.displayTitle,
          displayDesc: desc || this.data.displayDesc
    })
      }
  }
  },

  lifetimes: {
  attached() {
      this.updateContent(this.data.type)
  }
  },

  methods: {
  // 根据类型更新内容
  updateContent(type) {
      const config = {
    default: {
          icon: '📦',
          title: '暂无内容',
          description: '这里还没有任何内容'
    },
    cart: {
          icon: '🛒',
          title: '购物车是空的',
          description: '快去挑选心仪的永生花吧',
          buttonText: this.data.buttonText || '去逛逛'
    },
    search: {
          icon: '🔍',
          title: '没有找到相关商品',
          description: '换个关键词试试吧',
          buttonText: this.data.buttonText || '浏览全部'
    },
    order: {
          icon: '📋',
          title: '暂无订单',
          description: '还没有下单记录'
    },
    coupon: {
          icon: '🎫',
          title: '暂无优惠券',
          description: '关注商城活动，获取更多优惠'
    },
    network: {
          icon: '📶',
          title: '网络开小差了',
          description: '请检查网络连接后重试',
          buttonText: this.data.buttonText || '重新加载'
    }
      }

      const preset = config[type] || config.default

      this.setData({
    displayIcon: this.data.icon || preset.icon,
    displayTitle: this.data.title || preset.title,
    displayDesc: this.data.description || preset.description,
    // 如果外部没有设置buttonText，使用预设的
    displayButtonText: this.data.buttonText || preset.buttonText || ''
      })
  },

  // 点击操作按钮
  onAction() {
      const { buttonUrl } = this.data

      if (buttonUrl) {
    wx.switchTab({
          url: buttonUrl,
          fail: () =>{
      wx.navigateTo({
              url: buttonUrl,
              fail: () =>{
        wx.redirectTo({ url: buttonUrl })
              }
      })
          }
    })
      }

      this.triggerEvent('action')
  }
  }
})
