<script setup>
import { ref, computed } from 'vue'
import { PlusCircle, Share2, Wallet, ChevronRight, X, CalendarIcon } from 'lucide-vue-next'
import { useRecordStore } from '../stores/recordStore'
import { useCustomOccasionsStore } from '../stores/customOccasionsStore'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import * as XLSX from 'xlsx'

const recordStore = useRecordStore()
const customOccasionsStore = useCustomOccasionsStore()
const { occasionCategoriesWithCustom, addCustomOccasion } = customOccasionsStore

const showAddForm = ref(false)

// 表单数据
const amount = ref('')
const name = ref('')
const date = ref(new Date().toISOString().split('T')[0])
const occasion = ref('我结婚')
const occasionType = ref('red')
const status = ref('pending')
const address = ref('')
const selectedCategory = ref(null)
const customOccasionInput = ref('')
const showCustomInput = ref(false)

// 使用 computed 响应式计算统计数据
const totalReceived = computed(() => {
  return recordStore.records.value
    .filter((r) => r.type === 'received')
    .reduce((sum, r) => sum + r.amount, 0)
})

const pendingAmount = computed(() => {
  return recordStore.records.value
    .filter((r) => r.type === 'received' && r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0)
})

const recordCount = computed(() => recordStore.records.value.length)

const exportData = async () => {
  const records = recordStore.records.value
  if (records.length === 0) {
    alert('暂无记录可导出')
    return
  }

  const data = records.map(r => ({
    '姓名': r.name,
    '金额': r.amount,
    '事由': r.occasion,
    '事由分类': r.occasionType === 'red' ? '红喜事' : r.occasionType === 'white' ? '白喜事' : r.occasionType === 'birthday' ? '祝寿' : '其它',
    '日期': r.date,
    '地址': r.address || '',
    '还礼状态': r.status === 'returned' ? '已还礼' : '待还礼'
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)

  ws['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 10 },
    { wch: 12 },
    { wch: 20 },
    { wch: 10 }
  ]

  XLSX.utils.book_append_sheet(wb, ws, '礼金记录')

  // 文件名：极简账本数据备份+日期
  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  const filename = `极简账本数据备份${dateStr}.xlsx`

  try {
    // 生成 Excel 文件的 base64
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })

    // 使用 Capacitor Filesystem 保存文件
    const result = await Filesystem.writeFile({
      path: filename,
      data: wbout,
      directory: Directory.Cache,
    })

    // 使用 Capacitor Share 分享文件
    await Share.share({
      title: '导出礼金记录',
      text: '礼金账本数据备份',
      url: result.uri,
      dialogTitle: '导出礼金记录',
    })
  } catch (e) {
    console.error('导出失败:', e)
    // 如果分享失败，尝试备用方案
    try {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      downloadBlob(blob, filename)
    } catch (e2) {
      console.error('备用导出也失败:', e2)
      alert('导出失败，请重试')
    }
  }
}

// 备用下载方法（用于 Web 环境）
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 事由选择
const setOccasion = (item, catType) => {
  occasion.value = item
  occasionType.value = catType
}

const selectCategory = (cat) => {
  selectedCategory.value = cat
  showCustomInput.value = false
  customOccasionInput.value = ''
}

const backToCategories = () => {
  selectedCategory.value = null
  showCustomInput.value = false
  customOccasionInput.value = ''
}

const confirmOccasion = (item, catType) => {
  setOccasion(item, catType)
  selectedCategory.value = null
  showCustomInput.value = false
  customOccasionInput.value = ''
}

const addAndSelectCustomOccasion = () => {
  const inputValue = customOccasionInput.value.trim()
  if (!inputValue) return

  addCustomOccasion(inputValue)
  setOccasion(inputValue, 'other')

  customOccasionInput.value = ''
  showCustomInput.value = false
  selectedCategory.value = null
}

const cancelCustomInput = () => {
  showCustomInput.value = false
  customOccasionInput.value = ''
}

// 保存记录
const handleSave = () => {
  if (!amount.value || !name.value) return

  recordStore.addRecord({
    amount: parseFloat(amount.value),
    name: name.value,
    date: date.value,
    occasion: occasion.value,
    occasionType: occasionType.value,
    status: status.value,
    type: 'received',
    address: address.value.trim() || undefined,
  })

  // 重置表单
  amount.value = ''
  name.value = ''
  date.value = new Date().toISOString().split('T')[0]
  occasion.value = '我结婚'
  occasionType.value = 'red'
  status.value = 'pending'
  address.value = ''
  selectedCategory.value = null
  showCustomInput.value = false
  customOccasionInput.value = ''

  // 关闭表单
  showAddForm.value = false
}

// 打开添加表单
const openAddForm = () => {
  showAddForm.value = true
}

// 关闭添加表单
const closeAddForm = () => {
  showAddForm.value = false
  selectedCategory.value = null
  showCustomInput.value = false
  customOccasionInput.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <!-- 收礼总额卡片 -->
    <div class="w-full p-6 sm:p-8 rounded-2xl text-center bg-[#990f19]">
      <div class="flex items-center justify-center gap-2 mb-2 text-white/80">
        <Wallet :size="24" />
        <span class="font-bold text-base sm:text-lg">累计收礼</span>
      </div>
      <div class="text-4xl sm:text-5xl font-black text-white">
        <span class="text-2xl sm:text-3xl align-top">¥</span>
        {{ totalReceived.toLocaleString() }}
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 gap-3 sm:gap-4">
      <div class="bg-[#f0eded] p-4 sm:p-5 rounded-2xl flex flex-col justify-between min-h-[80px] sm:min-h-[100px]">
        <div class="flex items-center gap-2 text-[#5a403e]">
          <Wallet :size="18" />
          <span class="font-bold text-xs sm:text-sm">待还礼金</span>
        </div>
        <div class="text-lg sm:text-xl font-black truncate text-amber-600">¥ {{ pendingAmount.toLocaleString() }}</div>
      </div>
      <div class="bg-[#f0eded] p-4 sm:p-5 rounded-2xl flex flex-col justify-between min-h-[80px] sm:min-h-[100px]">
        <div class="flex items-center gap-2 text-[#5a403e]">
          <span class="font-bold text-xs sm:text-sm">记录条数</span>
        </div>
        <div class="text-lg sm:text-xl font-black truncate text-[#1b1c1c]">{{ recordCount }} 条</div>
      </div>
    </div>

    <!-- Actions -->
    <div class="space-y-3 sm:space-y-4">
      <button
        @click="openAddForm"
        class="w-full h-16 sm:h-20 bg-[#990f19] hover:bg-[#bc2c2e] text-white text-lg sm:text-xl font-black flex items-center justify-center gap-2 sm:gap-3 rounded-2xl shadow-xl transition-all active:scale-95"
      >
        <PlusCircle :size="26" />
        一键记账
      </button>
      <button
        @click="exportData"
        class="w-full h-14 sm:h-16 bg-[#f0eded] hover:bg-[#eae7e7] text-[#1b1c1c] text-base sm:text-lg font-bold flex items-center justify-center gap-2 rounded-2xl transition-all active:scale-95"
      >
        <Share2 :size="20" />
        导出数据
      </button>
    </div>

    <!-- Tips & Info -->
    <div class="space-y-3 sm:space-y-4">
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-3 sm:p-4">
        <p class="text-amber-800 font-bold text-xs sm:text-sm mb-1">📝 温馨提示</p>
        <p class="text-amber-700 text-xs sm:text-sm">请定期导出账本备份，防止数据丢失。</p>
      </div>
      <div class="text-center text-[#5a403e] text-xs sm:text-sm space-y-1">
        <p>作者：沅·Luminous</p>
        <p>版本号：v1.1.0</p>
      </div>
    </div>

    <!-- Add Record Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAddForm"
          class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          @click.self="closeAddForm"
        >
          <div
            class="bg-[#fcf9f8] w-full max-w-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto"
            @click.stop
          >
            <!-- Modal Header -->
            <div class="sticky top-0 bg-[#fcf9f8] px-4 sm:px-6 py-3 sm:py-4 border-b border-[#e5e2e1] flex items-center justify-between">
              <h2 class="text-lg sm:text-xl font-black text-[#990f19]">添加记录</h2>
              <button
                @click="closeAddForm"
                class="w-9 h-9 sm:w-10 sm:h-10 bg-[#f0eded] rounded-full flex items-center justify-center"
              >
                <X :size="22" class="text-[#5a403e]" />
              </button>
            </div>

            <!-- Form Content -->
            <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <!-- Amount -->
              <div class="space-y-2 sm:space-y-3">
                <label class="block text-[#990f19] font-bold text-base sm:text-lg">金额 (元)</label>
                <div class="bg-[#f0eded] rounded-2xl p-4 sm:p-5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#bc2c2e] transition-all">
                  <input
                    v-model="amount"
                    type="number"
                    placeholder="0.00"
                    class="w-full bg-transparent border-none p-0 text-3xl sm:text-4xl font-black text-[#990f19] focus:ring-0 placeholder:text-[#e2bebb] outline-none"
                  />
                </div>
              </div>

              <!-- Name -->
              <div class="space-y-2 sm:space-y-3">
                <label class="block font-bold text-base sm:text-lg">姓名</label>
                <div class="bg-[#f0eded] rounded-2xl p-3 sm:p-4 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#bc2c2e] transition-all">
                  <input
                    v-model="name"
                    type="text"
                    placeholder="输入送礼人姓名"
                    class="w-full bg-transparent border-none p-0 text-base sm:text-lg font-bold focus:ring-0 placeholder:text-[#e2bebb] outline-none"
                    maxlength="50"
                  />
                </div>
              </div>

              <!-- Date -->
              <div class="space-y-2 sm:space-y-3">
                <label class="block font-bold text-base sm:text-lg">日期</label>
                <div class="bg-[#f0eded] rounded-2xl p-3 sm:p-4 flex items-center justify-between relative">
                  <input
                    v-model="date"
                    type="date"
                    class="bg-transparent border-none p-0 text-base sm:text-lg font-bold focus:ring-0 w-full outline-none"
                  />
                  <CalendarIcon class="text-[#990f19] absolute right-3 sm:right-4 pointer-events-none" :size="18" />
                </div>
              </div>

              <!-- Occasion -->
              <div class="space-y-2 sm:space-y-3">
                <label class="block font-bold text-base sm:text-lg">事由</label>

                <!-- 显示当前选择 -->
                <div
                  v-if="!selectedCategory"
                  class="bg-[#990f19] text-white p-2.5 sm:p-3 rounded-xl shadow"
                >
                  <span class="text-xs sm:text-sm opacity-80">当前选择：</span>
                  <span class="font-black ml-1 sm:ml-2 text-sm sm:text-base">{{ occasion }}</span>
                </div>

                <!-- 分类列表 -->
                <div v-if="!selectedCategory" class="space-y-2">
                  <button
                    v-for="cat in occasionCategoriesWithCustom"
                    :key="cat.type"
                    @click="selectCategory(cat)"
                    class="w-full p-3 sm:p-4 rounded-xl bg-[#f0eded] hover:bg-[#e5e2e1] transition-all active:scale-95 flex items-center justify-between"
                  >
                    <div class="flex items-center gap-2 sm:gap-3">
                      <span class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" :style="{ backgroundColor: cat.color }"></span>
                      <span class="font-bold text-sm sm:text-base">{{ cat.label }}</span>
                    </div>
                    <ChevronRight class="text-[#5a403e]" :size="18" />
                  </button>
                </div>

                <!-- 具体事由选择 -->
                <div v-else class="space-y-2 sm:space-y-3">
                  <button
                    @click="backToCategories"
                    class="flex items-center gap-2 text-[#990f19] font-bold text-xs sm:text-sm"
                  >
                    <span>←</span> 返回分类
                  </button>
                  <div class="font-bold flex items-center gap-2 p-2.5 sm:p-3 bg-[#f0eded] rounded-lg text-sm sm:text-base" :style="{ color: selectedCategory.color }">
                    <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: selectedCategory.color }"></span>
                    {{ selectedCategory.label }}
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="item in selectedCategory.items"
                      :key="item"
                      @click="confirmOccasion(item, selectedCategory.type)"
                      class="p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95"
                      :class="occasion === item ? 'bg-[#990f19] text-white shadow' : 'bg-[#f0eded] hover:bg-[#e5e2e1]'"
                    >
                      {{ item }}
                    </button>
                  </div>

                  <!-- 自定义事由 -->
                  <div v-if="selectedCategory.type === 'other'" class="pt-2 sm:pt-3 border-t border-[#e5e2e1]">
                    <button
                      v-if="!showCustomInput"
                      @click="showCustomInput = true"
                      class="w-full p-2.5 sm:p-3 rounded-xl border-2 border-dashed border-[#990f19] text-[#990f19] font-bold text-xs sm:text-sm"
                    >
                      + 添加自定义事由
                    </button>
                    <div v-else class="space-y-2">
                      <input
                        v-model="customOccasionInput"
                        type="text"
                        placeholder="输入自定义事由"
                        class="w-full bg-[#f0eded] rounded-xl p-2.5 sm:p-3 font-bold text-sm sm:text-base border-none focus:ring-2 focus:ring-[#bc2c2e] outline-none"
                        @keyup.enter="addAndSelectCustomOccasion"
                      />
                      <div class="flex gap-2">
                        <button
                          @click="addAndSelectCustomOccasion"
                          :disabled="!customOccasionInput.trim()"
                          class="flex-1 py-2 rounded-lg bg-[#990f19] text-white font-bold text-sm disabled:opacity-50"
                        >
                          确认
                        </button>
                        <button
                          @click="cancelCustomInput"
                          class="flex-1 py-2 rounded-lg bg-[#f0eded] font-bold text-sm"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Address -->
              <div class="space-y-2 sm:space-y-3">
                <label class="block font-bold text-base sm:text-lg">
                  地址
                  <span class="text-[#5a403e] font-normal text-sm sm:text-base">(选填)</span>
                </label>
                <div class="bg-[#f0eded] rounded-2xl p-3 sm:p-4 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#bc2c2e] transition-all">
                  <input
                    v-model="address"
                    type="text"
                    placeholder="输入地址信息"
                    class="w-full bg-transparent border-none p-0 text-sm sm:text-base font-bold focus:ring-0 placeholder:text-[#e2bebb] outline-none"
                    maxlength="100"
                  />
                </div>
              </div>

              <!-- Status -->
              <div class="space-y-2 sm:space-y-3">
                <label class="block font-bold text-base sm:text-lg">我是否已还礼</label>
                <div class="flex bg-[#f0eded] p-1.5 sm:p-2 rounded-2xl gap-1.5 sm:gap-2">
                  <button
                    @click="status = 'pending'"
                    class="flex-1 p-2.5 sm:p-3 rounded-xl font-bold text-sm sm:text-base transition-all"
                    :class="status === 'pending' ? 'bg-white text-[#990f19] shadow-sm' : 'text-[#5a403e]'"
                  >
                    未还礼
                  </button>
                  <button
                    @click="status = 'returned'"
                    class="flex-1 p-2.5 sm:p-3 rounded-xl font-bold text-sm sm:text-base transition-all"
                    :class="status === 'returned' ? 'bg-white text-[#990f19] shadow-sm' : 'text-[#5a403e]'"
                  >
                    已还礼
                  </button>
                </div>
              </div>

              <!-- Save Button -->
              <button
                @click="handleSave"
                :disabled="!amount || !name"
                class="w-full h-14 sm:h-16 bg-[#990f19] hover:bg-[#bc2c2e] disabled:opacity-50 text-white text-lg sm:text-xl font-black rounded-2xl shadow transition-all active:scale-95"
              >
                保存记录
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div,
.modal-leave-to > div {
  transform: translateY(100%);
}
</style>
