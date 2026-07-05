import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import { getDatabase } from "./db/sqlite-store.js";
import { createServer as createViteServer } from "vite";
import {
  openDatabase,
  isSqlitePath,
  isAdmin,
  getHealth,
  getSettings,
  updateSettings,
  getPlans,
  savePlans,
  getUsers,
  setUserBanned,
  setUserVip,
  getServers,
  createServer,
  updateServer,
  deleteServer,
  getDbStats,
  getFinance,
  resetFinanceStats,
  getAdmins,
  createAdmin,
  deleteAdmin,
  getMarketing,
} from "./db/repository.js";

dotenv.config();

const APP_ENV = (process.env.APP_ENV || process.env.NODE_ENV || "development").toLowerCase();
const isProduction = APP_ENV === "production";
const isStaging = APP_ENV === "staging";
const isDeployed = isProduction || isStaging;

const DB_PATH = process.env.DB_PATH || "/root/telbot-test/telbot.db";
const APP_URL = (process.env.APP_URL || "").replace(/\/$/, "");
const otpStorage = new Map<string, { code: string; expiresAt: number }>();

if (isSqlitePath(DB_PATH)) {
  try {
    openDatabase(DB_PATH);
    console.log(`SQLite database opened: ${DB_PATH}`);
  } catch (err) {
    console.error("Failed to open SQLite database:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  if (isProduction) {
    app.set("trust proxy", 1);
  }

  app.use((_req, res, next) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet, noimageindex");
    next();
  });

  if (isProduction && APP_URL) {
    app.use(cors({ origin: [APP_URL, `http://localhost:${PORT}`], credentials: true }));
  } else {
    app.use(cors());
  }
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    const health = getHealth(DB_PATH);
    const stats = health.connected && isSqlitePath(DB_PATH) ? getDbStats(DB_PATH) : null;
    const publicUrl =
      APP_URL ||
      (req.get("x-forwarded-proto") && req.get("host")
        ? `${req.get("x-forwarded-proto")}://${req.get("host")}`
        : null);
    res.json({
      status: "ok",
      environment: APP_ENV,
      dbState: health.connected ? "connected" : "missing",
      dbMode: health.mode,
      dbPath: path.basename(DB_PATH),
      publicUrl,
      ...(stats ? { counts: stats } : {}),
    });
  });

  app.post("/api/auth/request-code", async (req, res) => {
    try {
      const { telegramId } = req.body;

      if (!isAdmin(DB_PATH, String(telegramId))) {
        return res.status(403).json({
          success: false,
          message: "شما دسترسی ادمین ندارید یا آیدی اشتباه است.",
        });
      }

      const code = Math.floor(10000 + Math.random() * 90000).toString();
      const chatId = String(telegramId).trim();
      otpStorage.set(chatId, { code, expiresAt: Date.now() + 5 * 60 * 1000 });

      const botToken = process.env.BOT_TOKEN;
      if (botToken) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🔐 <b>کد ورود به پنل مدیریت سایت:</b>\n\n<code>${code}</code>\n\n⏳ این کد فقط ۵ دقیقه اعتبار دارد.`,
            parse_mode: "HTML",
          }),
        });
      }

      res.json({ success: true, message: "کد تایید به پی‌وی تلگرام شما ارسال شد." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: "خطای سرور: " + err.message });
    }
  });

  app.post("/api/auth/verify-code", (req, res) => {
    try {
      const { telegramId, code } = req.body;
      const record = otpStorage.get(String(telegramId));

      if (!record || record.expiresAt < Date.now() || record.code !== code) {
        return res.status(401).json({ success: false, message: "کد نامعتبر است یا منقضی شده." });
      }

      otpStorage.delete(String(telegramId));
      const token = Buffer.from(`${telegramId}-admin-${Date.now()}`).toString("base64");
      res.json({ success: true, token });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/settings", (req, res) => {
    try {
      res.json({ success: true, settings: getSettings(DB_PATH) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/settings", (req, res) => {
    try {
      const settings = updateSettings(DB_PATH, req.body);
      res.json({ success: true, settings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/plans", (req, res) => {
    try {
      res.json({ success: true, plans: getPlans(DB_PATH) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/plans", (req, res) => {
    try {
      const plans = savePlans(DB_PATH, req.body.plans || []);
      res.json({ success: true, plans });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/users", (req, res) => {
    try {
      res.json({ success: true, users: getUsers(DB_PATH) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/users/:id/block", (req, res) => {
    try {
      const user = setUserBanned(DB_PATH, String(req.params.id), req.body.isBanned);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/users/:id/vip", (req, res) => {
    try {
      const user = setUserVip(DB_PATH, String(req.params.id), req.body.isVip);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // اندپوینت ارسال کانفیگ به تلگرام
  // اندپوینت ارسال کانفیگ به تلگرام
  app.post("/api/users/:id/configs/:configId/send", async (req, res) => {
    try {
      const { id, configId } = req.params;
      const botToken = process.env.BOT_TOKEN;

      if (!botToken) {
        return res.status(500).json({ success: false, message: "توکن ربات در تنظیمات سرور یافت نشد." });
      }

      // در این بخش باید کوئری دیتابیس زده شود تا لینک اصلی کانفیگ/سابسکریپشن استخراج شود.
      // فعلاً برای تست صحت ارتباط، این پیام تستی ارسال می‌شود:
      const messageText = `✅ <b>کانفیگ شما آماده است</b>\n\nآیدی کانفیگ: <code>${configId}</code>\n\n(لینک واقعی پس از اتصال به دیتابیس در اینجا قرار می‌گیرد)`;

      const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: id,
          text: messageText,
          parse_mode: "HTML",
        }),
      });

      const tgData = await tgResponse.json();

      if (!tgData.ok) {
        console.error("خطای تلگرام:", tgData);
        return res.status(500).json({ success: false, message: `خطا از سمت تلگرام: ${tgData.description}` });
      }

      res.json({ success: true, message: "پیام با موفقیت به ربات ارسال شد." });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // اندپوینت تمدید کانفیگ
  // اندپوینت تمدید کانفیگ
  app.post("/api/users/:id/configs/:configId/renew", async (req, res) => {
    try {
      const { configId } = req.params;
      const db = getDatabase();

      // ۱. پیدا کردن کانفیگ و سرور از دیتابیس
      const service = db.prepare("SELECT * FROM services WHERE uuid = ?").get(configId) as any;
      if (!service) {
         return res.status(404).json({ success: false, message: "کانفیگ یافت نشد." });
      }

      const server = db.prepare("SELECT * FROM servers WHERE id = ?").get(service.server_id) as any;
      if (!server) {
         return res.status(404).json({ success: false, message: "سرور مربوط به این کانفیگ یافت نشد." });
      }

      // افزودن ۳۰ روز به زمان فعلی (تمدید یک ماهه)
      const newExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000);
      const totalBytes = service.panel_total || 0; // نگه داشتن حجم قبلی

      // ۲. ارتباط با پنل (مشابه منطق api.js ربات)
      // الف: حذف اکانت قبلی برای صفر کردن مصرف
      await fetch(`${server.panel_url}${server.web_base_path}/panel/api/clients/del/${encodeURIComponent(service.email)}?keepTraffic=0`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${server.api_token}` }
      });

      // ب: ساخت مجدد اکانت با زمان جدید
      const subId = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
      const addRes = await fetch(`${server.panel_url}${server.web_base_path}/panel/api/clients/add`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${server.api_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client: {
            id: configId,
            email: service.email,
            totalGB: totalBytes,
            expiryTime: newExpiry,
            enable: true,
            limitIp: 0,
            subId: subId
          },
          inboundIds: [server.inbound_id || 1]
        })
      });

      const addData = await addRes.json();
      if (!addData.success) {
         return res.status(500).json({ success: false, message: "خطا در پنل: " + addData.msg });
      }

      // ۳. آپدیت دیتابیس سایت: صفر کردن حجم مصرفی و ثبت تاریخ انقضای جدید
      db.prepare("UPDATE services SET panel_used = 0, panel_expiry = ? WHERE uuid = ?").run(newExpiry, configId);

      res.json({ success: true, message: "کانفیگ با موفقیت تمدید و در پنل سرور ریست شد." });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // اندپوینت حذف کانفیگ (فقط پنل یا پنل و دیتابیس)
  app.post("/api/configs/:configId/delete", async (req, res) => {
    try {
      const { configId } = req.params;
      const { mode } = req.body; 
      const db = getDatabase();

      const service = db.prepare("SELECT * FROM services WHERE uuid = ?").get(configId) as any;
      if (!service) {
         return res.status(404).json({ success: false, message: "کانفیگ در دیتابیس یافت نشد." });
      }

      const server = db.prepare("SELECT * FROM servers WHERE id = ?").get(service.server_id) as any;

      // ۱. حذف از روی پنل سرور (در صورت وجود سرور)
      if (server) {
        await fetch(`${server.panel_url}${server.web_base_path}/panel/api/clients/del/${encodeURIComponent(service.email)}?keepTraffic=0`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${server.api_token}` }
        });
      }

      // ۲. مدیریت دیتابیس بر اساس انتخاب ادمین (mode)
      if (mode === 'both') {
        db.prepare("DELETE FROM services WHERE uuid = ?").run(configId);
      } else {
        db.prepare("UPDATE services SET deleted_from_panel = 1 WHERE uuid = ?").run(configId);
      }

      res.json({ success: true, message: "عملیات حذف با موفقیت روی سرور و دیتابیس انجام شد." });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/servers", (req, res) => {
    try {
      res.json({ success: true, servers: getServers(DB_PATH) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // مانیتورینگ لحظه‌ای سرورها (دریافت وضعیت CPU، RAM و...)
app.get("/api/servers/stats", async (req, res) => {
  try {
    const servers = await query("SELECT * FROM servers");
    
    // اینجا برای هر سرور یک درخواست به API پنل آن می‌فرستیم
    const statsPromises = servers.map(async (server) => {
      try {
        /*
          محل قرارگیری کد اصلی شما در آینده:
          const response = await fetch(`${server.panel_url}/api/status`, { 
             headers: { 'Authorization': `Bearer ${server.api_token}` }
          });
          const data = await response.json();
          return { id: server.id, name: server.name, cpu: data.cpu, ... }
        */

        // دیتای شبیه‌سازی شده برای تست ظاهر (بعد از اتصال به API واقعی این بخش را پاک کنید)
        const fakeCpu = Math.floor(Math.random() * 40) + 10;
        const fakeRam = Math.floor(Math.random() * 60) + 20;
        
        return {
          id: server.id,
          name: server.name,
          status: server.status || 'فعال',
          domain: server.domain || server.panel_url,
          cpu: fakeCpu,
          ram: fakeRam,
          uptime: "۱۲ روز و ۴ ساعت",
          onlineUsers: Math.floor(Math.random() * 200) + 50
        };
      } catch (err) {
         return { id: server.id, name: server.name, status: 'قطعی ارتباط', domain: server.panel_url, cpu: 0, ram: 0, uptime: '-', onlineUsers: 0 };
      }
    });

    const serversStats = await Promise.all(statsPromises);
    res.json({ success: true, stats: serversStats });

  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

  app.post("/api/servers", (req, res) => {
    try {
      const server = createServer(DB_PATH, req.body);
      res.json({ success: true, server });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.put("/api/servers/:id", (req, res) => {
    try {
      const server = updateServer(DB_PATH, req.params.id, req.body);
      if (!server) {
        return res.status(404).json({ success: false, message: "Server not found" });
      }
      res.json({ success: true, server });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete("/api/servers/:id", (req, res) => {
    try {
      deleteServer(DB_PATH, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/finance", (req, res) => {
    try {
      res.json({ success: true, finance: getFinance(DB_PATH) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/finance/reset", (req, res) => {
    try {
      const finance = resetFinanceStats(DB_PATH);
      res.json({ success: true, finance });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/admins", (req, res) => {
    try {
      res.json({ success: true, admins: getAdmins(DB_PATH) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/admins", (req, res) => {
    try {
      const { telegramId, name } = req.body;
      const admin = createAdmin(DB_PATH, telegramId, name);
      res.json({ success: true, admin });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.delete("/api/admins/:id", (req, res) => {
    try {
      const deleted = deleteAdmin(DB_PATH, req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Admin not found" });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.get("/api/marketing", (req, res) => {
    try {
      res.json({ success: true, marketing: getMarketing(DB_PATH) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  if (isDeployed) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("/robots.txt", (_req, res) => {
      res.type("text/plain").send("User-agent: *\nDisallow: /\n");
    });
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (${APP_ENV})`);
    console.log(`Database: ${DB_PATH} (${isSqlitePath(DB_PATH) ? "SQLite" : "JSON"})`);
    if (isProduction && APP_URL) console.log(`Public URL: ${APP_URL}`);
    else if (isStaging) console.log(`Staging: direct access on port ${PORT} (no domain)`);
  });
}

startServer();
