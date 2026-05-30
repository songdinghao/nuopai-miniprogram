// pages/help/help.js - 帮助中心页面
const app = getApp()

Page({
  data: {
    faqList: [
      {
        q: '如何下单购买？',
        a: '选择心仪商品 → 点击"加入购物车"或"立即购买" → 选择规格 → 填写收货地址 → 提交订单并支付即可。',
        open: false
      },
      {
        q: '支持哪些支付方式？',
        a: '目前支持微信支付，后续将陆续开通更多支付方式。',
        open: false
      },
      {
        q: '如何查看物流信息？',
        a: '进入"我的" → "我的订单" → 找到对应订单 → 点击查看详情，即可查看物流状态和快递单号。',
        open: false
      },
      {
        q: '可以退换货吗？',
        a: '永生花属于特殊商品，非质量问题不支持无理由退换。如收到商品有破损，请在签收24小时内联系客服处理。',
        open: false
      },
      {
        q: '永生花能保存多久？',
        a: '诺派永生花采用特殊工艺处理，在避免阳光直射、保持干燥的环境下，可保存2-3年甚至更久。',
        open: false
      },
      {
        q: '如何保养永生花？',
        a: '①避免阳光直射 ②保持干燥通风 ③勿浇水 ④勿用手频繁触摸花瓣 ⑤可用软毛刷轻轻除尘。',
        open: false
      },
      {
        q: '优惠券怎么使用？',
        a: '下单时在结算页面可选择可用优惠券。优惠券有使用门槛和有效期，请留意详情。',
        open: false
      },
      {
        q: '如何联系客服？',
        a: '客服微信：nuopai_service\n客服电话：400-123-4567\n工作时间：9:00-18:00（周一至周日）',
        open: false
      },
      {
        q: '积分有什么用？',
        a: '积分可在积分商城中兑换商品或优惠券。每消费1元可获得1积分，积分长期有效。',
        open: false
      }
    ]
  },

  onLoad() {
    app.globalData.currentPage = 'help'
  },

  // 展开/收起FAQ
  onFaqTap(e) {
    const index = e.currentTarget.dataset.index
    const key = `faqList[${index}].open`
    this.setData({
      [key]: !this.data.faqList[index].open
    })
  },

  // 联系客服
  onContactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服微信：nuopai_service\n客服电话：400-123-4567\n工作时间：9:00-18:00',
      confirmText: '复制微信号',
      confirmColor: '#2D8C7A',
      cancelText: '关闭',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'nuopai_service',
            success: () => {
              wx.showToast({
                title: '微信号已复制',
                icon: 'success',
                duration: 2000
              })
            }
          })
        }
      }
    })
  },

  onShareAppMessage() {
    return {
      title: '诺派永生花 - 帮助中心',
      path: '/pages/help/help'
    }
  }
})
