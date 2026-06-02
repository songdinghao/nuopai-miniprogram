// pages/user/address/address.js - 收货地址管理页面
// TODO: 上线后地址数据应同步到服务端，本地仅作缓存
const app = getApp()

Page({
  data: {
  // 页面状态
  isFromCheckout: false,

  // 地址列表
  addressList: [],

  // 字体大小
  fontSize: 'normal'
  },

  // 页面加载
  onLoad(options) {

  // 检查是否从结算页跳转
  const isFromCheckout = options.from ==='checkout'
  this.setData({ isFromCheckout })

  // 加载用户偏好
  this.loadUserPreferences()

  // 加载地址列表
  this.loadAddressList()
  },

  // 页面显示
  onShow() {

  // 重新加载地址列表
  this.loadAddressList()
  },

  // 加载用户偏好
  loadUserPreferences() {
  const preferences = app.globalData.userPreferences || {}
  const fontSize = preferences.fontSize || 'normal'

  this.setData({ fontSize })
  },

  // 加载地址列表
  loadAddressList() {
  // 从本地存储获取地址列表
  let addressList = wx.getStorageSync('addressList') || []

  // 如果没有地址，添加一些模拟数据
  if (addressList.length ===0) {
      addressList = [
    {
          id: 1,
          name: '张女士',
          phone: '138****8888',
          province: '上海市',
          city: '上海市',
          district: '浦东新区',
          detail: '陆家嘴街道XX花园1号楼101室',
          isDefault: true
    },
    {
          id: 2,
          name: '李先生',
          phone: '139****9999',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          detail: '建国路XX大厦B座2001室',
          isDefault: false
    }
      ]

      // 保存到本地存储
      wx.setStorageSync('addressList', addressList)
  }

  this.setData({ addressList })
  },

  //===== ==== = 用户交互事件 = ==== ==== =

  // 选择地址
  onSelectAddress(e) {
  const id = e.currentTarget.dataset.id

  if (this.data.isFromCheckout) {
      // 从结算页跳转，选择后返回
      const address = this.data.addressList.find(item => item.id == id)
      if (address) {
    this.setDefaultAddress(id)

    // 通过storage传递选中地址，避免跨页面setData
    wx.setStorageSync('selectedAddress', address)

    wx.navigateBack()
      }
  }
  },

  // 编辑地址
  onEditAddress(e) {
  const id = e.currentTarget.dataset.id
  const address = this.data.addressList.find(item => item.id == id)
  if (!address) return

  wx.showActionSheet({
      itemList: ['修改收货人', '修改联系电话', '修改详细地址', '编辑完整信息'],
      success: (res) => {
    const fieldMap = {
        0: { key: 'name', title: '修改收货人', value: address.name },
        1: { key: 'phone', title: '修改联系电话', value: address.phone },
        2: { key: 'detail', title: '修改详细地址', value: address.detail },
        3: null
    }
    const field = fieldMap[res.tapIndex]
    if (field) {
        this.showEditModal(address, field)
    } else if (res.tapIndex === 3) {
        // 编辑完整信息：先删后加（引导重选微信地址）
        wx.chooseAddress({
        success: (wxAddr) => {
            this.updateAddressFromWechat(id, wxAddr)
        },
        fail: () => {
            wx.showToast({ title: '需授权使用通讯录地址', icon: 'none' })
        }
        })
    }
      }
  })
  },

  // 显示编辑弹窗
  showEditModal(address, field) {
  wx.showModal({
      title: field.title,
      content: '',
      editable: true,
      placeholderText: field.value,
      confirmText: '保存',
      cancelText: '取消',
      success: (res) => {
    if (res.confirm && res.content && res.content.trim()) {
        const newValue = res.content.trim()
        this.updateAddressField(address.id, field.key, newValue)
    }
      }
  })
  },

  // 更新地址单个字段
  // TODO: 保存成功后应调用API同步到服务端
  updateAddressField(id, key, value) {
  let addressList = this.data.addressList
  const idx = addressList.findIndex(item => item.id == id)
  if (idx >= 0) {
      addressList[idx][key] = value
      wx.setStorageSync('addressList', addressList)
      this.setData({ addressList })
      wx.showToast({ title: '修改成功', icon: 'success' })
  }
  },

  // 通过微信地址更新完整信息
  updateAddressFromWechat(id, wxAddr) {
  let addressList = this.data.addressList
  const idx = addressList.findIndex(item => item.id == id)
  if (idx >= 0) {
      addressList[idx].name = wxAddr.userName
      addressList[idx].phone = wxAddr.telNumber
      addressList[idx].province = wxAddr.provinceName
      addressList[idx].city = wxAddr.cityName
      addressList[idx].district = wxAddr.countyName
      addressList[idx].detail = wxAddr.detailInfo
      wx.setStorageSync('addressList', addressList)
      this.setData({ addressList })
      wx.showToast({ title: '修改成功', icon: 'success' })
  }
  },

  // 删除地址
  onDeleteAddress(e) {
  const id = e.currentTarget.dataset.id

  wx.showModal({
      title: '确认删除',
      content: '确定要删除这个收货地址吗？',
      confirmText: '删除',
      confirmColor: "#2D8C7A",
      cancelText: '取消',
      success: (res) =>{
    if (res.confirm) {
          this.doDeleteAddress(id)
    }
      }
  })
  },

  // 执行删除地址
  // TODO: 删除成功后应调用API同步到服务端
  doDeleteAddress(id) {
  let addressList = this.data.addressList
  const deleteIndex = addressList.findIndex(item =>item.id ===id)

  if (deleteIndex > -1) {
      const deletedAddress = addressList[deleteIndex]
      addressList.splice(deleteIndex, 1)

      // 如果删除的是默认地址，设置第一个为默认
      if (deletedAddress.isDefault && addressList.length > 0) {
    addressList[0].isDefault = true
      }

      // 保存到本地存储
      wx.setStorageSync('addressList', addressList)

      // 更新页面
      this.setData({ addressList })

      // 显示提示
      wx.showToast({
    title: '删除成功',
    icon: 'success',
    duration: 1500
      })
  }
  },

  setDefaultAddress(id) {
  let addressList = this.data.addressList

  addressList.forEach(item =>{
      item.isDefault = item.id ===id
  })

  // 保存到本地存储
  wx.setStorageSync('addressList', addressList)

  this.setData({ addressList })
  },

  // 添加收货地址
  onAddAddress() {

  // 尝试使用微信地址选择器
  wx.chooseAddress({
      success: (res) =>{
    this.addAddressFromWechat(res)
      },
      fail: (err) =>{
    console.error('选择地址失败: ', err)

    // 如果用户拒绝授权，显示手动添加提示
    wx.showModal({
          title: '添加地址',
          content: '请在设置中开启地址权限，或手动添加收货地址',
          confirmText: '去设置',
          cancelText: '手动添加',
          success: (res) =>{
      if (res.confirm) {
              // 打开设置页
              wx.openSetting()
      } else {
              // 手动添加
              wx.showToast({
        title: '即将上线，敬请期待',
        icon: 'none',
        duration: 1500
              })
      }
          }
    })
      }
  })
  },

  // 从微信地址添加
  // TODO: 保存成功后应调用API同步到服务端
  addAddressFromWechat(addressInfo) {
  const addressList = this.data.addressList

  const newAddress = {
      id: Date.now(),
      name: addressInfo.userName,
      phone: addressInfo.telNumber,
      province: addressInfo.provinceName,
      city: addressInfo.cityName,
      district: addressInfo.countyName,
      detail: addressInfo.detailInfo,
      isDefault: addressList.length ===0 // 如果是第一个地址，设为默认
  }

  // 如果设置了默认，先清除其他地址的默认标记
  if (newAddress.isDefault) {
      addressList.forEach(item =>{
    item.isDefault = false
      })
  }

  // 添加到列表
  addressList.unshift(newAddress)

  // 保存到本地存储
  wx.setStorageSync('addressList', addressList)

  // 更新页面
  this.setData({ addressList })

  // 显示提示
  wx.showToast({
      title: '添加成功',
      icon: 'success',
      duration: 1500
  })

  // 如果从结算页跳转，自动选择并返回
  if (this.data.isFromCheckout) {
      setTimeout(() => {
    // 通过storage传递选中地址，避免跨页面setData
    wx.setStorageSync('selectedAddress', newAddress)
    wx.navigateBack()
      }, 500)
  }
  },

  // 分享
  onShareAppMessage() {
  return {
      title: '诺派永生花 - 高品质永生花产品',
      path: '/pages/index/index'
  }
  }
})
