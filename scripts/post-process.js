#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 扩展目录路径
const extensionDir = path.join(__dirname, '..', 'extension')

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
  cleaned = cleaned.replace(/import\s*\(\s*['"][^'"]+['"]\s*\)/g, 'Promise.resolve()')
  
  // 移除ES模块相关的代码
  cleaned = cleaned.replace(/Object\.defineProperty\(exports,\s*['"]__esModule['"],\s*{\s*value:\s*true\s*}\);/g, '')
  
  // 移除模块导出相关代码
  cleaned = cleaned.replace(/if\s*\(\s*typeof\s+module\s*!==\s*['"]undefined['"]\s*&&\s*module\.exports\s*\)\s*\{[^}]*\}/g, '')
  
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
    fs.writeFileSync(filePath, cleanedContent, 'utf8')
    
    console.log(`✅ 文件处理完成: ${filename}`)
    
  } catch (error) {
    console.error(`❌ 处理文件 ${filename} 时出错:`, error.message)
  }
}

// 主函数
async function main() {
  console.log('🚀 开始后处理文件...')
  
  // 检查扩展目录是否存在
  if (!fs.existsSync(extensionDir)) {
    console.error(`❌ 扩展目录不存在: ${extensionDir}`)
    console.log('请先运行 pnpm run build:extension')
    return
  }
  
  // 处理所有文件
  for (const filename of filesToProcess) {
    processFile(filename)
  }
  
  console.log('🎉 后处理完成！')
  console.log('📝 现在可以重新加载扩展进行测试了')
}

// 运行主函数
main().catch(console.error)
