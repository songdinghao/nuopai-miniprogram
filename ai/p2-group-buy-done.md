# 诺派永生花小程序 — 拼团功能开发完成报告

## 实现概要

完成了小程序拼团（Group Buy）功能的全部开发，涵盖数据模型、商品详情页入口、独立拼团页面、订单结算支持及分享功能。

---

## 已修改/新增文件

### 新增文件
| 文件 | 说明 |
|------|------|
| `utils/group-buy.js` | 拼团数据模型与工具函数（核心逻辑） |
| `pages/group/group.js` | 拼团页面逻辑 |
| `pages/group/group.wxml` | 拼团页面模板 |
| `pages/group/group.wxss` | 拼团页面样式 |
| `pages/group/group.json` | 拼团页面配置 |

### 修改文件
| 文件 | 修改内容 |
|------|----------|
| `config/store-config.js` | 新增 `groupBuy` 配置段落（2人团/3人团、价格折扣、有效期、团长优惠、分享文案、规则说明） |
| `pages/product/detail.js` | 引入 group-buy.js，增加拼团数据加载、发起拼团/查看拼团事件处理 |
| `pages/product/detail.wxml` | 增加拼团价格展示区、社交证明、底部「发起拼团」按钮 |
| `pages/product/detail.wxss` | 增加拼团入口样式、拼团按钮样式（金色渐变） |
| `pages/order/checkout.js` | 解析 groupBuyId 参数、加载拼团信息、订单数据携带拼团标记 |
| `pages/order/checkout.wxml` | 增加拼团标签、拼团信息展示 |
| `pages/order/checkout.wxss` | 增加拼团标签/信息样式 |
| `app.json` | 注册 `pages/group/group` 页面路径 |

---

## 功能详情

### 1. 拼团数据模型 (`utils/group-buy.js`)
- **2人团 (group2)**：92折，24小时有效期，团长额外2%优惠 + 精美贺卡
- **3人团 (group3)**：85折，48小时有效期，团长额外3%优惠 + 精美贺卡+丝带
- 核心函数：`createGroup` 创建拼团、`joinGroup` 加入拼团、`calcGroupPrice` 计算拼团价、`calcLeaderPrice` 计算团长价
- 状态管理：`pending`（待成团）、`success`（已成团）、`expired`（已过期）
- 存储：通过 `wx.setStorageSync` 持久化拼团数据

### 2. 商品详情页拼团入口 (`pages/product/detail.js/.wxml/.wxss`)
- 价格下方显示拼团价格区（粉色标签 + 拼团价格 + 原价对比）
- 社交证明：「已X人拼团成功」或「有X个拼团进行中」
- 底部操作栏新增金色渐变「发起拼团」按钮

### 3. 拼团页面 (`pages/group/`)
- 展示商品信息、当前参团人数（头像排列 + 空缺占位）
- 粉色渐变进度条显示拼团进度
- 倒计时醒目显示（`HH:MM:SS` 格式，每秒更新）
- 三种状态卡片：待成团/已成团/已过期
- 拼团规则弹窗
- 分享栏（分享给好友 + 复制链接）

### 4. 订单结算支持拼团 (`pages/order/checkout.js/.wxml/.wxss`)
- 拼团入口携带 `groupBuyId` 参数
- 按拼团价计算订单金额
- 订单数据标记 `isGroupBuy: true` + 拼团详情
- 结算页显示「拼团单」标签

### 5. 分享拼团 (`pages/group/group.js`)
- `onShareAppMessage`：商品图 + 拼团价文字 + 参团人数 + 团ID路径
- `onShareTimeline`：朋友圈分享支持
- 好友点击分享卡片直接跳转到对应拼团页

---

## 设计规范落实
- 拼团标签：粉色底 `#FFF0F5` → 粉色字 `#FF6B9D`
- 拼团进度条：粉色渐变填充
- 倒计时：`Courier New` 等宽字体醒目展示
- 按钮颜色区分：拼团用金色渐变（`#FFD700 → #FF9800`），普通购买用粉色渐变
