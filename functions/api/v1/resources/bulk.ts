
import { Env, getDb, jsonResponse, errorResponse, checkAuth, Resource } from '../../../utils/storage';
import { resources } from '../../../db/schema';

export const onRequestPost = async (context: { env: Env, request: Request }) => {
  if (!checkAuth(context.request, context.env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await context.request.json() as { resources: any[], mode: 'overwrite' | 'merge' };
    const { resources: importList, mode } = body;

    if (!Array.isArray(importList)) {
      return errorResponse('Invalid data format: resources must be an array');
    }

    const db = getDb(context.env);

    // Sanitize and map data to schema structure
    const validResources = importList
      .filter(r => r.name && r.type)
      .map(r => ({
        id: r.id || crypto.randomUUID(),
        name: r.name,
        provider: r.provider || 'Unknown',
        expiryDate: r.expiryDate || null,
        startDate: r.startDate || null,
        cost: r.cost || 0,
        currency: r.currency || '$',
        type: r.type,
        billingCycle: r.billingCycle || null,
        status: r.status || 'Active',
        autoRenew: r.autoRenew || false,
        notes: r.notes || null,
        notificationSettings: r.notificationSettings || null
      }));

    if (validResources.length === 0) {
      return jsonResponse({ success: true, count: 0, message: "No valid resources to import" });
    }

    // Use Batch or Transaction
    // For 'overwrite', we might want to delete all first (Be careful!)
    if (mode === 'overwrite') {
      await db.delete(resources).execute();
    }

    // D1 batch insert
    await db.insert(resources).values(validResources).onConflictDoUpdate({
      target: resources.id,
      set: {
        name: resources.name, // Just an example of conflict handling, or use DoNothing
        cost: resources.cost,
        expiryDate: resources.expiryDate
      }
    }).execute();

    return jsonResponse({ 
      success: true, 
      count: validResources.length, 
      message: `Successfully imported ${validResources.length} resources.` 
    });
  } catch (e) {
    console.error(e);
    return errorResponse(`Server Error during bulk import: ${String(e)}`, 500);
  }
};
