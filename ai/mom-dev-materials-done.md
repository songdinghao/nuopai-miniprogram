# 兼职妈妈模块2 — 素材生成 开发完成

## 创建的文件

### 1. 素材库工具 `utils/mom-materials.js`
- `getProducts()` / `getProductById()` — 模拟8款永生花商品数据
- `generatePoster(product, userId)` — 生成海报数据（商品图+名称+价格+描述+店铺码）
- `generateCopy(productId, style)` — 生成社群暖心文案（按商品类型匹配文案模板）
- `generateStoreQR(userId)` — 生成个人店铺码数据
- `getMaterialCategories()` — 返回分类列表：['海报', '文案', '店铺码']

### 2. 素材库页面 `pages/mom/materials/`
- **materials.json** — 页面配置（粉色导航栏）
- **materials.js** — 页面逻辑（Tab切换、商品选择、海报生成、文案复制、店铺码保存）
- **materials.wxml** — 页面结构（3个Tab内容 + 海报预览弹窗）
- **materials.wxss** — 页面样式（大字版、粉色主调 #FF6B9D）

### 3. 路由更新
- `app.json` — 添加 `pages/mom/materials/materials` 到 pages 数组

## 功能说明

| Tab | 功能 | 操作 |
|-----|------|------|
| 海报 | 商品网格 → 点击商品 → 弹出海报预览 | 保存到相册 |
| 文案 | 商品列表 → 点击商品 → 展示3-5条文案 | 单条复制 / 一键复制全部 |
| 店铺码 | 展示个人店铺推广码 + 邀请码 | 保存到相册 |

## 设计
- 粉色主调 #FF6B9D，粉白渐变卡片
- 大字版设计，支持 normal/large/extra-large 字体适配
- 海报预览使用商品图片+文字叠加（模拟，无真实Canvas合成）
- 所有素材支持一键保存/复制
