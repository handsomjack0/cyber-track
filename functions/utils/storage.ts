
// Define minimal KVNamespace interface to avoid type errors when global types are missing
export interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream'; cacheTtl?: number }): Promise<string | null>;
  put(key: string, value: string | ReadableStream | ArrayBuffer, options?: { expiration?: number; expirationTtl?: number; metadata?: any }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  CLOUDTRACK_KV: KVNamespace;
  API_SECRET: string;
  TELEGRAM_BOT_TOKEN?: string;
  API_KEY?: string;
}

export interface Resource {
  id: string;
  name: string;
  provider: string;
  expiryDate: string;
  cost: number;
  currency: string;
  type: 'VPS' | 'DOMAIN';
  status: string;
  autoRenew: boolean;
}

const DB_KEY = 'resources_data';

// Empty initial data for production
const INITIAL_DATA: Resource[] = [];

export async function getResources(env: Env): Promise<Resource[]> {
  // If KV is not bound (local dev without bindings), return empty
  if (!env.CLOUDTRACK_KV) {
    return INITIAL_DATA;
  }
  
  const data = await env.CLOUDTRACK_KV.get(DB_KEY);
  if (!data) {
    return INITIAL_DATA;
  }
  return JSON.parse(data);
}

export async function saveResources(env: Env, resources: Resource[]): Promise<void> {
  if (!env.CLOUDTRACK_KV) return;
  await env.CLOUDTRACK_KV.put(DB_KEY, JSON.stringify(resources));
}

export function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message, success: false }, status);
}

export function checkAuth(request: Request, env: Env): boolean {
  // In production, check header 'x-api-key' against env.API_SECRET
  const apiKey = request.headers.get('x-api-key');
  // If API_SECRET is not set, we default to allow for demo purposes, 
  // BUT in real app this should default to block.
  if (!env.API_SECRET) return true; 
  return apiKey === env.API_SECRET;
}
