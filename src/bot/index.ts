import { Telegraf } from 'telegraf';
import { ServerModel, SettingsModel, UserModel, AdminModel } from '../models/index.js';
import * as api from './api.js';
import { ADMIN_IDS, userSteps, adminSteps } from './config.js';
import { mainKeyboard } from './keyboards.js';

let botInstance: Telegraf | null = null;

export function setupBot(token: string) {
    if (botInstance) {
        return botInstance;
    }
    
    // Create the bot
    const bot = new Telegraf(token);

    // Simple middleware to register user
    bot.use(async (ctx, next) => {
        const userId = ctx.from?.id?.toString();
        if (userId) {
            try {
                let user = await UserModel.findOne({ telegramId: userId });
                if (!user) {
                    await UserModel.create({ telegramId: userId, configs: [], stats: { totalSpent: 0, buyCount: 0, renewCount: 0 } });
                } else if (user.isBanned) {
                    await ctx.reply('❌ شما مسدود شده‌اید.');
                    return;
                }
            } catch (err) {
                console.error("Error in bot middleware:", err);
            }
        }
        return next();
    });

    bot.start((ctx) => {
        const username = ctx.from?.username ? `@${ctx.from.username}` : 'ندارد';
        ctx.reply(`سلام! خوش اومدی 🌹\n\n👤 <b>آیدی تلگرام:</b> ${username}\n🆔 <b>کد یکتای شما:</b> <code>${ctx.from.id}</code>\n\n👇 لطفاً یک گزینه رو انتخاب کن:`, { 
            parse_mode: 'HTML', 
            ...mainKeyboard 
        });
    });

    bot.hears('👤 داشبورد من', async (ctx) => {
        const userId = ctx.from?.id?.toString();
        const user = await UserModel.findOne({ telegramId: userId });
        
        if (!user || user.configs.length === 0) {
            return ctx.reply('شما هنوز اکانتی ندارید.');
        }

        const activeCount = user.configs.filter(c => !c.deletedFromPanel).length;
        
        ctx.reply(`👤 <b>داشبورد مدیریت حساب</b>\n\n🆔 شناسه کاربری: <code>${userId}</code>\n🟢 تعداد اکانت‌های شما: <b>${activeCount}</b>`, {
            parse_mode: 'HTML'
        });
    });

    bot.launch({ dropPendingUpdates: true })
        .then(() => {
            console.log('✅ Bot started!');
            
            // Enable graceful stop
            process.once('SIGINT', () => {
                console.log('Stopping bot... (SIGINT)');
                bot.stop('SIGINT');
            });
            process.once('SIGTERM', () => {
                console.log('Stopping bot... (SIGTERM)');
                bot.stop('SIGTERM');
            });
        })
        .catch(err => {
            console.error('Failed to start bot:', err);
            if (err.response && err.response.error_code === 409) {
                console.error("❌ ERROR: Conflict! Another instance of this bot is already running elsewhere.");
                console.error("Please make sure you aren't running this bot on your local machine or another server at the same time.");
            }
        });
        
    botInstance = bot;
    return bot;
}

export function getBotInstance() {
    return botInstance;
}
