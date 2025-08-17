// Chrome Extension Background Service Worker
// 负责管理扩展的生命周期和跨标签页通信

console.log('智能录制器 Background Service Worker 已启动')

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('扩展已安装:', details.reason)
  
  if (details.reason === 'install') {
    // 首次安装时的初始化
    initializeExtension()
  } else if (details.reason === 'update') {
    // 更新时的处理
    console.log('扩展已更新到版本:', chrome.runtime.getManifest().version)
  }
})

// 扩展启动时的初始化
chrome.runtime.onStartup.addListener(() => {
  console.log('扩展已启动')
  initializeExtension()
})

// 监听扩展图标点击事件
chrome.action.onClicked.addListener(async (tab) => {
  console.log('扩展图标被点击，标签页:', tab.id)
  
  try {
    // 使用sidePanel API打开侧边栏
    if (tab.id) {
      await chrome.sidePanel.open({ tabId: tab.id })
      console.log('侧边栏已打开')
      
      // 不再需要手动注入，因为 manifest 已经配置了声明式注入
      console.log('Content script 已通过 manifest 自动注入')
    }
  } catch (error) {
    console.error('打开侧边栏失败:', error)
  }
})

// 监听标签页激活事件 - 简化版本，依赖 manifest 声明式注入
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log('标签页已激活:', activeInfo.tabId)
  
  try {
    const currentTab = await chrome.tabs.get(activeInfo.tabId)
    if (currentTab.url && shouldInjectContentScript(currentTab.url)) {
      console.log('标签页激活，Content script 已通过 manifest 自动注入')
    }
  } catch (error) {
    console.log('获取标签页信息失败:', error)
  }
})

// 处理来自content script和popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background收到消息:', message, '来自:', sender.tab?.url)
  
  switch (message.type) {
    case 'GET_RECORDING_STATUS':
      handleGetRecordingStatus(sender.tab?.id, sendResponse)
      break
      
    case 'RECORDING_STEP_ADDED':
      handleRecordingStepAdded(message.data, sender.tab?.id)
      break
      
    case 'RECORDING_ERROR':
      handleRecordingError(message.error, sender.tab?.id)
      break
      
    case 'START_RECORDING':
      handleStartRecording(message.data, sender.tab?.id)
      break
      
    case 'STOP_RECORDING':
      handleStopRecording(message.data, sender.tab?.id)
      break
      
    default:
      console.log('未知消息类型:', message.type)
  }
  
  // 返回true表示异步响应
  return true
})

// 标签页更新时的处理 - 不再自动注入content script
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('标签页已加载完成:', tab.url)
    // 不自动注入content script，等待侧边栏展开时再注入
  }
})

// 标签页激活时的处理 - 不再自动注入content script
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log('标签页已激活:', activeInfo.tabId)
  // 不自动注入content script，等待侧边栏展开时再注入
})

// 标签页激活时的处理
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('标签页已激活:', activeInfo.tabId)
  
  // 可以在这里处理标签页切换逻辑
})

// 初始化扩展
async function initializeExtension() {
  try {
    // 设置默认配置
    const defaultConfig = {
      autoRecord: false,
      screenshotQuality: 'high',
      maxStepsPerSession: 1000,
      storageQuota: '100MB'
    }
    
    await chrome.storage.local.set({ extension_config: defaultConfig })
    console.log('扩展配置已初始化')
    
    // 设置侧边栏行为
    await chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true
    })
    console.log('侧边栏行为已设置')
    
  } catch (error) {
    console.error('初始化扩展失败:', error)
  }
}

// 处理获取录制状态请求
async function handleGetRecordingStatus(tabId: number | undefined, sendResponse: (response: any) => void) {
  try {
    console.log('收到录制状态检查请求，标签页ID:', tabId)
    
    const result = await chrome.storage.local.get('current_recording_session')
    const currentSession = result.current_recording_session
    
    const response = {
      isRecording: !!currentSession,
      sessionId: currentSession?.id || null,
      stepCount: currentSession?.steps?.length || 0
    }
    
    console.log('录制状态检查结果:', response)
    sendResponse(response)
    
  } catch (error) {
    console.error('获取录制状态失败:', error)
    sendResponse({ error: '获取录制状态失败' })
  }
}

// 处理录制步骤添加 - 不再需要广播，因为存储变化监听器会自动处理
async function handleRecordingStepAdded(stepData: any, _tabId: number | undefined) {
  try {
    console.log('录制步骤已添加:', stepData)
    console.log('步骤已由 content script 保存到存储，存储变化监听器将自动广播')
    
    // 记录页面信息（如果存在）
    if (stepData.pageInfo) {
      console.log('📄 步骤页面信息:', stepData.pageInfo)
    }
    
    // 不再手动广播，避免重复
    // 存储变化监听器会自动处理广播
    
  } catch (error) {
    console.error('处理录制步骤失败:', error)
  }
}

// 处理开始录制
async function handleStartRecording(data: any, tabId: number | undefined) {
  try {
    console.log('开始录制:', data)
    
    // 保存当前录制会话
    await chrome.storage.local.set({ 
      current_recording_session: {
        id: data.sessionId,
        startTime: Date.now(),
        steps: [],
        tabId: tabId
      }
    })
    
    // 广播消息到所有扩展页面（包括侧边栏）
    try {
      await chrome.runtime.sendMessage({
        type: 'RECORDING_STARTED',
        data: data
      })
      console.log('开始录制消息已广播到扩展页面')
    } catch (error) {
      console.log('广播消息失败:', error)
    }
    
  } catch (error) {
    console.error('处理开始录制失败:', error)
  }
}

// 处理停止录制
async function handleStopRecording(data: any, _tabId: number | undefined) {
  try {
    console.log('停止录制:', data)
    
    // 清除当前录制会话
    await chrome.storage.local.remove('current_recording_session')
    
    // 广播消息到所有扩展页面（包括侧边栏）
    try {
      await chrome.runtime.sendMessage({
        type: 'RECORDING_STOPPED',
        data: data
      })
      console.log('停止录制消息已广播到扩展页面')
    } catch (error) {
      console.log('广播消息失败:', error)
    }
    
  } catch (error) {
    console.error('处理停止录制失败:', error)
  }
}

// 处理录制错误
function handleRecordingError(error: any, _tabId: number | undefined) {
  console.error('录制过程中发生错误:', error)
  
  // 可以在这里发送错误通知
  // 或者自动停止录制
}

// 判断是否需要注入content script
function shouldInjectContentScript(url: string): boolean {
  // 排除chrome://、chrome-extension://等特殊协议
  const shouldInject = url.startsWith('http://') || url.startsWith('https://')
  console.log('检查URL是否需要注入content script:', url, '结果:', shouldInject)
  return shouldInject
}

// 注入函数已移除，改为使用 manifest 声明式注入

// 清理过期数据
async function cleanupExpiredData() {
  try {
    const result = await chrome.storage.local.get(null)
    const now = Date.now()
    const maxAge = 30 * 24 * 60 * 60 * 1000 // 30天
    
    const keysToRemove: string[] = []
    
    for (const [key, value] of Object.entries(result)) {
      if (key.startsWith('recording_session_') && value?.endTime) {
        if (now - value.endTime > maxAge) {
          keysToRemove.push(key)
        }
      }
    }
    
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove)
      console.log('已清理过期数据:', keysToRemove.length, '个会话')
    }
    
  } catch (error) {
    console.error('清理过期数据失败:', error)
  }
}

// 定期清理过期数据（每天执行一次）
setInterval(cleanupExpiredData, 24 * 60 * 60 * 1000)

// 定期清理已处理步骤记录（每小时执行一次）
setInterval(async () => {
  try {
    lastProcessedSteps.clear()
    console.log('已清理已处理步骤记录')
  } catch (error) {
    console.error('清理已处理步骤记录失败:', error)
  }
}, 60 * 60 * 1000)

// 监听存储变化，自动广播录制步骤更新 - 添加更强去重
let isProcessingStorageChange = false // 防止重复处理存储变化
let lastProcessedSteps = new Set<string>() // 记录已处理的步骤

chrome.storage.onChanged.addListener(async (changes, namespace) => {
  // 防止重复处理
  if (isProcessingStorageChange) {
    console.log('🚫 正在处理存储变化，跳过重复调用')
    return
  }
  
  if (namespace === 'local' && changes.current_recording_session) {
    try {
      isProcessingStorageChange = true
      console.log('🔄 开始处理存储变化...')
      
      const newSession = changes.current_recording_session.newValue
      const oldSession = changes.current_recording_session.oldValue
      
      console.log('📊 存储变化详情:', {
        oldStepsCount: oldSession?.steps?.length || 0,
        newStepsCount: newSession?.steps?.length || 0
      })
      
      if (newSession && newSession.steps && oldSession && oldSession.steps) {
        // 检查是否有新步骤添加
        if (newSession.steps.length > oldSession.steps.length) {
          const newSteps = newSession.steps.slice(oldSession.steps.length)
          console.log('🆕 检测到新步骤添加，数量:', newSteps.length)
          
          // 过滤出真正的新步骤（通过 uniqueId 去重）
          const trulyNewSteps = newSteps.filter((step: any) => {
            if (!step.uniqueId) {
              console.log('⚠️ 步骤没有 uniqueId，直接通过:', step)
              return true
            }
            
            if (lastProcessedSteps.has(step.uniqueId)) {
              console.log('🚫 步骤已处理过，跳过:', step.uniqueId)
              return false
            }
            
            // 记录为已处理
            lastProcessedSteps.add(step.uniqueId)
            console.log('✅ 步骤唯一性验证通过，uniqueId:', step.uniqueId)
            return true
          })
          
          console.log('真正的新步骤数量:', trulyNewSteps.length)
          
          // 广播每个真正的新步骤
          for (const step of trulyNewSteps) {
            try {
              await chrome.runtime.sendMessage({
                type: 'RECORDING_STEP_ADDED',
                data: step
              })
              console.log('新步骤已广播:', step.uniqueId || '无ID')
              console.log('📄 步骤页面信息:', step.pageInfo || '无页面信息')
            } catch (error) {
              console.log('广播新步骤失败:', error)
            }
          }
          
          // 清理已处理的步骤记录（保留最近100个）
          if (lastProcessedSteps.size > 100) {
            const stepsArray = Array.from(lastProcessedSteps)
            lastProcessedSteps = new Set(stepsArray.slice(-50))
          }
        }
      }
    } catch (error) {
      console.error('处理存储变化失败:', error)
    } finally {
      // 确保处理完成后重置状态
      isProcessingStorageChange = false
    }
  }
})
