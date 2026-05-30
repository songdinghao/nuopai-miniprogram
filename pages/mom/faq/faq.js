// pages/mom/faq/faq.js - 常见问题页逻辑
//=========== ========== ========== ========== ========== ==== ==== =
// TODO: 当前 FAQ 数据为硬编码，未来可接入远程配置
// 方案1: 通过后端 CMS 接口按需拉取分类/问题/答案
// 方案2: 使用微信云开发数据库存储 FAQ 内容
// 方案3: 在 app.js 的 onLaunch 中调用配置接口，缓存至 globalData.faqConfig
// 加载时优先使用 remoteConfig，回退至本地默认数据
//=========== ========== ========== ========== ========== ==== ==== =
const app = getApp()

Page({
  data: {
  fontSizeClass: '',
  faqData: [
      {
    categoryId: 'mom',
    categoryName: '兼职妈妈体验官',
    items: [
          {
      id: 'm1',
      question: '如何成为兼职妈妈体验官？',
      answer: '打开小程序，进入"我的"页面，点击"兼职妈妈体验官"入口，阅读规则后点击"立即加入"即可开通。无需任何费用，0门槛入驻。成为体验官后，您可以生成专属分享素材，通过分享获得收益。',
      expanded: false
          },
          {
      id: 'm2',
      question: '如何获得收益？佣金比例是多少？',
      answer: '收益来源：生成专属素材→分享给好友→好友通过您的链接下单→订单完成后获得佣金。佣金比例根据商品品类分为3%、5%、8%三档，新手期内额外获得2%加成奖励。具体比例在商品分享页面有标注。',
      expanded: false
          },
          {
      id: 'm3',
      question: '收益如何计算？什么时候到账？',
      answer: '收益 = 订单金额 × 佣金比例。好友确认收货后，分享津贴将在7个工作日内结算到您的账户。您可以在"我的主页"查看收益明细，包括每笔订单的金额、状态和到账时间。',
      expanded: false
          },
          {
      id: 'm4',
      question: '如何提现？提现门槛是多少？',
      answer: '累计收益满10元即可申请提现。进入"我的主页"→点击"提现"按钮→输入提现金额→确认提现。提现通过微信零钱实时到账，一般不超过5分钟。如超过30分钟未到账，请联系在线客服。',
      expanded: false,
      action: { type: 'contact' }
          },
          {
      id: 'm5',
      question: '邀请好友有奖励吗？',
      answer: '有奖励！邀请好友成为兼职妈妈体验官，好友完成首单后，您将获得额外奖励：①好友首单金额的3%作为邀请奖励；②您自己的订单佣金正常计算；③被邀请人体验官等级提升时，邀请人可获得等级提升奖励。',
      expanded: false
          },
          {
      id: 'm6',
      question: '如何生成分享素材？可以修改素材内容吗？',
      answer: '进入"我的主页"→点击"素材库"→选择商品→一键生成海报和文案。您可以：①直接分享生成的素材；②复制文案后自行搭配图片；③保存海报到相册后分享。素材内容由系统自动生成，暂不支持自定义修改，但可以选择不同的模板风格。',
      expanded: false
          },
          {
      id: 'm7',
      question: '体验官等级如何提升？等级有什么特权？',
      answer: '等级提升条件：L1→L2：累计分享10次；L2→L3：累计有效订单20单；L3→L4：累计收益满1000元。等级特权：①佣金比例加成（L2+1%，L3+2%，L4+3%）；②专属素材模板；③优先客服通道；④等级徽章展示。',
      expanded: false
          },
          {
      id: 'm8',
      question: '什么是有效订单？无效订单有哪些情况？',
      answer: '有效订单：好友通过您的分享链接下单，且确认收货后未申请退款的订单。无效订单：①好友下单后申请退款/退货；②疑似虚假交易（同一IP多次下单、异常大额订单等）；③好友通过其他渠道下单（未使用您的分享链接）。无效订单不计算佣金。',
      expanded: false
          },
          {
      id: 'm9',
      question: '分享次数如何统计？',
      answer: '分享次数统计规则：①每生成一次分享素材（海报/链接/文案）计为1次分享；②同一商品多次分享会累计计数；③分享后好友未点击不计入有效分享，但仍计入分享次数。您可以在"我的主页"查看分享次数统计。',
      expanded: false
          },
          {
      id: 'm10',
      question: '虚假交易会怎样？如何避免？',
      answer: '虚假交易行为：①自己下单刷单；②诱导好友下单后退款；③使用多个账号自我邀请。处罚措施：首次发现警告并扣除非法收益，二次发现永久封禁体验官资格。建议：真诚分享，让好友真正喜欢产品，才能获得长期稳定收益。',
      expanded: false,
      action: { type: 'contact' }
          },
          {
      id: 'm11',
      question: '兼职妈妈体验官有什么条件限制吗？',
      answer: '基本无需条件：①需实名认证（绑定手机号）；②需同意《兼职妈妈体验官协议》；③需满18周岁。无人数限制、无地域限制、无时间限制。唯一要求：不得使用虚假交易等违规行为，一旦发现将取消资格。',
      expanded: false
          },
          {
      id: 'm12',
      question: '如何查看我的分享效果和收益明细？',
      answer: '进入"我的主页"可以查看：①累计收益、分享次数、有效订单；②收益明细（每笔订单的金额、状态、到账时间）；③分享记录（哪些商品被分享、点击量）；④提现记录（提现金额、到账状态）。数据实时更新，随时随地掌握分享效果。',
      expanded: false,
      action: { type: 'navigate', text: '去我的主页', url: '/pages/mom/home/home' }
          }
    ]
      },
      {
    categoryId: 'income',
    categoryName: '收益问题',
    items: [
          {
      id: 'i1',
      question: '分享津贴什么时候到账？',
      answer: '好友确认收货后，分享津贴将在7个工作日内结算到您的账户。新手期内还会有额外2%的加成奖励。您可以在"我的分享中心"页面查看收益明细。',
      expanded: false
          },
          {
      id: 'i2',
      question: '分享津贴为什么还没到账？',
      answer: '津贴未到账可能有以下原因：①好友尚未确认收货；②该笔订单处于7天结算期内；③好友已申请退款。建议您先查看订单状态，如超过7个工作日仍未到账，请联系在线客服。',
      expanded: false,
      action: { type: 'contact' }
          },
          {
      id: 'i3',
      question: '为什么今天的收益是0？',
      answer: '当天收益为0可能是因为今天没有好友通过您的分享链接下单，或者好友的订单还在处理中。您可以尝试分享更多商品给好友。每天最多收到1条收益通知。',
      expanded: false
          },
          {
      id: 'i4',
      question: '奖励比例是多少？',
      answer: '分享奖励比例根据商品品类分为3%、5%、8%三档。新手期内额外获得2%加成。具体比例在商品分享页面有标注，您可在分享前查看。',
      expanded: false
          }
    ]
      },
      {
    categoryId: 'withdraw',
    categoryName: '提现问题',
    items: [
          {
      id: 'w1',
      question: '提现最低金额是多少？',
      answer: '累计分享津贴满10元即可申请提现。提现金额不足10元时，建议您继续分享商品累积津贴后再提现。',
      expanded: false
          },
          {
      id: 'w2',
      question: '提现多久到账？',
      answer: '提现申请提交后，将通过微信零钱实时到账。如遇到网络延迟，一般在5分钟内到账。如果超过30分钟未到账，请联系在线客服。',
      expanded: false,
      action: { type: 'contact' }
          },
          {
      id: 'w3',
      question: '提现失败可能的原因？',
      answer: '提现失败常见原因有：①微信账号未实名认证；②单笔提现超过500元上限；③当日提现超过1000元上限；④网络异常。请检查后重新尝试。',
      expanded: false
          },
          {
      id: 'w4',
      question: '提现有手续费吗？',
      answer: '分享津贴提现完全免费，不收取任何手续费。如果发现有收取手续费的情况，请立即联系在线客服核实。',
      expanded: false,
      action: { type: 'contact' }
          }
    ]
      },
      {
    categoryId: 'general',
    categoryName: '其他问题',
    items: [
          {
      id: 'g1',
      question: '分享津贴会过期吗？',
      answer: '分享津贴自到账之日起180天内有效，逾期未使用的津贴将自动清零。建议您及时在商城兑换商品或提现，以免过期浪费。',
      expanded: false
          },
          {
      id: 'g2',
      question: '可以用津贴兑换商品吗？',
      answer: '可以。分享津贴支持在商城中兑换指定商品，1元津贴等值1元权益。部分商品还支持"津贴 + 现金"混合支付，在结算页面选择"使用津贴"即可。',
      expanded: false,
      action: { type: 'navigate', text: '去商城逛逛', url: '/pages/index/index' }
          },
          {
      id: 'g3',
      question: '分享后好友未下单会有奖励吗？',
      answer: '好友需要通过您分享的链接完成下单并确认收货，您才能获得分享津贴。仅分享但未产生订单的情况下，无法获得奖励。',
      expanded: false
          },
          {
      id: 'g4',
      question: '如何联系客服？',
      answer: '您可以通过以下方式联系我们：\n① 点击页面上的"联系客服"按钮，通过微信客服消息咨询；\n② 在常见问题页面没有找到答案时，可以使用"联系在线客服"按钮。\n客服工作时间：每日9: 00 - 21: 00',
      expanded: false,
      action: { type: 'contact' }
          }
    ]
      }
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

  // 折叠展开切换
  toggleItem(e) {
  const { category: catIdx, index } = e.currentTarget.dataset
  const key = `faqData[${catIdx}].items[${index}].expanded`
  this.setData({
      [key]: !this.data.faqData[catIdx].items[index].expanded
  })
  },

  // 导航操作
  navigateAction(e) {
  const url = e.currentTarget.dataset.url
  if (url) {
    const tabBarPages = ['/pages/index/index', '/pages/category/category', '/pages/cart/cart', '/pages/user/user']
    const cleanUrl = url.split('?')[0]
    if (tabBarPages.includes(cleanUrl)) {
      wx.switchTab({ url: cleanUrl })
    } else {
      wx.navigateTo({ url })
    }
  }
  },

  // 客服联系
  onContact(e) {
  if (e.detail && e.detail.path) {
  }
  },

  // 跳转到规则页
  goToRules() {
  wx.navigateTo({ url: '/pages/mom/rules/rules' })
  },

  // 跳转到设置页
  goToSettings() {
  wx.navigateTo({ url: '/pages/mom/settings/settings' })
  }
})
