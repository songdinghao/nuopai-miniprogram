// pages/user/user.js - 用户中心页面
const app = getApp()
const storeConfig = require('../../config/store-config.js')
const referral = require('../../utils/referral.js')
const pointsManager = require('../../utils/points-manager.js')
const notificationManager = require('../../utils/notification-manager.js')

Page({
  data: {
  // 页面状态
  loading: true,
  loadError: false,

  // 用户状态
  isLogin: false,
  userInfo: {},

  // 字体大小
  fontSize: 'normal',
  fontSizeText: '标准',

  // 订单数量统计
  orderCount: {
      pending: 0,
      paid: 0,
      shipped: 0,
      completed: 0,
      refund: 0
  },

  // 邀请好友数据
  inviteCount: 0,

  // 消息通知未读数
  notificationUnread: 0,

  // 兼职妈妈数据
  momData: null,

  // 签到相关
  isCheckedIn: false,
  checkinDays: 0,
  canCheckin: true,
  checkinWeek: [],

  // 浏览历史
  recentHistory: [],
  historyCount: 0,

  // 收藏列表
  recentCollections: [],
  collectionCount: 0
  },

  // 页面加载
  onLoad(options) {

  // 加载用户偏好
  this.loadUserPreferences()

  // 检查登录状态
  this.checkLoginStatus()
  },

  // 页面显示
  onShow() {

  // 检查登录状态
  this.checkLoginStatus()

  // 加载用户数据
  if (this.data.isLogin) {
      this.loadUserData()
  }

  // 加载通知未读数
  this.loadNotificationUnread()

  // 加载兼职妈妈数据
  this.loadMomData()

  // 检查签到状态
  this.checkCheckinStatus()

  // 加载浏览历史
  this.loadBrowseHistory()

  // 加载收藏列表
  this.loadCollections()
  },

  // 下拉刷新
  onPullDownRefresh() {

  if (this.data.isLogin) {
      this.loadUserData()
  }

  setTimeout(() =>{
      wx.stopPullDownRefresh()
  }, 1000)
  },

  // 加载用户偏好
  loadUserPreferences() {
  const preferences = app.globalData.userPreferences || {}
  const fontSize = preferences.fontSize || 'normal'

  let fontSizeText = '标准'
  if (fontSize ==='large') {
      fontSizeText = '大号'
  } else if (fontSize ==='extra-large') {
      fontSizeText = '特大'
  }

  this.setData({
      fontSize,
      fontSizeText
  })
  },

  // 检查登录状态
  checkLoginStatus() {
  const isLogin = app.globalData.isLogin || false
  const userInfo = app.globalData.userInfo || {}

  this.setData({
      isLogin,
      userInfo
  })
  },

  // 加载用户数据
  loadUserData() {
  this.setData({ loading: true, loadError: false })
  this.loadOrderCount()
  this.loadMemberInfo()
  },

  // 加载通知未读数
  loadNotificationUnread() {
  notificationManager.initMockData()
  const unread = notificationManager.getUnreadCount()
  this.setData({ notificationUnread: unread })
  },

  // 点击消息通知
  onNotificationTap() {
  wx.navigateTo({
      url: '/pages/notification/notification'
  })

  app.trackEvent('user_notification_click')
  },

  // 加载订单数量统计
  loadOrderCount() {
  // 从本地存储读取真实订单数据
  try {
      const orders = wx.getStorageSync('orders') || []
      const orderCount = {
    pending: orders.filter(o =>o.status === 'pending').length,
    paid: orders.filter(o =>o.status === 'paid').length,
    shipped: orders.filter(o =>o.status === 'shipped').length,
    completed: orders.filter(o =>o.status === 'completed').length,
    refund: orders.filter(o =>o.status === 'refund' || o.status === 'cancelled').length
      }
      this.setData({ orderCount })
  } catch (e) {
      console.warn('加载订单统计失败', e)
  }
  },

  // 加载会员信息
  loadMemberInfo() {
  // 模拟从服务器获取会员信息
  setTimeout(() =>{
      try {
      const collections = wx.getStorageSync('userCollections') || []
      const coupons = wx.getStorageSync('userCoupons') || []

      let inviteCount = 0
      const userInfo = app.globalData.userInfo || {}
      if (userInfo.id) {
    const stats = referral.getReferralStats(userInfo.id)
    inviteCount = (stats && stats.total) ? stats.total : 0
      }

      const points = pointsManager.getPoints()

      this.setData({
    'userInfo.points': points,
    'userInfo.coupons': coupons.length,
    'userInfo.favorites': collections.length,
    'userInfo.level': 'VIP会员',
    inviteCount,
    loading: false,
    loadError: false
      })
      } catch (e) {
      console.warn('加载会员信息失败', e)
      this.setData({ loading: false, loadError: true })
      }
  }, 600)
  },

  // 点击积分
  onPointsTap() {

  if (!this.checkLogin()) return

  wx.navigateTo({
      url: '/subpackages/user/points/points'
  })

  app.trackEvent('user_points_click')
  },

  //===== ==== = 用户交互事件 = ==== ==== =

  // 点击登录
  onLoginTap() {

  // 跳转到登录页面，带重定向参数使登录后返回用户中心
  wx.navigateTo({
      url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/user/user')
  })

  // 追踪事件
  app.trackEvent('user_login_click', {
      source: 'user_center'
  })
  },

  // 点击设置
  onSettingsTap() {

  wx.showToast({
      title: '即将上线，敬请期待',
      icon: 'none',
      duration: 1500
  })
  },

  // 返回首页
  onGoHome() {
  wx.switchTab({
      url: '/pages/index/index'
  })
  },

  // 点击全部订单
  onAllOrdersTap() {

  if (!this.checkLogin()) return

  wx.navigateTo({
      url: '/pages/order/list'
  })
  },

  // 点击订单
  onOrderTap(e) {
  const status = e.currentTarget.dataset.status

  if (!this.checkLogin()) return

  wx.navigateTo({
      url: `/pages/order/list?status=${status}`
  })

  // 追踪事件
  app.trackEvent('user_order_click', {
      status
  })
  },

  // 点击收货地址
  onAddressTap() {

  if (!this.checkLogin()) return

  wx.navigateTo({
      url: '/pages/user/address/address'
  })

  // 追踪事件
  app.trackEvent('user_address_click')
  },

  // 点击优惠券
  onCouponTap() {

  if (!this.checkLogin()) return

  wx.navigateTo({
      url: '/subpackages/user/coupon/coupon'
  })

  // 追踪事件
  app.trackEvent('user_coupon_click')
  },

  // 点击我的收藏
  onFavoritesTap() {

  wx.navigateTo({
      url: '/pages/user/collection/collection'
  })

  app.trackEvent('user_favorites_click')
  },

  // 点击浏览历史
  onHistoryTap() {

  wx.navigateTo({
      url: '/pages/user/history/history'
  })

  app.trackEvent('user_history_click')
  },

  // 点击在线客服
  onServiceTap() {

  // 直接显示联系方式（后续接入真实企业微信客服后改用 openCustomerServiceChat）
  this.showContactInfo()

  app.trackEvent('user_service_click')
  },

  // 显示联系方式
  showContactInfo() {
  const csConfig = storeConfig.customerService || {}
  const phone = csConfig.phone || '400-000-0000'
  const wechat = csConfig.wechat || 'nuopai_service'
  const workTime = csConfig.workTime || '9:00-18:00'
  wx.showModal({
      title: '联系客服',
      content: `📞 客服电话：${phone}\n💬 客服微信：${wechat}\n🕘 工作时间：${workTime}`,
      confirmText: '复制微信号',
      confirmColor: '#2D8C7A',
      cancelText: '关闭',
      success: (res) =>{
    if (res.confirm) {
          wx.setClipboardData({
      data: wechat,
      success: () =>{
              wx.showToast({
        title: '微信号已复制，请打开微信添加',
        icon: 'success',
        duration: 2000
              })
      }
          })
    }
      }
  })
  },

  // 点击帮助中心
  onHelpTap() {

  wx.navigateTo({
      url: '/pages/help/help'
  })

  app.trackEvent('user_help_click')
  },

  // 点击意见反馈
  onFeedbackTap() {

  wx.navigateTo({
      url: '/pages/feedback/feedback'
  })

  app.trackEvent('user_feedback_click')
  },

  // 点击关于我们
  onAboutTap() {

  wx.showModal({
      title: '关于诺派永生花',
      content: '诺派永生花 - 专注于高品质永生花产品\n\n版本号：1.0.0\n\n© 2024 诺派永生花 版权所有',
      showCancel: false,
      confirmText: '知道了'
  })
  },

  // 点击字体大小
  onFontSizeTap() {

  const items = ['标准', '大号', '特大']
  const currentIndex = items.indexOf(this.data.fontSizeText)

  wx.showActionSheet({
      itemList: items,
      success: (res) =>{
    let fontSize = 'normal'
    let fontSizeText = '标准'

    if (res.tapIndex ===1) {
          fontSize = 'large'
          fontSizeText = '大号'
    } else if (res.tapIndex ===2) {
          fontSize = 'extra-large'
          fontSizeText = '特大'
    }

    // 保存用户偏好
    const preferences = app.globalData.userPreferences || {}
    preferences.fontSize = fontSize
    app.globalData.userPreferences = preferences

    wx.setStorageSync('userPreferences', preferences)

    // 更新页面
    this.setData({
          fontSize,
          fontSizeText
    })

    // 显示提示
    wx.showToast({
          title: `已设置为${fontSizeText}字体`,
          icon: 'success',
          duration: 1500
    })

    // 追踪事件
    app.trackEvent('user_fontsize_change', {
          fontSize
    })
      }
  })
  },

  // 点击账号安全 - 进入账号管理（含注销入口）
  onSecurityTap() {

  wx.showActionSheet({
      itemList: ['账号信息', '注销账号'],
      success: (res) =>{
    if (res.tapIndex ===0) {
          this.showAccountInfo()
    } else if (res.tapIndex ===1) {
          this.onDeleteAccount()
    }
      }
  })
  },

  // 显示账号信息
  showAccountInfo() {
  const userInfo = this.data.userInfo || {}
  const phone = userInfo.phone || '未绑定'
  const nickname = userInfo.nickname || '未设置'
  const level = userInfo.level || '普通会员'

  wx.showModal({
      title: '账号信息',
      content: `昵称：${nickname}\n手机号：${phone}\n会员等级：${level}\n\n如需修改信息，请联系客服`,
      confirmText: '知道了',
      confirmColor: '#2D8C7A',
      showCancel: false
  })
  },

  //===== ==== = 注销账号流程 = ==== ==== =

  // 步骤1：确认注销意愿
  onDeleteAccount() {
  wx.showModal({
      title: '注销账号',
      content: '确定要注销账号吗？\n\n⚠️ 注销后：\n· 个人资料将永久删除\n· 订单记录将不可恢复\n· 积分/优惠券将清空',
      confirmText: '确认注销',
      confirmColor: "#2D8C7A",
      cancelText: '再想想',
      success: (res) =>{
    if (res.confirm) {
          this.verifyPhoneForDelete()
    }
      }
  })
  },

  // 步骤2：手机号验证
  verifyPhoneForDelete() {
  wx.showModal({
      title: '安全验证',
      content: '请输入当前账号绑定的手机号以确认身份',
      confirmText: '验证',
      cancelText: '取消',
      editable: true,
      placeholderText: '请输入手机号',
      success: (res) =>{
    if (res.confirm) {
          const phone = res.content
          if (!phone || !/^1\d{10}$/.test(phone.trim())) {
      wx.showToast({
              title: '请输入正确的手机号',
              icon: 'none',
              duration: 2000
      })
      return
          }
          this.executeAccountDeletion(phone.trim())
    }
      }
  })
  },

  // 步骤3：执行注销
  executeAccountDeletion(phone) {
  wx.showLoading({
      title: '注销处理中...',
      mask: true
  })

  const app = getApp()

  // 模拟调用后端注销接口
  setTimeout(() =>{
      // 清除所有用户数据，保留购物车和偏好设置
      const keysToRemove = [
    'userInfo',
    'token',
    'tokenExpireTime',
    'isLogin',
    'orders',
    'userCollections',
    'userCoupons',
    'unreadNotifications',
    'tempOrder_direct',
    'tempOrder_cart',
    'hasGivenNewUserCoupon',
    'lastWelcomeDate',
    'inviter',
    'privacyAgreed',
    'privacyAgreedDate',
    'privacyAgreedVersion',
    'searchHistory'
      ]
      keysToRemove.forEach(key =>{
    try {
          wx.removeStorageSync(key)
    } catch (e) {
          console.warn('清除存储失败', key, e)
    }
      })

      // 更新全局状态
      app.globalData.isLogin = false
      app.globalData.userInfo = null
      app.globalData.token = null

      wx.hideLoading()

      wx.showModal({
    title: '账号已注销',
    content: '您的账号已成功注销。所有个人数据已被清除。\n\n感谢您曾使用诺派永生花，期待未来再次为您服务。',
    confirmText: '我知道了',
    showCancel: false,
    success: () =>{
          this.setData({
      isLogin: false,
      userInfo: {}
          })
    }
      })

      // 追踪事件
      app.trackEvent('user_account_deleted', { phone })
  }, 1500)
  },

  // 点击退出登录
  onLogoutTap() {

  wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      confirmColor: "#2D8C7A",
      cancelText: '取消',
      success: (res) =>{
    if (res.confirm) {
          this.doLogout()
    }
      }
  })
  },

  // 执行退出登录
  doLogout() {
  // 清除全局状态
  app.globalData.isLogin = false
  app.globalData.userInfo = null
  app.globalData.token = ''

  // 选择性清除用户相关数据，保留购物车和用户偏好
  const keysToRemove = [
      'userInfo',
      'token',
      'tokenExpireTime',
      'orders',
      'userCollections',
      'userCoupons',
      'isLogin',
      'inviter',
      'unreadNotifications',
      'tempOrder_direct',
      'tempOrder_cart',
      'hasGivenNewUserCoupon',
      'lastWelcomeDate',
      'mom_user_data'
  ]
  keysToRemove.forEach(key =>{
      try {
    wx.removeStorageSync(key)
      } catch (e) {
    console.warn('清除存储失败', key, e)
      }
  })

  // 立即重置页面所有用户相关数据，避免残留
  this.setData({
      isLogin: false,
      userInfo: {},
      orderCount: {
    pending: 0,
    paid: 0,
    shipped: 0,
    completed: 0,
    refund: 0
      },
      notificationUnread: 0,
      inviteCount: 0
  })

  wx.showToast({
      title: '已退出登录',
      icon: 'success',
      duration: 1500
  })

  app.trackEvent('user_logout')
  },

  // 点击邀请好友
  onInviteTap() {

  if (!this.checkLogin()) return

  wx.navigateTo({
      url: '/pages/invite/invite'
  })

  app.trackEvent('user_invite_click')
  },

  // 点击纪念日提醒
  onAnniversaryTap() {

  if (!this.checkLogin()) return

  wx.navigateTo({
      url: '/pages/anniversary/anniversary'
  })

  app.trackEvent('user_anniversary_click')
  },

  // 检查登录状态
  checkLogin() {
  if (!this.data.isLogin) {
      wx.showModal({
    title: '需要登录',
    content: '此功能需要登录后才能使用，是否去登录？',
    confirmText: '去登录',
    confirmColor: "#2D8C7A",
    cancelText: '取消',
    success: (res) =>{
          if (res.confirm) {
      wx.navigateTo({
              url: '/pages/login/login'
      })
          }
    }
      })
      return false
  }
  return true
  },

  // 加载兼职妈妈数据
  loadMomData() {
  let momData = app.globalData.momData || wx.getStorageSync('momData') || null

  // 确保数据结构包含统计字段
  if (momData && momData.isMom) {
    momData = {
    ...momData,
    shareCount: momData.shareCount || 0,
    validOrders: momData.validOrders || 0,
    totalEarnings: momData.totalEarnings || momData.earnings || 0
    }
  }

  this.setData({ momData })
  app.globalData.momData = momData
  },

  // 重试加载用户数据
  retryLoadUserData() {
    this.loadUserData()
  },

  // ========== 浏览历史 ==========

  // 加载浏览历史（最近6条）
  loadBrowseHistory() {
    try {
      const history = wx.getStorageSync('browse_history') || []
      const recentHistory = history.slice(0, 6)
      this.setData({
        recentHistory,
        historyCount: history.length
      })
    } catch (e) {
      console.warn('加载浏览历史失败', e)
    }
  },

  // ========== 收藏列表 ==========

  // 加载收藏列表（最近6条）
  loadCollections() {
    try {
      const collections = wx.getStorageSync('userCollections') || []
      const recentCollections = collections.slice(0, 6)
      this.setData({
        recentCollections,
        collectionCount: collections.length
      })
    } catch (e) {
      console.warn('加载收藏列表失败', e)
    }
  },

  // 点击收藏中的商品
  onCollectionItemTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product/detail?id=${id}`
    })
  },

  // 删除收藏（从用户页面）
  onDeleteCollection(e) {
    const id = e.currentTarget.dataset.id
    let collections = wx.getStorageSync('userCollections') || []
    collections = collections.filter(item => item.id !== id)
    wx.setStorageSync('userCollections', collections)
    this.loadCollections()
    // 同步更新会员卡片收藏数
    this.setData({
      'userInfo.favorites': collections.length
    })
    wx.showToast({ title: '已取消收藏', icon: 'success', duration: 1000 })
  },

  // 点击浏览历史中的商品
  onHistoryItemTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product/detail?id=${id}`
    })
  },

  // 查看全部收藏
  onViewAllCollections() {
    wx.navigateTo({
      url: '/pages/user/collection/collection'
    })
  },

  // ========== 签到功能 ==========

  // 获取今天的日期字符串 YYYY-MM-DD
  _getTodayStr() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  },

  // 获取昨天的日期字符串
  _getYesterdayStr() {
    const now = new Date()
    now.setDate(now.getDate() - 1)
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  },

  // 检查签到状态
  checkCheckinStatus() {
    try {
      const lastCheckinDate = wx.getStorageSync('last_checkin_date') || ''
      const todayStr = this._getTodayStr()
      const isCheckedIn = lastCheckinDate === todayStr
      const checkinDays = wx.getStorageSync('checkin_streak') || 0

      // 如果昨天没签到，连续天数重置
      const yesterdayStr = this._getYesterdayStr()
      if (checkinDays > 0 && lastCheckinDate !== todayStr && lastCheckinDate !== yesterdayStr) {
        wx.setStorageSync('checkin_streak', 0)
        this.setData({ checkinDays: 0 })
      }

      // 生成最近7天签到记录
      const checkinWeek = this._generateCheckinWeek(lastCheckinDate, checkinDays)

      this.setData({
        isCheckedIn,
        checkinDays,
        canCheckin: !isCheckedIn,
        checkinWeek
      })
    } catch (e) {
      console.warn('检查签到状态失败', e)
    }
  },

  // 生成最近7天签到记录
  _generateCheckinWeek(lastCheckinDate, streak) {
    const week = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      // 从最后签到日往前推 streak 天都是已签到
      let checked = false
      if (lastCheckinDate) {
        const lastDate = new Date(lastCheckinDate)
        const diffDays = Math.floor((lastDate - d) / 86400000)
        if (diffDays >= 0 && diffDays < streak) {
          checked = true
        }
      }
      week.push({
        date: dateStr,
        label: i === 0 ? '今' : (i === 1 ? '昨' : `${d.getMonth() + 1}/${d.getDate()}`),
        checked: checked
      })
    }
    return week
  },

  // 执行签到
  onCheckin() {
    if (!this.checkLogin()) return

    if (this.data.isCheckedIn) {
      wx.showToast({ title: '今天已经签到过了', icon: 'none' })
      return
    }

    try {
      const todayStr = this._getTodayStr()
      const yesterdayStr = this._getYesterdayStr()
      const lastCheckinDate = wx.getStorageSync('last_checkin_date') || ''
      let checkinDays = wx.getStorageSync('checkin_streak') || 0

      // 判断连续签到
      if (lastCheckinDate === yesterdayStr) {
        checkinDays += 1
      } else {
        checkinDays = 1
      }

      // 计算积分奖励
      let pointsReward = 5
      let rewardText = '+5积分'
      if (checkinDays % 7 === 0) {
        pointsReward = 20
        rewardText = '连续7天签到 +20积分'
      }

      // 增加积分
      pointsManager.addPoints(pointsReward, '每日签到奖励')

      // 更新存储
      wx.setStorageSync('last_checkin_date', todayStr)
      wx.setStorageSync('checkin_streak', checkinDays)

      // 更新页面数据
      const checkinWeek = this._generateCheckinWeek(todayStr, checkinDays)
      this.setData({
        isCheckedIn: true,
        checkinDays,
        canCheckin: false,
        checkinWeek,
        'userInfo.points': pointsManager.getPoints()
      })

      wx.showToast({
        title: `签到成功！${rewardText}`,
        icon: 'success',
        duration: 2000
      })

      app.trackEvent('user_checkin', { streak: checkinDays, points: pointsReward })
    } catch (e) {
      console.warn('签到失败', e)
      wx.showToast({ title: '签到失败，请重试', icon: 'none' })
    }
  },

  // 点击兼职妈妈体验官
  onMomTap() {
  const momData = this.data.momData
  if (momData && momData.isMom) {
      wx.navigateTo({
    url: '/pages/mom/home/home'
      })
  } else {
      wx.navigateTo({
    url: '/pages/mom/activate/activate'
      })
  }
  },

  // 分享
  onShareAppMessage() {
  return {
      title: '诺派永生花 - 高品质永生花产品',
      path: '/pages/index/index',
      imageUrl: '/assets/share-share.png'
  }
  },

  // 分享到朋友圈
  onShareTimeline() {
  return {
      title: '诺派永生花 - 高品质永生花产品，让家更温馨',
      query: '',
      imageUrl: '/assets/share/timeline-share.jpg'
  }
  },

  // 字体大小变化回调
  onFontSizeChange(fontSize) {
  let fontSizeText = '标准'
  if (fontSize === 'large') {
      fontSizeText = '大号'
  } else if (fontSize === 'extra-large') {
      fontSizeText = '特大'
  }
  this.setData({ fontSize, fontSizeText })
  }
})
