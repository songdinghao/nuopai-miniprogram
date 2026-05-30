# P1 重要缺陷修复记录

## P1-1：购物车规格映射错误

**文件**: `pages/cart/cart.js`
**问题**: `getSpecsText` 使用 `storeConfig.priceRanges/flowerTypes/styles` 去匹配 SKU 属性，但实际 SKU 属性值（`vaseType`: ceramic/glass/wood/metal；`flowerMatch`: simple/rich/luxury；`packaging`: standard/gift/premium）与这些配置表的 id 完全不匹配，导致全部显示英文或 undefined。
**修复**: 移除错误的配置表映射，改用内联 name map（vaseTypeMap/flowerMatchMap/packagingMap），直接返回对应的中文名称。未知值降级返回原始值。

---

## P1-2：首页登录欢迎判断逻辑缺陷

**文件**: `pages/index/index.js`
**问题**: `checkLoginStatus` 中先执行 `setData({ isLogin })` 更新了 `this.data.isLogin`，随后判断 `!this.data.isLogin` 永远为 false，导致登录欢迎语 `showLoginWelcome` 永远不会触发。
**修复**: 在 `setData` 之前将 `this.data.isLogin` 保存到局部变量 `wasLogin`，判断时用 `if (isLogin && !wasLogin)` 代替。

---

## P1-3：首页 `notificationCount` 未定义

**文件**: `pages/index/index.js + .wxml`
**问题**: `.data` 中未定义 `notificationCount`，WXML 中 `notificationCount > 0` 为 undefined 恒为 false，通知角标永不显示。`checkNotifications` 也没有 `setData` 更新该值。
**修复**:
- 在 `data` 中添加 `notificationCount: 0`
- `checkNotifications` 方法中增加 `this.setData({ notificationCount: unreadNotifications })`

---

## P1-4：隐私弹窗授权失败无提示

**文件**: `components/privacy-popup/privacy-popup.js`
**问题**: `wx.requirePrivacyAuthorize` 的 fail 回调仅 `console.warn`，用户完全看不到授权失败信息，体验差。
**修复**: fail 回调中增加 `wx.showToast({ title: '授权失败，请重试', icon: 'none' })`。

---

## P1-5：组件未在页面中引用

**涉及组件**: product-card, voice-search, ar-preview, category-card, promotion-card（6个组件未被任何页面引用）
**修复**:
- 创建 `pages/index/index.json`，注册 `product-card` 组件
- 首页 WXML 中热销商品区域改用 `<product-card product="{{item}}" layout="grid">` 替换原有的硬编码商品卡片
- product-card 组件增加 `name` 字段兼容（页面数据使用 `name` 而非 `title`）
- 添加 `onProductCardTap` 事件处理函数保持埋点追踪
- 其他组件（voice-search/ar-preview/category-card/promotion-card）代码检查无错误，可后续按需引用

---

## P1-6：立即购买未检查登录状态

**文件**: `pages/product/detail.js`
**问题**: `onBuyNow` 方法在规格和库存检查后，直接创建临时订单跳转结算页，未检查用户登录状态，游客可直接跳转结算页导致后续出错。
**修复**: 在创建临时订单之前增加登录状态检查。未登录时弹提示并延迟跳转登录页（带 redirect 参数，登录后返回商品详情继续购买）。

---

## P1-7：拼团只支持2人团（3人团不可选）

**文件**: `pages/product/detail.wxml + detail.js`
**问题**: 底部拼团按钮硬编码 `data-type="{{groupBuyInfo[0].id}}"`，只传第一个拼团类型（2人团）的 ID，用户无法选择 3 人团。
**修复**:
- 移除 WXML 中 `data-type` 属性
- 重构 `onStartGroupBuy`：当存在多个拼团类型且未指定类型时，弹出 `wx.showActionSheet` 让用户选择（显示类型名称、价格和描述）
- 新增 `doStartGroupBuy(typeId)` 方法承载原有的拼团逻辑，支持按选定类型发起
