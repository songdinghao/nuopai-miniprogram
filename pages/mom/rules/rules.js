// pages/mom/rules/rules.js - 规则说明页逻辑
const app = getApp()

Page({
  data: {
  fontSizeClass: '',
  searchKeyword: '',
  searchResults: [],
  scrollTarget: '',
  // 规则数据 - 用于搜索
  rulesData: [
      { section: 'section - access', sectionName: '准入规则', keywords: '资格 参与 新手 新手期 加入 注册 范围 特殊', content: '参与资格: 诺派永生花商城注册用户均可参与分享奖励计划。参与方式: 在商品详情页点击分享按钮, 将商品通过微信分享给好友。新手期: 新加入用户享有30天新手引导期。适用范围: 商城在售商品均参与分享奖励计划。' },
      { section: 'section - income', sectionName: '分享津贴规则', keywords: '津贴 计算 奖励 比例 发放 结算 额外 加成 退款 取消', content: '津贴计算: 分享津贴等于订单实付金额乘以分享奖励比例。奖励比例分为3%、5%、8%三档。奖励发放: 好友确认收货后7个工作日内结算。额外奖励: 新手期内额外获得2%加成奖励。特殊情况: 退款或取消订单不予结算。' },
      { section: 'section - withdraw', sectionName: '提现规则', keywords: '提现 门槛 微信 零钱 限额 手续费 时间 实名', content: '提现门槛: 累计分享津贴满10元可提现。提现方式: 通过微信零钱提现实时到账。单笔提现上限500元。提现免收手续费。每日9: 00 - 22: 00可提现。' },
      { section: 'section - exchange', sectionName: '权益兑换规则', keywords: '兑换 商品 权益 现金 混合支付 有效期 清零', content: '兑换方式: 1元津贴等于1元等值权益。可兑换商城指定商品, 支持津贴加现金混合支付。分享津贴自到账之日起180天内有效。' },
      { section: 'section - notes', sectionName: '补充说明', keywords: '补充 说明 非正常 取消资格 调整 公示', content: '请勿使用非正常手段获取奖励。诺派有权调整规则并公示。如有疑问可联系客服。' }
  ]
  },

  onLoad() {
  app.loadUserPreferences()
  app.watchFontSizeChange(this.onFontSizeChange.bind(this))

  const prefs = app.globalData.userPreferences || {}
  this.setData({ fontSizeClass: prefs.fontSize || 'normal' })
  },

  onFontSizeChange(fontSize) {
  this.setData({ fontSizeClass: fontSize })
  },

  goBack() {
  wx.navigateBack()
  },

  // 搜索输入
  onSearchInput(e) {
  const keyword = e.detail.value.trim()
  this.setData({ searchKeyword: keyword })

  if (keyword) {
      this.doSearch(keyword)
  } else {
      this.setData({ searchResults: [] })
  }
  },

  // 执行搜索
  doSearch(keyword) {
  keyword = keyword || this.data.searchKeyword
  if (!keyword) return

  const kw = keyword.toLowerCase()
  const results = []

  this.data.rulesData.forEach(item =>{
      // 匹配关键词
      const keywordMatch = item.keywords.includes(kw) || item.keywords.replace(/\s/g, '').includes(kw)
      // 匹配内容
      let matchIndex = -1
      if (!keywordMatch) {
    matchIndex = item.content.indexOf(kw)
    if (matchIndex ===-1) {
          // 尝试逐字匹配
          const chars = kw.split('')
          matchIndex = chars.some(c =>item.content.includes(c)) ? item.content.indexOf(kw[0]) : -1
    }
      }

      if (keywordMatch || matchIndex >=0) {
    // 提取匹配上下文
    let matchText = item.content
    if (matchIndex >=0) {
          const start = Math.max(0, matchIndex - 10)
          const end = Math.min(item.content.length, matchIndex + kw.length + 20)
          matchText = (start > 0 ? '...' : '') + item.content.slice(start, end) + (end < item.content.length ? '...' : '')
    } else {
          matchText = item.content.slice(0, 40) + (item.content.length > 40 ? '...' : '')
    }

    results.push({
          section: item.section,
          sectionName: item.sectionName,
          matchText
    })
      }
  })

  this.setData({ searchResults: results.slice(0, 10) })
  },

  // 清除搜索
  clearSearch() {
  this.setData({
      searchKeyword: '',
      searchResults: []
  })
  },

  // 滚动到指定区块
  scrollToSection(e) {
  const section = e.currentTarget.dataset.section || e.target.dataset.section
  if (!section) return

  this.setData({ scrollTarget: section })

  // 清除搜索结果
  if (this.data.searchKeyword) {
      this.clearSearch()
  }
  }
})
