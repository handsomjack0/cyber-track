
import { Env, getResources } from '../utils/storage';

interface TelegramUpdate {
  update_id: number;
  message?: {
    chat: {
      id: number;
    };
    text?: string;
  };
}

const getDaysRemaining = (expiryDate: string) => {
  const today = new Date();
  const target = new Date(expiryDate);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  // 1. Security Check
  if (!env.TELEGRAM_BOT_TOKEN) {
    return new Response('Server Error: Bot Token Missing', { status: 500 });
  }

  try {
    const update = await request.json() as TelegramUpdate;
    
    // Guard clauses for invalid updates
    if (!update.message || !update.message.text) {
      return new Response('OK', { status: 200 }); // Ignore non-text messages
    }

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();

    // Fetch REAL data from KV
    const resources = await getResources(env);

    let replyText = '';

    // 2. Command Routing
    if (text === '/start') {
      replyText = `👋 <b>欢迎使用 CloudTrack 资产助手!</b>\n\n您可以发送以下指令:\n/status - 查看整体概览\n/expiring - 查看近期到期资产\n/list - 列出所有资产`;
    } 
    else if (text === '/status') {
      const total = resources.length;
      if (total === 0) {
         replyText = `📊 <b>资产状态概览</b>\n\n当前没有记录任何资产。请前往控制台添加。`;
      } else {
        const expired = resources.filter(r => getDaysRemaining(r.expiryDate) < 0).length;
        const urgent = resources.filter(r => {
          const d = getDaysRemaining(r.expiryDate);
          return d >= 0 && d <= 30;
        }).length;

        replyText = `📊 <b>资产状态概览</b>\n\n📦 <b>总资产数:</b> ${total}\n🚨 <b>已过期:</b> ${expired}\n⚠️ <b>30天内到期:</b> ${urgent}\n\n发送 /expiring 查看详细列表。`;
      }
    }
    else if (text === '/expiring') {
      const urgentList = resources.filter(r => getDaysRemaining(r.expiryDate) <= 30)
        .sort((a, b) => getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate));

      if (urgentList.length === 0) {
        replyText = '✅ <b>状态良好!</b>\n目前没有30天内到期的资产。';
      } else {
        replyText = `⚠️ <b>以下资产即将到期:</b>\n\n`;
        urgentList.forEach(item => {
          const days = getDaysRemaining(item.expiryDate);
          const icon = days < 0 ? '🔴' : '🟠';
          const statusText = days < 0 ? `已过期 ${Math.abs(days)} 天` : `剩余 ${days} 天`;
          replyText += `${icon} <b>${item.name}</b> (${item.provider})\n   └ 📅 ${item.expiryDate} (${statusText})\n\n`;
        });
      }
    }
    else if (text === '/list') {
      if (resources.length === 0) {
        replyText = `📋 <b>资产清单:</b>\n\n列表为空。`;
      } else {
        replyText = `📋 <b>资产清单 (Top 10):</b>\n\n`;
        resources.slice(0, 10).forEach(item => {
           const days = getDaysRemaining(item.expiryDate);
           const icon = days < 0 ? '🔴' : days <= 30 ? '🟠' : '🟢';
           replyText += `${icon} <b>${item.name}</b>\n   Expires: ${item.expiryDate} | ${item.currency}${item.cost}\n`;
        });
      }
    }
    else {
      replyText = `❓ 未知指令。请尝试 /status 或 /start`;
    }

    // 3. Send Reply via Telegram API
    const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText,
        parse_mode: 'HTML'
      })
    });

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};
