// app.js - 小程序商城入口文件（针对30 - 60岁主妇优化）
// ⚠️ 不要在这里调用 getApp() — 模块加载时 App 尚未实例化！
let app = null
const cacheManager = require('./utils/cache-manager.js')
const accessibility = require('./utils/accessibility.js')
const notificationManager = require('./utils/notification-manager.js')

App({
  // 小程序初始化完成时触发
  onLaunch(options) {
  // 获取 App 实例（模块加载时 getApp() 不可用，onLaunch 时已就绪）
  app = getApp() || this

  try {
      app.globalData.currentPage = 'launch'

      this.initModules()

      // 检查微信版本兼容性
      this.checkCompatibility()

      // 监听网络状态变化（实时）
      this.initNetworkMonitor()

      // 初始化语音识别（针对目标用户优化）
      this.initVoiceRecognition()

      // 初始化隐私授权（P0审核要求）
      this.initPrivacyAuthorization()

      // 全局捕获未处理的Promise拒绝，防止基础库内部Error: timeout异常
      // ⚠️ 必须在所有异步操作（trackEvent等）之前注册，否则Error: timeout会泄露到控制台
      this.setupGlobalErrorHandlers()

      // 注册缓存定期清理定时器
      this.registerCacheCleanupTimer()

      // 记录启动事件
      this.trackEvent('app_launch', {
    scene: options.scene || 0,
    query: options.query || {}
      })
  } catch (e) {
      console.error('[App] onLaunch 初始化异常: ', e)
  }
  },

  // 小程序显示时触发
  onShow(options) {

  try {
      // 更新当前页面
      const currentPages = getCurrentPages()
      app.globalData.currentPage = currentPages.length > 0 ? currentPages[currentPages.length - 1].route : 'unknown'

      // 检查登录状态
      this.checkLoginStatus()

      // 检查网络状态
      this.checkNetworkStatus()

      // 检查购物车数量
      this.updateCartCount()

      // 显示欢迎语（针对目标用户）
      this.showWelcomeMessage()

      // 记录显示事件
      this.trackEvent('app_show', {
    scene: options.scene || 0,
    referrerInfo: options.referrerInfo || {}
      })
  } catch (e) {
      console.error('[App] onShow 异常: ', e)
  }
  },

  // 小程序隐藏时触发
  onHide() {

  // 记录隐藏事件
  this.trackEvent('app_hide')

  // 保存当前状态
  this.saveAppState()
  },

  // 小程序错误时触发
  onError(error) {
  console.error('小程序错误: ', error)

  // 错误上报（简化版本，避免复杂技术术语）
  this.reportError(error)

  // 显示友好的错误提示
  this.showFriendlyError(error)

  // 本地存储错误日志，留作后续分析
  this.saveErrorLocally(error)
  },

  // 页面不存在时触发
  onPageNotFound(res) {
  console.warn('页面不存在: ', res)

  // 跳转到首页（使用switchTab，因为index是tabBar页面）
  wx.switchTab({
      url: '/pages/index/index'
  })
  },

  initModules() {

  // 1. 用户系统初始化
  this.initUserSystem()

  // 2. 网络请求初始化
  this.initNetwork()

  // 3. 本地存储初始化（集成缓存管理器）
  this.initStorage()

  // 4. 缓存管理器初始化
  this.initCacheManager()

  // 5. 数据统计初始化
  this.initAnalytics()

  // 6. 微信小店API初始化
  this.initWechatStore()

  // 7. AR功能初始化（如果支持）
  this.initARFunction()

  // 8. 语音功能初始化
  this.initVoiceFunction()

  // 9. 消息通知管理器初始化
  this.initNotification()

  // 10. 兼职妈妈数据初始化
  this.initMomProgram()
  },

  initCacheManager() {

  // 清理过期缓存
  const cleaned = cacheManager.clearExpired()
  if (cleaned > 0) {
  }

  // 检查缓存使用情况
  const cacheInfo = cacheManager.getCacheSize()

  // 如果缓存使用率超过80%，主动清理
  if (cacheInfo.usagePercent > 80) {
      cacheManager.clearExpired()
  }

  // 将缓存管理器暴露到全局
  app.globalData.cacheManager = cacheManager
  },

  // 检查微信版本兼容性
  checkCompatibility() {
  try {
      // 使用新的API获取设备信息（微信基础库3.0.0+）
      let version = '', SDKVersion = '', model = '', platform = ''

      // 尝试使用新API
      if (typeof wx.getDeviceInfo ==='function' && typeof wx.getAppBaseInfo ==='function') {
    const deviceInfoPromise = wx.getDeviceInfo()
    const appBaseInfoPromise = wx.getAppBaseInfo()

    Promise.all([deviceInfoPromise, appBaseInfoPromise]).then(results =>{
          const device = results[0]
          const appBase = results[1]
          model = device.model || ''
          platform = device.platform || ''
          version = appBase.version || ''
          SDKVersion = appBase.SDKVersion || ''

          // 检查基础库版本
          if (this.compareVersion(SDKVersion, '2.10.0') < 0) {
      wx.showModal({
              title: '温馨提示',
              content: '您的微信版本较低，部分新功能可能无法使用。为了更好的体验，建议升级到最新版本。',
              confirmText: '去升级',
              cancelText: '暂不升级',
              success: (res) =>{
        if (res.confirm) {
                  // 跳转到应用商店
                  wx.navigateToMiniProgram({
          appId: 'wx...', // 微信官方小程序ID
          path: 'pages/update/update'
                  })
        }
              }
      })
          }

          // 记录设备信息（兼容旧格式）
          app.globalData.deviceInfo = {
      version,
      SDKVersion,
      model,
      platform
          }
    }).catch (err =>{
          console.warn('新API获取设备信息失败，尝试降级: ', err)
          // 降级方案：仍然先尝试新API直接获取（不通过Promise链）
          this.fallbackGetSystemInfo()
    })
      } else {
    // 新API不可用，降级使用旧API
    this.fallbackGetSystemInfo()
      }
  } catch (error) {
      console.warn('获取设备信息失败: ', error)
  }
  },

  // 降级方案：优先使用新API，仅在极旧版本使用wx.getSystemInfoSync
  fallbackGetSystemInfo() {
  try {
      // 尝试新API同步获取（基础库 3.0.0+）
      if (typeof wx.getDeviceInfo ==='function' && typeof wx.getAppBaseInfo ==='function') {
    try {
          const device = wx.getDeviceInfo()
          const appBase = wx.getAppBaseInfo()
          if (device && appBase) {
      const info = {
              version: appBase.version || '',
              SDKVersion: appBase.SDKVersion || '',
              model: device.model || '',
              platform: device.platform || ''
      }
      if (typeof app !== 'undefined' && app && app.globalData) {
              app.globalData.deviceInfo = info
      }
      // 版本检查
      if (this.compareVersion(info.SDKVersion, '2.10.0') < 0) {
    wx.showModal({
          title: '温馨提示',
          content: '您的微信版本较低，部分新功能可能无法使用。为了更好的体验，建议升级到最新版本。',
          confirmText: '去升级',
          cancelText: '暂不升级',
          success: (res) =>{
      if (res.confirm) {
              wx.navigateToMiniProgram({
        appId: 'wx...',
        path: 'pages/update/update'
              })
      }
          }
    })
      }
      return
          }
    } catch (e) {
          console.warn('新API降级失败: ', e)
    }
      }

      // 极旧版本兼容：使用 wx.getSystemInfoSync（基础库 3.7.8 后已弃用）
      try {
    const systemInfo = wx.getSystemInfoSync()
    const { version, SDKVersion, model, platform } = systemInfo
    if (this.compareVersion(SDKVersion, '2.10.0') < 0) {
          wx.showModal({
      title: '温馨提示',
      content: '您的微信版本较低，部分新功能可能无法使用。建议升级到最新版本。',
      confirmText: '去升级',
      cancelText: '暂不升级',
      success: (res) =>{
          if (res.confirm) {
        wx.navigateToMiniProgram({
              appId: 'wx...',
              path: 'pages/update/update'
        })
          }
      }
          })
    }
    app.globalData.deviceInfo = systemInfo
      } catch (e) {
    console.warn('getSystemInfoSync 不可用: ', e)
      }
  } catch (error) {
      console.warn('降级获取设备信息失败: ', error)
  }
  },

  initVoiceRecognition() {
  // 检查是否支持语音识别
  // wx.startRecord 已弃用，仅检查 wx.getRecorderManager 即可
  if (wx.getRecorderManager) {
      app.globalData.voiceSupported = true

      // 设置语音识别参数（针对中老年用户优化）
      this.voiceRecorderManager = wx.getRecorderManager()

      this.voiceRecorderManager.onStart(() =>{
      })

      this.voiceRecorderManager.onStop((res) =>{
    // 处理语音结果
    this.processVoiceResult(res)
      })

      this.voiceRecorderManager.onError((error) =>{
    console.error('语音识别错误: ', error)
    // 显示友好的错误提示
    this.showVoiceError(error)
      })

  } else {
      app.globalData.voiceSupported = false
  }
  },

  // 设置全局错误处理器，捕获未处理的Promise拒绝
  setupGlobalErrorHandlers() {
  // 捕获未处理的Promise拒绝（基础库2.14.0+）
  try {
      if (typeof wx.onUnhandledRejection ==='function') {
    wx.onUnhandledRejection((res) =>{
          console.warn('[全局] 捕获未处理的Promise拒绝: ', res?.reason || res)
          // 静默处理，防止Error: timeout扩散到控制台
    })
      }
  } catch (e) {
      // 忽略错误，不影响小程序启动
  }

  // 注：部分微信基础库版本会在WAServiceMainContext.js内部输出
  // Error: timeout 日志，此为底层运行时日志，非代码层异常，
  // JavaScript层面无法拦截。不影响小程序功能。
  },

  initUserSystem() {
  // 检查本地存储的用户信息
  const userInfo = wx.getStorageSync('userInfo')
  const token = wx.getStorageSync('token')

  if (userInfo && token) {
      app.globalData.userInfo = userInfo
      app.globalData.token = token
      app.globalData.isLogin = true

      // 验证token有效性
      this.verifyToken(token)
  } else {
      app.globalData.isLogin = false
      app.globalData.userInfo = null
      app.globalData.token = null
  }

  // 检查用户偏好设置
  const userPreferences = wx.getStorageSync('userPreferences') || {
      fontSize: 'normal',      // normal, large, extra - large
      voiceEnabled: true,      // 语音功能是否启用
      vibrationEnabled: true,  // 振动反馈是否启用
      theme: 'light',          // light, dark
      notificationEnabled: true // 通知是否启用
  }

  app.globalData.userPreferences = userPreferences

  // 应用用户偏好
  this.applyUserPreferences(userPreferences)
  },

  initNetwork() {
  // 设置请求超时时间（针对网络可能较慢的用户）
  const networkTimeout = {
      request: 15000,      // 15秒
      connectSocket: 10000,
      uploadFile: 30000,   // 30秒
      downloadFile: 30000
  }

  const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Client-Type': 'miniprogram',
      'X-Client-Version': '1.0.0'
  }

  // 添加请求拦截器
  wx.addInterceptor?.({
      // 请求前处理
      request(options) {
    // 添加token
    const token = wx.getStorageSync('token')
    if (token) {
          options.header = options.header || {}
          options.header['Authorization'] = `Bearer ${token}`
    }

    // 添加默认header
    options.header = { ...defaultHeaders, ...options.header }

    // 添加设备信息（优先使用新API，兼容极旧版本）
    let deviceModel = '', deviceSystem = '', devicePlatform = '', deviceVersion = ''
    try {
      if (typeof wx.getDeviceInfo === 'function' && typeof wx.getAppBaseInfo === 'function') {
        const deviceInfo = wx.getDeviceInfo()
        const appBaseInfo = wx.getAppBaseInfo()
        deviceModel = deviceInfo.model || ''
        devicePlatform = deviceInfo.platform || ''
        deviceVersion = appBaseInfo.version || ''
        deviceSystem = appBaseInfo.SDKVersion || ''
      }
      // 如果新API未提供足够信息，不做额外降级（字段已足够标识设备）
    } catch (e) {
      // 获取失败时静默处理，不影响请求继续
    }
    options.header['X-Device-Info'] = JSON.stringify({
          model: deviceModel,
          system: deviceSystem,
          platform: devicePlatform,
          version: deviceVersion
    })

    // 添加时间戳防止缓存
    if (options.url.indexOf('?') ===-1) {
          options.url +='?_t=' + Date.now()
    } else {
          options.url +='&_t=' + Date.now()
    }

    return options
      },

      // 请求成功处理
      response(res) {
    // 统一处理响应
    const { statusCode, data } = res

    // 处理HTTP错误状态
    if (statusCode ===401) {
          // token过期，清除登录状态
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')

          // 更新全局状态
          app.globalData.isLogin = false
          app.globalData.userInfo = null
          app.globalData.token = null

          // 显示友好的提示
          wx.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none',
      duration: 2000
          })

          // 跳转到登录页
          setTimeout(() =>{
      wx.redirectTo({
              url: '/pages/login/login'
      })
          }, 1500)
    }

    return res
      },

      // 请求失败处理
      fail(err) {
    console.error('网络请求失败: ', err)

    // 显示友好的网络错误提示
    wx.showToast({
          title: '网络连接失败，请检查网络',
          icon: 'none',
          duration: 2000
    })

    return Promise.reject(err)
      }
  })
  },

  // 初始化本地存储（集成缓存管理器）
  initStorage() {
  // 检查存储空间
  try {
      const cacheInfo = cacheManager.getCacheSize()
      // 如果使用率超过80%，清理过期缓存
      if (cacheInfo.usagePercent > 80) {
    const cleaned = cacheManager.clearExpired()
      }

  } catch (error) {
      console.warn('检查存储空间失败: ', error)
  }
  },

  initAnalytics() {

  if (app.globalData.userInfo) {
      this.setUserProperties(app.globalData.userInfo)
  }
  },

  initWechatStore() {

  // 从配置文件中读取店铺信息
  try {
      const config = require('./config/store-config.js')
      app.globalData.storeConfig = config

      const defaultStore = config.stores.find(store =>store.default) || config.stores[0]
      app.globalData.currentStore = defaultStore

  } catch (error) {
      console.error('加载店铺配置失败: ', error)

      // 使用默认配置
      app.globalData.storeConfig = {
    stores: [{
          name: '诺派永生花',
          appid: 'wx7f092564e7a079a6',
          // AppSecret 应从服务端获取，不在前端代码中硬编码
          // secret should be fetched from server - side API, never hardcoded in frontend code
    }],
    defaultStore: '诺派永生花'
      }

      app.globalData.currentStore = app.globalData.storeConfig.stores[0]
  }
  },

  initARFunction() {
  // 检查是否支持AR
  if (wx.createCameraContext) {
      app.globalData.arSupported = true
  } else {
      app.globalData.arSupported = false
  }
  },

  initVoiceFunction() {
  // 检查是否支持语音合成
  if (wx.getRecorderManager) {
      app.globalData.voiceFunctionEnabled = true
  } else {
      app.globalData.voiceFunctionEnabled = false
  }
  },

  initNotification() {
  // 首次使用时初始化模拟数据
  notificationManager.initMockData()
  // 将管理器暴露到全局
  app.globalData.notificationManager = notificationManager
  },

  initMomProgram() {
  // 从本地存储恢复数据
  const momData = wx.getStorageSync('momData')
  if (momData) {
      app.globalData.momData = momData
  }
  },

  // 检查登录状态
  checkLoginStatus() {
  const token = wx.getStorageSync('token')
  const userInfo = wx.getStorageSync('userInfo')

  const isLogin = !!(token && userInfo)

  if (isLogin !== app.globalData.isLogin) {
      app.globalData.isLogin = isLogin
      app.globalData.userInfo = userInfo
      app.globalData.token = token

      // 触发登录状态变化事件
      this.triggerLoginStatusChange(isLogin)
  }
  },

  // 检查网络状态
  checkNetworkStatus() {
  wx.getNetworkType({
      success: (res) =>{
    const networkType = res.networkType
    app.globalData.networkType = networkType

    // 记录网络状态变化
    if (app.globalData.lastNetworkType !== networkType) {
          app.globalData.lastNetworkType = networkType

          // 触发网络状态变化事件
          this.triggerNetworkStatusChange(networkType)
    }
      }
  })
  },

  initNetworkMonitor() {
  try {
      wx.onNetworkStatusChange((res) =>{
    const { isConnected, networkType } = res

    // 更新全局网络状态
    const prevNetworkType = app.globalData.networkType
    app.globalData.networkType = networkType
    app.globalData.lastNetworkType = prevNetworkType

    if (!isConnected) {
          // 断网时显示全局提示条
          this.showOfflineNotice()
    } else {
          // 恢复网络时隐藏提示
          this.hideOfflineNotice()
    }

    // 触发网络状态变化事件
    this.triggerNetworkStatusChange(networkType)
      })
  } catch (error) {
      console.warn('初始化网络监听失败: ', error)
  }
  },

  // 显示断网提示条
  showOfflineNotice() {
  wx.showToast({
      title: '当前无网络连接，请检查网络设置',
      icon: 'none',
      duration: 3000
  })
  },

  // 隐藏断网提示
  hideOfflineNotice() {
  // 网络恢复时提示
  wx.showToast({
      title: '网络已恢复',
      icon: 'success',
      duration: 2000
  })
  },

  // 更新购物车数量
  updateCartCount() {
  // 从本地存储获取购物车数量
  const cartItems = wx.getStorageSync('cartItems') || []
  const cartCount = cartItems.reduce((total, item) =>total + (item.quantity || 1), 0)

  app.globalData.cartCount = cartCount

  // 更新TabBar的购物车角标
  if (cartCount > 0) {
      wx.setTabBarBadge({
    index: 2, // 购物车Tab的索引
    text: cartCount > 99 ? '99+' : cartCount.toString()
      })
  } else {
      wx.removeTabBarBadge({
    index: 2
      })
  }
  },

  // 显示欢迎语
  showWelcomeMessage() {
  // 每天只显示一次欢迎语
  const lastWelcomeDate = wx.getStorageSync('lastWelcomeDate')
  const today = new Date().toDateString()

  if (lastWelcomeDate !== today) {
      // 显示温馨的欢迎语
      wx.showToast({
    title: '欢迎来到诺派永生花商城！',
    icon: 'none',
    duration: 2000
      })

      // 保存今天的日期
      wx.setStorageSync('lastWelcomeDate', today)
  }
  },

  // 验证token有效性
  verifyToken(token) {
  // 这里调用后端接口验证token
  // 简化处理：暂时只检查是否存在
  if (token) {
      const tokenExpireTime = wx.getStorageSync('tokenExpireTime')
      if (tokenExpireTime && Date.now() > tokenExpireTime) {
    // token已过期
    this.refreshToken()
      }
  }
  },

  // 刷新token
  refreshToken() {
  // 这里调用刷新token的接口
  // 模拟刷新后更新token过期时间（默认2小时后过期）
  const newExpireTime = Date.now() + 2 * 60 * 60 * 1000
  wx.setStorageSync('tokenExpireTime', newExpireTime)
  },

  // 保存token过期时间（登录/注册成功后调用）
  saveTokenExpireTime(token, expiresIn) {
  // expiresIn: 秒，默认7200秒(2小时)
  const expireTimestamp = Date.now() + ((expiresIn || 7200) * 1000)
  wx.setStorageSync('tokenExpireTime', expireTimestamp)
  },

  // 清理存储空间（使用缓存管理器）
  cleanupStorage() {
  const cleaned = cacheManager.clearExpired()

  // 如果空间仍然紧张，清理最旧的缓存
  const cacheInfo = cacheManager.getCacheSize()
  if (cacheInfo.usagePercent > 80) {
      const allKeys = cacheManager.getCacheKeys()
      if (allKeys.length > 50) {
    // 保留最新50条，删除其余
    const toRemove = allKeys.slice(0, allKeys.length - 50)
    toRemove.forEach(key =>cacheManager.removeCache(key))
      }
  }
  },

  // 加载用户偏好设置（供页面调用）
  loadUserPreferences() {
    try {
      const userPreferences = wx.getStorageSync('userPreferences') || {
        fontSize: 'normal',
        voiceEnabled: true,
        vibrationEnabled: true,
        theme: 'light',
        notificationEnabled: true
      }

      // 更新全局数据
      app.globalData.userPreferences = userPreferences

      // 应用这些设置
      this.applyUserPreferences(userPreferences)

      return userPreferences
    } catch (error) {
      console.warn('[App] 加载用户偏好设置失败: ', error)
      // 返回默认设置
      const defaultPreferences = {
        fontSize: 'normal',
        voiceEnabled: true,
        vibrationEnabled: true,
        theme: 'light',
        notificationEnabled: true
      }
      return defaultPreferences
    }
  },

  // 保存用户偏好设置（供页面调用）
  saveUserPreferences(preferences) {
    try {
      if (!preferences) return false

      // 获取当前设置
      const currentPreferences = app.globalData.userPreferences || {}

      // 合并新设置
      const updatedPreferences = { ...currentPreferences, ...preferences }

      // 更新全局数据
      app.globalData.userPreferences = updatedPreferences

      // 持久化到本地存储
      wx.setStorageSync('userPreferences', updatedPreferences)

      // 应用新设置
      this.applyUserPreferences(updatedPreferences)

      return true
    } catch (error) {
      console.error('[App] 保存用户偏好设置失败: ', error)
      return false
    }
  },

  // 应用用户偏好
  applyUserPreferences(preferences) {
  // 应用字体大小
  this.applyFontSize(preferences.fontSize)

  // 应用主题
  this.applyTheme(preferences.theme)

  // 应用语音设置
  this.applyVoiceSettings(preferences.voiceEnabled)

  // 应用振动设置
  this.applyVibrationSettings(preferences.vibrationEnabled)
  },

  // 应用字体大小
  applyFontSize(fontSize) {
  // 根据用户偏好设置字体大小
  const fontSizeMap = {
      'normal': '16px',
      'large': '18px',
      'extra-large': '20px'
  }

  const baseFontSize = fontSizeMap[fontSize] || '16px'

  wx.setStorageSync('baseFontSize', baseFontSize)

  // 通知所有页面更新字体大小
  this.broadcastFontSizeChange(baseFontSize)
  },

  // 应用主题
  applyTheme(theme) {
  wx.setStorageSync('theme', theme)

  // 通知所有页面更新主题
  this.broadcastThemeChange(theme)
  },

  // 应用语音设置
  applyVoiceSettings(enabled) {
  app.globalData.voiceEnabled = enabled
  },

  // 应用振动设置
  applyVibrationSettings(enabled) {
  app.globalData.vibrationEnabled = enabled
  },

  // 处理语音结果
  processVoiceResult(result) {

  // 这里处理语音识别结果
  // 可以转换为文字，然后执行搜索或其他操作

  // 显示语音识别结果
  if (result.tempFilePath) {
      // 有语音文件
      this.convertVoiceToText(result.tempFilePath)
  }
  },

  // 转换语音为文字
  convertVoiceToText(voiceFilePath) {
  wx.showLoading({
      title: '正在识别语音...',
      mask: true
  })

  // 这里调用语音识别服务
  setTimeout(() =>{
      wx.hideLoading()

  // 模拟识别结果
  const recognizedText = '永生花客厅摆件'

      // 显示识别结果
      wx.showModal({
    title: '语音识别结果',
    content: `您说的是："${recognizedText}"`,
    confirmText: '搜索',
    cancelText: '重新说',
    success: (res) =>{
          if (res.confirm) {
      // 执行搜索
      wx.navigateTo({
              url: `/pages/search/search?keyword=${encodeURIComponent(recognizedText)}`
      })
          } else if (res.cancel) {
      // 重新录音
      this.startVoiceRecognition()
          }
    }
      })
  }, 1500)
  },

  // 开始语音识别
  startVoiceRecognition() {
  if (app.globalData.voiceSupported) {
      wx.authorize({
    scope: 'scope.record',
    success: () =>{
          this.voiceRecorderManager.start({
      duration: 10000, // 最长10秒
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3'
          })
    },
    fail: (error) =>{
          console.error('语音授权失败: ', error)
          this.showVoicePermissionError()
    }
      })
  }
  },

  // 显示语音权限错误
  showVoicePermissionError() {
  wx.showModal({
      title: '需要语音权限',
      content: '请允许小程序使用麦克风，以便使用语音搜索功能',
      confirmText: '去设置',
      cancelText: '取消',
      success: (res) =>{
    if (res.confirm) {
          wx.openSetting({
      success: (settingRes) =>{
      }
          })
    }
      }
  })
  },

  // 显示语音错误
  showVoiceError(error) {
  wx.showToast({
      title: '语音识别失败，请重试',
      icon: 'none',
      duration: 2000
  })
  },

  // 显示友好的错误提示
  showFriendlyError(error) {
  // 将技术性错误转换为用户友好的提示
  let friendlyMessage = '哎呀，出了点小问题，请稍后重试'

  const errorStr = (error && (error.message || error.errMsg || String(error))) || ''

  if (errorStr.includes('network') || errorStr.includes('Network') || errorStr.includes('网络') || errorStr.includes('request: fail')) {
      friendlyMessage = '网络连接失败，请检查网络'
  } else if (errorStr.includes('timeout') || errorStr.includes('超时')) {
      friendlyMessage = '请求超时，请稍后重试'
  } else if (errorStr.includes('auth') || errorStr.includes('Auth') || errorStr.includes('authorize') || errorStr.includes('授权')) {
      friendlyMessage = '需要登录才能继续操作'
  } else if (errorStr.includes('storage') || errorStr.includes('Storage')) {
      friendlyMessage = '存储空间已满，请清理缓存'
  } else if (errorStr.includes('fail') && (errorStr.includes('not') || errorStr.includes('无'))) {
      friendlyMessage = '功能暂不可用，请稍后重试'
  } else if (errorStr.includes('request: fail') || errorStr.includes('request: fail error')) {
      friendlyMessage = '服务器繁忙，请稍后重试'
  } else if (errorStr.includes('parse') || errorStr.includes('json') || errorStr.includes('JSON')) {
      friendlyMessage = '数据异常，请刷新页面重试'
  } else if (errorStr.includes('no permission') || errorStr.includes('denied') || errorStr.includes('forbidden') || errorStr.includes('401') || errorStr.includes('403')) {
      friendlyMessage = '暂无权限，请联系客服'
  }

  // 显示提示（不打断用户当前操作）
  wx.showToast({
      title: friendlyMessage,
      icon: 'none',
      duration: 2500
  })

  // 记录错误（简化版本）
  },

  // 判断是否应发送Analytics请求（开发环境跳过，减少无意义timeout）
  _shouldSendAnalytics() {
  try {
      // 开发环境不发送埋点，避免域名白名单缺失导致timeout刷屏
      const accountInfo = wx.getAccountInfoSync()
      if (accountInfo && accountInfo.miniProgram && accountInfo.miniProgram.envVersion === 'develop') {
    return false
      }
  } catch (e) {
      // 获取失败不阻塞，继续发送
  }
  // 配置中analytics未启用则不发送
  const analyticsConfig = app.globalData.storeConfig?.analytics
  if (analyticsConfig && analyticsConfig.enabled === false) {
      return false
  }
  return true
  },

  // 事件追踪
  trackEvent(eventName, params = {}) {
  // 开发环境跳过，避免analytics服务器不可达导致timeout刷屏
  if (!this._shouldSendAnalytics()) return

  const eventData = {
      event: eventName,
      timestamp: Date.now(),
      page: app.globalData.currentPage || 'unknown',
      user_id: app.globalData.userInfo?.id || 'anonymous',
      device_info: app.globalData.deviceInfo || {},
      ...params
  }

  // 发送到统计服务器（2000ms短超时，fire-and-forget）
  const trackReq = wx.request({
      url: app.globalData.config?.analyticsUrl || 'https://wechat.zzjgsw.com/api/analytics/track',
      method: 'POST',
      data: eventData,
      header: { 'Content-Type': 'application/json' },
      timeout: 2000,
      fail: () => {} // 静默失败，不打扰用户
  })
  if (trackReq && typeof trackReq.catch === 'function') {
      trackReq.catch(() => {})
  }
  },

  setUserProperties(userInfo) {
  if (!this._shouldSendAnalytics()) return

  const userProperties = {
      user_id: userInfo.id || 'unknown',
      gender: userInfo.gender || 'unknown',
      age_group: this.getAgeGroup(userInfo),
      city: userInfo.city || 'unknown',
      login_time: Date.now()
  }

  const userReq = wx.request({
      url: app.globalData.config?.analyticsUrl || 'https://wechat.zzjgsw.com/api/analytics/set_user',
      method: 'POST',
      data: userProperties,
      header: { 'Content-Type': 'application/json' },
      timeout: 2000,
      fail: () => {} // 静默失败
  })
  if (userReq && typeof userReq.catch === 'function') {
      userReq.catch(() => {})
  }
  },

  getAgeGroup(userInfo) {
  // 根据用户信息估算年龄分组
  return '30 - 60'
  },

  // 错误上报（始终尝试发送，但超时很短）
  reportError(error) {
  // 开发环境跳过
  if (!this._shouldSendAnalytics()) return

  const errorData = {
      type: 'js_error',
      message: error.message || String(error),
      stack: error.stack,
      timestamp: Date.now(),
      page: app.globalData.currentPage || 'unknown',
      user_id: app.globalData.userInfo?.id || 'anonymous',
      device_info: app.globalData.deviceInfo || {}
  }

  // 错误上报，2000ms短超时
  const errorReq = wx.request({
      url: app.globalData.config?.errorReportUrl || 'https://wechat.zzjgsw.com/api/errors/report',
      method: 'POST',
      data: errorData,
      header: { 'Content-Type': 'application/json' },
      timeout: 2000,
      fail: () => {} // 静默处理
  })
  if (errorReq && typeof errorReq.catch === 'function') {
      errorReq.catch(() => {})
  }
  },

  // 本地存储错误日志（作为上报的补充/兜底）
  saveErrorLocally(error) {
  try {
      const errorLogs = wx.getStorageSync('errorLogs') || []
      const errorLog = {
    message: error.message || String(error),
    stack: error.stack,
    time: new Date().toLocaleString(),
    page: app.globalData.currentPage || 'unknown'
      }

      errorLogs.push(errorLog)

      // 最多保留50条日志
      if (errorLogs.length > 50) {
    errorLogs.splice(0, errorLogs.length - 50)
      }

      wx.setStorageSync('errorLogs', errorLogs)
  } catch (e) {
      console.warn('保存错误日志失败: ', e)
  }
  },

  // 保存应用状态
  saveAppState() {
  // 保存当前应用状态到本地存储
  const appState = {
      lastActiveTime: Date.now(),
      currentPage: app.globalData.currentPage,
      cartCount: app.globalData.cartCount || 0,
      userPreferences: app.globalData.userPreferences || {}
  }

  wx.setStorageSync('lastAppState', appState)
  },

  // 广播字体大小变化
  broadcastFontSizeChange(fontSize) {
  // 通知所有页面字体大小变化
  const pages = getCurrentPages()
  pages.forEach(page =>{
      if (page.onFontSizeChange) {
    page.onFontSizeChange(fontSize)
      }
  })
  },

  // 广播主题变化
  broadcastThemeChange(theme) {
  // 通知所有页面主题变化
  const pages = getCurrentPages()
  pages.forEach(page =>{
      if (page.onThemeChange) {
    page.onThemeChange(theme)
      }
  })
  },

  // 触发登录状态变化事件
  triggerLoginStatusChange(isLogin) {
  // 通知所有页面登录状态变化
  const pages = getCurrentPages()
  pages.forEach(page =>{
      if (page.onLoginStatusChange) {
    page.onLoginStatusChange(isLogin)
      }
  })
  },

  // 触发网络状态变化事件
  triggerNetworkStatusChange(networkType) {
  // 通知所有页面网络状态变化
  const pages = getCurrentPages()
  pages.forEach(page =>{
      if (page.onNetworkStatusChange) {
    page.onNetworkStatusChange(networkType)
      }
  })

  // 显示网络状态提示（仅在网络较差时）
  if (networkType ==='none' || networkType ==='2g') {
      wx.showToast({
    title: '当前网络较差，加载可能较慢',
    icon: 'none',
    duration: 2000
      })
  }
  },

  // 版本比较工具
  compareVersion(v1, v2) {
  const v1parts = v1.split('.').map(Number)
  const v2parts = v2.split('.').map(Number)

  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0
      const v2part = v2parts[i] || 0

      if (v1part > v2part) return 1
      if (v1part < v2part) return -1
  }

  return 0
  },

  //===== ==== = 隐私授权相关（P0） = ==== ==== =

  initPrivacyAuthorization() {
  // 检查微信隐私接口是否可用（基础库 2.32.3+）
  if (wx.getPrivacySetting) {
      wx.getPrivacySetting({
    success: (res) =>{
          if (res.needAuthorization) {
      // 需要授权，标记未同意（弹窗由首页组件控制）
      app.globalData.needPrivacyAuth = true
          } else {
      // 已授权
      wx.setStorageSync('privacyAgreed', true)
      app.globalData.needPrivacyAuth = false
          }
    },
    fail: (err) =>{
          console.warn('获取隐私设置失败: ', err)
          // 降级处理：检查本地存储
          const agreed = wx.getStorageSync('privacyAgreed')
          app.globalData.needPrivacyAuth = !agreed
    }
      })
  } else {
      // 基础库版本过低，使用本地存储控制
      const agreed = wx.getStorageSync('privacyAgreed')
      app.globalData.needPrivacyAuth = !agreed
  }
  },

  // 检查隐私是否已同意
  checkPrivacyAgreed() {
  return wx.getStorageSync('privacyAgreed') ===true
  },

  //===== ==== = 缓存管理 = ==== ==== =

  // 注册缓存定期清理定时器（每30分钟检查一次）
  registerCacheCleanupTimer() {
  // 每30分钟清理过期缓存
  this._cacheCleanupTimer = setInterval(() =>{
      const cleaned = cacheManager.clearExpired()
      if (cleaned > 0) {
      }

      // 检查缓存使用情况
      const cacheInfo = cacheManager.getCacheSize()
      if (cacheInfo.usagePercent > 80) {
    console.warn('缓存使用率超过80%，建议清理')
      }
  }, 30 * 60 * 1000)
  },

  //===== ==== = 登录检查工具方法 = ==== ==== =

  // 检查登录状态，未登录时跳转登录页
  // @param {string} redirect - 登录成功后的重定向页面路径（含参数）
  // @returns {boolean} - 是否已登录
  checkLogin(redirect = '') {
  if (app.globalData.isLogin) {
      return true
  }

  // 未登录，跳转登录页
  const loginUrl = redirect 
      ? `/pages/login/login?redirect=${encodeURIComponent(redirect)}`
      : '/pages/login/login'

  wx.navigateTo({ url: loginUrl })
  return false
  },

  // 全局数据
  globalData: {
  // 用户相关
  userInfo: null,
  isLogin: false,
  token: null,
  userPreferences: {
      fontSize: 'normal',
      voiceEnabled: true,
      vibrationEnabled: true,
      theme: 'light',
      notificationEnabled: true
  },

  // 设备相关
  deviceInfo: null,
  networkType: 'wifi',
  lastNetworkType: null,
  voiceSupported: false,
  voiceFunctionEnabled: false,
  arSupported: false,

  // 应用状态
  currentPage: null,
  cartCount: 0,
  currentStore: null,
  needPrivacyAuth: false, // 是否需要隐私授权（P0）

  // 运行环境（development / staging / production）
  env: 'development',

  // 配置
  config: {
      baseUrl: 'https://wechat.zzjgsw.com',
      analyticsUrl: 'https://wechat.zzjgsw.com/api/analytics/track',
      errorReportUrl: 'https://wechat.zzjgsw.com/api/errors/report',
      storeConfig: null
  },

  // 缓存数据
  cache: {
      homeData: null,
      categories: null,
      hotProducts: null
  },
  // 缓存管理器实例
  cacheManager: null,

  // 语音相关
  voiceRecorderManager: null,

  // AR相关
  arContext: null,

  // 兼职妈妈体验官
  momData: null
  }
})
