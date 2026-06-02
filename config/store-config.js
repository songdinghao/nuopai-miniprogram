// config/store - config.js - 微信小店配置
module.exports = {
  // 店铺列表
  stores: [
  {
      name: '诺派永生花 - 老店',
      appid: 'wx7f092564e7a079a6',
      // AppSecret 严禁出现在前端代码中，应从服务端环境变量获取
      description: '主要销售店铺，已有58款产品',
      default: true,
      enabled: true,
      category: '永生花家居装饰',
      region: '全国'
  },
  {
      name: '诺派永生花 - 新店',
      appid: 'wx3498661d7ac05e32',
      // AppSecret 严禁出现在前端代码中，应从服务端环境变量获取
      description: '备用新店铺，需完成基础设置',
      default: false,
      enabled: false,
      category: '永生花家居装饰',
      region: '全国',
      note: '需先完成：缴纳保证金、申请类目、设置售后地址、创建运费模板'
  }
  ],

  // API配置
  api: {
  baseUrl: 'https://api.weixin.qq.com',
  timeout: 30000, // 30秒超时
  maxRetries: 3,  // 最大重试次数
  retryDelay: 1000, // 重试延迟1秒
  rateLimit: 10   // 每秒最多10个请求
  },

  // 商品分类配置（按场景分类）
  categories: [
  {
      id: 'xuanguan',
      name: '玄关摆件',
      description: '入户第一眼，家的门面担当',
      icon: '/assets/icons/category-xuanguan.png',
      sort: 1,
      enabled: true,
      subCategories: [
    { id: 'xuanguan_duanjingtai', name: '玄关端景台', description: '端景台专用摆件' },
    { id: 'xuanguan_gui', name: '玄关柜', description: '玄关柜装饰' },
    { id: 'xuanguan_chaji', name: '玄关茶几', description: '玄关茶几装饰' }
      ]
  },
  {
      id: 'keting',
      name: '客厅装饰',
      description: '家人团聚，温馨客厅',
      icon: '/assets/icons/category-keting.png',
      sort: 2,
      enabled: true,
      subCategories: [
    { id: 'keting_chaji', name: '客厅茶几', description: '茶几装饰摆件' },
    { id: 'keting_dianshigui', name: '电视柜', description: '电视柜装饰' },
    { id: 'keting_shafa', name: '沙发边几', description: '沙发旁装饰' }
      ]
  },
  {
      id: 'canting',
      name: '餐厅花艺',
      description: '美食与花艺的完美结合',
      icon: '/assets/icons/category-canting.png',
      sort: 3,
      enabled: true,
      subCategories: [
    { id: 'canting_canzhuo', name: '餐桌花', description: '餐桌装饰' },
    { id: 'canting_canbiangui', name: '餐边柜', description: '餐边柜装饰' }
      ]
  },
  {
      id: 'woshi',
      name: '卧室装饰',
      description: '温馨卧室，甜蜜梦乡',
      icon: '/assets/icons/category-woshi.png',
      sort: 4,
      enabled: true,
      subCategories: [
    { id: 'woshi_chuangtou', name: '床头柜', description: '床头装饰' },
    { id: 'woshi_shuzhuo', name: '梳妆台', description: '梳妆台装饰' }
      ]
  },
  {
      id: 'shufang',
      name: '书房装饰',
      description: '静谧书房，书香花香',
      icon: '/assets/icons/category-shufang.png',
      sort: 5,
      enabled: true,
      subCategories: [
    { id: 'shufang_shuzhuo', name: '书桌', description: '书桌装饰' },
    { id: 'shufang_shugui', name: '书柜', description: '书柜装饰' }
      ]
  },
  {
      id: 'songli',
      name: '商务送礼',
      description: '高端商务，品质之选',
      icon: '/assets/icons/category-songli.png',
      sort: 6,
      enabled: true,
      subCategories: [
    { id: 'songli_qiye', name: '企业礼品', description: '企业商务礼品' },
    { id: 'songli_kaive', name: '开业花篮', description: '开业庆典装饰' }
      ]
  },
  {
      id: 'jiari',
      name: '节日专题',
      description: '节日专属，氛围营造',
      icon: '/assets/icons/category-jiari.png',
      sort: 7,
      enabled: true,
      subCategories: [
    { id: 'jiari_chunjie', name: '春节年宵', description: '春节装饰' },
    { id: 'jiari_muqinjie', name: '母亲节', description: '母亲节礼物' },
    { id: 'jiari_qingrenjie', name: '情人节', description: '情人节礼物' }
      ]
  }
  ],

  // 价格区间配置
  priceRanges: [
  { id: 'range_200_300', name: '200 - 300元', min: 200, max: 300, description: '性价比之选' },
  { id: 'range_300_400', name: '300 - 400元', min: 300, max: 400, description: '品质优选' },
  { id: 'range_400_500', name: '400 - 500元', min: 400, max: 500, description: '高端精选' },
  { id: 'range_500_up', name: '500元以上', min: 500, max: 9999, description: '奢华定制' }
  ],

  // 花材类型配置
  flowerTypes: [
  { id: 'rose', name: '玫瑰', icon: '/assets/icons/flower-rose.png', color: '#C9A96E' },
  { id: 'hydrangea', name: '绣球', icon: '/assets/icons/flower-hydrangea.png', color: '#4CAF50' },
  { id: 'peony', name: '牡丹', icon: '/assets/icons/flower-peony.png', color: '#FF9A3D' },
  { id: 'lily', name: '百合', icon: '/assets/icons/flower-lily.png', color: '#9C27B0' },
  { id: 'carnation', name: '康乃馨', icon: '/assets/icons/flower-carnation.png', color: '#FF4081' },
  { id: 'sunflower', name: '向日葵', icon: '/assets/icons/flower-sunflower.png', color: '#FFC107' }
  ],

  // 颜色配置
  colors: [
  { id: 'pink', name: '粉色系', value: '#C9A96E', description: '温柔浪漫' },
  { id: 'white', name: '白色系', value: '#FFFFFF', description: '纯净简约' },
  { id: 'purple', name: '紫色系', value: '#9C27B0', description: '神秘优雅' },
  { id: 'yellow', name: '黄色系', value: '#FFC107', description: '明亮温暖' },
  { id: 'blue', name: '蓝色系', value: '#2196F3', description: '宁静清新' },
  { id: 'green', name: '绿色系', value: '#4CAF50', description: '自然生机' }
  ],

  // 风格配置
  styles: [
  { id: 'modern', name: '现代简约', icon: '/assets/icons/style-modern.png' },
  { id: 'luxury', name: '轻奢高级', icon: '/assets/icons/style-luxury.png' },
  { id: 'rural', name: '田园风', icon: '/assets/icons/style-rural.png' },
  { id: 'chinese', name: '中式古典', icon: '/assets/icons/style-chinese.png' },
  { id: 'european', name: '欧式复古', icon: '/assets/icons/style-european.png' }
  ],

  // 场景配置（用于AR预览）
  scenes: [
  {
      id: 'scene_xuanguan',
      name: '玄关场景',
      description: '入户玄关，家的第一印象',
      modelUrl: '/assets/models/scene_xuanguan.glb',
      thumbnail: '/assets/images/scene_xuanguan.jpg',
      hotspots: [
    { x: 0.5, y: 0.3, name: '端景台位置', description: '适合放置大型摆件' },
    { x: 0.3, y: 0.6, name: '玄关柜', description: '适合放置中小型摆件' }
      ]
  },
  {
      id: 'scene_keting',
      name: '客厅场景',
      description: '家人团聚的温馨空间',
      modelUrl: '/assets/models/scene_keting.glb',
      thumbnail: '/assets/images/scene_keting.jpg',
      hotspots: [
    { x: 0.4, y: 0.4, name: '茶几中央', description: '客厅视觉焦点' },
    { x: 0.7, y: 0.5, name: '电视柜', description: '背景墙装饰' },
    { x: 0.2, y: 0.6, name: '沙发边几', description: '休闲区域装饰' }
      ]
  },
  {
      id: 'scene_canting',
      name: '餐厅场景',
      description: '美食与花艺的完美结合',
      modelUrl: '/assets/models/scene_canting.glb',
      thumbnail: '/assets/images/scene_canting.jpg',
      hotspots: [
    { x: 0.5, y: 0.5, name: '餐桌中央', description: '用餐氛围营造' },
    { x: 0.8, y: 0.3, name: '餐边柜', description: '收纳展示空间' }
      ]
  }
  ],

  // 运费模板配置
  shippingTemplates: [
  {
      id: 'template_free',
      name: '包邮模板',
      type: 'free',
      description: '全场满99元包邮',
      enabled: true,
      conditions: [
    { minAmount: 99, shippingFee: 0 }
      ]
  },
  {
      id: 'template_standard',
      name: '标准运费',
      type: 'standard',
      description: '普通地区运费',
      enabled: true,
      conditions: [
    { region: '全国', firstWeight: 10, firstFee: 8, additionalWeight: 1, additionalFee: 2 }
      ]
  }
  ],

  // 支付配置
  payment: {
  enabled: true,
  methods: [
      { id: 'wechat', name: '微信支付', icon: '/assets/icons/payment-wechat.png', enabled: true },
      { id: 'balance', name: '余额支付', icon: '/assets/icons/payment-balance.png', enabled: true }
  ],
  minAmount: 1, // 最小支付金额
  maxAmount: 50000 // 最大支付金额
  },

  // 客服配置
  customerService: {
  enabled: true,
  workTime: '9: 00 - 18: 00',
  phone: '400-000-0000', // TODO: 替换为真实客服电话
  wechat: 'nuopai_service',
  qq: '123456789',
  email: 'service@nuopai.com'
  },

  // 组合购配置
  bundles: [
  {
      id: 'bundle_xuanguan',
      name: '玄关温馨套装',
      discount: 0.9,
      items: ['xuanguan_duanjingtai', 'xuanguan_gui'],
      description: '玄关端景台+玄关柜组合，省10%'
  },
  {
      id: 'bundle_keting',
      name: '客厅雅致套装',
      discount: 0.88,
      items: ['keting_chaji', 'keting_dianshigui'],
      description: '客厅茶几+电视柜组合，省12%'
  }
  ],

  // 收益兑换商品列表
  exchangeProducts: [
  { id: '100001', name: '玄关端景台永生花玫瑰摆件', image: '/assets/products/product1.jpg', price: 268, useEarnings: 100 },
  { id: '100002', name: '客厅茶几绣球花装饰', image: '/assets/products/product2.jpg', price: 298, useEarnings: 120 },
  { id: '100003', name: '餐厅餐桌牡丹花艺', image: '/assets/products/product3.jpg', price: 328, useEarnings: 150 },
  { id: '100004', name: '卧室床头柜百合装饰', image: '/assets/products/product4.jpg', price: 248, useEarnings: 80 },
  { id: '100005', name: '春季限定樱花系列', image: '/assets/products/product5.jpg', price: 288, useEarnings: 120 },
  { id: '100006', name: '母亲节康乃馨花篮', image: '/assets/products/product6.jpg', price: 198, useEarnings: 60 }
  ],

  getExchangeProductList: function () {
  return this.exchangeProducts
  },
  groupBuy: {
  enabled: true,
  types: [
      {
    id: 'group2',
    name: '2人团',
    minPeople: 2,
    maxPeople: 2,
    discountRate: 0.92,        // 拼团价 = 原价 * 0.92
    leaderBonusRate: 0.02,     // 团长额外优惠比例
    defaultDuration: 24,       // 默认有效期24小时
    leaderGift: '精美贺卡',     // 团长赠品
    label: '2人成团',
    desc: '2人一起买，每人省8%'
      },
      {
    id: 'group3',
    name: '3人团',
    minPeople: 3,
    maxPeople: 3,
    discountRate: 0.85,        // 拼团价 = 原价 * 0.85
    leaderBonusRate: 0.03,     // 团长额外优惠比例
    defaultDuration: 48,       // 默认有效期48小时
    leaderGift: '精美贺卡 + 丝带',
    label: '3人成团',
    desc: '3人一起买，每人省15%'
      }
  ],
  // 拼团标签样式
  tagStyle: {
      backgroundColor: '#E8F5E9',
      textColor: '#2D8C7A'
  },
  // 拼团分享配置
  share: {
      title: '【拼团】{productName} - 诺派永生花',
      imageUrl: '/assets/share/group-share.jpg',
      desc: '和我一起拼团买{productName}吧！已{currentCount}人参与，就差{needCount}人了~'
  },
  // 拼团规则说明
  rules: [
      '拼团活动仅限微信小程序内参与',
      '团长开团后，需在有效期内邀请好友参团',
      '拼团成功后，订单将按拼团价结算',
      '拼团失败（过期未成团），订单将自动取消并全额退款',
      '团长可获得额外优惠或赠品',
      '每个用户对同一商品仅可参与一个有效拼团',
      '拼团订单享受正常售后服务'
  ]
  },

  // 营销活动配置
  marketing: {
  // 满减活动
  promotions: {
      fullReduction: [
        { id: 'fr299', threshold: 299, discount: 30, label: '满299减30' },
        { id: 'fr499', threshold: 499, discount: 50, label: '满499减50' },
        { id: 'fr699', threshold: 699, discount: 80, label: '满699减80' }
      ]
  },

  // 优惠券
  coupons: {
      enabled: true,
      types: [
    { id: 'new_user', name: '新人券', amount: 20, minAmount: 100, validDays: 30 },
    { id: 'birthday', name: '生日券', amount: 50, minAmount: 200, validDays: 7 }
      ],
      firstOrder: { id: 'first_order', name: '首单立减', amount: 15, minAmount: 99, validDays: 7 },
      repurchase: { id: 'repurchase', name: '回头客专享', amount: 20, minAmount: 150, validDays: 15 }
  },

  // 积分
  points: {
      enabled: true,
      earnRules: [
    { action: 'register', points: 100, description: '注册送积分' },
    { action: 'purchase', points: 'amount*0.1', description: '消费积分' },
    { action: 'share', points: 20, description: '分享送积分' }
      ],
      useRules: [
    { points: 100, amount: 1, description: '100积分抵1元' }
      ]
  },

  // 会员等级
  membership: [
      { level: 1, name: '普通会员', minPoints: 0, discount: 0.98 },
      { level: 2, name: '银卡会员', minPoints: 1000, discount: 0.95 },
      { level: 3, name: '金卡会员', minPoints: 5000, discount: 0.9 },
      { level: 4, name: '钻石会员', minPoints: 10000, discount: 0.85 }
  ]
  },

  // 通知配置
  notifications: {
  // 订单通知
  order: {
      created: { enabled: true, template: '您的订单已创建，订单号：{orderNo}' },
      paid: { enabled: true, template: '您的订单已支付，我们将尽快发货' },
      shipped: { enabled: true, template: '您的订单已发货，物流单号：{trackingNo}' },
      completed: { enabled: true, template: '您的订单已完成，感谢您的购买' }
  },

  // 营销通知
  marketing: {
      coupon: { enabled: true, template: '您有一张{amount}元优惠券待使用' },
      activity: { enabled: true, template: '新活动上线：{activityName}' }
  },

  // 系统通知
  system: {
      maintenance: { enabled: true, template: '系统将于{time}进行维护' },
      update: { enabled: true, template: '新版本{version}已上线' }
  }
  },

  // 数据统计配置
  analytics: {
  enabled: false,  // 开发阶段关闭埋点，避免API不可达导致Error: timeout
  // 页面访问统计
  pageViews: {
      enabled: true,
      trackPages: ['index', 'category', 'product', 'cart', 'order']
  },

  // 事件统计
  events: {
      enabled: true,
      trackEvents: [
    'product_view', 'product_click', 'add_to_cart',
    'remove_from_cart', 'begin_checkout', 'purchase'
      ]
  },

  // 用户行为统计
  userBehavior: {
      enabled: true,
      trackSessions: true,
      trackDuration: true,
      trackScroll: true
  }
  },

  // 环境配置
  environment: {
  // 开发环境
  development: {
      apiBaseUrl: 'https://wechat.zzjgsw.com/api',
      debug: true,
      logLevel: 'debug'
  },

  // 测试环境
  staging: {
      apiBaseUrl: 'https://staging.wechat.zzjgsw.com/api',
      debug: true,
      logLevel: 'info'
  },

  // 生产环境
  production: {
      apiBaseUrl: 'https://wechat.zzjgsw.com/api',
      debug: false,
      logLevel: 'error'
  }
  },

  // 版本信息
  version: {
  current: '1.0.0',
  minVersion: '1.0.0',
  forceUpdate: false,
  updateNotes: '首次版本上线，包含基础商城功能'
  },

  // 其他配置
  other: {
  // 搜索配置
  search: {
      hotKeywords: ['永生花', '客厅摆件', '玄关装饰', '母亲节礼物', '玫瑰'],
      historyLimit: 10
  },

  // 图片配置
  images: {
      maxSize: 5 * 1024 * 1024, // 5MB
      formats: ['jpg', 'jpeg', 'png', 'webp'],
      quality: 0.8
  },

  // 缓存配置
  cache: {
      productList: 300, // 5分钟
      productDetail: 600, // 10分钟
      categories: 1800, // 30分钟
      userInfo: 3600 // 1小时
  }
  }
}
