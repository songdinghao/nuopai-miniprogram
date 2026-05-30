// pages/invite/invite.js - 邀请好友页面
const app = getApp()
const referral = require('../../utils/referral.js')

Page({
  data: {
  // 用户信息
  isLogin: false,
  userId: '',

  // 邀请数据
  inviteCode: '',
  inviteLink: '',

  // 统计数据
  stats: {
      total: 0,
      converted: 0,
      pending: 0
  },

  // 奖励说明
  rewardRules: [],

  // 邀请记录列表
  inviteRecords: [],

  // 页面状态
  loading: true,
  fontSize: 'normal'
  },

  onLoad(options) {
  app.globalData.currentPage = 'invite'

  this.loadUserData()
  },

  onShow() {
  this.loadUserData()
  },

  // 加载用户数据
  loadUserData() {
  const isLogin = app.globalData.isLogin
  const userInfo = app.globalData.userInfo || {}

  if (!isLogin) {
      this.setData({
    loading: false,
    isLogin: false
      })
      return
  }

  const userId = userInfo.id || userInfo.openid || ''
  const inviteCode = referral.getInviteCode(userId)
  const stats = referral.getReferralStats(userId)
  const rewardRules = referral.getRewardRules()

  const invitees = wx.getStorageSync('referral_invitees') || []
  const myRecords = invitees.filter(r =>r.inviterCode ===inviteCode).map(r =>({
      ...r,
      formattedTime: this.formatTime(r.inviteTime),
      formattedUser: r.newUserId ? "好友 " + r.newUserId.slice(-4) : "好友"
  }))

  this.setData({
      isLogin: true,
      userId,
      inviteCode,
      inviteLink: `/pages/index/index?inviter=${inviteCode}`,
      stats,
      rewardRules,
      inviteRecords: myRecords,
      loading: false
  })
  },

  // 复制邀请码
  onCopyCode() {
  wx.setClipboardData({
      data: this.data.inviteCode,
      success: () =>{
    wx.showToast({
          title: '邀请码已复制',
          icon: 'success',
          duration: 1500
    })
      }
  })
  },

  // 复制邀请链接
  onCopyLink() {
  const link = 'https://nuopai.com/invite?code=' + this.data.inviteCode
  wx.setClipboardData({
      data: link,
      success: () =>{
    wx.showToast({
          title: '邀请链接已复制',
          icon: 'success',
          duration: 1500
    })
      }
  })
  },

  // 分享给好友
  onShare() {
  wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
  })
  },

  // 生成海报（简化版 - 保存邀请码图片）
  onSavePoster() {
  wx.showToast({
      title: '海报生成中...',
      icon: 'none',
      duration: 2000
  })

  // 简化处理：提示用户复制邀请码并分享
  setTimeout(() =>{
      wx.showModal({
    title: '分享邀请',
    content: `邀请码：${this.data.inviteCode}\n\n将邀请码或链接分享给好友即可`,
    confirmText: '去分享',
    cancelText: '复制邀请码',
    success: (res) =>{
          if (res.confirm) {
      this.onShare()
          } else {
      this.onCopyCode()
          }
    }
      })
  }, 500)
  },

  // 分享
  onShareAppMessage() {
  const inviteCode = this.data.inviteCode
  return {
      title: '诺派永生花商城 - 邀请您一起选购精美永生花',
      path: `/pages/index/index?inviter=${inviteCode}`,
      imageUrl: '/assets/share/invite-share.jpg'
  }
  },

  // 分享到朋友圈
  onShareTimeline() {
  return {
      title: '发现一个超美的永生花商城，来和我一起逛吧！',
      query: 'inviter=' + this.data.inviteCode
  }
  },

  // 查看奖励规则
  onShowRewardRules() {
  const rules = this.data.rewardRules
  let content = ''

  rules.forEach(r =>{
      content +=`${r.icon} ${r.title}\n${r.desc}\n\n`
  })

  wx.showModal({
      title: '邀请奖励规则',
      content: content,
      showCancel: false,
      confirmText: '知道了'
  })
  },

  // 格式化时间
  formatTime(timestamp) {
  if (!timestamp) return ''
  const d = new Date(typeof timestamp ==='string' ? parseInt(timestamp) : timestamp)
  const Y = d.getFullYear()
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${Y}-${M}-${D} ${h}:${m}`
  },

  // 去登录
  onLoginTap() {
  wx.navigateTo({
      url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/invite/invite')
  })
  }
})
