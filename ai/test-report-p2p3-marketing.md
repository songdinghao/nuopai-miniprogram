# 诺派永生花小程序 P2+P3 营销功能测试报告

> 测试日期：2026-04-30  
> 测试方式：代码走读 + 逻辑推演（未修改文件）  
> 项目路径：`miniprogram-shop/`

---

## 目录

1. [拼团功能](#1-拼团功能)
2. [老客邀新](#2-老客邀新)
3. [纪念日提醒](#3-纪念日提醒)
4. [优惠券系统](#4-优惠券系统)
5. [积分商城](#5-积分商城)
6. [消息通知](#6-消息通知)
7. [促销活动页 + app.json 分包注册](#7-促销活动页--appjson-分包注册)
8. [补充发现](#8-补充发现)

---

## 1. 拼团功能

### 1.1 功能实现概览

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 商品详情页拼团价展示 | ✅ 已实现 | detail.wxml:97-117 展示拼团价和社交证明 |
| 商品详情页「发起拼团」按钮 | ✅ 已实现 | detail.wxml:589 底部有「发起拼团」按钮 |
| 拼团页进度条 | ✅ 已实现 | group.wxml:50-52 进度条 |
| 拼团页参团人头像 | ✅ 已实现 | group.wxml:39-48 成员头像显示 |
| 拼团页倒计时 | ✅ 已实现 | group.wxml:56-59 倒计时显示 |
| 三种状态（待成团/已成团/已过期） | ✅ 已实现 | group.wxml:31-107 三种状态展示 |
| orderSource参数传递 | ✅ 已实现 | checkout.js:52 区分 direct_buy / cart |
| 拼团价计算 | ✅ 已实现 | group-buy.js:27-30 calcGroupPrice |
| 分享卡片携带团ID | ✅ 已实现 | group.js:79-81 分享path携带groupId |
| 数据模型 2人/3人团 | ✅ 已实现 | store-config.js:253-276 |

### 1.2 发现的问题

#### [BUG-P1] 商品详情页「发起拼团」仅支持第一个拼团类型

- **文件**：`pages/product/detail.wxml:589`
- **问题**：底部操作栏「发起拼团」按钮硬编码为 `data-type="{{groupBuyInfo[0].id}}"`，只触发第一个拼团类型（2人团）。页面中展示了2人团和3人团的拼团价格区域，但用户无法选择发起3人团。
- **影响**：3人团功能从商品详情页不可触达，用户只能通过其他路径（如手动拼团页面）发起3人团。

```html
<!-- detail.wxml:589 - 只使用了groupBuyInfo[0] -->
<view class="group-buy-btn" ... bindtap="onStartGroupBuy" data-type="{{groupBuyInfo[0].id}}">
```

#### [BUG-P3] 拼团订单未限制优惠券使用

- **文件**：`pages/order/checkout.js:112-121`
- **问题**：拼团订单（isGroupBuyOrder为true时）仍然加载了全部可用优惠券，未对拼团订单禁用优惠券叠加。大部分电商平台拼团商品不可叠加使用普通优惠券。
- **建议**：拼团订单应自动禁用优惠券选择或限制仅使用特定类型优惠券。

---

## 2. 老客邀新

### 2.1 功能实现概览

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 用户中心「邀请好友」入口 | ✅ 已实现 | user.wxml:138-145 跳转 invite 页面 |
| 邀请页邀请码展示 | ✅ 已实现 | invite.wxml:49-59 展示邀请码 |
| 邀请页分享功能 | ✅ 已实现 | invite.wxml:62-70 分享和生成海报 |
| 邀请记录列表 | ✅ 已实现 | invite.wxml:97-116 邀请记录列表 |
| 邀请码生成 | ✅ 已实现 | referral.js:41-47 generateInviteCode |
| 记录存储 | ✅ 已实现 | referral.js:71-89 本地存储 |
| 奖励规则 | ✅ 已实现 | referral.js:10-34 新客券+老客积分+阶梯奖励 |
| 注册时处理邀请人ID | ✅ 已实现 | login.js:263 / register.js:152 |

### 2.2 发现的问题

#### [BUG-CRITICAL] 邀请链条断裂：首页分享使用 raw userId，但注册时读取的是邀请码

- **文件**：
  - `pages/index/index.js:145` — 分享使用 userInfo.id
  - `pages/index/index.js:339-344` — handleInvite 存到 `inviter` key
  - `pages/login/login.js:263` — 读取 `referral.getMyInviter()`
  - `utils/referral.js:241-244` — `getMyInviter()` 读取 `referral_my_inviter` key
- **问题链**：
  1. 老用户分享首页时，分享链接携带的是 `userInfo.id`（index.js:145）
  2. 新用户点击分享链接，`handleInvite` 将其保存为 `inviter`（index.js:343）
  3. 新用户注册/登录时，`referral.getMyInviter()` 读取的是 `referral_my_inviter` 存储键
  4. 两个存储键不一致 → **邀请记录永远不会被保存**，老客不会收到邀请奖励
- **影响**：老客邀新功能完全失效。新用户通过分享链接注册后，邀请人无法获得积分/优惠券奖励，被邀请人也无法获得新人优惠券（已通过其他路径发放）。

```javascript
// index.js:145 - 使用 userId 而非邀请码
path: '/pages/index/index?inviter=' + (this.data.userInfo?.id || 'system')
// 应改为 inviteCode

// index.js:343 - 存储到 'inviter' key
wx.setStorageSync('inviter', inviterId)
// 而 login.js:263 和 register.js:152 读取的是 'referral_my_inviter'
const inviterCode = referral.getMyInviter()  // 读取 referral_my_inviter
```

#### [BUG-P2] 新人优惠券存在重复发放风险

- **文件**：
  - `pages/index/index.js:822-862` — `giveNewUserCoupon()` 直接发放新人券
  - `utils/referral.js:190-208` — `giveNewUserReferralCoupon()` 也发放新人券
  - `pages/login/login.js:272` — 登录时调用了 `giveNewUserReferralCoupon()`
  - `pages/register/register.js:149` — 注册时调用了 `giveNewUserReferralCoupon()`
- **问题**：两个方法都检查 `hasGivenNewUserCoupon` 这个 key，但如果用户先通过分享链接进入首页（触发 `giveNewUserCoupon`），再注册/登录时（触发 `giveNewUserReferralCoupon`），会读取到已存在的 key 正常跳过。但如果路径交叉不当仍可能存在逻辑竞态。

---

## 3. 纪念日提醒

### 3.1 功能实现概览

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 用户中心「纪念日提醒」入口 | ✅ 已实现 | user.wxml:147-151 |
| 纪念日页新增/编辑/删除 | ✅ 已实现 | anniversary.js:76-222 |
| 倒计时展示 | ✅ 已实现 | anniversary.wxml:26-43 |
| 推荐礼物入口 | ✅ 已实现 | anniversary.wxml:48-51 |
| 根据纪念日类型推荐 | ✅ 已实现 | anniversary.js:225-233 根据type推荐 |
| 首页顶部纪念日提醒条 | ✅ 已实现 | index.wxml:74-84 展示最近纪念日 |
| 数据模型完整 | ✅ 已实现 | anniversary.js:7-248 |

### 3.2 发现的问题

#### [BUG-P3] 纪念日提醒条在首页仅展示倒计时天数，对已过期纪念日未作特殊引导

- **文件**：`pages/index/index.js:312-324`
- **问题**：`checkAnniversaryReminder` 调用 `getNearestAnniversary()` 获取最近纪念日。对于已过期的纪念日（`daysUntil < 0`），`getAllAnniversaries` 的 `isUpcoming: daysUntil >= 0 && daysUntil <= 30` 条件排除了它们，因此已过期的纪念日不会在首页展示提醒条。但如果用户仅有已过期的纪念日，首页将不显示任何提醒，用户可能忘记更新日期。
- **建议**：在首页添加对过期纪念日的小提示，引导用户更新日期。

#### [BUG-P4] 纪念日页面跳转搜索结果为关键词搜索，非精准商品推荐

- **文件**：`pages/anniversary/anniversary.js:229-232`
- **问题**：点击「推荐礼物」跳转到搜索结果页（`pages/search/result`），使用纪念日类型对应的关键词搜索。这种方式依赖于商品标题中包含该关键词，如果商品标题不包含（如"永生花玫瑰摆件"可能无法匹配"玫瑰花"关键词），将返回空结果。
- **影响**：推荐礼物的准确率较低，可能需要建立纪念日类型与商品品类/标签的映射关系。

---

## 4. 优惠券系统

### 4.1 功能实现概览

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 优惠券页Tab切换 | ✅ 已实现 | coupon.wxml:4-15 |
| 领券操作 | ✅ 已实现 | coupon.wxml:72-113 领券中心弹窗 |
| getCoupons | ✅ 已实现 | coupon-manager.js:335-340 |
| canUseCoupon | ✅ 已实现 | coupon-manager.js:364-395 |
| getBestCoupon | ✅ 已实现 | coupon-manager.js:427-447 |
| 结算页对接优惠券 | ✅ 已实现 | checkout.js:228-278 |
| 优惠后金额计算 | ✅ 已实现 | checkout.js:197-215 |

### 4.2 发现的问题

#### [BUG-P2] canUseCoupon 未检查优惠券有效期开始时间

- **文件**：`utils/coupon-manager.js:364-395`
- **问题**：`canUseCoupon` 方法检查了 `endTime`（有效期结束），但没有检查 `startTime`（有效期开始）。如果优惠券设置了未来的开始时间，本应不可用但仍会被判为可用。
- **影响**：预发放的、尚未生效的优惠券可能会在结算页被提前使用。

```javascript
// coupon-manager.js:371-377 - 只检查了 endTime
if (coupon.endTime) {
  const now = new Date()
  const endDate = new Date(coupon.endTime)
  if (endDate < now) {
    return { available: false, reason: '优惠券已过期' }
  }
}
// 缺少对 startTime 的检查
```

#### [BUG-P2] canUseCoupon 品类限制逻辑缺陷

- **文件**：
  - `utils/coupon-manager.js:390-392` — 品类检查逻辑
  - `pages/order/checkout.js:117` — 未传递品类参数
- **问题**：`canUseCoupon` 的品类检查条件 `coupon.category && category && coupon.category !== category` 中，当 `category` 参数为 `undefined`（未提供）时，整个表达式为 `false`，导致**品类限制的优惠券对所有订单都显示可用**。结算页调用 `canUseCoupon(c, goodsPriceNum)` 未传递 category。

```javascript
// coupon-manager.js:390-392
if (coupon.category && category && coupon.category !== category) {
  return { available: false, reason: '不适用于当前商品品类' }
}
// 当 category=undefined 时：(coupon.category && undefined && ...) => false
// 品类限制的优惠券绕过限制
```

#### [BUG-P3] 领券中心优惠券池的 "邀请奖励券" 标记为可领取

- **文件**：`utils/coupon-manager.js:107-116`
- **问题**：`CLAIMABLE_COUPONS` 中 `pool_008` 是「邀请奖励券」（claimable: true），但它实际上应该通过邀请流程发放（referral.js:154-163 中已自动发放）。用户在领券中心额外领取这个券会导致重复或混乱。
- **影响**：已邀请好友的用户从 referral 流程获得一张邀请奖励券，又可以从领券中心再领一张同名券。

---

## 5. 积分商城

### 5.1 功能实现概览

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 积分页总数展示 | ✅ 已实现 | points.wxml:3-14 |
| 积分页明细列表 | ✅ 已实现 | points.wxml:51-75 |
| getPoints | ✅ 已实现 | points-manager.js:136-139 |
| addPoints | ✅ 已实现 | points-manager.js:178-196 |
| redeemPoints | ✅ 已实现 | points-manager.js:205-227 |
| 积分来源类型 | ✅ 已实现 | points-manager.js:8-19 |
| 用户中心显示当前积分 | ✅ 已实现 | user.wxml:31-34 |

### 5.2 发现的问题

#### [BUG-P3] 积分页「本月获得/使用」统计数据不准确

- **文件**：`pages/user/points/points.wxml:22-29`
- **问题**：「本月获得」和「本月使用」显示的是 `pointsList.filter(...)` 的条数，而 `pointsList` 只是当前分页的数据（最多15条），并不是当月的全部记录。
- **影响**：用户看到的统计数字是错误且随分页变化的。

```html
<!-- points.wxml:23-24，统计基于当前分页数据 -->
<text class="summary-value">{{pointsList.filter(i => i.type === 'earn').length}}</text>
<text class="summary-label">本月获得</text>
<!-- 应改为基于完整数据的月度统计 -->
```

---

## 6. 消息通知

### 6.1 功能实现概览

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 通知页Tab筛选 | ✅ 已实现 | notification.wxml:6-21 |
| 全部已读 | ✅ 已实现 | notification.js:140-165 |
| 删除通知 | ✅ 已实现 | notification.js:168-189 |
| getNotifications | ✅ 已实现 | notification-manager.js:38-61 |
| markAsRead | ✅ 已实现 | notification-manager.js:113-124 |
| 场景化工厂方法 | ✅ 已实现 | notification-manager.js:282-342 |
| 用户中心未读数角标 | ✅ 已实现 | user.wxml:96-105 |

### 6.2 发现的问题

#### [BUG-P4] 点击营销/系统通知无实际跳转

- **文件**：`pages/notification/notification.js:128`
- **问题**：点击 order 类型通知会跳转到订单详情，但 marketing 和 system 类型通知仅显示 toast "消息详情"，实际无跳转动作。用户点击通知后体验中断。
- **影响**：营销通知（优惠券到期提醒、活动通知）和系统通知（系统维护、版本更新）点击后无实际内容页展示。

```javascript
// notification.js:128
} else {
  wx.showToast({ title: '消息详情', icon: 'none' })
}
```

---

## 7. 促销活动页 + app.json 分包注册

### 7.1 功能实现概览

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 促销页Banner轮播 | ✅ 已实现 | promotion.wxml:24-43 |
| 活动信息展示 | ✅ 已实现 | promotion.wxml:46-58 |
| 活动商品列表 | ✅ 已实现 | promotion.wxml:60-96 |
| 活动规则 | ✅ 已实现 | promotion.wxml:99-111 |
| app.json 页面注册 | ✅ 已确认 | 所有 P2P3 页面均已注册 |
| 分包路径 | ✅ 正确 | 路径均正确配置 |

### 7.2 发现的问题

#### [BUG-CRITICAL] 首页促销卡片指向错误页面路径

- **文件**：`pages/index/index.js:593-625`
- **问题**：首页促销活动（`loadPromotions`）中的链接路径不正确：

| 原路径 | 正确路径 | 状态 |
|--------|----------|------|
| `/pages/coupon/coupon` | `/pages/user/coupon` | **路径不存在** |
| `/pages/points/points` | `/pages/user/points` | **路径不存在** |
| `/pages/vip/vip` | 不存在此页面 | **页面不存在** |

```javascript
// index.js:600-625
{
  id: 'promo1',
  link: '/pages/coupon/coupon',  // BUG: 应为 /pages/user/coupon
},
{
  id: 'promo2',
  link: '/pages/promotion/promotion?id=discount',  // OK
},
{
  id: 'promo3',
  link: '/pages/points/points',  // BUG: 应为 /pages/user/points
},
{
  id: 'promo4',
  link: '/pages/vip/vip',  // BUG: 此页面不存在
}
```

#### [BUG-CRITICAL] 用户中心优惠券提醒跳转路径错误

- **文件**：`pages/index/index.js:800-805` 和 `pages/index/index.js:853-857`
- **问题**：登录欢迎页的优惠券检查和领取新人券后的跳转都使用了 `/pages/coupon/coupon`，该路径在 app.json 中未注册（正确路径为 `/pages/user/coupon`）。

```javascript
// index.js:803
wx.navigateTo({ url: '/pages/coupon/coupon' })  // BUG
// 应改为：/pages/user/coupon
```

### 7.3 app.json 注册确认

所有 P2P3 相关页面注册情况：

| 页面路径 | 注册位置 | 状态 |
|----------|----------|------|
| pages/group/group | 主包 pages 数组 | ✅ |
| pages/invite/invite | 主包 pages 数组 | ✅ |
| pages/anniversary/anniversary | 主包 pages 数组 | ✅ |
| pages/notification/notification | 分包 pages/notification/ | ✅ |
| pages/user/coupon | 分包 pages/user/ | ✅ |
| pages/user/points | 分包 pages/user/ | ✅ |
| pages/promotion/promotion | 分包 pages/promotion/ | ✅ |

预加载规则（`preloadRule`）配置正确：
- `pages/user/user` 进入时预加载 `pages/user/`, `pages/promotion/`, `pages/notification/` 分包

---

## 8. 补充发现

### [BUG-CRITICAL] store-config.js 包含生产环境敏感凭据

- **文件**：`config/store-config.js:5-18`
- **问题**：两个微信小店的 appid 和 secret 硬编码在配置文件中，存在严重的安全风险。如果代码发布到小程序前端或上传到公共仓库，攻击者可以获取这些凭据。
- **影响**：攻击者可利用 secret 获取 access_token，进而操作店铺 API。

```javascript
{
  name: '诺派永生花-老店',
  appid: 'wx7f092564e7a079a6',      // 敏感
  secret: 'a24a8375dca3831e314d5cfb5b2455d5',  // 极度敏感
}
```

### [BUG-P4] coupon-manager.js CLAIMABLE_COUPONS 的 claimable 字段与 id 命名不一致

- **文件**：`utils/coupon-manager.js:28-117`
- **问题**：领券中心使用 `id`（如 `pool_001`）作为唯一标识，而 claimCoupon 用 `couponId` 查询。但 `CLAIMABLE_COUPONS` 中 coupon 的 `id` 实际是领券池ID，创建实际优惠券时使用 `uc_` 前缀的新ID。命名上容易混淆，`CLAIMABLE_COUPONS` 中的 `id` 更应命名为 `poolId` 或 `templateId`。

---

## 问题严重性汇总

| 严重级别 | 数量 | 说明 |
|----------|------|------|
| CRITICAL | 3 | 功能完全失效（邀请链条断裂、页面路径错误、凭据泄露） |
| P1 | 1 | 主要功能受限（3人拼团不可选） |
| P2 | 3 | 功能逻辑缺陷（startTime不检查、品类限制绕过、新人券重复风险） |
| P3 | 3 | 体验或准确性缺陷（拼团使用优惠券、月度统计不准、领券中心异常） |
| P4 | 2 | 轻微问题（过期纪念日引导、通知页无跳转） |

**总计发现问题：12 个**

---

## 修复优先级建议

1. **[CRITICAL]** 修复邀请链条断裂（index.js 分享和 handleInvite 改用 inviteCode，统一存储 key）
2. **[CRITICAL]** 修复首页促销卡片路径错误（3处路径问题）
3. **[CRITICAL]** 移除或保护 store-config.js 中的敏感凭据
4. **[P1]** 商品详情页提供拼团类型选择（2人团/3人团）
5. **[P2]** canUseCoupon 增加 startTime 检查
6. **[P2]** canUseCoupon 品类限制逻辑修复 + 结算页传递品类参数
7. **[P2]** 评估并消除新人优惠券重复发放风险
8. **[P3]** 拼团订单限制优惠券使用
9. **[P3]** 积分页月度统计改为基于完整数据
10. **[P3]** 领券中心排除「邀请奖励券」
