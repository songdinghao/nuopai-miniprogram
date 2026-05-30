# P3: 消息通知系统 + 数据埋点方案 — 完成记录

## 概述

完成消息通知系统完善、数据埋点方案文档和微信公域流量适配方案文档。

---

## 任务1：消息通知系统完善

### 创建文件

| 文件 | 说明 |
|------|------|
| `utils/notification-manager.js` | 消息通知管理器（新增） |

**核心功能**：
- `getNotifications(type?, status?)` — 获取消息列表（支持类型和状态筛选）
- `markAsRead(notificationId)` — 标记单条已读
- `markAllAsRead()` — 全部已读
- `deleteNotification(id)` — 删除单条通知
- `getUnreadCount()` — 获取未读数量
- `createNotification(data)` — 创建通知（支持扩展：订单/营销/系统）
- `initMockData()` — 模拟数据初始化（订单、优惠券、纪念日、系统公告）
- `notifyOrderStatusChange()` / `notifyCouponExpiring()` / `notifyAnniversaryReminder()` / `notifySystemAnnouncement()` — 场景化通知创建
- 本地存储于 `wx.setStorageSync('app_notifications', ...)`，最多保留 100 条
- 数据结构：`{ id, type, title, summary, data, isRead, createTime, updateTime }`

### 修改文件

| 文件 | 变更内容 |
|------|---------|
| `pages/notification/notification.js` | 对接 notification-manager：用 `getNotifications()` 替代 mock 数据，`markAsRead/markAllAsRead/deleteNotification` 调 manager API；Tab 筛选基于 `getNotifications(type)`；追加事件追踪埋点 |
| `pages/notification/notification.wxml` | `getFilteredNotifications()` → `filteredNotifications` 数据绑定 |
| `pages/user/user.js` | 导入 notification-manager、新增 `notificationUnread` 数据字段、`loadNotificationUnread()` 读取未读数、`onNotificationTap()` 导航到通知页 |
| `pages/user/user.wxml` | 第一组菜单首位增加「消息通知」菜单项 + 未读数角标 |
| `app.js` | 导入 notification-manager、`initModules()` 增加 `initNotification()`、`globalData` 增加 `notificationManager` |

---

## 任务2：数据埋点方案文档

### 创建文件

| 文件 | 说明 |
|------|------|
| `ai/data-tracking-plan.md` | 数据埋点方案文档 |

**文档结构**：
1. 事件命名规范（`[模块]_[动作]_[对象]` 命名法）
2. 埋点指标定义（6大类：页面访问、商品曝光、加购下单、用户互动、营销活动、消息通知）
3. 用户行为路径分析（主路径 + 次要路径 + 用户分群）
4. 转化漏斗定义（首页→详情→加购→结算→支付，各环节流失分析）
5. 建议接入的第三方分析工具（微信数据分析、腾讯有数、GrowingIO 等）
6. 埋点实现方案（基于现有 `trackEvent` 扩展：离线缓存、批量上报、页面自动埋点 mixin）
7. 数据安全与隐私

---

## 任务3：微信公域流量适配方案文档

### 创建文件

| 文件 | 说明 |
|------|------|
| `ai/wechat-traffic-plan.md` | 微信公域流量适配方案文档 |

**文档结构**：
1. 视频号挂载小程序方案（主页橱窗、直播小黄车、内容运营节奏）
2. 搜一搜搜索优化（关键词策略、页面SEO、搜索结果展示优化）
3. 公众号图文引流（内容策略、4种嵌入方式、引流追踪）
4. 朋友圈广告投放建议（定向设置、素材建议、投放节奏、节日计划）
5. 渠道归因与效果评估（场景值映射、分渠道指标、LTV模型）
6. 实施路线图（4阶段8周计划）

---

## 关键设计决策

1. **本地存储 vs 内存状态**：消息通知数据采用 `wx.setStorageSync` 本地持久化，避免内存状态随页面切换丢失，同时为后续接入后端 API 提供过渡方案
2. **数据上限控制**：最多保留 100 条通知，超过时自动淘汰最旧条目
3. **通知类型扩展性**：`createNotification` 接受通用参数，同时提供场景化工厂方法简化调用
4. **埋点离线缓存**：`trackEvent` 上报失败时自动缓存到本地 `pendingEvents`，后续 `flushPendingEvents` 批量重传
5. **渠道归一化**：通过微信场景值（scene）统一标识流量来源，支持 20+ 渠道识别

---

## 完成时间

2026-04-30

