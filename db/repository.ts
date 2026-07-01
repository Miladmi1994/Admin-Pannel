import fs from "fs";
import {
  openDatabase,
  rowToPlan,
  rowToServer,
  rowToService,
  rowToSettings,
  rowToUser,
  planToRow,
  serverToRow,
  isSqlitePath,
  type SqliteDb,
} from "./sqlite-store.js";

export { isSqlitePath, openDatabase, closeDatabase } from "./sqlite-store.js";

// --- JSON fallback (legacy db.json / misnamed .db JSON files) ---

function readJsonDb(dbPath: string) {
  try {
    if (!fs.existsSync(dbPath)) {
      const defaultDb = { settings: {}, plans: {}, servers: {}, users: {}, configs: {} };
      fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2), "utf8");
      return defaultDb;
    }
    const data = fs.readFileSync(dbPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading JSON DB:", err);
    return { settings: {}, plans: {}, servers: {}, users: {}, configs: {} };
  }
}

function writeJsonDb(dbPath: string, data: unknown) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
}

// --- SQLite repository ---

function getActiveVipServerId(db: SqliteDb): string | null {
  const row = db.prepare("SELECT active_vip_server_id FROM settings WHERE id = 1").get() as
    | Record<string, unknown>
    | undefined;
  return (row?.active_vip_server_id as string) ?? null;
}

export function dbExists(dbPath: string): boolean {
  return fs.existsSync(dbPath);
}

export function getHealth(dbPath: string) {
  if (!dbExists(dbPath)) return { connected: false, mode: isSqlitePath(dbPath) ? "sqlite" : "json" };
  return { connected: true, mode: isSqlitePath(dbPath) ? "sqlite" : "json" };
}

export function isAdmin(dbPath: string, telegramId: string): boolean {
  if (!isSqlitePath(dbPath)) {
    const db = readJsonDb(dbPath);
    const user = db.users?.[telegramId];
    return Boolean(user?.isAdmin);
  }

  const db = openDatabase(dbPath);
  const row = db
    .prepare("SELECT 1 FROM admins WHERE telegram_id = ?")
    .get(String(telegramId));
  return Boolean(row);
}

export function getSettings(dbPath: string) {
  if (!isSqlitePath(dbPath)) {
    const db = readJsonDb(dbPath);
    return db.settings ?? {};
  }

  const db = openDatabase(dbPath);
  const settingsRow = db.prepare("SELECT * FROM settings WHERE id = 1").get() as
    | Record<string, unknown>
    | undefined;
  const statsRow = db.prepare("SELECT * FROM global_stats WHERE id = 1").get() as
    | Record<string, unknown>
    | undefined;
  return rowToSettings(settingsRow, statsRow);
}

export function updateSettings(dbPath: string, patch: Record<string, unknown>) {
  if (!isSqlitePath(dbPath)) {
    const db = readJsonDb(dbPath);
    db.settings = { ...db.settings, ...patch };
    writeJsonDb(dbPath, db);
    return db.settings;
  }

  const db = openDatabase(dbPath);
  const settingsPatch: Record<string, unknown> = {};
  const statsPatch: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(patch)) {
    switch (key) {
      case "salesOpen":
        settingsPatch.sales_open = value ? 1 : 0;
        break;
      case "maintenance":
        settingsPatch.maintenance = value ? 1 : 0;
        break;
      case "activeServerId":
        settingsPatch.active_server_id = value;
        break;
      case "activeVipServerId":
        settingsPatch.active_vip_server_id = value;
        break;
      case "totalIncome":
        statsPatch.total_income = value;
        break;
      case "successfulSales":
        statsPatch.successful_sales = value;
        break;
      case "abandonedCarts":
        statsPatch.abandoned_carts = value;
        break;
      case "testToBuyConversion":
        statsPatch.test_to_buy_conversion = value;
        break;
      default:
        break;
    }
  }

  db.exec("BEGIN");
  try {
    if (Object.keys(settingsPatch).length) {
      const cols = Object.keys(settingsPatch);
      const sets = cols.map((c) => `${c} = ?`).join(", ");
      db.prepare(`UPDATE settings SET ${sets} WHERE id = 1`).run(
        ...cols.map((c) => settingsPatch[c] as string | number | bigint | null)
      );
    }
    if (Object.keys(statsPatch).length) {
      const cols = Object.keys(statsPatch);
      const sets = cols.map((c) => `${c} = ?`).join(", ");
      db.prepare(`UPDATE global_stats SET ${sets} WHERE id = 1`).run(
        ...cols.map((c) => statsPatch[c] as string | number | bigint | null)
      );
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  return getSettings(dbPath);
}

export function getPlans(dbPath: string) {
  if (!isSqlitePath(dbPath)) {
    const db = readJsonDb(dbPath);
    return Object.values(db.plans || {}).sort(
      (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
    );
  }

  const db = openDatabase(dbPath);
  const rows = db
    .prepare("SELECT * FROM plans ORDER BY sort_order, id")
    .all() as Record<string, unknown>[];
  return rows.map(rowToPlan);
}

export function savePlans(dbPath: string, plans: Record<string, unknown>[]) {
  if (!isSqlitePath(dbPath)) {
    const db = readJsonDb(dbPath);
    db.plans = {};
    plans.forEach((p) => {
      db.plans[p.id as string] = p;
    });
    writeJsonDb(dbPath, db);
    return plans;
  }

  const db = openDatabase(dbPath);
  const insert = db.prepare(`
    INSERT INTO plans (id, name, gb, days, price, btn_text, sold, sort_order, show_in_new, show_in_renew, target_user_id)
    VALUES (@id, @name, @gb, @days, @price, @btn_text, @sold, @sort_order, @show_in_new, @show_in_renew, @target_user_id)
  `);

  db.exec("BEGIN");
  try {
    db.exec("DELETE FROM plans");
    plans.forEach((plan, i) => insert.run(planToRow(plan, i)));
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  return getPlans(dbPath);
}

export function getUsers(dbPath: string) {
  if (!isSqlitePath(dbPath)) {
    const db = readJsonDb(dbPath);
    return Object.values(db.users || {}).map((u: any) => {
      const userConfigs = Object.values(db.configs || {}).filter(
        (c: any) => c.telegramId === String(u.telegramId)
      );
      return { ...u, configs: userConfigs };
    });
  }

  const db = openDatabase(dbPath);
  const adminIds = new Set(
    (db.prepare("SELECT telegram_id FROM admins").all() as { telegram_id: string }[]).map(
      (r) => r.telegram_id
    )
  );

  const userRows = db
    .prepare(`
      SELECT
        all_users.telegram_id,
        COALESCE(u.is_banned, 0) AS is_banned,
        COALESCE(u.is_vip, 0) AS is_vip,
        COALESCE(u.is_test, 0) AS is_test
      FROM (
        SELECT telegram_id FROM users
        UNION
        SELECT DISTINCT telegram_id FROM services
      ) AS all_users
      LEFT JOIN users u ON u.telegram_id = all_users.telegram_id
      ORDER BY all_users.telegram_id
    `)
    .all() as Record<string, unknown>[];

  const servicesByUser = new Map<string, Record<string, unknown>[]>();
  const serviceRows = db
    .prepare("SELECT * FROM services ORDER BY telegram_id, sort_order, id")
    .all() as Record<string, unknown>[];

  for (const row of serviceRows) {
    const tid = String(row.telegram_id);
    if (!servicesByUser.has(tid)) servicesByUser.set(tid, []);
    servicesByUser.get(tid)!.push(rowToService(row));
  }

  return userRows.map((row) => {
    const tid = String(row.telegram_id);
    const stats = db
      .prepare("SELECT * FROM user_stats WHERE telegram_id = ?")
      .get(tid) as Record<string, unknown> | undefined;
    return {
      ...rowToUser(row, adminIds.has(tid), stats),
      configs: servicesByUser.get(tid) ?? [],
    };
  });
}

export function setUserBanned(dbPath: string, userId: string, isBanned: boolean) {
  if (!isSqlitePath(dbPath)) {
    const db = readJsonDb(dbPath);
    if (!db.users?.[userId]) return null;
    db.users[userId].isBanned = isBanned;
    writeJsonDb(dbPath, db);
    return db.users[userId];
  }

  const db = openDatabase(dbPath);
  const result = db
    .prepare("UPDATE users SET is_banned = ? WHERE telegram_id = ?")
    .run(isBanned ? 1 : 0, userId);

  if (result.changes === 0) {
    db.prepare(
      "INSERT INTO users (telegram_id, is_banned, is_vip, is_test) VALUES (?, ?, 0, 0)"
    ).run(userId, isBanned ? 1 : 0);
  }

  const row = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(userId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;

  const isAdminUser = Boolean(
    db.prepare("SELECT 1 FROM admins WHERE telegram_id = ?").get(userId)
  );
  return rowToUser(row, isAdminUser);
}

export function setUserVip(dbPath: string, userId: string, isVip: boolean) {
  if (!isSqlitePath(dbPath)) {
    const db = readJsonDb(dbPath);
    if (!db.users?.[userId]) return null;
    db.users[userId].isVip = isVip;
    Object.keys(db.configs || {}).forEach((uuid) => {
      if (db.configs[uuid].telegramId === userId) {
        db.configs[uuid].isVip = isVip;
      }
    });
    writeJsonDb(dbPath, db);
    return db.users[userId];
  }

  const db = openDatabase(dbPath);
  db.exec("BEGIN");
  try {
    const result = db
      .prepare("UPDATE users SET is_vip = ? WHERE telegram_id = ?")
      .run(isVip ? 1 : 0, userId);

    if (result.changes === 0) {
      db.prepare(
        "INSERT INTO users (telegram_id, is_banned, is_vip, is_test) VALUES (?, 0, ?, 0)"
      ).run(userId, isVip ? 1 : 0);
    }

    db.prepare("UPDATE services SET is_vip = ? WHERE telegram_id = ?").run(
      isVip ? 1 : 0,
      userId
    );
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  const row = db.prepare("SELECT * FROM users WHERE telegram_id = ?").get(userId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;

  const isAdminUser = Boolean(
    db.prepare("SELECT 1 FROM admins WHERE telegram_id = ?").get(userId)
  );
  return rowToUser(row, isAdminUser);
}

export function getServers(dbPath: string) {
  if (!isSqlitePath(dbPath)) {
    const db = readJsonDb(dbPath);
    return Object.values(db.servers || {});
  }

  const db = openDatabase(dbPath);
  const activeVipId = getActiveVipServerId(db);
  const rows = db.prepare("SELECT * FROM servers ORDER BY name").all() as Record<
    string,
    unknown
  >[];
  return rows.map((row) => rowToServer(row, activeVipId));
}

export function createServer(dbPath: string, server: Record<string, unknown>) {
  if (!isSqlitePath(dbPath)) {
    const db = readJsonDb(dbPath);
    if (!db.servers) db.servers = {};
    db.servers[server.id as string] = server;
    writeJsonDb(dbPath, db);
    return server;
  }

  const db = openDatabase(dbPath);
  const row = serverToRow(server);
  db.prepare(`
    INSERT INTO servers (id, name, panel_url, web_base_path, api_token, inbound_id, domain, sni, path, is_migrating)
    VALUES (@id, @name, @panel_url, @web_base_path, @api_token, @inbound_id, @domain, @sni, @path, @is_migrating)
  `).run(row);

  applyServerStatus(db, String(server.id), server.status as string | undefined);
  return getServerById(dbPath, String(server.id));
}

export function updateServer(
  dbPath: string,
  serverId: string,
  patch: Record<string, unknown>
) {
  if (!isSqlitePath(dbPath)) {
    const db = readJsonDb(dbPath);
    if (!db.servers?.[serverId]) return null;
    db.servers[serverId] = { ...db.servers[serverId], ...patch };
    writeJsonDb(dbPath, db);
    return db.servers[serverId];
  }

  const db = openDatabase(dbPath);
  const existing = db.prepare("SELECT * FROM servers WHERE id = ?").get(serverId) as
    | Record<string, unknown>
    | undefined;
  if (!existing) return null;

  const merged = { ...rowToServer(existing, getActiveVipServerId(db)), ...patch };
  const row = serverToRow(merged);

  db.prepare(`
    UPDATE servers SET
      name = @name, panel_url = @panel_url, web_base_path = @web_base_path,
      api_token = @api_token, inbound_id = @inbound_id, domain = @domain,
      sni = @sni, path = @path, is_migrating = @is_migrating
    WHERE id = @id
  `).run(row);

  if ("status" in patch) {
    applyServerStatus(db, serverId, patch.status as string);
  }

  return getServerById(dbPath, serverId);
}

export function deleteServer(dbPath: string, serverId: string) {
  if (!isSqlitePath(dbPath)) {
    const db = readJsonDb(dbPath);
    if (db.servers?.[serverId]) delete db.servers[serverId];
    writeJsonDb(dbPath, db);
    return true;
  }

  const db = openDatabase(dbPath);
  db.prepare("DELETE FROM servers WHERE id = ?").run(serverId);

  const settings = db.prepare("SELECT active_server_id, active_vip_server_id FROM settings WHERE id = 1").get() as
    | Record<string, unknown>
    | undefined;
  if (settings?.active_server_id === serverId) {
    db.prepare("UPDATE settings SET active_server_id = NULL WHERE id = 1").run();
  }
  if (settings?.active_vip_server_id === serverId) {
    db.prepare("UPDATE settings SET active_vip_server_id = NULL WHERE id = 1").run();
  }

  return true;
}

function getServerById(dbPath: string, serverId: string) {
  const db = openDatabase(dbPath);
  const row = db.prepare("SELECT * FROM servers WHERE id = ?").get(serverId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;
  return rowToServer(row, getActiveVipServerId(db));
}

function applyServerStatus(db: SqliteDb, serverId: string, status?: string) {
  if (!status) return;

  if (status === "VIP") {
    db.prepare("UPDATE settings SET active_vip_server_id = ? WHERE id = 1").run(serverId);
    db.prepare("UPDATE servers SET is_migrating = 0 WHERE id = ?").run(serverId);
  } else if (status === "در حال تخلیه") {
    db.prepare("UPDATE servers SET is_migrating = 1 WHERE id = ?").run(serverId);
    const settings = db
      .prepare("SELECT active_vip_server_id FROM settings WHERE id = 1")
      .get() as Record<string, unknown> | undefined;
    if (settings?.active_vip_server_id === serverId) {
      db.prepare("UPDATE settings SET active_vip_server_id = NULL WHERE id = 1").run();
    }
  } else {
    db.prepare("UPDATE servers SET is_migrating = 0 WHERE id = ?").run(serverId);
    const settings = db
      .prepare("SELECT active_vip_server_id FROM settings WHERE id = 1")
      .get() as Record<string, unknown> | undefined;
    if (settings?.active_vip_server_id === serverId) {
      db.prepare("UPDATE settings SET active_vip_server_id = NULL WHERE id = 1").run();
    }
  }
}

export function getDbStats(dbPath: string) {
  if (!isSqlitePath(dbPath)) return null;

  const db = openDatabase(dbPath);
  return {
    users: (db.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number }).c,
    services: (db.prepare("SELECT COUNT(*) AS c FROM services").get() as { c: number }).c,
    plans: (db.prepare("SELECT COUNT(*) AS c FROM plans").get() as { c: number }).c,
    servers: (db.prepare("SELECT COUNT(*) AS c FROM servers").get() as { c: number }).c,
  };
}
