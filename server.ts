import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
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

  app.get("/api/servers", (req, res) => {
    try {
      res.json({ success: true, servers: getServers(DB_PATH) });
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
