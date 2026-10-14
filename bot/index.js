const { Telegraf, Markup } = require('telegraf');
const { pool, config } = require('../src/config');
const { getOrCreateWallet } = require('../src/services');

// ============================================================
// الجلسات
// ============================================================
const sessions = new Map();
function getS(ctx) {
  const k = String(ctx.from?.id || '');
  if (!k) return { step: null, lang: 'ar', data: {}, loaded: false };
  if (!sessions.has(k)) sessions.set(k, { step: null, lang: 'ar', data: {}, loaded: false });
  return sessions.get(k);
}

// ============================================================
// الترجمات — 3 لغات (ar / en / am)
// القاعدة: المصطلحات الشرعية والقرآنية تبقى بلفظها العربي
// ولا تُترجم إلى معناها؛ تُنقل صوتيًا (Transliteration).
// ============================================================
const T = {
  ar: {
    brand: '🕌 *مقرأة الإمام الجزري للإقراء والإجازة بالسند*',
    supervisor: 'الشيخ المشرف: المقرئ أبو زيد خالد أحمد الإثيوبي',
    pick_lang: '🌐 اختر اللغة / Choose language / ቋንቋ ይምረጡ',
    lang_set: '✅ تم اختيار اللغة العربية.',
    menu: '🏠 القائمة الرئيسية',
    btn_register: '📝 التسجيل',
    btn_account: '👤 حسابي',
    btn_buy: '🛒 شراء الدقائق',
    btn_sessions: '📅 الجلسات',
    btn_library: '📖 المكتبة',
    btn_support: '🆘 الدعم',
    btn_lang: '🌐 اللغة',
    btn_cancel: '❌ إلغاء',
    reg_ask_name: '📝 أرسل الاسم الكامل:',
    reg_ask_phone: '📞 أرسل رقم الهاتف:',
    reg_ask_program: '🎓 اختر البرنامج:',
    reg_done: '✅ تم التسجيل بنجاح.',
    reg_exists: '✅ أنت مسجل مسبقاً.',
    reg_cancelled: 'تم الإلغاء.',
    acc_title: '👤 *حسابي*',
    acc_name: 'الاسم',
    acc_id: 'رقم الطالب',
    acc_program: 'البرنامج',
    acc_balance: 'رصيد الدقائق',
    acc_not_registered: '⚠️ أنت غير مسجل. اختر «التسجيل» أولاً.',
    buy_pick: '🛒 اختر حزمة الدقائق:',
    buy_order_created: '✅ تم إنشاء طلب الشراء.',
    buy_pay_info:
      '💳 للدفع:\n• تيليبر: +251 99 016 1372\n• إم-بيسا: +251 72 100 9122\n\nثم أرسل الإيصال عبر «الدعم».',
    sessions_empty: '📭 لا توجد جلسات قادمة.',
    sessions_next: '📅 *جلساتك القادمة*',
    lib_empty: '📚 المكتبة فارغة حالياً.',
    lib_title: '📖 *المكتبة*',
    support_msg:
      '🆘 *الدعم الفني*\n\n📧 khdahd241@gmail.com\n📱 @aljezer_241\n📞 +251 99 016 1372',
    myid: '🆔 معرفك على تيليغرام:',
    unknown: '⚠️ أمر غير معروف. استخدم القائمة.',
    error: '⚠️ حدث خطأ، حاول مجدداً.',
    minutes: 'دقيقة',
    etb: 'بر',
  },
  en: {
    // تم استخدام النقل الصوتي للمصطلحات الشرعية
    brand: '🕌 *Imam Al-Jazari Maqra\'ah for Ijazah with Sanad*',
    supervisor: 'Supervisor: Sheikh Abu Zaid Khalid Ahmed Al-Ethiopi',
    pick_lang: '🌐 Choose language / اختر اللغة / ቋንቋ ይምረጡ',
    lang_set: '✅ English selected.',
    menu: '🏠 Main Menu',
    btn_register: '📝 Registration',
    btn_account: '👤 My Account',
    btn_buy: '🛒 Buy Minutes',
    btn_sessions: '📅 Sessions',
    btn_library: '📖 Library',
    btn_support: '🆘 Support',
    btn_lang: '🌐 Language',
    btn_cancel: '❌ Cancel',
    reg_ask_name: '📝 Send your full name:',
    reg_ask_phone: '📞 Send your phone number:',
    reg_ask_program: '🎓 Choose a program:',
    reg_done: '✅ Registration complete.',
    reg_exists: '✅ You are already registered.',
    reg_cancelled: 'Cancelled.',
    acc_title: '👤 *My Account*',
    acc_name: 'Name',
    acc_id: 'Student No.',
    acc_program: 'Program',
    acc_balance: 'Minutes balance',
    acc_not_registered: '⚠️ Not registered yet. Choose "Registration" first.',
    buy_pick: '🛒 Choose a minutes pack:',
    buy_order_created: '✅ Purchase order created.',
    buy_pay_info:
      '💳 Payment:\n• Telebirr: +251 99 016 1372\n• M-Pesa: +251 72 100 9122\n\nSend the receipt via "Support".',
    sessions_empty: '📭 No upcoming sessions.',
    sessions_next: '📅 *Your upcoming sessions*',
    lib_empty: '📚 Library is empty.',
    lib_title: '📖 *Library*',
    support_msg:
      '🆘 *Support*\n\n📧 khdahd241@gmail.com\n📱 @aljezer_241\n📞 +251 99 016 1372',
    myid: '🆔 Your Telegram ID:',
    unknown: '⚠️ Unknown command. Use the menu.',
    error: '⚠️ Something went wrong. Try again.',
    minutes: 'min',
    etb: 'ETB',
  },
  am: {
    // تم استخدام النقل الصوتي للمصطلحات الشرعية بحروف أمهرية
    brand: '🕌 *የኢማም አል-ጀዛሪ መቅራአ — ለኢጃዛ በሰነድ*',
    supervisor: 'ሱፐርቫይዘር: ሼኽ አቡ ዛይድ ኻሊድ አህመድ አል-ኢትዮጵያዊ',
    pick_lang: '🌐 ቋንቋ ይምረጡ / اختر اللغة / Choose language',
    lang_set: '✅ አማርኛ ተመርጧል።',
    menu: '🏠 ዋና ማውጫ',
    btn_register: '📝 ምዝገባ',
    btn_account: '👤 ሒሳቤ',
    btn_buy: '🛒 ደቂቃ ግዛ',
    btn_sessions: '📅 ክፍለ ጊዜ',
    btn_library: '📖 ቤተ መጻሕፍት',
    btn_support: '🆘 ድጋፍ',
    btn_lang: '🌐 ቋንቋ',
    btn_cancel: '❌ ሰርዝ',
    reg_ask_name: '📝 ሙሉ ስምዎን ይላኩ:',
    reg_ask_phone: '📞 ስልክ ቁጥርዎን ይላኩ:',
    reg_ask_program: '🎓 ፕሮግራም ይምረጡ:',
    reg_done: '✅ ምዝገባው ተጠናቅቋል።',
    reg_exists: '✅ አስቀድመው ተመዝግበዋል።',
    reg_cancelled: 'ተሰርዟል።',
    acc_title: '👤 *ሒሳቤ*',
    acc_name: 'ስም',
    acc_id: 'የተማሪ ቁጥር',
    acc_program: 'ፕሮግራም',
    acc_balance: 'የደቂቃ ቀሪ',
    acc_not_registered: '⚠️ አልተመዘገቡም። መጀመሪያ «ምዝገባ» ይምረጡ።',
    buy_pick: '🛒 የደቂቃ ጥቅል ይምረጡ:',
    buy_order_created: '✅ የግዢ ትዕዛዝ ተፈጥሯል።',
    buy_pay_info:
      '💳 ክፍያ:\n• ቴሌብር: +251 99 016 1372\n• ኤም-ፔሳ: +251 72 100 9122\n\nደረሰኙን በ«ድጋፍ» ይላኩ።',
    sessions_empty: '📭 የሚመጡ ክፍለ ጊዜዎች የሉም።',
    sessions_next: '📅 *የሚመጡ ክፍለ ጊዜዎች*',
    lib_empty: '📚 ቤተ መጻሕፍቱ ባዶ ነው።',
    lib_title: '📖 *ቤተ መጻሕፍት*',
    support_msg:
      '🆘 *ድጋፍ*\n\n📧 khdahd241@gmail.com\n📱 @aljezer_241\n📞 +251 99 016 1372',
    myid: '🆔 የቴሌግራም መታወቂያዎ:',
    unknown: '⚠️ ያልታወቀ ትዕዛዝ። ማውጫውን ይጠቀሙ።',
    error: '⚠️ ስህተት ተከስቷል። እንደገና ይሞክሩ።',
    minutes: 'ደቂቃ',
    etb: 'ብር',
  },
};

function t(lang, key) {
  const d = T[lang] || T.ar;
  return d[key] ?? T.ar[key] ?? key;
}

// أسماء البرامج: تُعرض بالحروف الأصلية للمصطلح الشرعي في كل لغة
function programName(p, lang) {
  if (!p) return '—';
  if (lang === 'en') return p.name_en || p.name_ar;
  if (lang === 'am') return p.name_am || p.name_ar;
  return p.name_ar;
}

function pkgName(p, lang) {
  if (!p) return '—';
  if (lang === 'en') return p.name_en || p.name_ar;
  return p.name_ar;
}

function menuKb(lang) {
  return Markup.keyboard([
    [t(lang, 'btn_register'), t(lang, 'btn_account')],
    [t(lang, 'btn_buy'), t(lang, 'btn_sessions')],
    [t(lang, 'btn_library'), t(lang, 'btn_support')],
    [t(lang, 'btn_lang')],
  ])
    .resize()
    .persistent();
}

function cancelKb(lang) {
  return Markup.keyboard([[t(lang, 'btn_cancel')]]).resize();
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

// ============================================================
// الدوال المساعدة لقاعدة البيانات
// ============================================================
async function loadUserLang(telegramId) {
  const r = await pool.query('SELECT language FROM users WHERE telegram_id = $1', [telegramId]);
  return r.rows[0]?.language || null;
}

async function findUser(telegramId) {
  const r = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
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

// ============================================================
// البوت
// ============================================================
async function startBot() {
  const bot = new Telegraf(config.botToken);

  // تحميل لغة المستخدم من قاعدة البيانات لأول تفاعل
  bot.use(async (ctx, next) => {
    const s = getS(ctx);
    if (!s.loaded && ctx.from) {
      try {
        const lang = await loadUserLang(ctx.from.id);
        if (lang && T[lang]) s.lang = lang;
      } catch (_) {}
      s.loaded = true;
    }
    return next();
  });

  // ---------- /start ----------
  bot.start(async (ctx) => {
    const s = getS(ctx);
    const u = await findUser(ctx.from.id);
    if (u) {
      s.lang = u.language || s.lang || 'ar';
      await ctx.reply(
        `${t(s.lang, 'brand')}\n${t(s.lang, 'supervisor')}\n\n${t(s.lang, 'menu')}`,
        { parse_mode: 'Markdown', ...menuKb(s.lang) }
      );
      return;
    }
    // مستخدم جديد → اختيار اللغة
    await ctx.reply(
      `${T.ar.brand}\n${T.ar.supervisor}\n\n${T.ar.pick_lang}`,
      { parse_mode: 'Markdown', ...langKb() }
    );
  });

  // ---------- تغيير اللغة ----------
  bot.action(/^lang:(ar|en|am)$/, async (ctx) => {
    const lang = ctx.match[1];
    const s = getS(ctx);
    s.lang = lang;
    try { await ctx.answerCbQuery(); } catch (_) {}
    try { await ctx.deleteMessage(); } catch (_) {}
    // حفظها في قاعدة البيانات إن كان المستخدم مسجلاً
    try {
      await pool.query(
        'UPDATE users SET language = $1, updated_at = NOW() WHERE telegram_id = $2',
        [lang, ctx.from.id]
      );
    } catch (_) {}
    await ctx.reply(t(lang, 'lang_set'), menuKb(lang));
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
    s.step = null; s.data = {};
    await ctx.reply(t(s.lang, 'reg_cancelled'), menuKb(s.lang));
  });

  // ---------- اختيار البرنامج أثناء التسجيل ----------
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
        await ctx.reply(t(lang, 'reg_exists'), menuKb(lang));
        return;
      }
      const { full_name, phone } = s.data || {};
      if (!full_name || !phone) {
        s.step = null; s.data = {};
        await ctx.reply(t(lang, 'unknown'), menuKb(lang));
        return;
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
      await ctx.reply(t(lang, 'reg_done'), menuKb(lang));
    } catch (err) {
      console.error('[reg]', err.message);
      await ctx.reply(t(lang, 'error'), menuKb(lang));
    }
  });

  bot.action('cancel', async (ctx) => {
    const s = getS(ctx);
    try { await ctx.answerCbQuery(); } catch (_) {}
    try { await ctx.deleteMessage(); } catch (_) {}
    s.step = null; s.data = {};
    await ctx.reply(t(s.lang, 'reg_cancelled'), menuKb(s.lang));
  });

  // ---------- اختيار الحزمة ----------
  bot.action(/^pkg:(\d+)$/, async (ctx) => {
    const pkgId = parseInt(ctx.match[1], 10);
    const s = getS(ctx);
    const lang = s.lang;
    try { await ctx.answerCbQuery(); } catch (_) {}
    try { await ctx.deleteMessage(); } catch (_) {}
    try {
      const u = await findUser(ctx.from.id);
      if (!u) {
        await ctx.reply(t(lang, 'acc_not_registered'), menuKb(lang));
        return;
      }
      const p = await pool.query('SELECT * FROM packages WHERE id = $1', [pkgId]);
      if (!p.rows[0]) {
        await ctx.reply(t(lang, 'error'), menuKb(lang));
        return;
      }
      const pkg = p.rows[0];
      await pool.query(
        `INSERT INTO payment_orders (user_id, package_id, amount_etb, status)
         VALUES ($1,$2,$3,'pending')`,
        [u.id, pkgId, pkg.price_etb]
      );
      await ctx.reply(
        `${t(lang, 'buy_order_created')}\n\n${t(lang, 'buy_pay_info')}`,
        menuKb(lang)
      );
    } catch (err) {
      console.error('[buy]', err.message);
      await ctx.reply(t(lang, 'error'), menuKb(lang));
    }
  });

  // ---------- الرسائل النصية ----------
  bot.on('text', async (ctx) => {
    const s = getS(ctx);
    const lang = s.lang;
    const text = ctx.message.text.trim();

    // إلغاء
    if (text === t(lang, 'btn_cancel')) {
      s.step = null; s.data = {};
      await ctx.reply(t(lang, 'reg_cancelled'), menuKb(lang));
      return;
    }

    // خطوة اسم التسجيل
    if (s.step === 'reg_name') {
      s.data.full_name = text;
      s.step = 'reg_phone';
      await ctx.reply(t(lang, 'reg_ask_phone'), cancelKb(lang));
      return;
    }
    // خطوة الهاتف
    if (s.step === 'reg_phone') {
      s.data.phone = text;
      s.step = 'reg_program';
      const programs = await getPrograms();
      const rows = programs.map((p) => [
        Markup.button.callback(programName(p, lang), `prog:${p.id}`),
      ]);
      rows.push([Markup.button.callback(t(lang, 'btn_cancel'), 'cancel')]);
      await ctx.reply(t(lang, 'reg_ask_program'), Markup.inlineKeyboard(rows));
      return;
    }

    // القائمة الرئيسية
    if (text === t(lang, 'btn_register')) {
      const u = await findUser(ctx.from.id);
      if (u) {
        await ctx.reply(t(lang, 'reg_exists'), menuKb(lang));
        return;
      }
      s.step = 'reg_name'; s.data = {};
      await ctx.reply(t(lang, 'reg_ask_name'), cancelKb(lang));
      return;
    }

    if (text === t(lang, 'btn_account')) {
      const u = await findUser(ctx.from.id);
      if (!u) {
        await ctx.reply(t(lang, 'acc_not_registered'), menuKb(lang));
        return;
      }
      const r = await pool.query(
        `SELECT u.full_name,
                w.balance_minutes,
                p.name_ar, p.name_en, p.name_am
           FROM users u
           LEFT JOIN wallet_accounts w ON w.user_id = u.id
           LEFT JOIN enrollments e ON e.user_id = u.id AND e.status = 'active'
           LEFT JOIN programs p ON p.id = e.program_id
          WHERE u.id = $1
          LIMIT 1`,
        [u.id]
      );
      const row = r.rows[0] || {};
      const studentNo = String(u.id).slice(0, 8).toUpperCase();
      const prog = row.name_ar
        ? programName({ name_ar: row.name_ar, name_en: row.name_en, name_am: row.name_am }, lang)
        : '—';
      const bal = row.balance_minutes ?? 0;
      await ctx.reply(
        `${t(lang, 'acc_title')}\n\n` +
          `• ${t(lang, 'acc_name')}: ${row.full_name || u.full_name || '—'}\n` +
          `• ${t(lang, 'acc_id')}: ${studentNo}\n` +
          `• ${t(lang, 'acc_program')}: ${prog}\n` +
          `• ${t(lang, 'acc_balance')}: ${bal}`,
        { parse_mode: 'Markdown', ...menuKb(lang) }
      );
      return;
    }

    if (text === t(lang, 'btn_buy')) {
      const u = await findUser(ctx.from.id);
      if (!u) {
        await ctx.reply(t(lang, 'acc_not_registered'), menuKb(lang));
        return;
      }
      const pkgs = await getPackages();
      if (!pkgs.length) {
        await ctx.reply(t(lang, 'error'), menuKb(lang));
        return;
      }
      const rows = pkgs.map((p) => [
        Markup.button.callback(
          `${pkgName(p, lang)} — ${p.minutes} ${t(lang, 'minutes')} — ${p.price_etb} ${t(lang, 'etb')}`,
          `pkg:${p.id}`
        ),
      ]);
      rows.push([Markup.button.callback(t(lang, 'btn_cancel'), 'cancel')]);
      await ctx.reply(t(lang, 'buy_pick'), Markup.inlineKeyboard(rows));
      return;
    }

    if (text === t(lang, 'btn_sessions')) {
      const u = await findUser(ctx.from.id);
      if (!u) {
        await ctx.reply(t(lang, 'acc_not_registered'), menuKb(lang));
        return;
      }
      const r = await pool.query(
        `SELECT scheduled_at, status FROM bookings
          WHERE user_id = $1 AND scheduled_at > NOW()
          ORDER BY scheduled_at LIMIT 10`,
        [u.id]
      );
      if (!r.rows.length) {
        await ctx.reply(t(lang, 'sessions_empty'), menuKb(lang));
        return;
      }
      const lines = r.rows.map(
        (b, i) =>
          `${i + 1}. ${new Date(b.scheduled_at).toISOString().slice(0, 16).replace('T', ' ')} — ${b.status}`
      );
      await ctx.reply(`${t(lang, 'sessions_next')}\n\n${lines.join('\n')}`, {
        parse_mode: 'Markdown',
        ...menuKb(lang),
      });
      return;
    }

    if (text === t(lang, 'btn_library')) {
      const r = await pool.query(
        'SELECT title, url FROM library_items WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 10'
      );
      if (!r.rows.length) {
        await ctx.reply(t(lang, 'lib_empty'), menuKb(lang));
        return;
      }
      const lines = r.rows.map((it, i) => `${i + 1}. [${it.title}](${it.url || '#'})`);
      await ctx.reply(`${t(lang, 'lib_title')}\n\n${lines.join('\n')}`, {
        parse_mode: 'Markdown',
        ...menuKb(lang),
      });
      return;
    }

    if (text === t(lang, 'btn_support')) {
      await ctx.reply(t(lang, 'support_msg'), { parse_mode: 'Markdown', ...menuKb(lang) });
      return;
    }

    if (text === t(lang, 'btn_lang')) {
      await ctx.reply(t(lang, 'pick_lang'), langKb());
      return;
    }

    // نص غير معروف أثناء خطوة → استخدامه كإدخال
    await ctx.reply(t(lang, 'unknown'), menuKb(lang));
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