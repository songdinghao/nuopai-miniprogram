// pages/product/detail.js - 商品详情页（针对30 - 60岁主妇优化）
const app = getApp()
const storeConfig = require('../../config/store-config.js')
const groupBuy = require('../../utils/group-buy.js')
const api = require('../../utils/api.js')
const productsData = require('../../data/products.js')

Page({
  data: {
  // 页面状态
  loading: true,
  loadingError: false,

  // 商品信息
  productId: '',
  productInfo: null,

  // 规格选择
  selectedSku: null,
  skuList: [],
  selectedAttrs: {},
  attrOptions: {},

  // 数量
  quantity: 1,
  minQuantity: 1,
  maxQuantity: 99,

  // 图片相关
  currentImageIndex: 0,
  imageList: [],
  previewImages: [],

  // AR功能
  arSupported: false,
  showARButton: true,

  // 收藏状态
  isCollected: false,

  // 购物车相关
  cartCount: 0,

  // 用户偏好
  fontSize: 'normal',

  // 商品详情选项卡
  currentTab: 'detail', // detail, params, reviews, qa
  tabList: [
      { id: 'detail', name: '商品详情', icon: '📋' },
      { id: 'params', name: '规格参数', icon: '📏' },
      { id: 'reviews', name: '用户评价', icon: '⭐' },
      { id: 'qa', name: '常见问题', icon: '❓' }
  ],

  // 相关商品
  relatedProducts: [],

  // 促销信息
  promotions: [],

  // 分享信息
  shareInfo: null,

  // 拼团功能
  groupBuyEnabled: true,
  groupBuyInfo: null,
  groupBuyTypes: [],
  groupBuyActiveGroups: [],
  groupBuySocialProof: null,
  activeGroupBuyId: null,

  // 预计算文本
  selectedSkuAttrsText: '',
  discountPercent: 0,

  // 社会证明
  salesCount: 0,
  salesCountText: '',
  viewCount: 0,
  hotPercent: 0,
  stockWarningLevel: 0, // 0=正常, 1=低库存(<=10), 2=即将售罄(<=3), 3=售罄(0)
  stockWarningText: '',
  isSoldOut: false,

  // 用户信息
  userInfo: null,

  // 限时促销倒计时
  promoEndTime: 0,
  promoCountdown: '',
  isPromoActive: false,
  promoLabel: ''
  },

  // 页面加载
  onLoad(options) {

  app.globalData.currentPage = 'product_detail'

  const productId = options.id || '100001'
  this.setData({ productId })

  // 追踪页面访问
  app.trackEvent('product_view', { 
      product_id: productId,
      source: options.source || 'direct'
  })

  // 检查AR支持
  this.checkARSupport()

  // 加载用户偏好
  this.loadUserPreferences()

  // 加载商品数据
  this.loadProductData(productId)

  // 加载购物车数量
  this.updateCartCount()

  // 检查收藏状态
  this.checkCollectionStatus()

  // 初始化浏览人数
  this.initViewCount(productId)

  // 记录浏览历史
  this.recordBrowseHistory(productId)
  },

  // 页面显示
  onShow() {

  // 同步用户信息（修复分享邀请人追踪）
  if (app.globalData.userInfo) {
    this.setData({ userInfo: app.globalData.userInfo })
  }

  // 更新购物车数量
  this.updateCartCount()

  // 检查收藏状态变化
  this.checkCollectionStatus()
  },

  // 页面初次渲染完成
  onReady() {
  },

  // 页面隐藏
  onHide() {
  },

  // 页面卸载
  onUnload() {
  // 清除促销倒计时定时器
  if (this._promoTimer) {
    clearInterval(this._promoTimer)
    this._promoTimer = null
  }
  },

  // 分享
  onShareAppMessage() {

  const shareInfo = this.data.shareInfo || {
      title: this.data.productInfo?.name || '诺派永生花',
      path: `/pages/product/detail?id=${this.data.productId}`,
      imageUrl: this.data.productInfo?.mainImage || '/assets/share/product-share.jpg'
  }

  if (this.data.userInfo?.id) {
      shareInfo.path +=`&inviter=${this.data.userInfo.id}`
  }

  // 追踪分享事件
  app.trackEvent('product_share', { 
      product_id: this.data.productId,
      product_name: this.data.productInfo?.name
  })

  return shareInfo
  },

  // 分享到朋友圈
  onShareTimeline() {

  // 追踪朋友圈分享
  app.trackEvent('product_share_timeline', { 
      product_id: this.data.productId
  })

  return {
      title: this.data.productInfo?.name || '精美永生花，点亮家居生活',
      query: `id=${this.data.productId}`,
      imageUrl: this.data.productInfo?.mainImage || '/assets/share/timeline-product.jpg'
  }
  },

  // 检查AR支持
  checkARSupport() {
  const arSupported = app.globalData.arSupported || false
  this.setData({ arSupported })
  },

  // 加载用户偏好
  loadUserPreferences() {
  const preferences = app.globalData.userPreferences || {}
  const fontSize = preferences.fontSize || 'normal'

  this.setData({ fontSize })
  },

  // 加载商品数据
  loadProductData(productId) {
    this.setData({ loading: true, loadingError: false })

    // 优先从API获取真实产品数据（带8秒超时控制）
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('request timeout')), 8000)
    })

    Promise.race([
      api.product.getProductDetail(productId),
      timeoutPromise
    ]).then(result => {
      if (result.error || !result || !result.title) {
        // API失败，fallback到mock数据
        this._loadMockProductData(productId)
        return
      }
      try {
        // 将微信小店数据映射为页面所需格式
        const productInfo = this._mapStoreProduct(result)
        
        const { skuList, attrOptions } = this.generateSkuData(productInfo)
        const defaultSku = skuList.length > 0 ? skuList[0] : null
        const selectedAttrs = {}
        if (defaultSku) {
          Object.keys(attrOptions).forEach(attrKey => {
            if (attrOptions[attrKey].length > 0) {
              selectedAttrs[attrKey] = attrOptions[attrKey][0].value
            }
          })
        }

        const imageList = this.generateImageList(productInfo)
        const previewImages = imageList.map(img => img.url)
        const relatedProducts = this.generateRelatedProducts(productInfo)
        const promotions = this.generatePromotions(productInfo)
        const shareInfo = {
          title: `${productInfo.name} - 诺派永生花商城`,
          path: `/pages/product/detail?id=${productId}`,
          imageUrl: productInfo.mainImage
        }

        // 拼团数据
        const groupBuyEnabled = storeConfig.groupBuy && storeConfig.groupBuy.enabled
        const groupBuyTypes = storeConfig.groupBuy ? [...storeConfig.groupBuy.types] : []
        const groupBuyInfo = groupBuyTypes.map(t => ({
          ...t,
          groupPrice: groupBuy.calcGroupPrice(defaultSku ? defaultSku.price : productInfo.price, t.id),
          leaderPrice: groupBuy.calcLeaderPrice(defaultSku ? defaultSku.price : productInfo.price, t.id)
        }))
        const groupBuyActiveGroups = groupBuy.getActiveGroupsByProduct(productId)
        const groupBuySocialProof = groupBuy.getGroupSocialProof(productId)

        productInfo.flowerTypeName = (storeConfig.flowerTypes.find(item => item.id === productInfo.flowerType)?.name) || productInfo.flowerType
        productInfo.colorName = (storeConfig.colors.find(item => item.id === productInfo.color)?.name) || productInfo.color
        productInfo.styleName = (storeConfig.styles.find(item => item.id === productInfo.style)?.name) || productInfo.style

        const selectedSkuAttrsText = this.computeAttrsText(selectedAttrs, attrOptions)
        const discountPercent = defaultSku && defaultSku.originalPrice > defaultSku.price
          ? Math.round((1 - defaultSku.price / defaultSku.originalPrice) * 100) : 0

        this.setData({
          loading: false,
          productInfo, skuList, attrOptions,
          selectedSku: defaultSku, selectedAttrs,
          imageList, previewImages,
          relatedProducts, promotions, shareInfo,
          quantity: 1,
          groupBuyEnabled, groupBuyTypes, groupBuyInfo,
          groupBuyActiveGroups, groupBuySocialProof,
          selectedSkuAttrsText, discountPercent
        })

        // 初始化社会证明
        this.initSalesCount(productInfo)
        this.updateStockWarning(defaultSku)

        // 初始化限时促销倒计时
        this.initPromotion()
        this.startCountdown()

        // 记录浏览历史（产品数据加载完成后）
        this.recordBrowseHistory(productId)

        app.trackEvent('product_detail_loaded', {
          product_id: productId,
          product_name: productInfo.name,
          price: productInfo.price
        })
      } catch (error) {
        console.error('加载产品数据失败:', error)
        this._loadMockProductData(productId)
      }
    }).catch(() => {
      this._loadMockProductData(productId)
    })
  },

  // 将微信小店API数据映射为页面所需格式
  _mapStoreProduct(product) {
    const images = product.head_imgs || product.images || []
    const skus = product.skus || []
    const firstSku = skus[0] || {}
    
    return {
      id: product.product_id,
      name: product.title || product.name || '',
      subtitle: product.sub_title || '',
      mainImage: images[0] || '',
      images: images,
      price: firstSku.sale_price ? firstSku.sale_price / 100 : (product.price || 0),
      originalPrice: firstSku.market_price ? firstSku.market_price / 100 : (product.originalPrice || 0),
      stock: firstSku.stock_num || product.stock || 0,
      sales: 0,
      flowerType: 'rose',
      color: 'pink',
      style: 'modern',
      scene: 'keting',
      description: (product.desc_info && product.desc_info.desc) || '',
      skus: skus,
      attrs: product.attrs || [],
      cats: product.cats || []
    }
  },

  // Fallback: 使用本地产品数据
  _loadMockProductData(productId) {
      try {
    // 从本地产品数据获取
    const localProduct = productsData.getProductById(productId)
    if (localProduct) {
      const productInfo = { ...localProduct }
      // 预计算花材/颜色/风格名称
      productInfo.flowerTypeName = (storeConfig.flowerTypes.find(item => item.id === productInfo.flowerType)?.name) || productInfo.flowerType
      productInfo.colorName = (storeConfig.colors.find(item => item.id === productInfo.color)?.name) || productInfo.color
      productInfo.styleName = (storeConfig.styles.find(item => item.id === productInfo.style)?.name) || productInfo.style
      
      // 确保有images数组
      if (!productInfo.images) {
        productInfo.images = productInfo.mainImage ? [productInfo.mainImage] : []
      }
      
      // 生成规格数据
      const { skuList, attrOptions } = this.generateSkuData(productInfo)
      const defaultSku = skuList.length > 0 ? skuList[0] : null
      const selectedAttrs = {}
      if (defaultSku) {
        Object.keys(attrOptions).forEach(attrKey => {
          if (attrOptions[attrKey].length > 0) {
            selectedAttrs[attrKey] = attrOptions[attrKey][0].value
          }
        })
      }
      
      // 生成图片列表
      const imageList = this.generateImageList(productInfo)
      const previewImages = imageList.map(img => img.url)
      const relatedProducts = this.generateRelatedProducts(productInfo)
      const promotions = this.generatePromotions(productInfo)
      const shareInfo = {
        title: `${productInfo.name} - 诺派永生花商城`,
        path: `/pages/product/detail?id=${productId}`,
        imageUrl: productInfo.mainImage
      }
      
      // 拼团数据
      const groupBuyEnabled = storeConfig.groupBuy && storeConfig.groupBuy.enabled
      const groupBuyTypes = storeConfig.groupBuy ? [...storeConfig.groupBuy.types] : []
      const groupBuyInfo = groupBuyTypes.map(t => ({
        ...t,
        groupPrice: groupBuy.calcGroupPrice(defaultSku ? defaultSku.price : productInfo.price, t.id),
        leaderPrice: groupBuy.calcLeaderPrice(defaultSku ? defaultSku.price : productInfo.price, t.id)
      }))
      const groupBuyActiveGroups = groupBuy.getActiveGroupsByProduct(productId)
      const groupBuySocialProof = groupBuy.getGroupSocialProof(productId)
      
      const selectedSkuAttrsText = this.computeAttrsText(selectedAttrs, attrOptions)
      const discountPercent = defaultSku && defaultSku.originalPrice > defaultSku.price
        ? Math.round((1 - defaultSku.price / defaultSku.originalPrice) * 100) : 0
      
      this.setData({
        loading: false,
        productInfo, skuList, attrOptions,
        selectedSku: defaultSku, selectedAttrs,
        imageList, previewImages,
        relatedProducts, promotions, shareInfo,
        quantity: 1,
        groupBuyEnabled, groupBuyTypes, groupBuyInfo,
        groupBuyActiveGroups, groupBuySocialProof,
        selectedSkuAttrsText, discountPercent
      })

      // 初始化社会证明
      this.initSalesCount(productInfo)
      this.updateStockWarning(defaultSku)

      // 初始化限时促销倒计时
      this.initPromotion()
      this.startCountdown()

      // 记录浏览历史（产品数据加载完成后）
      this.recordBrowseHistory(productId)

      app.trackEvent('product_detail_loaded', {
        product_id: productId,
        product_name: productInfo.name,
        price: productInfo.price
      })
      return
    }

    // 本地数据中没找到，fallback到mock
    this._loadOriginalMockData(productId)
      } catch (error) {
    console.error('加载本地商品数据失败: ', error)
    this._loadOriginalMockData(productId)
      }
  },

  // 原始Mock数据fallback
  _loadOriginalMockData(productId) {
    try {
    // 生成模拟商品数据
    const productInfo = this.generateMockProductData(productId)

    // 生成规格数据
    const { skuList, attrOptions } = this.generateSkuData(productInfo)

    const defaultSku = skuList.length > 0 ? skuList[0] : null
    const selectedAttrs = {}

    if (defaultSku) {
          Object.keys(attrOptions).forEach(attrKey =>{
      if (attrOptions[attrKey].length > 0) {
              selectedAttrs[attrKey] = attrOptions[attrKey][0].value
      }
          })
    }

    // 生成图片列表
    const imageList = this.generateImageList(productInfo)
    const previewImages = imageList.map(img =>img.url)

    // 生成相关商品
    const relatedProducts = this.generateRelatedProducts(productInfo)

    // 生成促销信息
    const promotions = this.generatePromotions(productInfo)

    // 生成分享信息
    const shareInfo = {
          title: `${productInfo.name} - 诺派永生花商城`,
          path: `/pages/product/detail?id=${productId}`,
          imageUrl: productInfo.mainImage
    }

    // 生成拼团数据
    const groupBuyEnabled = storeConfig.groupBuy && storeConfig.groupBuy.enabled
    const groupBuyTypes = storeConfig.groupBuy ? [...storeConfig.groupBuy.types] : []
    // 为当前商品计算拼团价格
    const groupBuyInfo = groupBuyTypes.map(t =>({
          ...t,
          groupPrice: groupBuy.calcGroupPrice(defaultSku ? defaultSku.price : productInfo.price, t.id),
          leaderPrice: groupBuy.calcLeaderPrice(defaultSku ? defaultSku.price : productInfo.price, t.id)
    }))
    const groupBuyActiveGroups = groupBuy.getActiveGroupsByProduct(productId)
    const groupBuySocialProof = groupBuy.getGroupSocialProof(productId)

    // 预计算商品参数名称（WXML不支持箭头函数）
    productInfo.flowerTypeName = (storeConfig.flowerTypes.find(item =>item.id ===productInfo.flowerType)?.name) || productInfo.flowerType
    productInfo.colorName = (storeConfig.colors.find(item =>item.id ===productInfo.color)?.name) || productInfo.color
    productInfo.styleName = (storeConfig.styles.find(item =>item.id ===productInfo.style)?.name) || productInfo.style

    // 预计算选中属性文本
    const selectedSkuAttrsText = this.computeAttrsText(selectedAttrs, attrOptions)

    // 预计算折扣百分比（WXML不支持Math.round）
    const discountPercent = defaultSku && defaultSku.originalPrice > defaultSku.price
          ? Math.round((1 - defaultSku.price / defaultSku.originalPrice) * 100) : 0

    this.setData({
          loading: false,
          productInfo,
          skuList,
          attrOptions,
          selectedSku: defaultSku,
          selectedAttrs,
          imageList,
          previewImages,
          relatedProducts,
          promotions,
          shareInfo,
          quantity: 1,
          groupBuyEnabled,
          groupBuyTypes,
          groupBuyInfo,
          groupBuyActiveGroups,
          groupBuySocialProof,
          selectedSkuAttrsText,
          discountPercent
    })

    // 初始化社会证明
    this.initSalesCount(productInfo)
    this.updateStockWarning(defaultSku)

    // 初始化限时促销倒计时
    this.initPromotion()
    this.startCountdown()

    // 追踪商品加载完成
    app.trackEvent('product_detail_loaded', {
          product_id: productId,
          product_name: productInfo.name,
          price: productInfo.price
    })

    } catch (error) {
    console.error('加载商品数据失败: ', error)
    this.setData({
        loading: false,
        loadingError: true
    })

    // 显示错误提示
    this.showErrorTip('加载商品信息失败，请稍后重试')

    // 记录错误
    app.reportError && app.reportError(error)
    }
  },

  // 生成模拟商品数据
  generateMockProductData(productId) {
  // 从配置中获取分类和花材信息
  const categories = storeConfig.categories
  const flowerTypes = storeConfig.flowerTypes
  const colors = storeConfig.colors
  const styles = storeConfig.styles

  // 根据产品ID生成不同的商品
  const productMap = {
      '100001': {
    id: '100001',
    name: '玄关端景台永生花玫瑰摆件',
    description: '入户玄关装饰首选，高品质永生玫瑰，搭配精致花器，3 - 5年保鲜，免养护，提升家居格调',
    mainImage: '/assets/products/product1.jpg',
    price: 268,
    originalPrice: 328,
    sales: 1560,
    stock: 89,
    category: 'xuanguan',
    flowerType: 'rose',
    color: 'pink',
    style: 'modern',
    scene: '玄关端景台',
    size: '高30cm × 宽25cm × 深15cm',
    weight: '2.5kg',
    material: '永生玫瑰、尤加利叶、陶瓷花器',
    features: ['3 - 5年保鲜', '免浇水打理', '高级感设计', '礼盒包装'],
    tags: ['热销', '新品', '包邮', '推荐'],
    rating: 4.8,
    reviewCount: 245,
    deliveryInfo: '全国包邮（偏远地区除外），48小时内发货',
    afterSale: '7天无理由退货，1年质保'
      },
      '100002': {
    id: '100002',
    name: '客厅茶几绣球花装饰',
    description: '客厅茶几装饰精品，蓝色绣球花搭配白色陶瓷，清新自然风格，适合现代家居',
    mainImage: '/assets/products/product2.jpg',
    price: 298,
    originalPrice: 368,
    sales: 1240,
    stock: 76,
    category: 'keting',
    flowerType: 'hydrangea',
    color: 'blue',
    style: 'modern',
    scene: '客厅茶几',
    size: '高25cm × 宽35cm × 深20cm',
    weight: '3.2kg',
    material: '永生绣球花、满天星、玻璃花器',
    features: ['360度观赏', '免养护', '现代简约', '环保材料'],
    tags: ['热销', '推荐', '包邮'],
    rating: 4.7,
    reviewCount: 189,
    deliveryInfo: '全国包邮，72小时内发货',
    afterSale: '15天无理由退货，1年质保'
      },
      '100003': {
    id: '100003',
    name: '餐厅餐桌牡丹花艺',
    description: '餐厅餐桌装饰，粉色牡丹搭配金色花器，奢华大气，营造温馨用餐氛围',
    mainImage: '/assets/products/product3.jpg',
    price: 328,
    originalPrice: 398,
    sales: 980,
    stock: 54,
    category: 'canting',
    flowerType: 'peony',
    color: 'pink',
    style: 'luxury',
    scene: '餐厅餐桌',
    size: '高40cm × 宽30cm × 深25cm',
    weight: '4.5kg',
    material: '永生牡丹、尤加利叶、金属花器',
    features: ['奢华设计', '大尺寸', '礼盒包装', '节日送礼'],
    tags: ['新品', '包邮', '奢华'],
    rating: 4.9,
    reviewCount: 132,
    deliveryInfo: '全国包邮，48小时内发货',
    afterSale: '7天无理由退货，2年质保'
      },
      '100004': {
    id: '100004',
    name: '卧室床头柜百合装饰',
    description: '卧室床头柜装饰，白色百合花搭配原木花器，清新淡雅，助眠安神',
    mainImage: '/assets/products/product4.jpg',
    price: 248,
    originalPrice: 298,
    sales: 760,
    stock: 92,
    category: 'woshi',
    flowerType: 'lily',
    color: 'white',
    style: 'rural',
    scene: '卧室床头柜',
    size: '高20cm × 宽15cm × 深10cm',
    weight: '1.8kg',
    material: '永生百合花、小雏菊、木质花器',
    features: ['清新淡雅', '助眠安神', '小巧精致', '环保材料'],
    tags: ['热销', '包邮'],
    rating: 4.6,
    reviewCount: 98,
    deliveryInfo: '全国包邮，48小时内发货',
    afterSale: '7天无理由退货，1年质保'
      },
      '100005': {
    id: '100005',
    name: '春季限定樱花系列',
    description: '春季限定樱花主题，粉色樱花搭配透明玻璃花器，浪漫春日氛围',
    mainImage: '/assets/products/product5.jpg',
    price: 288,
    originalPrice: 348,
    sales: 320,
    stock: 45,
    category: 'jiari',
    flowerType: 'cherry',
    color: 'pink',
    style: 'rural',
    scene: '玄关/客厅',
    size: '高28cm × 宽22cm × 深18cm',
    weight: '2.8kg',
    material: '永生樱花、满天星、玻璃花器',
    features: ['季节限定', '浪漫设计', '透明花器', '收藏价值'],
    tags: ['新品', '限定', '包邮'],
    rating: 4.8,
    reviewCount: 76,
    deliveryInfo: '全国包邮，72小时内发货',
    afterSale: '7天无理由退货，1年质保'
      },
      '100006': {
    id: '100006',
    name: '母亲节康乃馨花篮',
    description: '母亲节专属礼物，粉色康乃馨搭配精美花篮，表达对母亲的感恩之情',
    mainImage: '/assets/products/product6.jpg',
    price: 198,
    originalPrice: 258,
    sales: 450,
    stock: 68,
    category: 'songli',
    flowerType: 'carnation',
    color: 'pink',
    style: 'modern',
    scene: '节日送礼',
    size: '高35cm × 宽30cm × 深25cm',
    weight: '3.5kg',
    material: '永生康乃馨、满天星、藤编花篮',
    features: ['节日专属', '精美包装', '贺卡赠送', '送礼首选'],
    tags: ['新品', '节日', '送礼'],
    rating: 4.9,
    reviewCount: 124,
    deliveryInfo: '全国包邮，48小时内发货',
    afterSale: '7天无理由退货，1年质保'
      }
  }

  // 如果找不到对应的商品，使用默认商品
  const product = productMap[productId] || {
      id: productId,
      name: '永生花装饰摆件',
      description: '高品质永生花装饰，精美设计，适合各种家居场景',
      mainImage: '/assets/products/product-default.jpg',
      price: 199,
      originalPrice: 259,
      sales: 100,
      stock: 50,
      category: 'xuanguan',
      flowerType: 'rose',
      color: 'pink',
      style: 'modern',
      scene: '通用场景',
      size: '高25cm × 宽20cm × 深15cm',
      weight: '2.0kg',
      material: '永生花材、搭配花材、陶瓷花器',
      features: ['3 - 5年保鲜', '免养护', '精美设计'],
      tags: ['热销'],
      rating: 4.5,
      reviewCount: 50,
      deliveryInfo: '全国包邮，48小时内发货',
      afterSale: '7天无理由退货，1年质保'
  }

  return product
  },

  // 生成规格数据
  generateSkuData(productInfo) {
  // 生成属性选项
  const attrOptions = {
      // 花器类型
      vaseType: [
    { value: 'ceramic', name: '陶瓷花器', priceDelta: 0 },
    { value: 'glass', name: '玻璃花器', priceDelta: 20 },
    { value: 'wood', name: '木质花器', priceDelta: 30 },
    { value: 'metal', name: '金属花器', priceDelta: 50 }
      ],

      // 花材搭配
      flowerMatch: [
    { value: 'simple', name: '简约搭配', priceDelta: 0 },
    { value: 'rich', name: '丰富搭配', priceDelta: 40 },
    { value: 'luxury', name: '奢华搭配', priceDelta: 80 }
      ],

      // 包装类型
      packaging: [
    { value: 'standard', name: '标准包装', priceDelta: 0 },
    { value: 'gift', name: '礼品包装', priceDelta: 25 },
    { value: 'premium', name: '豪华包装', priceDelta: 60 }
      ]
  }

  // 生成SKU列表
  const skuList = []
  const basePrice = productInfo.price

  // 生成所有SKU组合
  attrOptions.vaseType.forEach(vase =>{
      attrOptions.flowerMatch.forEach(flower =>{
    attrOptions.packaging.forEach(pack =>{
          const totalPrice = basePrice + vase.priceDelta + flower.priceDelta + pack.priceDelta
          const stock = Math.floor(Math.random() * 50) + 10 // 10 - 59的库存

          skuList.push({
      id: `${productInfo.id}_${vase.value}_${flower.value}_${pack.value}`,
      attrs: {
              vaseType: vase.value,
              flowerMatch: flower.value,
              packaging: pack.value
      },
      price: totalPrice,
      originalPrice: totalPrice + 60, // 原价加60
      stock: stock,
      skuCode: `SKU${productInfo.id.slice(-3)}${vase.value.slice(0, 1)}${flower.value.slice(0, 1)}${pack.value.slice(0, 1)}`
          })
    })
      })
  })

  return { skuList, attrOptions }
  },

  // 生成图片列表
  // TODO: 上线前调用 imageUtils.getWebPUrl() 优化图片加载
  generateImageList(productInfo) {
  const mainImage = productInfo.mainImage || '/assets/products/product-default.jpg'
  const imageList = [
      { 
    id: 1, 
    url: mainImage, 
    type: 'main',
    description: '主图'
      }
  ]

  // 添加商品图片（过滤掉不存在的图片）
  const additionalImages = [
      productInfo.images && productInfo.images[1],
      '/assets/products/detail-desc1.jpg',
      '/assets/products/detail-desc2.jpg'
  ].filter(Boolean)

  additionalImages.forEach((url, index) => {
      if (url && (url.startsWith('/assets/') || url.startsWith('http'))) {
    imageList.push({
          id: imageList.length + 1,
          url: url,
          type: index === 0 ? 'detail' : (index === 1 ? 'scene' : 'package'),
          description: index === 0 ? '细节展示' : (index === 1 ? '场景展示' : '包装展示')
    })
      }
  })

  return imageList
  },

  // 生成相关商品
  generateRelatedProducts(productInfo) {
  // 使用存在的商品图片
  const relatedProducts = [
      {
    id: 'related1',
    name: '同场景推荐',
    image: '/assets/products/product1.jpg',
    price: 228,
    originalPrice: 288,
    sales: 420
      },
      {
    id: 'related2',
    name: '同花材系列',
    image: '/assets/products/product2.jpg',
    price: 198,
    originalPrice: 258,
    sales: 320
      },
      {
    id: 'related3',
    name: '搭配推荐',
    image: '/assets/products/product3.jpg',
    price: 168,
    originalPrice: 198,
    sales: 210
      },
      {
    id: 'related4',
    name: '热销组合',
    image: '/assets/products/product4.jpg',
    price: 458,
    originalPrice: 528,
    sales: 156
      }
  ]

  return relatedProducts
  },

  // 生成促销信息
  generatePromotions(productInfo) {
  const promotions = [
      {
    id: 'promo1',
    type: 'discount',
    title: '限时折扣',
    content: '今日下单享95折优惠',
    icon: '🎯',
    color: '#C9A96E'
      },
      {
    id: 'promo2',
    type: 'coupon',
    title: '优惠券',
    content: '可用20元新人券',
    icon: '💰',
    color: '#4CAF50'
      },
      {
    id: 'promo3',
    type: 'gift',
    title: '赠品',
    content: '赠送精美贺卡',
    icon: '🎁',
    color: '#2196F3'
      },
      {
    id: 'promo4',
    type: 'shipping',
    title: '运费优惠',
    content: '满99元包邮',
    icon: '🚚',
    color: '#FF9800'
      }
  ]

  return promotions
  },

  // 更新购物车数量
  updateCartCount() {
  const cartCount = app.globalData.cartCount || 0
  this.setData({ cartCount })
  },

  // 检查收藏状态
  checkCollectionStatus() {
  const collections = wx.getStorageSync('userCollections') || []
  const isCollected = collections.some(item =>item.id ===this.data.productId)
  this.setData({ isCollected })
  },

  //===== ==== = 用户交互事件 = ==== ==== =

  // swiper轮播变化事件（bindchange）
  onSwiperChange(e) {
  const index = e.detail.current
  this.setData({ currentImageIndex: index })

  app.trackEvent('product_image_view', {
      product_id: this.data.productId,
      image_index: index
  })
  },

  // 点击图片项切换（bindtap）
  onImageTap(e) {
  const index = e.currentTarget.dataset.index || 0
  this.setData({ currentImageIndex: index })

  // 追踪图片查看事件
  app.trackEvent('product_image_view', {
      product_id: this.data.productId,
      image_index: index
  })
  },

  // 图片预览
  onImagePreview() {
  wx.previewImage({
      current: this.data.previewImages[this.data.currentImageIndex],
      urls: this.data.previewImages
  })

  // 追踪图片预览事件
  app.trackEvent('product_image_preview', {
      product_id: this.data.productId
  })
  },

  // 选择属性
  onAttrSelect(e) {
  const attrKey = e.currentTarget.dataset.key
  const attrValue = e.currentTarget.dataset.value

  // 更新选中的属性
  const selectedAttrs = { ...this.data.selectedAttrs }
  selectedAttrs[attrKey] = attrValue

  // 查找匹配的SKU
  const matchedSku = this.findMatchingSku(selectedAttrs)

  // 预计算选中属性文本
  const selectedSkuAttrsText = this.computeAttrsText(selectedAttrs, this.data.attrOptions)

  // 预计算折扣百分比
  const discountPercent = matchedSku && matchedSku.originalPrice > matchedSku.price
      ? Math.round((1 - matchedSku.price / matchedSku.originalPrice) * 100) : 0

  this.setData({
      selectedAttrs,
      selectedSku: matchedSku,
      selectedSkuAttrsText,
      discountPercent,
      quantity: 1 // 重置数量
  })

  // 更新库存紧迫感
  this.updateStockWarning(matchedSku)

  // 如果SKU有变化，更新价格显示
  if (matchedSku) {
      // 这里可以触发价格更新动画等
  }

  // 追踪属性选择事件
  app.trackEvent('product_attr_select', {
      product_id: this.data.productId,
      attr_key: attrKey,
      attr_value: attrValue
  })
  },

  // 查找匹配的SKU
  findMatchingSku(selectedAttrs) {
  const { skuList } = this.data

  // 找到完全匹配的SKU
  for (const sku of skuList) {
      let isMatch = true

      // 检查所有选中的属性是否匹配
      for (const [key, value] of Object.entries(selectedAttrs)) {
    if (sku.attrs[key] !== value) {
          isMatch = false
          break
    }
      }

      if (isMatch) {
    return sku
      }
  }

  // 如果没有完全匹配的SKU，使用商品基础价格构造一个默认SKU
  const productInfo = this.data.productInfo
  const basePrice = productInfo ? productInfo.price : 0
  return {
      id: 'fallback_' + Date.now(),
      attrs: {},
      price: basePrice,
      originalPrice: basePrice + 60,
      stock: 0,
      skuCode: 'N/A'
  }
  },

  // 预计算选中属性文本（WXML不支持箭头函数）
  computeAttrsText(selectedAttrs, attrOptions) {
  const names = []
  for (const [key, value] of Object.entries(selectedAttrs)) {
      const options = attrOptions[key]
      if (options && Array.isArray(options)) {
    const option = options.find(item =>item.value ===value)
    if (option && option.name) {
          names.push(option.name)
    }
      }
  }
  return names.join(' ')
  },

  // 增加数量
  onIncreaseQuantity() {
  if (this.data.quantity < this.data.maxQuantity) {
      const newQuantity = this.data.quantity + 1

      // 检查库存
      if (this.data.selectedSku && newQuantity > this.data.selectedSku.stock) {
    this.showStockWarning(this.data.selectedSku.stock)
    return
      }

      this.setData({ quantity: newQuantity })

      // 追踪数量增加事件
      app.trackEvent('product_quantity_increase', {
    product_id: this.data.productId,
    quantity: newQuantity
      })
  }
  },

  // 减少数量
  onDecreaseQuantity() {
  if (this.data.quantity > this.data.minQuantity) {
      const newQuantity = this.data.quantity - 1
      this.setData({ quantity: newQuantity })

      // 追踪数量减少事件
      app.trackEvent('product_quantity_decrease', {
    product_id: this.data.productId,
    quantity: newQuantity
      })
  }
  },

  // 输入数量
  onQuantityInput(e) {
  const inputValue = e.detail.value
  let newQuantity = parseInt(inputValue) || this.data.minQuantity

  // 限制范围
  if (newQuantity < this.data.minQuantity) {
      newQuantity = this.data.minQuantity
  } else if (newQuantity > this.data.maxQuantity) {
      newQuantity = this.data.maxQuantity
  }

  // 检查库存
  if (this.data.selectedSku && newQuantity > this.data.selectedSku.stock) {
      newQuantity = this.data.selectedSku.stock
      this.showStockWarning(this.data.selectedSku.stock)
  }

  this.setData({ quantity: newQuantity })
  },

  // 切换详情选项卡
  onTabTap(e) {
  const tabId = e.currentTarget.dataset.id
  this.setData({ currentTab: tabId })

  // 追踪选项卡切换事件
  app.trackEvent('product_tab_switch', {
      product_id: this.data.productId,
      tab_id: tabId
  })
  },

  // 收藏/取消收藏
  onCollectTap() {
  const isCollected = !this.data.isCollected

  let collections = wx.getStorageSync('userCollections') || []

  if (isCollected) {
      // 添加到收藏
      collections.push({
    id: this.data.productId,
    name: this.data.productInfo.name,
    image: this.data.productInfo.mainImage,
    price: this.data.selectedSku?.price || this.data.productInfo.price,
    collectTime: Date.now()
      })

      // 显示收藏成功提示
      wx.showToast({
    title: '已收藏',
    icon: 'success',
    duration: 1500
      })
  } else {
      // 从收藏中移除
      collections = collections.filter(item =>item.id !== this.data.productId)

      // 显示取消收藏提示
      wx.showToast({
    title: '已取消收藏',
    icon: 'success',
    duration: 1500
      })
  }

  // 保存收藏列表
  wx.setStorageSync('userCollections', collections)

  this.setData({ isCollected })

  // 追踪收藏事件
  app.trackEvent('product_collect', {
      product_id: this.data.productId,
      action: isCollected ? 'add' : 'remove'
  })
  },

  // 加入购物车
  onAddToCart() {
  // 检查是否选择了规格
  if (!this.data.selectedSku) {
      wx.showToast({
    title: '请选择商品规格',
    icon: 'none',
    duration: 2000
      })
      return
  }

  // 检查库存
  if (this.data.selectedSku.stock <=0) {
      wx.showToast({
    title: '商品已售罄',
    icon: 'none',
    duration: 2000
      })
      return
  }

  if (this.data.quantity > this.data.selectedSku.stock) {
      this.showStockWarning(this.data.selectedSku.stock)
      return
  }

  let cartItems = wx.getStorageSync('cartItems') || []

  // 检查是否已存在相同SKU的商品
  const existingItemIndex = cartItems.findIndex(item =>item.productId ===this.data.productId && 
      JSON.stringify(item.attrs) ===JSON.stringify(this.data.selectedAttrs)
  )

  if (existingItemIndex >=0) {
      // 更新数量
      cartItems[existingItemIndex].quantity +=this.data.quantity
  } else {
      // 添加新商品
      cartItems.push({
    id: 'cart_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    productId: this.data.productId,
    name: this.data.productInfo.name,
    image: this.data.productInfo.mainImage,
    attrs: this.data.selectedAttrs,
    skuInfo: this.data.selectedSku,
    specsText: this.data.selectedSkuAttrsText || '',
    price: this.data.selectedSku.price,
    originalPrice: this.data.selectedSku.originalPrice,
    quantity: this.data.quantity,
    stock: this.data.selectedSku.stock,
    selected: true, // 默认选中
    addTime: Date.now()
      })
  }

  // 保存购物车
  wx.setStorageSync('cartItems', cartItems)

  // 更新全局购物车数量
  const totalCount = cartItems.reduce((total, item) =>total + item.quantity, 0)
  app.globalData.cartCount = totalCount

  // 更新页面显示
  this.updateCartCount()

  // 显示成功提示
  wx.showToast({
      title: '已加入购物车',
      icon: 'success',
      duration: 1500
  })

  // 追踪加入购物车事件
  app.trackEvent('add_to_cart', {
      product_id: this.data.productId,
      sku_id: this.data.selectedSku.id,
      quantity: this.data.quantity,
      price: this.data.selectedSku.price
  })
  },

  // 立即购买
  onBuyNow() {
  // 检查是否选择了规格
  if (!this.data.selectedSku) {
      wx.showToast({
    title: '请选择商品规格',
    icon: 'none',
    duration: 2000
      })
      return
  }

  // 检查库存
  if (this.data.selectedSku.stock <=0) {
      wx.showToast({
    title: '商品已售罄',
    icon: 'none',
    duration: 2000
      })
      return
  }

  if (this.data.quantity > this.data.selectedSku.stock) {
      this.showStockWarning(this.data.selectedSku.stock)
      return
  }

  // 检查登录状态
  if (!app.globalData.isLogin) {
      wx.showToast({
    title: '请先登录再购买',
    icon: 'none',
    duration: 1500
      })
      setTimeout(() =>{
    wx.navigateTo({
          url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/product/detail?id=' + this.data.productId)
    })
      }, 1500)
      return
  }

  // 创建临时订单
  const tempOrder = {
      items: [{
    productId: this.data.productId,
    name: this.data.productInfo.name,
    image: this.data.productInfo.mainImage,
    attrs: this.data.selectedAttrs,
    skuInfo: this.data.selectedSku,
    price: this.data.selectedSku.price,
    originalPrice: this.data.selectedSku.originalPrice,
    quantity: this.data.quantity
      }],
      totalAmount: this.data.selectedSku.price * this.data.quantity,
      createTime: Date.now()
  }

  // 保存临时订单（立即购买专用 key）
  wx.setStorageSync('tempOrder_direct', tempOrder)

  // 跳转到订单结算页
  wx.navigateTo({
      url: '/pages/order/checkout?from=direct_buy'
  })

  // 追踪立即购买事件
  app.trackEvent('buy_now', {
      product_id: this.data.productId,
      sku_id: this.data.selectedSku.id,
      quantity: this.data.quantity,
      total_amount: tempOrder.totalAmount
  })
  },

  // 发起拼团
  onStartGroupBuy(e) {
  const typeId = e.currentTarget.dataset.type

  // 如果有多个拼团类型且未指定具体类型，弹出选择面板
  const groupBuyInfo = this.data.groupBuyInfo
  if (!typeId && groupBuyInfo && groupBuyInfo.length > 1) {
      const itemList = groupBuyInfo.map(gb =>`${gb.label} ¥${gb.groupPrice} ${gb.desc}`)
      wx.showActionSheet({
    itemList,
    success: (res) =>{
          const selectedType = groupBuyInfo[res.tapIndex]
          this.doStartGroupBuy(selectedType.id)
    },
    fail: () =>{
    }
      })
      return
  }

  this.doStartGroupBuy(typeId || (groupBuyInfo && groupBuyInfo[0] && groupBuyInfo[0].id))
  },

  // 执行发起拼团（指定类型）
  doStartGroupBuy(typeId) {
  // 检查是否选择了规格
  if (!this.data.selectedSku) {
      wx.showToast({
    title: '请选择商品规格',
    icon: 'none',
    duration: 2000
      })
      return
  }

  // 检查库存
  if (this.data.selectedSku.stock <=0) {
      wx.showToast({
    title: '商品已售罄',
    icon: 'none',
    duration: 2000
      })
      return
  }

  // 检查登录状态
  if (!app.globalData.isLogin) {
      wx.showToast({
    title: '请先登录',
    icon: 'none',
    duration: 1500
      })
      setTimeout(() =>{
    wx.navigateTo({
          url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/product/detail?id=' + this.data.productId)
    })
      }, 1500)
      return
  }

  // 创建拼团
  const userInfo = app.globalData.userInfo || { id: 'default_user', name: '用户', avatar: '/assets/avatars/default.png' }
  const group = groupBuy.createGroup({
      productId: this.data.productId,
      productName: this.data.productInfo.name,
      originalPrice: this.data.productInfo.price,
      mainImage: this.data.productInfo.mainImage,
      skuId: this.data.selectedSku.id,
      skuAttrs: this.data.selectedAttrs,
      skuPrice: this.data.selectedSku.price,
      typeId: typeId,
      leaderId: userInfo.id,
      leaderName: userInfo.name,
      leaderAvatar: userInfo.avatar
  })

  // 保存拼团
  groupBuy.saveGroup(group)

  // 追踪事件
  app.trackEvent('start_group_buy', {
      product_id: this.data.productId,
      group_type: typeId,
      group_id: group.id
  })

  // 跳转到拼团页面
  wx.navigateTo({
      url: `/pages/group/group?groupId=${group.id}`
  })
  },

  // 查看所有拼团
  onViewGroupBuys() {
  wx.navigateTo({
      url: `/pages/group/group?productId=${this.data.productId}`
  })
  },

  // 点击拼团社交证明
  onGroupSocialTap() {
  this.onViewGroupBuys()
  },

  // 点击AR预览
  onARTap() {
  if (!this.data.arSupported) {
      wx.showModal({
    title: '提示',
    content: '您的设备不支持AR预览功能',
    showCancel: false
      })
      return
  }

  // 跳转到AR预览页面
  wx.navigateTo({
      url: `/pages/ar/ar?productId=${this.data.productId}`
  })

  // 追踪AR访问事件
  app.trackEvent('product_ar_access', {
      product_id: this.data.productId
  })
  },

  // 点击相关商品
  onRelatedProductTap(e) {
  const index = e.currentTarget.dataset.index
  const product = this.data.relatedProducts[index]

  // 跳转到商品详情页
  wx.navigateTo({
      url: `/pages/product/detail?id=${product.id}&source=related`
  })

  // 追踪相关商品点击事件
  app.trackEvent('related_product_click', {
      from_product_id: this.data.productId,
      to_product_id: product.id
  })
  },

  // 点击促销信息
  onPromotionTap(e) {
  const index = e.currentTarget.dataset.index
  const promotion = this.data.promotions[index]

  // 根据促销类型处理
  switch (promotion.type) {
      case 'coupon':
    // 跳转到优惠券页面
    wx.navigateTo({
          url: '/subpackages/user/coupon/coupon'
    })
    break
      case 'discount':
    // 显示折扣详情
    wx.showModal({
          title: promotion.title,
          content: promotion.content,
          showCancel: false
    })
    break
      default:
    // 显示促销信息
    wx.showToast({
          title: promotion.content,
          icon: 'none',
          duration: 2000
    })
  }

  // 追踪促销点击事件
  app.trackEvent('product_promotion_click', {
      product_id: this.data.productId,
      promotion_id: promotion.id,
      promotion_type: promotion.type
  })
  },

  // 点击客服
  onServiceTap() {
  // 打开客服对话
  const csConfig = storeConfig.customerService || {}
  const corpId = csConfig.corpId || app.globalData.corpId || ''
  const kfidUrl = csConfig.kfidUrl || app.globalData.kfidUrl || ''

  wx.openCustomerServiceChat({
      extInfo: { url: kfidUrl },
      corpId: corpId,
      success: (res) =>{
      },
      fail: (error) =>{
    console.error('打开客服失败', error)
    // 显示备用联系方式
    this.showContactInfo()
      }
  })

  // 追踪客服点击事件
  app.trackEvent('product_service_click', {
      product_id: this.data.productId
  })
  },

  // 显示联系方式
  showContactInfo() {
  const csConfig = storeConfig.customerService || {}
  const phone = csConfig.phone || '400-000-0000'
  const wechat = csConfig.wechat || 'nuopai_service'
  const workTime = csConfig.workTime || '9:00-18:00'
  wx.showModal({
      title: '联系我们',
      content: `客服电话：${phone}\n客服微信：${wechat}\n工作时间：${workTime}`,
      confirmText: '复制微信号',
      cancelText: '关闭',
      success: (res) =>{
    if (res.confirm) {
          wx.setClipboardData({
      data: wechat,
      success: () =>{
              wx.showToast({
        title: '微信号已复制',
        icon: 'success'
              })
      }
          })
    }
      }
  })
  },

  // 点击购物车
  onCartTap() {
  // 跳转到购物车页面
  wx.switchTab({
      url: '/pages/cart/cart'
  })

  // 追踪购物车点击事件
  app.trackEvent('product_cart_click', {
      product_id: this.data.productId
  })
  },

  // 点击返回
  onBackTap() {
  wx.navigateBack()
  },

  // 点击分享
  onShareTap() {
  // 显示分享菜单
  wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
  })

  // 也可以显示自定义的分享面板
  this.showCustomSharePanel()
  },

  // 显示自定义分享面板
  showCustomSharePanel() {
  // 这里可以实现自定义的分享面板
  wx.showToast({
      title: '点击右上角分享',
      icon: 'none',
      duration: 2000
  })
  },

  // 显示库存警告
  showStockWarning(stock) {
  wx.showModal({
      title: '库存不足',
      content: `当前规格仅剩${stock}件，请调整购买数量`,
      showCancel: false,
      confirmText: '知道了'
  })
  },

  // 显示错误提示
  showErrorTip(message) {
  wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
  })
  },

  // ========== 限时促销倒计时 ==========

  // 初始化促销信息
  initPromotion() {
    const now = new Date()
    const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    const promoEndTime = endTime.getTime()

    // 根据商品分类随机选择促销标签
    const labels = ['限时折扣', '今日特价', '闪购特惠']
    const promoLabel = labels[Math.floor(Math.random() * labels.length)]

    this.setData({
      promoEndTime,
      isPromoActive: true,
      promoLabel
    })
  },

  // 启动倒计时
  startCountdown() {
    this._updateCountdown()
    this._promoTimer = setInterval(() => {
      if (!this._updateCountdown()) {
        clearInterval(this._promoTimer)
        this._promoTimer = null
      }
    }, 1000)
  },

  // 更新倒计时显示，返回 false 表示已结束
  _updateCountdown() {
    const now = Date.now()
    const remaining = this.data.promoEndTime - now

    if (remaining <= 0) {
      this.setData({ isPromoActive: false, promoCountdown: '00:00:00' })
      return false
    }

    const hours = Math.floor(remaining / 3600000)
    const minutes = Math.floor((remaining % 3600000) / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)

    const hh = String(hours).padStart(2, '0')
    const mm = String(minutes).padStart(2, '0')
    const ss = String(seconds).padStart(2, '0')

    this.setData({ promoCountdown: `${hh}:${mm}:${ss}` })
    return true
  },

  // 字体大小变化回调
  onFontSizeChange(fontSize) {
  this.setData({ fontSize })
  },

  // 登录状态变化回调
  onLoginStatusChange(isLogin) {
  // 这里可以处理登录状态变化

  if (isLogin) {
      // 重新检查收藏状态
      this.checkCollectionStatus()
  }
  },

  // 网络状态变化回调
  onNetworkStatusChange(networkType) {
    if (networkType === 'none') {
      wx.showToast({
        title: '网络已断开',
        icon: 'none'
      })
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadProductData(this.data.productId)
    wx.stopPullDownRefresh()
  },

  // 重新加载（错误页点击重试）
  onReloadTap() {
    this.loadProductData(this.data.productId)
  },

  // ========== 社会证明 ==========

  // 初始化浏览人数（本地缓存模拟）
  initViewCount(productId) {
    const cacheKey = `product_view_${productId}`
    let viewCount = wx.getStorageSync(cacheKey) || 0
    viewCount += 1
    wx.setStorageSync(cacheKey, viewCount)
    const hotPercent = Math.min(viewCount / 100 * 100, 100)
    this.setData({ viewCount, hotPercent })
  },

  // 格式化销量数字
  formatSalesCount(count) {
    if (!count || count <= 0) return '0件'
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + '万件'
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + '千件'
    }
    return count + '件'
  },

  // 初始化销量数据
  initSalesCount(productInfo) {
    const salesCount = productInfo.sales || 0
    const salesCountText = this.formatSalesCount(salesCount)
    this.setData({ salesCount, salesCountText })
  },

  // 记录浏览历史
  recordBrowseHistory(productId) {
    try {
      const history = wx.getStorageSync('browse_history') || []
      // 去重：移除已存在的同一商品
      const filtered = history.filter(item => item.id !== productId)
      // 获取商品信息
      const productInfo = this.data.productInfo
      if (!productInfo) return
      const newItem = {
        id: productId,
        name: productInfo.name || '',
        price: productInfo.price || 0,
        image: productInfo.mainImage || '',
        category: productInfo.category || '',
        timestamp: Date.now()
      }
      // 插入头部，最多50条
      filtered.unshift(newItem)
      wx.setStorageSync('browse_history', filtered.slice(0, 50))
    } catch (e) {
      console.warn('记录浏览历史失败', e)
    }
  },

  // 更新库存紧迫感提示
  updateStockWarning(sku) {
    if (!sku) {
      this.setData({ stockWarningLevel: 0, stockWarningText: '', isSoldOut: false })
      return
    }
    const stock = sku.stock
    let stockWarningLevel = 0
    let stockWarningText = ''
    let isSoldOut = false

    if (stock <= 0) {
      stockWarningLevel = 3
      stockWarningText = '已售罄'
      isSoldOut = true
    } else if (stock <= 3) {
      stockWarningLevel = 2
      stockWarningText = '即将售罄'
    } else if (stock <= 10) {
      stockWarningLevel = 1
      stockWarningText = `仅剩 ${stock} 件`
    }

    this.setData({ stockWarningLevel, stockWarningText, isSoldOut })
  }
})
