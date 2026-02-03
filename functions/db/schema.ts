
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
  notificationSettings: text('notification_settings', { mode: 'json' }).$type<{
    enabled: boolean;
    useGlobal: boolean;
    reminderDays?: number;
    lastNotified?: string;
    channels?: { telegram: boolean; email: boolean; webhook: boolean };
  }>(),
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// 设置表
export const settings = sqliteTable('settings', {
  id: text('id').primaryKey().$defaultFn(() => 'global'),
  reminderDays: integer('reminder_days').notNull().default(7),
  telegram: text('telegram', { mode: 'json' }).$type<{
    enabled: boolean;
    chatId: string;
  }>().notNull(),
  email: text('email', { mode: 'json' }).$type<{
    enabled: boolean;
    email: string;
  }>().notNull(),
  webhook: text('webhook', { mode: 'json' }).$type<{
    enabled: boolean;
    url: string;
  }>().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// 安全日志表 (用于防暴力破解)
export const authLogs = sqliteTable('auth_logs', {
  ip: text('ip').primaryKey(),
  attempts: integer('attempts').notNull().default(0),
  lastAttemptAt: integer('last_attempt_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  blockedUntil: integer('blocked_until', { mode: 'timestamp' }), // 如果不为空且大于当前时间，则为封禁状态
});
