import { Env, jsonResponse } from '../../utils/storage';

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

  if ((accessMode === 'cloudflare' || accessMode === 'hybrid') && accessEmail) {
    return jsonResponse({
      authenticated: true,
      provider: 'cloudflare-access',
      email: accessEmail,
      ...(debug ? { debug: { accessMode, hasAccessHeader, email: maskEmail(accessEmail) } } : {})
    });
  }

  return jsonResponse({
    authenticated: false,
    ...(debug ? { debug: { accessMode, hasAccessHeader } } : {})
  });
};
