// src/routes/students.js
const express = require('express');
const { pool } = require('../config');
const { requireAuth, requireRole, audit } = require('../middleware');

const router = express.Router();

// ===== الطالب: ملفه الشخصي =====
router.get('/me/profile', requireAuth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.language,
              u.role, u.created_at,
              w.balance_minutes,
              p.id AS program_id, p.code AS program_code,
              p.name_ar, p.name_en, p.name_am
         FROM users u
         LEFT JOIN wallet_accounts w ON w.user_id = u.id
         LEFT JOIN enrollments e ON e.user_id = u.id AND e.status='active'
         LEFT JOIN programs p ON p.id = e.program_id
        WHERE u.id = $1
        LIMIT 1`,
      [req.user.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'not_found' });
    res.json({ profile: r.rows[0] });
  } catch (err) {
    console.error('[students.me]', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== الطالب: تعديل بياناته =====
router.patch('/me/profile', requireAuth, async (req, res) => {
  try {
    const { full_name, phone, language } = req.body || {};
    const langs = ['ar', 'en', 'am'];
    const lang = langs.includes(language) ? language : null;

    await pool.query(
      `UPDATE users
         SET full_name = COALESCE($1, full_name),
             phone     = COALESCE($2, phone),
             language  = COALESCE($3, language),
             updated_at = NOW()
       WHERE id = $4`,
      [full_name || null, phone || null, lang, req.user.id]
    );
    await audit(req.user.id, 'student.profile.update', 'users', req.user.id, { lang }, req.ip);
    res.json({ ok: true });
  } catch (err) {
    console.error('[students.patch]', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== الطالب: محفظته =====
router.get('/me/wallet', requireAuth, async (req, res) => {
  try {
    const w = await pool.query(
      `SELECT balance_minutes, balance_etb, updated_at
         FROM wallet_accounts WHERE user_id=$1`,
      [req.user.id]
    );
    const l = await pool.query(
      `SELECT amount, currency, direction, note, created_at
         FROM wallet_ledger WHERE user_id=$1
        ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({
      wallet: w.rows[0] || { balance_minutes: 0, balance_etb: 0 },
      ledger: l.rows,
    });
  } catch (err) {
    console.error('[students.wallet]', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== الطالب: برامجه =====
router.get('/me/programs', requireAuth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT p.id, p.code, p.name_ar, p.name_en, p.name_am, e.status, e.created_at
         FROM enrollments e
         JOIN programs p ON p.id = e.program_id
        WHERE e.user_id = $1
        ORDER BY e.created_at DESC`,
      [req.user.id]
    );
    res.json({ programs: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== الطالب: التسجيل في برنامج =====
router.post('/me/enroll', requireAuth, async (req, res) => {
  try {
    const { program_id } = req.body || {};
    if (!program_id) return res.status(400).json({ error: 'invalid_input' });
    const exists = await pool.query(
      `SELECT 1 FROM enrollments
        WHERE user_id=$1 AND program_id=$2 AND status='active'`,
      [req.user.id, program_id]
    );
    if (exists.rowCount) return res.status(409).json({ error: 'already_enrolled' });

    await pool.query(
      `INSERT INTO enrollments (user_id, program_id, status)
       VALUES ($1,$2,'active')`,
      [req.user.id, program_id]
    );
    await audit(req.user.id, 'student.enroll', 'enrollments', program_id, null, req.ip);
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[students.enroll]', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== عام: قائمة البرامج =====
router.get('/programs', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, code, name_ar, name_en, name_am, description
         FROM programs WHERE is_active=TRUE ORDER BY id`
    );
    res.json({ programs: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== عام: قائمة الحزم =====
router.get('/packages', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, name_ar, name_en, minutes, price_etb
         FROM packages WHERE is_active=TRUE ORDER BY minutes`
    );
    res.json({ packages: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== أدمن: كل الطلاب =====
router.get('/admin/students', requireAuth, requireRole('admin', 'teacher'), async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.language,
              u.telegram_id, u.created_at,
              COALESCE(w.balance_minutes, 0) AS balance_minutes,
              p.name_ar AS program_ar, p.name_en AS program_en, p.name_am AS program_am
         FROM users u
         LEFT JOIN wallet_accounts w ON w.user_id=u.id
         LEFT JOIN enrollments e ON e.user_id=u.id AND e.status='active'
         LEFT JOIN programs p ON p.id=e.program_id
        WHERE u.role='student'
        ORDER BY u.created_at DESC
        LIMIT 500`
    );
    res.json({ students: r.rows });
  } catch (err) {
    console.error('[students.admin]', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;