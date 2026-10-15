// src/routes/certificates.js
const express = require('express');
const { pool } = require('../config');
const { requireAuth, requireRole, audit } = require('../middleware');

const router = express.Router();

function newSerial(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

// ===== الطالب: شهاداته =====
router.get('/me', requireAuth, async (req, res) => {
  try {
    const certs = await pool.query(
      `SELECT id, type, title, serial, file_url, issued_at
         FROM certificates WHERE user_id=$1 ORDER BY issued_at DESC`,
      [req.user.id]
    );
    const ij = await pool.query(
      `SELECT i.id, i.teacher_name, i.sanad_text, i.serial, i.issued_at,
              p.name_ar AS program_ar, p.name_en AS program_en, p.name_am AS program_am
         FROM ijazat i
         LEFT JOIN programs p ON p.id = i.program_id
        WHERE i.user_id=$1 ORDER BY i.issued_at DESC`,
      [req.user.id]
    );
    res.json({ certificates: certs.rows, ijazat: ij.rows });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== عام: التحقق من سند شهادة =====
router.get('/verify/:serial', async (req, res) => {
  try {
    const serial = String(req.params.serial || '').toUpperCase();
    const c = await pool.query(
      `SELECT c.id, c.type, c.title, c.serial, c.issued_at,
              u.full_name AS holder_name
         FROM certificates c
         JOIN users u ON u.id = c.user_id
        WHERE UPPER(c.serial) = $1 LIMIT 1`,
      [serial]
    );
    if (c.rows[0]) return res.json({ valid: true, kind: 'certificate', data: c.rows[0] });

    const i = await pool.query(
      `SELECT i.id, i.teacher_name, i.sanad_text, i.serial, i.issued_at,
              u.full_name AS holder_name,
              p.name_ar AS program_ar, p.name_en AS program_en, p.name_am AS program_am
         FROM ijazat i
         JOIN users u ON u.id = i.user_id
         LEFT JOIN programs p ON p.id = i.program_id
        WHERE UPPER(i.serial) = $1 LIMIT 1`,
      [serial]
    );
    if (i.rows[0]) return res.json({ valid: true, kind: 'ijazah', data: i.rows[0] });

    res.status(404).json({ valid: false });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== أدمن: إصدار شهادة =====
router.post('/admin/certificates', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { user_id, type, title, file_url } = req.body || {};
    if (!user_id || !type || !title) return res.status(400).json({ error: 'invalid_input' });

    const serial = newSerial('CRT');
    const r = await pool.query(
      `INSERT INTO certificates (user_id, type, title, serial, file_url)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, serial, issued_at`,
      [user_id, type, title, serial, file_url || null]
    );
    await audit(req.user.id, 'certificate.issue', 'certificates', r.rows[0].id, { serial }, req.ip);
    res.status(201).json({ certificate: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== أدمن: إصدار إجازة بالسند =====
router.post('/admin/ijazat', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { user_id, program_id, teacher_name, sanad_text } = req.body || {};
    if (!user_id || !teacher_name || !sanad_text) {
      return res.status(400).json({ error: 'invalid_input' });
    }
    const serial = newSerial('IJZ');
    const r = await pool.query(
      `INSERT INTO ijazat (user_id, program_id, teacher_name, sanad_text, serial)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, serial, issued_at`,
      [user_id, program_id || null, teacher_name, sanad_text, serial]
    );
    await audit(req.user.id, 'ijaza.issue', 'ijazat', r.rows[0].id, { serial }, req.ip);
    res.status(201).json({ ijazah: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== أدمن: كل الإجازات =====
router.get('/admin/ijazat', requireAuth, requireRole('admin', 'teacher'), async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT i.id, i.serial, i.teacher_name, i.issued_at,
              u.full_name AS holder_name,
              p.name_ar AS program_ar, p.name_en AS program_en
         FROM ijazat i
         JOIN users u ON u.id = i.user_id
         LEFT JOIN programs p ON p.id = i.program_id
        ORDER BY i.issued_at DESC LIMIT 500`
    );
    res.json({ ijazat: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;