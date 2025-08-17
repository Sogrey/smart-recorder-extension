import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'

export interface OperationStep {
  id: string
  timestamp: number
  type: 'click' | 'input' | 'scroll' | 'navigation'
  target: string
  screenshot?: string
  description: string
  metadata?: Record<string, any>
}

export interface RecordingSession {
  id: string
  startTime: number
  endTime?: number
  steps: OperationStep[]
  metadata: {
    url: string
    title: string
    userAgent: string
  }
}

export const useRecordingStore = defineStore('recording', () => {
  // 状态
  const isRecording = ref(false)
  const currentSession = ref<RecordingSession | null>(null)
  const sessions = ref<RecordingSession[]>([])

  // 开始录制
  const startRecording = async () => {
    try {
      // 获取当前标签页信息
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab.url || !tab.id) {
        throw new Error('无法获取当前标签页信息')
      }

      // 创建新的录制会话
      const session: RecordingSession = {
        id: generateId(),
        startTime: Date.now(),
        steps: [],
        metadata: {
          url: tab.url,
          title: tab.title || '未知页面',
          userAgent: navigator.userAgent
        }
      }

      currentSession.value = session
      isRecording.value = true

      // 通知content script开始录制
      await chrome.tabs.sendMessage(tab.id, {
        type: 'START_RECORDING',
        sessionId: session.id
      })

      // 保存到本地存储
      await saveSession(session)

      console.log('录制已开始:', session.id)
    } catch (error) {
      console.error('开始录制失败:', error)
      throw error
    }
  }

  // 停止录制
  const stopRecording = async () => {
    try {
      if (!currentSession.value) {
        throw new Error('没有正在进行的录制会话')
      }

      // 获取当前标签页信息
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (tab.id) {
        // 通知content script停止录制
        await chrome.tabs.sendMessage(tab.id, {
          type: 'STOP_RECORDING'
        })
      }

      // 完成会话
      currentSession.value.endTime = Date.now()
      const completedSession = { ...currentSession.value }
      
      // 保存到会话列表
      sessions.value.push(completedSession)
      await saveSessions()

      // 重置状态
      currentSession.value = null
      isRecording.value = false

      console.log('录制已停止:', completedSession.id)
      return completedSession
    } catch (error) {
      console.error('停止录制失败:', error)
      throw error
    }
  }

  // 添加操作步骤
  const addStep = (step: Omit<OperationStep, 'id' | 'timestamp'>) => {
    if (!currentSession.value || !isRecording.value) {
      return
    }

    const newStep: OperationStep = {
      ...step,
      id: generateId(),
      timestamp: Date.now()
    }

    currentSession.value.steps.push(newStep)
    
    // 实时保存
    saveSession(currentSession.value)
  }

  // 获取会话列表
  const getSessions = async () => {
    try {
      const result = await chrome.storage.local.get('recording_sessions')
      sessions.value = result.recording_sessions || []
      return sessions.value
    } catch (error) {
      console.error('获取会话列表失败:', error)
      return []
    }
  }

  // 删除会话
  const deleteSession = async (sessionId: string) => {
    try {
      sessions.value = sessions.value.filter(s => s.id !== sessionId)
      await saveSessions()
      console.log('会话已删除:', sessionId)
    } catch (error) {
      console.error('删除会话失败:', error)
      throw error
    }
  }

  // 保存单个会话
  const saveSession = async (session: RecordingSession) => {
    try {
      await chrome.storage.local.set({
        [`recording_session_${session.id}`]: session
      })
    } catch (error) {
      console.error('保存会话失败:', error)
    }
  }

  // 保存会话列表
  const saveSessions = async () => {
    try {
      await chrome.storage.local.set({
        recording_sessions: sessions.value
      })
    } catch (error) {
      console.error('保存会话列表失败:', error)
    }
  }

  // 生成唯一ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 初始化时加载会话列表
  const initialize = async () => {
    await getSessions()
  }

  return {
    // 状态
    isRecording: readonly(isRecording),
    currentSession: readonly(currentSession),
    sessions: readonly(sessions),
    
    // 方法
    startRecording,
    stopRecording,
    addStep,
    getSessions,
    deleteSession,
    initialize
  }
})
