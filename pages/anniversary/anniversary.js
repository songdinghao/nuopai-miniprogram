// pages/anniversary/anniversary.js - 纪念日管理页面
const app = getApp()
const anniversary = require('../../utils/anniversary.js')

Page({
  data: {
  // 纪念日列表
  anniversaries: [],

  // 表单
  showForm: false,
  formMode: 'create', // create | edit
  editId: '',
  formData: {
      name: '',
      type: 'love',
      date: '',
      reminderDays: [7, 3, 1],
      note: ''
  },

  // 预计算的 picker 值（WXML 不支持复杂表达式）
  selectedTypeIndex: 0,
  selectedTypeName: '',
  selectedTypeIcon: '',

  // 可选类型
  types: [],

  // 可选提醒天数
  reminderOptions: [
      { value: 7, label: '提前7天', checked: true },
      { value: 3, label: '提前3天', checked: true },
      { value: 1, label: '提前1天', checked: true }
  ],

  // 页面状态
  loading: true,
  isLogin: false,
  fontSize: 'normal'
  },

  onLoad(options) {
  app.globalData.currentPage = 'anniversary'

  // 加载纪念日类型
  this.setData({
      types: anniversary.getAnniversaryTypes()
  })

  this.updateSelectedTypeInfo()
  this.loadData()
  },

  onShow() {
  this.loadData()
  },

  //===== ==== = 预计算 picker 展示值 = ==== ==== =

  // 根据 formData.type 更新 selectedTypeIndex/Name/Icon
  updateSelectedTypeInfo() {
  const types = this.data.types
  const typeId = this.data.formData.type
  const matched = types.findIndex(t =>t.id ===typeId)
  const idx = matched >=0 ? matched : 0
  const type = types[idx]
  this.setData({
      selectedTypeIndex: idx,
      selectedTypeName: type ? type.name : '',
      selectedTypeIcon: type ? type.icon : ''
  })
  },

  // 加载数据
  loadData() {
  const isLogin = app.globalData.isLogin

  if (!isLogin) {
      this.setData({
    loading: false,
    isLogin: false
      })
      return
  }

  const list = anniversary.getAllAnniversaries()

  // 预计算展示天数（WXML不支持Math.abs）
  const enrichedList = list.map(item =>({
      ...item,
      daysDisplay: Math.abs(item.daysUntil)
  }))

  this.setData({
      anniversaries: enrichedList,
      loading: false,
      isLogin: true
  })
  },

  // 显示新增表单
  onShowAddForm() {
  // 重置表单
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  this.setData({
      showForm: true,
      formMode: 'create',
      editId: '',
      formData: {
    name: '',
    type: 'love',
    date: month + '-' + day,
    reminderDays: [7, 3, 1],
    note: ''
      },
      reminderOptions: this.data.reminderOptions.map(r =>({
    ...r,
    checked: true
      }))
  })

  this.updateSelectedTypeInfo()
  },

  // 显示编辑表单
  onEdit(e) {
  const id = e.currentTarget.dataset.id
  const item = this.data.anniversaries.find(a =>a.id ===id)
  if (!item) return

  const reminderOptions = this.data.reminderOptions.map(r =>({
      ...r,
      checked: item.reminderDays.includes(r.value)
  }))

  this.setData({
      showForm: true,
      formMode: 'edit',
      editId: id,
      formData: {
    name: item.name,
    type: item.type,
    date: item.date,
    reminderDays: item.reminderDays,
    note: item.note || ''
      },
      reminderOptions
  })

  this.updateSelectedTypeInfo()
  },

  // 关闭表单
  onCloseForm() {
  this.setData({ showForm: false })
  },

  // 表单输入
  onNameInput(e) {
  this.setData({
      'formData.name': e.detail.value
  })
  },

  onTypeChange(e) {
  const idx = e.detail.value
  const types = this.data.types
  const typeId = types[idx] ? types[idx].id : 'love'
  this.setData({
      'formData.type': typeId
  })
  this.updateSelectedTypeInfo()
  },

  onDateChange(e) {
  this.setData({
      'formData.date': e.detail.value
  })
  },

  onNoteInput(e) {
  this.setData({
      'formData.note': e.detail.value
  })
  },

  // 切换提醒天数
  onToggleReminder(e) {
  const idx = e.currentTarget.dataset.index
  const key = `reminderOptions[${idx}].checked`
  const options = this.data.reminderOptions
  const newChecked = !options[idx].checked

  this.setData({
      [key]: newChecked,
      'formData.reminderDays': options
    .map((r, i) =>i ===idx ? { ...r, checked: newChecked } : r)
    .filter(r =>r.checked)
    .map(r =>r.value)
  })
  },

  // 保存
  onSave() {
  const formData = this.data.formData

  if (!formData.name.trim()) {
      wx.showToast({ title: '请输入纪念日名称', icon: 'none' })
      return
  }

  if (!formData.date) {
      wx.showToast({ title: '请选择日期', icon: 'none' })
      return
  }

  if (this.data.formMode ==='create') {
      const result = anniversary.createAnniversary(formData)
      if (result) {
    wx.showToast({ title: '创建成功', icon: 'success' })
      }
  } else {
      const result = anniversary.updateAnniversary(this.data.editId, formData)
      if (result) {
    wx.showToast({ title: '更新成功', icon: 'success' })
      }
  }

  this.setData({ showForm: false })
  this.loadData()
  },

  // 删除纪念日
  onDelete(e) {
  const id = e.currentTarget.dataset.id

  wx.showModal({
      title: '确认删除',
      content: '确定要删除这个纪念日吗？',
      confirmText: '删除',
      confirmColor: "#2D8C7A",
      cancelText: '取消',
      success: (res) =>{
    if (res.confirm) {
          const result = anniversary.deleteAnniversary(id)
          if (result) {
      wx.showToast({ title: '已删除', icon: 'success' })
      this.loadData()
          }
    }
      }
  })
  },

  // 推荐礼物
  onRecommendGift(e) {
  const type = e.currentTarget.dataset.type
  const keyword = anniversary.getGiftKeyword(type)

  // 跳转到商品搜索
  wx.navigateTo({
      url: `/subpackages/search/result/result?keyword=${encodeURIComponent(keyword)}`
  })
  },

  // 去登录
  onLoginTap() {
  wx.navigateTo({
      url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/anniversary/anniversary')
  })
  },

  // 格式化时间
  formatTime(timestamp) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
  }
})
