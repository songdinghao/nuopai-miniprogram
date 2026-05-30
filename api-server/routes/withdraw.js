const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const https = require('https');

// 微信支付配置（从环境变量读取）
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

// 提现接口
router.post('/api/withdraw', async (req, res) => {
  try {
    const { userId, amount, openid } = req.body;
    
    // 1. 验证参数
    if (!userId || !amount || !openid) {
      return res.json({ code: 400, msg: '参数不完整' });
    }
    
    if (amount < 100) {  // 最低1元（100分）
      return res.json({ code: 400, msg: '最低提现金额1元' });
    }
    
    // 2. 查询用户收益（从数据库）
    // TODO: 实现数据库查询
    const userEarnings = 1000;  // 模拟数据：10元
    
    if (amount > userEarnings) {
      return res.json({ code: 400, msg: '收益不足' });
    }
    
    // 3. 调用微信企业付款API
    const requestBody = {
      "appid": WXPAY_CONFIG.appId,
      "out_batch_no": `batch_${Date.now()}`,
      "batch_name": "诺派永生花兼职妈妈收益提现",
      "batch_remark": "收益提现",
      "total_amount": amount,
      "total_num": 1,
      "transfer_detail_list": [{
        "out_detail_no": `detail_${Date.now()}`,
        "transfer_amount": amount,
        "transfer_remark": "兼职妈妈收益提现",
        "openid": openid,
        "user_name": ""  // 可选：收款用户姓名（需加密）
      }]
    };
    
    const url = '/mch/transfers/v3/transfers';
    const { authorization, timestamp, nonceStr } = generateWxPaySignature('POST', url, JSON.stringify(requestBody));
    
    console.log('📤 调用微信提现API：', {
      url: `https://api.mch.weixin.qq.com${url}`,
      out_batch_no: requestBody.out_batch_no,
      amount: amount
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
    
    console.log('✅ 微信提现API响应：', response.data);
    
    // 4. 记录提现订单（到数据库）
    // TODO: 实现数据库写入
    const withdrawOrder = {
      orderId: response.data.batch_id,
      userId: userId,
      amount: amount,
      status: 'processing',
      createTime: new Date()
    };
    
    console.log('📝 提现订单已创建：', withdrawOrder);
    
    // 5. 返回结果
    res.json({
      code: 0,
      msg: '提现申请成功',
      data: {
        orderId: withdrawOrder.orderId,
        amount: amount,
        status: withdrawOrder.status
      }
    });
    
  } catch (err) {
    console.error('❌ 提现失败：', err.response?.data || err.message);
    res.json({ 
      code: 500, 
      msg: err.response?.data?.message || '提现失败，请稍后重试' 
    });
  }
});

// 查询提现订单状态
router.get('/api/withdraw/status', async (req, res) => {
  try {
    const { orderId } = req.query;
    
    if (!orderId) {
      return res.json({ code: 400, msg: '订单号不能为空' });
    }
    
    // TODO: 从数据库查询订单状态
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
    console.error('查询提现状态失败：', err);
    res.json({ code: 500, msg: '查询失败' });
  }
});

// 获取用户收益接口
router.get('/api/user/earnings', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.json({ code: 400, msg: '用户ID不能为空' });
    }
    
    // TODO: 从数据库查询用户收益
    // 模拟返回
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
    console.error('查询用户收益失败：', err);
    res.json({ code: 500, msg: '查询失败' });
  }
});

module.exports = router;
