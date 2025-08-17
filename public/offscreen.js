// 智能录制器 - 离屏文档脚本
// 负责处理截图压缩和优化

console.log('智能录制器离屏文档已加载')

// 点击位置标记管理
class ClickMarkerManager {
  constructor() {
    this.container = document.getElementById('click-markers-container')
    this.markers = new Map()
    console.log('✅ 点击标记管理器已初始化')
  }
  
  // 添加点击位置标记
  addMarker(clickPosition, markerId) {
    try {
      // 移除已存在的标记
      this.removeMarker(markerId)
      
      // 创建新的标记
      const marker = document.createElement('div')
      marker.className = 'click-marker'
      marker.id = `marker-${markerId}`
      marker.style.left = `${clickPosition.x - 20}px` // 居中显示
      marker.style.top = `${clickPosition.y - 20}px`
      
      // 添加到容器
      this.container.appendChild(marker)
      this.markers.set(markerId, marker)
      
      console.log('✅ 点击位置标记已添加:', clickPosition, 'ID:', markerId)
      return true
    } catch (error) {
      console.error('❌ 添加点击位置标记失败:', error)
      return false
    }
  }
  
  // 移除点击位置标记
  removeMarker(markerId) {
    try {
      const existingMarker = this.markers.get(markerId)
      if (existingMarker) {
        existingMarker.remove()
        this.markers.delete(markerId)
        console.log('✅ 点击位置标记已移除:', markerId)
      }
    } catch (error) {
      console.error('❌ 移除点击位置标记失败:', error)
    }
  }
  
  // 清除所有标记
  clearAllMarkers() {
    try {
      this.container.innerHTML = ''
      this.markers.clear()
      console.log('✅ 所有点击位置标记已清除')
    } catch (error) {
      console.error('❌ 清除所有标记失败:', error)
    }
  }
}

// 创建标记管理器实例
const markerManager = new ClickMarkerManager()

// 验证base64图片数据的正确性
function validateBase64Image(dataUrl) {
  try {
    console.log('🔍 开始验证base64图片数据...')
    
    // 检查基本格式
    if (!dataUrl || typeof dataUrl !== 'string') {
      throw new Error('数据不是字符串类型')
    }
    
    if (!dataUrl.startsWith('data:image/')) {
      throw new Error('不是有效的图片data URL格式')
    }
    
    // 提取MIME类型和base64数据
    const parts = dataUrl.split(',')
    if (parts.length !== 2) {
      throw new Error('data URL格式不正确')
    }
    
    const mimeType = parts[0].split(':')[1].split(';')[0]
    const base64Data = parts[1]
    
    console.log('📋 MIME类型:', mimeType)
    console.log('📊 Base64数据长度:', base64Data.length)
    
    // 验证MIME类型
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType)) {
      throw new Error(`不支持的图片格式: ${mimeType}`)
    }
    
    // 验证base64数据长度（至少应该有数据）
    if (base64Data.length < 100) {
      throw new Error('Base64数据太短，可能不是有效的图片')
    }
    
    // 验证base64字符的有效性
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    if (!base64Regex.test(base64Data)) {
      throw new Error('Base64数据包含无效字符')
    }
    
    console.log('✅ Base64图片数据验证通过')
    return {
      isValid: true,
      mimeType: mimeType,
      dataLength: base64Data.length,
      totalLength: dataUrl.length
    }
    
  } catch (error) {
    console.error('❌ Base64图片数据验证失败:', error.message)
    return {
      isValid: false,
      error: error.message
    }
  }
}

// 图片压缩和标记函数
async function compressImage(dataUrl, quality = 0.8, clickPosition = null) {
  try {
    console.log('🔄 开始图片压缩和标记流程...')
    
    // 验证输入参数
    if (!dataUrl || typeof dataUrl !== 'string') {
      throw new Error('无效的图片数据')
    }
    
    if (quality < 0 || quality > 1) {
      throw new Error('无效的压缩质量参数')
    }
    
    console.log('📊 压缩参数:', { quality, originalSize: dataUrl.length, clickPosition })
    
    // 验证base64图片数据
    const validation = validateBase64Image(dataUrl)
    if (!validation.isValid) {
      throw new Error(`图片数据验证失败: ${validation.error}`)
    }
    
    console.log('✅ 输入图片数据验证通过:', {
      mimeType: validation.mimeType,
      dataLength: validation.dataLength,
      totalLength: validation.totalLength
    })
    
    // 创建图片对象
    console.log('🖼️ 创建ImageBitmap...')
    const response = await fetch(dataUrl)
    if (!response.ok) {
      throw new Error(`获取图片失败: ${response.status} ${response.statusText}`)
    }
    
    const blob = await response.blob()
    console.log('📦 图片blob大小:', blob.size, '字节')
    
    const img = await createImageBitmap(blob)
    console.log('🖼️ ImageBitmap创建成功，尺寸:', img.width, 'x', img.height)
    
    // 创建Canvas
    console.log('🎨 创建Canvas...')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('无法获取Canvas 2D上下文')
    }
    
    // 设置Canvas尺寸
    canvas.width = img.width
    canvas.height = img.height
    console.log('📐 Canvas尺寸设置:', canvas.width, 'x', canvas.height)
    
    // 绘制图片到Canvas
    console.log('🎨 绘制图片到Canvas...')
    ctx.drawImage(img, 0, 0)
    
    // 如果有点击位置，绘制标记
    if (clickPosition && clickPosition.x !== undefined && clickPosition.y !== undefined) {
      console.log('📍 绘制点击位置标记:', clickPosition)
      
      // 在Canvas上绘制标记（仅圆圈，去掉红色矩形框）
      try {
        // 1. 绘制半透明橙色外圈（标记点击位置）
        ctx.beginPath()
        ctx.arc(clickPosition.x, clickPosition.y, 15, 0, 2 * Math.PI)
        ctx.fillStyle = 'rgba(255, 165, 0, 0.7)' // 半透明橙色
        ctx.fill()
        
        // 2. 绘制白色内圈
        ctx.beginPath()
        ctx.arc(clickPosition.x, clickPosition.y, 8, 0, 2 * Math.PI)
        ctx.fillStyle = 'white'
        ctx.fill()
        
        // 3. 绘制橙色中心点
        ctx.beginPath()
        ctx.arc(clickPosition.x, clickPosition.y, 4, 0, 2 * Math.PI)
        ctx.fillStyle = '#ff6600'
        ctx.fill()
        
        console.log('✅ 点击位置标记已绘制（仅圆圈）')
      } catch (error) {
        console.error('❌ Canvas绘制标记失败:', error)
      }
    }
    
    // 压缩图片
    console.log('🗜️ 开始压缩图片...')
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('✅ Canvas压缩成功，blob大小:', blob.size, '字节')
            console.log('📊 Blob类型:', blob.type)
            
            // 转换为base64
            const reader = new FileReader()
            reader.onloadend = () => {
              const result = reader.result
              console.log('✅ 转换为base64成功，大小:', result?.length || 0, '字符')
              console.log('📊 Base64前缀:', result?.substring(0, 50))
              
              // 验证输出结果
              if (result && typeof result === 'string' && result.startsWith('data:image/')) {
                console.log('✅ 输出base64数据格式验证通过')
                console.log('📊 最终返回数据长度:', result.length)
                resolve(result)
              } else {
                console.error('❌ 输出base64数据格式不正确')
                console.error('📊 实际结果类型:', typeof result)
                console.error('📊 实际结果前缀:', result?.substring(0, 100))
                reject(new Error('输出数据格式不正确'))
              }
            }
            reader.onerror = (error) => {
              console.error('❌ FileReader读取失败:', error)
              reject(new Error('FileReader读取失败'))
            }
            reader.readAsDataURL(blob)
          } else {
            console.error('❌ Canvas压缩失败，blob为空')
            reject(new Error('Canvas压缩失败'))
          }
        },
        'image/jpeg',
        quality
      )
    })
  } catch (error) {
    console.error('❌ 图片压缩过程中出错:', error)
    throw error // 重新抛出错误，让调用者处理
  }
}

// 监听来自background script的消息（统一使用runtime API）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('离屏文档收到消息:', message, '来自:', sender?.id || 'unknown')

  // 只处理来自background script的压缩消息
  if (message.type === 'compress-image' && sender?.id === chrome.runtime.id) {
    console.log('🔄 开始处理图片压缩请求...')

    try {
      const { dataUrl, quality, clickPosition } = message.data
      console.log('📊 图片压缩参数:', { quality, dataUrlLength: dataUrl?.length || 0, clickPosition })

      if (!dataUrl) {
        console.error('❌ 缺少图片数据')
        sendResponse({
          success: false,
          error: '缺少图片数据'
        })
        return true
      }

      // 验证base64数据格式
      if (!dataUrl.startsWith('data:image/')) {
        console.error('❌ 图片数据格式不正确，不是有效的base64图片')
        sendResponse({
          success: false,
          error: '图片数据格式不正确'
        })
        return true
      }

      console.log('✅ 图片数据格式验证通过')

      // 压缩图片（包含点击位置标记）
      compressImage(dataUrl, quality, clickPosition)
        .then(compressedDataUrl => {
          console.log('✅ 图片压缩完成，压缩后大小:', compressedDataUrl?.length || 0)

          // 验证压缩后的数据
          if (!compressedDataUrl || !compressedDataUrl.startsWith('data:image/')) {
            console.error('❌ 压缩后的数据格式不正确')
            console.error('📊 实际数据:', compressedDataUrl?.substring(0, 100))
            sendResponse({
              success: false,
              error: '压缩后的数据格式不正确'
            })
            return
          }

          const response = {
            success: true,
            compressedDataUrl: compressedDataUrl,
            originalSize: dataUrl.length,
            compressedSize: compressedDataUrl.length,
            compressionRatio: ((1 - compressedDataUrl.length / dataUrl.length) * 100).toFixed(1)
          }
          console.log('📤 发送压缩成功响应:', response)
          console.log('📊 响应数据大小:', JSON.stringify(response).length)
          console.log('📊 响应数据结构:', Object.keys(response))
          console.log('📊 响应数据详情:', {
            success: response.success,
            hasCompressedDataUrl: !!response.compressedDataUrl,
            compressedDataUrlType: typeof response.compressedDataUrl,
            compressedDataUrlLength: response.compressedDataUrl?.length || 0,
            compressedDataUrlPrefix: response.compressedDataUrl?.substring(0, 50) || 'undefined'
          })
          
          // 确保响应对象正确发送
          try {
            sendResponse(response)
            console.log('✅ 响应已发送到background script')
          } catch (error) {
            console.error('❌ 发送响应失败:', error)
            // 尝试发送简化响应
            sendResponse({
              success: true,
              compressedDataUrl: compressedDataUrl,
              error: '响应发送异常，但数据已处理'
            })
          }
        })
        .catch(error => {
          console.error('❌ 图片压缩过程中出错:', error)
          const response = {
            success: false,
            error: error.message || '图片压缩失败'
          }
          console.log('📤 发送压缩失败响应:', response)
          sendResponse(response)
        })

    } catch (error) {
      console.error('❌ 处理图片压缩请求时出错:', error)
      const response = {
        success: false,
        error: error.message || '处理请求失败'
      }
      console.log('📤 发送错误响应:', response)
      sendResponse(response)
    }

    return true // 保持消息通道开放
  }
  
  if (message.type === 'ping') {
    console.log('🔄 收到ping请求，响应正常状态')
    sendResponse({ success: true, message: '离屏文档正常运行' })
    return true
  }
  
  if (message.type === 'add-click-marker') {
    console.log('📍 收到添加点击标记请求:', message.data)
    try {
      const { clickPosition, markerId } = message.data
      if (clickPosition && markerId) {
        const success = markerManager.addMarker(clickPosition, markerId)
        sendResponse({ 
          success: success, 
          message: success ? '点击标记已添加' : '添加点击标记失败' 
        })
      } else {
        sendResponse({ success: false, error: '缺少点击位置或标记ID' })
      }
    } catch (error) {
      console.error('❌ 处理添加点击标记请求失败:', error)
      sendResponse({ success: false, error: error.message })
    }
    return true
  }
  
  if (message.type === 'clear-click-markers') {
    console.log('🧹 收到清除点击标记请求')
    try {
      markerManager.clearAllMarkers()
      sendResponse({ success: true, message: '所有点击标记已清除' })
    } catch (error) {
      console.error('❌ 清除点击标记失败:', error)
      sendResponse({ success: false, error: error.message })
    }
    return true
  }
  
  // 处理未知消息类型
  console.log('⚠️ 收到未知消息类型:', message.type)
  sendResponse({ success: false, error: '未知消息类型' })
  return true
})

// 监听来自background script的连接
chrome.runtime.onConnect.addListener((port) => {
  console.log('离屏文档收到连接:', port.name)
  
  if (port.name === 'screenshot-marking') {
    port.onMessage.addListener(async (message) => {
      console.log('🔄 通过连接收到图片压缩请求:', message)
      
      try {
        const { dataUrl, quality, clickPosition } = message.data
        console.log('📊 图片压缩参数:', { quality, dataUrlLength: dataUrl?.length || 0, clickPosition })

        if (!dataUrl) {
          console.error('❌ 缺少图片数据')
          port.postMessage({
            success: false,
            error: '缺少图片数据'
          })
          return
        }

        // 验证base64数据格式
        if (!dataUrl.startsWith('data:image/')) {
          console.error('❌ 图片数据格式不正确，不是有效的base64图片')
          port.postMessage({
            success: false,
            error: '图片数据格式不正确'
          })
          return
        }

        console.log('✅ 图片数据格式验证通过')

        // 压缩图片（包含点击位置标记）
        try {
          const compressedDataUrl = await compressImage(dataUrl, quality, clickPosition)
          console.log('✅ 图片压缩完成，压缩后大小:', compressedDataUrl?.length || 0)

          // 验证压缩后的数据
          if (!compressedDataUrl || !compressedDataUrl.startsWith('data:image/')) {
            console.error('❌ 压缩后的数据格式不正确')
            console.error('📊 实际数据:', compressedDataUrl?.substring(0, 100))
            port.postMessage({
              success: false,
              error: '压缩后的数据格式不正确'
            })
            return
          }

          const response = {
            success: true,
            compressedDataUrl: compressedDataUrl,
            originalSize: dataUrl.length,
            compressedSize: compressedDataUrl.length,
            compressionRatio: ((1 - compressedDataUrl.length / dataUrl.length) * 100).toFixed(1)
          }
          console.log('📤 通过连接发送压缩成功响应:', response)
          console.log('📊 响应数据大小:', JSON.stringify(response).length)
          console.log('📊 响应数据结构:', Object.keys(response))
          console.log('📊 响应数据详情:', {
            success: response.success,
            hasCompressedDataUrl: !!response.compressedDataUrl,
            compressedDataUrlType: typeof response.compressedDataUrl,
            compressedDataUrlLength: response.compressedDataUrl?.length || 0,
            compressedDataUrlPrefix: response.compressedDataUrl?.substring(0, 50) || 'undefined'
          })
          
          port.postMessage(response)
          console.log('✅ 响应已通过连接发送到background script')
          
        } catch (error) {
          console.error('❌ 图片压缩过程中出错:', error)
          port.postMessage({
            success: false,
            error: error.message || '图片压缩失败'
          })
        }

      } catch (error) {
        console.error('❌ 处理图片压缩请求时出错:', error)
        port.postMessage({
          success: false,
          error: error.message || '处理请求失败'
        })
      }
    })
  }
})

// 保持连接检查
chrome.runtime.connect({ name: 'offscreen-keep-alive' }).onDisconnect.addListener(() => {
  console.log('离屏文档连接断开')
})
