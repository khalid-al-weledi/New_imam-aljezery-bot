# 🕌 مقرأة الإمام الجزري للإقراء والإجازة بالسند

منصة تعليمية قرآنية: موقع + بوت تلغرام + لوحة تحكم.

**الشيخ المشرف:** المقرئ أبو زيد خالد أحمد الإثيوبي  
**التواصل:** khdahd241@gmail.com — @aljezer_241 — @meqraa_imamaljezery_bot  
**الهاتف:** Telebirr +251 99 016 1372 | M-Pesa +251 72 100 9122

## 🌐 اللغات
- العربية (ar)
- English (en)
- አማርኛ (am)

> المصطلحات الشرعية والقرآنية (إجازة، سند، تلقين، حفظ، تجويد، قراءات، حفص عن عاصم، شيخ) تُحفظ بلفظها العربي في كل اللغات، ولا تُترجم إلى معناها.

## 🏗️ التقنيات
- Node.js 20 + Express
- PostgreSQL (Supabase)
- Telegraf (بوت تلغرام داخل نفس العملية)
- JWT + Argon2id
- Render للاستضافة

## 🚀 خطوات التشغيل
1. أنشئ مشروع Supabase وانسخ `DATABASE_URL` من Settings → Database → Transaction pooler وأضف `?sslmode=require`.
2. أنشئ بوت من [@BotFather](https://t.me/BotFather) وخذ التوكن.
3. انسخ `.env.example` → `.env` وعبّئ القيم.
4. نفّذ:
   ```bash
   npm install
   npm start