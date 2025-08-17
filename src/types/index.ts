// 类型定义集合

/**
 * 操作步骤类型
 */
export interface OperationStep {
  id: string
  timestamp: number
  type: 'click' | 'input' | 'scroll' | 'navigation' | 'other'
  target: string
  screenshot?: string
  description: string
  metadata?: Record<string, any>
}

/**
 * 录制会话类型
 */
export interface RecordingSession {
  id: string
  startTime: number
  endTime?: number
  steps: OperationStep[]
  metadata: SessionMetadata
  status: 'recording' | 'completed' | 'paused' | 'cancelled'
}

/**
 * 会话元数据类型
 */
export interface SessionMetadata {
  url: string
  title: string
  userAgent: string
  viewport?: {
    width: number
    height: number
  }
  devicePixelRatio?: number
}

/**
 * 录制配置类型
 */
export interface RecordingConfig {
  autoRecord: boolean
  screenshotQuality: 'low' | 'medium' | 'high'
  maxStepsPerSession: number
  storageQuota: string
  captureMouseMovement: boolean
  captureKeyboardInput: boolean
  captureScrollEvents: boolean
  captureNavigationEvents: boolean
}

/**
 * 截图选项类型
 */
export interface ScreenshotOptions {
  quality: number
  format: 'png' | 'jpeg' | 'webp'
  area?: {
    x: number
    y: number
    width: number
    height: number
  }
  fullPage?: boolean
}

/**
 * 教程模板类型
 */
export interface TutorialTemplate {
  id: string
  name: string
  description: string
  format: 'markdown' | 'html' | 'pdf' | 'word'
  template: string
  variables: string[]
}

/**
 * 导出的教程类型
 */
export interface ExportedTutorial {
  id: string
  sessionId: string
  title: string
  content: string
  format: string
  createdAt: number
  fileSize: number
}

/**
 * 消息类型
 */
export interface ChromeMessage {
  type: string
  data?: any
  sessionId?: string
  tabId?: number
}

/**
 * 录制状态类型
 */
export interface RecordingStatus {
  isRecording: boolean
  sessionId: string | null
  stepCount: number
  startTime: number | null
  duration: number
}

/**
 * 存储项类型
 */
export interface StorageItem {
  key: string
  value: any
  timestamp: number
  expiresAt?: number
}

/**
 * 错误类型
 */
export interface RecordingError {
  code: string
  message: string
  details?: any
  timestamp: number
}

/**
 * 性能指标类型
 */
export interface PerformanceMetrics {
  memoryUsage: number
  cpuUsage: number
  eventProcessingTime: number
  screenshotGenerationTime: number
  storageOperationTime: number
}

/**
 * 用户设置类型
 */
export interface UserSettings {
  language: string
  theme: 'light' | 'dark' | 'auto'
  notifications: boolean
  autoSave: boolean
  backupEnabled: boolean
  privacyMode: boolean
}

/**
 * 扩展配置类型
 */
export interface ExtensionConfig {
  version: string
  permissions: string[]
  features: string[]
  experimental: boolean
  debug: boolean
}

/**
 * 事件监听器类型
 */
export interface EventListener {
  element: Element
  event: string
  handler: EventListener
  options?: boolean | AddEventListenerOptions
}

/**
 * DOM变化记录类型
 */
export interface DOMChangeRecord {
  type: 'added' | 'removed' | 'modified'
  target: Element
  oldValue?: string
  newValue?: string
  timestamp: number
}

/**
 * 网络请求记录类型
 */
export interface NetworkRequestRecord {
  url: string
  method: string
  status: number
  timestamp: number
  duration: number
  size: number
}

/**
 * 页面导航记录类型
 */
export interface NavigationRecord {
  from: string
  to: string
  timestamp: number
  type: 'push' | 'replace' | 'pop' | 'reload'
}

/**
 * 鼠标轨迹点类型
 */
export interface MouseTrackPoint {
  x: number
  y: number
  timestamp: number
  button?: number
}

/**
 * 键盘输入记录类型
 */
export interface KeyboardInputRecord {
  key: string
  code: string
  timestamp: number
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  metaKey: boolean
}

/**
 * 滚动记录类型
 */
export interface ScrollRecord {
  scrollX: number
  scrollY: number
  timestamp: number
  direction: 'horizontal' | 'vertical' | 'both'
}

/**
 * 表单提交记录类型
 */
export interface FormSubmitRecord {
  formId: string
  formAction: string
  formMethod: string
  formData: Record<string, any>
  timestamp: number
}

/**
 * 文件上传记录类型
 */
export interface FileUploadRecord {
  fileName: string
  fileSize: number
  fileType: string
  inputName: string
  timestamp: number
}

/**
 * 拖拽操作记录类型
 */
export interface DragDropRecord {
  type: 'dragstart' | 'drag' | 'drop'
  source: Element
  target?: Element
  data: any
  timestamp: number
}

/**
 * 触摸操作记录类型
 */
export interface TouchRecord {
  type: 'touchstart' | 'touchmove' | 'touchend'
  touches: Touch[]
  timestamp: number
}

/**
 * 手势操作记录类型
 */
export interface GestureRecord {
  type: 'pinch' | 'rotate' | 'swipe'
  direction: string
  distance: number
  timestamp: number
}

/**
 * 语音输入记录类型
 */
export interface VoiceInputRecord {
  text: string
  confidence: number
  duration: number
  timestamp: number
}

/**
 * 摄像头操作记录类型
 */
export interface CameraRecord {
  type: 'start' | 'stop' | 'capture'
  streamId: string
  timestamp: number
}

/**
 * 地理位置记录类型
 */
export interface GeolocationRecord {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

/**
 * 设备信息类型
 */
export interface DeviceInfo {
  platform: string
  userAgent: string
  screenResolution: string
  colorDepth: number
  pixelRatio: number
  orientation: string
  language: string
  timezone: string
}

/**
 * 浏览器信息类型
 */
export interface BrowserInfo {
  name: string
  version: string
  engine: string
  engineVersion: string
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  supportsWebGL: boolean
  supportsWebRTC: boolean
  supportsServiceWorker: boolean
}
