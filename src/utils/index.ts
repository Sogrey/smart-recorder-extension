// 工具函数集合

/**
 * 节流函数 - 限制函数执行频率
 * @param func 要执行的函数
 * @param delay 延迟时间（毫秒）
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

/**
 * 防抖函数 - 延迟执行函数，如果在延迟期间再次调用则重新计时
 * @param func 要执行的函数
 * @param delay 延迟时间（毫秒）
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 格式化时间
 * @param timestamp 时间戳
 * @param format 格式字符串
 */
export function formatTime(timestamp: number, format: string = 'HH:mm:ss'): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  
  return format
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 深拷贝对象
 * @param obj 要拷贝的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  
  return obj
}

/**
 * 检查是否为有效的URL
 * @param url 要检查的URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 获取元素的选择器路径
 * @param element DOM元素
 */
export function getElementPath(element: Element): string {
  const path: string[] = []
  let current = element
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase()
    
    if (current.id) {
      selector = `#${current.id}`
    } else if (current.className) {
      const classes = current.className.split(' ').filter(c => c.trim())
      if (classes.length > 0) {
        selector += `.${classes[0]}`
      }
    }
    
    path.unshift(selector)
    current = current.parentElement!
  }
  
  return path.join(' > ')
}

/**
 * 等待指定时间
 * @param ms 等待时间（毫秒）
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 随机延迟
 * @param min 最小延迟时间（毫秒）
 * @param max 最大延迟时间（毫秒）
 */
export function randomDelay(min: number = 100, max: number = 500): Promise<void> {
  const delay = Math.random() * (max - min) + min
  return sleep(delay)
}

/**
 * 检查浏览器环境
 */
export const isChrome = typeof chrome !== 'undefined' && !!chrome.runtime
export const isFirefox = typeof (window as any).browser !== 'undefined'
export const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

/**
 * 获取浏览器类型
 */
export function getBrowserType(): 'chrome' | 'firefox' | 'safari' | 'unknown' {
  if (isChrome) return 'chrome'
  if (isFirefox) return 'firefox'
  if (isSafari) return 'safari'
  return 'unknown'
}

/**
 * 检查是否为开发环境
 */
export const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * 日志记录器
 */
export class Logger {
  private prefix: string
  
  constructor(prefix: string = 'SmartRecorder') {
    this.prefix = prefix
  }
  
  log(...args: any[]) {
    if (isDevelopment) {
      console.log(`[${this.prefix}]`, ...args)
    }
  }
  
  warn(...args: any[]) {
    console.warn(`[${this.prefix}]`, ...args)
  }
  
  error(...args: any[]) {
    console.error(`[${this.prefix}]`, ...args)
  }
  
  info(...args: any[]) {
    console.info(`[${this.prefix}]`, ...args)
  }
}

/**
 * 默认日志记录器
 */
export const logger = new Logger()
