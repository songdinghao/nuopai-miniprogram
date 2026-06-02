// pages/login/login.js - 登录页面逻辑
const app = getApp()
const referral = require('../../utils/referral.js')

Page({
  data: {
  // 登录方式
  loginType: 'wechat', // wechat | phone

  // 表单数据
  phone: '',
  code: '',

  // 状态控制
  agreed: false,
  countdown: 0,
  isLogging: false, // 防止重复点击登录

  // 用户偏好
  fontSize: 'normal',

  // 重定向参数（游客模式）
  redirect: '',
  needMergeCart: false,

  // 手机号登录按钮可用状态
  canLogin: false
  },

  // 倒计时定时器引用
  _countdownTimer: null,

  // 页面加载
  onLoad(options) {

  app.globalData.currentPage = 'login'

  // 读取重定向参数（游客模式）
  if (options.redirect) {
      this.setData({ redirect: decodeURIComponent(options.redirect) })
  }
  if (options.mergeCart ==='true') {
      this.setData({ needMergeCart: true })
  }

  // 追踪页面访问
  app.trackEvent('page_view', { 
      page: 'login',
      from: options.from || 'direct',
      redirect: this.data.redirect || ''
  })

  // 加载用户偏好
  this.loadUserPreferences()
  },

  // 加载用户偏好
  loadUserPreferences() {
  const preferences = app.globalData.userPreferences || {}
  const fontSize = preferences.fontSize || 'normal'

  this.setData({ fontSize })
  },

  // 切换登录方式
  onChangeLoginType(e) {
  const type = e.currentTarget.dataset.type
  this.setData({ 
      loginType: type,
      phone: '',
      code: ''
  })

  // 追踪事件
  app.trackEvent('login_type_change', { 
      type
  })
  },

  // 手机号输入
  onPhoneInput(e) {
  this.setData({ phone: e.detail.value })
  this.checkCanLogin()
  },

  // 验证码输入
  onCodeInput(e) {
  this.setData({ code: e.detail.value })
  this.checkCanLogin()
  },

  // 检查是否可以登录
  checkCanLogin() {
  const { phone, code, agreed } = this.data
  const phoneValid = /^1[3-9]\d{9}$/.test(phone)
  const codeValid = code.length ===6

  this.setData({
      canLogin: phoneValid && codeValid && agreed
  })
  },

  // 切换协议同意状态
  onToggleAgree() {
  this.setData({ agreed: !this.data.agreed })
  this.checkCanLogin()
  },

  // 显示用户协议
  onShowAgreement() {
  wx.showModal({
      title: '用户协议',
      content: '这里是用户协议内容...',
      showCancel: false
  })
  },

  // 显示隐私政策
  onShowPrivacy() {
  wx.showModal({
      title: '隐私政策',
      content: '这里是隐私政策内容...',
      showCancel: false
  })
  },

  // 发送验证码
  onSendCode() {
  // 验证手机号
  const phone = this.data.phone
  if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
    title: '请输入正确的手机号',
    icon: 'none',
    duration: 2000
      })
      return
  }

  // 验证协议
  if (!this.data.agreed) {
      wx.showToast({
    title: '请先阅读并同意协议',
    icon: 'none',
    duration: 2000
      })
      return
  }

  // 显示发送成功
  wx.showToast({
      title: '验证码已发送',
      icon: 'success',
      duration: 1500
  })

  // 开始倒计时
  this.startCountdown()

  // 追踪事件
  app.trackEvent('login_send_code')
  },

  // 倒计时
  startCountdown() {
  let countdown = 60
  this.setData({ countdown })

  // 清除旧定时器，防止重复
  if (this._countdownTimer) clearInterval(this._countdownTimer)

  this._countdownTimer = setInterval(() =>{
      countdown--
      this.setData({ countdown })

      if (countdown <=0) {
    clearInterval(this._countdownTimer)
    this._countdownTimer = null
      }
  }, 1000)
  },

  // 页面卸载，清理定时器
  onUnload() {
  if (this._countdownTimer) {
      clearInterval(this._countdownTimer)
      this._countdownTimer = null
  }
  },

  // 微信登录
  onWechatLogin(e) {

  // 验证协议
  if (!this.data.agreed) {
      wx.showToast({
    title: '请先阅读并同意协议',
    icon: 'none',
    duration: 2000
      })
      return
  }

  // 显示加载
  wx.showLoading({
      title: '登录中...',
      mask: true
  })
  this.setData({ isLogging: true })

  // 模拟微信登录
  setTimeout(() =>{
      this.doLogin({
    id: 'user_' + Date.now(),
    name: '微信用户',
    avatar: '/assets/avatars/default.png',
    phone: '',
    isLogin: true
      })

      wx.hideLoading()
      this.setData({ isLogging: false })

      // 追踪事件
      app.trackEvent('login_success', {
    type: 'wechat'
      })

  }, 1500)
  },

  // 手机号登录
  onPhoneLogin() {
  // 验证表单
  if (!this.data.canLogin) {
      return
  }

  // 显示加载
  wx.showLoading({
      title: '登录中...',
      mask: true
  })
  this.setData({ isLogging: true })

  // 模拟手机号登录
  setTimeout(() =>{
      this.doLogin({
    id: 'user_' + Date.now(),
    name: this.data.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
    avatar: '/assets/avatars/default.png',
    phone: this.data.phone,
    isLogin: true
      })

      wx.hideLoading()
      this.setData({ isLogging: false })

      // 追踪事件
      app.trackEvent('login_success', {
    type: 'phone'
      })

  }, 1500)
  },

  // 执行登录
  doLogin(userInfo) {
  // 保存用户信息
  wx.setStorageSync('userInfo', userInfo)
  // TODO: 上线前必须替换为后端签发的 JWT token，当前实现可被伪造
  wx.setStorageSync('token', 'token_' + Date.now())
  wx.setStorageSync('isLogin', true)

  // 更新全局状态
  app.globalData.userInfo = userInfo
  app.globalData.isLogin = true
  // TODO: 上线前必须替换为后端签发的 JWT token，当前实现可被伪造
  app.globalData.token = 'token_' + Date.now()

  // 触发登录状态变化事件
  app.triggerLoginStatusChange(true)

  // 处理邀请关系 - 检查是否有邀请人
  const inviterCode = referral.getMyInviter()
  if (inviterCode) {
      // 记录邀请关系
      referral.saveReferralRecord(inviterCode, userInfo.id)
      // 发放老客奖励
      referral.giveInviterReward(inviterCode)
  }

  // 发放新人优惠券（首次登录）
  referral.giveNewUserReferralCoupon()

  // 显示登录成功
  wx.showToast({
      title: '登录成功',
      icon: 'success',
      duration: 1500
  })

  // 登录后处理：购物车合并 + 页面重定向
  setTimeout(() =>{
      // 1. 如果需要合并购物车，执行合并
      if (this.data.needMergeCart) {
    this.mergeCartAfterLogin()
      }

      // 2. 获取重定向目标
      const redirectUrl = this.data.redirect || ''

      if (redirectUrl) {
    // 有重定向目标，跳转到指定页面
    wx.redirectTo({
          url: redirectUrl,
          fail: () =>{
      // 如果 redirectTo 失败（如跳转 tabBar 页面），改用 switchTab
      wx.switchTab({
              url: redirectUrl,
              fail: () =>{
        wx.navigateBack()
              }
      })
          }
    })
      } else {
    // 无重定向目标，返回上一页或跳转首页
    const pages = getCurrentPages()
    if (pages.length > 1) {
          wx.navigateBack()
    } else {
          wx.switchTab({
      url: '/pages/index/index'
          })
    }
      }
  }, 1500)
  },

  // 登录后合并购物车
  mergeCartAfterLogin() {
  const localCart = wx.getStorageSync('cartItems') || []

  const tempOrderCart = wx.getStorageSync('tempOrder_cart') || {}
  const tempItems = tempOrderCart.items || []

  if (tempItems.length ===0) return

  // 合并：以本地购物车 skuid 为主键
  const merged = [...localCart]

  tempItems.forEach(tempItem =>{
      const existIndex = merged.findIndex(localItem =>localItem.productId ===tempItem.productId
      )

      if (existIndex >=0) {
    // 本地已有该商品，取最大数量
    merged[existIndex].quantity = Math.max(
          merged[existIndex].quantity || 1,
          tempItem.quantity || 1
    )
      } else {
    // 本地没有，追加
    merged.push(tempItem)
      }
  })

  // 保存合并结果
  wx.setStorageSync('cartItems', merged)

  // 更新全局购物车数量
  const totalCount = merged.reduce((sum, item) =>sum + (item.quantity || 1), 0)
  app.globalData.cartCount = totalCount

  // 更新 TabBar 角标
  if (totalCount > 0) {
      wx.setTabBarBadge({
    index: 2,
    text: totalCount > 99 ? '99+' : totalCount.toString()
      })
  }

  // 清空临时购物车订单
  wx.removeStorageSync('tempOrder_cart')

  },

  onBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
      wx.navigateBack()
  } else {
      wx.switchTab({
    url: '/pages/index/index'
      })
  }
  },

  // 字体大小变化回调
  onFontSizeChange(fontSize) {
  this.setData({ fontSize })
  }
})
