<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, SlidersHorizontal, X, Trash2, Edit } from 'lucide-vue-next'
import { useRecordStore } from '../stores/recordStore'
import { useCustomOccasionsStore } from '../stores/customOccasionsStore'

const router = useRouter()
const route = useRoute()
const props = defineProps({
  initialCategory: { type: String, default: null }
})

const recordStore = useRecordStore()
const customOccasionsStore = useCustomOccasionsStore()
const { occasionCategoriesWithCustom } = customOccasionsStore

const search = ref('')
const sortMode = ref('date')
const showFilterPanel = ref(false)

const filterCategory = ref(null)
const filterOccasion = ref(null)
const filterStatus = ref(null)

const showDeleteConfirm = ref(false)
const recordToDelete = ref(null)

const tmpCategory = ref(null)
const tmpOccasion = ref(null)
const tmpStatus = ref(null)

onMounted(() => {
  const category = props.initialCategory || route.query.category
  if (category) filterCategory.value = category
})

const allRecords = computed(() => recordStore.getAllRecords())

const subItemsForTmp = computed(() => {
  if (!tmpCategory.value) return []
  const cat = occasionCategoriesWithCustom.value.find(c => c.type === tmpCategory.value)
  return cat?.items || []
})

const filteredRecords = computed(() => {
  let result = allRecords.value

  if (search.value) {
    result = result.filter(r => r.name.includes(search.value) || r.occasion.includes(search.value))
  }
  if (filterOccasion.value) {
    result = result.filter(r => r.occasion === filterOccasion.value)
  } else if (filterCategory.value) {
    result = result.filter(r => r.occasionType === filterCategory.value)
  }
  if (filterStatus.value) {
    result = result.filter(r => r.status === filterStatus.value)
  }

  result = [...result].sort((a, b) => {
    if (sortMode.value === 'name') return a.name.localeCompare(b.name, 'zh')
    return new Date(b.date) - new Date(a.date)
  })

  return result
})

const hasActiveFilters = computed(() =>
  filterCategory.value || filterOccasion.value || filterStatus.value
)

const totalAmount = computed(() =>
  filteredRecords.value.reduce((s, r) => s + r.amount, 0)
)

const pendingAmount = computed(() =>
  filteredRecords.value.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)
)

const activeChips = computed(() => {
  const chips = []
  if (filterCategory.value) {
    const cat = occasionCategoriesWithCustom.value.find(c => c.type === filterCategory.value)
    chips.push({ key: 'category', label: cat?.label || filterCategory.value })
  }
  if (filterOccasion.value) chips.push({ key: 'occasion', label: filterOccasion.value })
  if (filterStatus.value) chips.push({ key: 'status', label: filterStatus.value === 'pending' ? '待还礼' : '已还礼' })
  return chips
})

const removeChip = (key) => {
  if (key === 'category') { filterCategory.value = null; filterOccasion.value = null }
  if (key === 'occasion') filterOccasion.value = null
  if (key === 'status') filterStatus.value = null
}

const openFilterPanel = () => {
  tmpCategory.value = filterCategory.value
  tmpOccasion.value = filterOccasion.value
  tmpStatus.value = filterStatus.value
  showFilterPanel.value = true
}

const applyFilter = () => {
  filterCategory.value = tmpCategory.value
  filterOccasion.value = tmpOccasion.value
  filterStatus.value = tmpStatus.value
  showFilterPanel.value = false
}

const resetFilter = () => {
  tmpCategory.value = null
  tmpOccasion.value = null
  tmpStatus.value = null
}

const clearAllFilters = () => {
  filterCategory.value = null
  filterOccasion.value = null
  filterStatus.value = null
}

const selectTmpCategory = (type) => {
  if (tmpCategory.value === type) { tmpCategory.value = null; tmpOccasion.value = null }
  else { tmpCategory.value = type; tmpOccasion.value = null }
}

const selectTmpOccasion = (item) => {
  tmpOccasion.value = tmpOccasion.value === item ? null : item
}

const setTmpStatus = (val) => { tmpStatus.value = tmpStatus.value === val ? null : val }

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

const confirmDelete = (record) => {
  recordToDelete.value = record
  showDeleteConfirm.value = true
}

const deleteRecord = () => {
  if (recordToDelete.value) {
    recordStore.deleteRecord(recordToDelete.value.id)
    showDeleteConfirm.value = false
    recordToDelete.value = null
  }
}

const goToDetail = (record) => {
  router.push(`/record/${record.id}`)
}
</script>

<template>
  <div class="space-y-6">

    <!-- 收礼汇总 -->
    <div class="grid grid-cols-2 gap-3 sm:gap-4">
      <div class="bg-[#990f19] p-4 sm:p-5 rounded-2xl text-white flex flex-col justify-between min-h-[100px] sm:h-28 shadow-lg">
        <span class="font-bold opacity-80 text-xs sm:text-sm">{{ hasActiveFilters ? '筛选收礼' : '累计收礼' }}</span>
        <span class="text-xl sm:text-2xl font-black">¥ {{ totalAmount.toLocaleString() }}</span>
      </div>
      <div class="bg-[#f0eded] p-4 sm:p-5 rounded-2xl text-[#1b1c1c] flex flex-col justify-between min-h-[100px] sm:h-28 border-l-4 sm:border-l-8 border-amber-500">
        <span class="font-bold text-[#5a403e] text-xs sm:text-sm">{{ hasActiveFilters ? '筛选待还' : '待还礼金' }}</span>
        <span class="text-xl sm:text-2xl font-black text-amber-600">¥ {{ pendingAmount.toLocaleString() }}</span>
      </div>
    </div>

    <!-- 搜索 + 筛选按钮 -->
    <div class="flex gap-2 sm:gap-3">
      <div class="relative flex-1">
        <Search class="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#5a403e]" :size="18" />
        <input
          v-model="search"
          type="text"
          placeholder="查人名"
          class="w-full h-12 sm:h-14 pl-10 sm:pl-12 pr-4 bg-[#f0eded] border-none rounded-2xl text-sm sm:text-base font-bold focus:ring-2 focus:ring-[#bc2c2e] transition-all outline-none"
        />
      </div>
      <button
        @click="openFilterPanel"
        class="h-12 sm:h-14 px-3 sm:px-4 rounded-2xl flex items-center gap-1 sm:gap-2 transition-all active:scale-95 font-bold text-xs sm:text-sm"
        :class="hasActiveFilters ? 'bg-[#ffdad7] text-[#990f19]' : 'bg-[#f0eded] text-[#5a403e]'"
      >
        <SlidersHorizontal :size="16" />
        <span class="hidden sm:inline">筛选</span>
        <span v-if="hasActiveFilters" class="w-2 h-2 bg-[#990f19] rounded-full"></span>
      </button>
    </div>

    <!-- 排序切换 -->
    <div class="flex gap-2">
      <button
        @click="sortMode = 'date'"
        class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95"
        :class="sortMode === 'date' ? 'bg-[#1b1c1c] text-white' : 'bg-[#f0eded] text-[#5a403e]'"
      >
        时间排序
      </button>
      <button
        @click="sortMode = 'name'"
        class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95"
        :class="sortMode === 'name' ? 'bg-[#1b1c1c] text-white' : 'bg-[#f0eded] text-[#5a403e]'"
      >
        名字排序
      </button>
    </div>

    <!-- 已选筛选chips -->
    <div v-if="activeChips.length > 0" class="flex flex-wrap gap-2 items-center">
      <div
        v-for="chip in activeChips"
        :key="chip.key"
        class="flex items-center gap-1 bg-[#ffdad7] text-[#990f19] rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold"
      >
        {{ chip.label }}
        <button @click="removeChip(chip.key)" class="ml-1 leading-none">
          <X :size="12" />
        </button>
      </div>
      <button @click="clearAllFilters" class="text-xs sm:text-sm text-[#5a403e] font-bold underline">
        清除全部
      </button>
    </div>

    <!-- 记录列表 -->
    <section class="space-y-3 sm:space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm sm:text-base font-bold text-[#5a403e] border-l-4 border-[#990f19] pl-3">记录列表</h3>
        <span class="text-xs sm:text-sm text-[#5a403e] font-bold">共 {{ filteredRecords.length }} 条</span>
      </div>

      <div class="space-y-3 sm:space-y-4">
        <div
          v-for="record in filteredRecords"
          :key="record.id"
          @click="goToDetail(record)"
          class="bg-white p-4 sm:p-5 rounded-2xl shadow-sm space-y-2 sm:space-y-3 active:scale-[0.98] transition-all cursor-pointer"
        >
          <!-- 人名 + 金额 -->
          <div class="flex justify-between items-start">
            <div class="min-w-0 flex-1 pr-2">
              <h4 class="text-lg sm:text-xl font-black truncate">{{ record.name }}</h4>
              <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                <span class="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-[#f0eded] text-[#5a403e]">
                  {{ occasionCategoriesWithCustom.find(c => c.type === record.occasionType)?.label || record.occasionType }}
                </span>
                <span class="text-xs sm:text-sm text-[#5a403e] font-bold">{{ record.occasion }}</span>
              </div>
              <!-- 地址信息 -->
              <div v-if="record.address" class="text-xs sm:text-sm text-[#5a403e] mt-1 truncate">
                📍 {{ record.address }}
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-xl sm:text-2xl font-black text-[#990f19]">+¥{{ record.amount.toLocaleString() }}</div>
              <span
                :class="[
                  'inline-block mt-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm font-bold',
                  record.status === 'returned'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-700',
                ]"
              >
                {{ record.status === 'returned' ? '已还礼' : '待还礼' }}
              </span>
            </div>
          </div>

          <!-- 日期 + 操作 -->
          <div class="flex justify-between items-center pt-2 border-t border-[#e5e2e1]/50">
            <span class="text-xs sm:text-sm text-[#5a403e] font-bold">{{ formatDate(record.date) }}</span>
            <div class="flex items-center gap-2 sm:gap-3">
              <button
                @click.stop="goToDetail(record)"
                class="flex items-center gap-1 text-[#990f19] font-bold px-1.5 sm:px-2 py-1 rounded-lg hover:bg-[#ffdad7]/30 transition-all text-xs sm:text-sm"
              >
                <Edit :size="16" />编辑
              </button>
              <button
                @click.stop="confirmDelete(record)"
                class="flex items-center gap-1 text-red-500 font-bold px-1.5 sm:px-2 py-1 rounded-lg hover:bg-red-50 transition-all text-xs sm:text-sm"
              >
                <Trash2 :size="16" />删除
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredRecords.length === 0" class="text-center py-12 text-[#5a403e]">
          没有找到匹配的记录
        </div>
      </div>
    </section>

    <!-- 筛选面板 -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showFilterPanel"
          class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          @click.self="showFilterPanel = false"
        >
          <div
            class="bg-[#fcf9f8] w-full max-w-2xl rounded-t-3xl p-4 sm:p-6 max-h-[80vh] overflow-y-auto space-y-4 sm:space-y-6"
            @click.stop
          >
            <div class="flex items-center justify-between">
              <h3 class="text-base sm:text-lg font-black text-[#990f19]">筛选条件</h3>
              <button @click="showFilterPanel = false" class="w-8 h-8 sm:w-9 sm:h-9 bg-[#f0eded] rounded-full flex items-center justify-center">
                <X :size="20" class="text-[#5a403e]" />
              </button>
            </div>

            <!-- 事由大类 -->
            <div class="space-y-2 sm:space-y-3">
              <div class="text-xs sm:text-sm font-bold text-[#5a403e]">事由大类</div>
              <div class="flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  v-for="cat in occasionCategoriesWithCustom"
                  :key="cat.type"
                  @click="selectTmpCategory(cat.type)"
                  class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95"
                  :class="tmpCategory === cat.type ? 'bg-[#990f19] text-white' : 'bg-[#f0eded] text-[#5a403e]'"
                >
                  {{ cat.label }}
                </button>
              </div>
              <!-- 事由明细级联 -->
              <div v-if="tmpCategory && subItemsForTmp.length > 0" class="pl-2 sm:pl-3 border-l-2 border-[#fca5a5] flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                <button
                  v-for="item in subItemsForTmp"
                  :key="item"
                  @click="selectTmpOccasion(item)"
                  class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95"
                  :class="tmpOccasion === item ? 'bg-[#990f19] text-white' : 'bg-[#ffdad7] text-[#990f19]'"
                >
                  {{ item }}
                </button>
              </div>
            </div>

            <div class="h-px bg-[#e5e2e1]"></div>

            <!-- 还礼状态 -->
            <div class="space-y-2 sm:space-y-3">
              <div class="text-xs sm:text-sm font-bold text-[#5a403e]">还礼状态</div>
              <div class="flex gap-2">
                <button
                  v-for="opt in [{ val: 'pending', label: '待还礼' }, { val: 'returned', label: '已还礼' }]"
                  :key="opt.val"
                  @click="setTmpStatus(opt.val)"
                  class="flex-1 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95"
                  :class="tmpStatus === opt.val ? 'bg-[#990f19] text-white' : 'bg-[#f0eded] text-[#5a403e]'"
                >
                  {{ opt.label }}
                </button>
                <button
                  @click="tmpStatus = null"
                  class="flex-1 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95"
                  :class="tmpStatus === null ? 'bg-[#990f19] text-white' : 'bg-[#f0eded] text-[#5a403e]'"
                >
                  全部
                </button>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-2 sm:gap-3 pt-2">
              <button
                @click="resetFilter"
                class="flex-1 h-12 sm:h-14 bg-[#f0eded] text-[#1b1c1c] font-bold rounded-xl transition-all active:scale-95 text-sm sm:text-base"
              >
                重置
              </button>
              <button
                @click="applyFilter"
                class="flex-[2] h-12 sm:h-14 bg-[#990f19] text-white font-bold rounded-xl transition-all active:scale-95 text-sm sm:text-base"
              >
                确定（{{ filteredRecords.length }} 条）
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self="showDeleteConfirm = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-sm p-5 sm:p-6 space-y-4 sm:space-y-6">
          <div class="text-center">
            <div class="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Trash2 class="text-red-500" :size="24" />
              <Trash2 class="text-red-500 hidden sm:block" :size="32" />
            </div>
            <h3 class="text-lg sm:text-xl font-black mb-2">确认删除?</h3>
            <p class="text-sm sm:text-base text-[#5a403e]">
              删除 {{ recordToDelete?.name }} 的<br/>
              <span class="text-[#990f19] font-bold">{{ recordToDelete?.occasion }}</span>
              收礼记录<br/>
              金额: <span class="font-bold">¥{{ recordToDelete?.amount?.toLocaleString() }}</span>
            </p>
          </div>
          <div class="flex gap-2 sm:gap-3">
            <button
              @click="showDeleteConfirm = false"
              class="flex-1 h-12 sm:h-14 bg-[#f0eded] text-[#1b1c1c] font-bold rounded-xl transition-all active:scale-95 text-sm sm:text-base"
            >
              取消
            </button>
            <button
              @click="deleteRecord"
              class="flex-1 h-12 sm:h-14 bg-red-500 text-white font-bold rounded-xl transition-all active:scale-95 text-sm sm:text-base"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
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
