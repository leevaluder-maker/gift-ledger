<script setup>
import { ref } from 'vue'
import { FileSpreadsheet, Upload, X, Loader2, AlertCircle, CheckCircle, Download } from 'lucide-vue-next'
import { useRecordStore } from '../stores/recordStore'
import { useCustomOccasionsStore } from '../stores/customOccasionsStore'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import * as XLSX from 'xlsx'

const emit = defineEmits(['close', 'imported'])
const recordStore = useRecordStore()
const customOccasionsStore = useCustomOccasionsStore()
const { occasionCategoriesWithCustom } = customOccasionsStore

const inputText = ref('')
const isLoading = ref(false)
const error = ref('')
const success = ref('')
const parsedRecords = ref([])
const fileInput = ref(null)

// 下载模板
const downloadTemplate = async () => {
  // 创建模板数据（与导出格式一致）
  const templateData = [
    ['姓名', '金额', '事由', '事由分类', '日期', '地址', '还礼状态'],
    ['张三', 500, '结婚', '红喜事', '2024-01-15', '幸福小区8栋', '待还礼'],
    ['李四', 1000, '满月酒', '红喜事', '2024-02-20', '', '已还礼'],
    ['王五', 800, '六十大寿', '祝寿', '2024-03-10', '阳光花园', '待还礼'],
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(templateData)

  // 设置列宽
  ws['!cols'] = [
    { wch: 12 },  // 姓名
    { wch: 10 },  // 金额
    { wch: 15 },  // 事由
    { wch: 10 },  // 事由分类
    { wch: 12 },  // 日期
    { wch: 20 },  // 地址
    { wch: 10 },  // 还礼状态
  ]

  XLSX.utils.book_append_sheet(wb, ws, '礼金记录模板')

  const filename = '礼金账本导入模板.xlsx'

  // 检测是否在 Capacitor 原生环境中运行
  const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()

  if (isNative) {
    // 移动端：先保存文件，再调用分享
    try {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
      const result = await Filesystem.writeFile({
        path: filename,
        data: wbout,
        directory: Directory.Cache,  // 使用 Cache 目录，分享后可以清理
      })

      // 调用系统分享，让用户选择保存位置
      await Share.share({
        title: '导入模板',
        text: '礼金账本导入模板',
        url: result.uri,
        dialogTitle: '保存模板',
      })
    } catch (e) {
      console.error('分享模板失败:', e)
      // 如果分享失败，尝试直接保存到 Documents
      try {
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
        await Filesystem.writeFile({
          path: filename,
          data: wbout,
          directory: Directory.Documents,
        })
        alert(`模板已保存到：Documents/${filename}`)
      } catch (e2) {
        console.error('保存模板失败:', e2)
        alert('下载模板失败，请重试')
      }
    }
  } else {
    // Web 浏览器：使用 Blob 下载
    try {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('下载模板失败:', e)
      alert('下载模板失败，请重试')
    }
  }
}

// 处理Excel文件上传
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  error.value = ''
  success.value = ''
  isLoading.value = true

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

      // 解析 Excel 数据
      const records = []
      let headerFound = false
      let headerMap = {}

      jsonData.forEach((row, index) => {
        // 跳过空行
        if (!row || row.length === 0 || row.every(cell => cell === undefined || cell === '')) return

        // 尝试识别表头行
        const rowStr = row.join('').toLowerCase()
        if (rowStr.includes('姓名') || rowStr.includes('金额') || rowStr.includes('事由')) {
          headerFound = true
          // 建立列名映射
          row.forEach((cell, colIndex) => {
            const cellStr = String(cell || '').trim()
            if (cellStr.includes('姓名')) headerMap.name = colIndex
            else if (cellStr.includes('金额')) headerMap.amount = colIndex
            else if (cellStr.includes('事由') && !cellStr.includes('分类')) headerMap.occasion = colIndex
            else if (cellStr.includes('分类') || cellStr.includes('事由分类')) headerMap.occasionType = colIndex
            else if (cellStr.includes('日期')) headerMap.date = colIndex
            else if (cellStr.includes('地址')) headerMap.address = colIndex
            else if (cellStr.includes('还礼') || cellStr.includes('状态')) headerMap.status = colIndex
          })
          return
        }

        // 如果还没找到表头，尝试智能解析
        if (!headerFound && row.length >= 2) {
          // 假设格式：姓名、金额、事由、日期...
          const record = parseRowToObject(row, {})
          if (record && record.name && record.amount) {
            records.push(record)
          }
          return
        }

        // 有表头的情况，按映射解析
        if (headerFound) {
          const record = parseRowToObject(row, headerMap)
          if (record && record.name && record.amount) {
            records.push(record)
          }
        }
      })

      if (records.length === 0) {
        error.value = '未能识别到有效记录，请检查 Excel 格式'
      } else {
        parsedRecords.value = records
        success.value = `成功识别 ${records.length} 条记录`
      }
      isLoading.value = false
    } catch (e) {
      console.error('Excel解析错误:', e)
      error.value = '读取 Excel 文件失败: ' + e.message
      isLoading.value = false
    }
  }
  reader.readAsArrayBuffer(file)
  event.target.value = ''
}

// 将行数据解析为记录对象
const parseRowToObject = (row, headerMap) => {
  const getCell = (key) => {
    if (headerMap[key] !== undefined) return row[headerMap[key]]
    return undefined
  }

  // 智能解析
  let name = getCell('name')
  let amount = getCell('amount')
  let occasion = getCell('occasion')
  let occasionTypeRaw = getCell('occasionType')  // 从表格读取事由分类
  let dateRaw = getCell('date')
  let address = getCell('address')
  let status = getCell('status')

  // 如果没有表头映射，尝试按位置解析
  if (!name && row[0]) name = String(row[0]).trim()
  if (!amount && row[1]) {
    const num = parseFloat(String(row[1]).replace(/[^\d.-]/g, ''))
    if (!isNaN(num)) amount = num
  }
  if (!occasion && row[2]) occasion = String(row[2]).trim()

  // 解析日期 - 无论从表头映射还是位置获取，都要经过 parseDate 处理
  let date = null
  if (dateRaw !== undefined) {
    date = parseDate(dateRaw)
  }
  if (!date && row[3]) {
    date = parseDate(row[3])
  }

  // 验证必填字段
  if (!name || amount === undefined || amount === null) return null

  // 处理日期
  if (!date) {
    date = new Date().toISOString().split('T')[0]
  }

  // 处理事由和分类
  let matchedOccasion = occasion || '其他'
  let matchedType = 'other'

  // 如果表格中有事由分类，优先使用
  if (occasionTypeRaw) {
    const typeStr = String(occasionTypeRaw).trim()
    // 匹配分类类型
    if (typeStr.includes('红') || typeStr.toLowerCase().includes('red')) {
      matchedType = 'red'
    } else if (typeStr.includes('白') || typeStr.toLowerCase().includes('white')) {
      matchedType = 'white'
    } else if (typeStr.includes('寿') || typeStr.includes('生日') || typeStr.toLowerCase().includes('birthday')) {
      matchedType = 'birthday'
    } else if (typeStr.includes('其他') || typeStr.toLowerCase().includes('other')) {
      matchedType = 'other'
    }
  } else {
    // 如果表格中没有事由分类，根据事由自动匹配
    const matchResult = matchOccasion(occasion || '')
    matchedOccasion = matchResult.matchedOccasion
    matchedType = matchResult.matchedType
  }

  // 处理状态
  let statusValue = 'pending'
  if (status) {
    const statusStr = String(status).trim()
    if (statusStr.includes('已') || statusStr.toLowerCase() === 'returned') {
      statusValue = 'returned'
    }
  }

  return {
    name: String(name).trim(),
    amount: parseFloat(amount),
    date: date,
    occasion: matchedOccasion,
    occasionType: matchedType,
    status: statusValue,
    type: 'received',
    address: address ? String(address).trim() : undefined
  }
}

// 解析日期
const parseDate = (value) => {
  if (!value) return null

  // 如果是 Excel 日期数字（序列号）
  if (typeof value === 'number') {
    // Excel 日期序列号：1 = 1900-01-01（但有 bug，将 1900 当作闰年）
    // 所以 1899-12-30 是正确的起始点
    const excelEpoch = new Date(1899, 11, 30)
    const date = new Date(excelEpoch.getTime() + value * 86400000)
    // 使用本地日期而不是 ISO 日期，避免时区问题
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 尝试解析字符串日期
  const dateStr = String(value).trim()

  // 尝试各种格式
  const formats = [
    /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/,  // 2024-01-15, 2024/01/15, 2024.01.15
    /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/,  // 01-15-2024, 1/15/2024, 1.15.2024
    /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/,     // 2024年1月15日
    /^(\d{1,2})月(\d{1,2})[日号]?$/,           // 1月15日（默认当年）
  ]

  for (let i = 0; i < formats.length; i++) {
    const format = formats[i]
    const match = dateStr.match(format)
    if (match) {
      let year, month, day
      if (i === 0) {
        year = match[1]; month = match[2]; day = match[3]
      } else if (i === 1) {
        month = match[1]; day = match[2]; year = match[3]
      } else if (i === 2) {
        year = match[1]; month = match[2]; day = match[3]
      } else if (i === 3) {
        // 只有月日，使用当前年份
        year = new Date().getFullYear()
        month = match[1]; day = match[2]
      }
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  // 尝试直接解析 - 使用本地日期避免时区偏移
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear()
    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const day = String(parsed.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return null
}

// 匹配事由
const matchOccasion = (input) => {
  if (!input) return { matchedOccasion: '其他', matchedType: 'other' }

  const inputLower = input.toLowerCase()

  // 遍历所有事由分类
  for (const category of occasionCategoriesWithCustom.value) {
    for (const item of category.items) {
      if (inputLower.includes(item.toLowerCase()) || item.toLowerCase().includes(inputLower)) {
        return { matchedOccasion: item, matchedType: category.type }
      }
    }
  }

  // 关键词匹配
  const keywords = {
    red: ['结婚', '婚', '满月', '百日', '升学', '乔迁', '开业', '订婚', '婚礼'],
    white: ['丧', '白事', '去世', '离世'],
    birthday: ['寿', '生日', '大寿', '祝寿']
  }

  for (const [type, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (inputLower.includes(word)) {
        return { matchedOccasion: input, matchedType: type }
      }
    }
  }

  return { matchedOccasion: input, matchedType: 'other' }
}

// 保存记录
const saveRecords = () => {
  let savedCount = 0
  parsedRecords.value.forEach(record => {
    try {
      recordStore.addRecord(record)
      savedCount++
    } catch (e) {
      console.error('保存记录失败:', e)
    }
  })

  emit('imported', savedCount)
  emit('close')
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

const getStatusText = (status) => status === 'returned' ? '已还' : '未还'
const getOccasionTypeText = (type) => {
  const map = { red: '红喜事', white: '白喜事', birthday: '祝寿', other: '其他' }
  return map[type] || type
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
    <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="p-4 sm:p-6 border-b border-[#e5e2e1] flex items-center justify-between">
        <div class="flex items-center gap-2 sm:gap-3">
          <div class="p-1.5 sm:p-2 bg-[#ffdad7] rounded-xl">
            <FileSpreadsheet class="text-[#990f19]" :size="20" />
            <FileSpreadsheet class="text-[#990f19] hidden sm:block" :size="24" />
          </div>
          <div>
            <h3 class="text-lg sm:text-xl font-black">Excel 导入</h3>
            <p class="text-xs sm:text-sm text-[#5a403e]">批量导入礼金记录</p>
          </div>
        </div>
        <button @click="$emit('close')" class="text-[#5a403e] hover:text-[#990f19]">
          <X :size="22" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
        <!-- Download Template -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
          <div class="flex items-start gap-2 sm:gap-3">
            <div class="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Download class="text-blue-600" :size="18" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-blue-800 text-sm sm:text-base">下载导入模板</p>
              <p class="text-xs sm:text-sm text-blue-600 mt-0.5">模板格式与导出一致，填写后可直接导入</p>
            </div>
            <button
              @click="downloadTemplate"
              class="flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-lg active:scale-95 transition-transform"
            >
              下载
            </button>
          </div>
        </div>

        <!-- Upload Area -->
        <div
          v-if="!inputText && parsedRecords.length === 0"
          class="border-2 border-dashed border-[#e5e2e1] rounded-2xl p-6 sm:p-8 text-center space-y-3 sm:space-y-4 hover:border-[#990f19] transition-colors cursor-pointer"
          @click="fileInput?.click()"
        >
          <div class="w-12 h-12 sm:w-16 sm:h-16 bg-[#f0eded] rounded-full flex items-center justify-center mx-auto">
            <Upload class="text-[#990f19]" :size="28" />
          </div>
          <div>
            <p class="font-bold text-base sm:text-lg">点击上传 Excel 文件</p>
            <p class="text-xs sm:text-sm text-[#5a403e] mt-1">支持 .xlsx, .xls 格式</p>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls"
            class="hidden"
            @change="handleFileUpload"
          />
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="text-center py-8 sm:py-12">
          <Loader2 class="animate-spin mx-auto text-[#990f19]" :size="32" />
          <p class="mt-3 sm:mt-4 text-[#5a403e] font-bold">正在解析 Excel...</p>
        </div>

        <!-- Error -->
        <div v-if="error" class="flex items-center gap-2 text-red-600 text-xs sm:text-sm bg-red-50 p-2.5 sm:p-3 rounded-xl">
          <AlertCircle :size="16" />
          {{ error }}
        </div>

        <!-- Results Preview -->
        <div v-if="parsedRecords.length > 0" class="space-y-3 sm:space-y-4">
          <div class="flex items-center gap-2 text-green-600 bg-green-50 p-2.5 sm:p-3 rounded-xl">
            <CheckCircle :size="18" />
            <span class="font-bold text-sm sm:text-base">{{ success }}</span>
          </div>

          <div class="space-y-2 sm:space-y-3 max-h-48 sm:max-h-60 overflow-y-auto">
            <div
              v-for="(record, index) in parsedRecords"
              :key="index"
              class="bg-[#f0eded] p-3 sm:p-4 rounded-xl"
            >
              <div class="flex justify-between items-start">
                <div class="space-y-0.5 sm:space-y-1 min-w-0 flex-1 pr-2">
                  <div class="font-black text-sm sm:text-base truncate">{{ record.name }}</div>
                  <div class="text-xs sm:text-sm text-[#5a403e]">
                    {{ record.occasion }} · {{ getOccasionTypeText(record.occasionType) }}
                  </div>
                  <div class="text-xs sm:text-sm text-[#5a403e]">{{ formatDate(record.date) }}</div>
                  <div v-if="record.address" class="text-xs sm:text-sm text-[#5a403e] truncate">
                    📍 {{ record.address }}
                  </div>
                </div>
                <div class="text-right space-y-0.5 sm:space-y-1 flex-shrink-0">
                  <div class="text-lg sm:text-xl font-black text-[#990f19]">
                    +¥{{ record.amount.toLocaleString() }}
                  </div>
                  <div class="text-[10px] sm:text-xs text-[#5a403e]">
                    {{ getStatusText(record.status) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <button
              @click="parsedRecords = []; success = ''; inputText = ''"
              class="flex-1 h-12 sm:h-14 bg-[#f0eded] text-[#1b1c1c] font-bold rounded-2xl transition-all active:scale-95 text-sm sm:text-base"
            >
              重新选择
            </button>
            <button
              @click="saveRecords"
              class="flex-1 h-12 sm:h-14 bg-[#990f19] text-white font-bold rounded-2xl transition-all active:scale-95 text-sm sm:text-base"
            >
              确认导入 ({{ parsedRecords.length }}条)
            </button>
          </div>
        </div>

        <!-- Help Text -->
        <div v-if="!isLoading && parsedRecords.length === 0" class="text-xs sm:text-sm text-[#5a403e] space-y-1 bg-[#f0eded] p-3 sm:p-4 rounded-xl">
          <p class="font-bold">支持的 Excel 格式：</p>
          <ul class="list-disc list-inside space-y-1 text-[10px] sm:text-xs opacity-80">
            <li>第一行为表头：姓名、金额、事由、日期、地址、还礼状态</li>
            <li>或直接数据行：姓名、金额、事由、日期...</li>
            <li>日期格式支持：2024-01-15、2024/1/15、2024年1月15日</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
