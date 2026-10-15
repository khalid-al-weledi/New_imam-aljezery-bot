// src/routes/sessions.js
const express = require('express');
const { pool } = require('../config');
const { requireAuth, requireRole, audit } = require('../middleware');
const { debitMinutes } = require('../services');

const router = express.Router();

// ===== الطالب: جلساته القادمة =====
router.get('/me', requireAuth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT b.id, b.scheduled_at, b.status, b.notes,
              t.full_name AS teacher_name
         FROM bookings b
         LEFT JOIN users t ON t.id = b.teacher_id
        WHERE b.user_id = $1
        ORDER BY b.scheduled_at DESC
        LIMIT 100`,
      [req.user.id]
    );
    res.json({ sessions: r.rows });
  } catch (err) {
    console.error('[sessions.me]', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== الطالب: حجز جلسة =====
router.post('/book', requireAuth, async (req, res) => {
  try {
    const { scheduled_at, teacher_id, notes } = req.body || {};
    if (!scheduled_at) return res.status(400).json({ error: 'invalid_input' });

    const dt = new Date(scheduled_at);
    if (isNaN(dt.getTime())) return res.status(400).json({ error: 'invalid_date' });

    const r = await pool.query(
      `INSERT INTO bookings (user_id, teacher_id, scheduled_at, status, notes)
       VALUES ($1,$2,$3,'scheduled',$4)
       RETURNING id, scheduled_at, status`,
      [req.user.id, teacher_id || null, dt.toISOString(), notes || null]
    );
    await audit(req.user.id, 'session.book', 'bookings', r.rows[0].id, null, req.ip);
    res.status(201).json({ booking: r.rows[0] });
  } catch (err) {
    console.error('[sessions.book]', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== الطالب: إلغاء حجز =====
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE bookings SET status='cancelled'
        WHERE id=$1 AND user_id=$2 AND status='scheduled'
        RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!r.rowCount) return res.status(404).json({ error: 'not_found_or_locked' });
    await audit(req.user.id, 'session.cancel', 'bookings', req.params.id, null, req.ip);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== الأدمن: بدء جلسة قراءة (يخصم دقائق) =====
router.post('/admin/start', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { booking_id, user_id, minutes } = req.body || {};
    if (!user_id || !minutes) return res.status(400).json({ error: 'invalid_input' });
    const n = parseInt(minutes, 10);
    if (!Number.isFinite(n) || n <= 0) return res.status(400).json({ error: 'invalid_minutes' });

    // خصم الدقائق عبر خدمة المحفظة (ذرية)
    let txId;
    try {
      txId = await debitMinutes(user_id, n, {
        refType: 'reading_session',
        refId: booking_id || null,
        note: 'خصم دقائق جلسة قراءة',
      });
    } catch (e) {
      if (e.message === 'insufficient_balance') {
        return res.status(402).json({ error: 'insufficient_balance' });
      }
      throw e;
    }

    const r = await pool.query(
      `INSERT INTO reading_sessions
         (booking_id, user_id, teacher_id, started_at, minutes, notes)
       VALUES ($1,$2,$3,NOW(),$4,$5)
       RETURNING id, started_at, minutes`,
      [booking_id || null, user_id, req.user.id, n, `tx:${txId}`]
    );

    if (booking_id) {
      await pool.query(`UPDATE bookings SET status='in_progress' WHERE id=$1`, [booking_id]);
    }
    await audit(req.user.id, 'session.start', 'reading_sessions', r.rows[0].id, { minutes: n }, req.ip);
    res.status(201).json({ session: r.rows[0], tx: txId });
  } catch (err) {
    console.error('[sessions.start]', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== الأدمن: إغلاق جلسة =====
router.post('/admin/:id/end', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE reading_sessions SET ended_at=NOW()
        WHERE id=$1 AND ended_at IS NULL
        RETURNING id`,
      [req.params.id]
    );
    if (!r.rowCount) return res.status(404).json({ error: 'not_found' });
    await audit(req.user.id, 'session.end', 'reading_sessions', req.params.id, null, req.ip);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== الأدمن: كل الجلسات القادمة =====
router.get('/admin/upcoming', requireAuth, requireRole('admin', 'teacher'), async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT b.id, b.scheduled_at, b.status,
              u.full_name AS student_name, u.id AS student_id
         FROM bookings b
         JOIN users u ON u.id = b.user_id
        WHERE b.scheduled_at > NOW() AND b.status IN ('scheduled','in_progress')
        ORDER BY b.scheduled_at ASC LIMIT 200`
    );
    res.json({ sessions: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;