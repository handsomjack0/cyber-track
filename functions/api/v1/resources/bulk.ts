
import { Env, saveResources, jsonResponse, errorResponse, checkAuth, Resource } from '../../../../utils/storage';

export const onRequestPost = async (context: { env: Env, request: Request }) => {
  if (!checkAuth(context.request, context.env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await context.request.json() as { resources: Resource[], mode: 'overwrite' | 'merge' };
    const { resources, mode } = body;

    if (!Array.isArray(resources)) {
      return errorResponse('Invalid data format: resources must be an array');
    }

    // In a real app, you might want to fetch existing data first if mode is 'merge'
    // For simplicity, we currently implement 'overwrite' (restore backup) pattern primarily
    // or assume the frontend sends the complete merged list.
    
    // Validate items roughly
    const validResources = resources.filter(r => r.id && r.name && r.type);

    await saveResources(context.env, validResources);

    return jsonResponse({ 
      success: true, 
      count: validResources.length, 
      message: `Successfully imported ${validResources.length} resources.` 
    });
  } catch (e) {
    return errorResponse('Server Error during bulk import', 500);
  }
};
