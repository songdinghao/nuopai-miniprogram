/**
  * cache - manager.js - 本地缓存管理器
  * 支持过期时间、容量估算、自动清理等功能
  */

// 缓存前缀常量
const CACHE_PREFIX = 'cm_'
const CACHE_META_KEY = CACHE_PREFIX + '_meta'
const DEFAULT_TTL = 5 * 60 * 1000 // 默认5分钟
const MAX_CACHE_KEYS = 200 // 最大缓存条目数

/**
  * 设置缓存
  * @param {string} key - 缓存键
  * @param {*} data - 缓存数据
  * @param {number} ttl - 过期时间(ms)，默认5分钟
  */
function setCache(key, data, ttl = DEFAULT_TTL) {
  try {
  const cacheKey = CACHE_PREFIX + key
  const cacheData = {
      data: data,
      expireTime: Date.now() + ttl,
      createdAt: Date.now(),
      size: estimateSize(data)
  }

  wx.setStorageSync(cacheKey, cacheData)

  // 更新元数据
  updateMeta(key, cacheData)

  // 检查是否需要清理
  checkAndCleanup()
  } catch (error) {
  console.warn('[cache - manager] 设置缓存失败: ', key, error)
  // 存储空间不足时清理过期缓存
  if (error.errMsg && (error.errMsg.includes('storage') || error.errMsg.includes('exceed'))) {
      clearExpired()
  }
  }
}

/**
  * 读取缓存
  * @param {string} key - 缓存键
  * @returns {*|null} 缓存数据，过期返回null
  */
function getCache(key) {
  try {
  const cacheKey = CACHE_PREFIX + key
  const cacheData = wx.getStorageSync(cacheKey)

  if (!cacheData) {
      return null
  }

  // 检查是否过期
  if (Date.now() > cacheData.expireTime) {
      removeCache(key)
      return null
  }

  return cacheData.data
  } catch (error) {
  console.warn('[cache - manager] 读取缓存失败: ', key, error)
  return null
  }
}

/**
  * 移除指定缓存
  * @param {string} key - 缓存键
  */
function removeCache(key) {
  try {
  const cacheKey = CACHE_PREFIX + key
  wx.removeStorageSync(cacheKey)

  // 更新元数据
  const meta = getMeta()
  delete meta[key]
  saveMeta(meta)
  } catch (error) {
  console.warn('[cache - manager] 移除缓存失败: ', key, error)
  }
}

/**
  * 清理所有过期缓存
  * @returns {number} 清理的缓存数量
  */
function clearExpired() {
  try {
  const meta = getMeta()
  const now = Date.now()
  let cleanedCount = 0

  Object.keys(meta).forEach((key) =>{
      if (now > meta[key].expireTime) {
    try {
          wx.removeStorageSync(CACHE_PREFIX + key)
          delete meta[key]
          cleanedCount++
    } catch (e) {
          console.warn('[cache - manager] 清理过期缓存失败: ', key, e)
    }
      }
  })

  if (cleanedCount > 0) {
      saveMeta(meta)
  }

  return cleanedCount
  } catch (error) {
  console.warn('[cache - manager] 清理过期缓存失败: ', error)
  return 0
  }
}

/**
  * 估算缓存占用大小
  * @returns {Object} { currentSize: number, limitSize: number, usagePercent: number, itemCount: number }
  */
function getCacheSize() {
  try {
  const storageInfo = wx.getStorageInfoSync()
  const meta = getMeta()
  const itemCount = Object.keys(meta).length

  // 估算缓存数据占用（仅计算带前缀的键）
  let cacheSize = 0
  storageInfo.keys.forEach((key) =>{
      if (key.startsWith(CACHE_PREFIX)) {
    const data = wx.getStorageSync(key)
    if (data) {
          cacheSize +=estimateSize(data)
    }
      }
  })

  return {
      currentSize: storageInfo.currentSize || 0,
      limitSize: storageInfo.limitSize || 0,
      usagePercent: storageInfo.limitSize
    ? parseFloat(((storageInfo.currentSize / storageInfo.limitSize) * 100).toFixed(1))
    : 0,
      cacheSize: Math.round(cacheSize / 1024 * 100) / 100, // KB
      itemCount
  }
  } catch (error) {
  console.warn('[cache - manager] 获取缓存大小失败: ', error)
  return { currentSize: 0, limitSize: 0, usagePercent: 0, cacheSize: 0, itemCount: 0 }
  }
}

/**
  * 检查并清理过老或过多的缓存
  */
function checkAndCleanup() {
  try {
  const meta = getMeta()
  const keys = Object.keys(meta)

  // 如果缓存条目超过上限，清理最旧的
  if (keys.length > MAX_CACHE_KEYS) {
      const sorted = keys
    .map((key) =>({ key, createdAt: meta[key].createdAt }))
    .sort((a, b) =>a.createdAt - b.createdAt)

      const toRemove = sorted.slice(0, keys.length - MAX_CACHE_KEYS)
      toRemove.forEach((item) =>{
    removeCache(item.key)
      })

  }
  } catch (error) {
  console.warn('[cache - manager] 检查清理失败: ', error)
  }
}

/**
  * 获取所有缓存键
  * @returns {string[]}
  */
function getCacheKeys() {
  const meta = getMeta()
  return Object.keys(meta)
}

/**
  * 清空所有缓存
  * @returns {number} 清空的缓存数量
  */
function clearAll() {
  try {
  const meta = getMeta()
  const keys = Object.keys(meta)
  let count = 0

  keys.forEach((key) =>{
      try {
    wx.removeStorageSync(CACHE_PREFIX + key)
    count++
      } catch (e) {
    // 忽略单个删除失败
      }
  })

  wx.removeStorageSync(CACHE_META_KEY)
  return count
  } catch (error) {
  console.warn('[cache - manager] 清空缓存失败: ', error)
  return 0
  }
}

/**
  * 更新元数据
  * @private
  */
function updateMeta(key, cacheData) {
  try {
  const meta = getMeta()
  meta[key] = {
      expireTime: cacheData.expireTime,
      createdAt: cacheData.createdAt,
      size: cacheData.size
  }
  saveMeta(meta)
  } catch (error) {
  console.warn('[cache - manager] 更新元数据失败: ', error)
  }
}

/**
  * 获取元数据
  * @private
  */
function getMeta() {
  try {
  return wx.getStorageSync(CACHE_META_KEY) || {}
  } catch (error) {
  return {}
  }
}

/**
  * 保存元数据
  * @private
  */
function saveMeta(meta) {
  try {
  wx.setStorageSync(CACHE_META_KEY, meta)
  } catch (error) {
  console.warn('[cache - manager] 保存元数据失败: ', error)
  }
}

/**
  * 估算数据大小(bytes)
  * @private
  */
function estimateSize(data) {
  try {
  const json = JSON.stringify(data)
  return json ? json.length * 2 : 0 // 粗略估算，每个字符2字节
  } catch (error) {
  return 0
  }
}

module.exports = {
  setCache,
  getCache,
  removeCache,
  clearExpired,
  getCacheSize,
  getCacheKeys,
  clearAll
}
