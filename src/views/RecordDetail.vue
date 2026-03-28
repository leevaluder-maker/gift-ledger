<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Trash2 } from 'lucide-vue-next'
import { useRecordStore } from '../stores/recordStore'
import { OCCASION_CATEGORIES } from '../constants/index.js'

const route = useRoute()
const router = useRouter()
const recordStore = useRecordStore()

const record = ref(null)
const showDeleteConfirm = ref(false)

// 获取事由分类名称
const getCategoryLabel = (occasionType) => {
  const cat = OCCASION_CATEGORIES.find(c => c.type === occasionType)
  return cat ? cat.label : '其它'
}

const loadRecord = () => {
  const recordId = route.params.id
  if (recordId) {
    record.value = recordStore.getRecordById(recordId)
  }
}

const formatAmount = (amount) => {
  return amount.toLocaleString('zh-CN')
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

const getStatusClass = (record) => {
  return record.status === 'returned'
    ? 'bg-green-100 text-green-800'
    : 'bg-amber-100 text-amber-700'
}

const getStatusText = (record) => {
  return record.status === 'returned' ? '已还礼' : '待还礼'
}

const toggleStatus = () => {
  if (record.value) {
    const success = recordStore.toggleStatus(record.value.id)
    if (success) {
      record.value.status = record.value.status === 'returned' ? 'pending' : 'returned'
    }
  }
}

const showEditModal = ref(false)
const editForm = ref({
  amount: '',
  name: '',
  date: '',
  occasion: '',
  occasionType: 'red',
  status: 'pending',
  address: ''
})

const onEdit = () => {
  if (record.value) {
    editForm.value = {
      amount: record.value.amount,
      name: record.value.name,
      date: record.value.date,
      occasion: record.value.occasion,
      occasionType: record.value.occasionType || 'red',
      status: record.value.status,
      address: record.value.address || ''
    }
    showEditModal.value = true
  }
}

const saveEdit = () => {
  if (record.value && editForm.value.amount && editForm.value.name) {
    const success = recordStore.updateRecord(record.value.id, {
      ...editForm.value,
      amount: parseFloat(editForm.value.amount),
      type: 'received' // 保持为收礼
    })
    if (success) {
      // 更新本地显示
      record.value = { ...record.value, ...editForm.value, amount: parseFloat(editForm.value.amount) }
      showEditModal.value = false
    }
  }
}

const cancelEdit = () => {
  showEditModal.value = false
}

const deleteRecord = () => {
  if (record.value) {
    const success = recordStore.deleteRecord(record.value.id)
    if (success) {
      router.push('/records')
    }
    showDeleteConfirm.value = false
  }
}

onMounted(() => {
  loadRecord()
})
</script>

<template>
  <div class="min-h-screen bg-[#fcf9f8] pb-20 sm:pb-24">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-[#fcf9f8]/80 backdrop-blur-md border-b border-[#e5e2e1]/30">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <button
          @click="$router.back()"
          class="p-1 -ml-1 text-[#990f19] active:scale-90 transition-transform"
        >
          <ArrowLeft :size="24" class="sm:hidden" />
          <ArrowLeft :size="28" class="hidden sm:block" />
        </button>
        <h1 class="text-xl sm:text-2xl font-black tracking-tight text-[#990f19]">记录详情</h1>
        <div class="w-8 sm:w-10"></div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
      <div v-if="record" class="space-y-4 sm:space-y-6">
        <!-- Amount Card -->
        <div class="bg-white p-5 sm:p-8 rounded-2xl text-center shadow-sm">
          <div class="text-[#5a403e] text-base sm:text-lg font-bold mb-1 sm:mb-2">收礼金额</div>
          <div class="text-4xl sm:text-[4rem] font-black text-[#990f19]">
            + ¥{{ formatAmount(record.amount) }}
          </div>
          <div class="mt-3 sm:mt-4 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#f0eded] rounded-xl">
            <p class="text-sm sm:text-base text-[#5a403e] font-bold">{{ record.name }} 送礼给我（{{ record.occasion }}）</p>
          </div>
          <div class="mt-3 sm:mt-4">
            <span
              class="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-bold"
              :class="getStatusClass(record)"
            >
              {{ getStatusText(record) }}
            </span>
          </div>
        </div>

        <!-- Info Card -->
        <div class="bg-white p-5 sm:p-8 rounded-2xl shadow-sm space-y-4 sm:space-y-6">
          <div class="flex justify-between items-center pb-3 sm:pb-4 border-b border-[#e5e2e1]">
            <span class="text-[#5a403e] text-base sm:text-xl font-bold">送礼人</span>
            <span class="text-base sm:text-xl font-black">{{ record.name }}</span>
          </div>

          <div class="flex justify-between items-center pb-3 sm:pb-4 border-b border-[#e5e2e1]">
            <span class="text-[#5a403e] text-base sm:text-xl font-bold">事由分类</span>
            <span class="text-base sm:text-xl font-black">{{ getCategoryLabel(record.occasionType) }}</span>
          </div>

          <div class="flex justify-between items-center pb-3 sm:pb-4 border-b border-[#e5e2e1]">
            <span class="text-[#5a403e] text-base sm:text-xl font-bold">具体事由</span>
            <span class="text-base sm:text-xl font-black">{{ record.occasion }}</span>
          </div>

          <div class="flex justify-between items-center pb-3 sm:pb-4 border-b border-[#e5e2e1]">
            <span class="text-[#5a403e] text-base sm:text-xl font-bold">日期</span>
            <span class="text-base sm:text-xl font-black">{{ formatDate(record.date) }}</span>
          </div>

          <div v-if="record.address" class="flex justify-between items-center pb-3 sm:pb-4 border-b border-[#e5e2e1]">
            <span class="text-[#5a403e] text-base sm:text-xl font-bold">地址</span>
            <span class="text-base sm:text-xl font-black">{{ record.address }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
          <button
            class="w-full h-12 sm:h-16 bg-[#f0eded] text-[#1b1c1c] text-base sm:text-xl font-black rounded-2xl active:scale-95 transition-transform"
            @click="onEdit"
          >
            编辑记录
          </button>

          <button
            class="w-full h-12 sm:h-16 bg-red-100 text-red-600 text-base sm:text-xl font-black rounded-2xl active:scale-95 transition-transform"
            @click="showDeleteConfirm = true"
          >
            删除记录
          </button>
        </div>
      </div>

      <div v-else class="text-center py-12 sm:py-16 text-[#5a403e]">
        加载中...
      </div>
    </main>

    <!-- Delete Confirmation Dialog -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6">
      <div class="bg-white rounded-2xl p-5 sm:p-8 w-full max-w-md">
        <h3 class="text-xl sm:text-2xl font-black mb-3 sm:mb-4">确认删除</h3>
        <p class="text-sm sm:text-base text-[#5a403e] mb-6 sm:mb-8">确定要删除这条记录吗？删除后无法恢复。</p>
        <div class="flex gap-3 sm:gap-4">
          <button
            @click="showDeleteConfirm = false"
            class="flex-1 h-12 sm:h-14 bg-[#f0eded] text-[#1b1c1c] font-bold rounded-xl text-sm sm:text-base"
          >
            取消
          </button>
          <button
            @click="deleteRecord"
            class="flex-1 h-12 sm:h-14 bg-red-600 text-white font-bold rounded-xl text-sm sm:text-base"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div class="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md my-auto">
        <h3 class="text-xl sm:text-2xl font-black mb-4 sm:mb-6">编辑记录</h3>

        <div class="space-y-3 sm:space-y-4">
          <!-- 金额 -->
          <div>
            <label class="block text-xs sm:text-sm font-bold text-[#5a403e] mb-1.5 sm:mb-2">金额（元）</label>
            <input
              v-model="editForm.amount"
              type="number"
              class="w-full bg-[#f0eded] rounded-xl p-3 sm:p-4 text-base sm:text-lg font-bold text-[#1b1c1c] border-none focus:ring-2 focus:ring-[#bc2c2e] outline-none"
              placeholder="输入金额"
            />
          </div>

          <!-- 姓名 -->
          <div>
            <label class="block text-xs sm:text-sm font-bold text-[#5a403e] mb-1.5 sm:mb-2">送礼人姓名</label>
            <input
              v-model="editForm.name"
              type="text"
              class="w-full bg-[#f0eded] rounded-xl p-3 sm:p-4 text-base sm:text-lg font-bold text-[#1b1c1c] border-none focus:ring-2 focus:ring-[#bc2c2e] outline-none"
              placeholder="输入姓名"
            />
          </div>

          <!-- 日期 -->
          <div>
            <label class="block text-xs sm:text-sm font-bold text-[#5a403e] mb-1.5 sm:mb-2">日期</label>
            <input
              v-model="editForm.date"
              type="date"
              class="w-full bg-[#f0eded] rounded-xl p-3 sm:p-4 text-base sm:text-lg font-bold text-[#1b1c1c] border-none focus:ring-2 focus:ring-[#bc2c2e] outline-none"
            />
          </div>

          <!-- 事由 -->
          <div>
            <label class="block text-xs sm:text-sm font-bold text-[#5a403e] mb-1.5 sm:mb-2">事由</label>
            <input
              v-model="editForm.occasion"
              type="text"
              class="w-full bg-[#f0eded] rounded-xl p-3 sm:p-4 text-base sm:text-lg font-bold text-[#1b1c1c] border-none focus:ring-2 focus:ring-[#bc2c2e] outline-none"
              placeholder="输入事由"
            />
          </div>

          <!-- 地址 -->
          <div>
            <label class="block text-xs sm:text-sm font-bold text-[#5a403e] mb-1.5 sm:mb-2">地址（选填）</label>
            <input
              v-model="editForm.address"
              type="text"
              class="w-full bg-[#f0eded] rounded-xl p-3 sm:p-4 text-base sm:text-lg font-bold text-[#1b1c1c] border-none focus:ring-2 focus:ring-[#bc2c2e] outline-none"
              placeholder="输入地址"
            />
          </div>

          <!-- 还礼状态 -->
          <div>
            <label class="block text-xs sm:text-sm font-bold text-[#5a403e] mb-1.5 sm:mb-2">我是否已还礼</label>
            <div class="flex bg-[#f0eded] p-1.5 sm:p-2 rounded-xl gap-1.5 sm:gap-2">
              <button
                @click="editForm.status = 'pending'"
                class="flex-1 py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base transition-all"
                :class="editForm.status === 'pending' ? 'bg-white text-[#990f19] shadow-sm' : 'text-[#5a403e]'"
              >
                未还礼
              </button>
              <button
                @click="editForm.status = 'returned'"
                class="flex-1 py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base transition-all"
                :class="editForm.status === 'returned' ? 'bg-white text-[#990f19] shadow-sm' : 'text-[#5a403e]'"
              >
                已还礼
              </button>
            </div>
          </div>
        </div>

        <div class="flex gap-3 sm:gap-4 mt-4 sm:mt-6">
          <button
            @click="cancelEdit"
            class="flex-1 h-12 sm:h-14 bg-[#f0eded] text-[#1b1c1c] font-bold rounded-xl text-sm sm:text-base"
          >
            取消
          </button>
          <button
            @click="saveEdit"
            :disabled="!editForm.amount || !editForm.name"
            class="flex-1 h-12 sm:h-14 bg-[#990f19] text-white font-bold rounded-xl disabled:opacity-50 text-sm sm:text-base"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
