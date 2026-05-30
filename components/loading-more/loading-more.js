// components/loading - more/loading - more.js - 加载更多组件
Component({
  properties: {
  // 当前状态：loading / no - more / error
  status: {
      type: String,
      value: 'loading'
  },
  // 加载完成的提示文字
  noMoreText: {
      type: String,
      value: '— 已经到底了 —'
  },
  // 加载中提示文字
  loadingText: {
      type: String,
      value: '正在加载...'
  },
  // 错误提示文字
  errorText: {
      type: String,
      value: '加载失败，点击重试'
  },
  // 是否显示（底部距离触发）
  hasMore: {
      type: Boolean,
      value: true
  }
  },

  methods: {
  // 点击重试
  onRetry() {
      this.setData({ status: 'loading' })
      this.triggerEvent('retry')
  }
  }
})
