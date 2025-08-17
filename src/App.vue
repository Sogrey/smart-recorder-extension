<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">智能录制器</h1>
          </div>
          <nav class="flex space-x-8">
            <router-link 
              to="/" 
              class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              active-class="text-primary-600 bg-primary-50"
            >
              录制
            </router-link>
            <router-link 
              to="/tutorials" 
              class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              active-class="text-primary-600 bg-primary-50"
            >
              教程
            </router-link>
            <router-link 
              to="/settings" 
              class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              active-class="text-primary-600 bg-primary-50"
            >
              设置
            </router-link>
          </nav>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
// 组件逻辑
</script>

<style scoped>
/* 组件样式 */
</style>
