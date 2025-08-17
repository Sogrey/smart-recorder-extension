// 侧边栏JavaScript逻辑
console.log('侧边栏脚本已加载')

class SidePanelController {
    constructor() {
        this.isRecording = false
        this.sessionId = null
        this.startTime = null
        this.steps = []
        this.recordingInterval = null
        
        this.initialize()
    }
    
    initialize() {
        console.log('初始化侧边栏控制器')
        this.bindEvents()
        this.loadRecordingStatus()
        
        // 监听来自background script的消息
        this.setupMessageListener()
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
        
        stepElement.innerHTML = `
            <div class="step-number">${step.stepNumber}</div>
            <div class="step-content">
                <div class="step-description">${step.description}${positionInfo}</div>
                <div class="step-time">${time}</div>
                <div class="step-element">元素: ${step.element}</div>
            </div>
        `
        
        return stepElement
    }
    
    updateStepCount() {
        const stepCountElement = document.getElementById('step-count')
        if (stepCountElement) {
            stepCountElement.textContent = this.steps.length.toString()
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
