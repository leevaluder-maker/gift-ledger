import { OCCASION_CATEGORIES } from '../constants/index.js'

/**
 * 智能匹配事由分类和具体事由
 * @param {string} inputOccasion - 用户输入或AI识别的事由
 * @returns {{ occasion: string, occasionType: string, matched: boolean }}
 */
export function matchOccasion(inputOccasion) {
  if (!inputOccasion || typeof inputOccasion !== 'string') {
    return { occasion: inputOccasion || '', occasionType: 'other', matched: false }
  }

  const input = inputOccasion.trim().toLowerCase()

  // 遍历所有分类和事由进行模糊匹配
  for (const category of OCCASION_CATEGORIES) {
    for (const item of category.items) {
      const itemLower = item.toLowerCase()

      // 完全匹配
      if (input === itemLower) {
        return { occasion: item, occasionType: category.type, matched: true }
      }

      // 包含匹配（输入包含事由或事由包含输入）
      if (input.includes(itemLower) || itemLower.includes(input)) {
        return { occasion: item, occasionType: category.type, matched: true }
      }

      // 关键词模糊匹配
      // 提取关键词（如"结婚"、"满月"、"丧事"、"大寿"等）
      const keywords = extractKeywords(item)
      for (const keyword of keywords) {
        if (input.includes(keyword)) {
          return { occasion: item, occasionType: category.type, matched: true }
        }
      }
    }
  }

  // 未匹配到，返回原值并归类为 other
  return { occasion: inputOccasion.trim(), occasionType: 'other', matched: false }
}

/**
 * 从事由中提取关键词
 * @param {string} occasion
 * @returns {string[]}
 */
function extractKeywords(occasion) {
  const keywordMap = {
    // 红喜事关键词
    '结婚': ['结婚', '婚', '婚礼', '婚宴', '嫁', '娶', '新人'],
    '满月': ['满月', '满月酒', '喜酒', '百日', '百天'],
    '乔迁': ['乔迁', '搬家', '新居', '新房', '入伙'],
    '升学': ['升学', '高考', '大学', '状元', '毕业'],

    // 白喜事关键词
    '丧事': ['丧事', '丧', '去世', '逝世', '离世', '白事', '葬礼', '追悼'],

    // 祝寿关键词
    '大寿': ['大寿', '寿', '寿宴', '生日', '寿辰', '祝寿'],
  }

  const keywords = []
  for (const [key, values] of Object.entries(keywordMap)) {
    if (occasion.includes(key)) {
      keywords.push(...values)
    }
  }

  return keywords
}

/**
 * 根据事由类型获取分类标签
 * @param {string} occasionType
 * @returns {string}
 */
export function getCategoryLabel(occasionType) {
  const cat = OCCASION_CATEGORIES.find(c => c.type === occasionType)
  return cat ? cat.label : '其它'
}
