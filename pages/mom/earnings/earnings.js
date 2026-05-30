const app = getApp()
const momEarnings = require('../../../utils/mom-earnings.js')

Page({
  data: {
  loading: false,
  totalEarnings: '0.00',
  pendingEarnings: '0.00',
  settledEarnings: '0.00',
  earningsList: [],
  filterType: '',
  monthlyStats: null,
  monthlyYear: '',
  monthlyMonth: ''
  },

  onShow() {
  this.loadEarnings()
  },

  loadEarnings() {
  this.setData({ loading: true })

  // 从 mom - earnings 数据层读取
  const userData = momEarnings.getMomUserData()
  const momData = userData.momData || {}
  this.setData({
      loading: false,
      totalEarnings: (momData.totalEarnings || 0).toFixed(2),
      pendingEarnings: (momData.pendingEarnings || 0).toFixed(2),
      settledEarnings: (momData.settledEarnings || 0).toFixed(2)
  })

  // 检查并结算到期收益
  momEarnings.autoCheckSettlements()

  // 获取收益列表（按类型筛选）
  const list = momEarnings.getFilteredEarnings(this.data.filterType || null)
  const formattedList = list.map(item => ({
    ...item,
    formattedCreatedAt: (item.createdAt || '').slice(0, 10)
  }))
  this.setData({ earningsList: formattedList })

  // 月度统计
  const stats = momEarnings.getEarningsStats()
  const now = new Date()
  this.setData({
      monthlyStats: stats,
      monthlyYear: now.getFullYear(),
      monthlyMonth: now.getMonth() + 1
  })
  },

  onFilterChange(e) {
  const type = e.currentTarget.dataset.type
  this.setData({ filterType: type }, () =>{
      this.loadEarnings()
  })
  }
})
