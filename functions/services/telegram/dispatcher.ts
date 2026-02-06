
import { Env, getResources, Resource, ResourceType } from '../../utils/storage';
import { TelegramMessage } from './types';
import { isAuthorized } from './auth';
import { handleStart, handleHelp, handleUnauthorized } from './handlers/general';
import { handleStatus, handleList, handleExpiring, handleSearch } from './handlers/resources';
import { handleAiMessage } from './handlers/ai';

// Main Command Processor
export async function processTelegramCommand(env: Env, message: TelegramMessage) {
  if (!message.text) return;

  const chatId = message.chat.id;
  const fullText = message.text.trim();
  const parts = fullText.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  // 1. Handle /start (Public access allowed to get Chat ID)
  if (command === '/start') {
    await handleStart(env, chatId);
    return;
  }

  // 2. Authorization Check for all other commands
  const authorized = await isAuthorized(env, chatId);
  if (!authorized) {
    await handleUnauthorized(env, chatId);
    return;
  }

  // 2.5 Non-command messages go to AI assistant
  if (!fullText.startsWith('/')) {
    await handleAiMessage(env, chatId, fullText);
    return;
  }

  // 3. Pre-fetch resources for commands that need them
  let resources: Resource[] = [];
  const resourceCommands = ['/status', '/list', '/expiring', '/search', '/vps', '/domains', '/accounts', '/cellphones'];
  
  if (resourceCommands.includes(command)) {
    resources = await getResources(env);
  }

  // 4. Dispatch
  switch (command) {
    case '/ai':
      await handleAiMessage(env, chatId, fullText, { source: 'command' });
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
    case '/vps':
      await handleList(env, chatId, resources, 'VPS');
      break;
    case '/domains':
      await handleList(env, chatId, resources, 'DOMAIN');
      break;
    case '/accounts':
      await handleList(env, chatId, resources, 'ACCOUNT');
      break;
     case '/cellphones':
      await handleList(env, chatId, resources, 'PHONE_NUMBER');
      break;
    case '/search':
      await handleSearch(env, chatId, resources, args);
      break;
    case '/help':
      await handleHelp(env, chatId);
      break;
    default:
      // Unknown command? Maybe just help or ignore
      if (fullText.startsWith('/')) {
        await handleHelp(env, chatId);
      }
      break;
  }
}
