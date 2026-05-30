# P0 阻断级 Bug 修复记录

> 修复时间：2026-04-30
> 项目：诺派永生花商城小程序

---

## P0-1：隐私弹窗从未展示

- **定位**：`pages/index/index.wxml` 缺少 `<privacy-popup>` 组件引用；`pages/index/index.js` 的 `onShow` 未同步 `needPrivacyAuth` 状态。
- **修改 1**：`pages/index/index.wxml` — 在根 `<view>` 容器顶部（状态栏前）添加：
  ```xml
  <privacy-popup wx:if="{{needPrivacyAuth}}"></privacy-popup>
  ```
- **修改 2**：`pages/index/index.js` — 在 `data` 中添加 `needPrivacyAuth: false`；在 `onShow()` 中加入：
  ```js
  this.setData({ needPrivacyAuth: app.globalData.needPrivacyAuth })
  ```

---

## P0-2：TabBar 跳转全用 navigateTo

- **定位**：`pages/index/index.js` 中 `onCategoryTap`、`onCartTap`、`onUserAvatarTap`（已登录时）、`onViewMoreTap` 使用 `wx.navigateTo` 跳转 TabBar 页面，静默失败。
- **修改**：
  - `onCategoryTap`：改为 `wx.switchTab`，分类参数通过 `app.globalData.navigateParams` 中转。
  - `onCartTap`：改为 `wx.switchTab`。
  - `onUserAvatarTap`：已登录时改为 `wx.switchTab`（`/pages/user/user`），未登录时保持 `wx.navigateTo`。
  - `onViewMoreTap`：改为 `wx.switchTab`，查询参数通过 `app.globalData.navigateParams` 中转。

---

## P0-3：地址 key 不匹配

- **定位**：`pages/order/checkout.js` 第 109 行读取 `wx.getStorageSync('addresses')`，但 `pages/user/address/address.js` 写入 `wx.setStorageSync('addressList')`。
- **修改**：`pages/order/checkout.js` — 将 `getStorageSync('addresses')` 改为 `getStorageSync('addressList')`。

---

## P0-4：购物车字段名不一致（cart.js）

- **定位**：`pages/product/detail.js` 存入购物车时使用 `productId`，但 `pages/cart/cart.js` 读取时使用 `product_id`。
- **修改**：`pages/cart/cart.js`
  - `doDeleteItem`（第 331 行）：`deletedItem.product_id` → `deletedItem.productId`
  - `onProductTap`（第 439/444 行）：`item.product_id` → `item.productId`

---

## P0-5：登录合并购物车字段名不一致

- **定位**：`pages/login/login.js` 的 `mergeCartAfterLogin()` 中使用 `product_id` 匹配购物车商品，但购物车数据使用 `productId` 字段，导致合并匹配失败、商品翻倍。
- **修改**：`pages/login/login.js` — `mergeCartAfterLogin` 中将 `product_id` 改为 `productId`。

---

## P0-6：搜索结果页 goBack 缺失

- **定位**：`pages/search/result/result.wxml` 第 5 行返回按钮绑定了 `bindtap="goBack"`，但 `result.js` 中未定义该方法。
- **修改**：`pages/search/result/result.js` — 在 `onShareAppMessage` 后添加：
  ```js
  goBack() { wx.navigateBack() }
  ```

---

## P0-7：首页促销链接路径全错

- **定位**：`pages/index/index.js` 的 `loadPromotions()` 中促销链接指向不存在的路径。
- **修改**：
  - 新人专享：`/pages/coupon/coupon` → `/pages/user/coupon`
  - 积分兑换：`/pages/points/points` → `/pages/user/points`
  - 会员专享：`/pages/vip/vip` → `/pages/user/user`（/pages/vip/vip 不存在，改为个人中心页）

---

## 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `pages/index/index.wxml` | 添加 privacy-popup 组件引用 |
| `pages/index/index.js` | 添加 needPrivacyAuth 数据、onShow 同步、4个跳转改为 switchTab、修正 3 个促销链接 |
| `pages/order/checkout.js` | 地址 storage key 改为 addressList |
| `pages/cart/cart.js` | 3处 product_id 改为 productId |
| `pages/login/login.js` | mergeCartAfterLogin 中 product_id 改为 productId |
| `pages/search/result/result.js` | 添加 goBack 方法 |
