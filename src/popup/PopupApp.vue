<template>
  <div class="popup-container w-80 min-h-96 bg-white">
    <header class="bg-primary-600 text-white p-4">
      <h1 class="text-lg font-semibold">智能录制器</h1>
      <p class="text-sm text-primary-100 mt-1">网页操作录制工具</p>
    </header>

    <main class="p-4">
      <!-- 录制状态 -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-700">录制状态</span>
          <div class="flex items-center space-x-2">
            <div 
              :class="[
                'w-3 h-3 rounded-full',
                isRecording ? 'bg-success-500 animate-pulse' : 'bg-gray-300'
              ]"
            ></div>
            <span class="text-xs text-gray-500">
              {{ isRecording ? '录制中' : '未录制' }}
            </span>
          </div>
        </div>

        <!-- 录制控制按钮 -->
        <div class="flex space-x-2">
          <button 
            v-if="!isRecording"
            @click="startRecording"
            class="btn btn-primary flex-1"
          >
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
            </svg>
            开始录制
          </button>
          <button 
            v-else
            @click="stopRecording"
            class="btn bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex-1"
          >
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"/>
            </svg>
            停止录制
          </button>
        </div>
      </div>

      <!-- 录制信息 -->
      <div v-if="isRecording" class="mb-6">
        <div class="bg-primary-50 border border-primary-200 rounded-lg p-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-primary-700">录制时长</span>
            <span class="font-mono text-primary-900">{{ recordingDuration }}</span>
          </div>
          <div class="flex items-center justify-between text-sm mt-1">
            <span class="text-primary-700">操作步骤</span>
            <span class="font-mono text-primary-900">{{ recordingSteps.length }}</span>
          </div>
        </div>
      </div>

      <!-- 快速操作 -->
      <div class="space-y-2">
        <button 
          @click="openTutorials"
          class="w-full btn btn-secondary text-left"
        >
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          查看教程
        </button>
        <button 
          @click="openSettings"
          class="w-full btn btn-secondary text-left"
        >
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
          </svg>
          设置
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRecordingStore } from '@/stores/recording'

const recordingStore = useRecordingStore()

const isRecording = ref(false)
const recordingSteps = ref([])
const startTime = ref<number | null>(null)
const recordingDuration = ref('00:00')

let durationTimer: NodeJS.Timeout | null = null

// 开始录制
const startRecording = () => {
  isRecording.value = true
  startTime.value = Date.now()
  recordingStore.startRecording()
  
  // 开始计时
  durationTimer = setInterval(() => {
    if (startTime.value) {
      const elapsed = Date.now() - startTime.value
      const minutes = Math.floor(elapsed / 60000)
      const seconds = Math.floor((elapsed % 60000) / 1000)
      recordingDuration.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
  }, 1000)
}

// 停止录制
const stopRecording = () => {
  isRecording.value = false
  startTime.value = null
  recordingStore.stopRecording()
  
  if (durationTimer) {
    clearInterval(durationTimer)
    durationTimer = null
  }
  
  recordingDuration.value = '00:00'
}

// 打开教程页面
const openTutorials = () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('tutorials.html') })
}

// 打开设置页面
const openSettings = () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') })
}

onMounted(() => {
  // 初始化时检查录制状态
  isRecording.value = recordingStore.isRecording
})

onUnmounted(() => {
  if (durationTimer) {
    clearInterval(durationTimer)
  }
})
</script>

<style scoped>
.popup-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
