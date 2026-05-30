/**
  * 诺派永生花 - 兼职妈妈素材库工具
  * 提供模拟素材生成功能（无后端，纯模拟）
  */

// 模拟商品数据（用于素材生成）
const MOCK_PRODUCTS = [
  {
  id: 'prod_001',
  name: '粉色玫瑰永生花礼盒',
  image: '/assets/images/product-placeholder.png',
  price: 299.00,
  desc: '精选厄瓜多尔玫瑰，粉嫩温柔，永久绽放',
  type: 'premium'
  },
  {
  id: 'prod_002',
  name: '蓝色绣球永生花摆件',
  image: '/assets/images/product-placeholder.png',
  price: 359.00,
  desc: '梦幻蓝色绣球搭配满天星，清新雅致',
  type: 'premium'
  },
  {
  id: 'prod_003',
  name: '白色蝴蝶兰永生花礼盒',
  image: '/assets/images/product-placeholder.png',
  price: 459.00,
  desc: '高端白色蝴蝶兰，气质优雅，送礼首选',
  type: 'luxury'
  },
  {
  id: 'prod_004',
  name: '莫兰迪色系永生花桌花',
  image: '/assets/images/product-placeholder.png',
  price: 238.00,
  desc: '低饱和莫兰迪色系，百搭各种家居风格',
  type: 'standard'
  },
  {
  id: 'prod_005',
  name: '爱心玫瑰永生花礼盒',
  image: '/assets/images/product-placeholder.png',
  price: 329.00,
  desc: '爱心造型玫瑰礼盒，表白送礼的浪漫之选',
  type: 'premium'
  },
  {
  id: 'prod_006',
  name: '向日葵永生花瓶中花',
  image: '/assets/images/product-placeholder.png',
  price: 198.00,
  desc: '明亮向日葵搭配尤加利，给家一抹阳光',
  type: 'promotion'
  },
  {
  id: 'prod_007',
  name: '粉色绣球永生花摆件',
  image: '/assets/images/product-placeholder.png',
  price: 268.00,
  desc: '大颗粉色绣球，饱满圆润，少女心满满',
  type: 'standard'
  },
  {
  id: 'prod_008',
  name: '永生花玻璃罩礼盒',
  image: '/assets/images/product-placeholder.png',
  price: 398.00,
  desc: '透明玻璃罩守护永恒之花，精致送礼首选',
  type: 'premium'
  }
]

// 文案模板 - 按商品类型分组
const COPY_TEMPLATES = {
  rose: [
  '哇塞！这个粉色玫瑰永生花真的美哭了🥺 开到家里闺蜜都问我哪里买的，放在床头每天看到心情都好！姐妹们冲就完事了～',
  '入手了这个永生花礼盒，质感绝了！玫瑰花瓣摸起来软软的，颜色超正🌸 不用打理不会凋谢，懒人福音！',
  '送闺蜜生日礼物就选它！收到直接哇出来，粉粉嫩嫩太适合女生了，三五年都不会褪色，心意长长久久❤️',
  '谁说便宜没好货？这个价格能买到这么好的永生花，性价比真的可！放玄关每天进门心情都变好了✨',
  '今天又卖出一单这款玫瑰礼盒，顾客反馈说质量超好！果然好东西大家都认可，想入手的朋友放心冲👍'
  ],
  hydrangea: [
  '第一次看到蓝色绣球永生花，真的被惊艳到了！那个蓝色太正了，搭配满天星绝美💙 放在客厅同事都说好看！',
  '绣球花就是大气！满满一大朵摆在茶几上，整个客厅档次都上来了🏠 而且不用浇水不用打理，太适合手残党了',
  '朋友来家里做客，一眼看上我家这款绣球，当场就要了链接！好东西就是要分享给大家🌿',
  '这束蓝色绣球真的很治愈，工作累了一回家看到它心情就好很多。生活需要这样的仪式感💎',
  '推给很多宝妈了，反馈都超好！大朵绣球花放家里很显贵气，而且没有花粉对宝宝也安全👶'
  ],
  luxury: [
  '高端蝴蝶兰永生花，真的是一分钱一分货！白蝴蝶兰搭配金色花器，摆在电视柜上气场全开✨ 送领导送客户贼有面儿！',
  '被这款蝴蝶兰种草了！白色的花瓣像蝴蝶一样轻盈，永生工艺保留了花朵最美的样子🦋 自己收藏或者送礼都超合适',
  '上个月送了一盒给妈妈当母亲节礼物，她开心得不行，说比那些护肤品实在多了！妈妈开心我就开心💝',
  '这款真的适合放办公室！高端大气又不俗气，同事都来问链接。拼单更划算，姐妹们冲鸭🏃‍♀️',
  '玻璃罩礼盒包装太精致了吧！打开那一瞬间就是满满的高级感，送人特别有面子，价格也很合适🎁'
  ],
  standard: [
  '莫兰迪色系真的太高级了！这个颜色百搭各种装修风格，放哪都好看🎨 重点是价格真的很良心，学生党也能冲！',
  '向日葵摆件也太治愈了吧！明亮的黄色看的人心情都变好了☀️ 价格不到两百，每天回家看到它都觉得生活充满希望',
  '这款粉色绣球真的少女心爆棚！粉粉嫩嫩的一团，放在梳妆台上每天化妆心情都美美的💄',
  '便宜又好看的永生花摆件被我找到了！不到三百就能拥有永不凋谢的美，放在床头柜上刚刚好🌸',
  '给家里添点小确幸吧～这款桌花不占地方又好看，餐桌上摆一个吃饭都更有仪式感了🍽️'
  ]
}

/**
  * 获取所有模拟商品数据
  * @returns {Array} 商品列表
  */
function getProducts() {
  return MOCK_PRODUCTS
}

/**
  * 根据商品ID获取商品数据
  * @param {string} productId
  * @returns {Object|null}
  */
function getProductById(productId) {
  return MOCK_PRODUCTS.find(p =>p.id ===productId) || null
}

/**
  * 生成商品海报数据
  * @param {Object|string} product - 商品对象或商品ID
  * @param {string} userId - 用户ID
  * @returns {Object} { imageUrl, title, price, qrUrl }
  */
function generatePoster(product, userId) {
  if (typeof product ==='string') {
  product = getProductById(product)
  }
  if (!product) {
  return null
  }

  const inviteCode = userId
  ? `NP${Date.now().toString(36).slice(-4).toUpperCase()}${userId.toString(36).slice(-4).toUpperCase()}`
  : 'NP0000MAMA'

  return {
  imageUrl: product.image || '/assets/images/product-placeholder.png',
  title: product.name || '诺派永生花',
  price: `¥${(product.price || 0).toFixed(2)}`,
  desc: product.desc || '永不凋谢的美丽',
  qrUrl: `/assets/images/qr-placeholder.png`,
  inviteCode: inviteCode,
  shopName: '诺派永生花'
  }
}

/**
  * 生成社群暖心文案
  * @param {string} productId - 商品ID
  * @param {Object} [storeConfig] - 店铺配置（可选），用于个性化文案
  * @returns {Array} 文案列表 [{ id, text }]
  */
function generateCopy(productId, storeConfig) {
  const product = getProductById(productId)
  if (!product) return []

  // 根据商品类型选择文案组
  const productName = product.name
  let templates

  if (productName.includes('玫瑰')) {
  templates = COPY_TEMPLATES.rose
  } else if (productName.includes('绣球')) {
  templates = COPY_TEMPLATES.hydrangea
  } else if (product.price >=400) {
  templates = COPY_TEMPLATES.luxury
  } else {
  templates = COPY_TEMPLATES.standard
  }

  return templates.slice(0, 5).map((text, index) =>({
  id: `copy_${productId}_${index}`,
  text: text
  }))
}

/**
  * 生成个人店铺码数据
  * @param {string} userId - 用户ID
  * @returns {Object} { qrUrl, inviteCode, shopName, userInfo }
  */
function generateStoreQR(userId) {
  const inviteCode = userId
  ? `NP${Date.now().toString(36).slice(-4).toUpperCase()}${userId.toString(36).slice(-4).toUpperCase()}`
  : 'NP0000MAMA'

  return {
  qrUrl: '/assets/images/qr-placeholder.png',
  inviteCode: inviteCode,
  shopName: '诺派永生花',
  userInfo: {
      nickName: '兼职妈妈_' + (userId ? userId.slice(0, 4) : '0000'),
      level: '推广员',
      joinDate: new Date().toISOString().split('T')[0]
  }
  }
}

/**
  * 获取素材分类列表
  * @returns {Array} [{ id, name }]
  */
function getMaterialCategories() {
  return [
  { id: 'poster', name: '海报' },
  { id: 'copy', name: '文案' },
  { id: 'qrcode', name: '店铺码' }
  ]
}

/**
  * 获取分类列表（别名）
  * @returns {Array} [{ id, name }]
  */
function getCategories() {
  return getMaterialCategories()
}

module.exports = {
  MOCK_PRODUCTS,
  getProducts,
  getProductById,
  generatePoster,
  generateCopy,
  generateStoreQR,
  getMaterialCategories,
  getCategories
}
