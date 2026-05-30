# 诺派永生花小程序 — 核心购物流程测试报告

**测试视角**：30-55岁家庭主妇客户  
**测试范围**：首页 → 分类 → 商品详情 → 购物车 → 结算 → 登录/注册 → 订单  
**测试方法**：全量代码走读 + 逻辑推演（未修改任何文件）  
**报告日期**：2026-04-30

---

## 🔴 P0 — 功能不可用或数据丢失

### P0-1：首页跳转 TabBar 页面全部使用 wx.navigateTo，跳转会失败

**路径**：`pages/index/index.js:908-910`

首页有多个跳转到 TabBar 页面（category、cart、user）的地方，但全部使用了 `wx.navigateTo`。微信小程序规定 TabBar 页面必须使用 `wx.switchTab` 跳转，用 `navigateTo` 会静默失败。

**受影响的方法**：
| 方法 | 行号 | 目标页面 | 问题 |
|------|------|---------|------|
| `onCategoryTap` | 908 | `/pages/category/category` | TabBar 页不可 navigateTo |
| `onCartTap` | 1082 | `/pages/cart/cart` | TabBar 页不可 navigateTo |
| `onUserAvatarTap` | 1068/1073 | `/pages/user/user` 或 `/pages/login/login` | 前者是 TabBar 页 |
| `onViewMoreTap` | 1203 | `/pages/category/category` | TabBar 页不可 navigateTo |

**影响**：客户点击"分类导航"、"购物车"、"查看更多"等功能**完全无响应**，核心购物流程第一步就卡死。

---

### P0-2：购物车商品字段名 `productId` vs `product_id` 不一致

**路径**：
- `pages/product/detail.js:896-908` ← 使用 `productId` 存储
- `pages/cart/cart.js:434-446` ← 使用 `product_id` 读取

商品详情页 `onAddToCart` 往购物车写入的数据字段名是 `productId`（驼峰），但购物车页 `onProductTap` 读取时用的是 `product_id`（下划线）：

```js
// detail.js (正确)
cartItems.push({
  productId: this.data.productId,  // 字段名 productId
  ...
})

// cart.js (错误)
wx.navigateTo({
  url: `/pages/product/detail?id=${item.product_id}`  // 读到的是 undefined！
})
```

**同样问题**：`doDeleteItem` 的事件追踪（cart.js:332）也用了 `product_id`，追踪数据为空。

**影响**：购物车点击商品跳转详情页时，`id` 参数为 `undefined`，页面会显示默认商品（100001）而不是点击的那个商品。**数据没有丢失但用户看到的不是想看的商品**。

---

### P0-3：结算页与地址页 localStorage key 不一致，地址永远加载不到

**路径**：
- `pages/order/checkout.js:109` → 读取 `addresses`
- `pages/user/address/address.js:51` → 存储 `addressList`

结算页 `loadOrderData` 使用 `wx.getStorageSync('addresses')` 读取收货地址，但地址管理页面增删改查全部使用 key `addressList`。两个 key 不同，结算页**永远读不到用户保存的地址**。

**影响**：客户在结算页永远看不到「选择收货地址」，提交订单时地址验证（checkout.js:303-310）会提示"请选择收货地址"，但实际没有任何地址可选。**流程完全卡死，无法提交订单**。

---

### P0-4：登录后购物车合并字段名不一致，合并完全无效

**路径**：`pages/login/login.js:331-348`

`mergeCartAfterLogin` 方法试图将游客模式下的临时订单商品合并到本地购物车，但匹配逻辑使用了 `product_id`（下划线），而购物车数据实际存储的是 `productId`（驼峰）：

```js
// login.js (错误)
tempItems.forEach(tempItem => {
  const existIndex = merged.findIndex(localItem => 
    localItem.product_id === tempItem.product_id  // product_id 字段不存在！
  )
  ...
})
```

`findIndex` 永远返回 `-1`，所有临时订单商品都会被作为"本地没有的商品"直接追加到购物车，导致**重复添加商品**。

**影响**：游客模式下在购物车结算被引导登录后，购物车商品会翻倍增加。

---

## 🟡 P1 — 逻辑缺陷或体验问题

### P1-1：购物车 `getSpecsText` 规格映射完全错误

**路径**：`pages/cart/cart.js:153-167`

`getSpecsText` 用错误的配置表去匹配 SKU 属性的值：

| 属性字段 | 实际值（来自 detail.js） | 被匹配的配置数据 | 匹配是否成功 |
|---------|----------------------|----------------|------------|
| `attrs.vaseType` | `ceramic`, `glass`, `wood`, `metal` | `storeConfig.priceRanges` (id: `range_200_300`…) | ❌ 失败 |
| `attrs.flowerMatch` | `simple`, `rich`, `luxury` | `storeConfig.flowerTypes` (id: `rose`, `hydrangea`…) | ❌ 失败 |
| `attrs.packaging` | `standard`, `gift`, `premium` | `storeConfig.styles` (id: `modern`, `luxury`…) | ❌ 失败 |

所有查找都会失败，回退为 `attrs.vaseType || attrs.vaseType`，**规格永远显示英文原始值如 "ceramic · simple · standard"**，而不是中文 "陶瓷花器 · 简约搭配 · 标准包装"。

**影响**：客户无法看懂商品规格，体验差但功能可用。

---

### P1-2：首页登录欢迎判断逻辑缺陷

**路径**：`pages/index/index.js:243-258`

```js
checkLoginStatus() {
    const isLogin = app.globalData.isLogin
    const userInfo = app.globalData.userInfo
    if (isLogin !== this.data.isLogin || userInfo !== this.data.userInfo) {
      this.setData({ isLogin, userInfo })  // ← 已经同步更新 this.data.isLogin
      if (isLogin && !this.data.isLogin) {  // ← 此时 this.data.isLogin === isLogin，永远为 false
        this.showLoginWelcome()
      }
    }
  },
```

`setData` 之后 `this.data.isLogin` 已经被更新为和 `isLogin` 相同的值，所以 `!this.data.isLogin` 永远为 `false`，登录欢迎语永远不会弹出。

**影响**：登录成功不会有"欢迎回来"的反馈，但核心功能不受影响。

---

### P1-3：首页促销活动链接指向不存在的页面

**路径**：`pages/index/index.js:588-631` + `config/store-config.js`

| 促销项 | WXML 显示的 link | 实际页面路径 | 存在？ |
|-------|-----------------|------------|-------|
| 新人专享 | `/pages/coupon/coupon` | `/pages/user/coupon` | ❌ 不存在 |
| 积分兑换 | `/pages/points/points` | `/pages/user/points` | ❌ 不存在 |
| 会员专享 | `/pages/vip/vip` | (无此页面) | ❌ 不存在 |

客户点击这些促销活动会**跳转到不存在的页面**，微信小程序会触发 `onPageNotFound` → 重定向到首页。体验虽然不会崩溃，但用户困惑。

---

### P1-4：首页 WXML 引用未定义的 `notificationCount`

**路径**：`pages/index/index.wxml:32-33`

```xml
<view wx:if="{{notificationCount > 0}}" class="notification-badge">
```

`notificationCount` 未在 index.js 的 `data` 中定义，也没有任何 `setData` 设置过它。小程序会将其默认为 `undefined`，条件判断 `undefined > 0` 为 `false`，**消息角标永远不会显示**。首页 `checkNotifications` 方法虽然读取了 `unreadNotifications`，但并未 setData 到 `notificationCount`。

**影响**：客户永远不会看到消息小红点提示。

---

### P1-5：结算后临时订单清理逻辑在特定路径下丢失数据

**路径**：`pages/order/checkout.js:385-387`

```js
const tempOrderKey = this.data.orderSource === 'direct_buy' ? 'tempOrder_direct' : 'tempOrder_cart'
wx.removeStorageSync(tempOrderKey)
```

仅清理了当前来源对应的 key。如果用户先后从购物车和"立即购买"进入结算，另一个 key 的脏数据仍然保留，下次进入时会被读取到旧的临时订单。不过这不是一个严重的 P0，因为关键功能正常。

---

### P1-6：注册页发放优惠券返回值未使用

**路径**：`pages/register/register.js:149`

```js
const newCoupon = referral.giveNewUserReferralCoupon()
```

调用 `giveNewUserReferralCoupon()` 的返回值赋值给 `newCoupon`，但后续从未使用。如果发放失败，注册页不会感知到。不过功能本身（发放优惠券）是正常的，只是缺少错误处理。

---

### P1-7：订单详情页 `filterActions` 硬编码不完整

**路径**：`pages/order/detail.js:106-117`

```js
const implementedActions = ['cancel', 'confirm', 'rebuy']
```

`filterActions` 将售后（`afterSale`）、评价（`review`）、支付（`pay`）等操作全部过滤掉。虽然`generateMockOrderDetail`传入了 `afterSale`，但会被过滤掉。如果有订单确实需要显示售后入口，将不会出现。

**影响**：客户在订单详情页看不到"申请售后"按钮（就算订单状态应该显示），依赖 WXML 中是否直接有这个按钮。如果 WXML 硬编码了该按钮，客户点击会出现无响应或提示"即将上线"。

---

## 🟢 P2 — 体验小优化建议

### P2-1：首页轮播图第2张链接指向 TabBar 页面

**路径**：`pages/index/index.js:377-379`

banner2 的 link 是 `/pages/category/category?id=new_arrivals`，用 `navigateTo` 跳转会失败。建议改为带参数跳转到分类页，或改为其他非 TabBar 页面。

### P2-2：首页 WXML 使用 `scroll-view` 与 `onReachBottom` 不兼容

**路径**：`pages/index/index.wxml:48-56`

首页使用了 `<scroll-view>` 实现滚动，但同时页面配置了 `"onReachBottomDistance": 50`。微信小程序中，页面级的 `onReachBottom` 只对页面原生滚动生效，对 `<scroll-view>` 内部滚动不触发。`loadMoreProducts` 永远不执行。

**建议**：改用 `bindscrolltolower`（已在 WXML 中配置）代替 `onReachBottom`，或去掉 scroll-view 改用页面原生滚动。

### P2-3：首页 `onBannerTap` 对第2个轮播图的跳转无特殊处理

第2个轮播图 link 指向分类页（TabBar），但 `onBannerTap` 统一用 `navigateTo` 跳转。建议对于 TabBar 页面使用 `switchTab` 并传参（switchTab 不支持参数，需要改用全局变量或 storage）。

### P2-4：分类页样式筛选（styles）属性在商品数据中未完整覆盖

**路径**：`pages/category/category.js:406-413`

通过 `Math.random()` 生成的模拟商品数据使用 `styles` 数组（`modern`, `luxury`, `rural` 等），但预置的 10 个商品中有 `chinese`, `european` 风格也在分类页配置中。风格筛选时可能出现部分风格筛选结果为空。建议确认真实后端 API 数据是否完整覆盖。

### P2-5：购物车 WXML 中 `wx:key` 绑定不当

**路径**：`pages/cart/cart.wxml:54`

```xml
<view class="cart-item" wx:for="{{cartItems}}" wx:key="id">
```

购物车商品项的 `wx:key` 用了 `id`，但购物车数据项没有 `id` 字段。实际商品用 `skuInfo.id` 作为 SKU ID，用 `productId` 作为商品 ID，但没有顶层 `id`。建议改为 `wx:key="productId"`。

**影响**：列表 diff 更新性能优化失效，但功能正常。

### P2-6：结算页优惠券选择弹窗只显示折扣金额，没有说明

**路径**：`pages/order/checkout.js:242-245`

```js
const items = available.map(c => {
  const discount = couponManager.calculateDiscount(c, goodsPrice)
  return `${c.name} (-¥${discount.toFixed(1)})`
}).concat(['不使用优惠券'])
```

弹窗只显示了优惠券名称和折扣金额，没有显示使用条件（如"满299可用"）。客户选了优惠券但结算时才发现不满足条件，体验不友好。

### P2-7：地址管理页「编辑」和「手动添加」都标记为"即将上线"

**路径**：`pages/user/address/address.js:118-123` 和 `address.js:212`

客户无法编辑已有地址（只能删除后重新添加），也无法手动输入地址（只能用微信地址选择器）。对于不太会用微信地址选择器的中老年主妇用户，建议优先实现手动添加。

### P2-8：若干页面未实现 `onShareAppMessage` 或返回逻辑过于简单

- 部分页面（如地址管理）实现了 `onShareAppMessage`，但分享小程序地址管理页面没有实际意义。
- 购物车页面没有 `onShareAppMessage`，符合预期。

---

## 问题汇总

| 严重度 | 数量 | 关键问题 |
|-------|------|---------|
| 🔴 P0 | 4 | TabBar 跳转全用 navigateTo(4处)、购物车字段名不一致、地址 key 不一致、登录合并字段名不一致 |
| 🟡 P1 | 7 | 规格映射错误、登录欢迎判断逻辑错误、促销链接不存在、notificationCount 未定义、临时订单残留、注册券返回值未处理、售后入口被过滤 |
| 🟢 P2 | 8 | 轮播图链接问题、scroll-view + onReachBottom 不兼容、分类数据覆盖、购物车 wx:key、优惠券说明、地址编辑不可用等 |

### 修复优先级建议

1. **立即修复 (P0)**：首页1→分类/购物车/用户的跳转改用 `switchTab`（影响购物流程入口）
2. **立即修复 (P0)**：结算页 `addresses` → `addressList` key 统一（影响下单流程）
3. **建议修复 (P0)**：购物车 `product_id` → `productId` 统一、登录合并 `product_id` 字段修正
4. **重要修复 (P1)**：购物车 `getSpecsText` 映射表修正（影响商品规格展示）
5. **重要修复 (P1)**：首页 `checkLoginStatus` 欢迎语判断逻辑修正
6. **计划修复 (P1)**：促销链接路径修正、`notificationCount` 数据绑定
7. **优化项 (P2)**：下滑分批处理
