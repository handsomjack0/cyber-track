import { sendEmailResend } from '../services/email/resend';

interface Env {
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
}

interface RequestBody {
  to: string;
  subject?: string;
  html?: string;
  text?: string;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
    return new Response(JSON.stringify({
      ok: false,
      description: 'Server Error: RESEND_API_KEY / RESEND_FROM is not configured.'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json() as RequestBody;
    if (!body.to) {
      return new Response(JSON.stringify({ ok: false, description: 'Missing to' }), { status: 400 });
    }

    const subject = body.subject || 'cyberTrack 邮件通知';
    const html = body.html || '<p>这是来自 cyberTrack 的测试邮件。</p>';
    const text = body.text || '这是来自 cyberTrack 的测试邮件。';

    const result = await sendEmailResend(env.RESEND_API_KEY, env.RESEND_FROM, {
      to: body.to,
      subject,
      html,
      text
    });

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, description: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
