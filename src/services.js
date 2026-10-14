const { pool } = require('./config');
const { uuid } = require('./utils');

async function getOrCreateWalletInTx(client, userId) {
  const existing = await client.query(
    'SELECT 1 FROM wallet_accounts WHERE user_id = $1',
    [userId]
  );
  if (existing.rowCount) return;
  await client.query(
    `INSERT INTO wallet_accounts (user_id, balance_minutes, balance_etb)
     VALUES ($1, 0, 0)`,
    [userId]
  );
}

async function getOrCreateWallet(userId) {
  const existing = await pool.query(
    'SELECT * FROM wallet_accounts WHERE user_id = $1',
    [userId]
  );
  if (existing.rows[0]) return existing.rows[0];
  const created = await pool.query(
    `INSERT INTO wallet_accounts (user_id, balance_minutes, balance_etb)
     VALUES ($1, 0, 0) RETURNING *`,
    [userId]
  );
  return created.rows[0];
}

async function creditMinutes(userId, minutes, { refType, refId, note } = {}) {
  if (!Number.isFinite(minutes) || minutes <= 0) throw new Error('invalid_amount');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await getOrCreateWalletInTx(client, userId);
    await client.query(
      `UPDATE wallet_accounts
         SET balance_minutes = balance_minutes + $1, updated_at = NOW()
       WHERE user_id = $2`,
      [minutes, userId]
    );
    const tx = uuid();
    await client.query(
      `INSERT INTO wallet_ledger
         (user_id, amount, currency, direction, transaction_id, ref_type, ref_id, note)
       VALUES ($1,$2,'MINUTES','credit',$3,$4,$5,$6)`,
      [userId, minutes, tx, refType || null, refId || null, note || null]
    );
    await client.query('COMMIT');
    return tx;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function debitMinutes(userId, minutes, { refType, refId, note } = {}) {
  if (!Number.isFinite(minutes) || minutes <= 0) throw new Error('invalid_amount');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const wallet = await client.query(
      'SELECT balance_minutes FROM wallet_accounts WHERE user_id = $1 FOR UPDATE',
      [userId]
    );
    const balance = wallet.rows[0] ? Number(wallet.rows[0].balance_minutes) : 0;
    if (balance < minutes) {
      await client.query('ROLLBACK');
      throw new Error('insufficient_balance');
    }
    await client.query(
      `UPDATE wallet_accounts
         SET balance_minutes = balance_minutes - $1, updated_at = NOW()
       WHERE user_id = $2`,
      [minutes, userId]
    );
    const tx = uuid();
    await client.query(
      `INSERT INTO wallet_ledger
         (user_id, amount, currency, direction, transaction_id, ref_type, ref_id, note)
       VALUES ($1,$2,'MINUTES','debit',$3,$4,$5,$6)`,
      [userId, minutes, tx, refType || null, refId || null, note || null]
    );
    await client.query('COMMIT');
    return tx;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getOrCreateWallet, creditMinutes, debitMinutes };