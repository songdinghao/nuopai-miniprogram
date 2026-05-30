/**
  * 广告法禁用词校验工具
  * 
  * 用于检查商品文案、营销内容中是否包含广告法禁用词，
  * 可在商品描述提交前进行校验，降低合规风险。
  * 
  * 使用示例：
  *   const { filterAdText } = require('./ad-word-filter')
  *   const result = filterAdText('国家级品质，第一品牌')
  *   // result = { hasViolation: true, violations: ['国家级', '第一品牌'] }
  */

// 广告法禁用词列表 - 按类别组织
const AD_BANNED_WORDS = {
  // 绝对化用语
  absolute: [
  '国家级', '最高级', '最佳', '最', '第一', '首个', '首选',
  '顶级', '极品', '第一品牌', '绝无仅有', '万能', '100%',
  '百分之百', '100％', '百分百', '国际级', '世界级',
  '第一', '唯一', '首个', '首款', '首家', '首次'
  ],
  // 行业特定 - 永生花相关高频禁词
  industry: [
  '永不凋谢', // 永生花行业高频词，涉嫌虚假宣传
  '永不褪色', '永久保存', '永久有效',
  '终身', '终身免费', '终身使用'
  ],
  // 虚假宣传类
  misleading: [
  '销量第一', '销量冠军', '排名第一', '全网第一',
  '全网最低', '最低价', '历史最低', '超低价',
  '点击领取', '点击有奖', '点击获奖', '点击惊喜',
  '随时退', '随心退', '无条件退款', '无理由退款'
  ],
  // 医疗/功效类（永生花行业可能涉及）
  medical: [
  '治疗', '疗效', '治愈', '康复', '抗过敏',
  '安神', '助眠', '养生', '保健', '防辐射'
  ]
}

// 展平所有禁用词，去重
const ALL_BANNED_WORDS = [
  ...new Set([
  ...AD_BANNED_WORDS.absolute,
  ...AD_BANNED_WORDS.industry,
  ...AD_BANNED_WORDS.misleading,
  ...AD_BANNED_WORDS.medical
  ])
]

// 按长度降序排列，优先匹配长词
ALL_BANNED_WORDS.sort((a, b) =>b.length - a.length)

/**
  * 检查文本是否包含广告法禁用词
  * 
  * @param {string} text - 待检查的文本（商品标题、描述等）
  * @returns {{ hasViolation: boolean, violations: string[] }}
  *   - hasViolation: 是否存在违规
  *   - violations: 发现的禁用词列表（去重）
  */
function filterAdText(text) {
  if (!text || typeof text !== 'string') {
  return { hasViolation: false, violations: [] }
  }

  const foundWords = []

  for (const word of ALL_BANNED_WORDS) {
  if (text.indexOf(word) !== -1) {
      foundWords.push(word)
  }
  }

  return {
  hasViolation: foundWords.length > 0,
  violations: [...new Set(foundWords)]
  }
}

/**
  * 获取所有禁用词分类（用于展示或配置）
  * @returns {Object} 分类的禁用词列表
  */
function getBannedWordCategories() {
  return AD_BANNED_WORDS
}

module.exports = {
  filterAdText,
  getBannedWordCategories
}
