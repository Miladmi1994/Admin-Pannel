import mongoose, { Schema, Document } from 'mongoose';

// --- Server Schema ---
export interface IServer extends Document {
  id: string;
  name: string;
  panelUrl: string;
  webBasePath: string;
  apiToken: string;
  inboundId: number;
  domain: string;
  sni: string;
  path: string;
  isMigrating?: boolean;
}

const ServerSchema = new Schema<IServer>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  panelUrl: { type: String, required: true },
  webBasePath: { type: String, default: '' },
  apiToken: { type: String, required: true },
  inboundId: { type: Number, default: 1 },
  domain: { type: String, required: true },
  sni: { type: String, required: true },
  path: { type: String, required: true },
  isMigrating: { type: Boolean, default: false }
});

export const ServerModel = mongoose.model<IServer>('Server', ServerSchema);

// --- Plan Schema ---
export interface IPlan {
  id: string;
  name: string;
  gb: number;
  days: number;
  price: number;
  order: number;
  showInNew: boolean;
  showInRenew: boolean;
  targetUserId?: string | null;
  btnText: string;
  sold: number;
  discount?: number;
}

// --- Settings Schema ---
export interface ISettings extends Document {
  salesOpen: boolean;
  maintenance: boolean;
  activeServerId?: string;
  activeVipServerId?: string;
  plans: IPlan[];
  totalIncome: number;
  successfulSales: number;
  abandonedCarts: number;
  testToBuyConversion: number;
}

const SettingsSchema = new Schema<ISettings>({
  salesOpen: { type: Boolean, default: true },
  maintenance: { type: Boolean, default: false },
  activeServerId: { type: String },
  activeVipServerId: { type: String },
  plans: [{
    id: String,
    name: String,
    gb: Number,
    days: Number,
    price: Number,
    order: Number,
    showInNew: Boolean,
    showInRenew: Boolean,
    targetUserId: String,
    btnText: String,
    sold: Number,
    discount: { type: Number, default: 0 }
  }],
  totalIncome: { type: Number, default: 0 },
  successfulSales: { type: Number, default: 0 },
  abandonedCarts: { type: Number, default: 0 },
  testToBuyConversion: { type: Number, default: 0 }
});

export const SettingsModel = mongoose.model<ISettings>('Settings', SettingsSchema);

// --- User Config Schema ---
export interface IConfig {
  email: string;
  uuid: string;
  name: string;
  serverId?: string;
  isVip?: boolean;
  orderId?: string;
  notified?: {
    days3: boolean;
    gb1: boolean;
    gb85: boolean;
  };
  panelStats?: {
    total: number;
    used: number;
    expiry: number;
    email: string;
  };
  deletedFromPanel?: boolean;
}

// --- User Schema ---
export interface IUser extends Document {
  telegramId: string;
  isVip: boolean;
  isBanned: boolean;
  hasTest: boolean;
  configs: IConfig[];
  stats: {
    totalSpent: number;
    renewCount: number;
    buyCount: number;
  };
}

const UserSchema = new Schema<IUser>({
  telegramId: { type: String, required: true, unique: true },
  isVip: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  hasTest: { type: Boolean, default: false },
  configs: [{
    email: String,
    uuid: String,
    name: String,
    serverId: String,
    isVip: Boolean,
    orderId: String,
    notified: {
      days3: Boolean,
      gb1: Boolean,
      gb85: Boolean
    },
    panelStats: {
      total: Number,
      used: Number,
      expiry: Number,
      email: String
    },
    deletedFromPanel: Boolean
  }],
  stats: {
    totalSpent: { type: Number, default: 0 },
    renewCount: { type: Number, default: 0 },
    buyCount: { type: Number, default: 0 }
  }
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);

// --- Admin Schema ---
export interface IAdmin extends Document {
  id: string;
  name: string;
}

const AdminSchema = new Schema<IAdmin>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true }
});

export const AdminModel = mongoose.model<IAdmin>('Admin', AdminSchema);
