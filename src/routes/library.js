// src/routes/library.js
const express = require('express');
const { pool } = require('../config');
const { requireAuth, requireRole, audit } = require('../middleware');

const router = express.Router();

// ===== عام: قائمة المكتبة =====
router.get('/', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, title, type, url, description, created_at
         FROM library_items WHERE is_active=TRUE
        ORDER BY created_at DESC LIMIT 200`
    );
    res.json({ items: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== أدمن: إضافة عنصر =====
router.post('/', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { title, type, url, description } = req.body || {};
    if (!title) return res.status(400).json({ error: 'invalid_input' });

    const r = await pool.query(
      `INSERT INTO library_items (title, type, url, description, is_active)
       VALUES ($1,$2,$3,$4,TRUE)
       RETURNING id, title`,
      [title, type || null, url || null, description || null]
    );
    await audit(req.user.id, 'library.create', 'library_items', r.rows[0].id, null, req.ip);
    res.status(201).json({ item: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== أدمن: تعديل عنصر =====
router.patch('/:id', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { title, type, url, description, is_active } = req.body || {};
    await pool.query(
      `UPDATE library_items
         SET title       = COALESCE($1, title),
             type        = COALESCE($2, type),
             url         = COALESCE($3, url),
             description = COALESCE($4, description),
             is_active   = COALESCE($5, is_active)
       WHERE id = $6`,
      [title || null, type || null, url || null, description || null,
       typeof is_active === 'boolean' ? is_active : null, req.params.id]
    );
    await audit(req.user.id, 'library.update', 'library_items', req.params.id, null, req.ip);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== أدمن: حذف (تعطيل) =====
router.delete('/:id', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    await pool.query(`UPDATE library_items SET is_active=FALSE WHERE id=$1`, [req.params.id]);
    await audit(req.user.id, 'library.disable', 'library_items', req.params.id, null, req.ip);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;