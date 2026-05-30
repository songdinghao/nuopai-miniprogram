# QA 测试报告：诺派永生花「兼职妈妈体验官」新功能

**测试日期**：2026-04-30  
**测试方法**：代码走读 + 逻辑推演（模拟 30-55 岁妈妈用户）  
**测试者**：general-purpose-1

---

## 概览

| 严重度 | 数量 | 说明 |
|--------|------|------|
| 🔴 P0 | 9 | 功能不可用 — 页面白屏、跳转失败、按钮无反应 |
| 🟡 P1 | 10 | 逻辑缺陷 — 数据不匹配、状态不一致、路径错误 |
| 🟢 P2 | 5 | 体验优化建议 |

---

## 🔴 P0：功能不可用

### P0-1【页面渲染失败】home.wxml 引用了大量未定义的 data 字段 — 收益摘要、等级、邀请码等全部为 undefined

**文件**：`pages/mom/home/home.js` (L6-L44)、`pages/mom/home/home.wxml` (L48-L71, L125-L144)

**问题描述**：home.wxml 模板引用了 `pendingEarnings`、`settledEarnings`、`momLevel`、`newbieDaysLeft`、`inviteCode`、`monthlyShareCount`、`monthlyOrders`、`monthlyEarnings` 共 8 个数据字段，但 home.js 的 `data` 对象中**完全没有定义**这些字段。home.js 只定义了 `totalEarnings`、`todayEarnings`、`thisMonthEarnings`、`orderCount`、`showGuide`、`guideDaysLeft`、`stepIndex`、`hasNewSetting`、`records`。这些字段在 wxml 中渲染为 `undefined`（空值），用户看到的收益摘要和等级信息全部空白。

**影响范围**：兼职妈妈专属首页的收益摘要区域、等级标识区域、月度数据区域全部空白。

**修复建议**：在 home.js 的 `data` 中补充缺失字段的默认值，并在 `onLoad`/`onShow` 中从 `app.globalData.momData` 或 `wx.getStorageSync('momData')` 读取真实数据填充。

### P0-2【交互失效】home.wxml 中 7 个事件绑定名称与 JS 方法名完全不匹配 — 6 宫格菜单全部失效

**文件**：`pages/mom/home/home.wxml` (L76-L122)、`pages/mom/home/home.js` (L115-L177)

**问题描述**：WXML 中绑定的点击事件与 JS 中定义的方法名称完全不匹配：

| WXML bindtap | JS 中实际方法 | 状态 |
|---|---|---|
| `onMaterialTap` | `goToMaterials` | ❌ 不存在 |
| `onRewardsTap` | `goToEarnings` | ❌ 不存在 |
| `onWithdrawTap` | `goToWithdraw` | ❌ 不存在 |
| `onRulesTap` | `goToRules` | ❌ 不存在 |
| `onServiceTap` | `contactCustomerService` | ❌ 不存在 |
| `onNotificationTap` | `goToSettings` | ❌ 不存在 |
| `onGuideDone` | — | ❌ 不存在 |

用户点击 6 宫格中任何一个菜单按钮，页面均无任何响应。开通成功后的指引弹窗中的「开始体验」按钮也不可点击。

### P0-3【API 调用失败】earnings.js 引用了 mom-earnings.js 中不存在的 3 个方法 — 收益页白屏/报错

**文件**：`pages/mom/earnings/earnings.js` (L32, L35, L41)

**问题描述**：
- `momEarnings.checkAndSettle()` — mom-earnings.js 中名为 `autoCheckSettlements()`，方法名不存在
- `momEarnings.getEarningsByType()` — mom-earnings.js 中名为 `getFilteredEarnings()`，方法名不存在  
- `momEarnings.getMonthlyStats()` — mom-earnings.js 中**完全没有**此法

执行到 `momEarnings.checkAndSettle()` 时直接抛 `TypeError: momEarnings.checkAndSettle is not a function`，页面白屏。

### P0-4【数据路径错误】earnings.js/withdraw.js/exchange.js 从错误位置读取 momData — 收益展示和提现数据全为 0

**文件**：`pages/mom/earnings/earnings.js` (L21-L22)、`pages/mom/withdraw/withdraw.js` (L19-L20)、`pages/mom/exchange/exchange.js` (L14-L15)

**问题描述**：三个页面全部使用以下代码读取 momData：
```javascript
const userInfo = app.globalData.userInfo || {}
const momData = userInfo.momData || {}
```
但 `app.globalData.momData` 直接挂在 `globalData` 下（见 app.js L1148），`userInfo.momData` **永远为 undefined**，导致所有收益数据、提现金额、可兑换余额全部显示为 0。

### P0-5【API 调用失败】withdraw.js 引用了 mom-earnings.js 中不存在的方法 — 提现操作失败

**文件**：`pages/mom/withdraw/withdraw.js` (L45, L27)

**问题描述**：
- `momEarnings.submitWithdraw()` — 此方法在 `utils/mom-withdraw.js` 中（不是 mom-earnings.js）
- `momEarnings.getWithdrawHistory()` — 此方法在 `utils/mom-withdraw.js` 中（不是 mom-earnings.js）

withdraw.js `require('../../utils/mom-earnings.js')`，但提现相关方法都封装在 `mom-withdraw.js`。点击「确认提现」按钮时报方法不存在的错误。

### P0-6【数据不同步】exchange.js 直接修改临时对象，数据不持久化

**文件**：`pages/mom/exchange/exchange.js` (L48-L51)

**问题描述**：exchange.js 中：
```javascript
const userInfo = app.globalData.userInfo || {}
if (userInfo.momData) {
  userInfo.momData.settledEarnings -= deductFromEarnings
}
```
由于 `userInfo.momData` 是 `{}`（空对象），修改仅发生在内存临时对象上，不会持久化到 `wx.getStorageSync('momData')` 或 `app.globalData.momData`。兑换成功后余额未实际扣减，刷新页面后数据恢复。

### P0-7【wx.openCustomerServiceChat 缺少必要参数】客服功能调用失败

**文件**：`pages/mom/home/home.js` (L152-L153)

**问题描述**：`wx.openCustomerServiceChat` 需要 `extInfo` 和 `corpId` 参数，但代码只传入了 `success` 和 `fail` 回调：
```javascript
wx.openCustomerServiceChat({
  success: () => { ... },
  fail: (err) => { ... }
})
```
缺少 `extInfo` 和 `corpId` 必填参数，调用必定失败。

### P0-8【孤儿页面】pages/mom/materials/index.js 和 index.wxml 未在 app.json 注册

**文件**：`pages/mom/materials/index.js`、`pages/mom/materials/index.wxml`、`app.json` (L24)

**问题描述**：`app.json` 中注册的是 `pages/mom/materials/materials`，但存在另一套 `pages/mom/materials/index` 文件。这是一套**功能完全相同但代码不同的重复实现**（素材库页面），后者未注册 → 无法通过路由访问。同时造成维护混乱，修复时需确认哪套是目标版本。

### P0-9【开通后引导弹窗循环显示】showGuide 默认 true，用户每次进入都看到全屏指引

**文件**：`pages/mom/home/home.js` (L13)、`pages/mom/home/home.wxml` (L4)

**问题描述**：`data.showGuide` 默认值为 `true`，且 `checkGuideStatus()` 逻辑在无 `mom_guide_end_time` 缓存时会新建缓存但不更新 `showGuide`。用户首次进入 mother home 时 default `showGuide=true`，引导弹窗全屏遮挡，需仔细审查逻辑才能解除。且 `onGuideDone` 方法不存在，点了也无法关闭。

---

## 🟡 P1：逻辑缺陷

### P1-1【缺失默认值】app.js initMomProgram 不设默认值导致 momData 为 null

**文件**：`app.js` (L467-L474)

**问题描述**：`initMomProgram()` 只在存储中有 `momData` 时赋值，否则 `app.globalData.momData` 保持 `null`。首页和个人中心的 mom 入口检查 `momData.isMom` 时因 `momData` 为 null 而正常降级到开通页，但若在其他地方直接访问 `momData.xxx` 会报错。

### P1-2【硬编码假数据】home.js 所有收益数据都是静态 mock，不读取 globalData

**文件**：`pages/mom/home/home.js` (L8-L11, L105-L113)

**问题描述**：`totalEarnings`、`todayEarnings`、`thisMonthEarnings` 都是硬编码字符串，`refreshEarnings()` 用 `Math.random()` 生成随机数。用户看不到自己真实的收益数据。即使 P0-1 修复了字段名，实际数据也来源于 random，完全没有对接真实数据源。

### P1-3【结算函数名不统一】earnings.js 调用 `checkAndSettle()` 但实际导出名为 `autoCheckSettlements`

**文件**：对比 `utils/mom-earnings.js` (L327-L342) 和 `pages/mom/earnings/earnings.js` (L32)

**问题描述**：mom-earnings.js 导出的函数名为 `autoCheckSettlements`，earnings.js 调用 `checkAndSettle`。同样地 `getFilteredEarnings` vs `getEarningsByType`。命名不一致导致调用失败。

### P1-4【withdraw.js 混用两个工具模块】部分方法来自 mom-earnings.js，部分来自 mom-withdraw.js

**文件**：`pages/mom/withdraw/withdraw.js` (L2, L27, L45)

**问题描述**：`withdraw.js` 只 require 了 `mom-earnings.js`，但调用 `submitWithdraw` 和 `getWithdrawHistory` 两个方法实际在 `mom-withdraw.js` 中。应改为 require `../../utils/mom-withdraw.js`。

### P1-5【rules 页面文案与 withdraw 页面最低提现门槛不一致】

**文件**：`pages/mom/rules/rules.wxml` (L109) vs `pages/mom/withdraw/withdraw.js` (L21)

**问题描述**：
- rules 页面写「累计分享津贴满 50 元即可申请提现」
- withdraw.js 中逻辑为 `newbie ? 20 : 50`
- FAQ 页也写「累计分享津贴满 50 元即可申请提现」（L46）
- 规则页面硬编码 50 元，但实际逻辑区分新手（20 元）和常规（50 元），文案不一致会误导用户。

### P1-6【exchange.js 兑换使用 storeConfig.getProducts() 但该函数不存在】

**文件**：`pages/mom/exchange/exchange.js` (L16)

**问题描述**：`storeConfig.getProducts ? storeConfig.getProducts() : []` — `store-config.js` 中没有 `getProducts` 方法，条件判断虽不会报错（走 fallback `[]`），但商品列表永远为空，兑换页面无商品可展示。

### P1-7【素材库存在两套重复实现：materials.js 和 index.js】

**文件**：`pages/mom/materials/materials.js` vs `pages/mom/materials/index.js`

**问题描述**：两套代码功能相同（3 个 Tab：海报/文案/店铺码），但事件命名、数据结构和实现细节不同：
- `materials.js` 使用 `switchTab`，`materials/index.js` 使用 `onTabChange`
- `materials.js` 使用 `categories` 数据遍历 Tab，`materials/index.js` 使用 `tabs` 硬编码
- 两套代码都保持完整即可运行，但会误导后续开发者

### P1-8【checkGuideStatus() 首次进入时不会设置 showGuide】

**文件**：`pages/mom/home/home.js` (L93-L97)

**问题描述**：当 `mom_guide_end_time` 不存在时，代码设置了 endTime 但**没有设置** `showGuide` 和 `guideDaysLeft`。而此时 `data.showGuide` 默认为 `true`，所以能正常显示——但依赖于默认值而非明确赋值，逻辑脆弱。

### P1-9【earnings.js 的 filter 导致 loadEarnings 重复执行全部逻辑】

**文件**：`pages/mom/earnings/earnings.js` (L47-L51)

**问题描述**：筛选操作调用 `this.loadEarnings()` 重新加载全部数据（统计 + 月报 + 列表），效率低。应只重新获取列表数据。

### P1-10【affiliate.js 缺少 mom 相关初始化】

**问题描述**：个人中心页（user.js）的 `loadMomData()` 正确读取了 `app.globalData.momData`，但在缓存中不存在 `momData` 字段时不会初始化默认值，会导致未开通用户也显示入口卡片。

---

## 🟢 P2：体验优化建议

### P2-1【收益刷新无条件重设随机数】每次 onShow 刷新随机替换真实数据

**文件**：`pages/mom/home/home.js` (L105-L113)

**建议**：修复数据源对接后，`refreshEarnings()` 应从 `app.globalData.momData` 或 `mom-earnings.js` 的 `getEarningsStats()` 读取数据，而非 `Math.random()`。

### P2-2【素材库保存海报/店铺码使用 setTimeout 模拟】没有真实保存逻辑

**文件**：`pages/mom/materials/materials.js` (L112-L123, L167-L179)

**建议**：实现真实的 `wx.downloadFile` + `wx.saveImageToPhotosAlbum` 流程，当前仅是弹窗提示。

### P2-3【店铺码 QR 使用占位图片】没有真实二维码生成

**文件**：`utils/mom-materials.js` (L146, L193)

**建议**：使用小程序码 B 接口或第三方 API 生成真实二维码。

### P2-4【激活页协议弹窗内容与 rules 页面不一致】

**文件**：`pages/mom/activate/activate.js` (L51-L55)

**建议**：协议弹窗文案写的是「提现最低 10 元」，但实际逻辑是新手 20 元/常规 50 元，应保持一致。

### P2-5【设置页缺少 mom 数据编辑功能】

**建议**：设置页可考虑添加展示/编辑 mom 数据的功能，如查看邀请码、手动刷新数据等。

---

## 附录：代码走读汇总

### 各模块发现的问题数

| 模块 | 文件 | P0 | P1 | P2 |
|------|------|----|----|----|
| 开通流程 | activate.js / activate.wxml | 0 | 0 | 1 |
| 专属首页 | home.js / home.wxml | 3 | 3 | 1 |
| 素材生成 | materials.js / materials.wxml | 0 | 1 | 1 |
| 素材生成（副本） | materials/index.js | 1 | 0 | 1 |
| 收益管理 | earnings.js / earnings.wxml | 2 | 2 | 0 |
| 提现 | withdraw.js / withdraw.wxml | 1 | 1 | 0 |
| 兑换 | exchange.js / exchange.wxml | 2 | 1 | 0 |
| 规则说明 | rules.js / rules.wxml | 0 | 1 | 0 |
| 常见问题 | faq.js / faq.wxml | 0 | 1 | 0 |
| 通知设置 | settings.js / settings.wxml | 0 | 0 | 1 |
| 全局 (app.js / app.json) | — | 0 | 1 | 0 |

### 关键文件调用关系

```
app.js
 └─ initMomProgram() → 从 wx.getStorageSync('momData') 恢复
 └─ globalData.momData ← 共享入口

首页 index.js
 └─ checkMomStatus() → 读取 app.globalData.momData → 决定显示入口/主页

个人中心 user.js
 └─ loadMomData() → 读取 app.globalData.momData → 决定显示入口/主页

开通页 activate.js
 └→ app.globalData.momData = momProgram.getDefaultMomData()
 └→ wx.setStorageSync('momData', momData)
 └→ wx.redirectTo('/pages/mom/home/home?activated=1')

mom首页 home.js ← ❌ 未从 globalData/momData 读取，全部硬编码
 └→ 6宫格事件名不匹配 → 菜单功能完全失效

素材库 materials.js
 └→ 使用 utils/mom-materials.js 生成模拟数据

收益页 earnings.js ← ❌ 调用不存在的方法名
 └→ 应调用 utils/mom-earnings.js

提现页 withdraw.js ← ❌ 调用错误模块的方法
 └→ 应调用 utils/mom-withdraw.js

兑换页 exchange.js ← ❌ 数据源路径错误
 └→ storeConfig.getProducts() 不存在

设置页 settings.js → utils/mom-notification.js
FAQ 页 faq.js → 自包含 mock 数据
规则页 rules.js → 自包含 mock 数据
```
