import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// 资源表
export const resources = sqliteTable('resources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  provider: text('provider').notNull(),
  expiryDate: text('expiry_date'), // ISO String YYYY-MM-DD
  startDate: text('start_date'),
  cost: real('cost').notNull().default(0),
  currency: text('currency').notNull().default('$'),
  type: text('type').notNull(), // 'VPS' | 'DOMAIN' | ...
  status: text('status').notNull().default('Active'),
  autoRenew: integer('auto_renew', { mode: 'boolean' }).notNull().default(false),
  billingCycle: text('billing_cycle'),
  notes: text('notes'),
  // Store JSON object as text string
  notificationSettings: text('notification_settings', { mode: 'json' }).$type<{
    enabled: boolean;
    useGlobal: boolean;
    reminderDays?: number;
    lastNotified?: string;
    channels?: { telegram: boolean; email: boolean; webhook: boolean };
  }>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// 设置表 (单行存储，ID固定为 'global')
export const settings = sqliteTable('settings', {
  id: text('id').primaryKey().$defaultFn(() => 'global'),
  reminderDays: integer('reminder_days').notNull().default(7),
  // Telegram Config JSON
  telegram: text('telegram', { mode: 'json' }).$type<{
    enabled: boolean;
    chatId: string;
  }>().notNull(),
  // Email Config JSON
  email: text('email', { mode: 'json' }).$type<{
    enabled: boolean;
    email: string;
  }>().notNull(),
  // Webhook Config JSON
  webhook: text('webhook', { mode: 'json' }).$type<{
    enabled: boolean;
    url: string;
  }>().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
