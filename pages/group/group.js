// pages/group/group.js - 拼团页面逻辑
const app = getApp()
const groupBuy = require('../../utils/group-buy.js')

Page({
  data: {
  // 页面状态
  loading: true,

  // 拼团数据
  groupId: '',
  group: null,
  productId: '',

  // 倒计时
  countdown: '00: 00: 00',
  countdownTimer: null,

  // 所有拼团列表（无指定groupId时展示）
  groupsByProduct: [],
  selectedGroupIndex: -1,

  // 用户信息
  isLeader: false,
  isMember: false,

  // 分享信息
  shareInfo: null,

  // 拼团规则
  rules: []
  },

  onLoad(options) {
  const groupId = options.groupId || ''
  const productId = options.productId || ''

  this.setData({ 
      groupId, 
      productId,
      rules: groupBuy.GROUP_BUY_CONFIG.rules || []
  })

  if (groupId) {
      // 加载特定拼团
      this.loadGroup(groupId)
  } else if (productId) {
      // 加载商品的拼团列表
      this.loadGroupsByProduct(productId)
  }
  },

  onShow() {
  if (this.data.groupId) {
      this.loadGroup(this.data.groupId)
  }
  if (this.data.countdownTimer) {
      this.startCountdown()
  }
  },

  onUnload() {
  if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer)
  }
  },

  // 分享
  onShareAppMessage() {
  const group = this.data.group
  if (!group) {
      return {
    title: '拼团 - 诺派永生花商城',
    path: '/pages/group/group'
      }
  }

  return {
      title: groupBuy.GROUP_BUY_CONFIG.share.title.replace('{productName}', group.productName).replace('{currentCount}', group.currentCount).replace('{needCount}', group.needCount),
      path: `/pages/group/group?groupId=${group.id}`,
      imageUrl: group.mainImage || groupBuy.GROUP_BUY_CONFIG.share.imageUrl
  }
  },

  onShareTimeline() {
  const group = this.data.group
  const title = group ? group.productName : '拼团'
  return {
      title: `「拼团」${title}，就差你了！`,
      query: `groupId=${this.data.groupId || ''}`,
      imageUrl: (group && group.mainImage) || groupBuy.GROUP_BUY_CONFIG.share.imageUrl
  }
  },

  // 加载指定拼团
  loadGroup(groupId) {
  const groups = groupBuy.loadGroups()
  const group = groups.find(g =>g.id ===groupId)

  if (!group) {
      wx.showToast({
    title: '拼团不存在',
    icon: 'none',
    duration: 2000
      })
      setTimeout(() =>{
    wx.navigateBack()
      }, 1500)
      return
  }

  // 检查过期
  if (group.status ==='pending' && groupBuy.isGroupExpired(group)) {
      group.status = 'expired'
      groupBuy.saveGroup(group)
  }

  const userInfo = app.globalData.userInfo || { id: '' }
  const isLeader = group.leader.id ===userInfo.id
  const isMember = group.members.some(m =>m.id ===userInfo.id)

  // 生成分享信息
  const shareInfo = {
      title: groupBuy.GROUP_BUY_CONFIG.share.title
    .replace('{productName}', group.productName)
    .replace('{currentCount}', group.currentCount)
    .replace('{needCount}', group.needCount),
      path: `/pages/group/group?groupId=${group.id}`,
      imageUrl: group.mainImage || groupBuy.GROUP_BUY_CONFIG.share.imageUrl
  }

  // 预计算价格优惠文本（WXML 不支持方法调用）
  group.discountText = '¥' + (group.skuPrice - group.groupPrice).toFixed(2)

  this.setData({
      group,
      isLeader,
      isMember,
      shareInfo,
      loading: false
  }, () =>{
      this.startCountdown()
  })
  },

  // 加载商品的所有拼团
  loadGroupsByProduct(productId) {
  const groups = groupBuy.getActiveGroupsByProduct(productId)

  // 预处理状态文本
  const processedGroups = groups.map(g =>({
      ...g,
      statusText: groupBuy.getGroupStatusText(g),
      statusClass: g.status ==='success' ? 'success' : g.status ==='expired' ? 'expired' : ''
  }))

  this.setData({
      groupsByProduct: processedGroups,
      loading: false
  })
  },

  // 开始倒计时
  startCountdown() {
  if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer)
  }

  const updateCountdown = () =>{
      const group = this.data.group
      if (!group) return

      const remaining = groupBuy.getGroupRemainingTime(group)
      const countdown = groupBuy.formatRemainingTime(remaining)

      this.setData({ countdown })

      if (remaining <=0 && group.status ==='pending') {
    // 拼团过期
    group.status = 'expired'
    groupBuy.saveGroup(group)
    this.setData({ group })
    clearInterval(this.data.countdownTimer)

    wx.showToast({
          title: '拼团已过期',
          icon: 'none',
          duration: 2000
    })
      }
  }

  updateCountdown()
  this.data.countdownTimer = setInterval(updateCountdown, 1000)
  },

  // 加入拼团
  onJoinGroup() {
  const group = this.data.group

  if (!group) return

  // 检查登录
  if (!app.globalData.isLogin) {
      wx.showToast({
    title: '请先登录',
    icon: 'none',
    duration: 1500
      })
      setTimeout(() =>{
    wx.navigateTo({
          url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/group/group?groupId=' + group.id)
    })
      }, 1500)
      return
  }

  if (group.status !== 'pending') {
      wx.showToast({
    title: '该拼团已结束',
    icon: 'none',
    duration: 2000
      })
      return
  }

  if (groupBuy.isGroupExpired(group)) {
      group.status = 'expired'
      groupBuy.saveGroup(group)
      group.discountText = '¥' + (group.skuPrice - group.groupPrice).toFixed(2)
      this.setData({ group })
      wx.showToast({
    title: '拼团已过期',
    icon: 'none',
    duration: 2000
      })
      return
  }

  if (group.members.length >=group.typeConfig.maxPeople) {
      wx.showToast({
    title: '拼团人数已满',
    icon: 'none',
    duration: 2000
      })
      return
  }

  const userInfo = app.globalData.userInfo || { id: 'default_user', name: '用户', avatar: '/assets/avatars/default.png' }

  try {
      groupBuy.joinGroup(group, {
    id: userInfo.id,
    name: userInfo.name,
    avatar: userInfo.avatar
      })
      groupBuy.saveGroup(group)

      this.setData({
    group,
    isMember: true
      })

      if (group.status ==='success') {
    wx.showToast({
          title: '拼团成功！',
          icon: 'success',
          duration: 2000
    })
    // 跳转到结算
    this.onGoCheckout()
      } else {
    wx.showToast({
          title: '已加入拼团',
          icon: 'success',
          duration: 2000
    })
      }
  } catch (error) {
      wx.showToast({
    title: error.message || '加入失败',
    icon: 'none',
    duration: 2000
      })
  }
  },

  // 去结算
  onGoCheckout() {
  const group = this.data.group
  if (!group) return

  // 创建临时订单
  const tempOrder = {
      isGroupBuy: true,
      groupId: group.id,
      groupType: group.typeId,
      groupPrice: group.isLeader ? group.leaderPrice : group.groupPrice,
      items: [{
    productId: group.productId,
    name: group.productName,
    image: group.mainImage,
    skuId: group.skuId,
    attrs: group.skuAttrs,
    price: group.isLeader ? group.leaderPrice : group.groupPrice,
    quantity: 1
      }],
      totalAmount: group.isLeader ? group.leaderPrice : group.groupPrice,
      createTime: Date.now()
  }

  wx.setStorageSync('tempOrder_direct', tempOrder)

  wx.navigateTo({
      url: '/pages/order/checkout?from=direct_buy&groupBuyId=' + group.id
  })
  },

  // 选择拼团（从列表中）
  onSelectGroup(e) {
  const index = e.currentTarget.dataset.index
  const group = this.data.groupsByProduct[index]
  if (group) {
      wx.redirectTo({
    url: `/pages/group/group?groupId=${group.id}`
      })
  }
  },

  // 去商品详情
  onGoProduct() {
  if (this.data.group) {
      wx.navigateTo({
    url: `/pages/product/detail?id=${this.data.group.productId}`
      })
  } else if (this.data.productId) {
      wx.navigateTo({
    url: `/pages/product/detail?id=${this.data.productId}`
      })
  }
  },

  // 复制邀请链接
  onCopyInviteLink() {
  const group = this.data.group
  if (!group) return

  const link = `pages/group/group?groupId=${group.id}`

  wx.setClipboardData({
      data: link,
      success: () =>{
    wx.showToast({
          title: '邀请链接已复制',
          icon: 'success',
          duration: 2000
    })
      }
  })
  },

  // 显示分享菜单
  onShareTap() {
  wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
  })
  },

  // 查看规则
  onViewRules() {
  const rules = this.data.rules
  const content = rules.map((r, i) =>`${i + 1}. ${r}`).join('\n')

  wx.showModal({
      title: '拼团规则',
      content: content,
      showCancel: false,
      confirmText: '知道了',
      confirmColor: "#2D8C7A"
  })
  },

  onBack() {
  wx.navigateBack()
  }
})
