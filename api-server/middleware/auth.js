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
 *
 * TODO: 生产环境替换为 JWT / OAuth2.0 + Redis 存储
 */

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

// 启动时加载一次；如需热更新可改为每次请求读取
const tokenMap = loadTokenMap();

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, msg: '未提供认证令牌' });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({ code: 401, msg: '认证令牌为空' });
  }

  const userId = tokenMap.get(token);

  if (!userId) {
    return res.status(403).json({ code: 403, msg: '认证令牌无效或已过期' });
  }

  // 将 userId 挂载到 req 上，后续路由通过 req.userId 获取
  req.userId = userId;
  next();
}

module.exports = authMiddleware;
