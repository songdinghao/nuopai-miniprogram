// components/voice - search/voice - search.js - 语音搜索组件
Component({
  properties: {
  // 是否显示
  visible: {
      type: Boolean,
      value: false
  },
  // 搜索提示文本
  placeholder: {
      type: String,
      value: '点击说话，搜索永生花'
  }
  },

  data: {
  status: 'idle', // idle / recording / processing / success / error
  statusText: '',
  volumeLevel: 0,
  recognizedText: ''
  },

  observers: {
  visible(show) {
      if (show) {
    this.startRecording()
      }
  }
  },

  lifetimes: {
  attached() {
      this.volumeTimer = null
      this.initRecorder()
  },
  detached() {
      this.stopRecorder()
  }
  },

  methods: {
  // 阻止滚动穿透
  noop() {},

  initRecorder() {
      try {
    this._recorderManager = wx.getRecorderManager()

    this._recorderManager.onStart(() =>{
          this.setData({
      status: 'recording',
      statusText: '请说话...'
          })
          this.startVolumeSimulation()
    })

    this._recorderManager.onStop((res) =>{
          this.stopVolumeSimulation()
          if (res.tempFilePath) {
      this.setData({
              status: 'processing',
              statusText: '正在识别...'
      })
      this.simulateRecognition(res.tempFilePath)
          }
    })

    this._recorderManager.onError((err) =>{
          this.stopVolumeSimulation()
          console.error('录音失败: ', err)
          this.setData({
      status: 'error',
      statusText: '录音失败，请重试'
          })
          this.triggerEvent('error', { error: err })
    })
      } catch (err) {
    console.warn('录音管理器初始化失败: ', err)
    this.setData({
          status: 'error',
          statusText: '设备不支持录音功能'
    })
      }
  },

  // 开始录音
  startRecording() {
      wx.authorize({
    scope: 'scope.record',
    success: () =>{
          if (this._recorderManager) {
      this._recorderManager.start({
              duration: 10000,
              sampleRate: 16000,
              numberOfChannels: 1,
              encodeBitRate: 48000,
              format: 'mp3'
      })
          }
    },
    fail: () =>{
          this.setData({
      status: 'error',
      statusText: '需要麦克风权限'
          })
          this.triggerEvent('permissiondenied')
    }
      })
  },

  // 停止录音
  stopRecording() {
      if (this._recorderManager) {
    this._recorderManager.stop()
      }
  },

  // 模拟音量变化
  startVolumeSimulation() {
      this.volumeTimer = setInterval(() =>{
    this.setData({
          volumeLevel: Math.random() * 100
    })
      }, 200)
  },
  stopVolumeSimulation() {
      if (this.volumeTimer) {
    clearInterval(this.volumeTimer)
    this.volumeTimer = null
      }
  },

  // 模拟语音识别
  simulateRecognition(filePath) {
      // 实际项目中应调用语音识别API
      setTimeout(() =>{
    const mockResults = ['永生花礼盒', '玫瑰永生花', '客厅摆件', '商务送礼', '母亲节礼物']
    const result = mockResults[Math.floor(Math.random() * mockResults.length)]

    this.setData({
          status: 'success',
          statusText: `"${result}"`,
          recognizedText: result
    })

    setTimeout(() =>{
          this.triggerEvent('result', { text: result })
    }, 1000)
      }, 1500)
  },

  // 点击语音按钮（外部触发）
  onStartTap() {
      this.startRecording()
  },

  // 停止录音并清理
  stopRecorder() {
      this.stopRecording()
      this.stopVolumeSimulation()
  },

  // 关闭
  onClose() {
      this.stopRecorder()
      this.triggerEvent('close')
  },

  // 点击重试
  onRetry() {
      this.setData({ status: 'idle', statusText: '' })
      this.startRecording()
  },

  // 停止录音并搜索
  onConfirmSearch() {
      if (this.data.recognizedText) {
    this.stopRecorder()
    this.triggerEvent('result', { text: this.data.recognizedText })
      }
  }
  }
})
