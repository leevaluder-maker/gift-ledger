<script setup>
import { ref, onMounted, computed } from 'vue'
import { Settings, CheckCircle, AlertCircle, Eye, EyeOff, ExternalLink } from 'lucide-vue-next'
import { useSettingsStore, AI_PROVIDERS } from '../stores/settingsStore'

const emit = defineEmits(['close'])
const settingsStore = useSettingsStore()

const selectedProvider = ref('anthropic')
const apiKey = ref('')
const showKey = ref(false)
const isTesting = ref(false)
const testResult = ref(null)

const currentProvider = computed(() => AI_PROVIDERS.find(p => p.id === selectedProvider.value))

onMounted(() => {
  const config = settingsStore.getApiConfig()
  selectedProvider.value = config.provider || 'anthropic'
  apiKey.value = config.key || ''
})

const testKey = async () => {
  if (!apiKey.value.trim()) {
    testResult.value = { valid: false, message: '请输入 API Key' }
    return
  }

  isTesting.value = true
  testResult.value = null

  try {
    const result = await settingsStore.testApiKey(selectedProvider.value, apiKey.value.trim())
    testResult.value = result

    if (result.valid) {
      settingsStore.setApiConfig(selectedProvider.value, apiKey.value.trim())
    }
  } finally {
    isTesting.value = false
  }
}

const saveKey = () => {
  if (apiKey.value.trim()) {
    settingsStore.setApiConfig(selectedProvider.value, apiKey.value.trim())
  }
  emit('close')
}

const clearKey = () => {
  apiKey.value = ''
  settingsStore.clearApiConfig()
  testResult.value = null
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
    <div class="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="p-4 sm:p-6 border-b border-[#e5e2e1] flex items-center justify-between">
        <div class="flex items-center gap-2 sm:gap-3">
          <div class="p-1.5 sm:p-2 bg-[#f0eded] rounded-xl">
            <Settings class="text-[#990f19]" :size="20" />
            <Settings class="text-[#990f19] hidden sm:block" :size="24" />
          </div>
          <div>
            <h3 class="text-lg sm:text-xl font-black">API 设置</h3>
            <p class="text-xs sm:text-sm text-[#5a403e]">配置 AI 识别服务</p>
          </div>
        </div>
        <button @click="$emit('close')" class="text-[#5a403e] hover:text-[#990f19] text-xl sm:text-2xl">
          ✕
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <!-- Provider Selection -->
        <div class="space-y-1.5 sm:space-y-2">
          <label class="font-bold text-sm sm:text-base">选择 AI 服务商</label>
          <select
            v-model="selectedProvider"
            class="w-full h-12 sm:h-14 px-3 sm:px-4 bg-[#f0eded] border-none rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#bc2c2e] outline-none"
          >
            <option v-for="provider in AI_PROVIDERS" :key="provider.id" :value="provider.id">
              {{ provider.name }}
            </option>
          </select>
        </div>

        <!-- API Key Input -->
        <div class="space-y-1.5 sm:space-y-2">
          <label class="font-bold text-sm sm:text-base flex items-center gap-2">
            {{ currentProvider.name }} API Key
            <a
              :href="currentProvider.keyUrl"
              target="_blank"
              class="text-[#990f19] hover:underline text-[10px] sm:text-xs font-normal flex items-center gap-1"
            >
              <ExternalLink :size="12" />
              获取
            </a>
          </label>
          <div class="relative">
            <input
              v-model="apiKey"
              :type="showKey ? 'text' : 'password'"
              :placeholder="currentProvider.placeholder"
              class="w-full h-12 sm:h-14 pl-3 sm:pl-4 pr-10 sm:pr-12 bg-[#f0eded] border-none rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-[#bc2c2e] outline-none"
            />
            <button
              @click="showKey = !showKey"
              class="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-[#5a403e] hover:text-[#990f19]"
            >
              <Eye v-if="!showKey" :size="20" />
              <EyeOff v-else :size="20" />
            </button>
          </div>
          <p class="text-[10px] sm:text-xs text-[#5a403e]">
            API Key 仅存储在您的浏览器本地，不会上传到任何服务器
          </p>
        </div>

        <!-- Test Result -->
        <div
          v-if="testResult"
          :class="[
            'flex items-center gap-2 p-3 sm:p-4 rounded-xl text-sm sm:text-base',
            testResult.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          ]"
        >
          <CheckCircle v-if="testResult.valid" :size="20" />
          <AlertCircle v-else :size="20" />
          <span class="font-bold">{{ testResult.message }}</span>
        </div>

        <!-- Actions -->
        <div class="space-y-2 sm:space-y-3">
          <button
            @click="testKey"
            :disabled="isTesting || !apiKey.trim()"
            class="w-full h-12 sm:h-14 bg-[#f0eded] hover:bg-[#eae7e7] disabled:opacity-50 text-[#1b1c1c] font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-sm sm:text-base"
          >
            <span v-if="isTesting" class="animate-pulse">测试中...</span>
            <span v-else>测试 API Key</span>
          </button>

          <div class="flex gap-2 sm:gap-3">
            <button
              @click="clearKey"
              class="flex-1 h-12 sm:h-14 border-2 border-[#e5e2e1] text-[#5a403e] font-bold rounded-xl transition-all active:scale-95 text-sm sm:text-base"
            >
              清除
            </button>
            <button
              @click="saveKey"
              class="flex-1 h-12 sm:h-14 bg-[#990f19] text-white font-bold rounded-xl transition-all active:scale-95 text-sm sm:text-base"
            >
              保存
            </button>
          </div>
        </div>

        <!-- Instructions -->
        <div class="text-[10px] sm:text-xs text-[#5a403e] space-y-1.5 sm:space-y-2 pt-3 sm:pt-4 border-t border-[#e5e2e1]">
          <p class="font-bold">如何获取 API Key：</p>
          <ol class="list-decimal list-inside space-y-0.5 sm:space-y-1">
            <li>访问 <a :href="currentProvider.keyUrl" target="_blank" class="text-[#990f19] underline">{{ currentProvider.keyUrl }}</a></li>
            <li>注册或登录您的账户</li>
            <li>{{ currentProvider.keyHint }}</li>
            <li>复制密钥并粘贴到上方输入框</li>
          </ol>
          <p class="text-[9px] sm:text-[10px] opacity-60 mt-1.5 sm:mt-2">
            注意：使用 AI API 可能产生费用，请查看各服务商官方定价
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
