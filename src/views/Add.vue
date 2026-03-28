<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { CalendarIcon, ChevronRight, Plus } from 'lucide-vue-next'
import { useCustomOccasionsStore } from '../stores/customOccasionsStore.js'
import { useRecordStore } from '../stores/recordStore.js'

const router = useRouter()
const recordStore = useRecordStore()

const customOccasionsStore = useCustomOccasionsStore()
const { occasionCategoriesWithCustom, addCustomOccasion } = customOccasionsStore

const amount = ref('')
const name = ref('')
const date = ref(new Date().toISOString().split('T')[0])
const occasion = ref('我结婚')
const occasionType = ref('red')
const status = ref('pending') // pending: 未还, returned: 已还
const address = ref('') // 地址（可选）
const selectedCategory = ref(null)
const customOccasionInput = ref('')
const showCustomInput = ref(false)

const setOccasion = (item, catType) => {
  occasion.value = item
  occasionType.value = catType
}

const selectCategory = (cat) => {
  selectedCategory.value = cat
  // 重置自定义输入状态
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

  // 添加到自定义事由列表
  addCustomOccasion(inputValue)

  // 选择该事由
  setOccasion(inputValue, 'other')

  // 重置并返回
  customOccasionInput.value = ''
  showCustomInput.value = false
  selectedCategory.value = null
}

const cancelCustomInput = () => {
  showCustomInput.value = false
  customOccasionInput.value = ''
}

const handleSave = () => {
  if (!amount.value || !name.value) return
  recordStore.addRecord({
    amount: parseFloat(amount.value),
    name: name.value,
    date: date.value,
    occasion: occasion.value,
    occasionType: occasionType.value,
    status: status.value,
    type: 'received', // 只保留收礼
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
  // 导航到记录页面
  router.push('/records')
}
</script>

<template>
  <div class="space-y-8">
    <!-- Amount -->
    <section class="space-y-3">
      <label class="block text-[#990f19] font-bold text-lg">金额 (元)</label>
      <div
        class="bg-[#f0eded] rounded-2xl p-6 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#bc2c2e] transition-all"
      >
        <input
          v-model="amount"
          type="number"
          placeholder="0.00"
          class="w-full bg-transparent border-none p-0 text-5xl font-black text-[#990f19] focus:ring-0 placeholder:text-[#e2bebb] outline-none"
        />
      </div>
    </section>

    <!-- Name -->
    <section class="space-y-3">
      <label class="block font-bold text-lg">姓名</label>
      <div
        class="bg-[#f0eded] rounded-2xl p-5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#bc2c2e] transition-all"
      >
        <input
          v-model="name"
          type="text"
          placeholder="输入送礼人姓名"
          class="w-full bg-transparent border-none p-0 text-xl font-bold focus:ring-0 placeholder:text-[#e2bebb] outline-none"
          maxlength="50"
          autocapitalize="words"
        />
      </div>
    </section>

    <!-- Date -->
    <section class="space-y-3">
      <label class="block font-bold text-lg">日期</label>
      <div class="bg-[#f0eded] rounded-2xl p-5 flex items-center justify-between relative">
        <input
          v-model="date"
          type="date"
          class="bg-transparent border-none p-0 text-xl font-bold focus:ring-0 w-full outline-none"
        />
        <CalendarIcon class="text-[#990f19] absolute right-5 pointer-events-none" :size="24" />
      </div>
    </section>

    <!-- Occasions -->
    <section class="space-y-4">
      <label class="block font-bold text-lg">事由</label>

      <!-- 显示当前选择 -->
      <div
        v-if="!selectedCategory"
        class="bg-[#990f19] text-white p-4 rounded-2xl shadow-lg mb-4"
      >
        <span class="text-sm opacity-80">当前选择：</span>
        <div class="text-xl font-black mt-1">{{ occasion }}</div>
      </div>

      <!-- 分类列表 -->
      <div v-if="!selectedCategory" class="space-y-3">
        <button
          v-for="cat in occasionCategoriesWithCustom"
          :key="cat.type"
          @click="selectCategory(cat)"
          class="w-full p-5 rounded-2xl bg-[#f0eded] hover:bg-[#e5e2e1] transition-all active:scale-95 flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: cat.color }"></span>
            <span class="text-lg font-bold text-[#1b1c1c]">{{ cat.label }}</span>
          </div>
          <ChevronRight class="text-[#5a403e]" :size="24" />
        </button>
      </div>

      <!-- 具体事由选择 -->
      <div v-else class="space-y-4">
        <button
          @click="backToCategories"
          class="flex items-center gap-2 text-[#990f19] font-bold"
        >
          <span class="text-xl">←</span> 返回分类
        </button>
        <h4
          class="font-bold text-lg flex items-center gap-2 p-4 bg-[#f0eded] rounded-xl"
          :style="{ color: selectedCategory.color }"
        >
          <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: selectedCategory.color }"></span>
          {{ selectedCategory.label }}
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="item in selectedCategory.items"
            :key="item"
            @click="confirmOccasion(item, selectedCategory.type)"
            class="p-4 rounded-2xl text-base font-bold transition-all active:scale-95 text-center"
            :class="
              occasion === item
                ? 'bg-[#990f19] text-white shadow-lg'
                : 'bg-[#f0eded] text-[#1b1c1c] hover:bg-[#e5e2e1]'
            "
          >
            {{ item }}
          </button>
        </div>

        <!-- 自定义事由输入（仅"其他"分类显示） -->
        <div v-if="selectedCategory.type === 'other'" class="pt-4 border-t border-[#e5e2e1]">
          <!-- 添加自定义事由按钮 -->
          <button
            v-if="!showCustomInput"
            @click="showCustomInput = true"
            class="w-full p-4 rounded-2xl border-2 border-dashed border-[#990f19] text-[#990f19] font-bold transition-all active:scale-95 flex items-center justify-center gap-2 hover:bg-[#ffdad7]/30"
          >
            <Plus :size="20" />
            添加自定义事由
          </button>

          <!-- 自定义事由输入框 -->
          <div v-else class="space-y-3">
            <input
              v-model="customOccasionInput"
              type="text"
              placeholder="输入自定义事由"
              class="w-full bg-[#f0eded] rounded-2xl p-4 text-lg font-bold text-[#1b1c1c] border-none focus:ring-2 focus:ring-[#bc2c2e] outline-none placeholder:text-[#8e706d]"
              @keyup.enter="addAndSelectCustomOccasion"
            />
            <div class="flex gap-2">
              <button
                @click="addAndSelectCustomOccasion"
                :disabled="!customOccasionInput.trim()"
                class="flex-1 py-3 rounded-xl bg-[#990f19] text-white font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                确认添加
              </button>
              <button
                @click="cancelCustomInput"
                class="flex-1 py-3 rounded-xl bg-[#f0eded] text-[#5a403e] font-bold transition-all active:scale-95"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Address (Optional) -->
    <section class="space-y-3">
      <label class="block font-bold text-lg">
        地址
        <span class="text-[#5a403e] font-normal text-base">(选填)</span>
      </label>
      <div
        class="bg-[#f0eded] rounded-2xl p-5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#bc2c2e] transition-all"
      >
        <input
          v-model="address"
          type="text"
          placeholder="输入地址信息"
          class="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 placeholder:text-[#e2bebb] outline-none"
          maxlength="100"
        />
      </div>
    </section>

    <!-- Status -->
    <section class="space-y-3">
      <label class="block font-bold text-lg">我是否已还礼</label>
      <div class="flex bg-[#f0eded] p-2 rounded-2xl gap-2">
        <button
          @click="status = 'pending'"
          class="flex-1 p-4 rounded-xl font-bold transition-all"
          :class="status === 'pending' ? 'bg-white text-[#990f19] shadow-sm' : 'text-[#5a403e]'"
        >
          未还礼
        </button>
        <button
          @click="status = 'returned'"
          class="flex-1 p-4 rounded-xl font-bold transition-all"
          :class="status === 'returned' ? 'bg-white text-[#990f19] shadow-sm' : 'text-[#5a403e]'"
        >
          已还礼
        </button>
      </div>
    </section>

    <!-- Save Button -->
    <div class="pt-6">
      <button
        @click="handleSave"
        :disabled="!amount || !name"
        class="w-full h-20 bg-[#990f19] hover:bg-[#bc2c2e] disabled:opacity-50 text-white text-2xl font-black rounded-2xl shadow-2xl transition-all active:scale-95"
      >
        保存记录
      </button>
    </div>
  </div>
</template>
