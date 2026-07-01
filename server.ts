import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const DB_PATH = process.env.DB_PATH || "/root/telbot-test/telbot.db";
const otpStorage = new Map<string, { code: string, expiresAt: number }>();
// --- توابع مدیریت دیتابیس لوکال ---
function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const defaultDb = { settings: {}, plans: {}, servers: {}, users: {}, configs: {} };
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf8');
      return defaultDb;
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading DB:", err);
    return { settings: {}, plans: {}, servers: {}, users: {}, configs: {} };
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing DB:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", dbState: fs.existsSync(DB_PATH) ? "connected" : "missing" });
  });

  // --- Auth Routes ---
  app.post("/api/auth/request-code", async (req, res) => {
    try {
      const { telegramId } = req.body;
      const db = readDb();
      const user = db.users[telegramId];

      // بررسی وجود کاربر و ادمین بودن
      if (!user || !user.isAdmin) {
        return res.status(403).json({ success: false, message: "شما دسترسی ادمین ندارید یا آیدی اشتباه است." });
      }

      // تولید کد ۵ رقمی
      const code = Math.floor(10000 + Math.random() * 90000).toString();
      otpStorage.set(telegramId, { code, expiresAt: Date.now() + 5 * 60 * 1000 }); // اعتبار 5 دقیقه

      // ارسال پیام به تلگرام از طریق API مستقیم (بدون نیاز به کتابخانه اضافی)
      const botToken = process.env.BOT_TOKEN;
      if (botToken) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramId,
            text: `🔐 <b>کد ورود به پنل مدیریت سایت:</b>\n\n<code>${code}</code>\n\n⏳ این کد فقط ۵ دقیقه اعتبار دارد.`,
            parse_mode: "HTML"
          })
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
      const record = otpStorage.get(telegramId);

      if (!record || record.expiresAt < Date.now() || record.code !== code) {
        return res.status(401).json({ success: false, message: "کد نامعتبر است یا منقضی شده." });
      }

      // حذف کد پس از استفاده موفق
      otpStorage.delete(telegramId);

      // ساخت یک توکن ساده برای نشست فعلی (در مرورگر)
      const token = Buffer.from(`${telegramId}-admin-${Date.now()}`).toString('base64');
      
      res.json({ success: true, token });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  // Settings & Dashboard Stats
  app.get("/api/settings", (req, res) => {
    try {
      const db = readDb();
      res.json({ success: true, settings: db.settings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/settings", (req, res) => {
    try {
      const db = readDb();
      db.settings = { ...db.settings, ...req.body };
      writeDb(db);
      res.json({ success: true, settings: db.settings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Plans
  app.get("/api/plans", (req, res) => {
    try {
      const db = readDb();
      const plansArray = Object.values(db.plans || {}).sort((a: any, b: any) => a.order - b.order);
      res.json({ success: true, plans: plansArray });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/plans", (req, res) => {
    try {
      const db = readDb();
      const newPlansArray = req.body.plans || [];
      db.plans = {};
      newPlansArray.forEach((p: any) => {
        db.plans[p.id] = p;
      });
      writeDb(db);
      res.json({ success: true, plans: newPlansArray });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Users
  app.get("/api/users", (req, res) => {
    try {
      const db = readDb();
      // تبدیل آبجکت یوزرها به آرایه و چسباندن کانفیگ‌های هر نفر به خودش برای نمایش در سایت
      const usersArray = Object.values(db.users || {}).map((u: any) => {
        const userConfigs = Object.values(db.configs || {}).filter((c: any) => c.telegramId === String(u.telegramId));
        return { ...u, configs: userConfigs };
      });
      res.json({ success: true, users: usersArray });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/users/:id/block", (req, res) => {
    try {
      const db = readDb();
      const userId = String(req.params.id);
      if (db.users[userId]) {
        db.users[userId].isBanned = req.body.isBanned;
        writeDb(db);
        res.json({ success: true, user: db.users[userId] });
      } else {
        res.status(404).json({ success: false, message: "User not found" });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/users/:id/vip", (req, res) => {
    try {
      const db = readDb();
      const userId = String(req.params.id);
      if (db.users[userId]) {
        db.users[userId].isVip = req.body.isVip;
        
        // آپدیت همزمان وضعیت VIP در کانفیگ‌های این شخص
        Object.keys(db.configs || {}).forEach(uuid => {
          if (db.configs[uuid].telegramId === userId) {
            db.configs[uuid].isVip = req.body.isVip;
          }
        });

        writeDb(db);
        res.json({ success: true, user: db.users[userId] });
      } else {
        res.status(404).json({ success: false, message: "User not found" });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Servers
  app.get("/api/servers", (req, res) => {
    try {
      const db = readDb();
      res.json({ success: true, servers: Object.values(db.servers || {}) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/servers", (req, res) => {
    try {
      const db = readDb();
      const newServer = req.body;
      if (!db.servers) db.servers = {};
      db.servers[newServer.id] = newServer;
      writeDb(db);
      res.json({ success: true, server: newServer });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  
  app.put("/api/servers/:id", (req, res) => {
    try {
      const db = readDb();
      const serverId = req.params.id;
      if (db.servers && db.servers[serverId]) {
        db.servers[serverId] = { ...db.servers[serverId], ...req.body };
        writeDb(db);
        res.json({ success: true, server: db.servers[serverId] });
      } else {
        res.status(404).json({ success: false, message: "Server not found" });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete("/api/servers/:id", (req, res) => {
    try {
      const db = readDb();
      const serverId = req.params.id;
      if (db.servers && db.servers[serverId]) {
        delete db.servers[serverId];
        writeDb(db);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();