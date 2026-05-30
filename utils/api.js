// utils/api.js - 微信小程序API请求封装
const storeConfig = require('../config/store-config.js')

/**
  * API请求封装
  * @param {string} url - 接口地址（相对路径，如 '/products'）
  * @param {string} method - 请求方法，默认GET
  * @param {object} data - 请求参数
  * @param {object} header - 请求头
  * @param {boolean} showLoading - 是否显示加载提示
  * @returns {Promise} - 返回Promise对象
  */
function request(url, method = 'GET', data = {}, header = {}, showLoading = true) {
  const app = getApp()
  const env = app?.globalData?.env || 'development'
  const apiBaseUrl = storeConfig.environment[env]?.apiBaseUrl || 'https://api.zzjgsw.com'

  // 构建完整URL
  const fullUrl = `${apiBaseUrl}${url}`

  // 显示加载提示（使用计数器防止并发请求导致 showLoading/hideLoading 不配对）
  if (showLoading) {
    request._loadingCount = (request._loadingCount || 0) + 1
    if (request._loadingCount === 1) {
      wx.showLoading({
        title: '加载中...',
        mask: true
      })
    }
  }

  // 安全隐藏 loading
  const hideLoading = () => {
    if (showLoading && request._loadingCount > 0) {
      request._loadingCount -= 1
      if (request._loadingCount === 0) {
        wx.hideLoading()
      }
    }
  }

  // 创建一个永远不会reject的Promise，防止未捕获的Promise拒绝导致Error: timeout
  return new Promise((resolve) =>{
  wx.request({
      url: fullUrl,
      method,
      data,
      header: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${app.globalData.token || ''}`,
    ...header
      },
      timeout: 15000,
      success: (res) =>{
    hideLoading()

    // HTTP状态码为2xx表示成功
    if (res.statusCode >=200 && res.statusCode < 300) {
          // 接口返回的完整响应
          resolve(res.data)
    } else {
          // 服务器返回错误
          console.error('API请求失败: ', res)
          resolve({error: true, code: res.statusCode, message: `请求失败: ${res.statusCode}`})

          // 显示错误提示
          wx.showToast({
      title: `请求失败(${res.statusCode})`,
      icon: 'error',
      duration: 2000
          })
    }
      },
      fail: (err) =>{
    hideLoading()
    console.error('API请求失败: ', err)

    // 不reject(err)，防止未捕获的Promise拒绝导致控制台Error: timeout错误
    // resolve一个错误标记对象，调用方可检查result.error
    resolve({error: true, errMsg: err.errMsg || '请求失败'})

    // 网络错误提示
    wx.showToast({
          title: '网络错误，请检查连接',
          icon: 'error',
          duration: 2000
    })
      },
      complete: () =>{
    // 确保hideLoading被调用（双重保险）
    hideLoading()
      }
  })
  })
}

/**
  * 产品相关API
  */
const productApi = {
  getProducts(params = {}) {
  const { 
      page = 1, 
      limit = 20, 
      category, 
      minPrice, 
      maxPrice, 
      keyword,
      scene,
      flowerType,
      color,
      style,
      sort = 'default' // default, sales, price_asc, price_desc, new
  } = params

  const queryParams = {
      page,
      limit,
      ...(category && { category }),
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
      ...(keyword && { keyword }),
      ...(scene && { scene }),
      ...(flowerType && { flowerType }),
      ...(color && { color }),
      ...(style && { style }),
      sort
  }

  return request('/products', 'GET', queryParams)
  },

  getHotProducts(limit = 4) {
  return request('/products', 'GET', { 
      limit, 
      sort: 'sales',
      status: 'onsale'
  })
  },

  getNewProducts(limit = 4) {
  return request('/products', 'GET', { 
      limit, 
      sort: 'new',
      status: 'onsale'
  })
  },

  getSceneProducts(scene, limit = 4) {
  return request('/products', 'GET', { 
      scene, 
      limit,
      status: 'onsale'
  })
  },

  getProductDetail(productId) {
  return request(`/products/${productId}`)
  },

  // 搜索产品
  searchProducts(keyword, page = 1, limit = 20) {
  return request('/products', 'GET', { keyword, page, limit })
  }
}

/**
  * 分类相关API
  */
const categoryApi = {
  getCategories() {
  return request('/categories')
  },

  getCategoryDetail(categoryId) {
  return request(`/categories/${categoryId}`)
  }
}

/**
  * 轮播图/广告位API
  */
const bannerApi = {
  getBanners(position = 'home') {
  return request('/banners', 'GET', { position })
  }
}

/**
  * 促销活动API
  */
const promotionApi = {
  getPromotions(type = 'all') {
  return request('/promotions', 'GET', { type })
  }
}

/**
  * 搜索建议API
  */
const searchApi = {
  getSuggestions(keyword) {
  return request('/search/suggest', 'GET', { q: keyword })
  },

  getHotKeywords() {
  return request('/search/hot')
  }
}

/**
  * 用户相关API
  */
const userApi = {
  // 微信登录
  login(code) {
  return request('/auth/login', 'POST', { code })
  },

  getUserInfo() {
  return request('/user/info')
  },

  // 更新用户信息
  updateUserInfo(userInfo) {
  return request('/user/info', 'PUT', userInfo)
  },

  getUserAddresses() {
  return request('/user/addresses')
  },

  // 添加用户地址
  addUserAddress(address) {
  return request('/user/addresses', 'POST', address)
  },

  // 更新用户地址
  updateUserAddress(addressId, address) {
  return request(`/user/addresses/${addressId}`, 'PUT', address)
  },

  // 删除用户地址
  deleteUserAddress(addressId) {
  return request(`/user/addresses/${addressId}`, 'DELETE')
  }
}

/**
  * 购物车相关API
  */
const cartApi = {
  getCart() {
  return request('/cart')
  },

  // 添加商品到购物车
  addToCart(productId, skuId, quantity = 1) {
  return request('/cart/items', 'POST', { productId, skuId, quantity })
  },

  // 更新购物车商品数量
  updateCartItem(itemId, quantity) {
  return request(`/cart/items/${itemId}`, 'PUT', { quantity })
  },

  // 删除购物车商品
  removeCartItem(itemId) {
  return request(`/cart/items/${itemId}`, 'DELETE')
  },

  // 清空购物车
  clearCart() {
  return request('/cart/clear', 'POST')
  }
}

/**
  * 订单相关API
  */
const orderApi = {
  // 创建订单
  createOrder(orderData) {
  return request('/orders', 'POST', orderData)
  },

  getOrders(status = 'all', page = 1, limit = 10) {
  return request('/orders', 'GET', { status, page, limit })
  },

  getOrderDetail(orderId) {
  return request(`/orders/${orderId}`)
  },

  // 取消订单
  cancelOrder(orderId) {
  return request(`/orders/${orderId}/cancel`, 'POST')
  },

  // 确认收货
  confirmOrder(orderId) {
  return request(`/orders/${orderId}/confirm`, 'POST')
  }
}

/**
  * 优惠券相关API
  */
const couponApi = {
  getAvailableCoupons() {
  return request('/coupons/available')
  },

  getUserCoupons(status = 'unused') {
  return request('/user/coupons', 'GET', { status })
  },

  // 领取优惠券
  claimCoupon(couponId) {
  return request(`/coupons/${couponId}/claim`, 'POST')
  },

  // 使用优惠券
  useCoupon(couponId, orderId) {
  return request(`/coupons/${couponId}/use`, 'POST', { orderId })
  }
}

/**
  * 积分相关API
  */
const pointsApi = {
  getUserPoints() {
  return request('/user/points')
  },

  getPointsHistory(page = 1, limit = 20) {
  return request('/user/points/history', 'GET', { page, limit })
  },

  // 积分兑换
  exchangePoints(points, productId) {
  return request('/user/points/exchange', 'POST', { points, productId })
  }
}

// 导出所有API模块
module.exports = {
  request,
  product: productApi,
  category: categoryApi,
  banner: bannerApi,
  promotion: promotionApi,
  search: searchApi,
  user: userApi,
  cart: cartApi,
  order: orderApi,
  coupon: couponApi,
  points: pointsApi
}
