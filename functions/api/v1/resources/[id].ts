import { Env, getDb, jsonResponse, errorResponse, checkAuth, getSettings } from '../../../utils/storage';
import { resources } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { sendResourceChangeNotification } from '../../../services/notifications/sender';

const normalizeCost = (input: unknown): number => {
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return 0;
  const rounded = Math.round(parsed * 100) / 100;
  return Math.abs(rounded) < 0.005 ? 0 : rounded;
};

const formatCost = (input: unknown): string => normalizeCost(input).toFixed(2);

const buildChanges = (prev: any, next: any) => {
  const fields: Array<{ key: string; label: string }> = [
    { key: 'name', label: '名称' },
    { key: 'provider', label: '服务商' },
    { key: 'expiryDate', label: '到期日' },
    { key: 'cost', label: '费用' },
    { key: 'currency', label: '货币' },
    { key: 'type', label: '类型' },
    { key: 'billingCycle', label: '计费周期' },
    { key: 'autoRenew', label: '自动续费' },
    { key: 'notes', label: '备注' }
  ];

  const changes: string[] = [];
  for (const field of fields) {
    if (prev?.[field.key] === undefined || next?.[field.key] === undefined) continue;

    if (field.key === 'cost') {
      const prevCost = normalizeCost(prev[field.key]);
      const nextCost = normalizeCost(next[field.key]);
      if (prevCost !== nextCost) {
        changes.push(`${field.label}: ${formatCost(prevCost)} → ${formatCost(nextCost)}`);
      }
      continue;
    }

    if (prev[field.key] !== next[field.key]) {
      changes.push(`${field.label}: ${String(prev[field.key])} → ${String(next[field.key])}`);
    }
  }

  if (prev?.tags && next?.tags && JSON.stringify(prev.tags) !== JSON.stringify(next.tags)) {
    changes.push(`标签: ${prev.tags.join(', ') || '-'} → ${next.tags.join(', ') || '-'}`);
  }

  return changes;
};

export const onRequestGet = async (context: { env: Env; request: Request; params: { id: string } }) => {
  if (!checkAuth(context.request, context.env)) return errorResponse('Unauthorized', 401);

  const id = context.params.id;
  const db = getDb(context.env);

  const result = await db.select().from(resources).where(eq(resources.id, id)).get();

  if (!result) return errorResponse('Resource not found', 404);

  return jsonResponse({ success: true, data: result });
};

export const onRequestPut = async (context: { env: Env; request: Request; params: { id: string } }) => {
  if (!checkAuth(context.request, context.env)) return errorResponse('Unauthorized', 401);

  const id = context.params.id;

  try {
    const body = (await context.request.json()) as any;
    const db = getDb(context.env);
    const previous = await db.select().from(resources).where(eq(resources.id, id)).get();

    const updateData = {
      name: body.name,
      provider: body.provider,
      expiryDate: body.expiryDate,
      startDate: body.startDate,
      cost: body.cost === undefined ? undefined : normalizeCost(body.cost),
      currency: body.currency,
      type: body.type,
      billingCycle: body.billingCycle,
      autoRenew: body.autoRenew,
      notes: body.notes,
      notificationSettings: body.notificationSettings,
      tags: body.tags
    };

    Object.keys(updateData).forEach((key) => (updateData as any)[key] === undefined && delete (updateData as any)[key]);

    const result = await db
      .update(resources)
      .set(updateData)
      .where(eq(resources.id, id))
      .returning()
      .get();

    if (!result) return errorResponse('Resource not found or update failed', 404);

    try {
      const settings = await getSettings(context.env);
      const changes = buildChanges(previous, result);
      await sendResourceChangeNotification(context.env, 'updated', result as any, settings, changes);
    } catch (notifyError) {
      console.error('Update notify failed:', notifyError);
    }

    return jsonResponse({ success: true, data: result });
  } catch (e) {
    return errorResponse(`Update failed: ${String(e)}`);
  }
};

export const onRequestDelete = async (context: { env: Env; request: Request; params: { id: string } }) => {
  if (!checkAuth(context.request, context.env)) return errorResponse('Unauthorized', 401);

  const id = context.params.id;
  const db = getDb(context.env);

  try {
    const result = await db.delete(resources).where(eq(resources.id, id)).returning().get();

    if (!result) {
      return errorResponse('Resource not found', 404);
    }

    try {
      const settings = await getSettings(context.env);
      await sendResourceChangeNotification(context.env, 'deleted', result as any, settings);
    } catch (notifyError) {
      console.error('Delete notify failed:', notifyError);
    }

    return jsonResponse({ success: true, message: 'Resource deleted', id });
  } catch (e) {
    return errorResponse(`Delete failed: ${String(e)}`);
  }
};
