// src/routes/payments.js
const express = require('express');
const { pool } = require('../config');
const { requireAuth, requireRole, audit } = require('../middleware');
const { creditMinutes } = require('../services');

const router = express.Router();

// ===== الطالب: إنشاء طلب شراء =====
router.post('/orders', requireAuth, async (req, res) => {
  try {
    const { package_id, method } = req.body || {};
    if (!package_id) return res.status(400).json({ error: 'invalid_input' });

    const p = await pool.query(
      `SELECT id, minutes, price_etb FROM packages WHERE id=$1 AND is_active=TRUE`,
      [package_id]
    );
    if (!p.rows[0]) return res.status(404).json({ error: 'package_not_found' });

    const r = await pool.query(
      `INSERT INTO payment_orders (user_id, package_id, amount_etb, method, status)
       VALUES ($1,$2,$3,$4,'pending')
       RETURNING id, amount_etb, status, created_at`,
      [req.user.id, package_id, p.rows[0].price_etb, method || null]
    );
    await audit(req.user.id, 'payment.order.create', 'payment_orders', r.rows[0].id, null, req.ip);
    res.status(201).json({
      order: r.rows[0],
      payment_info: {
        telebirr: '+251990161372',
        mpesa: '+251721009122',
      },
    });
  } catch (err) {
    console.error('[payments.order]', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== الطالب: طلباته =====
router.get('/orders/me', requireAuth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT o.id, o.amount_etb, o.method, o.status, o.created_at,
              p.name_ar AS pkg_ar, p.name_en AS pkg_en, p.minutes
         FROM payment_orders o
         LEFT JOIN packages p ON p.id = o.package_id
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC LIMIT 100`,
      [req.user.id]
    );
    res.json({ orders: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== الطالب: إرسال الإيصال (رابط/معرّف ملف مرفوع إلى Supabase) =====
router.post('/receipts', requireAuth, async (req, res) => {
  try {
    const { order_id, file_url, note } = req.body || {};
    if (!order_id || !file_url) return res.status(400).json({ error: 'invalid_input' });

    const o = await pool.query(
      `SELECT id FROM payment_orders
        WHERE id=$1 AND user_id=$2 AND status='pending'`,
      [order_id, req.user.id]
    );
    if (!o.rows[0]) return res.status(404).json({ error: 'order_not_found_or_not_pending' });

    const r = await pool.query(
      `INSERT INTO payment_receipts (order_id, file_url, note, status)
       VALUES ($1,$2,$3,'pending')
       RETURNING id, status, created_at`,
      [order_id, file_url, note || null]
    );
    await audit(req.user.id, 'payment.receipt.create', 'payment_receipts', r.rows[0].id, null, req.ip);
    res.status(201).json({ receipt: r.rows[0] });
  } catch (err) {
    console.error('[payments.receipt]', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== الأدمن: الإيصالات المعلقة =====
router.get('/admin/receipts/pending', requireAuth, requireRole('admin', 'teacher'), async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT pr.id, pr.file_url, pr.note, pr.status, pr.created_at,
              po.id AS order_id, po.amount_etb,
              u.id AS user_id, u.full_name, u.telegram_id,
              pk.name_ar AS pkg_ar, pk.name_en AS pkg_en, pk.minutes
         FROM payment_receipts pr
         JOIN payment_orders po ON po.id = pr.order_id
         JOIN users u ON u.id = po.user_id
         LEFT JOIN packages pk ON pk.id = po.package_id
        WHERE pr.status='pending'
        ORDER BY pr.created_at ASC LIMIT 200`
    );
    res.json({ receipts: r.rows });
  } catch (err) {
    console.error('[payments.pending]', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ===== الأدمن: قبول إيصال → إضافة دقائق =====
router.post('/admin/receipts/:id/approve', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const r = await client.query(
      `SELECT pr.id, pr.order_id, pr.status,
              po.user_id, po.package_id, po.status AS order_status,
              pk.minutes
         FROM payment_receipts pr
         JOIN payment_orders po ON po.id = pr.order_id
         LEFT JOIN packages pk ON pk.id = po.package_id
        WHERE pr.id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const row = r.rows[0];
    if (!row) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'not_found' });
    }
    if (row.status === 'approved') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'already_approved' });
    }

    await client.query(
      `UPDATE payment_receipts SET status='approved', reviewed_by=$1 WHERE id=$2`,
      [req.user.id, req.params.id]
    );
    await client.query(
      `UPDATE payment_orders SET status='paid' WHERE id=$1`,
      [row.order_id]
    );
    await client.query('COMMIT');

    if (row.minutes && row.minutes > 0) {
      await creditMinutes(row.user_id, row.minutes, {
        refType: 'payment_receipt',
        refId: req.params.id,
        note: 'شحن دقائق بعد قبول الإيصال',
      });
    }

    await audit(req.user.id, 'payment.receipt.approve', 'payment_receipts', req.params.id, null, req.ip);
    res.json({ ok: true, minutes_added: row.minutes || 0 });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('[payments.approve]', err.message);
    res.status(500).json({ error: 'server_error' });
  } finally {
    client.release();
  }
});

// ===== الأدمن: رفض إيصال =====
router.post('/admin/receipts/:id/reject', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE payment_receipts
         SET status='rejected', reviewed_by=$1
        WHERE id=$2 AND status='pending'
        RETURNING order_id`,
      [req.user.id, req.params.id]
    );
    if (!r.rowCount) return res.status(404).json({ error: 'not_found_or_done' });

    await pool.query(
      `UPDATE payment_orders SET status='rejected' WHERE id=$1`,
      [r.rows[0].order_id]
    );
    await audit(req.user.id, 'payment.receipt.reject', 'payment_receipts', req.params.id, null, req.ip);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;