const express = require('express');
const { pool } = require('./config');
const { hashPassword, verifyPassword, signToken } = require('./utils');
const { requireAuth, audit } = require('./middleware');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone, language } = req.body || {};
    if (!email || !password || String(password).length < 8) {
      return res.status(400).json({ error: 'invalid_input' });
    }
    const lang = ['ar', 'en', 'am'].includes(language) ? language : 'ar';
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rowCount) return res.status(409).json({ error: 'email_exists' });

    const hash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO users (email, phone, password_hash, full_name, role, language)
       VALUES ($1,$2,$3,$4,'student',$5)
       RETURNING id, email, full_name, role, language, created_at`,
      [email, phone || null, hash, full_name || null, lang]
    );
    const user = result.rows[0];
    const token = signToken({ id: user.id, role: user.role });
    await audit(user.id, 'user.register', 'users', user.id, { email, lang }, req.ip);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('[auth.register]', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'invalid_input' });

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });

    const ok = await verifyPassword(user.password_hash, password);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    const token = signToken({ id: user.id, role: user.role });
    await audit(user.id, 'user.login', 'users', user.id, null, req.ip);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        language: user.language,
      },
      token,
    });
  } catch (err) {
    console.error('[auth.login]', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, full_name, role, language, telegram_id, created_at
         FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'not_found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;