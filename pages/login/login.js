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
  // TODO: 请法务审核后替换为正式版本
  onShowAgreement() {
  const agreementText = '欢迎使用诺派永生花商城小程序（以下简称"本平台"）。' +
    '一、服务条款：本平台为您提供永生花及相关家居装饰产品的浏览、购买、配送等服务。' +
    '二、用户权利义务：您应提供真实、准确的注册信息，并妥善保管账户安全；' +
    '您有权享受本平台提供的各项服务，但不得利用平台从事违法违规活动。' +
    '三、隐私保护：我们严格保护您的个人信息，未经您同意不会向第三方披露，' +
    '具体详见《隐私政策》。' +
    '四、免责声明：因不可抗力、系统维护等原因导致的服务中断，本平台不承担责任；' +
    '商品图片仅供参考，以实物为准。' +
    '五、联系方式：如您有任何疑问，请联系客服微信 nuopai_service 或拨打 400-000-0000。'
  wx.showModal({
      title: '用户协议',
      content: agreementText,
      showCancel: false
  })
  },

  // 显示隐私政策
  // TODO: 请法务审核后替换为正式版本
  onShowPrivacy() {
  const privacyText = '诺派永生花商城非常重视您的隐私保护。' +
    '一、信息收集：我们仅收集您主动提供的手机号、收货地址等必要信息，用于订单处理和配送服务。' +
    '二、信息使用：您的个人信息仅用于订单履约、客服服务和平台功能优化，不会用于未经授权的用途。' +
    '三、信息保护：我们采用加密存储和传输技术保护您的数据安全，并定期进行安全审计。' +
    '四、信息共享：除物流配送等必要环节外，我们不会将您的个人信息共享给第三方。' +
    '五、您的权利：您有权随时查看、修改或删除您的个人信息，也可申请注销账户。' +
    '六、联系方式：如有隐私相关疑问，请联系客服微信 nuopai_service。'
  wx.showModal({
      title: '隐私政策',
      content: privacyText,
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
