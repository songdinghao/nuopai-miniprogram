// pages/mom/activate/activate.js - 兼职妈妈体验官开通页
const app = getApp()
const momProgram = require('../../../utils/mom-program.js')
const subscribeMsg = require('../../../utils/subscribe-message.js')

Page({
  data: {
  activating: false
  },

  onLoad(options) {
  // 加载用户偏好设置
  app.loadUserPreferences && app.loadUserPreferences()
  app.watchFontSizeChange && app.watchFontSizeChange(this.onFontSizeChange.bind(this))
  },

  // 点击开通按钮
  onActivateTap() {
  if (this.data.activating) return

  this.setData({ activating: true })

  // 模拟开通流程
  setTimeout(() =>{
      const momData = momProgram.getDefaultMomData()
      momData.isMom = true
      momData.momSince = new Date().toISOString()
      momData.momLevel = 'newbie'
      momData.inviteCode = momProgram.generateInviteCode(
    app.globalData.userInfo?.id || 'default'
      )

      // 保存到全局数据
      app.globalData.momData = momData

      // 持久化存储
      wx.setStorageSync('momData', momData)

      this.setData({ activating: false })

      // 异步请求订阅消息授权（不阻塞开通流程）
      subscribeMsg.requestAllAuth().catch(() => {})

      // 跳转到兼职妈妈首页，并显示开通成功提示
      wx.redirectTo({
    url: '/pages/mom/home/home?activated=1'
      })
  }, 1200)
  },

  // 查看协议
  onRulesTap() {
  wx.showModal({
      title: '兼职妈妈体验官协议',
      content: '1. 您可通过分享商品链接获得佣金\n2. 佣金将在订单确认收货后7日到账\n3. 提现最低10元，手续费由平台承担\n4. 请遵守相关法律法规，不得虚假宣传\n5. 平台保留最终解释权',
      confirmText: '我知道了',
      showCancel: false
  })
  },

  onFontSizeChange(fontSize) {
  this.setData({ fontSize })
  }
})
