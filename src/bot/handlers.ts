import { Telegraf } from 'telegraf';
import { ServerModel, SettingsModel, UserModel, AdminModel } from '../models/index.js';
import * as api from './api.js';
import { ADMIN_IDS, userSteps, adminSteps } from './config.js';
import { mainKeyboard } from './keyboards.js';

export function setupHandlers(bot: Telegraf) {
    // We'll put all the bot logic here
}
