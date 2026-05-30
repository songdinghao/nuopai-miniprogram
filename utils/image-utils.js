/**
  * image - utils.js - 图片懒加载与优化工具
  * 提供图片懒加载、失败兜底、WebP推荐等功能
  */

// 默认占位图（base64 极小尺寸的灰色占位）
const DEFAULT_PLACEHOLDER = 'data: image/svg + xml, %3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22200%22 height%3D%22200%22 viewBox%3D%220 0 200 200%22%3E%3Crect width%3D%22200%22 height%3D%22200%22 fill%3D%22%23f0f0f0%22%2F%3E%3Ctext x%3D%2250%25%22 y%3D%2255%25%22 text - anchor%3D%22middle%22 fill%3D%22%23999%22 font - size%3D%2230%22%3E%F0%9F%96%BC%EF%B8%8F%3C%2Ftext%3E%3C%2Fsvg%3E'

// 加载失败时的兜底占位图
const FALLBACK_IMAGE = '/assets/images/image-fallback.png'

// 批处理队列
const batchQueue = new Map()
let batchTimer = null

/**
  * 懒加载单张图片
  * @param {string} imageUrl - 图片URL
  * @param {Object} options - 配置选项
  * @param {string} options.placeholder - 加载中占位图
  * @param {string} options.fallback - 失败兜底图
  * @param {number} options.timeout - 加载超时时间(ms)
  * @param {Function} options.onLoad - 加载成功回调
  * @param {Function} options.onError - 加载失败回调
  * @returns {Promise < string > } 返回最终使用的图片URL
  */
function lazyLoad(imageUrl, options = {}) {
  const {
  placeholder = DEFAULT_PLACEHOLDER,
  fallback = FALLBACK_IMAGE,
  timeout = 10000,
  onLoad,
  onError
  } = options

  if (!imageUrl) {
  return Promise.resolve(fallback)
  }

  // 立即返回占位图，后台开始加载真实图片
  const loadRealImage = new Promise((resolve) =>{
  const timer = setTimeout(() =>{
      console.warn('[image - utils] 图片加载超时: ', imageUrl)
      onError && onError(new Error('加载超时'))
      resolve(fallback)
  }, timeout)

  // 尝试加载图片
  wx.getImageInfo({
      src: imageUrl,
      success: (res) =>{
    clearTimeout(timer)
    onLoad && onLoad(res)
    resolve(imageUrl)
      },
      fail: (err) =>{
    clearTimeout(timer)
    console.warn('[image - utils] 图片加载失败: ', imageUrl, err)
    onError && onError(err)
    resolve(fallback)
      }
  })
  })

  return loadRealImage
}

/**
  * 批量懒加载图片
  * @param {string[]} imageUrls - 图片URL数组
  * @param {Object} options - 配置选项（同 lazyLoad）
  * @param {number} options.batchDelay - 批处理延迟(ms)，默认500ms
  * @param {Function} options.onProgress - 进度回调(loaded, total)
  * @returns {Promise < string[] > } 返回所有图片的最终URL
  */
function batchLazyLoad(imageUrls, options = {}) {
  const {
  batchDelay = 500,
  onProgress,
  ...loadOptions
  } = options

  if (!imageUrls || imageUrls.length ===0) {
  return Promise.resolve([])
  }

  const batchKey = Date.now().toString()
  const total = imageUrls.length
  const results = new Array(total).fill(null)
  let loadedCount = 0

  return new Promise((resolve) =>{
  imageUrls.forEach((url, index) =>{
      lazyLoad(url, {
    ...loadOptions,
    onLoad: (res) =>{
          results[index] = url
          loadedCount++
          onProgress && onProgress(loadedCount, total)
          checkComplete()
    },
    onError: (err) =>{
          results[index] = loadOptions.fallback || FALLBACK_IMAGE
          loadedCount++
          onProgress && onProgress(loadedCount, total)
          checkComplete()
    }
      })
  })

  function checkComplete() {
      if (loadedCount >=total) {
    resolve(results)
      }
  }
  })
}

/**
  * 获取WebP格式图片URL（生产环境替换）
  * @param {string} imageUrl - 原始图片URL
  * @param {Object} options - 配置选项
  * @param {number} options.width - 目标宽度
  * @param {number} options.height - 目标高度
  * @param {number} options.quality - 图片质量(1 - 100)
  * @returns {string} WebP格式图片URL
  */
function getWebPUrl(imageUrl, options = {}) {
  const { width, height, quality = 80 } = options

  if (!imageUrl) {
  return imageUrl
  }

  // 如果是远程图片，尝试转换为WebP
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
  let webpUrl = imageUrl

  // 添加尺寸参数
  if (width && height) {
      const separator = webpUrl.includes('?') ? '&' : '?'
      webpUrl +=`${separator}imageView2/1/w/${width}/h/${height}/format/webp/q/${quality}`
  } else if (width) {
      const separator = webpUrl.includes('?') ? '&' : '?'
      webpUrl +=`${separator}imageView2/2/w/${width}/format/webp/q/${quality}`
  } else {
      const separator = webpUrl.includes('?') ? '&' : '?'
      webpUrl +=`${separator}imageView2/format/webp/q/${quality}`
  }

  return webpUrl
  }

  // 本地图片不支持WebP转换，直接返回
  return imageUrl
}

/**
  * 获取图片尺寸缓存key
  * @param {string} imageUrl - 图片URL
  * @returns {string} 缓存key
  */
function getImageCacheKey(imageUrl) {
  if (!imageUrl) return ''
  // 对URL进行哈希作为缓存key
  let hash = 0
  for (let i = 0; i < imageUrl.length; i++) {
  const char = imageUrl.charCodeAt(i)
  hash = ((hash << 5) - hash) + char
  hash = hash & hash // Convert to 32bit integer
  }
  return `img_cache_${Math.abs(hash).toString(36)}`
}

/**
  * 预加载图片（用于关键图片，如首屏）
  * @param {string|string[]} imageUrls - 图片URL或URL数组
  * @returns {Promise < void > }
  */
function preload(imageUrls) {
  const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls]
  const promises = urls.map(url =>{
  return new Promise((resolve) =>{
      if (!url) {
    resolve()
    return
      }
      const image = wx.createImage ? new Image() : null
      if (image) {
    image.onload = resolve
    image.onerror = resolve
    image.src = url
      } else {
    // 小程序环境，使用preloadImage
    wx.preloadImage ? wx.preloadImage({ urls: [url] }).catch (() =>{}).finally(resolve) : resolve()
      }
  })
  })
  return Promise.all(promises)
}

module.exports = {
  DEFAULT_PLACEHOLDER,
  FALLBACK_IMAGE,
  lazyLoad,
  batchLazyLoad,
  getWebPUrl,
  getImageCacheKey,
  preload
}
