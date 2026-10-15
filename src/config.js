require('dotenv').config();
const { Pool } = require('pg');

const RAW_DATABASE_URL = process.env.DATABASE_URL || '';
const DATABASE_URL = RAW_DATABASE_URL.replace(/[?&]sslmode=[^&]*/g, '');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
});

pool.on('error', (err) => {
  console.error('[pg] unexpected error:', err.message);
});

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  jwtExpiresIn: '7d',
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminFullName: process.env.ADMIN_FULL_NAME || 'Admin',
  // ===== سياسات المقرأة (قابلة للتعديل لاحقاً من الإدارة) =====
  minutePriceEtb: 5,
  bulkDiscountPercent: 2,
  bulkDiscountThreshold: 200,
  welcomeBonusMinutes: 30,
};

// ============================================================
// SCHEMA — كل الجداول + الحقول الجديدة
// ============================================================
const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT,
  password_hash TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  language TEXT NOT NULL DEFAULT 'ar',
  telegram_id BIGINT UNIQUE,
  telegram_username TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  name_am TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id INTEGER NOT NULL REFERENCES programs(id),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  minutes INTEGER NOT NULL,
  price_etb NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS wallet_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance_minutes INTEGER NOT NULL DEFAULT 0,
  balance_etb NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MINUTES',
  direction TEXT NOT NULL CHECK (direction IN ('credit','debit')),
  transaction_id UUID UNIQUE NOT NULL,
  ref_type TEXT,
  ref_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id INTEGER REFERENCES packages(id),
  amount_etb NUMERIC(10,2) NOT NULL,
  method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES payment_orders(id) ON DELETE CASCADE,
  file_url TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  serial TEXT UNIQUE,
  file_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ijazat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id INTEGER REFERENCES programs(id),
  teacher_name TEXT,
  sanad_text TEXT,
  serial TEXT UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  details JSONB,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT,
  url TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- ===== جدول طلبات التسجيل (الكامل) =====
CREATE TABLE IF NOT EXISTS registration_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  telegram_id BIGINT,
  telegram_username TEXT,
  full_name TEXT NOT NULL,
  gender TEXT,
  age INTEGER,
  country TEXT,
  region TEXT,
  city TEXT,
  phone TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  quran_level TEXT,
  has_read_mushaf BOOLEAN,
  memorized_amount TEXT,
  has_ijaza BOOLEAN,
  previous_school TEXT,
  previous_teacher TEXT,
  learning_duration TEXT,
  certificates TEXT,
  program_id INTEGER REFERENCES programs(id),
  preferred_days TEXT,
  preferred_period TEXT,
  notes TEXT,
  language TEXT DEFAULT 'ar',
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== توسيع جدول التسجيل للحالات القديمة (idempotent) =====
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS guardian_phone TEXT;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS quran_level TEXT;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS has_read_mushaf BOOLEAN;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS memorized_amount TEXT;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS has_ijaza BOOLEAN;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS previous_school TEXT;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS previous_teacher TEXT;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS learning_duration TEXT;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS certificates TEXT;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS preferred_days TEXT;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS preferred_period TEXT;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE registration_applications ADD COLUMN IF NOT EXISTS order_number TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reg_order_number ON registration_applications(order_number) WHERE order_number IS NOT NULL;

-- ===== ربط المدرس ببرامجه وطلابه =====
CREATE TABLE IF NOT EXISTS teacher_programs (
  id SERIAL PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(teacher_id, program_id)
);

CREATE TABLE IF NOT EXISTS teacher_students (
  id SERIAL PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id INTEGER REFERENCES programs(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(teacher_id, student_id, program_id)
);

-- ===== الفترات الدراسية =====
CREATE TABLE IF NOT EXISTS study_periods (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  name_am TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ===== المجموعات =====
CREATE TABLE IF NOT EXISTS study_groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  program_id INTEGER REFERENCES programs(id),
  period_id INTEGER REFERENCES study_periods(id),
  teacher_id UUID REFERENCES users(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== طلبات تغيير الفترة =====
CREATE TABLE IF NOT EXISTS period_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_period_id INTEGER REFERENCES study_periods(id),
  requested_period_id INTEGER NOT NULL REFERENCES study_periods(id),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== الاختبارات =====
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id INTEGER REFERENCES programs(id),
  teacher_id UUID REFERENCES users(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  result TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== الأسئلة الشائعة =====
CREATE TABLE IF NOT EXISTS faq_items (
  id SERIAL PRIMARY KEY,
  question_ar TEXT NOT NULL,
  answer_ar TEXT NOT NULL,
  question_en TEXT,
  answer_en TEXT,
  question_am TEXT,
  answer_am TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ===== وسائل الدفع (ديناميكية) =====
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  account_number TEXT,
  account_holder TEXT,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON wallet_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reg_status ON registration_applications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user ON reading_sessions(user_id, created_at DESC);
`;

// ============================================================
// SEED — البيانات الافتراضية
// ============================================================
const SEED_SQL = `
INSERT INTO programs (code, name_ar, name_en, name_am, description)
VALUES
  ('talqeen',      'التلقين',           'Talqeen',           'ተልቂን',        'تصحيح التلاوة والتلقين'),
  ('hifz',         'الحفظ',             'Hifz',              'ሒፍዝ',         'حفظ القرآن الكريم'),
  ('ijaza_hafs',   'الإجازة (حفص عن عاصم)', 'Ijazah (Hafs an Asim)', 'ኢጃዛ (ሐፍስ አን ዐሲም)', 'الإجازة بالسند برواية حفص عن عاصم'),
  ('qiraat_sabaa', 'القراءات السبع',    'Qiraat Sabah',      'ቂራኣት ሰብዐ',   'دراسة القراءات السبع')
ON CONFLICT (code) DO NOTHING;

INSERT INTO packages (name_ar, name_en, minutes, price_etb)
SELECT 'حزمة 60 دقيقة',  '60 Minutes Pack',  60,  300
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE minutes = 60);

INSERT INTO packages (name_ar, name_en, minutes, price_etb)
SELECT 'حزمة 120 دقيقة', '120 Minutes Pack', 120, 588
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE minutes = 120);

INSERT INTO packages (name_ar, name_en, minutes, price_etb)
SELECT 'حزمة 240 دقيقة', '240 Minutes Pack', 240, 1176
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE minutes = 240);

INSERT INTO study_periods (code, name_ar, name_en, name_am, start_time, end_time)
VALUES
  ('morning',   'الفترة الصباحية',  'Morning',  'ጥዋት',  '09:00', '12:30'),
  ('afternoon', 'الفترة المسائية',  'Afternoon','ከሰዓት', '14:00', '15:30'),
  ('evening',   'الفترة الليلية',   'Evening',  'ማታ',   '21:00', '23:00')
ON CONFLICT (code) DO NOTHING;

INSERT INTO payment_methods (code, name_ar, name_en, account_number, account_holder, sort_order)
VALUES
  ('cbe',      'بنك التجاري الإثيوبي (CBE)', 'Commercial Bank of Ethiopia', '1000694735391', 'خالد أحمد مصطفى', 1),
  ('abyssinia','بنك أبيسينيا',              'Bank of Abyssinia',           '226626646',     'خالد أحمد مصطفى', 2),
  ('telebirr', 'تيليبر',                     'Telebirr',                    '0990161372',    'خالد أحمد مصطفى', 3),
  ('mpesa',    'إم-بيسا',                    'M-Pesa',                      '0721009122',    'خالد أحمد مصطفى', 4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO system_settings (key, value) VALUES
  ('site_name', '{"ar":"مقرأة الإمام الجزري","en":"Imam Al-Jazari Maqraah","am":"የኢማም አል-ጀዛሪ መቅራአ"}'::jsonb),
  ('contact',   '{"email":"khdahd241@gmail.com","telegram":"@aljezer_241","telegram_bot":"@meqraa_imamaljezery_bot"}'::jsonb),
  ('pricing',   '{"minute_price_etb":5,"bulk_discount_percent":2,"bulk_threshold_minutes":200,"welcome_bonus_minutes":30}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO faq_items (question_ar, answer_ar, question_en, answer_en, question_am, answer_am, sort_order)
VALUES
  ('ما هي المقرأة؟',
   'مقرأة الإمام الجزري للإقراء والإجازة بالسند، منصة قرآنية لتعليم التلاوة والحفظ والقراءات والإجازة بالسند.',
   'What is the Maqraah?',
   'Imam Al-Jazari Maqraah for Ijazah with Sanad, a Quranic platform for Tilawah, Hifz, Qiraat and Ijazah with Sanad.',
   'መቅራአው ምንድን ነው?',
   'የኢማም አል-ጀዛሪ መቅራአ — ለተጅዊድ፣ ሒፍዝ፣ ቂራኣት እና ኢጃዛ በሰነድ።',
   1),
  ('كيف أسجل؟',
   'من القائمة الرئيسية اضغط «التسجيل في المقرأة»، وأجب على الأسئلة خطوة بخطوة.',
   'How do I register?',
   'From the main menu, tap "Registration" and answer step by step.',
   'እንዴት እመዘገባለሁ?',
   'ከዋና ማውጫ «ምዝገባ» ይጫኑ እና ደረጃ በደረጃ ይመልሱ።',
   2)
ON CONFLICT DO NOTHING;
`;

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(SCHEMA_SQL);
    await client.query(SEED_SQL);
    await client.query('COMMIT');
    console.log('[db] schema + seed OK');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[db] init failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, config, initDb };