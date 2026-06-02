/**
 * 诺派永生花 - 微信订阅消息模块
 * 5大关键触点 + 授权收集策略
 */

// 订阅模板ID配置（从微信后台获取）
const TEMPLATES = {
  // 触点1: 好友下单通知（即时激励）
  FRIEND_ORDER: {
    id: '9mdaLmnY0uRg6UXac-82uBtu3_NPMnuCokbgldVrID4',
    name: '购买成功通知',
    keys: ['character_string1', 'short_thing2', 'amount3', 'time4'],
    desc: '好友下单即时通知'
  },
  // 触点2: 收益结算通知（催提现）
  EARNING_SETTLED: {
    id: 'UHH9iqfyhYS9GP-QBlAhac_Ti98HDNlbzxYLUDKMQHk',
    name: '佣金到账通知',
    keys: ['amount1', 'thing2', 'thing3'],
    desc: '收益到账提醒'
  },
  // 触点3: 提现到账通知（信任闭环）
  WITHDRAW_SUCCESS: {
    id: 'EFzFWLPpZv0iTHshRyxC5ZOwJiMbFMepNPfFk1SrGrY',
    name: '分销佣金提现通知',
    keys: ['thing1', 'phone_number2', 'amount3', 'thing4'],
    desc: '提现到账通知'
  },
  // 触点4: 退款/佣金取消通知（防客诉）
  ORDER_REFUND: {
    id: 'YAA2JDZaNUThHIY0ld8C7OGnXBIlPoa2lYz7F1AkKrw',
    name: '订单修改通知',
    keys: ['character_string1', 'time2', 'thing3', 'phrase4', 'thing5'],
    desc: '退款/佣金取消通知'
  },
  // 触点5: 友伴首单大奖通知（裂变引擎）
  REFERRAL_REWARD: {
    id: 'UHH9iqfyhYS9GP-QBlAhac_Ti98HDNlbzxYLUDKMQHk',
    name: '佣金到账通知',
    keys: ['amount1', 'thing2', 'thing3'],
    desc: '邀请好友首单奖励'
  },
  // 额外: 发货通知
  SHIPPING: {
    id: 'tPor8pqKhBNJGUZfsmHfuqgjI4YsGtPTa1ch3cO_f-A',
    name: '发货通知',
    keys: ['character_string1', 'time4', 'character_string5', 'thing6', 'thing3'],
    desc: '订单发货通知'
  },
  // 额外: 待付款通知（催付）
  PENDING_PAYMENT: {
    id: 'CRG_T2kI9v6r5BB1H4CBUsg23p7R_AezOjzFOB-az08',
    name: '待付款通知',
    keys: ['character_string1', 'amount2', 'thing3', 'thing4'],
    desc: '待付款催付通知'
  },
  // 额外: 提现结果通知
  WITHDRAW_RESULT: {
    id: 'f7OOktOfNM_-G0Mr6DooPPLKHvikF-H9Ne1qch4q-84',
    name: '分销佣金提现结果通知',
    keys: ['thing1', 'phone_number2', 'amount3'],
    desc: '提现最终状态通知'
  }
}

// 本地存储key
const STORAGE_KEY_SUBSCRIBED = 'mom_subscribed_templates'
const STORAGE_KEY_DENIED = 'mom_denied_templates'

/**
 * 请求订阅消息授权
 * @param {string[]} templateKeys - 模板key数组，如 ['FRIEND_ORDER', 'EARNING_SETTLED']
 * @returns {Promise<Object>} 授权结果
 */
function requestSubscribe(templateKeys) {
  return new Promise((resolve) => {
    const tmplIds = templateKeys
      .map(key => TEMPLATES[key]?.id)
      .filter(Boolean)

    if (tmplIds.length === 0) {
      resolve({ success: false, reason: '无有效模板' })
      return
    }

    wx.requestSubscribeMessage({
      tmplIds: tmplIds,
      success: (res) => {
        console.log('[订阅消息] 授权结果:', res)
        // 记录授权状态
        const subscribed = getSubscribedTemplates()
        const denied = getDeniedTemplates()

        tmplIds.forEach(id => {
          if (res[id] === 'accept') {
            subscribed.add(id)
            denied.delete(id)
          } else if (res[id] === 'reject') {
            denied.add(id)
            subscribed.delete(id)
          }
        })

        saveSubscribedTemplates(subscribed)
        saveDeniedTemplates(denied)
        resolve({ success: true, result: res })
      },
      fail: (err) => {
        console.warn('[订阅消息] 授权失败:', err)
        resolve({ success: false, reason: err.errMsg })
      }
    })
  })
}

/**
 * 静默检查授权状态（不弹窗）
 * @param {string} templateKey - 模板key
 * @returns {boolean} 是否已授权
 */
function isSubscribed(templateKey) {
  const tmplId = TEMPLATES[templateKey]?.id
  if (!tmplId) return false
  const subscribed = getSubscribedTemplates()
  return subscribed.has(tmplId)
}

// ========== 授权状态管理 ==========

function getSubscribedTemplates() {
  try {
    const data = wx.getStorageSync(STORAGE_KEY_SUBSCRIBED)
    return new Set(Array.isArray(data) ? data : [])
  } catch (e) {
    return new Set()
  }
}

function saveSubscribedTemplates(set) {
  try {
    wx.setStorageSync(STORAGE_KEY_SUBSCRIBED, Array.from(set))
  } catch (e) {
    console.error('[订阅消息] 保存授权状态失败:', e)
  }
}

function getDeniedTemplates() {
  try {
    const data = wx.getStorageSync(STORAGE_KEY_DENIED)
    return new Set(Array.isArray(data) ? data : [])
  } catch (e) {
    return new Set()
  }
}

function saveDeniedTemplates(set) {
  try {
    wx.setStorageSync(STORAGE_KEY_DENIED, Array.from(set))
  } catch (e) {
    console.error('[订阅消息] 保存拒绝状态失败:', e)
  }
}

// ========== 场景化授权触发 ==========

/**
 * 开通妈妈团时 - 一次性收割所有授权
 */
async function requestAllAuth() {
  return await requestSubscribe([
    'FRIEND_ORDER',
    'EARNING_SETTLED',
    'WITHDRAW_SUCCESS',
    'ORDER_REFUND',
    'REFERRAL_REWARD'
  ])
}

/**
 * 分享商品时 - 请求下单通知授权
 */
async function requestShareAuth() {
  return await requestSubscribe(['FRIEND_ORDER', 'REFERRAL_REWARD'])
}

/**
 * 申请提现时 - 请求提现通知授权
 */
async function requestWithdrawAuth() {
  return await requestSubscribe(['WITHDRAW_SUCCESS', 'WITHDRAW_RESULT'])
}

/**
 * 下单成功时 - 请求发货通知授权
 */
async function requestOrderAuth() {
  return await requestSubscribe(['SHIPPING'])
}

// ========== 后端推送数据格式 ==========

/**
 * 生成好友下单通知数据（发送给后端）
 */
function buildFriendOrderData(orderId, productType, amount, earning) {
  return {
    templateId: TEMPLATES.FRIEND_ORDER.id,
    data: {
      character_string1: { value: orderId },
      short_thing2: { value: productType || '商城订单' },
      amount3: { value: amount.toFixed(2) },
      time4: { value: formatTime(new Date()) }
    },
    // 附加业务数据，后端转发时使用
    _biz: {
      earningAmount: earning,
      type: 'friend_order'
    }
  }
}

/**
 * 生成收益结算通知数据
 */
function buildEarningSettledData(amount, totalBalance) {
  return {
    templateId: TEMPLATES.EARNING_SETTLED.id,
    data: {
      amount1: { value: amount.toFixed(2) + '元' },
      thing2: { value: '订单佣金结算' },
      thing3: { value: `收益已到账，当前可提现余额${totalBalance.toFixed(2)}元` }
    },
    _biz: {
      type: 'earning_settled'
    }
  }
}

/**
 * 生成提现到账通知数据
 */
function buildWithdrawSuccessData(amount, account) {
  return {
    templateId: TEMPLATES.WITHDRAW_SUCCESS.id,
    data: {
      thing1: { value: '提现成功' },
      phone_number2: { value: '' },  // 后端填充
      amount3: { value: amount.toFixed(2) },
      thing4: { value: account || '微信零钱' }
    },
    _biz: {
      type: 'withdraw_success'
    }
  }
}

/**
 * 生成退款/佣金取消通知数据
 */
function buildRefundData(orderId, refundAmount, pendingTotal) {
  return {
    templateId: TEMPLATES.ORDER_REFUND.id,
    data: {
      character_string1: { value: orderId },
      time2: { value: formatTime(new Date()) },
      thing3: { value: '买家申请退款，订单取消' },
      phrase4: { value: '已退款' },
      thing5: { value: `佣金已扣除${refundAmount.toFixed(2)}元` }
    },
    _biz: {
      type: 'order_refund'
    }
  }
}

/**
 * 生成友伴首单奖励通知数据
 */
function buildReferralRewardData(rewardAmount, friendName) {
  return {
    templateId: TEMPLATES.REFERRAL_REWARD.id,
    data: {
      amount1: { value: rewardAmount.toFixed(2) + '元' },
      thing2: { value: '友伴首单破冰奖励' },
      thing3: { value: `${friendName || '好友'}完成首单，7天后可提现` }
    },
    _biz: {
      type: 'referral_reward'
    }
  }
}

// ========== 工具函数 ==========

function formatTime(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s}`
}

module.exports = {
  TEMPLATES,
  requestSubscribe,
  isSubscribed,
  requestAllAuth,
  requestShareAuth,
  requestWithdrawAuth,
  requestOrderAuth,
  buildFriendOrderData,
  buildEarningSettledData,
  buildWithdrawSuccessData,
  buildRefundData,
  buildReferralRewardData
}
