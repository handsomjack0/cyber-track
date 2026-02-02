
import { Env, getResources, saveResources, jsonResponse, errorResponse, checkAuth, Resource } from '../../../utils/storage';

export const onRequestGet = async (context: { env: Env, request: Request, params: { id: string } }) => {
  if (!checkAuth(context.request, context.env)) return errorResponse('Unauthorized', 401);

  const id = context.params.id;
  const resources = await getResources(context.env);
  const resource = resources.find(r => r.id === id);

  if (!resource) return errorResponse('Resource not found', 404);

  return jsonResponse({ success: true, data: resource });
};

export const onRequestPut = async (context: { env: Env, request: Request, params: { id: string } }) => {
  if (!checkAuth(context.request, context.env)) return errorResponse('Unauthorized', 401);

  const id = context.params.id;
  const resources = await getResources(context.env);
  const index = resources.findIndex(r => r.id === id);

  if (index === -1) return errorResponse('Resource not found', 404);

  try {
    const body = await context.request.json() as Partial<Resource>;
    // Merge existing with updates
    resources[index] = { ...resources[index], ...body, id }; // Ensure ID doesn't change
    
    await saveResources(context.env, resources);
    return jsonResponse({ success: true, data: resources[index] });
  } catch (e) {
    return errorResponse('Invalid JSON body');
  }
};

export const onRequestDelete = async (context: { env: Env, request: Request, params: { id: string } }) => {
  if (!checkAuth(context.request, context.env)) return errorResponse('Unauthorized', 401);

  const id = context.params.id;
  const resources = await getResources(context.env);
  const newResources = resources.filter(r => r.id !== id);

  if (newResources.length === resources.length) {
    return errorResponse('Resource not found', 404);
  }

  await saveResources(context.env, newResources);
  return jsonResponse({ success: true, message: 'Resource deleted' });
};
