// pages/register/register.js - 注册页面
const app = getApp()
const referral = require('../../utils/referral.js')

Page({
  data: {
  // 表单数据
  phone: '',
  code: '',
  password: '',
  confirmPassword: '',

  // 验证状态
  agreed: false,
  canRegister: false,
  countdown: 0,

  // 页面状态
  loading: false,
  step: 'form', // form | success

  // 用户偏好
  fontSize: 'normal'
  },

  onLoad(options) {
  app.globalData.currentPage = 'register'

  // 保存来源页参数，注册成功后跳回
  this._redirect = options.redirect || ''
  this._fromPage = options.from || ''

  // 加载用户偏好
  this.loadUserPreferences()
  },

  onShow() {
  },

  // 加载用户偏好
  loadUserPreferences() {
  const preferences = app.globalData.userPreferences || {}
  this.setData({ fontSize: preferences.fontSize || 'normal' })
  },

  // 手机号输入
  onPhoneInput(e) {
  this.setData({ phone: e.detail.value })
  this.checkCanRegister()
  },

  // 验证码输入
  onCodeInput(e) {
  this.setData({ code: e.detail.value })
  this.checkCanRegister()
  },

  // 密码输入
  onPasswordInput(e) {
  this.setData({ password: e.detail.value })
  this.checkCanRegister()
  },

  // 确认密码输入
  onConfirmPasswordInput(e) {
  this.setData({ confirmPassword: e.detail.value })
  this.checkCanRegister()
  },

  // 检查是否可以注册
  checkCanRegister() {
  const { phone, code, password, confirmPassword, agreed } = this.data
  const phoneValid = /^1[3-9]\d{9}$/.test(phone)
  const codeValid = code.length ===6
  const passwordValid = password.length >=6
  const confirmValid = password ===confirmPassword

  this.setData({
      canRegister: phoneValid && codeValid && passwordValid && confirmValid && agreed
  })
  },

  // 切换协议同意
  onToggleAgree() {
  this.setData({ agreed: !this.data.agreed })
  this.checkCanRegister()
  },

  // 发送验证码
  onSendCode() {
  if (!/^1[3-9]\d{9}$/.test(this.data.phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
  }

  if (!this.data.agreed) {
      wx.showToast({ title: '请先阅读并同意协议', icon: 'none' })
      return
  }

  wx.showToast({ title: '验证码已发送', icon: 'success' })
  this.startCountdown()
  },

  // 倒计时
  startCountdown() {
  let countdown = 60
  this.setData({ countdown })

  // 保存定时器引用，防止页面卸载后泄漏
  this._countdownTimer = setInterval(() =>{
      countdown--
      this.setData({ countdown })
      if (countdown <=0) {
    clearInterval(this._countdownTimer)
    this._countdownTimer = null
      }
  }, 1000)
  },

  // 页面卸载时清除定时器，防止内存泄漏
  onUnload() {
  if (this._countdownTimer) {
      clearInterval(this._countdownTimer)
      this._countdownTimer = null
  }
  },

  // 注册
  onRegister() {
  if (!this.data.canRegister) return

  if (this.data.password !== this.data.confirmPassword) {
      wx.showToast({ title: '两次输入的密码不一致', icon: 'none' })
      return
  }

  this.setData({ loading: true })

  // TODO: 上线后替换为后端注册API（含短信验证码校验 + 用户创建）
  // 模拟注册请求
  setTimeout(() =>{
      this.setData({ loading: false, step: 'success' })

      // 保存用户信息
      const userInfo = {
    id: 'user_' + Date.now(),
    name: this.data.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
    phone: this.data.phone,
    isLogin: true
      }

      wx.setStorageSync('userInfo', userInfo)
      wx.setStorageSync('token', 'token_' + Date.now())
      wx.setStorageSync('isLogin', true)

      app.globalData.userInfo = userInfo
      app.globalData.isLogin = true
      app.globalData.token = 'token_' + Date.now()

      // 发放新人优惠券
      const newCoupon = referral.giveNewUserReferralCoupon()

      // 处理邀请关系 - 检查是否有邀请人
      const inviterCode = referral.getMyInviter()
      if (inviterCode) {
    referral.saveReferralRecord(inviterCode, userInfo.id)
    referral.giveInviterReward(inviterCode)
      }

      // 合并临时购物车数据
      this.mergeTempCart()

      wx.showToast({ title: '注册成功', icon: 'success', duration: 1500 })

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        this.redirectAfterRegister()
      }, 1500)
  }, 1500)
  },

  // 合并临时购物车
  mergeTempCart() {
    try {
      const tempCart = wx.getStorageSync('temp_cart') || []
      if (tempCart.length === 0) return

      let cartItems = wx.getStorageSync('cartItems') || []
      tempCart.forEach(item => {
        const existIdx = cartItems.findIndex(c => c.id === item.id)
        if (existIdx >= 0) {
          cartItems[existIdx].count += item.count || 1
        } else {
          cartItems.push({ ...item, selected: true })
        }
      })
      wx.setStorageSync('cartItems', cartItems)
      wx.removeStorageSync('temp_cart')
    } catch (e) {
      console.warn('合并临时购物车失败', e)
    }
  },

  // 注册成功后跳转
  redirectAfterRegister() {
    try {
      const redirect = this._redirect
      if (redirect) {
        // 如果有重定向URL，解码并跳转
        const url = decodeURIComponent(redirect)
        wx.redirectTo({ url })
        return
      }

      if (this._fromPage) {
        // 如果指定了来源页面，跳转过去
        wx.redirectTo({ url: decodeURIComponent(this._fromPage) })
        return
      }

      // 尝试返回上一页
      const pages = getCurrentPages()
      if (pages.length > 2) {
        wx.navigateBack({ delta: pages.length - 1 })
        return
      }

      // 兜底：跳转到首页
      wx.switchTab({ url: '/pages/index/index' })
    } catch (e) {
      console.warn('注册后跳转失败', e)
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  // 注册成功 - 去首页
  onGoHome() {
  wx.switchTab({ url: '/pages/index/index' })
  },

  // 去登录
  onGoLogin() {
  wx.redirectTo({ url: '/pages/login/login' })
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

  onBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
      wx.navigateBack()
  } else {
      wx.switchTab({ url: '/pages/index/index' })
  }
  },

  // 字体大小变化回调
  onFontSizeChange(fontSize) {
  this.setData({ fontSize })
  }
})
