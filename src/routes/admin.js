// src/routes/admin.js
const express = require('express');
const { pool } = require('../config');
const { requireAuth, requireRole, audit } = require('../middleware');
const { creditMinutes, debitMinutes } = require('../services');

const router = express.Router();

router.use(requireAuth, requireRole('admin', 'teacher'));

// ===== إحصائيات شاملة =====
router.get('/stats', async (_req, res) => {
  try {
    const [students, receipts, sessions, ijazat, revenue] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS n FROM users WHERE role='student'`),
      pool.query(`SELECT COUNT(*)::int AS n FROM payment_receipts WHERE status='pending'`),
      pool.query(`SELECT COUNT(*)::int AS n FROM bookings WHERE scheduled_at > NOW()`),
      pool.query(`SELECT COUNT(*)::int AS n FROM ijazat`),
      pool.query(
        `SELECT COALESCE(SUM(amount_etb),0)::numeric AS total
           FROM payment_orders WHERE status='paid'`
      ),
    ]);
    res.json({
      students: students.rows[0].n,
      pending_receipts: receipts.rows[0].n,
      upcoming_sessions: sessions.rows[0].n,
      ijazat: ijazat.rows[0].n,
      total_revenue_etb: revenue.rows[0].total,
    });
  } catch (err) {
    console.error('[admin.stats]', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== إضافة دقائق يدوياً =====
router.post('/users/:id/minutes/add', async (req, res) => {
  try {
    const { minutes, reason } = req.body || {};
    const n = parseInt(minutes, 10);
    if (!Number.isFinite(n) || n <= 0) return res.status(400).json({ error: 'invalid_minutes' });

    const u = await pool.query(`SELECT id FROM users WHERE id=$1`, [req.params.id]);
    if (!u.rows[0]) return res.status(404).json({ error: 'user_not_found' });

    const tx = await creditMinutes(req.params.id, n, {
      refType: 'admin_manual',
      refId: String(req.user.id),
      note: reason || null,
    });
    await audit(req.user.id, 'admin.minutes.add', 'users', req.params.id, { minutes: n }, req.ip);
    res.json({ ok: true, minutes_added: n, tx });
  } catch (err) {
    console.error('[admin.add]', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== خصم دقائق يدوياً =====
router.post('/users/:id/minutes/deduct', async (req, res) => {
  try {
    const { minutes, reason } = req.body || {};
    const n = parseInt(minutes, 10);
    if (!Number.isFinite(n) || n <= 0) return res.status(400).json({ error: 'invalid_minutes' });

    let tx;
    try {
      tx = await debitMinutes(req.params.id, n, {
        refType: 'admin_manual',
        refId: String(req.user.id),
        note: reason || null,
      });
    } catch (e) {
      if (e.message === 'insufficient_balance') {
        return res.status(402).json({ error: 'insufficient_balance' });
      }
      throw e;
    }
    await audit(req.user.id, 'admin.minutes.deduct', 'users', req.params.id, { minutes: n }, req.ip);
    res.json({ ok: true, minutes_deducted: n, tx });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== تفعيل/تعطيل مستخدم =====
router.post('/users/:id/toggle', async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE users SET is_active = NOT is_active, updated_at=NOW()
        WHERE id=$1 RETURNING is_active`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'not_found' });
    await audit(req.user.id, 'admin.user.toggle', 'users', req.params.id,
      { is_active: r.rows[0].is_active }, req.ip);
    res.json({ is_active: r.rows[0].is_active });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== إعلان =====
router.post('/announcements', async (req, res) => {
  try {
    const { title, body } = req.body || {};
    if (!title) return res.status(400).json({ error: 'invalid_input' });
    const r = await pool.query(
      `INSERT INTO announcements (title, body, is_active)
       VALUES ($1,$2,TRUE) RETURNING id, created_at`,
      [title, body || null]
    );
    await audit(req.user.id, 'admin.announcement.create', 'announcements', r.rows[0].id, null, req.ip);
    res.status(201).json({ announcement: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== إشعار جماعي (يُخزَّن في notifications) =====
router.post('/notify-all', async (req, res) => {
  try {
    const { title, body } = req.body || {};
    if (!title) return res.status(400).json({ error: 'invalid_input' });
    const users = await pool.query(`SELECT id FROM users WHERE is_active=TRUE`);
    let n = 0;
    for (const u of users.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, body) VALUES ($1,$2,$3)`,
        [u.id, title, body || null]
      );
      n++;
    }
    await audit(req.user.id, 'admin.notify.all', 'notifications', null, { count: n }, req.ip);
    res.json({ ok: true, sent: n });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== سجل التدقيق =====
router.get('/audit', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const r = await pool.query(
      `SELECT a.id, a.action, a.entity, a.entity_id, a.details,
              a.ip, a.created_at,
              u.full_name AS actor_name
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.actor_id
        ORDER BY a.created_at DESC LIMIT $1`,
      [limit]
    );
    res.json({ logs: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;