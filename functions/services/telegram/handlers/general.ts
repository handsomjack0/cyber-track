import { Env } from '../../../utils/storage';
import { sendMessage } from '../client';

export async function handleStart(env: Env, chatId: number) {
  const text = `👋 <b>欢迎使用 cyberTrack 资产助手！</b>\n\n` +
               `你的当前 Chat ID 为：<code>${chatId}</code>\n` +
               `请将该 ID 填入 cyberTrack 控制台的“全局设置 → 通知配置”，完成绑定。\n\n` +
               `绑定成功后可使用指令（输入“/”可查看菜单），也可直接自然语言提问：\n` +
               `• /status - 资产概览\n` +
               `• /expiring - 30 天内到期\n` +
               `• /list - 全部资源\n` +
               `• /search <关键词> - 搜索资源\n` +
               `• /detail <ID/关键词> - 查看资产详情\n` +
               `• /ai <问题> - 智能问答\n` +
               `• /help - 查看全部指令`;

  await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text, parse_mode: 'HTML' });
}

export async function handleHelp(env: Env, chatId: number) {
  const text = `🧭 <b>可用指令列表</b>\n\n` +
               `<b>通用</b>\n` +
               `/start - 绑定账户并查看 Chat ID\n` +
               `/help - 查看全部指令\n` +
               `/status - 资产概览\n` +
               `/expiring - 30 天内到期\n` +
               `/list - 全部资源\n` +
               `/search <关键词> - 搜索资源\n` +
               `/detail <ID/关键词> - 查看资产详情\n` +
               `/ai <问题> - 智能问答\n\n` +
               `<b>分类查看</b>\n` +
               `/vps - VPS 资源\n` +
               `/domains - 域名资源\n` +
               `/accounts - 账号资源\n` +
               `/cellphones - 手机号码\n\n` +
               `<b>智能问答</b>\n` +
               `直接输入你的问题即可（无需加“/”）。`;

  await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text, parse_mode: 'HTML' });
}

export async function handleUnauthorized(env: Env, chatId: number) {
  const text = `🔒 <b>未授权访问</b>\n\n` +
               `你的 Chat ID（<code>${chatId}</code>）与系统配置不匹配。\n` +
               `请联系管理员，或在控制台更新 Telegram 设置。`;

  await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text, parse_mode: 'HTML' });
}
