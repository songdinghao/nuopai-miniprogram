# 数据埋点方案文档

## 1. 概述

本文档定义诺派永生花微信小程序的埋点指标体系，涵盖关键用户行为事件的采集规范、命名规则、用户行为路径分析及转化漏斗定义。本方案基于现有 `app.js` 中的 `trackEvent` 方法进行扩展。

### 1.1 目标

- 量化用户行为，为产品迭代提供数据支撑
- 建立完整的转化漏斗，优化购买转化率
- 分析用户留存与复购行为，提升用户生命周期价值
- 为营销活动效果评估提供数据基础

---

## 2. 事件命名规范

### 2.1 命名规则

```
[模块]_[动作]_[对象]
```

- **模块**: 功能模块缩写（app, home, category, product, cart, order, user, search, notification）
- **动作**: 行为类型（launch, view, click, add, remove, submit, cancel, share, pay）
- **对象**: 操作的具体对象（product, coupon, address, order_id）

### 2.2 事件名称示例

| 事件名称 | 说明 |
|---------|------|
| `app_launch` | 小程序启动 |
| `app_show` | 小程序显示 |
| `app_hide` | 小程序隐藏 |
| `home_view` | 首页浏览 |
| `home_banner_click` | 首页Banner点击 |
| `category_view` | 分类页浏览 |
| `product_view` | 商品详情页浏览 |
| `product_image_click` | 商品图片点击 |
| `cart_add` | 加入购物车 |
| `cart_remove` | 移除购物车 |
| `cart_view` | 购物车浏览 |
| `order_create` | 创建订单 |
| `order_pay` | 发起支付 |
| `order_pay_success` | 支付成功 |
| `order_refund` | 申请退款 |
| `search_submit` | 搜索提交 |
| `share_success` | 分享成功 |
| `user_login` | 用户登录 |
| `user_register` | 用户注册 |
| `user_collection_add` | 商品收藏 |
| `notification_click` | 消息通知点击 |
| `promotion_view` | 活动页浏览 |
| `promotion_coupon_receive` | 领取优惠券 |

---

## 3. 埋点指标定义

### 3.1 页面访问指标

| 指标名称 | 事件 | 参数 | 说明 |
|---------|------|------|------|
| 启动次数 | `app_launch` | `scene`, `query` | 小程序每次冷启动 |
| 页面浏览量(PV) | 各页面 `_view` 事件 | `page_path`, `referrer` | 统计页面 PV |
| 页面访问人数(UV) | 各页面 `_view` 事件 | `user_id` | 统计页面 UV |
| 访问深度 | 页面栈序列 | `page_sequence` | 用户单次访问的页面数 |
| 平均停留时长 | 各页面 `_view` / `_leave` | `duration` | 页面平均停留时间 |

```javascript
// 示例：页面浏览埋点
app.trackEvent('home_view', {
  page_path: 'pages/index/index',
  referrer: app.globalData.referrer || 'direct',
  entry_scene: options.scene || 0
})
```

### 3.2 商品曝光指标

| 指标名称 | 事件 | 参数 | 说明 |
|---------|------|------|------|
| 商品曝光 | `product_exposure` | `product_id`, `position`, `source` | 商品在列表/推荐位曝光 |
| 商品点击 | `product_click` | `product_id`, `position`, `source` | 点击进入商品详情 |
| 商品详情查看 | `product_view` | `product_id`, `source` | 成功进入商品详情页 |
| 图片查看 | `product_image_click` | `product_id`, `image_index` | 查看商品大图/多图 |

```javascript
// 示例：商品曝光埋点
app.trackEvent('product_exposure', {
  product_id: 'prod_001',
  position: 3,            // 在列表中的位置
  source: 'home_recommend', // 曝光来源：首页推荐/分类列表/搜索结果
  list_id: 'home_recommend_1'
})
```

### 3.3 加购与下单指标

| 指标名称 | 事件 | 参数 | 说明 |
|---------|------|------|------|
| 加入购物车 | `cart_add` | `product_id`, `quantity`, `price`, `sku_id` | 点击加入购物车 |
| 购物车浏览 | `cart_view` | `item_count`, `total_amount` | 进入购物车页 |
| 修改数量 | `cart_quantity_change` | `product_id`, `old_qty`, `new_qty` | 调整购物车商品数量 |
| 移除商品 | `cart_remove` | `product_id` | 从购物车删除 |
| 开始结算 | `checkout_start` | `item_count`, `total_amount`, `coupon_id` | 点击结算按钮 |
| 提交订单 | `order_create` | `order_id`, `amount`, `item_count`, `payment_method` | 订单创建成功 |
| 支付发起 | `order_pay` | `order_id`, `amount` | 调起支付 |
| 支付成功 | `order_pay_success` | `order_id`, `amount`, `payment_method` | 支付成功回调 |

```javascript
// 示例：加购埋点
app.trackEvent('cart_add', {
  product_id: 'prod_001',
  sku_id: 'sku_001_red',
  quantity: 1,
  price: 199.00,
  source: 'product_detail', // product_detail / product_list / promotion
  is_first_add: false       // 是否首次加购
})

// 示例：支付成功埋点
app.trackEvent('order_pay_success', {
  order_id: '20260430001',
  amount: 199.00,
  payment_method: 'wechat_pay',
  item_count: 2,
  coupon_id: 'coupon_001',
  coupon_amount: 20
})
```

### 3.4 用户互动指标

| 指标名称 | 事件 | 参数 | 说明 |
|---------|------|------|------|
| 收藏商品 | `user_collection_add` | `product_id` | 点击收藏 |
| 取消收藏 | `user_collection_remove` | `product_id` | 取消收藏 |
| 搜索提交 | `search_submit` | `keyword`, `result_count` | 提交搜索 |
| 搜索点击 | `search_result_click` | `keyword`, `position`, `product_id` | 点击搜索结果 |
| 分享成功 | `share_success` | `share_type`, `page_path` | 分享到微信/朋友圈 |
| 分享回流 | `share_open` | `share_id`, `inviter_id` | 通过分享链接打开 |
| 登录 | `user_login` | `login_method` | 用户登录成功 |
| 注册 | `user_register` | `register_method` | 新用户注册 |

```javascript
// 示例：搜索埋点
app.trackEvent('search_submit', {
  keyword: '红色永生花',
  result_count: 12,
  source: 'search_bar' // search_bar / voice_search
})
```

### 3.5 营销活动指标

| 指标名称 | 事件 | 参数 | 说明 |
|---------|------|------|------|
| Banner点击 | `home_banner_click` | `banner_id`, `position` | 首页Banner |
| 活动页浏览 | `promotion_view` | `promotion_id` | 进入活动页 |
| 领取优惠券 | `promotion_coupon_receive` | `coupon_id`, `coupon_value` | 领取成功 |
| 使用优惠券 | `promotion_coupon_use` | `coupon_id`, `order_id` | 订单使用优惠券 |
| 邀请点击 | `user_invite_click` | `source` | 点击邀请好友 |
| 邀请成功 | `user_invite_success` | `invitee_id` | 好友注册成功 |

### 3.6 消息通知指标

| 指标名称 | 事件 | 参数 | 说明 |
|---------|------|------|------|
| 通知点击 | `notification_click` | `type`, `id` | 点击消息通知 |
| 全部已读 | `notification_mark_all_read` | — | 标记全部已读 |
| 删除通知 | `notification_delete` | `type` | 删除单条通知 |

---

## 4. 用户行为路径分析

### 4.1 核心路径

```
首页 → 商品详情 → 加购 → 结算 → 支付成功
```

### 4.2 次要路径

```
分类页 → 商品详情 → 加购 → 结算 → 支付成功
搜索 → 搜索结果 → 商品详情 → 加购 → 结算 → 支付成功
活动页/Banner → 商品详情 → 加购 → 结算 → 支付成功
分享回流 → 商品详情 → 加购 → 结算 → 支付成功
收藏夹 → 商品详情 → 加购 → 结算 → 支付成功
纪念日提醒 → 推荐商品 → 商品详情 → 加购 → 结算 → 支付成功
```

### 4.3 用户分群

| 用户类型 | 行为特征 | 运营策略 |
|---------|---------|---------|
| 新访客 | 浏览不购买 | 推送新人优惠券 |
| 浏览型 | 频繁浏览，极少加购 | 推送促销活动 |
| 加购未付 | 已加购/已下单未支付 | 推送支付提醒/优惠券 |
| 复购型 | 多次购买完成 | VIP会员权益 |
| 流失预警 | 超过30天未访问 | 短信/模板消息召回 |

---

## 5. 转化漏斗定义

### 5.1 主转化漏斗（购买路径）

```
步骤1: 首页/入口访问   →   步骤2: 商品详情页浏览
        100%                    35-50%
        
步骤2: 商品详情页浏览  →   步骤3: 加入购物车
        100%                    15-25%
        
步骤3: 加入购物车       →   步骤4: 进入结算页
        100%                    50-65%
        
步骤4: 进入结算页       →   步骤5: 提交订单
        100%                    80-90%
        
步骤5: 提交订单         →   步骤6: 支付成功
        100%                    70-85%
```

**整体转化率**（首页 → 支付成功）：约 1.5% - 5%

### 5.2 各环节流失分析

| 流失环节 | 典型流失率 | 可能原因 | 优化建议 |
|---------|-----------|---------|---------|
| 首页→详情 | 50-65% | 商品吸引力不足、信息不明确 | 优化商品图、标题和价格展示 |
| 详情→加购 | 75-85% | 详情信息不足、价格偏高、无促销 | 增加详情说明、限时优惠标识 |
| 加购→结算 | 35-50% | 犹豫、比价、运费门槛 | 加购后弹窗引导、包邮提示 |
| 结算→提交 | 10-20% | 填写地址繁琐、发现额外费用 | 一键填写、费用明细前置 |
| 提交→支付 | 15-30% | 支付方式不便、支付失败 | 微信支付指引、失败重试 |

### 5.3 漏斗埋点实现

```javascript
// 在 app.js 中扩展漏斗分析
function trackFunnelStep(stepName, params = {}) {
  const funnelData = {
    funnel: 'purchase',
    step: stepName,
    timestamp: Date.now(),
    session_id: app.globalData.sessionId,
    user_id: app.globalData.userInfo?.id || 'anonymous',
    ...params
  }

  // 存储漏斗数据到本地，用于后续分析上传
  const funnelLogs = wx.getStorageSync('funnelLogs') || []
  funnelLogs.push(funnelData)
  if (funnelLogs.length > 200) funnelLogs.splice(0, 100)
  wx.setStorageSync('funnelLogs', funnelLogs)

  // 同时作为事件上报
  app.trackEvent(`funnel_${stepName}`, params)
}
```

---

## 6. 建议接入的第三方分析工具

| 工具名称 | 适用场景 | 接入方式 | 费用 |
|---------|---------|---------|------|
| **微信小程序数据分析** | 基础数据、用戶画像、实时看板 | 微信公众平台内置，无需额外开发 | 免费 |
| **腾讯有数** | 电商交易分析、商品分析、渠道归因 | 集成有数 SDK | 免费版有限额 |
| **微信数据助手** | 运营数据、用户新增/留存 | 小程序后台自动统计 | 免费 |
| **阿拉丁小程序统计** | 深度事件分析、自定义漏斗、用户分群 | 引入 aladin.min.js | 基础版免费 |
| **GrowingIO** | 无埋点、用户行为分析、留存分析 | 集成 SDK | 按需付费 |
| **腾讯移动分析(MTA)** | 应用级数据、自定义事件 | 集成 SDK | 免费 |

### 接入建议

- **初级阶段**（MVP）：使用微信小程序后台内置分析 + 自定义 `trackEvent` 上报到自有服务器
- **增长阶段**：接入腾讯有数 for 电商场景 + GrowingIO for 用户行为分析
- **成熟阶段**：接入全链路数据平台，搭建自有的数据看板（如腾讯云 BI）

---

## 7. 埋点实现方案

### 7.1 当前 `trackEvent` 方法扩展

基于现有 `app.js` 中的 `trackEvent` 方法，增加以下能力：

```javascript
// 增强版 trackEvent —— 在 app.js 中扩展
trackEvent(eventName, params = {}) {
  const eventData = {
    event: eventName,
    timestamp: Date.now(),
    page: app.globalData.currentPage || 'unknown',
    user_id: app.globalData.userInfo?.id || 'anonymous',
    device_info: app.globalData.deviceInfo || {},
    session_id: app.globalData.sessionId,
    network_type: app.globalData.networkType,
    ...params
  }

  // 1. 实时发送到统计服务器
  wx.request({
    url: app.globalData.config?.analyticsUrl || 'https://your-analytics.com/track',
    method: 'POST',
    data: eventData,
    header: { 'Content-Type': 'application/json' },
    fail: (err) => {
      console.warn('事件追踪失败，缓存到本地:', err)
      // 2. 上报失败时缓存到本地，后续批量上传
      this.cacheEvent(eventData)
    }
  })

  // 3. 输出到控制台（调试用）
  if (app.globalData.debugMode) {
    console.log('[TrackEvent]', eventName, eventData)
  }
}

// 缓存事件到本地存储
cacheEvent(eventData) {
  try {
    const pendingEvents = wx.getStorageSync('pendingEvents') || []
    pendingEvents.push(eventData)
    // 最多保留500条待上报事件
    if (pendingEvents.length > 500) {
      pendingEvents.splice(0, pendingEvents.length - 500)
    }
    wx.setStorageSync('pendingEvents', pendingEvents)
  } catch (e) {
    console.warn('缓存事件失败:', e)
  }
}

// 批量上报缓存的离线事件
flushPendingEvents() {
  const pendingEvents = wx.getStorageSync('pendingEvents') || []
  if (pendingEvents.length === 0) return

  wx.request({
    url: app.globalData.config?.analyticsUrl || 'https://your-analytics.com/track_batch',
    method: 'POST',
    data: { events: pendingEvents },
    header: { 'Content-Type': 'application/json' },
    success: () => {
      wx.setStorageSync('pendingEvents', [])
    },
    fail: () => {
      // 下次再试
    }
  })
}
```

### 7.2 页面级自动埋点

利用小程序的生命周期方法自动采集页面访问数据：

```javascript
// 页面基类或混入方法
function pageViewMixin() {
  const originalOnLoad = Page.prototype.onLoad
  const originalOnShow = Page.prototype.onShow
  const originalOnHide = Page.prototype.onHide

  Page.prototype.onLoad = function(options) {
    this._pageStartTime = Date.now()
    app.trackEvent(`${this.route?.replace('pages/', '').replace(/\//g, '_')}_load`, { options })
    return originalOnLoad?.call(this, options)
  }

  Page.prototype.onShow = function() {
    this._pageShowTime = Date.now()
    app.trackEvent(`${this.route?.replace(/\//g, '_')}_view`)
    return originalOnShow?.call(this)
  }

  Page.prototype.onHide = function() {
    if (this._pageShowTime) {
      const duration = Date.now() - this._pageShowTime
      app.trackEvent(`${this.route?.replace(/\//g, '_')}_leave`, { duration })
    }
    return originalOnHide?.call(this)
  }
}
```

### 7.3 数据采集频率与采样策略

| 数据类型 | 采集频率 | 采样率 | 说明 |
|---------|---------|-------|------|
| 页面PV/UV | 实时 | 100% | 全面采集 |
| 核心转化事件 | 实时 | 100% | 加购、下单、支付 |
| 用户行为事件 | 实时 | 100% | 收藏、分享等 |
| 商品曝光 | 延时批量 | 100% | 延迟1s批量上报 |
| 页面滚动深度 | 页面离开时 | 20% | 采樣降低性能影响 |
| 网络/性能数据 | 页面离开时 | 10% | 采樣降低性能影响 |

---

## 8. 数据安全与隐私

- 严格遵守微信小程序隐私政策要求
- 不得采集用户密码、支付密码等敏感信息
- 用户数据脱敏后上报（手机号、地址等敏感字段进行哈希处理）
- 用户可选择关闭个性化推荐（通过 `app.globalData.userPreferences` 控制）
- 数据存储周期不超过 12 个月，过期自动清理

---

## 9. 版本记录

| 版本 | 日期 | 变更内容 | 作者 |
|-----|------|---------|------|
| v1.0 | 2026-04-30 | 初始版本，定义埋点指标体系 | — |

