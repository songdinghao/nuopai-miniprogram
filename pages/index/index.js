// pages/index/index.js - 首页（针对30 - 60岁主妇优化）
const app = getApp()
const storeConfig = require('../../config/store-config.js')
const anniversary = require('../../utils/anniversary.js')
const api = require('../../utils/api.js')
const productsData = require('../../data/products.js')
const analytics = require('../../utils/analytics.js')

Page({
  data: {
  // 用户信息
  userInfo: null,
  isLogin: false,

  // 页面状态
  loading: true,
  // 各模块独立加载/错误状态
  bannersLoading: true,
  bannersError: false,
  hotProductsLoading: true,
  hotProductsError: false,
  sceneBundlesLoading: true,
  sceneBundlesError: false,
  categoriesLoading: true,
  categoriesError: false,

  // 首页数据（雅集布局）
  banners: [],          // 轮播横幅
  hotProducts: [],      // 编辑推荐（热销商品）
  sceneTags: [          // 场景导航
      { id: 'all', name: '推荐', emoji: '🌱' },
      { id: 'xuanguan', name: '玄关端景', emoji: '🏠' },
      { id: 'keting', name: '客厅茶几', emoji: '🛋️' },
      { id: 'canting', name: '餐厅装饰', emoji: '🍽️' },
      { id: 'woshi', name: '卧室床头', emoji: '🛏️' },
      { id: 'shufang', name: '书房清供', emoji: '📚' },
      { id: 'songli', name: '送礼', emoji: '🎁' }
  ],
  sceneBundles: [],     // 场景搭配灵感
  currentScene: 'all',

  // 语音搜索状态
  voiceSearching: false,

  // 字体大小
  fontSize: 'normal',

  // 搜索历史
  searchHistory: [],
  hotKeywords: ['永生花', '客厅摆件', '玄关装饰', '母亲节礼物', '玫瑰'],

  // 纪念日提醒
  annivReminder: null,

  // 通知数量
  notificationCount: 0,

  // 隐私授权
  needPrivacyAuth: false,

  // 优惠券弹窗
  showCouponPopup: false,
  claimableCoupons: [],

  // 猜你喜欢
  guessYouLike: [],
  guessYouLikeLoading: true,
  guessYouLikeError: false,

  // 分页状态
  page: 1,
  hasMore: true
  },

  // 页面加载
  onLoad(options) {

  app.globalData.currentPage = 'index'

  // 追踪页面访问
  app.trackEvent('page_view', { page: 'index' })

  // 检查分享参数
  if (options.inviter) {
      this.handleInvite(options.inviter)
  }

  // 检查AR支持
  this.checkARSupport()

  // 加载用户偏好
  this.loadUserPreferences()

  // 加载搜索历史
  this.loadSearchHistory()

  this.initPageData()
  },

  // 页面显示
  onShow() {

  // 埋点：页面浏览
  analytics.trackPageView('home')

  // 检查用户登录状态
  this.checkLoginStatus()

  // 更新购物车数量
  this.updateCartCount()

  // 检查是否有待处理的通知
  this.checkNotifications()

  // 检查纪念日提醒
  this.checkAnniversaryReminder()

  // 显示今日推荐（根据时间）
  this.showDailyRecommendation()

  // 检查隐私授权状态
  this.setData({
      needPrivacyAuth: app.globalData.needPrivacyAuth
  })

  // 检查兼职妈妈状态
  this.checkMomStatus()

  // 检查是否有新发优惠券通知（首单/复购券）
  this.checkNewCouponNotice()
  },

  // 页面初次渲染完成
  onReady() {

  // 页面渲染完成后，可以执行一些动画或交互
  setTimeout(() =>{
      this.animateWelcome()
  }, 500)
  },

  // 页面隐藏
  onHide() {
    // 安全关闭loading，防止离开页面时 showLoading/hideLoading 不配对
    if (this._loadingShown) {
      wx.hideLoading()
      this._loadingShown = false
    }
  },

  // 页面卸载
  onUnload() {
    if (this._loadingShown) {
      wx.hideLoading()
      this._loadingShown = false
    }
  },

  // 下拉刷新
  onPullDownRefresh() {

  // 显示刷新动画
  this.setData({ refreshing: true })

  // 重新加载数据
  this.refreshData()
  },

  // 上拉加载更多
  onReachBottom() {

  // 加载更多商品
  this.loadMoreProducts()
  },

  // 分享
  onShareAppMessage() {

  // 追踪分享事件
  app.trackEvent('share', { page: 'index', type: 'homepage' })

  return {
      title: '诺派永生花商城 - 高品质家居装饰，让家更温馨',
      path: '/pages/index/index?inviter=' + (this.data.userInfo?.id || 'system'),
      imageUrl: '/assets/share/homepage-share.jpg'
  }
  },

  // 分享到朋友圈
  onShareTimeline() {

  // 追踪朋友圈分享
  app.trackEvent('share_timeline', { page: 'index' })

  return {
      title: '发现一个超美的永生花商城，家居装饰必备！',
      query: 'inviter=' + (this.data.userInfo?.id || 'system'),
      imageUrl: '/assets/share/timeline-share.jpg'
  }
  },

  initPageData() {
  // 防止重复初始化
  if (this._initializing) return
  this._initializing = true

  // 各模块并行加载，允许部分失败
  const modules = [
    { key: 'banners', fn: this.loadBanners() },
    { key: 'hotProducts', fn: this.loadHotProducts() },
    { key: 'sceneBundles', fn: this.loadSceneBundles() },
    { key: 'categories', fn: this.loadCategories() }
  ]

  Promise.allSettled(modules.map(m => m.fn))
    .then(results => {
      const updates = { loading: false }
      results.forEach((r, i) => {
        const key = modules[i].key
        updates[`${key}Loading`] = false
        if (r.status === 'rejected') {
          updates[`${key}Error`] = true
          console.error(`[index] ${key} 加载失败:`, r.reason)
        } else {
          updates[`${key}Error`] = false
        }
      })
      this.setData(updates)
      this._initializing = false

      app.trackEvent('page_loaded', {
        page: 'index',
        load_time: Date.now(),
        data_count: {
          banners: this.data.banners.length,
          hot_products: this.data.hotProducts.length,
          scene_bundles: this.data.sceneBundles.length
        }
      })

      this.showLoadCompleteTip()
      this.checkCouponPopup()

      // 加载猜你喜欢（依赖hotProducts已加载）
      this.loadGuessYouLike()
    })
  },

  // 检查AR支持
  checkARSupport() {
  const arSupported = app.globalData.arSupported || false
  this.setData({ arSupported })

  if (arSupported) {
  } else {
  }
  },

  // 加载场景搭配
  loadSceneBundles() {
  this.setData({ sceneBundlesLoading: true, sceneBundlesError: false })
  return new Promise((resolve, reject) =>{
      setTimeout(() =>{
    try {
      const sceneBundles = [
        { id: 'bundle1', name: '玄关入门搭配', emoji: '🏠', bgColor: '#E1F5EE', productCount: 3, totalPrice: 668 },
        { id: 'bundle2', name: '客厅轻奢方案', emoji: '🛋️', bgColor: '#FAEEDA', productCount: 2, totalPrice: 528 },
        { id: 'bundle3', name: '餐厅温馨布置', emoji: '🍽️', bgColor: '#F5EDE6', productCount: 2, totalPrice: 398 },
        { id: 'bundle4', name: '卧室床头花艺', emoji: '🛏️', bgColor: '#E8EDE8', productCount: 2, totalPrice: 436 }
      ]
      this.setData({ sceneBundles, sceneBundlesLoading: false })
      resolve()
    } catch (e) {
      this.setData({ sceneBundlesLoading: false, sceneBundlesError: true, sceneBundles: [] })
      reject(e)
    }
      }, 200)
  })
  },

  //===== 优惠券弹窗 = ====

  // 检查并展示优惠券弹窗（关闭后5分钟/查看后当日不再弹）
  checkCouponPopup() {
  // 隐私授权未完成时不展示
  if (this.data.needPrivacyAuth) return

  try {
      const couponManager = require('../../utils/coupon-manager.js')
      const claimable = couponManager.getClaimableCoupons()
      const available = claimable.filter(c =>!c.claimed)
      if (available.length ===0) return

      // 检查冷却期
      // TODO: 冷却期判断应在服务端完成，本地时间可被篡改
      const now = Date.now()
      const popupDismiss = wx.getStorageSync('couponPopupDismiss') || 0
      const popupViewDay = wx.getStorageSync('couponPopupViewDay') || ''
      const today = new Date().toDateString()

      // 当日已查看 → 不展示
      if (popupViewDay ===today) return
      // 关闭后未满5分钟 → 不展示
      if (now - popupDismiss < 5 * 60 * 1000) return

      this.setData({
    claimableCoupons: claimable,
    showCouponPopup: true
      })
  } catch (e) {
      console.warn('优惠券弹窗加载失败: ', e)
  }
  },

  // 关闭优惠券弹窗（5分钟冷却）
  onCloseCoupon() {
  this.setData({ showCouponPopup: false })
  wx.setStorageSync('couponPopupDismiss', Date.now())
  },

  // 领取优惠券
  onClaimCoupon(e) {
  const couponId = e.currentTarget.dataset.id
  const couponName = e.currentTarget.dataset.name
  try {
      const couponManager = require('../../utils/coupon-manager.js')
      const result = couponManager.claimCoupon(couponId)
      if (result.success) {
    wx.showToast({ title: '领取成功', icon: 'success', duration: 1500 })
    // 当日不再弹窗
    wx.setStorageSync('couponPopupViewDay', new Date().toDateString())
    this.setData({ showCouponPopup: false })
    // 刷新列表
    const claimable = couponManager.getClaimableCoupons()
    this.setData({ claimableCoupons: claimable })
      } else {
    wx.showToast({ title: result.reason || '领取失败', icon: 'none' })
      }
  } catch (e) {
      console.warn('领取优惠券失败: ', e)
  }
  },

  // 查看全部优惠券
  onViewAllCoupons() {
  wx.setStorageSync('couponPopupViewDay', new Date().toDateString())
  this.setData({ showCouponPopup: false })
  wx.navigateTo({
      url: '/subpackages/user/coupon/coupon'
  })
  },

  // 检查新发优惠券通知（首单/复购券发放后，从订单页返回首页时弹窗提醒）
  checkNewCouponNotice() {
    try {
      const notice = wx.getStorageSync('new_coupon_notice')
      if (!notice || !notice.name) return

      // 避免重复弹窗：同一个 notice 只弹一次
      if (this._lastCouponNoticeTime === notice.time) return
      this._lastCouponNoticeTime = notice.time

      wx.showModal({
        title: '🎉 恭喜获得优惠券',
        content: `您已获得「${notice.name}」（${notice.amount}元），快去使用吧！`,
        confirmText: '去使用',
        cancelText: '稍后查看',
        confirmColor: '#2D8C7A',
        success: (res) => {
          // 清除通知标记
          wx.removeStorageSync('new_coupon_notice')
          if (res.confirm) {
            wx.navigateTo({ url: '/subpackages/user/coupon/coupon' })
          }
        }
      })
    } catch (e) {
      console.warn('[index] 检查优惠券通知失败', e)
    }
  },

  // 加载用户偏好
  loadUserPreferences() {
  const preferences = app.globalData.userPreferences || {}
  const fontSize = preferences.fontSize || 'normal'

  this.setData({ fontSize })

  // 应用字体大小
  this.applyFontSize(fontSize)
  },

  // 加载搜索历史
  loadSearchHistory() {
  const history = wx.getStorageSync('searchHistory') || []
  this.setData({ searchHistory: history.slice(0, 10) }) // 最多显示10条
  },

  // 检查用户登录状态
  checkLoginStatus() {
  const isLogin = app.globalData.isLogin
  const userInfo = app.globalData.userInfo
  // 在 setData 之前保存旧值，避免 setData 后 !this.data.isLogin 永远为 false
  const wasLogin = this.data.isLogin

  if (isLogin !== this.data.isLogin || userInfo !== this.data.userInfo) {
      this.setData({
    isLogin,
    userInfo
      })

      // 如果刚登录，显示欢迎语
      if (isLogin && !wasLogin) {
    this.showLoginWelcome()
      }
  }
  },

  // 更新购物车数量
  updateCartCount() {
  const cartCount = app.globalData.cartCount || 0
  this.setData({ cartCount })
  },

  // 检查通知
  checkNotifications() {
  // 检查是否有未读通知
  const unreadNotifications = wx.getStorageSync('unreadNotifications') || 0

  this.setData({ notificationCount: unreadNotifications })

  if (unreadNotifications > 0) {
      // 显示通知提示
      this.showNotificationTip(unreadNotifications)
  }
  },

  // 显示每日推荐
  showDailyRecommendation() {
  // 根据时间和用户行为显示不同的推荐
  const hour = new Date().getHours()

  if (hour >=9 && hour <=11) {
      // 上午推荐：新品、促销
      this.setData({
    dailyRecommendation: {
          title: '上午好！今日新品抢先看',
          type: 'morning'
    }
      })
  } else if (hour >=14 && hour <=17) {
      // 下午推荐：热销、搭配
      this.setData({
    dailyRecommendation: {
          title: '下午好！热门搭配推荐',
          type: 'afternoon'
    }
      })
  } else if (hour >=19 && hour <=22) {
      // 晚上推荐：温馨、家居
      this.setData({
    dailyRecommendation: {
          title: '晚上好！温馨家居装饰',
          type: 'evening'
    }
      })
  }
  },

  // 检查纪念日提醒
  checkAnniversaryReminder() {
  if (!app.globalData.isLogin) {
      this.setData({ annivReminder: null })
      return
  }

  const nearest = anniversary.getNearestAnniversary()
  if (nearest) {
      this.setData({ annivReminder: nearest })
  } else {
      this.setData({ annivReminder: null })
  }
  },

  // 点击纪念日提醒
  onAnnivReminderTap() {
  const anniv = this.data.annivReminder
  if (!anniv) return

  // 跳转到推荐商品页（根据纪念日类型推荐）
  const keyword = anniversary.getGiftKeyword(anniv.type)
  wx.navigateTo({
      url: `/subpackages/search/result/result?keyword=${encodeURIComponent(keyword)}`
  })
  },

  // 处理邀请
  handleInvite(inviterId) {

  // 保存邀请人信息
  wx.setStorageSync('inviter', inviterId)

  // 追踪邀请事件
  app.trackEvent('invite_received', { inviter: inviterId })

  // 显示欢迎提示
  wx.showToast({
      title: '欢迎使用诺派永生花商城',
      icon: 'none',
      duration: 2000
  })

  // 发放新人优惠券
  this.giveNewUserCoupon()
  },

  // 加载轮播图
  loadBanners() {
  this.setData({ bannersLoading: true, bannersError: false })
  return new Promise((resolve, reject) =>{
      setTimeout(() =>{
    try {
      // TODO: 上线前调用 imageUtils.getWebPUrl() 优化图片加载
      const banners = [
          {
        id: 1,
        image: '/assets/banners/banner1.jpg',
        title: '母亲节 · 花礼精选',
        subtitle: '用一束永不凋谢的爱，温暖她的心',
        tagText: '限时 9 折 ›',
        bgStart: '#2D8C7A',
        bgEnd: '#1A6858',
        link: '/pages/promotion/promotion?id=mothers_day'
          },
          {
        id: 2,
        image: '/assets/banners/banner2.jpg',
        title: '新品上市 · 春季限定',
        subtitle: '翠绿暖金系列，为家添一抹春意',
        tagText: '查看新品 ›',
        bgStart: '#1A6B5C',
        bgEnd: '#2D8C7A',
        link: '/pages/category/category?id=new_arrivals'
          },
          {
        id: 3,
        image: '/assets/banners/banner3.jpg',
        title: '场景搭配新灵感',
        subtitle: '玄关/客厅/餐厅，一键配齐',
        tagText: '去看看 ›',
        bgStart: '#C9A96E',
        bgEnd: '#B8954A',
        link: '/pages/scene/scene'
          }
      ]
      this.setData({ banners, bannersLoading: false })
      resolve()
    } catch (e) {
      this.setData({ bannersLoading: false, bannersError: true, banners: [] })
      reject(e)
    }
      }, 200)
  })
  },

  // 加载分类
  loadCategories() {
  this.setData({ categoriesLoading: true, categoriesError: false })
  return new Promise((resolve, reject) =>{
      try {
    const categories = storeConfig.categories
      .filter(cat =>cat.enabled)
      .slice(0, 8)
      .map(cat =>({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
        bgColor: this.getCategoryColor(cat.id)
      }))
    this.setData({ categories, categoriesLoading: false })
    resolve()
      } catch (e) {
    this.setData({ categoriesLoading: false, categoriesError: true, categories: [] })
    reject(e)
      }
  })
  },

  //===== 逐模块重试 =====

  // 重试加载轮播图
  retryLoadBanners() {
    this.loadBanners()
  },

  // 重试加载热销商品
  retryLoadHotProducts() {
    this.loadHotProducts()
  },

  // 重试加载场景搭配
  retryLoadSceneBundles() {
    this.loadSceneBundles()
  },

  // 重试加载分类
  retryLoadCategories() {
    this.loadCategories()
  },

  getCategoryColor(categoryId) {
  const colorMap = {
      'xuanguan': '#2D8C7A', // 翡翠绿
      'keting': '#4CAF50',   // 绿色
      'canting': '#2196F3',  // 蓝色
      'woshi': '#9C27B0',    // 紫色
      'shufang': '#FF9800',  // 橙色
      'songli': '#795548',   // 棕色
      'jiari': '#E91E63'     // 玫红
  }

  return colorMap[categoryId] || '#2D8C7A'
  },

  // 加载热销商品（本地数据优先，API作为刷新源）
  // 双重加载目的：先用本地数据即时渲染，避免白屏；API 返回后再用权威数据覆盖，
  // 保证线上价格/库存始终最新。若 API 数据字段格式与本地不一致，需先映射再 setData。
  loadHotProducts() {
    this.setData({ hotProductsLoading: true, hotProductsError: false })
    return new Promise((resolve) => {
      // 第一次加载：优先使用本地数据（即时展示，避免白屏）
      try {
        const localProducts = productsData.getHotProducts(6)
        if (localProducts && localProducts.length > 0) {
          // TODO: 上线前调用 imageUtils.getWebPUrl() 优化图片加载
          // 字段映射：本地数据格式 -> WXML期望格式
          const mapped = localProducts.map(p => ({
            ...p,
            image: p.mainImage || p.image,
            oldPrice: p.originalPrice,
            tagText: p.tags && p.tags.length > 0 ? p.tags[0] : '',
            bgColor: this.getCategoryColor(p.category),
            emoji: this.getCategoryEmoji(p.category)
          }))
          this.setData({ hotProducts: mapped, hotProductsLoading: false, hotProductsError: false })
        }
      } catch (e) {
        console.warn('[index] 本地产品数据加载失败:', e)
      }
      // 第二次加载：异步尝试API刷新（保证线上价格/库存最新）
      api.product.getProducts({ limit: 6 }).then(result => {
        if (!result.error && result.products && result.products.length > 0) {
          // API 返回后统一用 API 数据覆盖；若字段格式不一致，先做映射
          const mapped = result.products.map(p => ({
            ...p,
            image: p.mainImage || p.image || p.head_img_url || '',
            oldPrice: p.originalPrice || p.market_price || 0,
            tagText: p.tags && p.tags.length > 0 ? p.tags[0] : (p.tagText || ''),
            bgColor: this.getCategoryColor(p.category),
            emoji: this.getCategoryEmoji(p.category)
          }))
          this.setData({ hotProducts: mapped, hotProductsLoading: false, hotProductsError: false })
        }
        resolve()
      }).catch(() => {
        if (!this.data.hotProducts || this.data.hotProducts.length === 0) {
          this.setData({ hotProducts: [], hotProductsLoading: false, hotProductsError: true })
        }
        resolve()
      })
    })
  },

  // 获取分类表情
  getCategoryEmoji(categoryId) {
    const emojiMap = {
      xuanguan: '🏠', keting: '🛋️', canting: '🍽️',
      woshi: '🛏️', shufang: '📚', songli: '🎁'
    }
    return emojiMap[categoryId] || '🌸'
  },

  // 加载猜你喜欢推荐
  loadGuessYouLike() {
    this.setData({ guessYouLikeLoading: true, guessYouLikeError: false })
    try {
      // 读取浏览历史
      const history = wx.getStorageSync('browse_history') || []

      // 已在热销中展示的商品ID集合
      const hotIds = new Set((this.data.hotProducts || []).map(p => String(p.id)))

      // 所有本地产品
      const allProducts = productsData.getAllProducts()

      let candidates = []

      if (history.length > 0) {
        // 统计浏览最多的产品分类
        const categoryCount = {}
        history.forEach(item => {
          const cat = item.category
          if (cat) {
            categoryCount[cat] = (categoryCount[cat] || 0) + 1
          }
        })

        // 按浏览次数降序排列分类
        const sortedCategories = Object.keys(categoryCount)
          .sort((a, b) => categoryCount[b] - categoryCount[a])

        // 从偏好分类中筛选，排除已在热销中的商品
        for (const cat of sortedCategories) {
          const matched = allProducts.filter(p =>
            p.category === cat && !hotIds.has(String(p.id))
          )
          candidates.push(...matched)
        }

        // 如果偏好分类不够8个，补充其他分类的商品
        if (candidates.length < 8) {
          const candidateIds = new Set(candidates.map(p => String(p.id)))
          const extra = allProducts.filter(p =>
            !hotIds.has(String(p.id)) && !candidateIds.has(String(p.id))
          )
          candidates.push(...extra)
        }
      } else {
        // 无浏览历史：随机推荐，排除热销商品
        candidates = allProducts.filter(p => !hotIds.has(String(p.id)))
      }

      // 随机取8个（Fisher-Yates shuffle）
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]]
      }
      const selected = candidates.slice(0, 8)

      // 映射为WXML期望格式
      const mapped = selected.map(p => ({
        ...p,
        image: p.mainImage || p.image,
        oldPrice: p.originalPrice,
        tagText: p.tags && p.tags.length > 0 ? p.tags[0] : '',
        bgColor: this.getCategoryColor(p.category),
        emoji: this.getCategoryEmoji(p.category)
      }))

      this.setData({
        guessYouLike: mapped,
        guessYouLikeLoading: false,
        guessYouLikeError: false
      })
    } catch (e) {
      console.warn('[index] 加载猜你喜欢失败:', e)
      this.setData({ guessYouLike: [], guessYouLikeLoading: false, guessYouLikeError: true })
    }
  },

  // 重试加载猜你喜欢
  retryLoadGuessYouLike() {
    this.loadGuessYouLike()
  },

  // 加载新品（取最新6款）
  loadNewProducts() {
    return api.product.getProducts({ limit: 6 }).then(result => {
      if (result.error) { this.setData({ newProducts: [] }); return; }
      const products = (result.products || []).map(p => ({ ...p, isNew: true }));
      this.setData({ newProducts: products });
    }).catch(() => { this.setData({ newProducts: [] }); });
  },

  // 加载场景推荐（按标题中的场景词筛选）
  loadSceneProducts() {
    const sceneKeywords = {
      xuanguan: ['玄关', '端景台', '入户'],
      keting: ['客厅', '茶几', '电视柜', '沙发边几'],
      canting: ['餐厅', '餐桌', '餐边柜', '餐桌花'],
      woshi: ['卧室', '床头柜', '梳妆台'],
      shufang: ['书房', '茶室', '办公桌', '茶台'],
      songli: ['送礼', '礼物', '乔迁', '520', '母亲节']
    };
    
    return api.product.getProducts({ limit: 30 }).then(result => {
      if (result.error) { this.setData({ sceneProducts: {} }); return; }
      const allProducts = result.products || [];
      const sceneProducts = {};
      Object.keys(sceneKeywords).forEach(scene => {
        sceneProducts[scene] = allProducts.filter(p => {
          const title = p.title || p.name || '';
          return sceneKeywords[scene].some(kw => title.includes(kw));
        }).slice(0, 4);
      });
      this.setData({ sceneProducts });
    }).catch(() => { this.setData({ sceneProducts: {} }); });
  },

  // 加载促销活动
  loadPromotions() {
  return new Promise((resolve, reject) =>{
      // 模拟API请求
      setTimeout(() =>{
    const promotions = [
          {
      id: 'promo1',
      title: '新人专享',
      subtitle: '注册即送20元券',
      icon: '/assets/icons/promotion-new.png',
      color: '#C9A96E',
      link: '/pages/user/coupon'
          },
          {
      id: 'promo2',
      title: '满减活动',
      subtitle: '满299减30',
      icon: '/assets/icons/promotion-discount.png',
      color: '#4CAF50',
      link: '/pages/promotion/promotion?id=discount'
          },
          {
      id: 'promo3',
      title: '积分兑换',
      subtitle: '积分当钱花',
      icon: '/assets/icons/promotion-points.png',
      color: '#2196F3',
      link: '/pages/user/points'
          },
          {
      id: 'promo4',
      title: '会员专享',
      subtitle: '会员95折起',
      icon: '/assets/icons/promotion-vip.png',
      color: '#9C27B0',
      link: '/pages/user/user'
          }
    ]

    this.setData({ promotions })
    resolve()
      }, 700)
  })
  },

  // 刷新数据
  refreshData() {
  this.setData({
      refreshing: true,
      page: 1,
      hasMore: true,
      loading: true,
      bannersLoading: true, hotProductsLoading: true,
      sceneBundlesLoading: true, categoriesLoading: true,
      bannersError: false, hotProductsError: false,
      sceneBundlesError: false, categoriesError: false
  })

  const modules = [
    { key: 'banners', fn: this.loadBanners() },
    { key: 'hotProducts', fn: this.loadHotProducts() },
    { key: 'sceneBundles', fn: this.loadSceneBundles() },
    { key: 'categories', fn: this.loadCategories() }
  ]

  Promise.allSettled(modules.map(m => m.fn))
    .then(results => {
      const updates = { refreshing: false, loading: false }
      results.forEach((r, i) => {
        const key = modules[i].key
        updates[`${key}Loading`] = false
        if (r.status === 'rejected') {
          updates[`${key}Error`] = true
        }
      })
      this.setData(updates)
      wx.stopPullDownRefresh()
      wx.showToast({ title: '刷新成功', icon: 'success', duration: 1500 })
      app.trackEvent('refresh', { page: 'index' })

      // 刷新猜你喜欢
      this.loadGuessYouLike()
    })
  },

  // 加载更多商品
  // TODO: 上线后替换为API分页请求
  loadMoreProducts() {
  if (!this.data.hasMore || this.data.loading) {
      return
  }

  this.setData({ loading: true })

  // 模拟加载更多数据
  setTimeout(() =>{
      const newProducts = [
    {
          id: '1000' + (10 + this.data.page),
          name: '更多商品示例',
          image: '/assets/products/product-default.jpg',
          price: 199 + this.data.page * 10,
          originalPrice: 259 + this.data.page * 10,
          sales: 100 + this.data.page * 50,
          tags: ['热销'],
          scene: 'xuanguan',
          flowerType: 'rose',
          color: 'pink'
    }
      ]

      // 添加到热销商品列表
      const updatedHotProducts = [...this.data.hotProducts, ...newProducts]

      // 基于本地产品数据总数判断是否还有更多
      let totalProducts = 0
      try {
        totalProducts = productsData.getAllProducts().length
      } catch (e) {
        totalProducts = 30
      }

      this.setData({
    hotProducts: updatedHotProducts,
    loading: false,
    page: this.data.page + 1,
    hasMore: updatedHotProducts.length < totalProducts
      })

      // 追踪加载更多事件
      app.trackEvent('load_more', {
    page: 'index',
    page_num: this.data.page,
    product_count: newProducts.length
      })
  }, 800)
  },

  // 应用字体大小
  applyFontSize(fontSize) {
  // 根据字体大小设置页面样式
  const fontSizeMap = {
      'normal': '16px',
      'large': '18px',
      'extra-large': '20px'
  }

  const baseSize = fontSizeMap[fontSize] || '16px'

  // 这里可以动态修改页面样式
  // 实际实现可能需要通过CSS变量或动态修改style
  },

  // 动画欢迎效果
  animateWelcome() {
  // 简单的淡入动画
  wx.createSelectorQuery()
      .select('.welcome-section')
      .boundingClientRect()
      .exec((res) =>{
    if (res[0]) {
          // 可以在这里添加动画效果
    }
      })
  },

  // 显示加载完成提示
  showLoadCompleteTip() {
  // 如果用户是第一次访问，显示引导提示
  const firstVisit = !wx.getStorageSync('hasVisited')

  if (firstVisit) {
      wx.showModal({
    title: '欢迎使用诺派永生花商城',
    content: '这里有各种精美的永生花装饰，支持语音搜索和AR预览功能，操作简单方便！',
    confirmText: '开始探索',
    cancelText: '知道了',
    showCancel: false,
    success: () =>{
          wx.setStorageSync('hasVisited', true)
    }
      })
  }
  },

  // 显示错误提示
  showErrorTip(message) {
  wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
  })
  },

  // 显示登录欢迎语
  showLoginWelcome() {
  const userName = this.data.userInfo?.nickName || '亲爱的用户'

  wx.showToast({
      title: `欢迎回来，${userName}！`,
      icon: 'none',
      duration: 2000
  })

  // 检查是否有未使用的优惠券（已合并到checkCouponPopup中）
  },

  // 显示通知提示
  showNotificationTip(count) {
  wx.showToast({
      title: `您有${count}条新通知`,
      icon: 'none',
      duration: 2000
  })
  },

  // 发放新人优惠券
  giveNewUserCoupon() {
  // 检查是否已经发放过
  const hasGivenCoupon = wx.getStorageSync('hasGivenNewUserCoupon')

  if (!hasGivenCoupon) {
      // 发放优惠券
      const newCoupon = {
    id: 'new_user_2024',
    title: '新人专享券',
    amount: 20,
    minAmount: 100,
    expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'unused'
      }

      // 保存到本地
      let userCoupons = wx.getStorageSync('userCoupons') || []
      userCoupons.push(newCoupon)
      wx.setStorageSync('userCoupons', userCoupons)

      // 标记已发放
      wx.setStorageSync('hasGivenNewUserCoupon', true)

      // 显示优惠券提示
      setTimeout(() =>{
    wx.showModal({
          title: '新人礼包',
          content: '恭喜！您已获得20元新人优惠券',
          confirmText: '立即使用',
          cancelText: '稍后查看',
          success: (res) =>{
      if (res.confirm) {
              wx.navigateTo({
        url: '/subpackages/user/coupon/coupon'
              })
      }
          }
    })
      }, 1000)
  }
  },

  // 检查兼职妈妈状态
  checkMomStatus() {
  const momData = app.globalData.momData || wx.getStorageSync('momData') || null
  this.setData({ userMomData: momData })
  },

  //===== ==== = 用户交互事件 = ==== ==== =

  // 点击轮播图
  onBannerTap(e) {
  const index = e.currentTarget.dataset.index
  const banner = this.data.banners[index]

  // 追踪点击事件
  app.trackEvent('banner_click', { 
      banner_id: banner.id,
      banner_title: banner.title,
      banner_type: banner.type
  })

  // 根据类型跳转到不同页面
  if (banner.link) {
      if (banner.type ==='ar') {
    // AR预览功能
    this.navigateToAR()
      } else {
    // tabBar 页面需用 switchTab
    const tabBarPages = ['/pages/index/index', '/pages/category/category', '/pages/cart/cart', '/pages/user/user']
    if (tabBarPages.includes(banner.link.split('?')[0])) {
      wx.switchTab({ url: banner.link.split('?')[0] })
    } else {
      wx.navigateTo({ url: banner.link })
    }
      }
  }
  },

  // 点击分类
  onCategoryTap(e) {
  const index = e.currentTarget.dataset.index
  const category = this.data.categories[index]

  // 追踪点击事件
  app.trackEvent('category_click', { 
      category_id: category.id,
      category_name: category.name
  })

  // 跳转到分类页面
  // 先保存分类参数，switchTab 不支持路径参数
  app.globalData.navigateParams = {
      categoryId: category.id,
      categoryName: category.name
  }
  wx.switchTab({
      url: `/pages/category/category`
  })
  },

  // 点击商品卡片（来自 product - card 组件）
  onProductCardTap(e) {
  const product = e.detail && e.detail.product
  if (!product) return

  app.trackEvent('product_click', { 
      product_id: product.id,
      product_name: product.title || product.name,
      price: product.price
  })
  },

  // 点击商品
  onProductTap(e) {
  const productId = e.currentTarget.dataset.id
  if (!productId) return

  // 从hotProducts/newProducts/guessYouLike/sceneProducts中查找商品
  let product = null
  let type = 'hot'

  // 先在hotProducts中找
  product = this.data.hotProducts.find(p => p.id === productId)
  if (product) type = 'hot'

  // 再在newProducts中找
  if (!product) {
    product = (this.data.newProducts || []).find(p => p.id === productId)
    if (product) type = 'new'
  }

  // 再在guessYouLike中找
  if (!product) {
    product = (this.data.guessYouLike || []).find(p => p.id === productId)
    if (product) type = 'recommend'
  }

  // 最后在sceneProducts中找
  if (!product && this.data.sceneProducts) {
    for (const scene in this.data.sceneProducts) {
      product = this.data.sceneProducts[scene].find(p => p.id === productId)
      if (product) {
        type = 'scene'
        break
      }
    }
  }

  if (!product) {
    wx.showToast({ title: '商品不存在', icon: 'none' })
    return
  }

  // 追踪点击事件
  app.trackEvent('product_click', { 
      product_id: product.id,
      product_name: product.name,
      product_type: type,
      price: product.price
  })

  // 跳转到商品详情页
  wx.navigateTo({
      url: `/pages/product/detail?id=${product.id}`
  })
  },

  // 点击促销活动
  onPromotionTap(e) {
  const index = e.currentTarget.dataset.index
  const promotion = this.data.promotions[index]

  // 追踪点击事件
  app.trackEvent('promotion_click', { 
      promotion_id: promotion.id,
      promotion_title: promotion.title
  })

  // 跳转到促销页面
  wx.navigateTo({
      url: promotion.link
  })
  },

  // 点击搜索框
  onSearchTap() {

  // 跳转到搜索页面
  wx.navigateTo({
      url: '/pages/search/search'
  })
  },

  // 开始语音搜索
  onVoiceSearchTap() {

  // 检查语音权限
  if (!app.globalData.voiceSupported) {
      wx.showModal({
    title: '提示',
    content: '您的设备不支持语音搜索功能',
    showCancel: false
      })
      return
  }

  // 显示语音搜索界面
  this.setData({ voiceSearching: true })

  // 开始录音
  app.startVoiceRecognition()

  // 追踪语音搜索事件
  app.trackEvent('voice_search_start')
  },

  // 停止语音搜索
  onVoiceSearchStop() {

  this.setData({ voiceSearching: false })

  // 停止录音
  if (app.voiceRecorderManager) {
      app.voiceRecorderManager.stop()
  }
  },

  // 点击AR预览
  onARTap() {

  if (!this.data.arSupported) {
      wx.showModal({
    title: '提示',
    content: '您的设备不支持AR预览功能',
    showCancel: false
      })
      return
  }

  // 跳转到AR预览页面
  this.navigateToAR()
  },

  // 导航到AR页面
  navigateToAR() {
  // 检查AR支持
  if (!this.data.arSupported) {
      wx.showModal({
    title: '设备不支持',
    content: '您的设备不支持AR功能，无法预览',
    showCancel: false
      })
      return
  }

  // 跳转到AR页面
  wx.navigateTo({
      url: '/pages/ar/ar'
  })

  // 追踪AR访问事件
  app.trackEvent('ar_access', { page: 'index' })
  },

  // 点击场景推荐
  onSceneTap(e) {
  const sceneId = e.currentTarget.dataset.id

  // category是tabBar页面，用switchTab跳转，通过globalData传场景参数
  const app = getApp()
  app.globalData.sceneFilter = sceneId ==='all' ? null : sceneId
  wx.switchTab({
      url: '/pages/category/category'
  })

  this.setData({ currentScene: sceneId })
  app.trackEvent('scene_click', { scene: sceneId })
  },

  // 点击场景搭配卡
  onBundleTap(e) {
  const bundleId = e.currentTarget.dataset.id
  wx.navigateTo({
      url: `/pages/scene/scene?bundle=${bundleId}`
  })
  app.trackEvent('bundle_click', { bundle_id: bundleId })
  },

  // 查看全部场景
  onViewAllScenes() {
  wx.switchTab({ url: '/pages/category/category' })
  },

  // 查看全部商品
  onViewAllProducts() {
  wx.switchTab({ url: '/pages/category/category' })
  },

  // 点击促销CTA条
  onPromoTap() {
  wx.navigateTo({
      url: '/pages/promotion/promotion?id=mothers_day'
  })
  app.trackEvent('promo_click', { source: 'home_cta' })
  },

  // 点击用户头像
  onUserAvatarTap() {

  if (this.data.isLogin) {
      // 已登录，跳转到个人中心（TabBar页）
      wx.switchTab({
    url: '/pages/user/user'
      })
  } else {
      // 未登录，跳转到登录页（非TabBar页，仍用navigateTo）
      wx.navigateTo({
    url: '/pages/login/login'
      })
  }
  },

  // 点击购物车
  onCartTap() {

  // 跳转到购物车页面
  wx.switchTab({
      url: '/pages/cart/cart'
  })

  // 追踪购物车点击事件
  app.trackEvent('cart_click', { page: 'index' })
  },

  // 点击消息通知
  onNotificationTap() {

  // 跳转到消息页面
  wx.navigateTo({
      url: '/pages/notification/notification'
  })
  },

  // 点击兼职妈妈体验官
  onMomTap() {

  const momData = this.data.userMomData
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

  // 点击搜索历史
  onSearchHistoryTap(e) {
  const index = e.currentTarget.dataset.index
  const keyword = this.data.searchHistory[index]

  // 执行搜索
  this.performSearch(keyword)
  },

  // 点击热搜词
  onHotKeywordTap(e) {
  const index = e.currentTarget.dataset.index
  const keyword = this.data.hotKeywords[index]

  // 执行搜索
  this.performSearch(keyword)
  },

  // 执行搜索
  performSearch(keyword) {
  // 保存到搜索历史
  this.saveToSearchHistory(keyword)

  // 跳转到搜索结果页
  wx.navigateTo({
      url: `/subpackages/search/result/result?keyword=${encodeURIComponent(keyword)}`
  })

  // 追踪搜索事件
  app.trackEvent('search', { 
      keyword: keyword,
      source: 'homepage'
  })
  },

  // 保存到搜索历史
  saveToSearchHistory(keyword) {
  let history = wx.getStorageSync('searchHistory') || []

  // 移除已存在的相同关键词
  history = history.filter(item =>item !== keyword)

  // 添加到开头
  history.unshift(keyword)

  // 限制历史记录数量
  if (history.length > 20) {
      history = history.slice(0, 20)
  }

  // 保存到本地存储
  wx.setStorageSync('searchHistory', history)

  // 更新页面数据
  this.setData({ searchHistory: history.slice(0, 10) })
  },

  // 清空搜索历史
  onClearSearchHistory() {
  wx.showModal({
      title: '确认清空',
      content: '确定要清空搜索历史吗？',
      success: (res) =>{
    if (res.confirm) {
          wx.removeStorageSync('searchHistory')
          this.setData({ searchHistory: [] })

          wx.showToast({
      title: '已清空',
      icon: 'success'
          })
    }
      }
  })
  },

  // 点击查看更多
  onViewMoreTap(e) {
  const type = e.currentTarget.dataset.type

  let url = '/pages/category/category'
  let params = {}

  switch (type) {
      case 'hot':
    params = { type: 'hot' }
    break
      case 'new':
    params = { type: 'new' }
    break
      case 'scene':
    const scene = e.currentTarget.dataset.scene
    params = { type: 'scene', scene }
    break
  }

  // 保存参数，switchTab 不支持路径参数
  app.globalData.navigateParams = params
  wx.switchTab({
      url: url
  })
  },

  // 字体大小变化回调
  onFontSizeChange(fontSize) {
  this.setData({ fontSize })
  this.applyFontSize(fontSize)
  },

  // 主题变化回调
  onThemeChange(theme) {
  // 这里可以处理主题变化
  },

  // 登录状态变化回调
  onLoginStatusChange(isLogin) {
  this.setData({ isLogin })

  if (isLogin) {
      // 更新用户信息
      this.setData({ userInfo: app.globalData.userInfo })
  } else {
      // 清空用户信息
      this.setData({ userInfo: null })
  }
  },

  // 网络状态变化回调
  onNetworkStatusChange(networkType) {

  // 这里可以处理网络状态变化，比如显示网络提示
  if (networkType ==='none') {
      wx.showToast({
    title: '网络已断开',
    icon: 'none'
      })
  }
  },

  // 阻止弹窗下层滚动
  preventScroll() {},

  // 语音识别结果处理
  onVoiceResult(result) {
  if (result && result.text) {
      this.setData({
    voiceResult: result.text,
    voiceSearching: false
      })

      // 执行搜索
      this.performSearch(result.text)
  }
  }
})
