export interface TelegramChat {
  id: number;
  type: string;
  username?: string;
  first_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  chat: TelegramChat;
  date: number;
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export interface SendMessagePayload {
  chat_id: number | string;
  text: string;
  parse_mode?: 'HTML' | 'MarkdownV2';
  reply_to_message_id?: number;
  disable_web_page_preview?: boolean;
}

export interface EditMessageTextPayload {
  chat_id: number | string;
  message_id: number;
  text: string;
  parse_mode?: 'HTML' | 'MarkdownV2';
  disable_web_page_preview?: boolean;
}

export interface TelegramSentMessage {
  message_id: number;
}

export type ChatAction = 'typing' | 'upload_photo' | 'record_video' | 'upload_video' | 'record_voice' | 'upload_voice' | 'upload_document' | 'choose_sticker' | 'find_location' | 'record_video_note' | 'upload_video_note';

export interface TelegramApiResponse<T = any> {
  ok: boolean;
  result?: T;
  description?: string;
}
