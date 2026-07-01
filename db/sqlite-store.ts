import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";

export type SqliteDb = DatabaseSync;

export function isSqlitePath(dbPath: string): boolean {
  const lower = dbPath.toLowerCase();
  return lower.endsWith(".db") || lower.endsWith(".sqlite");
}

let dbInstance: SqliteDb | null = null;

export function openDatabase(dbPath: string): SqliteDb {
  if (dbInstance) return dbInstance;

  const schemaPath = path.join(process.cwd(), "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  dbInstance = new DatabaseSync(dbPath);
  dbInstance.exec(schema);
  dbInstance.exec("PRAGMA journal_mode = WAL");
  dbInstance.exec("PRAGMA foreign_keys = ON");

  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function getDatabase(): SqliteDb {
  if (!dbInstance) throw new Error("Database not opened");
  return dbInstance;
}

// --- Row → admin-panel API shapes ---

export function rowToSettings(
  settingsRow: Record<string, unknown> | undefined,
  statsRow: Record<string, unknown> | undefined
) {
  return {
    salesOpen: Boolean(settingsRow?.sales_open ?? 1),
    maintenance: Boolean(settingsRow?.maintenance ?? 0),
    activeServerId: settingsRow?.active_server_id ?? null,
    activeVipServerId: settingsRow?.active_vip_server_id ?? null,
    totalIncome: Number(statsRow?.total_income ?? 0),
    successfulSales: Number(statsRow?.successful_sales ?? 0),
    abandonedCarts: Number(statsRow?.abandoned_carts ?? 0),
    testToBuyConversion: Number(statsRow?.test_to_buy_conversion ?? 0),
  };
}

export function rowToPlan(row: Record<string, unknown>) {
  const price = row.price;
  return {
    id: row.id,
    name: row.name,
    volume: Number(row.gb ?? 0),
    gb: Number(row.gb ?? 0),
    days: Number(row.days ?? 0),
    price: typeof price === "number" ? String(price) : String(price ?? "0"),
    btnText: row.btn_text ?? "",
    sold: Number(row.sold ?? 0),
    order: Number(row.sort_order ?? 0),
    showInNew: Boolean(row.show_in_new ?? 1),
    showInRenew: Boolean(row.show_in_renew ?? 1),
    targetUserId: row.target_user_id ?? null,
  };
}

export function planToRow(plan: Record<string, unknown>, index: number) {
  const gb = plan.volume ?? plan.gb ?? 0;
  const priceRaw = plan.price;
  let price = 0;
  if (typeof priceRaw === "number") {
    price = priceRaw;
  } else if (typeof priceRaw === "string") {
    const digits = priceRaw.replace(/[۰-۹]/g, (w) =>
      String.fromCharCode(w.charCodeAt(0) - 1728)
    ).replace(/,/g, "");
    price = Number(digits) || 0;
  }

  return {
    id: String(plan.id),
    name: String(plan.name ?? ""),
    gb: Number(gb),
    days: Number(plan.days ?? 0),
    price,
    btn_text: String(plan.btnText ?? plan.name ?? ""),
    sold: Number(plan.sold ?? 0),
    sort_order: Number(plan.order ?? index + 1),
    show_in_new: plan.showInNew === false ? 0 : 1,
    show_in_renew: plan.showInRenew === false ? 0 : 1,
    target_user_id: plan.targetUserId ? String(plan.targetUserId) : null,
  };
}

export function rowToServer(
  row: Record<string, unknown>,
  activeVipServerId: string | null
) {
  let status = "عادی";
  if (row.is_migrating) status = "در حال تخلیه";
  else if (activeVipServerId && row.id === activeVipServerId) status = "VIP";

  return {
    id: row.id,
    name: row.name,
    panelUrl: row.panel_url ?? "",
    webBasePath: row.web_base_path ?? "",
    apiToken: row.api_token ?? "",
    inboundId: row.inbound_id ?? null,
    domain: row.domain ?? "",
    sni: row.sni ?? "",
    path: row.path ?? "",
    isMigrating: Boolean(row.is_migrating),
    status,
  };
}

export function serverToRow(server: Record<string, unknown>) {
  const status = server.status as string | undefined;
  return {
    id: String(server.id),
    name: String(server.name ?? ""),
    panel_url: String(server.panelUrl ?? server.panel_url ?? ""),
    web_base_path: String(server.webBasePath ?? server.web_base_path ?? ""),
    api_token: String(server.apiToken ?? server.api_token ?? ""),
    inbound_id:
      server.inboundId != null || server.inbound_id != null
        ? Number(server.inboundId ?? server.inbound_id)
        : null,
    domain: String(server.domain ?? ""),
    sni: String(server.sni ?? ""),
    path: String(server.path ?? ""),
    is_migrating: status === "در حال تخلیه" || server.isMigrating ? 1 : 0,
  };
}

export function rowToService(row: Record<string, unknown>) {
  const service: Record<string, unknown> = {
    uuid: row.uuid,
    email: row.email ?? "",
    name: row.name ?? "",
    serverId: row.server_id ?? null,
    orderId: row.order_id ?? null,
    isVip: Boolean(row.is_vip),
    deletedFromPanel: Boolean(row.deleted_from_panel),
    telegramId: row.telegram_id,
  };

  if (row.panel_total != null || row.panel_used != null || row.panel_expiry != null) {
    service.panelStats = {
      total: row.panel_total ?? 0,
      used: row.panel_used ?? 0,
      expiry: row.panel_expiry ?? 0,
      email: row.panel_email ?? row.email ?? "",
    };
  }

  if (row.notified_days3 || row.notified_gb85 || row.notified_gb1) {
    service.notified = {
      days3: Boolean(row.notified_days3),
      gb85: Boolean(row.notified_gb85),
      gb1: Boolean(row.notified_gb1),
    };
  }

  return service;
}

export function rowToUser(
  row: Record<string, unknown>,
  isAdmin: boolean,
  stats?: Record<string, unknown> | null
) {
  return {
    telegramId: row.telegram_id,
    isBanned: Boolean(row.is_banned),
    isVip: Boolean(row.is_vip),
    isTest: Boolean(row.is_test),
    isAdmin,
    stats: stats
      ? {
          totalSpent: Number(stats.total_spent ?? 0),
          buyCount: Number(stats.buy_count ?? 0),
          renewCount: Number(stats.renew_count ?? 0),
        }
      : undefined,
  };
}
