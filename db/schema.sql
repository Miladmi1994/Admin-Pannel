-- Telbot SQLite schema (must match bot db/schema.sql)

CREATE TABLE IF NOT EXISTS global_stats (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_income REAL NOT NULL DEFAULT 0,
  successful_sales INTEGER NOT NULL DEFAULT 0,
  abandoned_carts INTEGER NOT NULL DEFAULT 0,
  test_to_buy_conversion REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  sales_open INTEGER NOT NULL DEFAULT 1,
  maintenance INTEGER NOT NULL DEFAULT 0,
  active_server_id TEXT,
  active_vip_server_id TEXT
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gb REAL NOT NULL DEFAULT 0,
  days INTEGER NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  btn_text TEXT,
  sold INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  show_in_new INTEGER NOT NULL DEFAULT 1,
  show_in_renew INTEGER NOT NULL DEFAULT 1,
  target_user_id TEXT
);

CREATE TABLE IF NOT EXISTS servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  panel_url TEXT,
  web_base_path TEXT,
  api_token TEXT,
  inbound_id INTEGER,
  domain TEXT,
  sni TEXT,
  path TEXT,
  is_migrating INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admins (
  telegram_id TEXT PRIMARY KEY,
  name TEXT
);

CREATE TABLE IF NOT EXISTS users (
  telegram_id TEXT PRIMARY KEY,
  is_banned INTEGER NOT NULL DEFAULT 0,
  is_vip INTEGER NOT NULL DEFAULT 0,
  is_test INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_stats (
  telegram_id TEXT PRIMARY KEY,
  total_spent REAL NOT NULL DEFAULT 0,
  buy_count INTEGER NOT NULL DEFAULT 0,
  renew_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  email TEXT,
  uuid TEXT NOT NULL,
  name TEXT,
  server_id TEXT,
  order_id TEXT,
  is_vip INTEGER NOT NULL DEFAULT 0,
  deleted_from_panel INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notified_days3 INTEGER NOT NULL DEFAULT 0,
  notified_gb85 INTEGER NOT NULL DEFAULT 0,
  notified_gb1 INTEGER NOT NULL DEFAULT 0,
  panel_total INTEGER,
  panel_used INTEGER,
  panel_expiry INTEGER,
  panel_email TEXT,
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE TABLE IF NOT EXISTS payments (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT,
  email TEXT,
  order_id TEXT,
  type TEXT
);

INSERT OR IGNORE INTO global_stats (id) VALUES (1);
INSERT OR IGNORE INTO settings (id) VALUES (1);
