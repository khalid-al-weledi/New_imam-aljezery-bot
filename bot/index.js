// bot/index.js — بوت مقرأة الإمام الجزري (طالب + أدمن)، 3 لغات
const { Telegraf, Markup } = require('telegraf');
const { pool, config } = require('../src/config');
const { getOrCreateWallet, creditMinutes } = require('../src/services');
const { t, fmt, programName, pkgName } = require('./i18n');

// ================== الجلسات في الذاكرة ==================
const sessions = new Map();
function getS(ctx) {
  const k = String(ctx.from?.id || '');
  if (!k) return { step: null, lang: 'ar', data: {}, loaded: false, isAdmin: false };
  if (!sessions.has(k)) {
    sessions.set(k, { step: null, lang: 'ar', data: {}, loaded: false, isAdmin: false });
  }
  return sessions.get(k);
}

// ================== أدوات قاعدة البيانات ==================
async function findUser(telegramId) {
  const r = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
  return r.rows[0] || null;
}

async function findUserByStudentId(studentNo) {
  // studentNo = أول 8 حروف من UUID (نستخدمها كمعرّف مقروء)
  const r = await pool.query(
    `SELECT * FROM users
      WHERE UPPER(SUBSTRING(id::text, 1, 8)) = UPPER($1)
      LIMIT 1`,
    [studentNo]
  );
  return r.rows[0] || null;
}

async function findUserFlexible(input) {
  // يقبل: UUID كامل، أول 8 حروف، أو Telegram ID رقمي
  if (/^\d+$/.test(input)) {
    return findUser(parseInt(input, 10));
  }
  const u = await findUserByStudentId(input);
  if (u) return u;
  const r = await pool.query('SELECT * FROM users WHERE id::text = $1 LIMIT 1', [input]);
  return r.rows[0] || null;
}

async function getPrograms() {
  const r = await pool.query(
    'SELECT id, code, name_ar, name_en, name_am FROM programs WHERE is_active = TRUE ORDER BY id'
  );
  return r.rows;
}

async function getPackages() {
  const r = await pool.query(
    'SELECT id, name_ar, name_en, minutes, price_etb FROM packages WHERE is_active = TRUE ORDER BY minutes'
  );
  return r.rows;
}

async function getAllAdmins() {
  const r = await pool.query(
    `SELECT id, telegram_id FROM users
      WHERE role IN ('admin','teacher') AND telegram_id IS NOT NULL`
  );
  return r.rows;
}

// ================== لوحات المفاتيح ==================
function studentMenu(lang, isAdmin) {
  const rows = [
    [t(lang, 'btn_register'), t(lang, 'btn_account')],
    [t(lang, 'btn_buy'), t(lang, 'btn_send_receipt')],
    [t(lang, 'btn_sessions'), t(lang, 'btn_library')],
    [t(lang, 'btn_support'), t(lang, 'btn_lang')],
  ];
  if (isAdmin) rows.push([t(lang, 'btn_admin')]);
  return Markup.keyboard(rows).resize().persistent();
}

function adminMenu(lang) {
  return Markup.keyboard([
    [t(lang, 'admin_pending'), t(lang, 'admin_students')],
    [t(lang, 'admin_add_minutes'), t(lang, 'admin_ijaza')],
    [t(lang, 'admin_broadcast'), t(lang, 'admin_stats')],
    [t(lang, 'btn_back')],
  ])
    .resize()
    .persistent();
}

function cancelKb(lang) {
  return Markup.keyboard([[t(lang, 'btn_cancel')]]).resize();
}

function backKb(lang) {
  return Markup.keyboard([[t(lang, 'btn_back')]]).resize();
}

function langKb() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🇸🇦 العربية', 'lang:ar'),
      Markup.button.callback('🇬🇧 English', 'lang:en'),
      Markup.button.callback('🇪🇹 አማርኛ', 'lang:am'),
    ],
  ]);
}

// ================== إشعار جميع الأدمن ==================
async function notifyAdmins(text, extra) {
  const admins = await getAllAdmins();
  for (const a of admins) {
    try {
      await bot.telegram.sendMessage(a.telegram_id, text, extra || {});
    } catch (_) {}
  }
}

// ================== البوت ==================
let bot;

async function startBot() {
  bot = new Telegraf(config.botToken);

  // تحميل اللغة والصلاحية عند أول تفاعل
  bot.use(async (ctx, next) => {
    const s = getS(ctx);
    if (!s.loaded && ctx.from) {
      try {
        const u = await findUser(ctx.from.id);
        if (u) {
          s.lang = u.language || s.lang || 'ar';
          s.isAdmin = u.role === 'admin' || u.role === 'teacher';
        }
      } catch (_) {}
      s.loaded = true;
    }
    return next();
  });

  // ============================================================
  // أوامر عامة
  // ============================================================
  bot.start(async (ctx) => {
    const s = getS(ctx);
    const u = await findUser(ctx.from.id);
    if (u) {
      s.lang = u.language || s.lang || 'ar';
      s.isAdmin = u.role === 'admin' || u.role === 'teacher';
      await ctx.reply(
        `${t(s.lang, 'brand')}\n${t(s.lang, 'supervisor')}\n\n${t(s.lang, 'menu')}`,
        { parse_mode: 'Markdown', ...studentMenu(s.lang, s.isAdmin) }
      );
      return;
    }
    await ctx.reply(`${t('ar', 'brand')}\n${t('ar', 'supervisor')}\n\n${t('ar', 'pick_lang')}`, {
      parse_mode: 'Markdown',
      ...langKb(),
    });
  });

  bot.command('lang', async (ctx) => {
    const s = getS(ctx);
    await ctx.reply(t(s.lang, 'pick_lang'), langKb());
  });

  bot.command('myid', async (ctx) => {
    const s = getS(ctx);
    await ctx.reply(`${t(s.lang, 'myid')} \`${ctx.from.id}\``, { parse_mode: 'Markdown' });
  });

  bot.command('cancel', async (ctx) => {
    const s = getS(ctx);
    s.step = null;
    s.data = {};
    await ctx.reply(t(s.lang, 'reg_cancelled'), studentMenu(s.lang, s.isAdmin));
  });

  bot.command('admin', async (ctx) => {
    const s = getS(ctx);
    if (!s.isAdmin) return ctx.reply(t(s.lang, 'admin_only'));
    await ctx.reply(t(s.lang, 'admin_title'), {
      parse_mode: 'Markdown',
      ...adminMenu(s.lang),
    });
  });

  // ============================================================
  // اختيار اللغة
  // ============================================================
  bot.action(/^lang:(ar|en|am)$/, async (ctx) => {
    const lang = ctx.match[1];
    const s = getS(ctx);
    s.lang = lang;
    try { await ctx.answerCbQuery(); } catch (_) {}
    try { await ctx.deleteMessage(); } catch (_) {}
    try {
      await pool.query(
        'UPDATE users SET language = $1, updated_at = NOW() WHERE telegram_id = $2',
        [lang, ctx.from.id]
      );
    } catch (_) {}
    await ctx.reply(t(lang, 'lang_set'), studentMenu(lang, s.isAdmin));
  });

  // ============================================================
  // تسجيل: اختيار البرنامج
  // ============================================================
  bot.action(/^prog:(\d+)$/, async (ctx) => {
    const programId = parseInt(ctx.match[1], 10);
    const s = getS(ctx);
    const lang = s.lang;
    try { await ctx.answerCbQuery(); } catch (_) {}
    try { await ctx.deleteMessage(); } catch (_) {}
    try {
      const u = await findUser(ctx.from.id);
      if (u) {
        s.step = null; s.data = {};
        return ctx.reply(t(lang, 'reg_exists'), studentMenu(lang, s.isAdmin));
      }
      const { full_name, phone } = s.data || {};
      if (!full_name || !phone) {
        s.step = null; s.data = {};
        return ctx.reply(t(lang, 'unknown'), studentMenu(lang, s.isAdmin));
      }
      const ins = await pool.query(
        `INSERT INTO users (full_name, phone, role, language, telegram_id, telegram_username)
         VALUES ($1,$2,'student',$3,$4,$5) RETURNING id`,
        [full_name, phone, lang, ctx.from.id, ctx.from.username || null]
      );
      const userId = ins.rows[0].id;
      await pool.query(
        `INSERT INTO enrollments (user_id, program_id, status) VALUES ($1,$2,'active')`,
        [userId, programId]
      );
      await getOrCreateWallet(userId);
      await pool.query(
        `INSERT INTO registration_applications
           (user_id, telegram_id, full_name, phone, program_id, language, status)
         VALUES ($1,$2,$3,$4,$5,$6,'approved')`,
        [userId, ctx.from.id, full_name, phone, programId, lang]
      );
      s.step = null; s.data = {};
      await ctx.reply(t(lang, 'reg_done'), studentMenu(lang, s.isAdmin));
      await notifyAdmins(`🆕 تسجيل جديد:\n${full_name}\n📞 ${phone}`);
    } catch (err) {
      console.error('[reg]', err.message);
      await ctx.reply(t(lang, 'error'), studentMenu(lang, s.isAdmin));
    }
  });

  bot.action('cancel', async (ctx) => {
    const s = getS(ctx);
    try { await ctx.answerCbQuery(); } catch (_) {}
    try { await ctx.deleteMessage(); } catch (_) {}
    s.step = null; s.data = {};
    await ctx.reply(t(s.lang, 'reg_cancelled'), studentMenu(s.lang, s.isAdmin));
  });

  // ============================================================
  // شراء: اختيار حزمة
  // ============================================================
  bot.action(/^pkg:(\d+)$/, async (ctx) => {
    const pkgId = parseInt(ctx.match[1], 10);
    const s = getS(ctx);
    const lang = s.lang;
    try { await ctx.answerCbQuery(); } catch (_) {}
    try { await ctx.deleteMessage(); } catch (_) {}
    try {
      const u = await findUser(ctx.from.id);
      if (!u) {
        return ctx.reply(t(lang, 'acc_not_registered'), studentMenu(lang, s.isAdmin));
      }
      const p = await pool.query('SELECT * FROM packages WHERE id = $1', [pkgId]);
      if (!p.rows[0]) return ctx.reply(t(lang, 'error'), studentMenu(lang, s.isAdmin));
      const pkg = p.rows[0];
      const order = await pool.query(
        `INSERT INTO payment_orders (user_id, package_id, amount_etb, status)
         VALUES ($1,$2,$3,'pending') RETURNING id`,
        [u.id, pkgId, pkg.price_etb]
      );
      s.data.pendingOrderId = order.rows[0].id;
      await ctx.reply(
        `${t(lang, 'buy_order_created')}\n\n${t(lang, 'buy_pay_info')}`,
        studentMenu(lang, s.isAdmin)
      );
    } catch (err) {
      console.error('[buy]', err.message);
      await ctx.reply(t(lang, 'error'), studentMenu(lang, s.isAdmin));
    }
  });

  // ============================================================
  // أدمن: قبول/رفض إيصال
  // ============================================================
  bot.action(/^rcpt:(view|approve|reject):([0-9a-f-]+)$/i, async (ctx) => {
    const action = ctx.match[1];
    const receiptId = ctx.match[2];
    const s = getS(ctx);
    const lang = s.lang;
    if (!s.isAdmin) {
      try { await ctx.answerCbQuery(t(lang, 'admin_only')); } catch (_) {}
      return;
    }

    try {
      const r = await pool.query(
        `SELECT pr.id, pr.order_id, pr.file_url, pr.status,
                po.amount_etb, po.package_id,
                u.id AS user_id, u.full_name, u.telegram_id, u.language AS user_lang,
                pk.minutes, pk.name_ar AS pkg_ar, pk.name_en AS pkg_en
           FROM payment_receipts pr
           JOIN payment_orders po ON po.id = pr.order_id
           JOIN users u ON u.id = po.user_id
           LEFT JOIN packages pk ON pk.id = po.package_id
          WHERE pr.id = $1`,
        [receiptId]
      );
      const row = r.rows[0];
      if (!row) {
        try { await ctx.answerCbQuery('not_found'); } catch (_) {}
        return;
      }

      if (action === 'view') {
        try { await ctx.answerCbQuery(); } catch (_) {}
        const info = fmt(t(lang, 'order_line'), {
          order: receiptId.slice(0, 8),
          name: row.full_name || '—',
          pkg: pkgName({ name_ar: row.pkg_ar, name_en: row.pkg_en }, lang),
          etb: row.amount_etb,
        });
        const kb = Markup.inlineKeyboard([
          [
            Markup.button.callback(t(lang, 'admin_approve'), `rcpt:approve:${receiptId}`),
            Markup.button.callback(t(lang, 'admin_reject'), `rcpt:reject:${receiptId}`),
          ],
        ]);
        if (row.file_url) {
          try {
            await ctx.replyWithPhoto(row.file_url, { caption: info, ...kb });
          } catch {
            await ctx.reply(`${info}\n\n📎 ${row.file_url}`, kb);
          }
        } else {
          await ctx.reply(info, kb);
        }
        return;
      }

      if (action === 'approve') {
        if (row.status === 'approved') {
          try { await ctx.answerCbQuery('already_approved'); } catch (_) {}
          return;
        }
        const minutes = row.minutes || 0;
        if (minutes > 0) {
          await creditMinutes(row.user_id, minutes, {
            refType: 'payment_receipt',
            refId: receiptId,
            note: 'شحن دقائق بعد قبول الإيصال',
          });
        }
        await pool.query(
          `UPDATE payment_receipts SET status='approved', reviewed_by=$1 WHERE id=$2`,
          [ctx.from.id ? null : null, receiptId]
        );
        await pool.query(`UPDATE payment_orders SET status='paid' WHERE id=$1`, [row.order_id]);
        try { await ctx.answerCbQuery('✅'); } catch (_) {}
        try { await ctx.editMessageCaption(t(lang, 'admin_receipt_approved')); } catch (_) {
          try { await ctx.editMessageText(t(lang, 'admin_receipt_approved')); } catch (_) {}
        }
        if (row.telegram_id) {
          const ulang = row.user_lang || 'ar';
          try {
            await bot.telegram.sendMessage(
              row.telegram_id,
              `✅ +${minutes} ${t(ulang, 'minutes')}`
            );
          } catch (_) {}
        }
        return;
      }

      if (action === 'reject') {
        await pool.query(
          `UPDATE payment_receipts SET status='rejected', reviewed_by=$1 WHERE id=$2`,
          [null, receiptId]
        );
        await pool.query(`UPDATE payment_orders SET status='rejected' WHERE id=$1`, [row.order_id]);
        try { await ctx.answerCbQuery('❌'); } catch (_) {}
        try { await ctx.editMessageCaption(t(lang, 'admin_receipt_rejected')); } catch (_) {
          try { await ctx.editMessageText(t(lang, 'admin_receipt_rejected')); } catch (_) {}
        }
        if (row.telegram_id) {
          const ulang = row.user_lang || 'ar';
          try {
            await bot.telegram.sendMessage(row.telegram_id, t(ulang, 'admin_receipt_rejected'));
          } catch (_) {}
        }
        return;
      }
    } catch (err) {
      console.error('[rcpt]', err.message);
      try { await ctx.answerCbQuery('error'); } catch (_) {}
    }
  });

  // ============================================================
  // استقبال الصور/المستندات (إيصال أو رسالة دعم)
  // ============================================================
  bot.on(['photo', 'document'], async (ctx) => {
    const s = getS(ctx);
    const lang = s.lang;
    try {
      const u = await findUser(ctx.from.id);
      if (!u) {
        return ctx.reply(t(lang, 'acc_not_registered'), studentMenu(lang, s.isAdmin));
      }

      let fileId = null;
      if (ctx.message.photo && ctx.message.photo.length) {
        fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      } else if (ctx.message.document) {
        fileId = ctx.message.document.file_id;
      }
      if (!fileId) return;

      // آخر طلب معلق
      const order = await pool.query(
        `SELECT id FROM payment_orders
          WHERE user_id = $1 AND status = 'pending'
          ORDER BY created_at DESC LIMIT 1`,
        [u.id]
      );
      if (!order.rows[0]) {
        return ctx.reply(t(lang, 'no_pending_order'), studentMenu(lang, s.isAdmin));
      }
      const orderId = order.rows[0].id;

      const ins = await pool.query(
        `INSERT INTO payment_receipts (order_id, file_url, status)
         VALUES ($1,$2,'pending') RETURNING id`,
        [orderId, fileId]
      );
      const receiptId = ins.rows[0].id;

      await ctx.reply(t(lang, 'receipt_received'), studentMenu(lang, s.isAdmin));

      // إشعار الأدمن
      const admins = await getAllAdmins();
      const pkg = await pool.query(
        `SELECT pk.name_ar, pk.name_en, pk.minutes, po.amount_etb
           FROM payment_orders po
           LEFT JOIN packages pk ON pk.id = po.package_id
          WHERE po.id = $1`,
        [orderId]
      );
      const info = fmt(t('ar', 'order_line'), {
        order: String(receiptId).slice(0, 8),
        name: u.full_name || '—',
        pkg: (pkg.rows[0] && (pkg.rows[0].name_ar || pkg.rows[0].name_en)) || '—',
        etb: (pkg.rows[0] && pkg.rows[0].amount_etb) || '—',
      });
      const kb = Markup.inlineKeyboard([
        [
          Markup.button.callback(t('ar', 'admin_approve'), `rcpt:approve:${receiptId}`),
          Markup.button.callback(t('ar', 'admin_reject'), `rcpt:reject:${receiptId}`),
        ],
      ]);
      for (const a of admins) {
        try {
          await bot.telegram.sendPhoto(a.telegram_id, fileId, { caption: info, ...kb });
        } catch (_) {}
      }
    } catch (err) {
      console.error('[receipt]', err.message);
      await ctx.reply(t(lang, 'error'), studentMenu(lang, s.isAdmin));
    }
  });

  // ============================================================
  // الرسائل النصية (طالب + أدمن)
  // ============================================================
  bot.on('text', async (ctx) => {
    const s = getS(ctx);
    const lang = s.lang;
    const text = (ctx.message.text || '').trim();

    // إلغاء عالمي
    if (text === t(lang, 'btn_cancel')) {
      s.step = null; s.data = {};
      return ctx.reply(t(lang, 'reg_cancelled'), studentMenu(lang, s.isAdmin));
    }

    // رجوع
    if (text === t(lang, 'btn_back')) {
      s.step = null; s.data = {};
      return ctx.reply(t(lang, 'back_to_menu'), studentMenu(lang, s.isAdmin));
    }

    // =========== خطوات التسجيل ===========
    if (s.step === 'reg_name') {
      s.data.full_name = text;
      s.step = 'reg_phone';
      return ctx.reply(t(lang, 'reg_ask_phone'), cancelKb(lang));
    }
    if (s.step === 'reg_phone') {
      s.data.phone = text;
      s.step = 'reg_program';
      const programs = await getPrograms();
      const rows = programs.map((p) => [
        Markup.button.callback(programName(p, lang), `prog:${p.id}`),
      ]);
      rows.push([Markup.button.callback(t(lang, 'btn_cancel'), 'cancel')]);
      return ctx.reply(t(lang, 'reg_ask_program'), Markup.inlineKeyboard(rows));
    }

    // =========== خطوات الأدمن ===========
    if (s.isAdmin && s.step) {
      if (s.step === 'adm_add_min_id') {
        const target = await findUserFlexible(text);
        if (!target) {
          s.step = null;
          return ctx.reply(t(lang, 'admin_student_not_found'), adminMenu(lang));
        }
        s.data.targetUserId = target.id;
        s.data.targetName = target.full_name;
        s.step = 'adm_add_min_amount';
        return ctx.reply(
          `${t(lang, 'admin_student_found')}: ${target.full_name}\n\n${t(lang, 'admin_ask_minutes')}`,
          backKb(lang)
        );
      }
      if (s.step === 'adm_add_min_amount') {
        const n = parseInt(text, 10);
        if (!Number.isFinite(n) || n <= 0) return ctx.reply(t(lang, 'error'));
        s.data.minutes = n;
        s.step = 'adm_add_min_reason';
        return ctx.reply(t(lang, 'admin_ask_reason'), backKb(lang));
      }
      if (s.step === 'adm_add_min_reason') {
        const reason = text === '-' ? null : text;
        try {
          await creditMinutes(s.data.targetUserId, s.data.minutes, {
            refType: 'admin_manual',
            refId: String(ctx.from.id),
            note: reason,
          });
          await ctx.reply(t(lang, 'admin_minutes_added'), adminMenu(lang));
          const u = await pool.query('SELECT telegram_id, language FROM users WHERE id=$1', [
            s.data.targetUserId,
          ]);
          if (u.rows[0]?.telegram_id) {
            const ul = u.rows[0].language || 'ar';
            try {
              await bot.telegram.sendMessage(
                u.rows[0].telegram_id,
                `✅ +${s.data.minutes} ${t(ul, 'minutes')}`
              );
            } catch (_) {}
          }
        } catch (e) {
          console.error('[admin.add]', e.message);
          await ctx.reply(t(lang, 'error'), adminMenu(lang));
        }
        s.step = null; s.data = {};
        return;
      }
      if (s.step === 'adm_broadcast') {
        s.step = null;
        try {
          const users = await pool.query(
            'SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL'
          );
          let n = 0;
          for (const u of users.rows) {
            try {
              await bot.telegram.sendMessage(u.telegram_id, text);
              n++;
            } catch (_) {}
          }
          return ctx.reply(fmt(t(lang, 'admin_broadcast_done'), { n }), adminMenu(lang));
        } catch (e) {
          return ctx.reply(t(lang, 'error'), adminMenu(lang));
        }
      }
      if (s.step === 'adm_ijaza_student') {
        const target = await findUserFlexible(text);
        if (!target) {
          s.step = null;
          return ctx.reply(t(lang, 'admin_student_not_found'), adminMenu(lang));
        }
        s.data.ijazaUserId = target.id;
        s.step = 'adm_ijaza_teacher';
        return ctx.reply(t(lang, 'ijaza_ask_teacher'), backKb(lang));
      }
      if (s.step === 'adm_ijaza_teacher') {
        s.data.ijazaTeacher = text;
        s.step = 'adm_ijaza_sanad';
        return ctx.reply(t(lang, 'ijaza_ask_sanad'), backKb(lang));
      }
      if (s.step === 'adm_ijaza_sanad') {
        try {
          const serial = 'IJZ-' + Date.now().toString(36).toUpperCase();
          await pool.query(
            `INSERT INTO ijazat (user_id, teacher_name, sanad_text, serial)
             VALUES ($1,$2,$3,$4)`,
            [s.data.ijazaUserId, s.data.ijazaTeacher, text, serial]
          );
          await ctx.reply(`${t(lang, 'ijaza_done')} (${serial})`, adminMenu(lang));
          const u = await pool.query('SELECT telegram_id, language FROM users WHERE id=$1', [
            s.data.ijazaUserId,
          ]);
          if (u.rows[0]?.telegram_id) {
            const ul = u.rows[0].language || 'ar';
            try {
              await bot.telegram.sendMessage(
                u.rows[0].telegram_id,
                `🎓 Ijazah: ${serial}\n${t(ul, 'ijaza_done')}`
              );
            } catch (_) {}
          }
        } catch (e) {
          console.error('[admin.ijaza]', e.message);
          await ctx.reply(t(lang, 'error'), adminMenu(lang));
        }
        s.step = null; s.data = {};
        return;
      }
    }

    // =========== رسالة دعم أثناء خطوة support ===========
    if (s.step === 'support') {
      s.step = null;
      try {
        const u = await findUser(ctx.from.id);
        if (u) {
          const t1 = await pool.query(
            `INSERT INTO support_tickets (user_id, subject, status)
             VALUES ($1,'bot_message','open') RETURNING id`,
            [u.id]
          );
          await pool.query(
            `INSERT INTO support_messages (ticket_id, sender_id, body)
             VALUES ($1,$2,$3)`,
            [t1.rows[0].id, u.id, text]
          );
        }
        await ctx.reply(t(lang, 'support_sent'), studentMenu(lang, s.isAdmin));
        await notifyAdmins(`🆘 Support:\n${u?.full_name || ''}\n${text}`);
      } catch (e) {
        await ctx.reply(t(lang, 'error'), studentMenu(lang, s.isAdmin));
      }
      return;
    }

    // =========== زر لوحة الأدمن ===========
    if (text === t(lang, 'btn_admin') || text === t(lang, 'admin_menu')) {
      if (!s.isAdmin) return ctx.reply(t(lang, 'admin_only'));
      return ctx.reply(t(lang, 'admin_title'), {
        parse_mode: 'Markdown',
        ...adminMenu(lang),
      });
    }

    // =========== أزرار الأدمن ===========
    if (s.isAdmin && text === t(lang, 'admin_pending')) {
      const r = await pool.query(
        `SELECT pr.id, pr.status, po.amount_etb,
                u.full_name,
                pk.name_ar AS pkg_ar, pk.name_en AS pkg_en
           FROM payment_receipts pr
           JOIN payment_orders po ON po.id = pr.order_id
           JOIN users u ON u.id = po.user_id
           LEFT JOIN packages pk ON pk.id = po.package_id
          WHERE pr.status = 'pending'
          ORDER BY pr.created_at DESC LIMIT 20`
      );
      if (!r.rows.length) {
        return ctx.reply(t(lang, 'admin_no_pending'), adminMenu(lang));
      }
      for (const row of r.rows) {
        const info = fmt(t(lang, 'order_line'), {
          order: String(row.id).slice(0, 8),
          name: row.full_name || '—',
          pkg: pkgName({ name_ar: row.pkg_ar, name_en: row.pkg_en }, lang),
          etb: row.amount_etb,
        });
        const kb = Markup.inlineKeyboard([
          [
            Markup.button.callback(t(lang, 'admin_approve'), `rcpt:approve:${row.id}`),
            Markup.button.callback(t(lang, 'admin_reject'), `rcpt:reject:${row.id}`),
          ],
        ]);
        await ctx.reply(info, kb);
      }
      return;
    }

    if (s.isAdmin && text === t(lang, 'admin_students')) {
      const r = await pool.query(
        `SELECT id, full_name, phone, language, created_at
           FROM users WHERE role='student'
           ORDER BY created_at DESC LIMIT 20`
      );
      if (!r.rows.length) return ctx.reply('—', adminMenu(lang));
      const lines = r.rows.map(
        (u, i) =>
          `${i + 1}. ${u.full_name || '—'} | ${u.phone || '—'} | ${
            String(u.id).slice(0, 8).toUpperCase()
          }`
      );
      return ctx.reply(`👥 Students (${r.rows.length}):\n\n${lines.join('\n')}`, adminMenu(lang));
    }

    if (s.isAdmin && text === t(lang, 'admin_add_minutes')) {
      s.step = 'adm_add_min_id';
      s.data = {};
      return ctx.reply(t(lang, 'admin_ask_student_id'), cancelKb(lang));
    }

    if (s.isAdmin && text === t(lang, 'admin_broadcast')) {
      s.step = 'adm_broadcast';
      return ctx.reply(t(lang, 'admin_broadcast_ask'), cancelKb(lang));
    }

    if (s.isAdmin && text === t(lang, 'admin_ijaza')) {
      s.step = 'adm_ijaza_student';
      s.data = {};
      return ctx.reply(t(lang, 'ijaza_ask_student'), cancelKb(lang));
    }

    if (s.isAdmin && text === t(lang, 'admin_stats')) {
      const [st, rc, se, ij] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS n FROM users WHERE role='student'`),
        pool.query(`SELECT COUNT(*)::int AS n FROM payment_receipts WHERE status='pending'`),
        pool.query(`SELECT COUNT(*)::int AS n FROM bookings WHERE scheduled_at > NOW()`),
        pool.query(`SELECT COUNT(*)::int AS n FROM ijazat`),
      ]);
      return ctx.reply(
        fmt(t(lang, 'admin_stats_txt'), {
          students: st.rows[0].n,
          receipts: rc.rows[0].n,
          sessions: se.rows[0].n,
          ijazat: ij.rows[0].n,
        }),
        { parse_mode: 'Markdown', ...adminMenu(lang) }
      );
    }

    // =========== أزرار الطالب ===========
    if (text === t(lang, 'btn_register')) {
      const u = await findUser(ctx.from.id);
      if (u) return ctx.reply(t(lang, 'reg_exists'), studentMenu(lang, s.isAdmin));
      s.step = 'reg_name'; s.data = {};
      return ctx.reply(t(lang, 'reg_ask_name'), cancelKb(lang));
    }

    if (text === t(lang, 'btn_account')) {
      const u = await findUser(ctx.from.id);
      if (!u) return ctx.reply(t(lang, 'acc_not_registered'), studentMenu(lang, s.isAdmin));
      const r = await pool.query(
        `SELECT u.full_name, w.balance_minutes,
                p.name_ar, p.name_en, p.name_am
           FROM users u
           LEFT JOIN wallet_accounts w ON w.user_id = u.id
           LEFT JOIN enrollments e ON e.user_id = u.id AND e.status='active'
           LEFT JOIN programs p ON p.id = e.program_id
          WHERE u.id = $1 LIMIT 1`,
        [u.id]
      );
      const row = r.rows[0] || {};
      const prog = row.name_ar
        ? programName(
            { name_ar: row.name_ar, name_en: row.name_en, name_am: row.name_am },
            lang
          )
        : '—';
      const bal = row.balance_minutes ?? 0;
      await ctx.reply(
        `${t(lang, 'acc_title')}\n\n` +
          `• ${t(lang, 'acc_name')}: ${row.full_name || u.full_name || '—'}\n` +
          `• ${t(lang, 'acc_id')}: ${String(u.id).slice(0, 8).toUpperCase()}\n` +
          `• ${t(lang, 'acc_program')}: ${prog}\n` +
          `• ${t(lang, 'acc_balance')}: ${bal}`,
        { parse_mode: 'Markdown', ...studentMenu(lang, s.isAdmin) }
      );
      return;
    }

    if (text === t(lang, 'btn_buy')) {
      const u = await findUser(ctx.from.id);
      if (!u) return ctx.reply(t(lang, 'acc_not_registered'), studentMenu(lang, s.isAdmin));
      const pkgs = await getPackages();
      if (!pkgs.length) return ctx.reply(t(lang, 'error'), studentMenu(lang, s.isAdmin));
      const rows = pkgs.map((p) => [
        Markup.button.callback(
          `${pkgName(p, lang)} — ${p.minutes} ${t(lang, 'minutes')} — ${p.price_etb} ${t(lang, 'etb')}`,
          `pkg:${p.id}`
        ),
      ]);
      rows.push([Markup.button.callback(t(lang, 'btn_cancel'), 'cancel')]);
      return ctx.reply(t(lang, 'buy_pick'), Markup.inlineKeyboard(rows));
    }

    if (text === t(lang, 'btn_send_receipt')) {
      const u = await findUser(ctx.from.id);
      if (!u) return ctx.reply(t(lang, 'acc_not_registered'), studentMenu(lang, s.isAdmin));
      const o = await pool.query(
        `SELECT 1 FROM payment_orders WHERE user_id=$1 AND status='pending' LIMIT 1`,
        [u.id]
      );
      if (!o.rows[0]) return ctx.reply(t(lang, 'no_pending_order'), studentMenu(lang, s.isAdmin));
      return ctx.reply(t(lang, 'buy_receipt_prompt'), cancelKb(lang));
    }

    if (text === t(lang, 'btn_sessions')) {
      const u = await findUser(ctx.from.id);
      if (!u) return ctx.reply(t(lang, 'acc_not_registered'), studentMenu(lang, s.isAdmin));
      const r = await pool.query(
        `SELECT scheduled_at, status FROM bookings
          WHERE user_id=$1 AND scheduled_at > NOW()
          ORDER BY scheduled_at LIMIT 10`,
        [u.id]
      );
      if (!r.rows.length) return ctx.reply(t(lang, 'sessions_empty'), studentMenu(lang, s.isAdmin));
      const lines = r.rows.map(
        (b, i) =>
          `${i + 1}. ${new Date(b.scheduled_at)
            .toISOString()
            .slice(0, 16)
            .replace('T', ' ')} — ${b.status}`
      );
      return ctx.reply(`${t(lang, 'sessions_next')}\n\n${lines.join('\n')}`, {
        parse_mode: 'Markdown',
        ...studentMenu(lang, s.isAdmin),
      });
    }

    if (text === t(lang, 'btn_library')) {
      const r = await pool.query(
        `SELECT title, url FROM library_items
          WHERE is_active=TRUE ORDER BY created_at DESC LIMIT 10`
      );
      if (!r.rows.length) return ctx.reply(t(lang, 'lib_empty'), studentMenu(lang, s.isAdmin));
      const lines = r.rows.map((it, i) => `${i + 1}. ${it.title}${it.url ? ' — ' + it.url : ''}`);
      return ctx.reply(`${t(lang, 'lib_title')}\n\n${lines.join('\n')}`, {
        parse_mode: 'Markdown',
        ...studentMenu(lang, s.isAdmin),
      });
    }

    if (text === t(lang, 'btn_support')) {
      s.step = 'support';
      return ctx.reply(t(lang, 'support_msg'), { parse_mode: 'Markdown', ...cancelKb(lang) });
    }

    if (text === t(lang, 'btn_lang')) {
      return ctx.reply(t(lang, 'pick_lang'), langKb());
    }

    return ctx.reply(t(lang, 'unknown'), studentMenu(lang, s.isAdmin));
  });

  bot.catch((err, ctx) => {
    console.error('[bot] error', err?.message);
    const s = getS(ctx);
    ctx.reply(t(s.lang, 'error')).catch(() => {});
  });

  await bot.launch();
  console.log('[bot] launched');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = startBot;