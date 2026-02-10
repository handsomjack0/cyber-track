import { Env, jsonResponse, checkAuth } from '../../utils/storage';

export const onRequestGet = async (context: { env: Env; request: Request }) => {
  const { env, request } = context;
  const accessMode = env.ACCESS_MODE || 'access-code';
  const url = new URL(request.url);
  const debug = url.searchParams.get('debug') === '1';
  const accessEmail =
    request.headers.get('cf-access-authenticated-user-email') ||
    request.headers.get('CF-Access-Authenticated-User-Email');
  const hasAccessHeader = Boolean(accessEmail);

  const maskEmail = (email: string) => {
    const [user, domain] = email.split('@');
    if (!user || !domain) return 'unknown';
    const safeUser = user.length <= 2 ? `${user[0]}*` : `${user[0]}***${user[user.length - 1]}`;
    return `${safeUser}@${domain}`;
  };

  const authenticated = checkAuth(request, env);
  const provider = accessEmail
    ? 'cloudflare-access'
    : (request.headers.get('x-api-key') ? 'api-key' : 'none');

  return jsonResponse({
    authenticated,
    provider,
    ...(accessEmail ? { email: accessEmail } : {}),
    ...(debug ? { debug: { accessMode, hasAccessHeader, ...(accessEmail ? { email: maskEmail(accessEmail) } : {}) } } : {})
  });
};
