// pages/user/points/points.js - 积分页面
const app = getApp()
const pointsManager = require('../../../utils/points-manager.js')

Page({
  data: {
  // 积分总数
  totalPoints: 0,
  totalPointsDisplay: '¥0.0',

  // 积分明细
  pointsList: [],
  earnCount: 0,
  spendCount: 0,
  page: 1,
  pageSize: 15,
  hasMore: true,
  loading: false,

  // 积分兑换商品
  exchangeItems: [
      { id: 'ex1', name: '5元优惠券', points: 500, icon: '🎫', desc: '满50元可用' },
      { id: 'ex2', name: '10元优惠券', points: 800, icon: '🎟️', desc: '满100元可用' },
      { id: 'ex3', name: '永生花迷你摆件', points: 1500, icon: '🌸', desc: '随机款式' },
      { id: 'ex4', name: '精美贺卡', points: 200, icon: '💌', desc: '手写祝福' },
      { id: 'ex5', name: '包邮券', points: 300, icon: '📦', desc: '全国包邮' },
      { id: 'ex6', name: '生日专属礼盒', points: 2000, icon: '🎁', desc: '限量50份' }
  ],

  // 空状态
  emptyState: {
      show: false,
      title: '暂无积分记录',
      desc: '购物可获得积分，积分可抵扣现金'
  },

  // 积分规则弹窗
  showRulesModal: false,

  // 字体大小
  fontSize: 'normal'
  },

  onLoad(options) {
  this.loadUserPreferences()
  this.loadPointsData()
  },

  onShow() {
  this.loadUserPreferences()
  this.loadPointsData()
  },

  onPullDownRefresh() {
  this.setData({ page: 1, hasMore: true })
  this.loadPointsData().then(() =>{
      wx.stopPullDownRefresh()
  })
  },

  onReachBottom() {
  if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
  }
  },

  loadUserPreferences() {
  const preferences = app.globalData.userPreferences || {}
  const fontSize = preferences.fontSize || 'normal'
  this.setData({ fontSize })
  },

  // 加载积分数据
  loadPointsData() {
  this.setData({ loading: true })

  return new Promise((resolve) =>{
      setTimeout(() =>{
    const result = pointsManager.getPointsHistory(1, this.data.pageSize)

    // 预计算展示值（WXML不支持方法调用）
    const totalPointsDisplay = '¥' + (result.total / 100).toFixed(1)
    const earnCount = result.list.filter(i =>i.type ==='earn').length
    const spendCount = result.list.filter(i =>i.type ==='spend').length

    this.setData({
          totalPoints: result.total,
          totalPointsDisplay,
          pointsList: result.list,
          earnCount,
          spendCount,
          loading: false,
          page: 1,
          hasMore: result.hasMore,
          'emptyState.show': result.list.length ===0
    })
    resolve()
      }, 300)
  })
  },

  // 加载更多
  loadMore() {
  this.setData({ loading: true })

  setTimeout(() =>{
      const nextPage = this.data.page + 1
      const result = pointsManager.getPointsHistory(nextPage, this.data.pageSize)

      const allItems = [...this.data.pointsList, ...result.list]
      const earnCount = allItems.filter(i =>i.type ==='earn').length
      const spendCount = allItems.filter(i =>i.type ==='spend').length

      this.setData({
    pointsList: allItems,
    earnCount,
    spendCount,
    loading: false,
    page: nextPage,
    hasMore: result.hasMore
      })
  }, 300)
  },

  // 积分规则
  onRulesTap() {
  this.setData({ showRulesModal: true })
  },

  // 积分兑换
  onExchangeTap(e) {
  const item = e.currentTarget.dataset.item
  if (!item) return

  if (this.data.totalPoints < item.points) {
      wx.showToast({
    title: `积分不足，还差${item.points - this.data.totalPoints}积分`,
    icon: 'none',
    duration: 2000
      })
      return
  }

  wx.showModal({
      title: '确认兑换',
      content: `确定使用 ${item.points} 积分兑换"${item.name}"吗？`,
      confirmText: '确认兑换',
      confirmColor: '#2D8C7A',
      cancelText: '再想想',
      success: (res) => {
    if (res.confirm) {
          wx.showToast({
      title: '兑换成功！',
      icon: 'success',
      duration: 1500
          })
          // 扣减积分
          this.setData({
      totalPoints: this.data.totalPoints - item.points,
      totalPointsDisplay: '¥' + ((this.data.totalPoints - item.points) / 100).toFixed(1)
          })
    }
      }
  })

  app.trackEvent('points_exchange', { item: item.id })
  },

  // 关闭规则弹窗
  onCloseRulesModal() {
  this.setData({ showRulesModal: false })
  },

  // 阻止弹窗关闭事件冒泡
  onModalTap() {
  // 不做任何操作，仅阻止冒泡
  },

  onShareAppMessage() {
  return {
      title: '诺派永生花 - 我的积分',
      path: '/subpackages/user/points/points'
  }
  }
})
