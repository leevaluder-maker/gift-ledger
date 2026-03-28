<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Home,
  History,
  ArrowLeft,
  Settings,
} from 'lucide-vue-next'
import ApiSettings from './views/ApiSettings.vue'
import AiImport from './views/AiImport.vue'

const router = useRouter()
const route = useRoute()
const isLoaded = ref(false)
const showApiSettings = ref(false)
const showAiImport = ref(false)

// 检查是否是详情页面
const isDetailPage = computed(() => route.name === 'RecordDetail')

// 当前激活的标签页
const activeTab = computed(() => {
  if (isDetailPage.value) return ''
  const pathMap = {
    '/home': 'home',
    '/records': 'records'
  }
  return pathMap[route.path] || 'home'
})

// 加载数据
onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})

// 切换标签页
const switchTab = (tab) => {
  const pathMap = {
    home: '/home',
    records: '/records'
  }
  router.push(pathMap[tab])
}
</script>

<template>
  <div class="min-h-screen bg-[#fcf9f8] text-[#1b1c1c] font-sans selection:bg-[#ffdad7]">
    <!-- Top Bar -->
    <header class="sticky top-0 z-50 bg-[#fcf9f8]/80 backdrop-blur-md border-b border-[#e5e2e1]/30">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <!-- 左侧：返回按钮或占位 -->
        <div class="w-8 sm:w-10">
          <button
            v-if="!isDetailPage && activeTab !== 'home'"
            @click="switchTab('home')"
            class="p-1 text-[#990f19] active:scale-90 transition-transform"
          >
            <ArrowLeft :size="26" />
          </button>
        </div>
        <!-- 中间：标题 -->
        <h1 class="text-xl sm:text-2xl font-black tracking-tight text-[#990f19]">极简账本</h1>
        <!-- 右侧：设置按钮或占位 -->
        <div class="w-8 sm:w-10">
          <button
            v-if="!isDetailPage"
            @click="showApiSettings = true"
            class="p-1.5 sm:p-2 rounded-full bg-[#f0eded] text-[#5a403e] active:scale-90 transition-transform"
            title="设置"
          >
            <Settings :size="20" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-20 sm:pb-24">
      <router-view v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>

    <!-- Bottom Nav - 只在非详情页显示 -->
    <nav v-if="!isDetailPage" class="fixed bottom-0 left-0 w-full h-16 sm:h-20 bg-[#fcf9f8] border-t border-[#e5e2e1]/50 shadow-[0_-4px_24px_rgba(27,28,28,0.06)] z-50">
      <div class="max-w-4xl mx-auto h-full flex items-stretch justify-around px-6 sm:px-8">
        <button
          @click="switchTab('home')"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all duration-300 active:scale-90"
          :class="activeTab === 'home' ? 'text-[#990f19]' : 'text-[#1b1c1c]'"
        >
          <Home :size="23" />
          <span class="text-[10px] sm:text-xs font-bold">首页</span>
        </button>

        <button
          @click="switchTab('records')"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all duration-300 active:scale-90"
          :class="activeTab === 'records' ? 'text-[#990f19]' : 'text-[#1b1c1c]'"
        >
          <History :size="23" />
          <span class="text-[10px] sm:text-xs font-bold">记录</span>
        </button>
      </div>
    </nav>

    <!-- Dialogs -->
    <ApiSettings v-if="showApiSettings" @close="showApiSettings = false" />
    <AiImport v-if="showAiImport" @close="showAiImport = false" />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
