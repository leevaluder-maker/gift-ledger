<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Sparkles, Loader2, AlertCircle, CheckCircle, FileSpreadsheet, Type, Mic, Upload, X } from 'lucide-vue-next'
import { useSettingsStore } from '../stores/settingsStore'
import { useRecordStore } from '../stores/recordStore'
import * as XLSX from 'xlsx'

const emit = defineEmits(['close', 'imported'])
const settingsStore = useSettingsStore()
const recordStore = useRecordStore()

const activeMode = ref('text') // 'text' | 'excel'
const inputText = ref('')
const isLoading = ref(false)
const isListening = ref(false)
const error = ref('')
const success = ref('')
const parsedRecords = ref([])
const fileInput = ref(null)

let recognition = null

// 初始化语音识别
onMounted(() => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        inputText.value += finalTranscript
      }
    }

    recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error)
      isListening.value = false
      if (event.error === 'not-allowed') {
        error.value = '无法访问麦克风，请检查权限设置'
      } else if (event.error === 'no-speech') {
        error.value = '未检测到语音，请重试'
      } else {
        error.value = '语音识别错误: ' + event.error
      }
    }

    recognition.onend = () => {
      isListening.value = false
    }
  }
})

// 组件卸载时清理语音识别
onUnmounted(() => {
  if (recognition && isListening.value) {
    recognition.stop()
  }
  recognition = null
})

// 切换语音识别
const toggleListening = async () => {
  if (!recognition) {
    error.value = '您的浏览器不支持语音识别功能'
    return
  }

  if (isListening.value) {
    recognition.stop()
    isListening.value = false
  } else {
    try {
      error.value = ''
      recognition.start()
      isListening.value = true
    } catch (e) {
      console.error('语音识别启动错误:', e)
      error.value = '语音识别启动失败，请检查麦克风权限'
      isListening.value = false
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

      // 将Excel内容转换为文本用于AI分析
      let textContent = 'Excel表格内容：\n'
      jsonData.forEach((row, index) => {
        if (row.length > 0) {
          textContent += `第${index + 1}行: ${row.join(' ')}\n`
        }
      })

      inputText.value = textContent
      isLoading.value = false

      // 自动开始解析
      parseWithAI()
    } catch (e) {
      error.value = '读取Excel文件失败: ' + e.message
      isLoading.value = false
    }
  }
  reader.readAsArrayBuffer(file)
  event.target.value = '' // 重置input
}

// 使用 AI 解析文本
const parseWithAI = async () => {
  const config = settingsStore.getApiConfig()
  if (!config.key) {
    error.value = '请先设置 API Key'
    return
  }

  if (!inputText.value.trim()) {
    error.value = '请输入要识别的内容'
    return
  }

  isLoading.value = true
  error.value = ''
  success.value = ''
  parsedRecords.value = []

  try {
    const result = await callAIAPI(config, inputText.value)

    if (result.error) {
      throw new Error(result.error)
    }

    // 提取 JSON - 先尝试从 markdown 代码块中提取
    let jsonText = result.content

    // 尝试匹配 ```json ... ``` 或 ``` ... ``` 格式
    const codeBlockMatch = result.content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim()
    }

    // 尝试匹配 JSON 数组
    let jsonMatch = jsonText.match(/\[[\s\S]*\]/)

    // 如果没有找到完整数组，尝试提取不完整的数组并修复
    if (!jsonMatch) {
      // 尝试匹配到字符串末尾的不完整数组
      const partialMatch = jsonText.match(/\[[\s\S]*/)
      if (partialMatch) {
        let partialJson = partialMatch[0].trim()
        // 尝试修复不完整的 JSON（去掉最后一个不完整的对象）
        const lastCompleteObject = partialJson.match(/(\{[^{}]*\})(?:,\s*)?/g)
        if (lastCompleteObject && lastCompleteObject.length > 0) {
          // 重新组装完整的 JSON 数组
          const fixedJson = '[' + lastCompleteObject.join(',') + ']'
          jsonMatch = [fixedJson]
        }
      }
    }

    if (!jsonMatch) {
      throw new Error('无法解析返回的数据，数据量可能过大，请尝试分批导入')
    }

    let records
    try {
      records = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      // 尝试进一步修复 JSON
      try {
        const cleanedJson = jsonMatch[0].replace(/,\s*\]$/, ']').replace(/,\s*\}$/g, '}')
        records = JSON.parse(cleanedJson)
      } catch (e) {
        throw new Error('JSON 解析失败，数据可能不完整，请尝试分批导入')
      }
    }

    // 验证记录
    const validRecords = records.filter(r => {
      return r.amount && r.name && r.date
    })

    if (validRecords.length === 0) {
      throw new Error('未识别到有效记录')
    }

    parsedRecords.value = validRecords
    success.value = `成功识别 ${validRecords.length} 条记录`
  } catch (e) {
    console.error('Parse Error:', e)
    error.value = '识别失败：' + e.message
  } finally {
    isLoading.value = false
  }
}

// 调用AI API
const callAIAPI = async (config, text) => {
  const today = new Date().toISOString().split('T')[0]
  const currentYear = new Date().getFullYear()

  const prompt = `请将以下礼金记录文本解析为结构化数据。今天日期是 ${today}。

文本内容：
"""${text}"""

请分析文本中的每一条礼金记录，返回 JSON 数组格式：
[
  {
    "amount": 金额数字（必填）,
    "name": "姓名（必填）",
    "date": "日期，格式 YYYY-MM-DD（如未明确年份，使用今年，必填）",
    "occasion": "事由，如结婚、满月、寿宴等（必填）",
    "occasionType": "事由类型：red（红喜事：结婚、满月等）、white（白喜事：丧事等）、birthday（祝寿）、other（其他）",
    "status": "returned 或 pending（根据上下文判断是否已还礼，默认 pending）",
    "type": "received（收礼，默认）",
    "address": "地址（选填，如果文本中有地址信息则提取）"
  }
]

注意：
1. 如果文本包含多条记录，请全部解析
2. 如果信息不完整，请合理推断
3. 只返回 JSON 数组，不要包含 markdown 代码块或其他说明文字
4. 确保日期格式正确，年份不明确时使用 ${currentYear}
5. 地址字段是可选的，如果文本中有地址信息请提取，没有则不填
6. 返回格式示例：[{"amount": 500, "name": "张三", "date": "2024-01-15", "occasion": "结婚", "occasionType": "red", "status": "pending", "type": "received", "address": "幸福小区8栋"}]
`

  switch (config.provider) {
    case 'anthropic':
      return await callAnthropic(config.key, prompt)
    case 'deepseek':
      return await callDeepSeek(config.key, prompt)
    case 'kimi':
      return await callKimi(config.key, prompt)
    case 'aliyun':
      return await callAliyun(config.key, prompt)
    case 'siliconflow':
      return await callSiliconFlow(config.key, prompt)
    default:
      throw new Error('未知的AI服务提供商')
  }
}

// Anthropic API
const callAnthropic = async (key, prompt) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const err = await response.json()
    return { error: err.error?.message || 'API 请求失败' }
  }

  const data = await response.json()
  return { content: data.content[0].text }
}

// DeepSeek API
const callDeepSeek = async (key, prompt) => {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const err = await response.json()
    return { error: err.error?.message || 'API 请求失败' }
  }

  const data = await response.json()
  return { content: data.choices[0].message.content }
}

// Kimi API
const callKimi = async (key, prompt) => {
  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const err = await response.json()
    return { error: err.error?.message || 'API 请求失败' }
  }

  const data = await response.json()
  return { content: data.choices[0].message.content }
}

// 阿里云百炼 API
const callAliyun = async (key, prompt) => {
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'qwen-turbo',
      input: { messages: [{ role: 'user', content: prompt }] }
    })
  })

  if (!response.ok) {
    const err = await response.json()
    return { error: err.message || 'API 请求失败' }
  }

  const data = await response.json()
  return { content: data.output.text }
}

// 硅基流动 API
const callSiliconFlow = async (key, prompt) => {
  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'deepseek-ai/DeepSeek-V2.5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const err = await response.json()
    return { error: err.error?.message || 'API 请求失败' }
  }

  const data = await response.json()
  return { content: data.choices[0].message.content }
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
            <Sparkles class="text-[#990f19]" :size="20" />
            <Sparkles class="text-[#990f19] hidden sm:block" :size="24" />
          </div>
          <div>
            <h3 class="text-lg sm:text-xl font-black">AI 智能导入</h3>
            <p class="text-xs sm:text-sm text-[#5a403e]">智能识别礼金记录</p>
          </div>
        </div>
        <button @click="$emit('close')" class="text-[#5a403e] hover:text-[#990f19]">
          <X :size="22" />
        </button>
      </div>

      <!-- Mode Switch -->
      <div class="flex border-b border-[#e5e2e1]">
        <button
          @click="activeMode = 'text'; error = ''; success = ''; parsedRecords = []"
          class="flex-1 py-3 sm:py-4 flex items-center justify-center gap-1.5 sm:gap-2 font-bold text-sm sm:text-base transition-colors"
          :class="activeMode === 'text' ? 'bg-[#ffdad7] text-[#990f19]' : 'text-[#5a403e] hover:bg-[#f0eded]'"
        >
          <Type :size="18" />
          打字 / 语音
        </button>
        <button
          @click="activeMode = 'excel'; error = ''; success = ''; parsedRecords = []; inputText = ''"
          class="flex-1 py-3 sm:py-4 flex items-center justify-center gap-1.5 sm:gap-2 font-bold text-sm sm:text-base transition-colors"
          :class="activeMode === 'excel' ? 'bg-[#ffdad7] text-[#990f19]' : 'text-[#5a403e] hover:bg-[#f0eded]'"
        >
          <FileSpreadsheet :size="18" />
          Excel 导入
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
        <!-- Excel Mode -->
        <div v-if="activeMode === 'excel'" class="space-y-3 sm:space-y-4">
          <div
            v-if="!inputText"
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

          <div v-else class="space-y-3 sm:space-y-4">
            <div class="bg-[#f0eded] p-3 sm:p-4 rounded-xl">
              <p class="font-bold mb-2 text-sm sm:text-base">已读取文件内容：</p>
              <pre class="text-xs sm:text-sm text-[#5a403e] whitespace-pre-wrap max-h-32 sm:max-h-40 overflow-y-auto">{{ inputText.slice(0, 500) }}{{ inputText.length > 500 ? '...' : '' }}</pre>
            </div>
            <button
              @click="inputText = ''; parsedRecords = []"
              class="text-xs sm:text-sm text-[#990f19] font-bold"
            >
              重新选择文件
            </button>
          </div>
        </div>

        <!-- Text/Voice Mode -->
        <div v-if="activeMode === 'text'" class="space-y-3 sm:space-y-4">
          <div class="relative">
            <textarea
              v-model="inputText"
              placeholder="请描述礼金记录...&#10;&#10;例如：&#10;张三 500元 结婚礼金 2024年1月15日&#10;李四 1000元 满月酒 2024年2月20日&#10;王五 800元 六十大寿&#10;...&#10;&#10;或点击麦克风按钮开始语音输入"
              class="w-full h-40 sm:h-48 p-3 sm:p-4 bg-[#f0eded] border-none rounded-2xl text-base sm:text-lg resize-none focus:ring-2 focus:ring-[#bc2c2e] outline-none"
            />
            <button
              @click="toggleListening"
              :class="[
                'absolute bottom-3 sm:bottom-4 right-3 sm:right-4 p-2.5 sm:p-3 rounded-full transition-all',
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[#990f19] text-white hover:bg-[#bc2c2e]'
              ]"
              :title="isListening ? '停止录音' : '开始语音输入'"
            >
              <Mic :size="20" />
            </button>
          </div>
          <p v-if="isListening" class="text-xs sm:text-sm text-[#990f19] font-bold flex items-center gap-2">
            <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            正在录音，请说话...
          </p>
        </div>

        <!-- Error -->
        <div v-if="error" class="flex items-center gap-2 text-red-600 text-xs sm:text-sm bg-red-50 p-2.5 sm:p-3 rounded-xl">
          <AlertCircle :size="16" />
          {{ error }}
        </div>

        <!-- Parse Button -->
        <button
          v-if="parsedRecords.length === 0 && inputText"
          @click="parseWithAI"
          :disabled="isLoading"
          class="w-full h-12 sm:h-14 bg-[#990f19] hover:bg-[#bc2c2e] disabled:opacity-50 text-white text-base sm:text-lg font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Loader2 v-if="isLoading" class="animate-spin" :size="18" />
          <Sparkles v-else :size="18" />
          {{ isLoading ? 'AI 识别中...' : '开始识别' }}
        </button>

        <!-- Help Text -->
        <div v-if="parsedRecords.length === 0" class="text-xs sm:text-sm text-[#5a403e] space-y-1 bg-[#f0eded] p-3 sm:p-4 rounded-xl">
          <p class="font-bold">支持格式：</p>
          <ul class="list-disc list-inside space-y-1 text-[10px] sm:text-xs opacity-80">
            <li>姓名 金额 事由 日期</li>
            <li>微信/支付宝账单截图的文字识别结果</li>
            <li>手写记账的文字描述</li>
            <li>聊天记录中的转账信息</li>
          </ul>
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
              @click="parsedRecords = []; success = ''"
              class="flex-1 h-12 sm:h-14 bg-[#f0eded] text-[#1b1c1c] font-bold rounded-2xl transition-all active:scale-95 text-sm sm:text-base"
            >
              重新识别
            </button>
            <button
              @click="saveRecords"
              class="flex-1 h-12 sm:h-14 bg-[#990f19] text-white font-bold rounded-2xl transition-all active:scale-95 text-sm sm:text-base"
            >
              确认导入 ({{ parsedRecords.length }}条)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
