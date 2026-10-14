// bot/i18n.js
// قاعدة الترجمة: المصطلحات الشرعية (إجازة، سند، تلقين، حفظ، تجويد، قراءات، مقرأة،
// حفص عن عاصم، شيخ، مجيز…) تُنقل صوتياً ولا تُترجم إلى معناها.

const ar = {
  brand: '🕌 مقرأة الإمام الجزري للإقراء والإجازة بالسند',
  supervisor: 'الشيخ المشرف: المقرئ أبو زيد خالد أحمد الإثيوبي',
  pick_lang: '🌐 اختر اللغة',
  lang_set: '✅ تم اختيار اللغة العربية',
  menu: '🏠 القائمة الرئيسية',
  admin_menu: '🛠️ لوحة الإدارة',

  btn_register: '📝 التسجيل',
  btn_account: '👤 حسابي',
  btn_buy: '🛒 شراء الدقائق',
  btn_send_receipt: '🧾 إرسال الإيصال',
  btn_sessions: '📅 الجلسات',
  btn_library: '📖 المكتبة',
  btn_support: '🆘 الدعم',
  btn_lang: '🌐 اللغة',
  btn_admin: '🛠️ لوحة الإدارة',
  btn_back: '⬅️ رجوع',
  btn_cancel: '❌ إلغاء',

  reg_ask_name: '📝 أرسل الاسم الكامل:',
  reg_ask_phone: '📞 أرسل رقم الهاتف:',
  reg_ask_program: '🎓 اختر البرنامج:',
  reg_done: '✅ تم التسجيل بنجاح',
  reg_exists: '✅ أنت مسجل مسبقاً',
  reg_cancelled: 'تم الإلغاء',

  acc_title: '👤 *حسابي*',
  acc_name: 'الاسم',
  acc_id: 'رقم الطالب',
  acc_program: 'البرنامج',
  acc_balance: 'رصيد الدقائق',
  acc_not_registered: '⚠️ أنت غير مسجل. اختر «التسجيل» أولاً',

  buy_pick: '🛒 اختر حزمة الدقائق:',
  buy_order_created: '✅ تم إنشاء طلب الشراء',
  buy_pay_info:
    '💳 للدفع:\n• تيليبر: +251 99 016 1372\n• إم-بيسا: +251 72 100 9122\n\nثم اضغط «🧾 إرسال الإيصال» وأرسل صورة الإيصال.',
  buy_receipt_prompt: '📸 أرسل صورة الإيصال الآن:',
  receipt_received: '✅ تم استلام إيصالك، سيتم مراجعته من الإدارة',
  no_pending_order: '⚠️ لا يوجد طلب شراء معلق. اشترِ دقائق أولاً.',

  sessions_empty: '📭 لا توجد جلسات قادمة',
  sessions_next: '📅 *جلساتك القادمة*',

  lib_empty: '📚 المكتبة فارغة حالياً',
  lib_title: '📖 *المكتبة*',

  support_msg:
    '🆘 *الدعم الفني*\n\n📧 khdahd241@gmail.com\n📱 @aljezer_241\n📞 +251 99 016 1372\n\nاكتب رسالتك للإدارة الآن:',
  support_ask: '✍️ اكتب رسالتك للإدارة:',
  support_sent: '✅ تم إرسال رسالتك للإدارة',

  admin_only: '⛔ هذه اللوحة للمشرفين فقط',
  admin_title: '🛠️ *لوحة الإدارة*',
  admin_pending: '🧾 الإيصالات المعلقة',
  admin_students: '👥 الطلاب',
  admin_add_minutes: '➕ إضافة دقائق',
  admin_broadcast: '📢 إشعار جماعي',
  admin_ijaza: '🎓 إصدار إجازة',
  admin_stats: '📊 إحصائيات',
  admin_no_pending: '📭 لا توجد إيصالات معلقة',
  admin_ask_student_id: 'أرسل رقم الطالب (أول 8 أحرف من UUID) أو Telegram ID:',
  admin_ask_minutes: 'أرسل عدد الدقائق:',
  admin_ask_reason: 'أرسل سبب الإضافة (أو أرسل «-» للتجاهل):',
  admin_minutes_added: '✅ تمت إضافة الدقائق للطالب',
  admin_broadcast_ask: '📢 أرسل نص الإشعار الجماعي:',
  admin_broadcast_done: '✅ تم إرسال الإشعار إلى {n} مستخدم',
  admin_approve: '✅ قبول',
  admin_reject: '❌ رفض',
  admin_receipt_approved: '✅ تم قبول الإيصال وإضافة الدقائق',
  admin_receipt_rejected: '❌ تم رفض الإيصال',
  admin_student_not_found: '⚠️ لم يتم العثور على الطالب',
  admin_student_found: '✅ تم العثور على الطالب',
  admin_stats_txt:
    '📊 *إحصائيات المقرأة*\n\n• الطلاب: {students}\n• الإيصالات المعلقة: {receipts}\n• الجلسات القادمة: {sessions}\n• الإجازات الصادرة: {ijazat}',

  ijaza_ask_student: '🎓 أرسل رقم الطالب للحصول على الإجازة:',
  ijaza_ask_teacher: 'أرسل اسم الشيخ المجيز:',
  ijaza_ask_sanad: 'أرسل نص السند:',
  ijaza_done: '✅ تم إصدار الإجازة بالسند',

  myid: '🆔 معرفك على تيليغرام:',
  unknown: '⚠️ أمر غير معروف. استخدم القائمة.',
  error: '⚠️ حدث خطأ، حاول مجدداً',
  minutes: 'دقيقة',
  etb: 'بر',
  back_to_menu: 'عدنا للقائمة الرئيسية',
  no_access: 'غير مصرح',
  order_line: '• الطلب: {order}\n• الطالب: {name}\n• الحزمة: {pkg}\n• المبلغ: {etb} بر',
};

const en = {
  brand: '🕌 Imam Al-Jazari Maqra\'ah for Ijazah with Sanad',
  supervisor: 'Supervisor: Sheikh Abu Zaid Khalid Ahmed Al-Ethiopi',
  pick_lang: '🌐 Choose language',
  lang_set: '✅ English selected',
  menu: '🏠 Main Menu',
  admin_menu: '🛠️ Admin Panel',

  btn_register: '📝 Registration',
  btn_account: '👤 My Account',
  btn_buy: '🛒 Buy Minutes',
  btn_send_receipt: '🧾 Send Receipt',
  btn_sessions: '📅 Sessions',
  btn_library: '📖 Library',
  btn_support: '🆘 Support',
  btn_lang: '🌐 Language',
  btn_admin: '🛠️ Admin Panel',
  btn_back: '⬅️ Back',
  btn_cancel: '❌ Cancel',

  reg_ask_name: '📝 Send your full name:',
  reg_ask_phone: '📞 Send your phone number:',
  reg_ask_program: '🎓 Choose a program:',
  reg_done: '✅ Registration complete',
  reg_exists: '✅ You are already registered',
  reg_cancelled: 'Cancelled',

  acc_title: '👤 *My Account*',
  acc_name: 'Name',
  acc_id: 'Student No.',
  acc_program: 'Program',
  acc_balance: 'Minutes balance',
  acc_not_registered: '⚠️ You are not registered. Choose "Registration" first.',

  buy_pick: '🛒 Choose a minutes pack:',
  buy_order_created: '✅ Purchase order created',
  buy_pay_info:
    '💳 Payment:\n• Telebirr: +251 99 016 1372\n• M-Pesa: +251 72 100 9122\n\nThen tap "🧾 Send Receipt" and send your receipt photo.',
  buy_receipt_prompt: '📸 Send the receipt photo now:',
  receipt_received: '✅ Receipt received, pending admin review',
  no_pending_order: '⚠️ No pending order. Buy minutes first.',

  sessions_empty: '📭 No upcoming sessions',
  sessions_next: '📅 *Your upcoming sessions*',

  lib_empty: '📚 Library is empty',
  lib_title: '📖 *Library*',

  support_msg:
    '🆘 *Support*\n\n📧 khdahd241@gmail.com\n📱 @aljezer_241\n📞 +251 99 016 1372\n\nWrite your message to admin now:',
  support_ask: '✍️ Write your message to admin:',
  support_sent: '✅ Your message was sent to admin',

  admin_only: '⛔ Admin only',
  admin_title: '🛠️ *Admin Panel*',
  admin_pending: '🧾 Pending Receipts',
  admin_students: '👥 Students',
  admin_add_minutes: '➕ Add Minutes',
  admin_broadcast: '📢 Broadcast',
  admin_ijaza: '🎓 Issue Ijazah',
  admin_stats: '📊 Stats',
  admin_no_pending: '📭 No pending receipts',
  admin_ask_student_id: 'Send student number (first 8 chars of UUID) or Telegram ID:',
  admin_ask_minutes: 'Send minutes count:',
  admin_ask_reason: 'Send reason (or "-" to skip):',
  admin_minutes_added: '✅ Minutes added to student',
  admin_broadcast_ask: '📢 Send broadcast text:',
  admin_broadcast_done: '✅ Broadcast sent to {n} users',
  admin_approve: '✅ Approve',
  admin_reject: '❌ Reject',
  admin_receipt_approved: '✅ Receipt approved and minutes added',
  admin_receipt_rejected: '❌ Receipt rejected',
  admin_student_not_found: '⚠️ Student not found',
  admin_student_found: '✅ Student found',
  admin_stats_txt:
    '📊 *Maqra\'ah Stats*\n\n• Students: {students}\n• Pending receipts: {receipts}\n• Upcoming sessions: {sessions}\n• Ijazat issued: {ijazat}',

  ijaza_ask_student: '🎓 Send student number for Ijazah:',
  ijaza_ask_teacher: 'Send Sheikh (Mujiz) name:',
  ijaza_ask_sanad: 'Send Sanad text:',
  ijaza_done: '✅ Ijazah with Sanad issued',

  myid: '🆔 Your Telegram ID:',
  unknown: '⚠️ Unknown command. Use the menu.',
  error: '⚠️ Something went wrong',
  minutes: 'min',
  etb: 'ETB',
  back_to_menu: 'Back to main menu',
  no_access: 'Unauthorized',
  order_line: '• Order: {order}\n• Student: {name}\n• Pack: {pkg}\n• Amount: {etb} ETB',
};

const am = {
  brand: '🕌 የኢማም አል-ጀዛሪ መቅራአ — ለኢጃዛ በሰነድ',
  supervisor: 'ሱፐርቫይዘር: ሼኽ አቡ ዛይድ ኻሊድ አህመድ አል-ኢትዮጵያዊ',
  pick_lang: '🌐 ቋንቋ ይምረጡ',
  lang_set: '✅ አማርኛ ተመርጧል',
  menu: '🏠 ዋና ማውጫ',
  admin_menu: '🛠️ የአስተዳደር ፓነል',

  btn_register: '📝 ምዝገባ',
  btn_account: '👤 ሒሳቤ',
  btn_buy: '🛒 ደቂቃ ግዛ',
  btn_send_receipt: '🧾 ደረሰኝ ላክ',
  btn_sessions: '📅 ክፍለ ጊዜ',
  btn_library: '📖 ቤተ መጻሕፍት',
  btn_support: '🆘 ድጋፍ',
  btn_lang: '🌐 ቋንቋ',
  btn_admin: '🛠️ የአስተዳደር ፓነል',
  btn_back: '⬅️ ተመለስ',
  btn_cancel: '❌ ሰርዝ',

  reg_ask_name: '📝 ሙሉ ስምዎን ይላኩ:',
  reg_ask_phone: '📞 ስልክ ቁጥርዎን ይላኩ:',
  reg_ask_program: '🎓 ፕሮግራም ይምረጡ:',
  reg_done: '✅ ምዝገባው ተጠናቅቋል',
  reg_exists: '✅ አስቀድመው ተመዝግበዋል',
  reg_cancelled: 'ተሰርዟል',

  acc_title: '👤 *ሒሳቤ*',
  acc_name: 'ስም',
  acc_id: 'የተማሪ ቁጥር',
  acc_program: 'ፕሮግራም',
  acc_balance: 'የደቂቃ ቀሪ',
  acc_not_registered: '⚠️ አልተመዘገቡም። መጀመሪያ «ምዝገባ» ይምረጡ',

  buy_pick: '🛒 የደቂቃ ጥቅል ይምረጡ:',
  buy_order_created: '✅ የግዢ ትዕዛዝ ተፈጥሯል',
  buy_pay_info:
    '💳 ክፍያ:\n• ቴሌብር: +251 99 016 1372\n• ኤም-ፔሳ: +251 72 100 9122\n\n«🧾 ደረሰኝ ላክ» ይጫኑ እና ፎቶውን ይላኩ።',
  buy_receipt_prompt: '📸 አሁን የደረሰኙን ፎቶ ይላኩ:',
  receipt_received: '✅ ደረሰኙ ተቀብሏል፣ በአስተዳደር ይገመገማል',
  no_pending_order: '⚠️ በመጠባበቅ ላይ ያለ ትዕዛዝ የለም',

  sessions_empty: '📭 የሚመጡ ክፍለ ጊዜዎች የሉም',
  sessions_next: '📅 *የሚመጡ ክፍለ ጊዜዎች*',

  lib_empty: '📚 ቤተ መጻሕፍቱ ባዶ ነው',
  lib_title: '📖 *ቤተ መጻሕፍት*',

  support_msg:
    '🆘 *ድጋፍ*\n\n📧 khdahd241@gmail.com\n📱 @aljezer_241\n📞 +251 99 016 1372\n\nመልእክትዎን ለአስተዳደር ይጻፉ:',
  support_ask: '✍️ መልእክትዎን ለአስተዳደር ይጻፉ:',
  support_sent: '✅ መልእክትዎ ተልኳል',

  admin_only: '⛔ ለአስተዳዳሪዎች ብቻ',
  admin_title: '🛠️ *የአስተዳደር ፓነል*',
  admin_pending: '🧾 በመጠባበቅ ላይ ያሉ ደረሰኞች',
  admin_students: '👥 ተማሪዎች',
  admin_add_minutes: '➕ ደቂቃ ጨምር',
  admin_broadcast: '📢 ማስታወቂያ',
  admin_ijaza: '🎓 ኢጃዛ ስጥ',
  admin_stats: '📊 ስታቲስቲክስ',
  admin_no_pending: '📭 በመጠባበቅ ላይ ያለ ደረሰኝ የለም',
  admin_ask_student_id: 'የተማሪ ቁጥር ወይም ቴሌግራም ID ይላኩ:',
  admin_ask_minutes: 'የደቂቃ ብዛት ይላኩ:',
  admin_ask_reason: 'ምክንያት ይላኩ (ወይም «-» ይላኩ):',
  admin_minutes_added: '✅ ደቂቃ ተጨምሯል',
  admin_broadcast_ask: '📢 የማስታወቂያ ጽሑፍ ይላኩ:',
  admin_broadcast_done: '✅ ለ{n} ተጠቃሚዎች ተልኳል',
  admin_approve: '✅ ተቀበል',
  admin_reject: '❌ ውድቅ',
  admin_receipt_approved: '✅ ደረሰኙ ተቀብሏል፣ ደቂቃ ተጨምሯል',
  admin_receipt_rejected: '❌ ደረሰኙ ውድቅ ተደርጓል',
  admin_student_not_found: '⚠️ ተማሪው አልተገኘም',
  admin_student_found: '✅ ተማሪው ተገኝቷል',
  admin_stats_txt:
    '📊 *የመቅራአ ስታቲስቲክስ*\n\n• ተማሪዎች: {students}\n• በመጠባበቅ ላይ ያሉ ደረሰኞች: {receipts}\n• የሚመጡ ክፍለ ጊዜዎች: {sessions}\n• የተሰጡ ኢጃዛዎች: {ijazat}',

  ijaza_ask_student: '🎓 ለኢጃዛ የተማሪ ቁጥር ይላኩ:',
  ijaza_ask_teacher: 'የሼኽ (ሙጂዝ) ስም ይላኩ:',
  ijaza_ask_sanad: 'የሰነድ ጽሑፍ ይላኩ:',
  ijaza_done: '✅ ኢጃዛ በሰነድ ተሰጥቷል',

  myid: '🆔 የቴሌግራም መታወቂያዎ:',
  unknown: '⚠️ ያልታወቀ ትዕዛዝ',
  error: '⚠️ ስህተት ተከስቷል',
  minutes: 'ደቂቃ',
  etb: 'ብር',
  back_to_menu: 'ወደ ዋና ማውጫ ተመለስ',
  no_access: 'ፈቃድ የለም',
  order_line: '• ትዕዛዝ: {order}\n• ተማሪ: {name}\n• ጥቅል: {pkg}\n• መጠን: {etb} ብር',
};

const ALL = { ar, en, am };

function t(lang, key) {
  const d = ALL[lang] || ar;
  return d[key] ?? ar[key] ?? key;
}

function fmt(str, vars) {
  return String(str).replace(/\{(\w+)\}/g, (_, k) => (vars && k in vars ? vars[k] : `{${k}}`));
}

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

module.exports = { T: ALL, t, fmt, programName, pkgName };