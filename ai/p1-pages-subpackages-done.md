# 缺失页面创建 & 分包策略配置 - 修改摘要

## 任务1：创建3个缺失页面（各4个文件）

### 1. `pages/search/result/` — 搜索结果页

- `result.js` — 页面逻辑：搜索关键词展示、分类筛选、排序、分页加载、模拟数据
- `result.wxml` — 页面模板：顶部关键词栏、筛选栏（分类横向滚动+排序下拉）、双列商品网格、加载更多、空状态
- `result.wxss` — 页面样式：匹配搜索页风格，#FF6B9D 主色，圆角卡片12px，双列grid布局，适配字体大小/暗色模式
- `result.json` — 页面配置：导航栏、下拉刷新、上拉加载、引用empty-state和loading-more组件

### 2. `pages/user/coupon/` — 优惠券页面

- `coupon.js` — 页面逻辑：Tab切换（未使用/已使用/已过期）、模拟优惠券数据、领券入口、使用按钮
- `coupon.wxml` — 页面模板：Tab栏、优惠券卡片（左侧金额+右侧信息+操作按钮）、空状态、底部领券入口
- `coupon.wxss` — 页面样式：粉红渐变优惠券卡头、中缝圆孔装饰、过期灰色态、暗色模式适配
- `coupon.json` — 页面配置：导航栏标题、引用empty-state组件

### 3. `pages/user/points/` — 积分页面

- `points.js` — 页面逻辑：积分总数展示、积分明细列表（来源/时间/变动）、分页加载、积分规则弹窗
- `points.wxml` — 页面模板：粉红渐变积分卡片、汇总数据行、积分明细列表、加载更多、空状态
- `points.wxss` — 页面样式：渐变头部+白色卡片、积分±图标圆形标记、明细行分隔、暗色模式适配
- `points.json` — 页面配置：导航栏标题、下拉刷新、上拉加载、引用empty-state和loading-more组件

## 任务2：配置分包策略

### 修改文件
- `app.json` — 调整 pages 数组 + 新增分包 + 预加载策略

### 核心分包（主包保留13个核心页面）
- 删除了 `pages/ar/ar`、`pages/user/address`、`pages/user/coupon`、`pages/user/points`、`pages/search/result`、`pages/promotion/promotion`、`pages/notification/notification` 从主pages数组

### 5个分包
| 分包根路径 | 包含页面 | 说明 |
|-----------|---------|------|
| `pages/ar/` | `ar` | AR预览分包 |
| `pages/user/` | `address`, `coupon`, `points` | 用户功能分包（地址/优惠券/积分） |
| `pages/promotion/` | `promotion` | 营销活动分包 |
| `pages/notification/` | `notification` | 消息通知分包 |
| `pages/search/` | `result` | 搜索结果分包 |

### 预加载策略
- `pages/index/index` → 预加载 `pages/ar/`（首页进入前下载AR分包）
- `pages/category/category` → 预加载 `pages/search/`（分类页进入前下载搜索结果分包）
- `pages/user/user` → 预加载 `pages/user/` + `pages/promotion/` + `pages/notification/`（用户中心进入前下载所有用户功能分包）

## 额外优化
- `pages/user/user.js` — 优惠券点击从「即将上线」改为跳转 `/pages/user/coupon`
- `pages/user/user.js` — 新增 `onPointsTap` 方法，会员卡积分区域可点击跳转 `/pages/user/points`
- `pages/user/user.wxml` — 会员卡积分区域添加 `bindtap="onPointsTap"`

## 统一设计规范
- 主色：`#FF6B9D`（粉红色）
- 圆角卡片：`border-radius: 12px`，阴影 `0 2px 8px rgba(0,0,0,0.06)`
- 背景色：`#F8F8F8`
- 所有页面支持字体大小适配（normal/large/extra-large）
- 所有列表页包含空状态
- 暗色模式样式覆盖
