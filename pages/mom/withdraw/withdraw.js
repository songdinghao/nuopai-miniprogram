const app = getApp()

Page({
  data: {
    availableAmount: 0,  // 可提现金额（分）
    withdrawAmount: '',     // 输入的金额（元）
    momLevel: 'newbie',
    minWithdraw: 100,      // 最低提现金额（分）= 1元
    withdrawHistory: [],
    submitting: false,
    isLoading: false,
    // 格式化数据 - 用于WXML显示
    formattedBalance: '0.00',
    minWithdrawFormatted: '1.00'
  },

  onShow() {
    this.loadData()
  },

  // 加载可提现金额
  loadData() {
    this.setData({ isLoading: true })
    
    wx.request({
      url: 'https://wechat.zzjgsw.com/api/user/earnings',
      method: 'GET',
      data: {
        userId: app.globalData.userInfo?.id || 'test_user_001'
      },
      success: (res) => {
        this.setData({ isLoading: false })
        
        if (res.data.code === 0) {
          const earnings = res.data.data
          this.setData({
            availableAmount: earnings.availableAmount || 0,
            momLevel: 'normal',
            minWithdraw: 100  // 1元 = 100分
          }, () => {
            this.formatBalance()  // 格式化余额显示
          })
        } else {
          // 如果API失败，使用本地模拟数据
          this.loadLocalData()
        }
      },
      fail: (err) => {
        console.error('加载收益失败，使用本地数据：', err)
        this.loadLocalData()
      }
    })
  },

  // 加载本地模拟数据（备用）
  loadLocalData() {
    const momEarnings = require('../../../utils/mom-earnings.js')
    const userData = momEarnings.getMomUserData()
    const momData = userData.momData || {}
    const minAmount = momData.momLevel === 'newbie' ? 2000 : 5000  // 本地模式：20元/50元

    const withdrawHistory = this.formatWithdrawHistory(momEarnings.getWithdrawalsList())
    
    this.setData({
      availableAmount: (momData.settledEarnings || 0) * 100,  // 转换为分
      momLevel: momData.momLevel || 'newbie',
      minWithdraw: minAmount,
      withdrawHistory: withdrawHistory
    }, () => {
      this.formatBalance()  // 格式化余额显示
    })
  },

  // 金额输入
  onAmountInput(e) {
    this.setData({ withdrawAmount: e.detail.value })
  },

  // 全部提现
  onWithdrawAll() {
    const amountInYuan = (this.data.availableAmount / 100).toFixed(2)
    this.setData({ withdrawAmount: amountInYuan })
  },

  // 提现按钮点击
  onWithdraw() {
    if (this.data.submitting) return
    
    const amountInYuan = parseFloat(this.data.withdrawAmount)
    if (!amountInYuan || amountInYuan <= 0) {
      wx.showToast({ title: '请输入提现金额', icon: 'none' })
      return
    }

    const amountInFen = Math.round(amountInYuan * 100)  // 转换为分

    // 验证最低提现金额
    if (amountInFen < this.data.minWithdraw) {
      wx.showToast({ 
        title: `最低提现${this.data.minWithdraw / 100}元`, 
        icon: 'none' 
      })
      return
    }

    // 验证余额
    if (amountInFen > this.data.availableAmount) {
      wx.showToast({ title: '余额不足', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    // 调用后端提现API
    wx.request({
      url: 'https://wechat.zzjgsw.com/api/withdraw',
      method: 'POST',
      data: {
        userId: app.globalData.userInfo?.id || 'test_user_001',
        amount: amountInFen,
        openid: app.globalData.userInfo?.openid || ''
      },
      success: (res) => {
        this.setData({ submitting: false })

        if (res.data.code === 0) {
          wx.showToast({ title: '提现申请成功', icon: 'success' })
          this.setData({ 
            withdrawAmount: '',
            isLoading: false 
          })
          // 刷新页面
          this.loadData()
        } else {
          wx.showToast({ title: res.data.msg || '提现失败', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('提现请求失败：', err)
        this.setData({ submitting: false })
        
        // 如果后端不可用，使用本地模拟提现
        wx.showModal({
          title: '提示',
          content: '后端服务不可用，是否使用本地模拟提现？',
          success: (modalRes) => {
            if (modalRes.confirm) {
              this.localWithdraw(amountInYuan)
            }
          }
        })
      }
    })
  },

  // 本地模拟提现（备用）
  localWithdraw(amount) {
    const momEarnings = require('../../../utils/mom-earnings.js')
    const result = momEarnings.performWithdrawal(amount)

    if (result.success) {
      wx.showToast({ title: '提现申请已提交（本地模拟）', icon: 'success' })
      this.setData({ withdrawAmount: '' })
      this.loadLocalData()
    } else {
      wx.showToast({ title: result.reason, icon: 'none' })
      this.setData({ submitting: false })
    }
  },

  // 格式化余额显示 - 避免在WXML中使用.toFixed()等方法
  formatBalance() {
    const availableAmount = this.data.availableAmount || 0
    const minWithdraw = this.data.minWithdraw || 100
    
    this.setData({
      formattedBalance: (availableAmount / 100).toFixed(2),
      minWithdrawFormatted: (minWithdraw / 100).toFixed(2)
    })
  },

  // 格式化提现记录 - 避免在WXML中使用.slice()等方法
  formatWithdrawHistory(history) {
    if (!history || !history.length) return []
    
    return history.map(item => ({
      ...item,
      formattedCreatedAt: (item.createdAt || '').slice(0, 10)
    }))
  },

  // 跳转收益兑换商品页面
  onExchangeProduct() {
    wx.navigateTo({ url: '/pages/mom/exchange/exchange' })
  }
})
