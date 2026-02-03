
import { Env, getDb, jsonResponse, errorResponse, checkAuth } from '../../../utils/storage';
import { resources } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const onRequestGet = async (context: { env: Env, request: Request, params: { id: string } }) => {
  if (!checkAuth(context.request, context.env)) return errorResponse('Unauthorized', 401);

  const id = context.params.id;
  const db = getDb(context.env);
  
  const result = await db.select().from(resources).where(eq(resources.id, id)).get();

  if (!result) return errorResponse('Resource not found', 404);

  return jsonResponse({ success: true, data: result });
};

export const onRequestPut = async (context: { env: Env, request: Request, params: { id: string } }) => {
  if (!checkAuth(context.request, context.env)) return errorResponse('Unauthorized', 401);

  const id = context.params.id;
  
  try {
    const body = await context.request.json() as any;
    const db = getDb(context.env);

    // Update only fields that are passed, but ensure ID is preserved
    // Drizzle's update().set() handles partial updates well
    const updateData = {
      name: body.name,
      provider: body.provider,
      expiryDate: body.expiryDate,
      startDate: body.startDate,
      cost: body.cost,
      currency: body.currency,
      type: body.type,
      billingCycle: body.billingCycle,
      autoRenew: body.autoRenew,
      notes: body.notes,
      notificationSettings: body.notificationSettings,
      tags: body.tags
    };

    // Remove undefined keys so we don't overwrite with null unless intended
    Object.keys(updateData).forEach(key => (updateData as any)[key] === undefined && delete (updateData as any)[key]);

    const result = await db.update(resources)
      .set(updateData)
      .where(eq(resources.id, id))
      .returning()
      .get();

    if (!result) return errorResponse('Resource not found or update failed', 404);

    return jsonResponse({ success: true, data: result });
  } catch (e) {
    return errorResponse(`Update failed: ${String(e)}`);
  }
};

export const onRequestDelete = async (context: { env: Env, request: Request, params: { id: string } }) => {
  if (!checkAuth(context.request, context.env)) return errorResponse('Unauthorized', 401);

  const id = context.params.id;
  const db = getDb(context.env);

  try {
    const result = await db.delete(resources).where(eq(resources.id, id)).returning().get();
    
    if (!result) {
      return errorResponse('Resource not found', 404);
    }

    return jsonResponse({ success: true, message: 'Resource deleted', id });
  } catch (e) {
    return errorResponse(`Delete failed: ${String(e)}`);
  }
};
