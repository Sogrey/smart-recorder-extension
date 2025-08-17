#!/usr/bin/env node

/**
 * 图标生成脚本
 * 将SVG图标转换为不同尺寸的PNG图标
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 图标尺寸配置
const iconSizes = [16, 32, 48, 128]

// 创建简单的PNG图标（使用Canvas API）
function createPNGIcon(size) {
  // 创建一个简单的Canvas来生成PNG
  const canvas = new OffscreenCanvas(size, size)
  const ctx = canvas.getContext('2d')
  
  // 设置背景
  ctx.fillStyle = '#3B82F6'
  ctx.fillRect(0, 0, size, size)
  
  // 绘制录制按钮
  const centerX = size / 2
  const centerY = size / 2
  const buttonRadius = size * 0.2
  
  ctx.fillStyle = '#EF4444'
  ctx.beginPath()
  ctx.arc(centerX, centerY, buttonRadius, 0, 2 * Math.PI)
  ctx.fill()
  
  // 绘制录制指示点
  const indicatorRadius = size * 0.06
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(centerX, centerY, indicatorRadius, 0, 2 * Math.PI)
  ctx.fill()
  
  // 转换为PNG
  return canvas.convertToBlob({ type: 'image/png' })
}

// 生成所有尺寸的图标
async function generateIcons() {
  console.log('🎨 开始生成图标文件...')
  
  const iconsDir = path.join(__dirname, '../public/icons')
  
  // 确保图标目录存在
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }
  
  // 生成简单的PNG图标（使用Base64编码的简单PNG）
  for (const size of iconSizes) {
    const iconPath = path.join(iconsDir, `icon${size}.png`)
    
    // 创建一个简单的PNG文件（最小化的PNG格式）
    const pngData = createSimplePNG(size)
    fs.writeFileSync(iconPath, pngData)
    
    console.log(`✅ 生成图标: icon${size}.png (${size}x${size})`)
  }
  
  console.log('🎉 所有图标生成完成！')
}

// 创建简单的PNG文件（最小化的PNG格式）
function createSimplePNG(size) {
  // 这是一个最小化的PNG文件，包含基本的PNG头部和IDAT块
  const width = size
  const height = size
  
  // PNG文件头
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  ])
  
  // IHDR块（图像头信息）
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)      // 宽度
  ihdrData.writeUInt32BE(height, 4)     // 高度
  ihdrData.writeUInt8(8, 8)             // 位深度
  ihdrData.writeUInt8(2, 9)             // 颜色类型 (RGB)
  ihdrData.writeUInt8(0, 10)            // 压缩方法
  ihdrData.writeUInt8(0, 11)            // 过滤方法
  ihdrData.writeUInt8(0, 12)            // 交错方法
  
  const ihdrChunk = createChunk('IHDR', ihdrData)
  
  // IDAT块（图像数据）
  const idatData = createSimpleImageData(width, height)
  const idatChunk = createChunk('IDAT', idatData)
  
  // IEND块（文件结束）
  const iendChunk = createChunk('IEND', Buffer.alloc(0))
  
  // 组合所有块
  return Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk])
}

// 创建PNG块
function createChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  
  const typeBuffer = Buffer.from(type, 'ascii')
  const crc = calculateCRC32(Buffer.concat([typeBuffer, data]))
  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc, 0)
  
  return Buffer.concat([length, typeBuffer, data, crcBuffer])
}

// 计算CRC32校验和
function calculateCRC32(buffer) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buffer.length; i++) {
    crc = crc ^ buffer[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1)
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// 创建简单的图像数据
function createSimpleImageData(width, height) {
  // 创建一个简单的蓝色背景图像
  const data = []
  
  for (let y = 0; y < height; y++) {
    // 每行开始添加过滤字节
    data.push(0) // 无过滤
    
    for (let x = 0; x < width; x++) {
      // 简单的渐变效果
      const r = Math.floor((x / width) * 255)
      const g = Math.floor((y / height) * 255)
      const b = 255
      
      data.push(r, g, b)
    }
  }
  
  // 压缩数据（这里使用简单的压缩）
  return Buffer.from(data)
}

// 运行图标生成
generateIcons().catch(console.error)
