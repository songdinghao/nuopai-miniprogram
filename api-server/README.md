# 微信提现功能 - 后端API服务

## 功能说明

本服务实现了微信支付企业付款到零钱功能，用于诺派永生花小程序的兼职妈妈收益提现。

## 目录结构

```
api-server/
├── app.js                          # Express应用入口
├── package.json                    # 依赖配置
├── routes/
│   └── withdraw.js                # 提现相关路由
├── config/
│   ├── withdraw-config.example.js  # 配置示例
│   └── apiclient_key.pem         # 私钥（不提交）
│   └── apiclient_cert.pem        # 证书（不提交）
├── .env.example                   # 环境变量示例
├── .gitignore                     # Git忽略文件
└── README.md                      # 本文件
```

## 快速开始

### 1. 安装依赖

```bash
cd api-server
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入真实信息：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
WX_APPID=wx1234567890abcdef
WX_MCH_ID=1234567890
WX_API_V3_KEY=your-api-v3-key-here
WX_SERIAL_NO=YOUR_CERTIFICATE_SERIAL_NO
WX_PRIVATE_KEY_PATH=./config/apiclient_key.pem
WX_CERTIFICATE_PATH=./config/apiclient_cert.pem
PORT=3000
NODE_ENV=development
```

### 3. 放置证书文件

将微信支付商户证书放到 `config/` 目录：

```bash
cp apiclient_key.pem api-server/config/
cp apiclient_cert.pem api-server/config/
```

**重要**：确保证书文件已添加到 `.gitignore`，不要提交到Git！

### 4. 获取证书序列号

使用OpenSSL命令获取证书序列号：

```bash
openssl x509 -in config/apiclient_cert.pem -noout -serial
```

将输出的序列号填入 `.env` 的 `WX_SERIAL_NO`。

### 5. 启动服务

开发模式（使用nodemon自动重启）：

```bash
npm run dev
```

生产模式：

```bash
npm start
```

## API接口

### 1. 提现接口

**URL**: `POST /api/withdraw`

**请求体**：

```json
{
  "userId": "user_001",
  "amount": 1000,
  "openid": "oUpF8uMuAJO_M2pxb1Q9zNjWeS6o"
}
```

参数说明：
- `userId`: 用户ID
- `amount`: 提现金额（单位：分，100 = 1元）
- `openid`: 用户的微信openid

**响应**：

```json
{
  "code": 0,
  "msg": "提现申请成功",
  "data": {
    "orderId": "batch_1234567890",
    "amount": 1000,
    "status": "processing"
  }
}
```

### 2. 查询提现状态

**URL**: `GET /api/withdraw/status?orderId=batch_1234567890`

**响应**：

```json
{
  "code": 0,
  "data": {
    "orderId": "batch_1234567890",
    "status": "success",
    "finishTime": "2026-05-09T12:00:00.000Z"
  }
}
```

状态说明：
- `processing`: 处理中
- `success`: 已到账
- `fail`: 失败

### 3. 查询用户收益

**URL**: `GET /api/user/earnings?userId=user_001`

**响应**：

```json
{
  "code": 0,
  "data": {
    "userId": "user_001",
    "totalEarnings": 1000,
    "availableAmount": 1000,
    "withdrawnAmount": 0
  }
}
```

## 安全注意事项

### 1. 证书管理

- ✅ **正确做法**：
  - 证书文件添加到 `.gitignore`
  - 私钥文件权限设置为 `600`
  - 使用环境变量存储证书路径
  - 定期轮换APIv3密钥

- ❌ **错误做法**：
  - 将证书提交到Git
  - 在代码中硬编码证书路径
  - 将私钥放在公开目录

### 2. 设置私钥文件权限

```bash
chmod 600 config/apiclient_key.pem
```

### 3. API安全

- 启用HTTPS（生产环境）
- 配置IP白名单
- 添加请求签名验证
- 实施频率限制

## 微信支付配置步骤

### 1. 申请微信支付商户号

访问 [微信支付商户平台](https://pay.weixin.qq.com/) 申请商户号。

### 2. 开通企业付款到零钱

在商户平台 -> 产品中心 -> 企业付款到零钱，申请开通。

**申请条件**：
- 商户号入驻满90天
- 连续30天有交易
- 交易金额符合要求

### 3. 获取API证书

在商户平台 -> 账户中心 -> API安全 -> 申请API证书。

下载证书文件：
- `apiclient_key.pem`: 私钥
- `apiclient_cert.pem`: 证书

### 4. 设置APIv3密钥

在商户平台 -> 账户中心 -> API安全 -> 设置APIv3密钥。

## 测试

### 1. 健康检查

```bash
curl http://localhost:3000/health
```

### 2. 测试提现接口

```bash
curl -X POST http://localhost:3000/api/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "amount": 100,
    "openid": "test_openid"
  }'
```

## 常见问题

### Q1: 提示"证书加载失败"

**解决方法**：
1. 检查证书文件是否存在
2. 检查证书路径是否正确
3. 检查证书文件权限

### Q2: 提示"签名错误"

**解决方法**：
1. 检查APIv3密钥是否正确
2. 检查证书序列号是否正确
3. 检查签名字符串格式是否符合规范

### Q3: 提示"商户号不支持该功能"

**解决方法**：
1. 确认已开通"企业付款到零钱"功能
2. 检查商户号是否满足申请条件
3. 联系微信支付客服

## 生产部署

### 1. 使用PM2管理进程

```bash
npm install -g pm2
pm2 start app.js --name "withdraw-api"
pm2 save
pm2 startup
```

### 2. 配置Nginx反向代理

```nginx
server {
    listen 443 ssl;
    server_name wechat.zzjgsw.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. 环境变量

生产环境使用真实的环境变量，不要使用 `.env` 文件。

## 数据库集成

当前代码使用模拟数据，需要集成数据库时：

1. 修改 `routes/withdraw.js` 中的 `TODO` 部分
2. 添加数据库连接配置
3. 实现用户收益查询
4. 实现提现订单记录

建议使用 MySQL 或 MongoDB。

## 联系方式

如有问题，请联系开发团队。

---

**最后更新**: 2026-05-09
