
import { Env, getSettings, saveSettings, jsonResponse, errorResponse, checkAuth, AppSettings } from '../../utils/storage';

export const onRequestGet = async (context: { env: Env, request: Request }) => {
  if (!checkAuth(context.request, context.env)) {
    return errorResponse('Unauthorized', 401);
  }
  
  const settings = await getSettings(context.env);
  return jsonResponse(settings);
};

export const onRequestPost = async (context: { env: Env, request: Request }) => {
  if (!checkAuth(context.request, context.env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await context.request.json() as Partial<AppSettings>;
    const current = await getSettings(context.env);
    
    const newSettings: AppSettings = {
      ...current,
      ...body,
      // Deep merge nested objects to avoid overwriting with undefined
      telegram: { ...current.telegram, ...(body.telegram || {}) },
      email: { ...current.email, ...(body.email || {}) },
      webhook: { ...current.webhook, ...(body.webhook || {}) },
    };

    await saveSettings(context.env, newSettings);
    return jsonResponse({ success: true, data: newSettings });
  } catch (e) {
    return errorResponse('Invalid JSON body');
  }
};
