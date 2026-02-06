interface SendEmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

interface ResendResponse {
  id?: string;
  error?: { message?: string };
}

export async function sendEmailResend(apiKey: string, from: string, payload: SendEmailPayload) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text
    })
  });

  const data = await response.json() as ResendResponse;

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Resend request failed');
  }

  return data;
}
