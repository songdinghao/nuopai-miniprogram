// pages/user/coupon/coupon.js - 优惠券页面
const app = getApp()
const couponManager = require('../../../utils/coupon-manager.js')

Page({
  data: {
  // 当前Tab
  tabs: [
      { id: 'unused', name: '未使用' },
      { id: 'used', name: '已使用' },
      { id: 'expired', name: '已过期' }
  ],
  currentTab: 'unused',

  // 优惠券列表
  couponList: [],
  loading: false,

  // 空状态配置
  emptyState: {
      show: false,
      title: '暂无优惠券',
      desc: '关注商城活动，获取更多优惠'
  },

  // 领券中心弹窗
  showClaimModal: false,
  claimableCoupons: [],

  // 字体大小
  fontSize: 'normal'
  },

  onLoad(options) {
  this.loadUserPreferences()
  this.loadCoupons()
  },

  onShow() {
  this.loadUserPreferences()
  this.loadCoupons()
  },

  loadUserPreferences() {
  const preferences = app.globalData.userPreferences || {}
  const fontSize = preferences.fontSize || 'normal'
  this.setData({ fontSize })
  },

  // Tab切换
  onTabTap(e) {
  const tab = e.currentTarget.dataset.tab
  this.setData({ currentTab: tab })
  this.loadCoupons()
  },

  // 加载优惠券列表
  loadCoupons() {
  this.setData({ loading: true })

  // 模拟加载延迟
  setTimeout(() =>{
      const list = couponManager.getCoupons(this.data.currentTab)
      this.setData({
    couponList: list,
    loading: false,
    'emptyState.show': list.length ===0
      })
  }, 300)
  },

  // 领券中心
  onClaimCoupon() {
  const claimable = couponManager.getClaimableCoupons()
  this.setData({
      claimableCoupons: claimable,
      showClaimModal: true
  })
  },

  // 关闭领券弹窗
  onCloseClaimModal() {
  this.setData({ showClaimModal: false })
  },

  // 领取具体优惠券
  onClaimCouponItem(e) {
  const couponId = e.currentTarget.dataset.id
  const result = couponManager.claimCoupon(couponId)

  if (result.success) {
      wx.showToast({
    title: '领取成功',
    icon: 'success',
    duration: 1500
      })
      // 刷新列表
      this.loadCoupons()
      // 更新领券中心状态
      const claimable = couponManager.getClaimableCoupons()
      this.setData({ claimableCoupons: claimable })
  } else {
      wx.showToast({
    title: result.message,
    icon: 'none',
    duration: 1500
      })
  }
  },

  // 使用优惠券
  onUseCoupon(e) {
  const coupon = e.currentTarget.dataset.coupon
  wx.switchTab({
      url: '/pages/index/index'
  })
  },

  // 阻止弹窗关闭事件冒泡
  onModalTap() {
  // 不做任何操作，仅阻止冒泡
  },

  // 加载更多
  onLoadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreCoupons()
    }
  },

  onShareAppMessage() {
  return {
      title: '诺派永生花 - 优惠券中心',
      path: '/subpackages/user/coupon/coupon'
  }
  }
})
