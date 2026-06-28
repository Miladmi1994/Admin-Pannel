import express from "express";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { ServerModel, SettingsModel, UserModel, AdminModel } from "./src/models/index.js";
import { setupBot } from "./src/bot/index.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cyphernet";
const BOT_TOKEN = process.env.BOT_TOKEN;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(cors());
  app.use(express.json());

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully");
    
    // Initialize default settings if they don't exist
    const settings = await SettingsModel.findOne();
    if (!settings) {
      await SettingsModel.create({
        salesOpen: true,
        maintenance: false,
        plans: [
          { id: '30', name: '30 گیگ یک ماهه', gb: 30, days: 30, price: 180000, order: 1, showInNew: true, showInRenew: true, btnText: '📦 30 گیگ - 1 ماهه (180,000 تومان)', sold: 0 },
          { id: '50', name: '50 گیگ یک ماهه', gb: 50, days: 30, price: 275000, order: 2, showInNew: true, showInRenew: true, btnText: '📦 50 گیگ - 1 ماهه (275,000 تومان)', sold: 0 },
          { id: '100', name: '100 گیگ دو ماهه', gb: 100, days: 60, price: 500000, order: 3, showInNew: true, showInRenew: true, btnText: '📦 100 گیگ - 2 ماهه (500,000 تومان)', sold: 0 }
        ],
        totalIncome: 0,
        successfulSales: 0,
        abandonedCarts: 0,
        testToBuyConversion: 0
      });
      console.log("Created default settings");
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }

  // Start the bot if token is present
  if (BOT_TOKEN) {
    try {
      setupBot(BOT_TOKEN);
    } catch (error) {
      console.error("Error setting up the bot:", error);
    }
  } else {
    console.warn("No BOT_TOKEN found. Bot will not be started.");
  }

  // --- API Routes ---

  // Health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", dbState: mongoose.connection.readyState });
  });

  // Settings & Dashboard Stats
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await SettingsModel.findOne();
      res.json({ success: true, settings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const settings = await SettingsModel.findOne();
      if (settings) {
        if (req.body.salesOpen !== undefined) settings.salesOpen = req.body.salesOpen;
        if (req.body.maintenance !== undefined) settings.maintenance = req.body.maintenance;
        if (req.body.activeServerId !== undefined) settings.activeServerId = req.body.activeServerId;
        if (req.body.activeVipServerId !== undefined) settings.activeVipServerId = req.body.activeVipServerId;
        await settings.save();
      }
      res.json({ success: true, settings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Plans
  app.get("/api/plans", async (req, res) => {
    try {
      const settings = await SettingsModel.findOne();
      res.json({ success: true, plans: settings?.plans || [] });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/plans", async (req, res) => {
    try {
      const settings = await SettingsModel.findOne();
      if (settings) {
        settings.plans = req.body.plans;
        await settings.save();
      }
      res.json({ success: true, plans: settings?.plans });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await UserModel.find();
      res.json({ success: true, users });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/users/:id/block", async (req, res) => {
    try {
      const user = await UserModel.findOne({ telegramId: req.params.id });
      if (user) {
        user.isBanned = req.body.isBanned;
        await user.save();
        res.json({ success: true, user });
      } else {
        res.status(404).json({ success: false, message: "User not found" });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/users/:id/vip", async (req, res) => {
    try {
      const user = await UserModel.findOne({ telegramId: req.params.id });
      if (user) {
        user.isVip = req.body.isVip;
        // Optionally update all their configs
        user.configs.forEach(c => c.isVip = req.body.isVip);
        await user.save();
        res.json({ success: true, user });
      } else {
        res.status(404).json({ success: false, message: "User not found" });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Add more bot-specific APIs here for bot actions (like record purchase)
  app.post("/api/bot/purchase", async (req, res) => {
    // API used by the telegram bot to record a purchase
    try {
      const { telegramId, planId, configName, orderId, price, serverId, uuid, email, isVip } = req.body;
      
      let user = await UserModel.findOne({ telegramId });
      if (!user) {
        user = new UserModel({ telegramId, configs: [], stats: { totalSpent: 0, buyCount: 0, renewCount: 0 } });
      }
      
      user.configs.push({
        email, uuid, name: configName, serverId, isVip, orderId
      });
      user.stats.totalSpent += price;
      user.stats.buyCount += 1;
      await user.save();
      
      const settings = await SettingsModel.findOne();
      if (settings) {
        settings.totalIncome += price;
        settings.successfulSales += 1;
        const plan = settings.plans.find(p => p.id === planId);
        if (plan) {
          plan.sold = (plan.sold || 0) + 1;
        }
        await settings.save();
      }
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Servers
  app.get("/api/servers", async (req, res) => {
    try {
      const servers = await ServerModel.find();
      res.json({ success: true, servers });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/servers", async (req, res) => {
    try {
      const server = new ServerModel(req.body);
      await server.save();
      res.json({ success: true, server });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  
  app.put("/api/servers/:id", async (req, res) => {
    try {
      const server = await ServerModel.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
      res.json({ success: true, server });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete("/api/servers/:id", async (req, res) => {
    try {
      await ServerModel.findOneAndDelete({ id: req.params.id });
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
