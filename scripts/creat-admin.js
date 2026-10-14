require('dotenv').config();
const { pool, config, initDb } = require('../src/config');
const { hashPassword } = require('../src/utils');

async function main() {
  if (!config.adminEmail || !config.adminPassword) {
    console.error('❌ يجب ضبط ADMIN_EMAIL و ADMIN_PASSWORD في .env');
    process.exit(1);
  }
  if (config.adminPassword.length < 10) {
    console.error('❌ ADMIN_PASSWORD يجب أن يكون 10 أحرف على الأقل');
    process.exit(1);
  }

  await initDb();
  const hash = await hashPassword(config.adminPassword);

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [config.adminEmail]);

  if (existing.rows[0]) {
    await pool.query(
      `UPDATE users
         SET password_hash = $1,
             full_name = COALESCE($2, full_name),
             role = 'admin',
             is_active = TRUE,
             updated_at = NOW()
       WHERE id = $3`,
      [hash, config.adminFullName, existing.rows[0].id]
    );
    console.log('✅ تم تحديث حساب المدير:', config.adminEmail);
  } else {
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, language)
       VALUES ($1,$2,$3,'admin','ar')`,
      [config.adminEmail, hash, config.adminFullName]
    );
    console.log('✅ تم إنشاء حساب المدير:', config.adminEmail);
  }

  console.log('⚠️  الآن احذف ADMIN_PASSWORD من .env ثم أعد النشر.');
  await pool.end();
}

main().catch((err) => {
  console.error('[create-admin] فشل:', err.message);
  process.exit(1);
});