#!/usr/bin/env node

/**
 * 构建Chrome Extension的脚本
 * 将构建后的文件复制到扩展目录并生成必要的文件
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 扩展目录路径
const extensionDir = path.join(__dirname, '..', 'extension')

// 创建扩展目录
if (!fs.existsSync(extensionDir)) {
  fs.mkdirSync(extensionDir, { recursive: true })
}

console.log('🚀 开始构建Chrome Extension...')

// 复制构建文件
console.log('📁 复制构建文件...')
const distDir = path.join(__dirname, '..', 'dist')
const filesToCopy = [
  'background.js',
  'content.js',
  'popup.js',
  'index.css'
]

filesToCopy.forEach(file => {
  const srcPath = path.join(distDir, file)
  const destPath = path.join(extensionDir, file)
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath)
    console.log(`✅ 已复制: ${file}`)
  } else {
    console.log(`⚠️  文件不存在: ${file}`)
  }
})

console.log('✅ 构建文件复制完成')

// 复制manifest文件
console.log('📋 复制manifest文件...')
const manifestSrc = path.join(__dirname, '..', 'public', 'manifest.json')
const manifestDest = path.join(extensionDir, 'manifest.json')

if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, manifestDest)
  console.log('✅ manifest文件复制完成')
} else {
  console.log('❌ manifest文件不存在')
}

// 复制图标文件
console.log('🎨 复制图标文件...')
const iconsSrc = path.join(__dirname, '..', 'public', 'icons')
const iconsDest = path.join(extensionDir, 'icons')

if (fs.existsSync(iconsSrc)) {
  if (!fs.existsSync(iconsDest)) {
    fs.mkdirSync(iconsDest, { recursive: true })
  }
  
  const iconFiles = fs.readdirSync(iconsSrc)
  iconFiles.forEach(file => {
    const srcPath = path.join(iconsSrc, file)
    const destPath = path.join(iconsDest, file)
    fs.copyFileSync(srcPath, destPath)
  })
  console.log('✅ 图标文件复制完成')
} else {
  console.log('❌ 图标目录不存在')
}

// 复制侧边栏文件
console.log('🔧 复制侧边栏文件...')
const sidepanelFiles = [
  'sidepanel.html',
  'sidepanel.css',
  'sidepanel.js'
]

sidepanelFiles.forEach(file => {
  const srcPath = path.join(__dirname, '..', 'public', file)
  const destPath = path.join(extensionDir, file)
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath)
    console.log(`✅ 已复制侧边栏文件: ${file}`)
  } else {
    console.log(`⚠️  侧边栏文件不存在: ${file}`)
  }
})

console.log('✅ 侧边栏文件复制完成')

// 复制离屏文档文件
console.log('🔧 复制离屏文档文件...')
const offscreenFiles = [
  'offscreen.html',
  'offscreen.js'
]

offscreenFiles.forEach(file => {
  const srcPath = path.join(__dirname, '..', 'public', file)
  const destPath = path.join(extensionDir, file)
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath)
    console.log(`✅ 已复制离屏文档文件: ${file}`)
  } else {
    console.log(`⚠️  离屏文档文件不存在: ${file}`)
  }
})

console.log('✅ 离屏文档文件复制完成')

// 创建popup.html
console.log('🔧 创建popup.html...')
const popupHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>智能录制器</title>
    <link rel="stylesheet" href="index.css">
</head>
<body>
    <div id="app"></div>
    <script src="popup.js"></script>
</body>
</html>`

fs.writeFileSync(path.join(extensionDir, 'popup.html'), popupHTML)
console.log('✅ popup.html创建完成')

console.log('🎉 Chrome Extension构建完成！')

// 集成后处理脚本
console.log('🔄 开始后处理文件...')

// 需要处理的文件
const filesToProcess = [
  'background.js',
  'content.js',
  'popup.js'
]

// 清理ES模块语法的函数
function cleanESModuleSyntax(content) {
  let cleaned = content
  
  // 移除 export 语句
  cleaned = cleaned.replace(/export\s+{[^}]*};?/g, '')
  cleaned = cleaned.replace(/export\s+default\s+[^;]+;?/g, '')
  cleaned = cleaned.replace(/export\s+[^;]+;?/g, '')
  
  // 移除 import 语句
  cleaned = cleaned.replace(/import\s+{[^}]*}\s+from\s+['"][^'"]+['"];?/g, '')
  cleaned = cleaned.replace(/import\s+[^;]+from\s+['"][^'"]+['"];?/g, '')
  cleaned = cleaned.replace(/import\s+[^;]+;?/g, '')
  
  // 移除动态import
  cleaned = cleaned.replace(/import\s*\([^)]*\)/g, '')
  
  // 移除ES模块相关语法
  cleaned = cleaned.replace(/export\s*{/g, '')
  cleaned = cleaned.replace(/export\s*default/g, '')
  
  return cleaned
}

// 处理单个文件
function processFile(filename) {
  const filePath = path.join(extensionDir, filename)
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  文件不存在: ${filename}`)
    return
  }
  
  try {
    console.log(`🔧 处理文件: ${filename}`)
    
    // 读取文件内容
    let content = fs.readFileSync(filePath, 'utf8')
    
    // 清理ES模块语法
    const cleanedContent = cleanESModuleSyntax(content)
    
    // 写回文件
    fs.writeFileSync(filePath, cleanedContent)
    
    console.log(`✅ 文件处理完成: ${filename}`)
    
  } catch (error) {
    console.error(`❌ 处理文件失败 ${filename}:`, error.message)
  }
}

// 执行后处理
filesToProcess.forEach(processFile)

console.log('🎉 后处理完成！')
console.log('📝 现在可以重新加载扩展进行测试了')

console.log('📁 扩展文件位置:', extensionDir)
console.log('📋 下一步操作:')
console.log('   1. 打开Chrome浏览器')
console.log('   2. 访问 chrome://extensions/')
console.log('   3. 开启"开发者模式"')
console.log('   4. 点击"加载已解压的扩展程序"')
console.log('   5. 选择extension目录')
console.log('')
console.log('🔧 现在扩展使用官方的sidePanel API，点击扩展图标会自动打开侧边栏！')
console.log('🔄 后处理脚本已自动执行完成！')
