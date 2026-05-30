// components/privacy - popup/privacy - popup.js - 隐私协议弹窗组件
Component({
  properties: {
  show: {
      type: Boolean,
      value: false
  }
  },

  data: {
  checked: false
  },

  methods: {
  // 阻止滚动穿透
  noop() {},

  // 切换勾选状态
  onToggleCheck() {
      this.setData({ checked: !this.data.checked })
  },

  // 查看用户服务协议
  onViewServiceAgreement() {
      wx.showModal({
    title: '用户服务协议',
    content: '请您在使用诺派永生花微信小程序（以下简称"本小程序"）前仔细阅读以下协议：\n\n1. 服务说明\n本小程序提供永生花商品浏览、购买、AR预览等服务。\n\n2. 用户账户\n您应妥善保管您的微信账户及密码，因账户操作产生的行为由您本人负责。\n\n3. 商品交易\n您在平台上购买商品即视为与商家达成买卖合同，双方应遵守相关交易规则。\n\n4. 知识产权\n本小程序内的所有内容（包括但不限于文字、图片、界面设计等）的知识产权归诺派永生花所有。\n\n5. 责任限制\n因不可抗力或网络故障导致的服务中断，本小程序不承担责任。',
    showCancel: false,
    confirmText: '知道了'
      })
  },

  // 查看隐私政策
  onViewPrivacyPolicy() {
      wx.showModal({
    title: '隐私政策',
    content: '诺派永生花尊重并保护您的隐私。本隐私政策说明了我们如何收集、使用和保护您的个人信息：\n\n1. 信息收集\n我们可能收集以下信息：微信昵称、头像、手机号（登录时）、收货地址（下单时）、设备信息（用于兼容性适配）、浏览记录（用于个性化推荐）。\n\n2. 信息使用\n收集的信息用于：提供商品浏览和购买服务、订单处理和物流配送、改善用户体验、客户服务。\n\n3. 权限说明\n• 摄像头权限：用于AR预览功能，查看永生花在家中的摆放效果\n• 地址权限：用于填写收货地址，方便配送\n• 相册权限：用于上传评价图片和保存商品图片\n\n4. 信息保护\n我们采取加密等安全措施保护您的个人信息，未经您的同意，我们不会将信息提供给第三方。\n\n5. 用户权利\n您可以随时撤回同意、查看、更正或删除您的个人信息。',
    showCancel: false,
    confirmText: '知道了'
      })
  },

  // 同意并继续
  onAgree() {
      if (!this.data.checked) {
    wx.showToast({
          title: '请先阅读并同意协议',
          icon: 'none',
          duration: 2000
    })
    return
      }

      // 保存同意记录
      wx.setStorageSync('privacyAgreed', true)
      wx.setStorageSync('privacyAgreedDate', Date.now())
      wx.setStorageSync('privacyAgreedVersion', 'v1.0')

      if (wx.requirePrivacyAuthorize) {
    wx.requirePrivacyAuthorize({
          success: () =>{
          },
          fail: (err) =>{
      console.warn('微信隐私授权失败', err)
      wx.showToast({
              title: '授权失败，请重试',
              icon: 'none',
              duration: 2000
      })
          }
    })
      }

      this.triggerEvent('agree')
      this.setData({ show: false, checked: false })
  },

  // 暂不使用
  onReject() {
      wx.setStorageSync('privacyAgreed', false)
      this.triggerEvent('reject')
      this.setData({ show: false, checked: false })
  }
  }
})
