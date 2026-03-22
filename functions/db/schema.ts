import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const resources = sqliteTable('resources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  provider: text('provider').notNull(),
  expiryDate: text('expiry_date'),
  startDate: text('start_date'),
  cost: real('cost').notNull().default(0),
  currency: text('currency').notNull().default('$'),
  type: text('type').notNull(),
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
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const resourceRenewalLogs = sqliteTable('resource_renewal_logs', {
  id: text('id').primaryKey(),
  resourceId: text('resource_id').notNull(),
  previousExpiryDate: text('previous_expiry_date'),
  nextExpiryDate: text('next_expiry_date').notNull(),
  billingCycle: text('billing_cycle'),
  previousStatus: text('previous_status'),
  nextStatus: text('next_status').notNull().default('Active'),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

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
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const authLogs = sqliteTable('auth_logs', {
  ip: text('ip').primaryKey(),
  attempts: integer('attempts').notNull().default(0),
  lastAttemptAt: integer('last_attempt_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  blockedUntil: integer('blocked_until', { mode: 'timestamp' }),
  otpCode: text('otp_code'),
  otpExpiresAt: integer('otp_expires_at', { mode: 'timestamp' })
});
