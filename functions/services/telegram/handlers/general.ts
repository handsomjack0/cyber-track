
import { Env } from '../../../utils/storage';
import { sendMessage } from '../client';

export async function handleStart(env: Env, chatId: number) {
  const text = `👋 <b>欢迎使用 cyberTrack 资产助手!</b>\n\n` +
               `您的当前 Chat ID 是: <code class="language-text">${chatId}</code>\n` +
               `请将此 ID 填入 cyberTrack 控制台的【全局设置 -> 通知配置】中以完成绑定。\n\n` +
               `绑定完成后，您可以发送以下指令：\n` +
               `🔹 /status - 系统概览\n` +
               `🔹 /expiring - 紧急资产\n` +
               `🔹 /list - 资产列表\n` + 
               `🔹 /search &lt;关键词&gt; - 搜索资产\n` + 
               `🔹 /help - 帮助菜单`;
  
  await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text, parse_mode: 'HTML' });
}

export async function handleHelp(env: Env, chatId: number) {
  const text = `❓ <b>可用指令列表:</b>\n\n` +
               `<b>通用</b>\n` +
               `/status - 查看统计数据\n` +
               `/search &lt;关键词&gt; - 搜索特定资产\n\n` +
               `<b>分类查看</b>\n` +
               `/expiring - 查看即将过期的资产\n` +
               `/list - 查看所有资产\n` +
               `/vps - 仅查看 VPS\n` +
               `/domains - 仅查看域名\n` +
               `/accounts - 仅查看账号订阅`;
  
  await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text, parse_mode: 'HTML' });
}

export async function handleUnauthorized(env: Env, chatId: number) {
  const text = `⛔ <b>未授权访问</b>\n\n` +
               `您的 Chat ID (<code>${chatId}</code>) 与系统配置不匹配。\n` +
               `请联系管理员或在控制台更新 Telegram 设置。`;
  
  await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text, parse_mode: 'HTML' });
}
