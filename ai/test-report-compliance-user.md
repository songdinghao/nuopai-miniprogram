# 诺派永生花小程序 — 合规与用户系统测试报告（客户视角）

> 测试日期：2026-04-30  
> 测试目的：模拟真实客户首次使用、浏览、注销、退出等全流程，识别合规与用户系统缺陷。  
> 测试方法：代码走读 + 逻辑推演（未修改任何文件）。

---

## 一、隐私合规

### [P0] 隐私弹窗从未展示

**文件：** `pages/index/index.wxml`、`components/privacy-popup/privacy-popup.js`、`app.js`

**表现：**
- `app.js:1013-1021` 在 `initPrivacyAuthorization()` 中调用 `wx.getPrivacySetting`，正确检查是否需要授权，并将结果写入 `app.globalData.needPrivacyAuth`。
- `app.json:160` 已将 `privacy-popup` 注册为全局组件。
- **但首页 `index.wxml` 中没有任何 `<privacy-popup>` 标签**，也未在其他页面（如 `user.wxml`、`cart.wxml`）引用该组件。
- 没有任何页面或逻辑读取 `app.globalData.needPrivacyAuth` 来条件性地渲染弹窗。

**影响：** 用户首次打开小程序时，隐私弹窗从不弹出，`privacyAgreed` 从未被写入 `true`。虽然 `initPrivacyAuthorization` 会被调用，但 `wx.getPrivacySetting` 返回的 `needAuthorization` 状态未被 UI 消费。这违反了微信隐私合规审核要求，**上架审核必然被拒**。

**建议：** 在首页 WXML 中引入 `<privacy-popup>` 组件并绑定 `show` 属性到 `app.globalData.needPrivacyAuth`。

---

### [P1] `wx.requirePrivacyAuthorize` 失败时仅静默日志

**文件：** `components/privacy-popup/privacy-popup.js:57-66`

**表现：** `onAgree()` 中调用 `wx.requirePrivacyAuthorize`，`fail` 回调仅 `console.warn`，未告知用户授权失败。用户以为已同意，实则系统级授权未注册。

**建议：** fail 回调中显示 Toast 提示用户授权失败，并建议重试或联系客服。

---

### [P2] 隐私政策内容硬编码于 Modal 弹窗

**文件：** `components/privacy-popup/privacy-popup.js:31-37`

**表现：** `onViewPrivacyPolicy()` 使用 `wx.showModal` 展示隐私政策，文本硬编码在代码中。用户无法复制、搜索，无障碍设备无法朗读大段内容。

**建议：** 提供独立的隐私政策页面，或使用可滚动 WebView 加载。

---

### [P2] `app.json` 中 `requiredBackgroundModes` 含 location

**文件：** `app.json:118-121`

**表现：** `requiredBackgroundModes` 声明了 `location`，但实际代码中未在后台使用地理位置。除非有明确的退到后台仍使用位置的场景，否则这会导致审核人员追问。

**建议：** 如果不需要后台定位，移除 `location`。

---

## 二、游客模式（未登录浏览）

### [P1] 立即购买未拦截未登录用户（但结算页有兜底）

**文件：** `pages/product/detail.js:937-985`

**表现：**
- `onAddToCart()`（加购）不检查登录状态——可以接受，属于良好体验。
- `onBuyNow()` 也不检查登录状态，直接跳转到结算页。
- 结算页 `checkout.js:287-299` 在 `onSubmitOrder()` 中才检查登录并拦截。所以用户走完整个结算流程点击"提交订单"才被告知需登录。

**影响：** 用户体验不连贯，填写完地址/优惠券信息后才发现需要登录，数据可能丢失。

**建议：** `onBuyNow()` 跳转前应检查登录状态，或在结算页 `onLoad`/`onShow` 时即检查并拦截。

---

### [P2] 商品收藏功能未做登录检查

**文件：** `pages/product/detail.js:808-852`

**表现：** `onCollectTap()` 不检查 `app.globalData.isLogin`，未登录用户也可以收藏商品并写入 `userCollections`。注销账号后这部分数据会被清除（`userCollections` 在删除列表中），但未登录时也没有提示用户"登录后可收藏"。

**建议：** 收藏操作前检查登录状态，未登录时提示去登录（与用户中心其他功能行为一致）。

---

### [P2] 手机号登录页模拟验证码发送（无后端）

**文件：** `pages/login/login.js:122-157`

**表现：** `onSendCode()` 显示"验证码已发送"但实际未调用任何 API，纯本地模拟。

**影响：** 这是模拟代码的阶段性特征，进入真机测试或上线前必须对接真实短信服务。

---

## 三、用户注销

### [P0] 注销后个人数据清理不完整

**文件：** `pages/user/user.js:474-535`

**表现：** `executeAccountDeletion()` 执行以下 key 的清理：

```
'userInfo', 'token', 'tokenExpireTime', 'isLogin', 'orders',
'userCollections', 'userCoupons', 'unreadNotifications',
'tempOrder_direct', 'tempOrder_cart', 'hasGivenNewUserCoupon',
'lastWelcomeDate', 'inviter', 'privacyAgreed',
'privacyAgreedDate', 'privacyAgreedVersion', 'searchHistory'
```

**但以下涉及个人数据的 key 未被清理：**

| 未清理的 Key | 包含的敏感数据 | 风险 |
|---|---|---|
| `addresses` | 收货人姓名、电话、地址 | **高** — 包含完整的个人信息和家庭住址 |
| `userPointsData` | 积分变更明细、时间戳 | 中 — 可推断消费习惯 |
| `referral_invitees` | 邀请关系记录、被邀请用户ID | 中 — 社交关系链 |
| `referral_rewards` | 邀请奖励发放记录 | 低 |
| `referral_invite_code` | 用户邀请码 | 低 |
| `referral_my_inviter` | 邀请人信息 | 低 |
| `app_notifications` | 通知记录（含订单信息） | 中 — 含订单号、物流信息 |
| `errorLogs` | 错误日志（含页面路径、用户ID） | 中 — 含用户行为轨迹 |

**建议：** 完整的 Cookie 清理应包括 `wx.clearStorageSync()`，或在删除列表中补充所有漏掉的 key。至少应清理 `addresses` 和 `userPointsData`。

---

### [P1] 注销手机"验证"非真实验证

**文件：** `pages/user/user.js:448-471`

**表现：** `verifyPhoneForDelete()` 使用 `wx.showModal({ editable: true })` 让用户输入手机号，仅校验手机号格式 `/^1\d{10}$/`，**不与任何已存储的号码做比对**。任何知晓手机号格式的用户均可通过此"验证"。

**建议：** 对接真实验证码下发；或至少将输入与 `wx.getStorageSync('userInfo')?.phone` 做比对。

---

### [P2] 注销入口隐蔽

**文件：** `pages/user/user.js:416-427`、`pages/user/user.wxml:190-194`

**表现：** 注销入口埋在"账号安全"的 `wx.showActionSheet` 第二项（"账号信息"、"注销账号"）。用户需要先找到"账号安全"菜单并点击，再从 ActionSheet 中选第二项。路径过长，不符合《个人信息保护法》中关于提供便捷注销渠道的要求。

**建议：** 在用户中心设置页面增加明确的"注销账号"入口，或至少将 ActionSheet 改为列表页形式。

---

### [P2] 注销后 `userInfo` 设为 `{}` 与 `null` 不一致

**文件：** `pages/user/user.js:514` vs `pages/user/user.js:558`

**表现：**
- 注销后：`app.globalData.userInfo = null`（正确清空）
- 退出登录后：`app.globalData.userInfo = {}`（设为空对象，非 null）
- 用户中心 `checkLoginStatus()`（user.js:92-99）：`const userInfo = app.globalData.userInfo || {}`

退出登录后 `userInfo` 为空对象非 falsy，`|| {}` 会被跳过。注销后为 `null` 会被兜底为空对象。行为不一致。

**建议：** 统一为注销后将 `userInfo` 设为 `null`，退出登录同理。

---

## 四、退出登录

### [P3] 退出登录保留购物车和个人偏好（正常）

**文件：** `pages/user/user.js:556-600`

**表现：** `doLogout()` 删除的 key 与注销相似但更少，未删除 `searchHistory`。购物车（`cartItems`）和用户偏好（`userPreferences`）被正确保留。行为合理。

### [P2] 退出后地址数据仍然存在

**文件：** `pages/user/user.js:562-576`

**表现：** `doLogout()` 同样未清理 `addresses`。在共享设备场景下，退出登录后地址数据仍可通过某种方式被访问（但正常 UI 已隐藏地址列表，因为需要登录才能查看）。

**建议：** 至少在退出确认弹窗中增加提示"是否一并清空收货地址"。

---

## 五、用户中心功能

### [P1] 积分/优惠券/收藏统计仅在已登录时加载，未登录状态下显示正常

**文件：** `pages/user/user.js:52-54`

**表现：**
- `onShow()` 中仅在 `this.data.isLogin` 为 true 时调用 `loadUserData()`
- 未登录时积分/优惠券/收藏显示为默认值 0
- 行为正确。

### [P2] 通知未读数角标已在模板中正确配置

**文件：** `pages/user/user.js:110-113`、`pages/user/user.wxml:102-106`

**表现：** `loadNotificationUnread()` 调用 `notificationManager.getUnreadCount()` 并写入 `notificationUnread`。模板正确展示角标。功能正常。

### [P2] 菜单项登录拦截不完全一致

**文件：** `pages/user/user.js:629-648`

**表现：** `checkLogin()` 方法使用 `showModal` 弹窗询问用户"是否去登录？"。但并非所有菜单项都调用此方法：
- `onCouponTap`、`onAddressTap`、`onInviteTap`、`onAnniversaryTap`：调用了 `checkLogin()` ✅
- `onFavoritesTap`、`onHistoryTap`：调用了 `checkLogin()` ✅
- `onNotificationTap`：**不调用 `checkLogin()`** — 通知页面应可供未登录用户查看系统通知，行为合理。

---

## 六、综合建议

### 上架前必须修复（P0）

1. 首页 WXML 中引入 `<privacy-popup>` 组件并绑定状态（`app.globalData.needPrivacyAuth`）
2. 注销账号时完整清理所有个人数据（至少包括 `addresses`、`userPointsData`、所有 `referral_*` key、`app_notifications`、`errorLogs`）

### 建议修复（P1）

3. `wx.requirePrivacyAuthorize` fail 回调增加用户提示
4. `onBuyNow()` 跳转前检查登录状态，或结算页 onLoad 即检查
5. 注销"手机验证"增加真实校验
6. `app.globalData.userInfo` 在退出登录后统一为 `null`

---

## 附：关键代码引用

| 检查项 | 关键文件 | 行号 |
|---|---|---|
| 隐私授权初始化 | `app.js` | 1011-1038 |
| 隐私弹窗组件 | `components/privacy-popup/privacy-popup.js` | 1-79 |
| 首页WXML（缺弹窗） | `pages/index/index.wxml` | 1-501 |
| 加购/立即购买 | `pages/product/detail.js` | 856-934, 937-994 |
| 结算登录拦截 | `pages/order/checkout.js` | 287-299 |
| 注销流程 | `pages/user/user.js` | 432-535 |
| 退出登录 | `pages/user/user.js` | 538-600 |
| 积分管理器 | `utils/points-manager.js` | 全文件 |
| 通知管理器 | `utils/notification-manager.js` | 全文件 |
