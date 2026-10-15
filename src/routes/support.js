// src/routes/support.js
const express = require('express');
const { pool } = require('../config');
const { requireAuth, requireRole, audit } = require('../middleware');

const router = express.Router();

// ===== الطالب: إنشاء تذكرة =====
router.post('/tickets', requireAuth, async (req, res) => {
  try {
    const { subject, message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'invalid_input' });

    const t = await pool.query(
      `INSERT INTO support_tickets (user_id, subject, status)
       VALUES ($1,$2,'open') RETURNING id`,
      [req.user.id, subject || 'bot_message']
    );
    await pool.query(
      `INSERT INTO support_messages (ticket_id, sender_id, body)
       VALUES ($1,$2,$3)`,
      [t.rows[0].id, req.user.id, message]
    );
    await audit(req.user.id, 'support.ticket.create', 'support_tickets', t.rows[0].id, null, req.ip);
    res.status(201).json({ ticket_id: t.rows[0].id });
  } catch (err) {
    console.error('[support.create]', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== الطالب: تذاكره =====
router.get('/tickets/me', requireAuth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, subject, status, created_at
         FROM support_tickets WHERE user_id=$1
        ORDER BY created_at DESC LIMIT 100`,
      [req.user.id]
    );
    res.json({ tickets: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== الطالب أو الأدمن: رسائل تذكرة =====
router.get('/tickets/:id/messages', requireAuth, async (req, res) => {
  try {
    const t = await pool.query(
      `SELECT user_id FROM support_tickets WHERE id=$1`,
      [req.params.id]
    );
    if (!t.rows[0]) return res.status(404).json({ error: 'not_found' });
    const isOwner = t.rows[0].user_id === req.user.id;
    const isAdmin = ['admin', 'teacher'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'forbidden' });

    const r = await pool.query(
      `SELECT id, sender_id, body, created_at
         FROM support_messages WHERE ticket_id=$1
        ORDER BY created_at ASC`,
      [req.params.id]
    );
    res.json({ messages: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== الطالب أو الأدمن: إرسال رسالة =====
router.post('/tickets/:id/messages', requireAuth, async (req, res) => {
  try {
    const { body } = req.body || {};
    if (!body) return res.status(400).json({ error: 'invalid_input' });

    const t = await pool.query(
      `SELECT user_id, status FROM support_tickets WHERE id=$1`,
      [req.params.id]
    );
    if (!t.rows[0]) return res.status(404).json({ error: 'not_found' });

    const isOwner = t.rows[0].user_id === req.user.id;
    const isAdmin = ['admin', 'teacher'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'forbidden' });

    await pool.query(
      `INSERT INTO support_messages (ticket_id, sender_id, body)
       VALUES ($1,$2,$3)`,
      [req.params.id, req.user.id, body]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== أدمن: كل التذاكر =====
router.get('/admin/tickets', requireAuth, requireRole('admin', 'teacher'), async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT st.id, st.subject, st.status, st.created_at,
              u.full_name, u.id AS user_id
         FROM support_tickets st
         JOIN users u ON u.id = st.user_id
        ORDER BY st.created_at DESC LIMIT 300`
    );
    res.json({ tickets: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== أدمن: إغلاق تذكرة =====
router.post('/admin/tickets/:id/close', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    await pool.query(`UPDATE support_tickets SET status='closed' WHERE id=$1`, [req.params.id]);
    await audit(req.user.id, 'support.ticket.close', 'support_tickets', req.params.id, null, req.ip);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;