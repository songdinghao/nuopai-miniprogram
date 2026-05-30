const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ code: 0, msg: 'OK', timestamp: Date.now() });
});

// 注册路由
const withdrawRouter = require('./routes/withdraw');
app.use('/', withdrawRouter);

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误：', err);
  res.status(500).json({ code: 500, msg: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;
