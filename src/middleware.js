const { pool } = require('./config');
const { verifyToken } = require('./utils');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  const payload = verifyToken(token);
  if (!payload || !payload.id) return res.status(401).json({ error: 'invalid_token' });
  req.user = payload;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}

async function audit(actorId, action, entity, entityId, details, ip) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details, ip)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        actorId || null,
        action,
        entity || null,
        entityId ? String(entityId) : null,
        details ? JSON.stringify(details) : null,
        ip || null,
      ]
    );
  } catch (err) {
    console.error('[audit] failed:', err.message);
  }
}

module.exports = { requireAuth, requireRole, audit };