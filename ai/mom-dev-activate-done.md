# 兼职妈妈体验官 - 模块1 开通入口 + 数据模型 开发完成

## 完成内容

### 1. 数据模型 (`utils/mom-program.js`)
- **兼职妈妈用户数据结构**：isMom, momSince, momLevel(newbie/regular), 三级收益(总/待/已到账), monthlyOrders, inviteCode, notificationEnabled
- **收益记录结构**: createEarningRecord() 方法，含 type(share/referral/growth), status(pending/settled/cancelled), 时间戳
- **核心函数**:
  - `checkAndUpgradeLevel(userData)` — 检查30天新手期，到期自动升级为regular
  - `calculateShareCommission(orderAmount, productType)` — 按商品类型计算佣金(default=5%/premium=8%/promotion=10%)
  - `canWithdraw(userData, amount)` — 检查提现条件(是否开通/最低10元/余额充足)
  - `generateInviteCode(userId)` — 生成 NP+时间戳+用户ID 格式邀请码
  - `simulateTimeTravel(days)` — 测试用时间模拟器

### 2. 开通入口页面 (`pages/mom/activate/`)
- **activate.wxml**: 粉色渐变背景 + 圆形装饰 + 主标题"成为兼职妈妈体验官" + 4项权益说明 + 粉色大按钮"一键开通，立即赚钱"
- **activate.wxss**: #FF6B9D 主色调，粉白渐变，温暖女性化设计，符合UI规范(按钮48px+, 字号16px+)
- **activate.js**: 开通流程模拟(1.2秒loading)，写入globalData.momData及本地存储，跳转到mom/home
- **activate.json**: 导航栏粉色配置

### 3. 兼职妈妈专属页面 (`pages/mom/home/`)
- **home.wxml**: 粉色收益摘要卡片(累计/待到账/已到账) + 6宫格功能入口(素材库/奖励/提现/规则/客服/通知) + 月度数据卡片
- **开通引导浮层**: 首次开通显示15秒3步指引(生成素材→分享→赚收益)，支持关闭
- **home.wxss**: 温暖女性化设计，粉色渐变卡片，圆角卡片布局，大字版设计
- **home.js**: 数据加载/等级检查/新手期倒计时/模拟月度数据

### 4. 首页入口修改 (`pages/index/`)
- **index.wxml**: 在轮播图和分类导航之间插入「兼职妈妈体验官」入口条(粉色渐变背景，白色大字)
  - 未开通: 显示"零门槛、零投入，分享就能赚零花钱" + "立即加入"按钮
  - 已开通: 显示"查看收益 >" + "我的主页"按钮
- **index.wxss**: 添加粉色渐变卡片样式
- **index.js**: 添加 `checkMomStatus()` / `onMomTap()` 函数

### 5. 个人中心入口修改 (`pages/user/`)
- **user.wxml**: 在订单区域和功能菜单之间插入兼职妈妈入口条
- **user.wxss**: 添加粉色渐变卡片样式
- **user.js**: 添加 `loadMomData()` / `onMomTap()` 函数

### 6. 全局注册
- **app.json**: 注册 `pages/mom/activate/activate` 和 `pages/mom/home/home`
- **app.js**: globalData 添加 `momData: null`，onLaunch 自动恢复本地存储数据

## 设计规范覆盖
- 主色 `#FF6B9D` ✓
- 字体 ≥ 16px ✓
- 可点击区域 ≥ 44px ✓
- 按钮高度 ≥ 48px ✓
- 圆角统一(按钮8px, 卡片12px) ✓
- 温暖、女性化风格 ✓

## 待后续开发
- 素材库页面 (商品分享海报生成)
- 我的奖励页面 (收益明细列表)
- 提现页面 (绑定银行卡/微信提现)
- 商品详情页分享按钮
