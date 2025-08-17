#!/usr/bin/env node

/**
 * 创建简单图标的脚本
 * 生成基本的PNG图标文件
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 图标尺寸
const iconSizes = [16, 32, 48, 128]

// 创建一个最小的PNG文件
function createMinimalPNG(size) {
  // 这是一个最小的PNG文件，包含基本的PNG结构
  const width = size
  const height = size
  
  // PNG文件头 (8 bytes)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  ])
  
  // IHDR块 (25 bytes)
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)      // 宽度
  ihdrData.writeUInt32BE(height, 4)     // 高度
  ihdrData.writeUInt8(8, 8)             // 位深度
  ihdrData.writeUInt8(2, 9)             // 颜色类型 (RGB)
  ihdrData.writeUInt8(0, 10)            // 压缩方法
  ihdrData.writeUInt8(0, 11)            // 过滤方法
  ihdrData.writeUInt8(0, 12)            // 交错方法
  
  const ihdrChunk = createChunk('IHDR', ihdrData)
  
  // 创建一个简单的图像数据
  const imageData = createSimpleImageData(width, height)
  const idatChunk = createChunk('IDAT', imageData)
  
  // IEND块 (12 bytes)
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

// 计算CRC32
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
  const data = []
  
  for (let y = 0; y < height; y++) {
    data.push(0) // 过滤字节
    
    for (let x = 0; x < width; x++) {
      // 创建蓝色背景
      data.push(59, 130, 246) // #3B82F6
    }
  }
  
  return Buffer.from(data)
}

// 主函数
async function main() {
  console.log('🎨 开始创建图标文件...')
  
  const iconsDir = path.join(__dirname, '../public/icons')
  
  // 确保图标目录存在
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }
  
  // 为每个尺寸创建图标
  for (const size of iconSizes) {
    const iconPath = path.join(iconsDir, `icon${size}.png`)
    const pngData = createMinimalPNG(size)
    
    fs.writeFileSync(iconPath, pngData)
    console.log(`✅ 创建图标: icon${size}.png (${size}x${size})`)
  }
  
  console.log('🎉 所有图标创建完成！')
}

// 运行脚本
main().catch(console.error)
