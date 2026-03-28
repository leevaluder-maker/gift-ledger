import { ref, computed } from 'vue'
import { OCCASION_CATEGORIES } from '../constants/index.js'

const CUSTOM_OCCASIONS_KEY = 'minimal_ledger_custom_occasions'

// 单例状态
const customOccasions = ref([])

// 从 localStorage 加载自定义事由
const loadCustomOccasions = () => {
  const stored = localStorage.getItem(CUSTOM_OCCASIONS_KEY)
  if (stored) {
    try {
      customOccasions.value = JSON.parse(stored)
    } catch (e) {
      console.error('Failed to parse custom occasions:', e)
      customOccasions.value = []
    }
  }
}

// 保存到 localStorage
const saveCustomOccasions = () => {
  localStorage.setItem(CUSTOM_OCCASIONS_KEY, JSON.stringify(customOccasions.value))
}

// 初始化加载（只执行一次）
loadCustomOccasions()

// 添加自定义事由
const addCustomOccasion = (name) => {
  const trimmedName = name.trim()
  if (!trimmedName) return false

  // 检查是否已存在
  if (customOccasions.value.includes(trimmedName)) {
    return true // 已存在，返回成功但不重复添加
  }

  customOccasions.value.push(trimmedName)
  saveCustomOccasions()
  return true
}

// 删除自定义事由
const removeCustomOccasion = (name) => {
  const index = customOccasions.value.indexOf(name)
  if (index > -1) {
    customOccasions.value.splice(index, 1)
    saveCustomOccasions()
    return true
  }
  return false
}

// 获取带自定义事由的分类列表
const occasionCategoriesWithCustom = computed(() => {
  return OCCASION_CATEGORIES.map(cat => {
    if (cat.type === 'other') {
      return {
        ...cat,
        items: [...customOccasions.value]
      }
    }
    return cat
  })
})

export function useCustomOccasionsStore() {
  return {
    customOccasions,
    occasionCategoriesWithCustom,
    addCustomOccasion,
    removeCustomOccasion,
    loadCustomOccasions
  }
}
