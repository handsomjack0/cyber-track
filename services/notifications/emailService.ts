import { EmailConfig } from '../../types';

export const sendEmailTestMessage = async (config: EmailConfig): Promise<boolean> => {
  if (!config.email) {
    throw new Error('Missing email');
  }

  const url = '/api/email';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: config.email,
        subject: 'cyberTrack 测试邮件',
        html: '<p>这是一封测试邮件，说明邮件通道已经可用。</p>',
        text: '这是一封测试邮件，说明邮件通道已经可用。'
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.description || 'Failed to send email via Backend');
    }
    return true;
  } catch (error) {
    console.error('Email Service Error:', error);
    throw error;
  }
};
