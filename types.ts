
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
  enabled: boolean; // Master switch for this resource
  useGlobal: boolean; // If true, use AppSettings.reminderDays and all enabled channels
  reminderDays?: number; // Override global setting
  channels?: {
    telegram: boolean;
    email: boolean;
    webhook: boolean;
  };
}

export interface Resource {
  id: string;
  name: string; // e.g., "Main App Server" or "google.com"
  provider: string; // e.g., "DigitalOcean", "Namecheap"
  expiryDate?: string; // Optional: ISO Date string YYYY-MM-DD
  cost: number;
  currency: string;
  type: ResourceType;
  status: Status;
  autoRenew: boolean;
  notes?: string;
  
  // New fields for Account/Subscription context
  billingCycle?: BillingCycle;
  startDate?: string; // When the subscription started

  notificationSettings?: ResourceNotificationSettings;
  tags?: string[];
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

// Notification Configurations
export interface TelegramConfig {
  enabled: boolean;
  // botToken is removed from client-side type for security
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
  reminderDays: number; // Days before expiration to notify
  telegram: TelegramConfig;
  email: EmailConfig;
  webhook: WebhookConfig;
}

// Sorting Configurations
export type SortField = 'name' | 'provider' | 'expiryDate' | 'cost' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
