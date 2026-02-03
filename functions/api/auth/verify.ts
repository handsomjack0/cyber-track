
import { Env, jsonResponse, errorResponse } from '../../utils/storage';
import { checkRateLimit, registerAttempt } from '../../services/auth/rateLimiter';

export const onRequestPost = async (context: { env: Env, request: Request }) => {
  const { request, env } = context;

  // 1. Get Client IP (Cloudflare Specific Header)
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  // 2. Check Rate Limit
  try {
    const status = await checkRateLimit(env, ip);
    if (status.blocked) {
      return errorResponse(status.message || 'Access Denied', 429);
    }
  } catch (e) {
    console.error('Rate Limit Check Failed', e);
    // Fail open or closed? Closed for security.
    return errorResponse('Security Service Error', 500);
  }

  // 3. Verify Password
  const apiKey = request.headers.get('x-api-key');
  const secret = env.API_SECRET;
  
  // Artificial Delay to slow down brute force (Timing Attack Mitigation)
  // Wait between 500ms and 1500ms randomly
  const delay = Math.floor(Math.random() * 1000) + 500;
  await new Promise(resolve => setTimeout(resolve, delay));

  const isValid = secret && apiKey === secret;

  // 4. Register Attempt (Update Counters)
  await registerAttempt(env, ip, isValid);

  if (!isValid) {
    return errorResponse('Invalid Access Code', 401);
  }

  return jsonResponse({ success: true, message: 'Authorized' });
};
