/**
 * Bearer Token 身份认证中间件
 *
 * 校验逻辑：
 *   1. 从 Authorization 头读取 Bearer token
 *   2. 与环境变量 VALID_TOKENS（逗号分隔）比对
 *   3. 通过后将 token 对应的 userId 写入 req.userId
 *
 * 环境变量：
 *   VALID_TOKENS  — 逗号分隔的有效 token 列表，格式 token1:userId1,token2:userId2
 *                    示例：abc123:user_001,def456:user_002
 *   VALID_REFRESH_TOKENS — 刷新令牌列表，格式 refresh1:user_001,refresh2:user_002
 *                    （生产应使用数据库或 Redis 管理）
 *
 * TODO: 生产环境替换为 JWT / OAuth2.0 + Redis 存储
 */

const crypto = require('crypto');

// 从环境变量构建 token -> userId 映射
function loadTokenMap() {
  const raw = process.env.VALID_TOKENS || '';
  const map = new Map();
  raw.split(',').forEach((pair) => {
    const [token, userId] = pair.split(':');
    if (token && userId) {
      map.set(token.trim(), userId.trim());
    }
  });
  return map;
}

function loadRefreshTokenMap() {
  const raw = process.env.VALID_REFRESH_TOKENS || '';
  const map = new Map();
  raw.split(',').forEach((pair) => {
    const [refresh, userId] = pair.split(':');
    if (refresh && userId) {
      map.set(refresh.trim(), userId.trim());
    }
  });
  return map;
}

// 启动时加载一次；如需热更新可改为每次请求读取
const tokenMap = loadTokenMap();
const refreshTokenMap = loadRefreshTokenMap();

// 运行时签发的临时 access token（内存）
const issuedTokens = new Map(); // token -> { userId, expiresAt }
// 运行时签发的刷新 token（内存）
const issuedRefreshTokens = new Map(); // refreshToken -> userId

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [tk, meta] of issuedTokens.entries()) {
    if (meta.expiresAt && meta.expiresAt < now) issuedTokens.delete(tk);
  }
}

// 签发一个新的 access token（内存模拟）
function issueAccessToken(userId, ttlSeconds = 7200) {
  const token = 'tk_' + crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + ttlSeconds * 1000;
  issuedTokens.set(token, { userId, expiresAt });
  return { token, expiresIn: ttlSeconds };
}

// 签发一个新的 refresh token（内存模拟）
function issueRefreshToken(userId) {
  const refresh = 'rf_' + crypto.randomBytes(16).toString('hex');
  issuedRefreshTokens.set(refresh, userId);
  return refresh;
}

function authMiddleware(req, res, next) {
  // 定期清理过期 issuedTokens
  try { cleanupExpiredTokens(); } catch (e) {}

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, msg: '未提供认证令牌' });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({ code: 401, msg: '认证令牌为空' });
  }

  // 优先查 env tokenMap，再查运行时 issuedTokens
  let userId = tokenMap.get(token);
  if (!userId) {
    const meta = issuedTokens.get(token);
    if (meta && meta.userId) userId = meta.userId;
  }

  if (!userId) {
    return res.status(403).json({ code: 403, msg: '认证令牌无效或已过期' });
  }

  // 将 userId 挂载到 req 上，后续路由通过 req.userId 获取
  req.userId = userId;
  next();
}

// 暴露一些辅助方法/结构，供 auth route 使用
authMiddleware._internal = {
  issuedTokens,
  issuedRefreshTokens,
  refreshTokenMap,
  issueAccessToken,
  issueRefreshToken
};

module.exports = authMiddleware;
