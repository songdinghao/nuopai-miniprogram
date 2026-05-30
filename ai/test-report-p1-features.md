# 诺派永生花小程序 P1 特色功能测试报告

> 测试方式：代码走读 + 逻辑推演（客户视角）
> 测试日期：2026-04-30
> 测试范围：搜索功能、全局组件、新增页面、图片懒加载/缓存/无障碍

---

## 一、搜索功能

### 1.1 联想词下拉（前缀匹配）

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 输入时显示联想词 | ✅ 通过 | `search.js:146-180` `generateSuggestions()` 在输入时触发 |
| 基于前缀匹配 | ⚠️ **问题** | `search.js:156` 使用 `includes()` 而非 `startsWith()`，非前缀匹配的结果也会展示 |
| 匹配度排序 | ⚠️ **问题** | `search.js:159-164` 排序逻辑正确（前缀优先），但非前缀结果仍会出现在列表中 |

**问题1：联想词匹配方式不符合"前缀匹配"要求**
- 文件：`pages/search/search.js:156`
- 代码：`source.filter(name => name.includes(trimmed))`
- 影响：用户输入"永"时，"玫瑰永生花"等非前缀结果也会出现，对30-60岁主妇用户来说不够直观
- 建议：改用 `startsWith()` 进行纯前缀匹配

### 1.2 热门搜索标签点击

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 热门标签点击直接搜索 | ✅ 通过 | `search.js:308-314` `onHotKeywordTap()` 正确实现 |
| 首页热门词点击 | ✅ 通过 | `index.js:1113-1121` 正确实现 |

### 1.3 搜索历史

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 历史记录保存（最多20条） | ✅ 通过 | `search.js:277-296` `saveToSearchHistory()` 正确限制20条 |
| 单条删除 | ✅ 通过 | `search.js:338-348` `onDeleteHistoryItem()` 正确实现 |
| 全部清空 | ✅ 通过 | `search.js:317-335` `onClearHistory()` 正确实现 |
| 历史记录展示 | ✅ 通过 | `search.wxml:59-75` 正确渲染 |

### 1.4 分类筛选面板 + 排序

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 分类筛选（全部/玄关/客厅/餐厅/送礼） | ✅ 通过 | `search.js:369-382` |
| 排序（默认/价格/销量） | ✅ 通过 | `search.js:400-419` |
| 排序菜单显示/隐藏 | ✅ 通过 | `search.js:390-397` |

### 1.5 搜索结果页 `pages/search/result/`

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 代码完整性 | ⚠️ **问题** | 见下方详细问题 |
| 空状态 | ✅ 通过 | `result.js:94-96` 正确显示 empty-state |
| 加载更多 | ✅ 通过 | `result.js:103-117` 正确实现 |
| 筛选/排序 | ✅ 通过 | `result.js:120-154` 正确实现 |

**问题2：result.wxml 绑定了未定义的方法 `goBack`**
- 文件：`pages/search/result/result.wxml:5`
- 代码：`<view class="header-back" bindtap="goBack">`
- 问题：`result.js` 中没有定义 `goBack` 方法
- 影响：用户点击返回按钮时，小程序会抛出异常，按钮无响应
- 修复建议：在 `result.js` 中添加如下方法：
```js
goBack() {
  wx.navigateBack()
}
```

**问题3：result页面 loading-more 组件 status 逻辑异常**
- 文件：`pages/search/result/result.wxml:95`
- 代码：`status="{{loading ? 'loading' : (hasMore ? 'loading' : 'no-more')}}"`
- 问题：当 `loading=false` 且 `hasMore=true` 时，状态显示为 `'loading'`（显示"正在加载..."动画），但实际上并没有在加载。用户会看到一直在转圈但永远"加载中"
- 影响：用户感知为页面卡住、加载异常
- 修复建议：应改为：`status="{{loading ? 'loading' : 'no-more'}}"`，在 result.js 的 `loadMore()` 中控制 `hasMore`（仅在无更多数据时设false）

**问题4：联想词下拉缺少点击外部关闭**
- 文件：`pages/search/search.wxml:38-47`
- 代码：联想浮层使用了 `catchtap="onHideSuggestions"`，但搜索框在浮层外部，用户点击搜索框或页面其他区域时，联想浮层不会关闭
- 影响：用户输入后点击搜索按钮，浮层可能遮挡结果

---

## 二、全局组件使用

### 2.1 product-card 组件

**问题5：product-card 组件未被任何页面使用**
- 全局注册了 `product-card` 组件（`app.json:153`），但以下页面均使用内联HTML渲染商品卡片，未引用该组件：
  - 首页 `index.wxml:271-328`（热销商品列表）
  - 分类页 `category.wxml:137-201`
  - 搜索页 `search.wxml:157-188`
  - 搜索结果页 `result.wxml:73-91`
  - 促销页 `promotion.wxml:68-86`
- 影响：所有商品卡片均为内联代码，违背组件化原则。如需修改卡片样式/逻辑，需逐一修改5个文件

**问题6：product-card 组件 property 字段名与数据不匹配**
- 文件：`components/product-card/product-card.js:8-15`
- 组件定义的 property 使用 `title` 字段
- 所有页面的商品数据使用 `name` 字段（如 `index.js:453` `name: '玄关端景台永生花玫瑰摆件'`）
- 也影响 `product-card.wxml:2` 的 `data-aria-label="{{product.title}}"` 为空
- 修复建议：统一字段名为 `name` 或 `title`

### 2.2 empty-state 组件

**问题7：empty-state 组件覆盖率不足**
- 全局注册了 `empty-state`（`app.json:159`）
- 使用了该组件的页面：仅 `result.wxml:63`
- **未使用**该组件的页面：
  - 搜索页 `search.wxml:93-97`（内联空状态）
  - 分类页 `category.wxml:127-134`（内联空状态）
  - 通知页 `notification.wxml:34-41`（内联空状态）
  - 优惠券页 `coupon.wxml` - 但 `coupon.js` 的 `data` 中有 `emptyState`，wxml 中未使用组件

**问题8：empty-state 组件的 observer 优先级不确定**
- 文件：`components/empty-state/empty-state.js:42-55`
- 同时监听了 `type` 和 `icon, title, description`，两个 observer 的执行顺序不确定
- 当页面同时传入 `type="search"` 和自定义 `title` 时，最终显示的内容可能被另一个 observer 覆盖

### 2.3 loading-more 组件

**问题9：loading-more 组件覆盖率不足**
- 全局注册了 `loading-more`（`app.json:158`）
- 使用了该组件的页面：仅 `result.wxml:95`
- **未使用**该组件的页面：
  - 搜索页 `search.wxml:192-199`（内联加载更多HTML）
  - 分类页 `category.wxml:203-215`（内联加载更多）
  - 促销页 `promotion.wxml:89-95`（内联加载更多）

### 2.4 voice-search 组件

**问题10：voice-search 组件未被任何页面实际引用**
- 文件：`components/voice-search/`
- 在 `app.json:156` 全局注册，但没有任何页面的 wxml 中使用 `<voice-search>`
- 搜索页 `search.wxml:207-220` 使用的是内联语音搜索浮层
- 首页 `index.wxml:477-490` 使用的是内联语音搜索浮层
- 该组件的职责与 `search.js` 中的语音搜索逻辑（`line 464-497`）重复

### 2.5 ar-preview 组件

**问题11：ar-preview 组件未被任何页面使用**
- 文件：`components/ar-preview/`
- 在 `app.json:157` 全局注册，但无页面使用
- 商品详情页 `detail.wxml:598-601` 使用内联AR预览按钮，而非 `<ar-preview>`
- 首页 `index.wxml:113-121` 使用内联AR预览按钮

### 2.6 category-card 组件

**问题12：category-card 组件未被使用**
- 文件：`components/category-card/`
- 在 `app.json:154` 注册
- 分类页 `category.wxml` 使用内联分类标签布局，未引用该组件
- 首页 `index.wxml:210-227` 使用内联HTML渲染分类导航

### 2.7 promotion-card 组件

**问题13：promotion-card 组件未被使用**
- 文件：`components/promotion-card/`
- 在 `app.json:155` 注册
- 首页 `index.wxml:236-252` 使用内联促销活动条目
- 促销页 `promotion.wxml` 未引用该组件

---

## 三、新增页面

### 3.1 促销活动页 `pages/promotion/`

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 轮播Banner | ✅ 通过 | `promotion.wxml:24-43` 正确实现 |
| 活动信息 | ✅ 通过 | `promotion.wxml:46-58` 正确实现 |
| 商品列表 | ✅ 通过 | `promotion.wxml:67-86` 正确实现 |
| 活动规则 | ✅ 通过 | `promotion.wxml:99-111` 正确实现 |
| 加载更多 | ✅ 通过 | `promotion.js:142-158` 正确实现 |

### 3.2 消息通知页 `pages/notification/`

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Tab筛选（全部/订单/营销/系统） | ✅ 通过 | `notification.js:97-107` 正确实现 |
| 全部已读 | ✅ 通过 | `notification.js:140-165` 正确实现 |
| 单条删除 | ✅ 通过 | `notification.js:168-189` 正确实现 |
| 未读标记 | ✅ 通过 | `notification.wxml:58` 红点标记 |
| 全部Tab未读数角标 | ✅ 通过 | `notification.wxml:15-17` badget展示 |

### 3.3 错误页 `pages/error/`

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 5种错误类型覆盖 | ✅ 通过 | `error.js:10-56` 覆盖 notfound/network/server/timeout/custom |
| 错误类型参数传递 | ✅ 通过 | `error.js:67-73` 从options.type获取 |
| 主/次按钮操作 | ✅ 通过 | `error.js:86-111` 返回首页/重试/返回上一页 |

### 3.4 注册页 `pages/register/`

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 手机号输入 | ✅ 通过 | `register.js:45-48` |
| 验证码发送 | ✅ 通过 | `register.js:88-101` |
| 密码 + 确认密码 | ✅ 通过 | `register.js:57-66` |
| 注册按钮状态控制 | ✅ 通过 | `register.js:69-78` 全部条件满足才可注册 |
| 用户协议/隐私政策 | ✅ 通过 | `register.js:173-188` |
| 注册成功流程 | ✅ 通过 | `register.js:118-160` 发放新人优惠券等 |

### 3.5 优惠券页 `pages/user/coupon/`

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Tab切换（未使用/已使用/已过期） | ✅ 通过 | `coupon.js:52-56` |
| 领券中心弹窗 | ✅ 通过 | `coupon.js:74-80` |
| 使用优惠券按钮 | ✅ 通过 | `coupon.js:113-118` |

### 3.6 积分页 `pages/user/points/`

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 积分总数展示 | ✅ 通过 | `points.js:68-70` 从 pointsManager 读取 |
| 积分明细列表 | ✅ 通过 | `points.js:82-99` 加载更多 |
| 积分规则弹窗 | ✅ 通过 | `points.js:102-109` |

### 3.7 搜索结果页 `pages/search/result/`

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 筛选/排序 | ✅ 通过 | `result.js:120-154` |
| 加载更多 | ✅ 通过 | `result.js:103-117` |
| 下拉刷新 | ✅ 通过 | `result.js:64-69` |
| goBack 方法缺失 | ❌ **问题2** | 见上方问题2 |
| loading-more 状态异常 | ❌ **问题3** | 见上方问题3 |

### 3.8 页面路由注册检查

**问题14：新页面在 app.json 中缺少注册**
- 对比 `app.json` 的 `pages` 数组和实际页面目录，以下页面仅在 `subpackages` 中注册，不在主 `pages` 中：
  - `pages/promotion/promotion`（分包 ✓）
  - `pages/notification/notification`（分包 ✓）
  - `pages/search/result`（分包 ✓）
  - `pages/user/coupon`（已注册在子包 ✓）
  - `pages/user/points`（已注册在子包 ✓）
  - `pages/ar/ar`（已注册在子包 ✓）
- 结论：子包注册正确，无问题

**问题15：首页 `loadPromotions()` 中的链接路径错误**
- 文件：`pages/index/index.js:603, 616`
- `index.js:603` 中链接为 `'/pages/coupon/coupon'`，但优惠券页实际路径为 `/pages/user/coupon`
- `index.js:616` 中链接为 `'/pages/points/points'`，但积分页实际路径为 `/pages/user/points`
- 影响：用户点击首页促销条时，跳转到不存在的页面
- 修复建议：
  - `index.js:603` 改为 `'/pages/user/coupon'`
  - `index.js:616` 改为 `'/pages/user/points'`

---

## 四、图片懒加载 + 缓存 + 无障碍

### 4.1 image-utils.js 懒加载

**问题16：image-utils.js 的函数未被页面调用**
- 文件：`utils/image-utils.js`
- 提供了 `lazyLoad()`, `batchLazyLoad()`, `preload()` 等函数
- 搜索所有 `require('./utils/image-utils')` 和 `require('../../utils/image-utils')` 等引用，无任何页面引入该模块
- 所有页面图片直接使用 `<image src="..." />`，最多设置了 `lazy-load="{{true}}"` 属性

**问题17：各页面 image 标签 lazy-load 属性不一致**
- 已设置 `lazy-load` 的页面：
  - `index.wxml:188, 220, 280, 359, 411`
  - `category.wxml:151`
  - `detail.wxml:68`
- **未设置** `lazy-load` 的页面：
  - `search.wxml:159`（搜索结果图片）
  - `result.wxml:75`（搜索结果图片）
  - `promotion.wxml:70`（促销商品图片）
  - `search.wxml:94`（空状态图标 - 对小图片影响不大）
- 影响：搜索结果页和促销页的商品图片可能一次性加载，影响性能

### 4.2 cache-manager.js 缓存

**问题18：cacheManager 在 app.js 中正确初始化但各页面未使用**
- `app.js:134-155` `initCacheManager()` 正确初始化
- `app.globalData.cacheManager = cacheManager` 已暴露
- 但搜索所有页面，没有调用 `app.globalData.cacheManager.setCache()` 或 `getCache()` 的代码
- 数据全部通过 `wx.getStorageSync()` / `wx.setStorageSync()` 或 `setData()` 直接管理
- 影响：缓存管理器的过期/清理能力未被利用，所有"缓存"实际上是永久存储

### 4.3 accessibility.js 无障碍

**问题19：accessibility.js 的 API 未被页面调用**
- `app.js:4` 引入了 `accessibility` 模块
- 但 `app.js` 未调用其任何方法（`setAriaLabel`, `announce`, `initPageAccessibility` 等）
- 搜索所有页面，无任何页面调用 `require('../../utils/accessibility.js')` 或使用 accessibility 的 API

**问题20：product-card 组件中 data-aria-label 字段引用错误**
- 文件：`components/product-card/product-card.wxml:2, 12, 45`
- 代码：`data-aria-label="{{product.title}}"`
- 组件 property 定义中字段名为 `title`（`product-card.js:9`）
- 但所有使用方传入的数据字段为 `name`
- 影响：`data-aria-label` 始终为空字符串，无障碍标注失效

**问题21：页面内 data-aria-label 字段一致性**
- `index.wxml` 中 data-aria-label 设置正确（如 `data-aria-label="搜索"`, `data-aria-label="语音搜索"` 等硬编码文字）
- `category.wxml` 中 data-aria-label 设置正确
- `detail.wxml` 中 data-aria-label 设置正确
- 但 `search.wxml`、`result.wxml` 中**没有**使用 `data-aria-label` 属性
- 影响：搜索相关页面缺乏无障碍支持

---

## 五、问题汇总

| 优先级 | ID | 问题描述 | 文件位置 | 严重程度 |
|--------|----|----------|----------|----------|
| P0 | #2 | result页面 goBack 方法缺失 | `result.wxml:5` / `result.js` | **阻断** - 点击返回按钮异常 |
| P0 | #15 | 首页促销链接路径错误（coupon/points） | `index.js:603,616` | **阻断** - 跳转404 |
| P1 | #5 | product-card 组件未被任何页面使用 | 全部列表页 | 高 - 组件化失效 |
| P1 | #6 | product-card 字段名不匹配（title vs name） | `product-card.js:9` | 高 - 显示空白 |
| P1 | #20 | data-aria-label 引用不存在的字段 | `product-card.wxml:2,12,45` | 高 - 无障碍失效 |
| P1 | #3 | loading-more 状态逻辑异常 | `result.wxml:95` | 高 - UI展示异常 |
| P1 | #1 | 联想词使用包含匹配而非前缀匹配 | `search.js:156` | 中 - 不符合需求 |
| P1 | #7 | empty-state 组件覆盖率不足 | 多页面 | 中 |
| P1 | #9 | loading-more 组件覆盖率不足 | 多页面 | 中 |
| P1 | #10 | voice-search 组件未被使用 | 全部 | 中 - 组件废弃 |
| P1 | #11 | ar-preview 组件未被使用 | 全部 | 中 - 组件废弃 |
| P1 | #12 | category-card 组件未被使用 | 全部 | 中 - 组件废弃 |
| P1 | #13 | promotion-card 组件未被使用 | 全部 | 中 - 组件废弃 |
| P2 | #16 | image-utils 函数未被页面调用 | `image-utils.js` | 中 - 工具未使用 |
| P2 | #17 | 部分页面 image 标签未设置 lazy-load | `search.wxml:159`, `result.wxml:75`, `promotion.wxml:70` | 低 - 性能优化 |
| P2 | #18 | cacheManager 未在各页面使用 | 全项目 | 中 - 缓存能力浪费 |
| P2 | #19 | accessibility API 未被调用 | `accessibility.js` | 中 - 无障碍未生效 |
| P2 | #21 | 搜索页面缺少 data-aria-label | `search.wxml`, `result.wxml` | 低 - 无障碍缺失 |
| P3 | #4 | 联想浮层点击外部未关闭 | `search.wxml:38-47` | 低 - 交互细节 |
| P3 | #8 | empty-state observer 执行顺序不确定 | `empty-state.js:42-55` | 低 - 潜在问题 |

---

## 六、修复建议优先级

### 阻塞级（P0 - 上线前必须修复）
1. `result.js` 添加 `goBack()` 方法
2. `index.js` 修复促销链接路径：`'/pages/coupon/coupon'` → `'/pages/user/coupon'`，`'/pages/points/points'` → `'/pages/user/points'`

### 高优先级（P1 - 建议 Sprint 内修复）
1. 统一各页面商品卡片使用 `product-card` 组件（修复字段名不匹配问题）
2. 修复 `result.wxml` 中 `loading-more` 的状态逻辑
3. 修复 `product-card` 中 `data-aria-label` 的字段引用（`title` → `name`）
4. 评估已注册但未使用的组件（voice-search, ar-preview, category-card, promotion-card），确定是废弃还是补充使用

### 中优先级（P2 - 后续迭代）
1. 为搜索页、搜索结果页、促销页的图片添加 `lazy-load` 属性
2. 引入 image-utils 的预加载/兜底机制
3. 在关键页面（首页、详情页）调用 accessibility API
4. 评估 cacheManager 的使用场景

### 低优先级（P3 - 积压优化）
1. empty-state observer 逻辑优化
2. 联想词关闭交互优化
3. 搜索页面添加 data-aria-label
