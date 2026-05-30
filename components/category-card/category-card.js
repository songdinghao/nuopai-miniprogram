// components/category - card/category - card.js - 分类卡片组件
Component({
  properties: {
  // 分类数据
  category: {
      type: Object,
      value: {
    id: 0,
    name: '',
    icon: '',
    image: '',
    count: 0
      }
  },
  // 展示模式：icon - 图标模式 / card - 卡片模式
  mode: {
      type: String,
      value: 'icon'
  },
  // 是否当前选中
  active: {
      type: Boolean,
      value: false
  }
  },

  data: {
  imageError: false
  },

  methods: {
  onImageError() {
      this.setData({ imageError: true })
  },

  onTap() {
      this.triggerEvent('tap', { category: this.data.category })
  }
  }
})
