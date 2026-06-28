import { Markup } from 'telegraf';

export const mainKeyboard = Markup.keyboard([
    ['👤 داشبورد من', '📥 اپلیکیشن و آموزش'],
    [Markup.button.contactRequest('🎁 دریافت تست (نیاز به شماره)')],
    ['🛒 خرید مستقیم (بدون شماره)'],
    ['🔄 تمدید سرویس'],
    ['🛠 پشتیبانی و گزارش خطا']
]).resize();

export const chatKeyboard = Markup.keyboard([
    ['❌ خروج از چت پشتیبانی']
]).resize();

export const cancelBtn = Markup.button.callback('❌ لغو', 'cancel_flow');

export const rulesKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⚠️ قوانین را می‌پذیرم', 'accept_rules')],
    [cancelBtn]
]);

export const getPlansKeyboard = (userId: string, db: any) => {
    const buttons = [
        [Markup.button.callback('📦 30 گیگ - 1 ماهه (180,000 تومان)', 'plan_30')],
        [Markup.button.callback('📦 50 گیگ - 1 ماهه (275,000 تومان)', 'plan_50')],
        [Markup.button.callback('📦 100 گیگ - 2 ماهه (500,000 تومان)', 'plan_100')]
    ];

    // TODO: Dynamic check with DB
    buttons.push([Markup.button.callback('🔙 بازگشت', 'back_rules'), cancelBtn]);
    return Markup.inlineKeyboard(buttons);
};

export const receiptKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 بازگشت', 'back_plans'), cancelBtn]
]);

export const supportMenuKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔌 گزارش وصل نشدن', 'support_error')],
    [cancelBtn]
]);

export const getAdminKeyboard = (db: any) => Markup.inlineKeyboard([
    [
        Markup.button.callback(`فروش: ${db.salesOpen ? '🟢 باز' : '🔴 بسته'}`, 'toggle_sales'),
        Markup.button.callback(`بروزرسانی: ${db.maintenance ? '🔴 روشن' : '🟢 خاموش'}`, 'toggle_maint')
    ],
    [
        Markup.button.callback('👑 اعضای VIP', 'admin_vip_menu'),
        Markup.button.callback('📦 پکیج‌ها', 'admin_plans_menu')
    ],
    [
        Markup.button.callback('👥 مدیریت کاربران', 'admin_users_menu'),
        Markup.button.callback('🖥 مدیریت سرورها', 'admin_servers_menu')
    ],
    [
        Markup.button.callback('💰 مالی و فروش', 'admin_finance_menu'),
        Markup.button.callback('📊 آمار و مارکتینگ', 'admin_marketing_menu')
    ]
]);

export const adminMarketingMenu = Markup.inlineKeyboard([
    [Markup.button.callback('👥 آمار کاربران', 'marketing_users'), Markup.button.callback('📈 آمار فروش', 'marketing_sales')],
    [Markup.button.callback('🔍 جستجوی پیشرفته کاربر', 'marketing_search')],
    [Markup.button.callback('📢 ارسال پیام همگانی', 'admin_broadcast')],
    [Markup.button.callback('🔙 بازگشت', 'back_admin')]
]);

export const adminServersMenu = Markup.inlineKeyboard([
    [Markup.button.callback('➕ افزودن سرور جدید', 'admin_add_server')],
    [Markup.button.callback('📋 لیست سرورها (آمار)', 'admin_list_servers')],
    [Markup.button.callback('✅ سرور پیش‌فرض عادی', 'admin_set_active_server'), Markup.button.callback('👑 سرور پیش‌فرض VIP', 'admin_set_vip_server')],
    [Markup.button.callback('➖ حذف سرور', 'admin_remove_server')],
    [Markup.button.callback('🔙 بازگشت', 'back_admin')]
]);

export const adminUsersMenu = Markup.inlineKeyboard([
    [Markup.button.callback('➖ حذف ادمین', 'admin_remove_admin'), Markup.button.callback('➕ افزودن ادمین جدید', 'admin_add_admin')],
    [Markup.button.callback('📋 لیست ادمین‌ها', 'admin_list_admins')],
    [Markup.button.callback('🚫 مسدود سازی کاربر', 'admin_ban_user'), Markup.button.callback('✅ رفع مسدودسازی', 'admin_unban_user')],
    [Markup.button.callback('🧹 پاک کردن تست کاربر', 'admin_clear_test'), Markup.button.callback('🗑 ریست کامل کاربر', 'admin_reset_user')],
    [Markup.button.callback('🔙 بازگشت', 'back_admin')]
]);

export const adminFinanceMenu = Markup.inlineKeyboard([
    [Markup.button.callback('🛒 ثبت دستی خرید', 'admin_manual_buy')],
    [Markup.button.callback('🧹 صفر کردن آمار مالی', 'reset_finance')],
    [Markup.button.callback('🔙 بازگشت', 'back_admin')]
]);

export const adminVipMenu = Markup.inlineKeyboard([
    [Markup.button.callback('➕ افزودن عضو VIP', 'admin_add_vip')],
    [Markup.button.callback('➖ حذف عضو VIP', 'admin_remove_vip')],
    [Markup.button.callback('📋 مشاهده اعضای VIP', 'admin_list_vip')],
    [Markup.button.callback('🔙 بازگشت', 'back_admin')]
]);
