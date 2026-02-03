
export enum ResourceType {
  VPS = 'VPS',
  DOMAIN = 'DOMAIN',
  PHONE_NUMBER = 'PHONE_NUMBER',
  ACCOUNT = 'ACCOUNT'
}

export enum Status {
  ACTIVE = 'Active',
  EXPIRED = 'Expired',
  PENDING = 'Pending'
}

export enum BillingCycle {
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly',
  ONE_TIME = 'OneTime',
  QUARTERLY = 'Quarterly'
}

export interface ResourceNotificationSettings {
  enabled: boolean;
  useGlobal: boolean;
  reminderDays?: number;
  channels?: {
    telegram: boolean;
    email: boolean;
    webhook: boolean;
  };
}

export interface Resource {
  id: string;
  name: string;
  provider: string;
  expiryDate?: string;
  cost: number;
  currency: string;
  type: ResourceType;
  status: Status;
  autoRenew: boolean;
  notes?: string;
  billingCycle?: BillingCycle;
  startDate?: string;
  notificationSettings?: ResourceNotificationSettings;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export interface TelegramConfig {
  enabled: boolean;
  chatId: string;
}

export interface EmailConfig {
  enabled: boolean;
  email: string;
}

export interface WebhookConfig {
  enabled: boolean;
  url: string;
}

export interface AppSettings {
  reminderDays: number;
  telegram: TelegramConfig;
  email: EmailConfig;
  webhook: WebhookConfig;
}

export type SortField = 'name' | 'provider' | 'expiryDate' | 'cost' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
