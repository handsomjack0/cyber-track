
import { Env, Resource, ResourceType } from '../../../utils/storage';
import { sendMessage } from '../client';
import { formatResourceItem } from '../formatters/index';

// Helper: Calculate days remaining for sorting
const getDaysRemaining = (expiryDate?: string) => {
  if (!expiryDate) return 9999; 
  const today = new Date();
  const target = new Date(expiryDate);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const formatResourceList = (list: Resource[], title: string): string => {
  if (list.length === 0) return `📭 <b>${title}</b>\n\n暂无相关资产。`;

  let text = `📋 <b>${title} (${list.length}):</b>\n\n`;
  const displayed = list.slice(0, 10); // Limit per message to avoid too long text

  displayed.forEach(item => {
    text += formatResourceItem(item) + '\n\n';
  });

  if (list.length > 10) {
    text += `<i>...以及其他 ${list.length - 10} 个资产，请使用 /search 查找。</i>`;
  }
  return text;
};

export async function handleStatus(env: Env, chatId: number, resources: Resource[]) {
  const total = resources.length;
  if (total === 0) {
    await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text: `📊 数据库为空。`, parse_mode: 'HTML' });
    return;
  }

  const expired = resources.filter(r => r.expiryDate && getDaysRemaining(r.expiryDate) < 0).length;
  const urgent = resources.filter(r => r.expiryDate && getDaysRemaining(r.expiryDate) >= 0 && getDaysRemaining(r.expiryDate) <= 30).length;

  // Group by type stats
  const vpsCount = resources.filter(r => r.type === 'VPS').length;
  const domainCount = resources.filter(r => r.type === 'DOMAIN').length;
  const accountCount = resources.filter(r => r.type === 'ACCOUNT').length;
  const phoneCount = resources.filter(r => r.type === 'PHONE_NUMBER').length;

  const text = `📊 <b>系统状态概览</b>\n` +
               `━━━━━━━━━━━━━━━━\n` +
               `📦 <b>总资产数:</b> ${total}\n` +
               `   ├ 🖥️ VPS: ${vpsCount}\n` +
               `   ├ 🌐 域名: ${domainCount}\n` +
               `   ├ 📱 号码: ${phoneCount}\n` +
               `   └ 🔑 账号: ${accountCount}\n\n` +
               `🚨 <b>已过期:</b> ${expired}\n` +
               `⚠️ <b>30天内到期:</b> ${urgent}\n\n` +
               `发送 /expiring 查看需处理项`;

  await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text, parse_mode: 'HTML' });
}

export async function handleExpiring(env: Env, chatId: number, resources: Resource[]) {
  const urgentList = resources
    .filter(r => r.expiryDate && getDaysRemaining(r.expiryDate) <= 30)
    .sort((a, b) => getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate));

  const text = formatResourceList(urgentList, '紧急/过期资产');
  await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text, parse_mode: 'HTML' });
}

export async function handleList(env: Env, chatId: number, resources: Resource[], typeFilter?: ResourceType) {
  let list = resources;
  let title = '资产总览';

  if (typeFilter) {
    list = list.filter(r => r.type === typeFilter);
    title = `${typeFilter} 列表`;
    // Map nice titles
    if (typeFilter === 'VPS') title = '🖥️ VPS 主机列表';
    if (typeFilter === 'DOMAIN') title = '🌐 域名列表';
    if (typeFilter === 'ACCOUNT') title = '🔑 账号订阅列表';
    if (typeFilter === 'PHONE_NUMBER') title = '📱 手机号码列表';
  }
  
  // Sort by expiry
  list.sort((a, b) => getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate));

  const text = formatResourceList(list, title);
  await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text, parse_mode: 'HTML' });
}

export async function handleSearch(env: Env, chatId: number, resources: Resource[], query: string) {
  if (!query) {
    await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text: '🔍 请提供搜索关键词，例如: <code>/search google</code>', parse_mode: 'HTML' });
    return;
  }

  const lowerQ = query.toLowerCase();
  const results = resources.filter(r => 
    r.name.toLowerCase().includes(lowerQ) || 
    r.provider.toLowerCase().includes(lowerQ) ||
    (r.notes && r.notes.toLowerCase().includes(lowerQ))
  );

  const text = formatResourceList(results, `搜索结果: "${query}"`);
  await sendMessage(env.TELEGRAM_BOT_TOKEN!, { chat_id: chatId, text, parse_mode: 'HTML' });
}
