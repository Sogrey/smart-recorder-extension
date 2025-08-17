// 智能录制器 Content Script
// 参考 zhixie-ext 的简单架构

// 使用立即执行函数表达式（IIFE）来避免模块级别的 return
(function() {
  // 防重复加载检查
  if ((window as any).__MY_SMART_RECORDER_EXTENSION_CONTENT_LOADED__) {
    console.log('Content script已经加载，跳过重复加载')
    return
  }
  
  // 标记已加载
  ;(window as any).__MY_SMART_RECORDER_EXTENSION_CONTENT_LOADED__ = true
  
  console.log('=== 智能录制器 Content Script 开始加载 ===')
  console.log('加载时间:', new Date().toISOString())
  console.log('页面信息:', {
    url: window.location.href,
    title: document.title,
    hostname: window.location.hostname,
    pathname: window.location.pathname
  })
  
  // 录制器状态
  let isRecording = false
  let sessionId: string | null = null
  let lastClickTime = 0
  let lastClickTarget: string | null = null
  let isProcessingClick = false // 防止重复处理点击事件
  let processedEvents = new Set<string>() // 记录已处理的事件，防止重复
  
  // 全局事件去重 - 使用 WeakMap 存储已处理的事件对象引用
  const processedEventObjects = new WeakMap<Event, boolean>()

  // 检查录制状态 - 增加重试机制
  async function checkRecordingStatus() {
    const maxRetries = 3
    let retryCount = 0
    
    while (retryCount < maxRetries) {
      try {
        const result = await chrome.storage.local.get(['current_recording_session'])
        const currentSession = result.current_recording_session
        
        if (currentSession) {
          isRecording = true
          sessionId = currentSession.id
          console.log('检测到正在进行的录制，sessionId:', sessionId)
          return
        } else {
          isRecording = false
          sessionId = null
          console.log('当前没有正在进行的录制')
          return
        }
      } catch (error) {
        retryCount++
        console.error(`检查录制状态失败 (尝试 ${retryCount}/${maxRetries}):`, error)
        
        if (retryCount >= maxRetries) {
          console.error('检查录制状态最终失败，使用默认值')
          isRecording = false
          sessionId = null
        } else {
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount))
        }
      }
    }
  }

  // 创建点击步骤 - 添加唯一标记和页面信息
  function createClickStep(event: MouseEvent, target: Element) {
    // 生成唯一的事件标记，包含更多信息确保唯一性
    const uniqueId = `${event.clientX}_${event.clientY}_${event.timeStamp}_${target.tagName}_${target.id || target.className}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      type: 'click',
      description: `点击了 ${target.tagName.toLowerCase()}`,
      position: { x: event.clientX, y: event.clientY },
      timestamp: Date.now(),
      element: getElementInfo(target),
      sessionId: sessionId,
      uniqueId: uniqueId, // 添加唯一标记
      eventTimeStamp: event.timeStamp, // 使用浏览器原生时间戳
      // 添加页面信息，用于页面跳转后的追踪
      pageInfo: {
        url: window.location.href,
        title: document.title,
        hostname: window.location.hostname,
        pathname: window.location.pathname
      },
      // 截图相关字段
      hasScreenshot: false,
      screenshot: null
    }
  }

  // 获取元素信息
  function getElementInfo(element: Element): string {
    if (element.id) return `#${element.id}`
    if (element.className) {
      const classes = element.className.split(' ').filter((c: string) => c.trim())
      if (classes.length > 0) return `.${classes[0]}`
    }
    return element.tagName.toLowerCase()
  }

  // 检查是否为可跳转的元素
  function isNavigableElement(element: Element): boolean {
    const tagName = element.tagName.toLowerCase()
    
    // 检查是否为链接、按钮或其他可跳转元素
    return (
      tagName === 'a' || 
      tagName === 'button' ||
      (element as any).onclick ||
      (element as any).getAttribute('onclick') ||
      (element as any).getAttribute('data-href') ||
      (element as any).getAttribute('href') ||
      element.closest('a') !== null ||
      element.closest('button') !== null
    )
  }

  // 记录步骤 - 在存储层面进行去重
  async function recordStep(step: any) {
    if (!isRecording || !sessionId) return
    
    console.log('记录点击步骤:', step)
    
    try {
      // 直接读取当前录制会话
      const result = await chrome.storage.local.get('current_recording_session')
      const currentSession = result.current_recording_session
      
      if (currentSession) {
        currentSession.steps = currentSession.steps || []
        
        // 在存储层面进行去重检查
        const existingStep = currentSession.steps.find((existingStep: any) => 
          existingStep.uniqueId === step.uniqueId
        )
        
        if (existingStep) {
          console.log('🚫 检测到重复步骤，uniqueId:', step.uniqueId, '跳过保存')
          console.log('🚫 重复步骤详情:', existingStep)
          return
        }
        
        console.log('✅ 步骤唯一性验证通过，uniqueId:', step.uniqueId)
        console.log('📄 步骤页面信息:', step.pageInfo)
        
        // 添加新步骤
        currentSession.steps.push(step)
        
        // 直接保存到存储
        await chrome.storage.local.set({ 
          current_recording_session: currentSession 
        })
        
        console.log('步骤已直接保存到存储，当前步骤数:', currentSession.steps.length)
        
        // 不再发送消息，只依赖存储变化监听器自动广播
        console.log('步骤已保存到存储，等待 Background Script 自动广播')
        
        // 如果是点击事件，手动触发截图（调试用）
        if (step.type === 'click') {
          console.log('🔄 手动触发截图处理...')
          
          // 检查是否为可跳转的元素
          const target = step.target || document.activeElement
          const isNavigable = target ? isNavigableElement(target) : false
          
          if (isNavigable) {
            console.log('🔗 检测到可跳转元素，立即发送截图请求...')
            // 对于可跳转元素，立即发送截图请求
            try {
              await chrome.runtime.sendMessage({
                type: 'MANUAL_SCREENSHOT',
                data: step
              })
              console.log('✅ 可跳转元素截图消息已发送')
            } catch (error) {
              console.log('⚠️ 可跳转元素截图消息发送失败:', error)
            }
          } else {
            // 普通元素，正常处理
            try {
              await chrome.runtime.sendMessage({
                type: 'MANUAL_SCREENSHOT',
                data: step
              })
              console.log('✅ 普通元素截图消息已发送')
            } catch (error) {
              console.log('⚠️ 普通元素截图消息发送失败:', error)
            }
          }
        }
      } else {
        console.log('当前没有录制会话，无法保存步骤')
      }
    } catch (error) {
      console.error('保存步骤失败:', error)
    }
  }

  // 点击事件处理 - 使用更严格的事件对象去重
  async function handleClick(event: MouseEvent) {
    // 第一层防护：检查事件对象是否已经处理过
    if (processedEventObjects.has(event)) {
      console.log('事件对象已处理过，忽略重复事件')
      return
    }
    
    // 第二层防护：防止重复处理
    if (isProcessingClick) {
      console.log('正在处理点击事件，忽略重复调用')
      return
    }
    
    try {
      isProcessingClick = true
      
      // 立即标记事件对象为已处理
      processedEventObjects.set(event, true)
      
      // 检查录制状态
      await checkRecordingStatus()
      
      if (!isRecording) {
        console.log('当前未在录制，忽略点击事件')
        return
      }
      
      const target = event.target as Element
      if (!target) {
        console.log('点击目标为空，忽略事件')
        return
      }
      
      // 使用浏览器原生时间戳创建更唯一的事件ID
      const eventId = `${event.clientX}_${event.clientY}_${event.timeStamp}_${target.tagName}_${target.id || target.className}`
      
      // 第三层防护：检查是否已经处理过这个事件ID
      if (processedEvents.has(eventId)) {
        console.log('事件ID已处理过，忽略重复事件:', eventId)
        return
      }
      
      // 第四层防护：防重复点击机制（更严格）
      const now = Date.now()
      const targetInfo = getElementInfo(target)
      
      // 如果相同目标在500ms内重复点击，忽略（进一步增加时间窗口）
      if (now - lastClickTime < 500 && lastClickTarget === targetInfo) {
        console.log('检测到重复点击，忽略:', targetInfo, '时间差:', now - lastClickTime, 'ms')
        return
      }
      
      lastClickTime = now
      lastClickTarget = targetInfo
      
      // 记录已处理的事件ID
      processedEvents.add(eventId)
      
      // 清理旧的事件记录（保留最近100个）
      if (processedEvents.size > 100) {
        const eventsArray = Array.from(processedEvents)
        processedEvents = new Set(eventsArray.slice(-50))
      }
      
      console.log('点击目标元素:', target.tagName, target.className, target.id)
      
      const step = createClickStep(event, target)
      console.log('创建的点击步骤:', step)
      await recordStep(step)
      
    } catch (error) {
      console.error('处理点击事件失败:', error)
    } finally {
      // 确保处理完成后重置状态
      isProcessingClick = false
    }
  }

  // 消息监听器
  chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
    console.log('Content Script 收到消息:', message)
    
    switch (message.type) {
      case 'START_RECORDING':
        console.log('收到开始录制消息，sessionId:', message.sessionId)
        isRecording = true
        sessionId = message.sessionId
        break
        
      case 'STOP_RECORDING':
        console.log('收到停止录制消息')
        isRecording = false
        sessionId = null
        break
        
      case 'CHECK_RECORDING_STATUS':
        console.log('收到立即状态检查消息')
        checkRecordingStatus()
        break
        
      default:
        console.log('未知消息类型:', message.type)
    }
    
    sendResponse({ success: true })
  })

  // 保持连接检查
  chrome.runtime.connect({ name: 'check-alive' }).onDisconnect.addListener(() => {
    console.log('Content script 连接断开')
  })

  // 初始化
  async function initialize() {
    console.log('Content Script 初始化开始')
    
    // 检查录制状态
    await checkRecordingStatus()
    
    // 设置事件监听器
    document.addEventListener('click', handleClick, true)
    console.log('鼠标点击监听器已启动')
    
    console.log('Content Script 初始化完成')
  }

  // 启动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize)
  } else {
    initialize()
  }

  console.log('Content script加载完成')
})() // 结束 IIFE
