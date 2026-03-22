import { desc, eq } from 'drizzle-orm';
import { resourceRenewalLogs } from '../../../../db/schema';
import { checkAuth, Env, errorResponse, getDb, jsonResponse } from '../../../../utils/storage';

export const onRequestGet = async (context: {
  env: Env;
  request: Request;
  params: { id: string };
}) => {
  if (!checkAuth(context.request, context.env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const db = getDb(context.env);
    const rows = await db
      .select()
      .from(resourceRenewalLogs)
      .where(eq(resourceRenewalLogs.resourceId, context.params.id))
      .orderBy(desc(resourceRenewalLogs.createdAt))
      .all();

    return jsonResponse({ success: true, data: rows });
  } catch (error) {
    return errorResponse(`Failed to load renewal logs: ${String(error)}`, 500);
  }
};
