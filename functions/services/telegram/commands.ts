
import { Env, getResources, Resource } from '../../utils/storage';
import { sendMessage } from './client';
import { TelegramMessage } from './types';

// Helper: Calculate days remaining
const getDaysRemaining = (expiryDate: string) => {
  const today = new Date();
  const target = new Date(expiryDate);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Command: /start
async function handleStart(env: Env, chatId: number) {
  const text = `👋 <b>欢迎使用 CloudTrack 资产助手!</b>\n\n` +
               `我是您的服务器与域名管家。您可以发送以下指令来查询状态：\n\n` +
               `🔹 /status - 查看整体健康概览\n` +
               `🔹 /expiring - 查看即将过期的资产\n` +
               `🔹 /list - 列出所有资产 (Top 10)\n` + 
               `🔹 /help - 获取帮助信息`;
  
  await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text, parse_mode: 'HTML' });
}

// Command: /status
async function handleStatus(env: Env, chatId: number, resources: Resource[]) {
  const total = resources.length;
  
  if (total === 0) {
    await sendMessage(env.TELEGRAM_BOT_TOKEN!, { 
      chat_id: chatId, 
      text: `📊 <b>资产状态概览</b>\n\n当前数据库为空。请前往 Web 控制台添加资产。`, 
      parse_mode: 'HTML' 
    });
    return;
  }

  const expired = resources.filter(r => getDaysRemaining(r.expiryDate) < 0).length;
  const urgent = resources.filter(r => {
    const d = getDaysRemaining(r.expiryDate);
    return d >= 0 && d <= 30;
  }).length;
  const active = total - expired;

  const text = `📊 <b>系统状态概览</b>\n\n` +
               `📦 <b>总资产数:</b> ${total}\n` +
               `✅ <b>正常运行:</b> ${active}\n` +
               `🚨 <b>已过期:</b> ${expired}\n` +
               `⚠️ <b>30天内到期:</b> ${urgent}\n\n` +
               `<i>发送 /expiring 查看需处理项</i>`;

  await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text, parse_mode: 'HTML' });
}

// Command: /expiring
async function handleExpiring(env: Env, chatId: number, resources: Resource[]) {
  const urgentList = resources
    .filter(r => getDaysRemaining(r.expiryDate) <= 30)
    .sort((a, b) => getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate));

  if (urgentList.length === 0) {
    await sendMessage(env.TELEGRAM_BOT_TOKEN!, { 
      chat_id: chatId, 
      text: '✅ <b>状态良好!</b>\n\n目前没有30天内到期的资产。安心摸鱼吧！☕', 
      parse_mode: 'HTML' 
    });
    return;
  }

  let text = `⚠️ <b>以下资产需要关注:</b>\n\n`;
  
  urgentList.forEach(item => {
    const days = getDaysRemaining(item.expiryDate);
    const icon = days < 0 ? '🔴' : '🟠';
    const statusText = days < 0 ? `已过期 ${Math.abs(days)} 天` : `剩余 ${days} 天`;
    
    text += `${icon} <b>${item.name}</b> (${item.provider})\n` +
            `   └ 📅 ${item.expiryDate} (<b>${statusText}</b>)\n\n`;
  });

  await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text, parse_mode: 'HTML' });
}

// Command: /list
async function handleList(env: Env, chatId: number, resources: Resource[]) {
  if (resources.length === 0) {
    await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text: '📭 列表为空', parse_mode: 'HTML' });
    return;
  }

  // Sort by expiry date (soonest first)
  const sorted = [...resources].sort((a, b) => getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate));
  const top10 = sorted.slice(0, 10);

  let text = `📋 <b>资产清单 (最近10个到期):</b>\n\n`;
  
  top10.forEach(item => {
    const days = getDaysRemaining(item.expiryDate);
    const icon = days < 0 ? '🔴' : days <= 30 ? '🟠' : '🟢';
    const typeIcon = item.type === 'VPS' ? '🖥️' : '🌐';
    
    text += `${icon} ${typeIcon} <b>${item.name}</b>\n` +
            `   💰 ${item.currency}${item.cost} | 📅 ${item.expiryDate}\n`;
  });

  if (resources.length > 10) {
    text += `\n<i>...以及其他 ${resources.length - 10} 个资产</i>`;
  }

  await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text, parse_mode: 'HTML' });
}

// Command: /help or Unknown
async function handleHelp(env: Env, chatId: number) {
  const text = `❓ <b>可用指令列表:</b>\n\n` +
               `/status - 查看统计数据\n` +
               `/expiring - 查看紧急资产\n` +
               `/list - 查看资产列表\n` +
               `/start - 欢迎菜单`;
  
  await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text, parse_mode: 'HTML' });
}

// Main Command Processor
export async function processTelegramCommand(env: Env, message: TelegramMessage) {
  if (!message.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();
  const command = text.split(' ')[0].toLowerCase(); // Get the first word as command

  // Fetch data only if needed (for status, list, expiring) to save KV reads on /start
  let resources: Resource[] = [];
  if (['/status', '/list', '/expiring'].includes(command)) {
    resources = await getResources(env);
  }

  switch (command) {
    case '/start':
      await handleStart(env, chatId);
      break;
    case '/status':
      await handleStatus(env, chatId, resources);
      break;
    case '/expiring':
      await handleExpiring(env, chatId, resources);
      break;
    case '/list':
      await handleList(env, chatId, resources);
      break;
    case '/help':
      await handleHelp(env, chatId);
      break;
    default:
      // Optional: Don't reply to random text to avoid spam, or send help
      if (text.startsWith('/')) {
        await handleHelp(env, chatId);
      }
      break;
  }
}
