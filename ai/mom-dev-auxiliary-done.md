# 兼职妈妈模块5+6 — 合规通知 + 辅助功能 完成报告

## 完成时间
2026-04-30

## 模块概述

完成了「兼职妈妈」分享奖励计划的合规通知模块（模块5）和辅助功能模块（模块6），包括通知设置、大字版规则说明页、FAQ常见问题页和客服通道。

---

## 任务A：合规通知（模块5）

### 1. 微信服务通知工具
- **文件**: `utils/mom-notification.js`
- **功能**:
  - `sendSettlementNotification(orderInfo)` — 收益到账通知（模拟实现），使用本地通知管理器记录，支持每日1条限制
  - `checkDailyLimit(userId)` — 单日最多1条限制，基于日期+用户ID的存储键检查
  - `requestSubscribe(tmplId)` — 请求用户订阅微信通知，使用 `wx.requestSubscribeMessage` API
  - `isSubscribed()` / `unsubscribe()` — 订阅状态查询和取消

### 2. 通知设置页
- **文件**: `pages/mom/settings/` (4个文件: wxml/wxss/js/json)
- **功能**:
  - 收益提醒开关（默认开启）
  - 订阅通知按钮（点击触发订阅请求）
  - 大字版开关（联动全局字体设置）
  - 三级字体选择：标准 / 大 / 超大
  - 新手期倒计时显示（30天倒计时）
  - 提示信息：每日最多1条通知

---

## 任务B：辅助功能（模块6）

### 1. 大字版规则说明页
- **文件**: `pages/mom/rules/` (4个文件)
- **特点**:
  - 大字版设计：正文≥14px，模块标题17-19px，点标题16-18px
  - 粉白渐变主调 + 极简图文卡片式布局
  - **合规文案**：全站禁用"分销/返佣/拉人头/提成"等敏感词，统一使用"分享津贴/奖励/权益"
  - **四大规则区块**：
    - 准入规则：参与资格、参与方式、新手期、适用范围
    - 分享津贴规则：津贴计算（3%/5%/8%三档）、奖励发放（7个工作日）、额外奖励、特殊情况
    - 提现规则：门槛（50元）、方式（微信零钱）、限额（单笔500/日1000）、手续费（免费）
    - 权益兑换规则：兑换方式（1:1等值）、兑换范围（指定商品+混合支付）、有效期（180天）
  - **关键词搜索功能**：支持实时搜索规则内容，搜索结果可点击跳转到对应区块
  - **快速导航**：顶部快速跳转链接，支持快速滑动浏览
  - **大字版适配**：`.font-large` / `.font-extra-large` 两档放大
  - 引用 `loadUserPreferences()` 和 `watchFontSizeChange`

### 2. FAQ + 客服通道
- **文件**: `pages/mom/faq/` (4个文件)
- **FAQ功能**:
  - 三大分类：收益问题(4题)、提现问题(4题)、其他问题(4题)
  - 折叠展开交互（点击问题展开答案，可单独控制）
  - 答案内嵌操作按钮：联系客服、去商城逛逛
  - 问题覆盖：到账时间、未到账原因、0收益原因、提现门槛/时效/失败、有效期、兑换、客服联系等
- **客服通道**:
  - 顶部固定"联系客服"按钮（使用 `open-type="contact"` 微信官方客服组件）
  - 三个快捷入口：在线客服、规则说明、通知设置
  - 底部联系客服区（无答案时引导）
  - 支持客服会话回调处理
  - 降级处理：打开客服失败时引导到FAQ页

### 3. 兼职妈妈首页
- **文件**: `pages/mom/home/` (4个文件)
- **首页功能**:
  - 收益摘要卡片（累积/今日/本月收益 + 成功分享数）
  - 功能入口网格：规则说明、通知设置、常见问题、联系客服
  - 新手引导：三步进度 + 剩余天数倒计时（30天）
  - 分享记录列表（待结算/已到账状态）
  - 空状态处理
  - 引用 `loadUserPreferences()` 和 `watchFontSizeChange`

### 4. app.json注册
- 新增页面注册：
  - `pages/mom/home/home`
  - `pages/mom/rules/rules`
  - `pages/mom/settings/settings`
  - `pages/mom/faq/faq`

---

## 设计规范遵循
- **主色调**: #FF6B9D / #FFF0F5（粉白渐变）
- **字号**: 正文≥15px，标题17-20px
- **可点击区域**: ≥44px
- **圆角**: 按钮8px，卡片12px
- **阴影**: 统一使用浅阴影 `0 2px 8px rgba(0,0,0,0.06)`
- **字体大小适配**: 所有页面加载 `loadUserPreferences()` + `watchFontSizeChange()`
- **敏感词**: 全站使用"分享津贴/奖励/权益"，禁用"分销/返佣/拉人头/提成"

## 文件清单
| 文件 | 说明 |
|------|------|
| `utils/mom-notification.js` | 收益通知工具（发送/订阅/限制） |
| `pages/mom/home/home.wxml` | 兼职妈妈首页模板 |
| `pages/mom/home/home.wxss` | 兼职妈妈首页样式 |
| `pages/mom/home/home.js` | 兼职妈妈首页逻辑 |
| `pages/mom/home/home.json` | 兼职妈妈首页配置 |
| `pages/mom/settings/settings.wxml` | 通知设置页模板 |
| `pages/mom/settings/settings.wxss` | 通知设置页样式 |
| `pages/mom/settings/settings.js` | 通知设置页逻辑 |
| `pages/mom/settings/settings.json` | 通知设置页配置 |
| `pages/mom/rules/rules.wxml` | 规则说明页模板 |
| `pages/mom/rules/rules.wxss` | 规则说明页样式 |
| `pages/mom/rules/rules.js` | 规则说明页逻辑 |
| `pages/mom/rules/rules.json` | 规则说明页配置 |
| `pages/mom/faq/faq.wxml` | 常见问题页模板 |
| `pages/mom/faq/faq.wxss` | 常见问题页样式 |
| `pages/mom/faq/faq.js` | 常见问题页逻辑 |
| `pages/mom/faq/faq.json` | 常见问题页配置 |
| `app.json` | 新增4个mom页面注册 |
