const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ========== CORS 白名单 ==========
const ALLOWED_ORIGINS = [
  'https://servicewechat.com',
  'https://wechat.zzjgsw.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // 允许无 origin 的请求（如服务端调用、健康检查）
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS 策略拒绝此来源'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ========== 全局限流：100 次/分钟 ==========
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, msg: '请求过于频繁，请稍后再试' }
});
app.use(globalLimiter);

// ========== 健康检查 ==========
app.get('/health', (req, res) => {
  res.json({ code: 0, msg: 'OK', timestamp: Date.now() });
});

// ========== 注册路由 ==========
const withdrawRouter = require('./routes/withdraw');
app.use('/', withdrawRouter);

// ========== 错误处理 ==========
app.use((err, req, res, next) => {
  // CORS 错误单独处理
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ code: 403, msg: '不允许的请求来源' });
  }
  console.error('服务器错误：', err);
  res.status(500).json({ code: 500, msg: '服务器内部错误' });
});

// ========== 启动服务器 ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;
