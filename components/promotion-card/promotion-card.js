// components/promotion - card/promotion - card.js - 促销卡片组件
Component({
  properties: {
  // 促销活动数据
  promotion: {
      type: Object,
      value: {
    id: 0,
    title: '',
    subtitle: '',
    image: '',
    bgColor: '#FF9A3D',
    type: 'discount', // discount / coupon / flash
    discount: '',
    endTime: 0,
    link: ''
      }
  },
  // 布局类型：card - 卡片 / banner - 横幅
  layout: {
      type: String,
      value: 'card'
  }
  },

  data: {
  countdown: '',
  imageError: false
  },

  lifetimes: {
  attached() {
      this._timer = null
      if (this.data.promotion.endTime) {
    this.startCountdown()
      }
  },
  detached() {
      this.clearTimer()
  }
  },

  methods: {
  startCountdown() {
      this.updateCountdown()
      this._timer = setInterval(() =>{
    this.updateCountdown()
      }, 1000)
  },

  updateCountdown() {
      const now = Date.now()
      const end = this.data.promotion.endTime
      const diff = end - now

      if (diff <=0) {
    this.setData({ countdown: '已结束' })
    this.clearTimer()
    return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      this.setData({
    countdown: `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`
      })
  },

  pad(n) {
      return n < 10 ? '0' + n : '' + n
  },

  clearTimer() {
      if (this._timer) {
    clearInterval(this._timer)
    this._timer = null
      }
  },

  onImageError() {
      this.setData({ imageError: true })
  },

  onTap() {
      this.triggerEvent('tap', { promotion: this.data.promotion })
  }
  }
})
