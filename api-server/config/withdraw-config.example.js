/**
 * 微信支付配置示例
 * 
 * 使用说明：
 * 1. 复制此文件为 withdraw-config.js
 * 2. 填入真实的配置信息
 * 3. 请勿将真实配置文件提交到Git
 */

module.exports = {
  wxpay: {
    // 小程序AppID
    appId: 'wx1234567890abcdef',
    
    // 微信支付商户号
    mchId: '1234567890',
    
    // APIv3密钥（在微信支付后台设置）
    apiV3Key: 'your-api-v3-key-here',
    
    // 证书序列号（从证书文件获取）
    serialNo: 'YOUR_CERTIFICATE_SERIAL_NO',
    
    // 私钥文件路径（相对于项目根目录）
    privateKeyPath: './config/apiclient_key.pem',
    
    // 证书文件路径（相对于项目根目录）
    certificatePath: './config/apiclient_cert.pem'
  },
  
  // 提现规则配置
  withdrawRules: {
    minAmount: 100,  // 最低提现金额（分）= 1元
    maxAmount: 20000,  // 单笔最高提现金额（分）= 200元
    dailyLimit: 50000,  // 每日提现限额（分）= 500元
    feeRate: 0,  // 手续费比例（0 = 免手续费）
    settleDays: 0  // 到账天数（0 = 实时到账）
  },
  
  // 安全配置
  security: {
    // 是否启用签名验证
    enableSignatureCheck: true,
    
    // IP白名单（为空则允许所有IP）
    ipWhitelist: [],
    
    // 请求频率限制（毫秒）
    rateLimit: 1000
  }
};

/*
获取证书序列号的方法：
1. 使用OpenSSL命令：
   openssl x509 -in apiclient_cert.pem -noout -serial
   
2. 或运行Node.js脚本：
   const fs = require('fs');
   const crypto = require('crypto');
   const cert = fs.readFileSync('./config/apiclient_cert.pem', 'utf8');
   const base64 = cert.replace(/-----BEGIN CERTIFICATE-----\n/, '').replace(/\n-----END CERTIFICATE-----/, '');
   const der = Buffer.from(base64, 'base64');
   const sha256 = crypto.createHash('sha256').update(der).digest('hex');
   console.log(parseInt(sha256.substring(0, 8), 16).toString());
*/
