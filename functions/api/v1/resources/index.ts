
import { Env, getDb, jsonResponse, errorResponse, checkAuth, getSettings } from '../../../utils/storage';
import { resources } from '../../../db/schema';
import { desc } from 'drizzle-orm';
import { sendResourceChangeNotification } from '../../../services/notifications/sender';

const normalizeCost = (input: unknown): number => {
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return 0;
  const rounded = Math.round(parsed * 100) / 100;
  return Math.abs(rounded) < 0.005 ? 0 : rounded;
};

export const onRequestGet = async (context: { env: Env, request: Request }) => {
  if (!checkAuth(context.request, context.env)) {
    return errorResponse('Unauthorized', 401);
  }
  
  try {
    const db = getDb(context.env);
    // Select all resources, order by creation or expiry
    const result = await db.select().from(resources).orderBy(desc(resources.createdAt)).all();
    
    return jsonResponse({ success: true, count: result.length, data: result });
  } catch (e) {
    return errorResponse(`Database Error: ${String(e)}`, 500);
  }
};

export const onRequestPost = async (context: { env: Env, request: Request }) => {
  if (!checkAuth(context.request, context.env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await context.request.json() as any;
    
    // Basic Validation
    if (!body.name) {
      return errorResponse('Missing required fields: name');
    }

    const newResource = {
      id: body.id || crypto.randomUUID(), // Use standard UUID if not provided
      name: body.name,
      provider: body.provider || 'Unknown',
      expiryDate: body.expiryDate || null,
      startDate: body.startDate || null,
      cost: normalizeCost(body.cost),
      currency: body.currency || '$',
      type: body.type || 'VPS',
      billingCycle: body.billingCycle || null,
      status: 'Active', 
      autoRenew: body.autoRenew ?? false,
      notes: body.notes || null,
      notificationSettings: body.notificationSettings || null,
      tags: body.tags || []
    };

    const db = getDb(context.env);
    await db.insert(resources).values(newResource).execute();

    try {
      const settings = await getSettings(context.env);
      await sendResourceChangeNotification(context.env, 'created', newResource, settings);
    } catch (notifyError) {
      console.error('Create notify failed:', notifyError);
    }

    return jsonResponse({ success: true, data: newResource }, 201);
  } catch (e) {
    console.error(e);
    return errorResponse(`Failed to create resource: ${String(e)}`);
  }
};
