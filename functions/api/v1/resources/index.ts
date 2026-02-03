
import { Env, getResources, saveResources, jsonResponse, errorResponse, checkAuth, Resource } from '../../../utils/storage';

export const onRequestGet = async (context: { env: Env, request: Request }) => {
  if (!checkAuth(context.request, context.env)) {
    return errorResponse('Unauthorized', 401);
  }
  
  const resources = await getResources(context.env);
  return jsonResponse({ success: true, count: resources.length, data: resources });
};

export const onRequestPost = async (context: { env: Env, request: Request }) => {
  if (!checkAuth(context.request, context.env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await context.request.json() as Partial<Resource>;
    
    // Basic Validation
    if (!body.name) {
      return errorResponse('Missing required fields: name');
    }

    // Determine type safely
    let type: Resource['type'] = 'VPS';
    if (body.type === 'DOMAIN') type = 'DOMAIN';
    if (body.type === 'PHONE_NUMBER') type = 'PHONE_NUMBER';
    if (body.type === 'ACCOUNT') type = 'ACCOUNT';

    const newResource: Resource = {
      id: body.id || Date.now().toString(),
      name: body.name,
      provider: body.provider || 'Unknown',
      expiryDate: body.expiryDate, // Can be undefined
      startDate: body.startDate,
      cost: body.cost || 0,
      currency: body.currency || '$',
      type: type,
      billingCycle: body.billingCycle,
      status: 'Active', 
      autoRenew: body.autoRenew || false,
      notes: body.notes
    };

    const resources = await getResources(context.env);
    resources.push(newResource);
    await saveResources(context.env, resources);

    return jsonResponse({ success: true, data: newResource }, 201);
  } catch (e) {
    return errorResponse('Invalid JSON body');
  }
};
