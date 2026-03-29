<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Trash2, RotateCcw, AlertCircle } from 'lucide-vue-next'
import { useRecordStore } from '../stores/recordStore'
import { OCCASION_CATEGORIES } from '../constants/index.js'

const router = useRouter()
const recordStore = useRecordStore()

// 获取事由分类颜色
const getCategoryColor = (occasionType) => {
  const cat = OCCASION_CATEGORIES.find(c => c.type === occasionType)
  return cat ? cat.color : '#6b7280'
}

// 格式化金额
const formatAmount = (amount) => {
  return amount.toLocaleString('zh-CN')
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

// 格式化删除时间
const formatDeletedTime = (isoString) => {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

// 恢复记录
const restoreRecord = (id) => {
  recordStore.restoreRecord(id)
}

// 永久删除
const permanentDelete = (id) => {
  if (confirm('确定要永久删除这条记录吗？此操作不可撤销。')) {
    recordStore.permanentDeleteRecord(id)
  }
}

// 清空回收站
const clearAll = () => {
  if (recordStore.recycleBin.value.length === 0) return
  if (confirm(`确定要清空回收站吗？这将永久删除 ${recordStore.recycleBin.value.length} 条记录，此操作不可撤销。`)) {
    recordStore.clearRecycleBin()
  }
}

// 回收站记录（按删除时间倒序）
const recycleBinRecords = computed(() => recordStore.recycleBin.value)
</script>

<template>
  <div class="min-h-screen bg-[#fcf9f8] pb-20 sm:pb-24">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-[#fcf9f8]/80 backdrop-blur-md border-b border-[#e5e2e1]/30">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <button
          @click="router.back()"
          class="p-1 -ml-1 text-[#990f19] active:scale-90 transition-transform"
        >
          <ArrowLeft :size="24" class="sm:hidden" />
          <ArrowLeft :size="28" class="hidden sm:block" />
        </button>
        <h1 class="text-xl sm:text-2xl font-black tracking-tight text-[#990f19]">回收站</h1>
        <button
          v-if="recycleBinRecords.length > 0"
          @click="clearAll"
          class="text-sm text-red-600 font-bold"
        >
          清空
        </button>
        <div v-else class="w-8 sm:w-10"></div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
      <!-- 空状态 -->
      <div v-if="recycleBinRecords.length === 0" class="text-center py-16 sm:py-24">
        <div class="w-16 h-16 sm:w-20 sm:h-20 bg-[#f0eded] rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 class="text-[#5a403e]" :size="32" />
        </div>
        <p class="text-[#5a403e] font-bold text-base sm:text-lg">回收站是空的</p>
        <p class="text-[#5a403e]/60 text-sm sm:text-base mt-2">删除的记录将在这里保留</p>
      </div>

      <!-- 记录列表 -->
      <div v-else class="space-y-3">
        <!-- 提示信息 -->
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
          <AlertCircle class="text-amber-600 flex-shrink-0 mt-0.5" :size="18" />
          <p class="text-amber-800 text-xs sm:text-sm">
            回收站中的记录可随时恢复。建议定期清理不需要的记录。
          </p>
        </div>

        <!-- 记录卡片 -->
        <div
          v-for="record in recycleBinRecords"
          :key="record.id"
          class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm"
        >
          <div class="flex items-start justify-between gap-3">
            <!-- 左侧信息 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="w-2 h-2 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: getCategoryColor(record.occasionType) }"
                ></span>
                <span class="font-black text-base sm:text-lg truncate">{{ record.name }}</span>
              </div>
              <div class="text-lg sm:text-xl font-black text-[#990f19]">
                + ¥{{ formatAmount(record.amount) }}
              </div>
              <div class="text-xs sm:text-sm text-[#5a403e] mt-1">
                {{ record.occasion }} · {{ formatDate(record.date) }}
              </div>
              <div class="text-xs text-[#5a403e]/60 mt-1">
                删除于 {{ formatDeletedTime(record.deletedAt) }}
              </div>
            </div>

            <!-- 右侧操作 -->
            <div class="flex flex-col gap-2">
              <button
                @click="restoreRecord(record.id)"
                class="flex items-center gap-1 px-3 py-2 bg-[#990f19] text-white text-xs sm:text-sm font-bold rounded-lg active:scale-95 transition-transform"
              >
                <RotateCcw :size="14" />
                恢复
              </button>
              <button
                @click="permanentDelete(record.id)"
                class="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-600 text-xs sm:text-sm font-bold rounded-lg active:scale-95 transition-transform"
              >
                <Trash2 :size="14" />
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
