// frontend/assets/i18n.js
// قاعدة الترجمة: المصطلحات الشرعية (إجازة، سند، تلقين، حفظ، تجويد، قراءات،
// مقرأة، حفص عن عاصم، شيخ، مجيز…) تُنقل صوتياً ولا تُترجم إلى معناها.

export const translations = {
  ar: {
    site_name: 'مقرأة الإمام الجزري',
    tagline: 'للإقراء والإجازة بالسند',
    supervisor: 'الشيخ المشرف: المقرئ أبو زيد خالد أحمد الإثيوبي',

    nav_home: 'الرئيسية',
    nav_login: 'دخول',
    nav_register: 'تسجيل',
    nav_dashboard: 'لوحتي',
    nav_admin: 'لوحة الإدارة',
    nav_logout: 'خروج',
    nav_lang: 'اللغة',

    hero_title: 'مقرأة الإمام الجزري للإقراء والإجازة بالسند',
    hero_sub:
      'منصة قرآنية متكاملة لإدارة التسجيل والجلسات والإجازات بالسند — بثلاث لغات: العربية، الإنجليزية، الأمهرية.',
    hero_cta_student: 'ابدأ التسجيل',
    hero_cta_login: 'دخول الحساب',

    features_title: 'ماذا نقدّم؟',
    f_talqeen: 'التلقين',
    f_talqeen_d: 'تصحيح التلاوة والتلقين من البداية.',
    f_hifz: 'الحفظ',
    f_hifz_d: 'برامج حفظ القرآن الكريم مع المتابعة.',
    f_ijaza: 'الإجازة (حفص عن عاصم)',
    f_ijaza_d: 'إجازة بالسند برواية حفص عن عاصم.',
    f_qiraat: 'القراءات السبع',
    f_qiraat_d: 'دراسة القراءات السبع على منهج أهل الأداء.',

    contact_title: 'التواصل',
    contact_email: 'البريد',
    contact_tg: 'تيليغرام',
    contact_bot: 'البوت',
    contact_telebirr: 'تيليبر',
    contact_mpesa: 'إم-بيسا',

    login_title: 'دخول الحساب',
    register_title: 'تسجيل طالب جديد',
    field_email: 'البريد الإلكتروني',
    field_password: 'كلمة المرور',
    field_full_name: 'الاسم الكامل',
    field_phone: 'رقم الهاتف',
    field_language: 'اللغة',
    btn_login: 'دخول',
    btn_register: 'تسجيل',
    have_account: 'لديك حساب؟ سجّل الدخول',
    no_account: 'ليس لديك حساب؟ سجّل الآن',

    dash_welcome: 'أهلاً',
    dash_balance: 'رصيد الدقائق',
    dash_student_no: 'رقم الطالب',
    dash_program: 'البرنامج',
    dash_wallet: 'المحفظة',
    dash_ledger: 'سجل الحركات',
    dash_buy: 'شراء الدقائق',
    dash_packages: 'الحزم المتاحة',
    dash_orders: 'طلباتي',
    dash_receipt: 'إرسال إيصال',
    dash_sessions: 'الجلسات',
    dash_library: 'المكتبة',
    dash_certificates: 'شهاداتي وإجازاتي',
    dash_support: 'الدعم',
    dash_book: 'حجز جلسة',
    dash_send: 'إرسال',

    admin_title: 'لوحة الإدارة',
    admin_stats: 'إحصائيات',
    admin_students: 'الطلاب',
    admin_receipts: 'الإيصالات المعلقة',
    admin_add_minutes: 'إضافة دقائق',
    admin_ijaza: 'إصدار إجازة',
    admin_library: 'المكتبة',
    admin_tickets: 'تذاكر الدعم',
    admin_audit: 'سجل التدقيق',
    admin_broadcast: 'إشعار جماعي',

    lbl_name: 'الاسم',
    lbl_amount: 'المبلغ',
    lbl_minutes: 'الدقائق',
    lbl_status: 'الحالة',
    lbl_date: 'التاريخ',
    lbl_actions: 'إجراءات',
    lbl_price: 'السعر',
    lbl_pack: 'الحزمة',
    lbl_reason: 'السبب',

    btn_approve: 'قبول',
    btn_reject: 'رفض',
    btn_save: 'حفظ',
    btn_cancel: 'إلغاء',
    btn_close: 'إغلاق',
    btn_issue: 'إصدار',
    btn_add: 'إضافة',
    btn_book: 'حجز',

    status_pending: 'معلق',
    status_paid: 'مدفوع',
    status_approved: 'مقبول',
    status_rejected: 'مرفوض',
    status_scheduled: 'مجدول',
    status_cancelled: 'ملغى',
    status_in_progress: 'جارٍ',
    status_open: 'مفتوحة',
    status_closed: 'مغلقة',

    msg_saved: '✅ تم الحفظ',
    msg_error: '⚠️ حدث خطأ',
    msg_loading: '⏳ جارٍ التحميل...',
    msg_empty: 'لا يوجد بيانات.',
    msg_login_required: 'يجب تسجيل الدخول أولاً.',

    verify_title: 'تحقق من سند',
    verify_placeholder: 'أدخل رقم السند (مثال: IJZ-XXXX)',
    verify_btn: 'تحقق',
    verify_valid: '✅ سند صحيح',
    verify_invalid: '❌ سند غير موجود',
    verify_holder: 'صاحب السند',
    verify_teacher: 'الشيخ المجيز',
    verify_issued: 'تاريخ الإصدار',
  },

  en: {
    // المصطلحات الشرعية نُقلت صوتياً: Ijazah, Sanad, Talqeen, Hifz, Tajweed, Qiraat, Maqra'ah, Hafs 'an 'Asim, Sheikh, Mujiz
    site_name: 'Imam Al-Jazari Maqra\'ah',
    tagline: 'for Ijazah with Sanad',
    supervisor: 'Supervisor: Sheikh Abu Zaid Khalid Ahmed Al-Ethiopi',

    nav_home: 'Home',
    nav_login: 'Login',
    nav_register: 'Register',
    nav_dashboard: 'Dashboard',
    nav_admin: 'Admin Panel',
    nav_logout: 'Logout',
    nav_lang: 'Language',

    hero_title: 'Imam Al-Jazari Maqra\'ah for Ijazah with Sanad',
    hero_sub:
      'A complete Quranic platform for registration, sessions and Ijazat with Sanad — in 3 languages: Arabic, English, Amharic.',
    hero_cta_student: 'Start Registration',
    hero_cta_login: 'Login',

    features_title: 'What we offer',
    f_talqeen: 'Talqeen',
    f_talqeen_d: 'Tajweed correction and Talqeen from the basics.',
    f_hifz: 'Hifz',
    f_hifz_d: 'Quran memorization programs with follow-up.',
    f_ijaza: 'Ijazah (Hafs \'an \'Asim)',
    f_ijaza_d: 'Ijazah with Sanad in the narration of Hafs \'an \'Asim.',
    f_qiraat: 'Qiraat Sab\'ah',
    f_qiraat_d: 'Study of the seven Qiraat per the scholars of recitation.',

    contact_title: 'Contact',
    contact_email: 'Email',
    contact_tg: 'Telegram',
    contact_bot: 'Bot',
    contact_telebirr: 'Telebirr',
    contact_mpesa: 'M-Pesa',

    login_title: 'Login',
    register_title: 'New Student Registration',
    field_email: 'Email',
    field_password: 'Password',
    field_full_name: 'Full Name',
    field_phone: 'Phone',
    field_language: 'Language',
    btn_login: 'Login',
    btn_register: 'Register',
    have_account: 'Have an account? Login',
    no_account: 'No account? Register now',

    dash_welcome: 'Welcome',
    dash_balance: 'Minutes Balance',
    dash_student_no: 'Student No.',
    dash_program: 'Program',
    dash_wallet: 'Wallet',
    dash_ledger: 'Ledger',
    dash_buy: 'Buy Minutes',
    dash_packages: 'Available Packs',
    dash_orders: 'My Orders',
    dash_receipt: 'Send Receipt',
    dash_sessions: 'Sessions',
    dash_library: 'Library',
    dash_certificates: 'My Certificates & Ijazat',
    dash_support: 'Support',
    dash_book: 'Book Session',
    dash_send: 'Send',

    admin_title: 'Admin Panel',
    admin_stats: 'Stats',
    admin_students: 'Students',
    admin_receipts: 'Pending Receipts',
    admin_add_minutes: 'Add Minutes',
    admin_ijaza: 'Issue Ijazah',
    admin_library: 'Library',
    admin_tickets: 'Support Tickets',
    admin_audit: 'Audit Log',
    admin_broadcast: 'Broadcast',

    lbl_name: 'Name',
    lbl_amount: 'Amount',
    lbl_minutes: 'Minutes',
    lbl_status: 'Status',
    lbl_date: 'Date',
    lbl_actions: 'Actions',
    lbl_price: 'Price',
    lbl_pack: 'Pack',
    lbl_reason: 'Reason',

    btn_approve: 'Approve',
    btn_reject: 'Reject',
    btn_save: 'Save',
    btn_cancel: 'Cancel',
    btn_close: 'Close',
    btn_issue: 'Issue',
    btn_add: 'Add',
    btn_book: 'Book',

    status_pending: 'Pending',
    status_paid: 'Paid',
    status_approved: 'Approved',
    status_rejected: 'Rejected',
    status_scheduled: 'Scheduled',
    status_cancelled: 'Cancelled',
    status_in_progress: 'In progress',
    status_open: 'Open',
    status_closed: 'Closed',

    msg_saved: '✅ Saved',
    msg_error: '⚠️ Error occurred',
    msg_loading: '⏳ Loading...',
    msg_empty: 'No data.',
    msg_login_required: 'Please login first.',

    verify_title: 'Verify Sanad',
    verify_placeholder: 'Enter serial (e.g., IJZ-XXXX)',
    verify_btn: 'Verify',
    verify_valid: '✅ Valid Sanad',
    verify_invalid: '❌ Sanad not found',
    verify_holder: 'Holder',
    verify_teacher: 'Sheikh (Mujiz)',
    verify_issued: 'Issued at',
  },

  am: {
    // ሼኽ፣ ኢጃዛ፣ ሰነድ፣ ተልቂን፣ ሒፍዝ፣ ተጅዊድ፣ ቂራኣት፣ መቅራአ — በድምጽ ተቀይረው ተጽፈዋል
    site_name: 'የኢማም አል-ጀዛሪ መቅራአ',
    tagline: 'ለኢጃዛ በሰነድ',
    supervisor: 'ሱፐርቫይዘር: ሼኽ አቡ ዛይድ ኻሊድ አህመድ አል-ኢትዮጵያዊ',

    nav_home: 'ዋና ገጽ',
    nav_login: 'ግባ',
    nav_register: 'ተመዝገብ',
    nav_dashboard: 'ዳሽቦርድ',
    nav_admin: 'የአስተዳደር ፓነል',
    nav_logout: 'ውጣ',
    nav_lang: 'ቋንቋ',

    hero_title: 'የኢማም አል-ጀዛሪ መቅራአ — ለኢጃዛ በሰነድ',
    hero_sub:
      'ለምዝገባ፣ ክፍለ ጊዜ እና ኢጃዛ በሰነድ የተዘጋጀ የቁርአን መድረክ — በ3 ቋንቋዎች: ዐረብኛ፣ እንግሊዝኛ፣ አማርኛ።',
    hero_cta_student: 'ምዝገባ ጀምር',
    hero_cta_login: 'ወደ ሒሳብ ግባ',

    features_title: 'ምን እናቀርባለን?',
    f_talqeen: 'ተልቂን',
    f_talqeen_d: 'የተጅዊድ ማስተካከያ እና ተልቂን።',
    f_hifz: 'ሒፍዝ',
    f_hifz_d: 'የቁርአን ሒፍዝ ፕሮግራሞች ከክትትል ጋር።',
    f_ijaza: 'ኢጃዛ (ሐፍስ አን ዐሲም)',
    f_ijaza_d: 'ኢጃዛ በሰነድ በሐፍስ አን ዐሲም ሪዋያ።',
    f_qiraat: 'ቂራኣት ሰብዐ',
    f_qiraat_d: 'ሰባቱን ቂራኣት በቂራኣ ሊቃውንት ዘዴ ማጥናት።',

    contact_title: 'አግኙን',
    contact_email: 'ኢሜይል',
    contact_tg: 'ቴሌግራም',
    contact_bot: 'ቦት',
    contact_telebirr: 'ቴሌብር',
    contact_mpesa: 'ኤም-ፔሳ',

    login_title: 'ወደ ሒሳብ ግባ',
    register_title: 'አዲስ ተማሪ ምዝገባ',
    field_email: 'ኢሜይል',
    field_password: 'የይለፍ ቃል',
    field_full_name: 'ሙሉ ስም',
    field_phone: 'ስልክ',
    field_language: 'ቋንቋ',
    btn_login: 'ግባ',
    btn_register: 'ተመዝገብ',
    have_account: 'ሒሳብ አለዎት? ይግቡ',
    no_account: 'ሒሳብ የለዎትም? ይመዝገቡ',

    dash_welcome: 'እንኳን ደህና መጡ',
    dash_balance: 'የደቂቃ ቀሪ',
    dash_student_no: 'የተማሪ ቁጥር',
    dash_program: 'ፕሮግራም',
    dash_wallet: 'ቦርሳ',
    dash_ledger: 'የእንቅስቃሴ መዝገብ',
    dash_buy: 'ደቂቃ ግዛ',
    dash_packages: 'ያሉ ጥቅሎች',
    dash_orders: 'የእኔ ትዕዛዞች',
    dash_receipt: 'ደረሰኝ ላክ',
    dash_sessions: 'ክፍለ ጊዜዎች',
    dash_library: 'ቤተ መጻሕፍት',
    dash_certificates: 'የእኔ ሰርተፊኬቶች እና ኢጃዛዎች',
    dash_support: 'ድጋፍ',
    dash_book: 'ክፍለ ጊዜ ያዙ',
    dash_send: 'ላክ',

    admin_title: 'የአስተዳደር ፓነል',
    admin_stats: 'ስታቲስቲክስ',
    admin_students: 'ተማሪዎች',
    admin_receipts: 'በመጠባበቅ ላይ ያሉ ደረሰኞች',
    admin_add_minutes: 'ደቂቃ ጨምር',
    admin_ijaza: 'ኢጃዛ ስጥ',
    admin_library: 'ቤተ መጻሕፍት',
    admin_tickets: 'የድጋፍ ትኬቶች',
    admin_audit: 'የኦዲት መዝገብ',
    admin_broadcast: 'ማስታወቂያ',

    lbl_name: 'ስም',
    lbl_amount: 'መጠን',
    lbl_minutes: 'ደቂቃዎች',
    lbl_status: 'ሁኔታ',
    lbl_date: 'ቀን',
    lbl_actions: 'ተግባሮች',
    lbl_price: 'ዋጋ',
    lbl_pack: 'ጥቅል',
    lbl_reason: 'ምክንያት',

    btn_approve: 'ተቀበል',
    btn_reject: 'ውድቅ',
    btn_save: 'አስቀምጥ',
    btn_cancel: 'ሰርዝ',
    btn_close: 'ዝጋ',
    btn_issue: 'ስጥ',
    btn_add: 'ጨምር',
    btn_book: 'ያዙ',

    status_pending: 'በመጠባበቅ',
    status_paid: 'ተከፍሏል',
    status_approved: 'ተቀብሏል',
    status_rejected: 'ውድቅ',
    status_scheduled: 'ተይዟል',
    status_cancelled: 'ተሰርዟል',
    status_in_progress: 'በሂደት',
    status_open: 'ክፍት',
    status_closed: 'ተዘግቷል',

    msg_saved: '✅ ተቀምጧል',
    msg_error: '⚠️ ስህተት ተከስቷል',
    msg_loading: '⏳ በመጫን ላይ...',
    msg_empty: 'ምንም መረጃ የለም።',
    msg_login_required: 'መጀመሪያ ይግቡ።',

    verify_title: 'ሰነድ አረጋግጥ',
    verify_placeholder: 'የሰነድ ቁጥር ያስገቡ (ለምሳሌ IJZ-XXXX)',
    verify_btn: 'አረጋግጥ',
    verify_valid: '✅ ትክክለኛ ሰነድ',
    verify_invalid: '❌ ሰነድ አልተገኘም',
    verify_holder: 'ባለቤት',
    verify_teacher: 'ሼኽ (ሙጂዝ)',
    verify_issued: 'የተሰጠበት ቀን',
  },
};

export function currentLang() {
  return localStorage.getItem('lang') || 'ar';
}

export function setLang(lang) {
  if (!translations[lang]) return;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  applyTranslations();
  window.dispatchEvent(new CustomEvent('lang:change', { detail: { lang } }));
}

export function t(key) {
  const lang = currentLang();
  return translations[lang]?.[key] ?? translations.ar[key] ?? key;
}

export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
}

export function initI18n() {
  const lang = currentLang();
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  applyTranslations();
}

export function buildLangSwitcher(container) {
  const langs = [
    { code: 'ar', label: '🇸🇦 العربية' },
    { code: 'en', label: '🇬🇧 English' },
    { code: 'am', label: '🇪🇹 አማርኛ' },
  ];
  const cur = currentLang();
  container.innerHTML = '';
  langs.forEach((l) => {
    const btn = document.createElement('button');
    btn.textContent = l.label;
    if (l.code === cur) btn.classList.add('active');
    btn.addEventListener('click', () => {
      setLang(l.code);
      container.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
    container.appendChild(btn);
  });
}

export function pickName(obj, lang = currentLang()) {
  if (!obj) return '—';
  if (lang === 'en') return obj.name_en || obj.name_ar || '—';
  if (lang === 'am') return obj.name_am || obj.name_ar || '—';
  return obj.name_ar || '—';
}