// 侧边栏JavaScript逻辑
console.log('侧边栏脚本已加载')

class SidePanelController {
    constructor() {
        this.isRecording = false
        this.sessionId = null
        this.startTime = null
        this.steps = []
        this.recordingInterval = null
        this.autoScrollEnabled = true // 默认启用自动滚动
        
        this.initialize()
    }
    
    initialize() {
        console.log('初始化侧边栏控制器')
        this.bindEvents()
        this.loadRecordingStatus()
        
        // 监听来自background script的消息
        this.setupMessageListener()
        
        // 设置滚动监听器，检测用户滚动行为
        this.setupScrollListener()
    }
    
    // 设置滚动监听器
    setupScrollListener() {
        const stepsSection = document.querySelector('.steps-section')
        if (stepsSection) {
            let scrollTimeout
            stepsSection.addEventListener('scroll', () => {
                // 清除之前的定时器
                clearTimeout(scrollTimeout)
                
                // 设置新的定时器，检测滚动停止
                scrollTimeout = setTimeout(() => {
                    const isAtBottom = stepsSection.scrollTop + stepsSection.clientHeight >= stepsSection.scrollHeight - 10
                    if (isAtBottom) {
                        console.log('📍 用户已滚动到底部，启用自动滚动')
                        this.autoScrollEnabled = true
                    } else {
                        console.log('📍 用户已离开底部，禁用自动滚动')
                        this.autoScrollEnabled = false
                    }
                }, 150) // 150ms后检测滚动状态
            })
        }
    }
    
    setupMessageListener() {
        // 使用chrome.runtime.onMessage监听来自background的消息
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('侧边栏收到runtime消息:', message, '来自:', sender)
            this.handleMessage(message, sender, sendResponse)
        })
        
        console.log('侧边栏消息监听器已设置')
    }
    
    bindEvents() {
        // 开始/停止录制按钮
        const startBtn = document.getElementById('start-recording-btn')
        if (startBtn) {
            startBtn.addEventListener('click', () => this.toggleRecording())
        }
        
        // 清空步骤按钮
        const clearBtn = document.getElementById('clear-steps-btn')
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearSteps())
        }
        
        // 查看教程按钮
        const tutorialBtn = document.getElementById('view-tutorial-btn')
        if (tutorialBtn) {
            tutorialBtn.addEventListener('click', () => this.viewTutorial())
        }
        
        // 设置按钮
        const settingsBtn = document.getElementById('settings-btn')
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings())
        }
    }
    
    handleMessage(message, sender, sendResponse) {
        console.log('侧边栏处理消息:', message.type, '数据:', message.data)
        
        switch (message.type) {
            case 'RECORDING_STEP_ADDED':
                console.log('收到录制步骤:', message.data)
                this.addStep(message.data)
                break
            case 'RECORDING_STARTED':
                console.log('收到开始录制消息:', message.data)
                this.onRecordingStarted(message.data)
                break
            case 'RECORDING_STOPPED':
                console.log('收到停止录制消息:', message.data)
                this.onRecordingStopped(message.data)
                break
            case 'SCREENSHOT_UPDATED':
                console.log('收到截图更新消息:', message.data)
                this.updateStepScreenshot(message.data)
                break
            case 'RECORDING_STEPS_UPDATED':
                console.log('收到步骤更新消息:', message.data)
                this.updateStepsFromMessage(message.data)
                break
            case 'RECORDING_STEPS_CLEARED':
                console.log('收到步骤清空消息')
                this.steps = []
                this.updateStepsUI()
                this.updateStepCount()
                break
            default:
                console.log('未知消息类型:', message.type)
        }
        
        if (sendResponse) {
            sendResponse({ success: true })
        }
    }
    
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording()
        } else {
            this.startRecording()
        }
    }
    
    async startRecording() {
        console.log('开始录制')
        
        this.isRecording = true
        this.startTime = Date.now()
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // 更新UI
        this.updateUI()
        
        // 开始计时器
        this.startTimer()
        
        // 通知background script开始录制
        this.notifyBackground('START_RECORDING', { sessionId: this.sessionId })
        
        // 保存录制状态
        await this.saveRecordingStatus()
        
        console.log('录制已开始，会话ID:', this.sessionId)
    }
    
    async stopRecording() {
        console.log('停止录制')
        
        this.isRecording = false
        
        // 停止计时器
        this.stopTimer()
        
        // 更新UI
        this.updateUI()
        
        // 通知background script停止录制
        this.notifyBackground('STOP_RECORDING', { sessionId: this.sessionId })
        
        // 保存录制状态
        await this.saveRecordingStatus()
        
        // 保存录制数据
        await this.saveRecordingData()
        
        console.log('录制已停止')
    }
    
    startTimer() {
        this.recordingInterval = setInterval(() => {
            this.updateTimer()
        }, 1000)
    }
    
    stopTimer() {
        if (this.recordingInterval) {
            clearInterval(this.recordingInterval)
            this.recordingInterval = null
        }
    }
    
    updateTimer() {
        if (!this.startTime) return
        
        const elapsed = Date.now() - this.startTime
        const duration = this.formatDuration(elapsed)
        
        const durationElement = document.getElementById('recording-duration')
        if (durationElement) {
            durationElement.textContent = duration
        }
    }
    
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
        } else {
            return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
        }
    }
    
    addStep(stepData) {
        console.log('添加录制步骤:', stepData)
        
        const step = {
            ...stepData,
            timestamp: Date.now(),
            stepNumber: this.steps.length + 1
        }
        
        this.steps.push(step)
        this.updateStepsUI()
        this.updateStepCount()
        
        // 确保新步骤添加后立即滚动到最新位置
        this.scrollToLatestStep()
    }
    
    updateStepsUI() {
        const stepsList = document.getElementById('steps-list')
        const emptySteps = document.getElementById('empty-steps')
        const clearBtn = document.getElementById('clear-steps-btn')
        
        if (!stepsList || !emptySteps || !clearBtn) return
        
        if (this.steps.length === 0) {
            stepsList.style.display = 'none'
            emptySteps.style.display = 'block'
            clearBtn.style.display = 'none'
        } else {
            stepsList.style.display = 'block'
            emptySteps.style.display = 'none'
            clearBtn.style.display = 'block'
            
            // 清空现有步骤
            stepsList.innerHTML = ''
            
            // 添加新步骤
            this.steps.forEach(step => {
                const stepElement = this.createStepElement(step)
                stepsList.appendChild(stepElement)
            })
            
            // 注意：滚动功能已在 addStep 方法中处理，避免重复调用
            // 但为了确保滚动正常工作，在DOM更新后再次检查
            if (this.steps.length > 0) {
                // 延迟检查滚动状态
                setTimeout(() => {
                    const stepsSection = document.querySelector('.steps-section')
                    if (stepsSection) {
                        const isAtBottom = stepsSection.scrollTop + stepsSection.clientHeight >= stepsSection.scrollHeight - 20
                        if (!isAtBottom) {
                            console.log('🔄 DOM更新后检测到不在底部，触发额外滚动')
                            this.scrollToLatestStep()
                        }
                    }
                }, 300)
            }
        }
    }
    
    createStepElement(step) {
        const stepElement = document.createElement('div')
        stepElement.className = 'step-item'
        
        const time = new Date(step.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
        
        // 显示点击位置信息
        let positionInfo = ''
        if (step.position) {
            positionInfo = ` (${step.position.x}, ${step.position.y})`
        }
        
        // 截图状态显示
        let screenshotInfo = ''
        if (step.hasScreenshot && step.screenshot) {
            screenshotInfo = `
                <div class="screenshot-display">
                    <span class="screenshot-badge">📸 已截图</span>
                    <img src="${step.screenshot}" alt="截图" class="step-screenshot" onclick="this.parentElement.parentElement.parentElement.parentElement.showScreenshot('${step.uniqueId}')" />
                </div>
            `
        } else if (step.type === 'click') {
            screenshotInfo = '<span class="screenshot-badge processing">⏳ 截图中...</span>'
        }
        
        stepElement.innerHTML = `
            <div class="step-number">${step.stepNumber}</div>
            <div class="step-content">
                <div class="step-description">${step.description}${positionInfo}</div>
                <div class="step-time">${time}</div>
                <div class="step-element">元素: ${step.element}</div>
                ${screenshotInfo}
            </div>
            <button class="delete-step-btn" data-step-id="${step.uniqueId}" title="删除此步骤">
                🗑️
            </button>
        `
        
        // 为删除按钮添加事件监听器
        const deleteBtn = stepElement.querySelector('.delete-step-btn')
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault()
                e.stopPropagation()
                const stepId = deleteBtn.getAttribute('data-step-id')
                if (stepId) {
                    this.deleteStep(stepId)
                }
            })
        }
        
        return stepElement
    }
    
    updateStepCount() {
        const stepCountElement = document.getElementById('step-count')
        if (stepCountElement) {
            stepCountElement.textContent = this.steps.length.toString()
        }
    }
    
    // 更新步骤的截图状态
    updateStepScreenshot(screenshotData) {
        const { stepId, screenshot } = screenshotData
        
        // 找到对应的步骤并更新
        const stepIndex = this.steps.findIndex(step => step.uniqueId === stepId)
        if (stepIndex !== -1) {
            this.steps[stepIndex].hasScreenshot = true
            this.steps[stepIndex].screenshot = screenshot
            
            // 更新UI
            this.updateStepsUI()
            console.log('步骤截图状态已更新:', stepId)
        }
    }
    
    // 显示截图
    showScreenshot(stepId) {
        const step = this.steps.find(s => s.uniqueId === stepId)
        if (!step || !step.screenshot) {
            console.log('未找到截图数据:', stepId)
            return
        }
        
        // 创建截图预览弹窗
        this.createScreenshotModal(step)
    }
    
    // 创建截图预览弹窗
    createScreenshotModal(step) {
        // 移除已存在的弹窗
        const existingModal = document.getElementById('screenshot-modal')
        if (existingModal) {
            existingModal.remove()
        }
        
        // 创建弹窗
        const modal = document.createElement('div')
        modal.id = 'screenshot-modal'
        modal.className = 'screenshot-modal'
        
        const time = new Date(step.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
        
        modal.innerHTML = `
            <div class="screenshot-modal-content">
                <div class="screenshot-modal-header">
                    <h3>智能录制器 - 截图预览</h3>
                    <span class="screenshot-time">${time}</span>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">关闭</button>
                </div>
                <div class="screenshot-modal-body">
                    <img src="${step.screenshot}" alt="截图" class="screenshot-image" />
                    <div class="screenshot-info">
                        <p><strong>步骤:</strong> ${step.description}</p>
                        <p><strong>元素:</strong> ${step.element}</p>
                        <p><strong>时间:</strong> ${time}</p>
                        <p><strong>数据大小:</strong> ${(step.screenshot.length / 1024).toFixed(1)} KB</p>
                    </div>
                </div>
            </div>
        `
        
        document.body.appendChild(modal)
        
        // 点击弹窗外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove()
            }
        })
        
        console.log('截图预览弹窗已创建:', step.uniqueId)
    }
    
    // 删除指定步骤
    deleteStep(stepId) {
        console.log('删除步骤:', stepId)
        
        // 找到要删除的步骤索引
        const stepIndex = this.steps.findIndex(step => step.uniqueId === stepId)
        if (stepIndex === -1) {
            console.log('未找到要删除的步骤:', stepId)
            return
        }
        
        // 从数组中删除
        this.steps.splice(stepIndex, 1)
        
        // 重新编号步骤
        this.renumberSteps()
        
        // 更新UI
        this.updateStepsUI()
        this.updateStepCount()
        
        // 通知background script更新存储
        chrome.runtime.sendMessage({
            type: 'DELETE_RECORDING_STEP',
            data: { stepId }
        })
        
        console.log('步骤已删除，剩余步骤数:', this.steps.length)
    }
    
    // 重新编号步骤
    renumberSteps() {
        this.steps.forEach((step, index) => {
            step.stepNumber = index + 1
        })
    }
    
    // 从消息更新步骤
    updateStepsFromMessage(data) {
        if (data.steps && Array.isArray(data.steps)) {
            this.steps = data.steps
            this.updateStepsUI()
            this.updateStepCount()
            console.log('步骤已从消息更新，数量:', this.steps.length)
            
            // 如果步骤数量增加，滚动到最新位置
            if (this.steps.length > 0) {
                this.scrollToLatestStep()
            }
        }
    }
    
    // 自动滚动到最新记录
    scrollToLatestStep() {
        // 如果用户禁用了自动滚动，则不执行
        if (this.autoScrollEnabled === false) {
            console.log('📍 用户已禁用自动滚动，跳过滚动操作')
            return
        }
        
        // 获取步骤容器元素（应该是可滚动的父容器）
        const stepsSection = document.querySelector('.steps-section')
        if (stepsSection && this.steps.length > 0) {
            // 调试信息
            console.log('🔍 滚动调试信息:', {
                stepsCount: this.steps.length,
                scrollHeight: stepsSection.scrollHeight,
                clientHeight: stepsSection.clientHeight,
                scrollTop: stepsSection.scrollTop
            })
            
            // 使用setTimeout确保DOM完全更新后再滚动
            setTimeout(() => {
                // 强制滚动到最底部，确保新记录可见
                const targetScrollTop = stepsSection.scrollHeight
                
                // 尝试使用scrollTo方法
                try {
                    stepsSection.scrollTo({
                        top: targetScrollTop,
                        behavior: 'smooth'
                    })
                } catch (error) {
                    console.warn('scrollTo方法失败，使用备用方法:', error)
                    // 备用滚动方法
                    stepsSection.scrollTop = targetScrollTop
                }
                
                // 验证滚动是否成功
                setTimeout(() => {
                    const actualScrollTop = stepsSection.scrollTop
                    const scrollSuccess = Math.abs(actualScrollTop - targetScrollTop) < 10
                    
                    if (scrollSuccess) {
                        console.log('✅ 滚动成功，目标位置:', targetScrollTop, '实际位置:', actualScrollTop, '步骤数量:', this.steps.length)
                    } else {
                        console.warn('⚠️ 滚动可能失败，目标位置:', targetScrollTop, '实际位置:', actualScrollTop, '步骤数量:', this.steps.length)
                        // 再次尝试滚动
                        stepsSection.scrollTop = targetScrollTop
                    }
                }, 200)
                
            }, 150) // 增加延迟到150ms确保DOM完全更新
        }
    }
    
    clearSteps() {
        console.log('清空录制步骤')
        this.steps = []
        this.updateStepsUI()
        this.updateStepCount()
    }
    
    updateUI() {
        const statusIndicator = document.getElementById('status-indicator')
        const startBtn = document.getElementById('start-recording-btn')
        const recordingInfo = document.getElementById('recording-info')
        
        if (!statusIndicator || !startBtn || !recordingInfo) return
        
        if (this.isRecording) {
            // 录制状态
            statusIndicator.className = 'status-indicator recording'
            const statusText = statusIndicator.querySelector('.status-text')
            if (statusText) statusText.textContent = '录制中'
            
            // 按钮状态
            startBtn.className = 'btn btn-danger stop-btn'
            startBtn.innerHTML = `
                <svg class="btn-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="4" y="4" width="8" height="8"/>
                </svg>
                停止录制
            `
            
            // 显示录制信息
            recordingInfo.style.display = 'flex'
        } else {
            // 未录制状态
            statusIndicator.className = 'status-indicator'
            const statusText = statusIndicator.querySelector('.status-text')
            if (statusText) statusText.textContent = '未录制'
            
            // 按钮状态
            startBtn.className = 'btn btn-primary start-btn'
            startBtn.innerHTML = `
                <svg class="btn-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="8" r="6"/>
                </svg>
                开始录制
            `
            
            // 隐藏录制信息
            recordingInfo.style.display = 'none'
        }
    }
    
    notifyBackground(type, data) {
        try {
            chrome.runtime.sendMessage({ type, data })
            console.log('已发送消息到background:', type, data)
        } catch (error) {
            console.error('发送消息到background失败:', error)
        }
    }
    
    onRecordingStarted(data) {
        console.log('录制已开始:', data)
        this.isRecording = true
        this.sessionId = data.sessionId
        this.startTime = Date.now()
        this.updateUI()
        this.startTimer()
    }
    
    onRecordingStopped(data) {
        console.log('录制已停止:', data)
        this.isRecording = false
        this.stopTimer()
        this.updateUI()
    }
    
    async loadRecordingStatus() {
        try {
            // 从chrome.storage加载录制状态
            const result = await chrome.storage.local.get(['current_recording_session'])
            if (result.current_recording_session) {
                const session = result.current_recording_session
                this.isRecording = true
                this.sessionId = session.id
                this.startTime = session.startTime
                this.steps = session.steps || []
                
                console.log('已加载录制状态:', session)
                this.updateUI()
                this.updateStepsUI()
                this.updateStepCount()
                this.startTimer()
                
                // 如果加载了步骤，滚动到最新位置
                if (this.steps.length > 0) {
                    this.scrollToLatestStep()
                }
            }
        } catch (error) {
            console.error('加载录制状态失败:', error)
        }
    }
    
    async saveRecordingStatus() {
        try {
            const status = {
                isRecording: this.isRecording,
                sessionId: this.sessionId,
                startTime: this.startTime,
                steps: this.steps
            }
            
            await chrome.storage.local.set({ current_recording_session: status })
            console.log('录制状态已保存')
        } catch (error) {
            console.error('保存录制状态失败:', error)
        }
    }
    
    async saveRecordingData() {
        if (this.steps.length === 0) return
        
        try {
            const recordingData = {
                id: this.sessionId,
                startTime: this.startTime,
                endTime: Date.now(),
                duration: this.startTime ? Date.now() - this.startTime : 0,
                steps: this.steps,
                url: window.location.href,
                title: document.title
            }
            
            const key = `recording_${this.sessionId}`
            await chrome.storage.local.set({ [key]: recordingData })
            console.log('录制数据已保存:', key)
        } catch (error) {
            console.error('保存录制数据失败:', error)
        }
    }
    
    viewTutorial() {
        chrome.tabs.create({ url: 'https://github.com/your-repo/tutorial' })
    }
    
    openSettings() {
        chrome.runtime.openOptionsPage()
    }
}

// 创建侧边栏控制器实例
const sidePanel = new SidePanelController()
console.log('侧边栏控制器已创建')
