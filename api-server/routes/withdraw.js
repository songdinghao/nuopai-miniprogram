const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const https = require('https');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/auth');

// ========== 提现接口限流：3 次/分钟 ==========
const withdrawLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, msg: '提现请求过于频繁，请 1 分钟后再试' }
});

// ========== 提现金额配置 ==========
// TODO: 生产环境从数据库/配置中心读取
const MIN_WITHDRAW_AMOUNT = parseInt(process.env.MIN_WITHDRAW_AMOUNT, 10) || 100; // 最低提现金额（分）

// ========== 幂等性保护（out_batch_no 去重） ==========
// TODO: 生产环境用 Redis SET 替代内存 Map
const processedBatchNos = new Map(); // out_batch_no -> true

// ========== 并发控制（同一用户不可并发提现） ==========
// TODO: 生产环境用 Redis 分布式锁（SETNX + TTL）
const userWithdrawLocks = new Map(); // userId -> boolean

// ========== 微信支付配置（从环境变量读取） ==========
const WXPAY_CONFIG = {
  appId: process.env.WX_APPID || '',
  mchId: process.env.WX_MCH_ID || '',
  apiV3Key: process.env.WX_API_V3_KEY || '',
  serialNo: process.env.WX_SERIAL_NO || '',
  privateKeyPath: process.env.WX_PRIVATE_KEY_PATH || './config/apiclient_key.pem',
  certificatePath: process.env.WX_CERTIFICATE_PATH || './config/apiclient_cert.pem'
};

// 加载证书
let privateKey, certificate;
try {
  privateKey = fs.readFileSync(WXPAY_CONFIG.privateKeyPath, 'utf8');
  certificate = fs.readFileSync(WXPAY_CONFIG.certificatePath, 'utf8');
  console.log('✅ 微信支付证书加载成功');
} catch (err) {
  console.error('❌ 加载微信支付证书失败：', err.message);
  console.error('请确保证书文件存在于：', WXPAY_CONFIG.privateKeyPath);
}

// ========== 日志脱敏工具函数 ==========
/**
 * 只显示金额的整数部分（分 -> 元，截断小数）
 * 只显示订单号后 4 位
 */
function maskAmount(amountInFen) {
  return `${Math.floor(amountInFen / 100)}元(**${amountInFen % 100}分)`;
}

function maskBatchNo(batchNo) {
  if (!batchNo || batchNo.length <= 4) return '****';
  return `****${batchNo.slice(-4)}`;
}

// 生成APIv3签名
function generateWxPaySignature(method, url, body = '') {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonceStr = crypto.randomBytes(16).toString('hex');

  // 构造签名字符串
  const signStr = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;

  // 使用私钥签名
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signStr);
  const signature = sign.sign(privateKey, 'base64');

  // 构造Authorization头
  const token = `mchid="${WXPAY_CONFIG.mchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${WXPAY_CONFIG.serialNo}",signature="${signature}"`;

  return {
    authorization: `WECHATPAY2-SHA256-RSA2048 ${token}`,
    timestamp,
    nonceStr
  };
}

// ========== 提现接口 ==========
router.post('/api/withdraw', authMiddleware, withdrawLimiter, async (req, res) => {
  // 使用认证中间件提供的 userId，不再从 body 读取
  const userId = req.userId;
  const { amount, openid } = req.body;

  try {
    // ---------- 1. 参数校验 ----------
    if (!amount || !openid) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    // 金额必须是正整数（单位：分）
    if (!Number.isInteger(amount) || amount <= 0) {
      return res.json({ code: 400, msg: '提现金额必须为正整数（单位：分）' });
    }

    if (amount < MIN_WITHDRAW_AMOUNT) {
      return res.json({ code: 400, msg: `最低提现金额为 ${MIN_WITHDRAW_AMOUNT} 分` });
    }

    // ---------- 2. 查询用户收益（从数据库） ----------
    // TODO: 接入数据库，查询真实用户余额，不要信任客户端传入的余额
    // const userEarnings = await db.getUserAvailableEarnings(userId);
    const userEarnings = 1000; // 模拟数据：10元（1000分）

    if (amount > userEarnings) {
      return res.json({ code: 400, msg: '收益不足' });
    }

    // ---------- 3. 幂等性校验（防重复提交） ----------
    const outBatchNo = `batch_${userId}_${Date.now()}`;
    if (processedBatchNos.has(outBatchNo)) {
      return res.json({ code: 0, msg: '该提现请求已处理，请勿重复提交' });
    }

    // ---------- 4. 并发控制（同一用户不可并发提现） ----------
    if (userWithdrawLocks.get(userId)) {
      return res.json({ code: 429, msg: '您有一笔提现正在处理中，请稍后再试' });
    }
    userWithdrawLocks.set(userId, true);

    try {
      // ---------- 5. 调用微信企业付款API ----------
      const requestBody = {
        "appid": WXPAY_CONFIG.appId,
        "out_batch_no": outBatchNo,
        "batch_name": "诺派永生花兼职妈妈收益提现",
        "batch_remark": "收益提现",
        "total_amount": amount,
        "total_num": 1,
        "transfer_detail_list": [{
          "out_detail_no": `detail_${userId}_${Date.now()}`,
          "transfer_amount": amount,
          "transfer_remark": "兼职妈妈收益提现",
          "openid": openid,
          "user_name": ""  // 可选：收款用户姓名（需加密）
        }]
      };

      const url = '/mch/transfers/v3/transfers';
      const { authorization, timestamp, nonceStr } = generateWxPaySignature('POST', url, JSON.stringify(requestBody));

      // 脱敏日志
      console.log('📤 调用微信提现API：', {
        userId,
        out_batch_no: maskBatchNo(outBatchNo),
        amount: maskAmount(amount)
      });

      const response = await axios.post(`https://api.mch.weixin.qq.com${url}`, requestBody, {
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Wechatpay-Timestamp': timestamp,
          'Wechatpay-Nonce': nonceStr,
          'Wechatpay-Serial': WXPAY_CONFIG.serialNo
        },
        httpsAgent: new https.Agent({
          pfx: Buffer.from(certificate),
          passphrase: WXPAY_CONFIG.mchId
        })
      });

      // 脱敏日志
      console.log('✅ 微信提现API响应：batch_id=****, status=success');

      // ---------- 6. 记录提现订单（到数据库） ----------
      // TODO: 接入数据库，写入提现订单记录
      const withdrawOrder = {
        orderId: response.data.batch_id,
        userId: userId,
        amount: amount,
        status: 'processing',
        createTime: new Date()
      };

      console.log('📝 提现订单已创建：', {
        orderId: maskBatchNo(String(withdrawOrder.orderId)),
        userId,
        amount: maskAmount(amount),
        status: withdrawOrder.status
      });

      // 标记为已处理（幂等性）
      processedBatchNos.set(outBatchNo, true);

      // ---------- 7. 返回结果 ----------
      res.json({
        code: 0,
        msg: '提现申请成功',
        data: {
          orderId: withdrawOrder.orderId,
          amount: amount,
          status: withdrawOrder.status
        }
      });

    } finally {
      // 无论成功失败都释放锁
      userWithdrawLocks.delete(userId);
    }

  } catch (err) {
    // 确保释放锁
    userWithdrawLocks.delete(userId);
    console.error('❌ 提现失败：', err.response?.data ? '微信接口错误' : err.message);
    res.json({
      code: 500,
      msg: err.response?.data?.message || '提现失败，请稍后重试'
    });
  }
});

// ========== 查询提现订单状态 ==========
router.get('/api/withdraw/status', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.json({ code: 400, msg: '订单号不能为空' });
    }

    // TODO: 从数据库查询订单状态（需校验订单归属当前用户）
    // 或调用微信API查询：GET /mch/transfers/v3/transfers/batch-id/{batch_id}

    // 模拟返回
    res.json({
      code: 0,
      data: {
        orderId: orderId,
        status: 'success',  // processing | success | fail
        finishTime: new Date()
      }
    });
  } catch (err) {
    console.error('查询提现状态失败：', err.message);
    res.json({ code: 500, msg: '查询失败' });
  }
});

// ========== 获取用户收益接口 ==========
router.get('/api/user/earnings', authMiddleware, async (req, res) => {
  try {
    // 使用认证中间件提供的 userId
    const userId = req.userId;

    // TODO: 从数据库查询用户收益
    // const earnings = await db.getUserEarnings(userId);
    const earnings = {
      userId: userId,
      totalEarnings: 1000,  // 总收入（分）
      availableAmount: 1000,  // 可提现金额（分）
      withdrawnAmount: 0  // 已提现金额（分）
    };

    res.json({
      code: 0,
      data: earnings
    });
  } catch (err) {
    console.error('查询用户收益失败：', err.message);
    res.json({ code: 500, msg: '查询失败' });
  }
});

module.exports = router;
