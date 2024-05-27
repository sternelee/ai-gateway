import { COZE_COM } from '../../globals';
import { Params } from '../../types/requestBody';
import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from '../types';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';

const transformGenerationConfig = (params: Params) => {
  const generationConfig: Record<string, any> = {
    user: 'apiuser',
  };
  if (params['messages']) {
    const chatHistory = [];
    for (let i = 0; i < params['messages'].length - 1; i++) {
      const message = params['messages'][i];
      const role = message.role;
      const content = message.content;
      chatHistory.push({
        role: role,
        content: content,
        content_type: 'text',
      });
    }
    const lastMessage = params['messages'][params['messages'].length - 1];
    const queryString = lastMessage.content;
    generationConfig['chat_history'] = chatHistory;
    generationConfig['query'] = queryString;
  }
  return generationConfig;
};

export const CozeChatCompleteConfig: ProviderConfig = {
  model: {
    param: 'bot_id',
    required: true,
  },
  messages: [
    {
      param: 'user',
      default: '',
      transform: (params: Params) => transformGenerationConfig(params).user,
    },
    {
      param: 'query',
      default: '',
      transform: (params: Params) => transformGenerationConfig(params).query,
    },
    {
      param: 'chat_history',
      default: '',
      transform: (params: Params) =>
        transformGenerationConfig(params).chat_history,
    },
  ],
  stream: {
    param: 'stream',
    default: false,
  },
};

export interface CozeErrorResponse {
  object: string;
  message: string;
  type: string;
  param: string | null;
  code: string;
}

interface CozeChunkMessage {
  role: 'assistant';
  type: 'answer' | 'follow_up';
  content: string;
  content_type: string;
  extra_info: null;
}

interface CozeStreamChunk {
  code: number;
  msg: string;
  event: 'message' | 'done';
  message: CozeChunkMessage;
  is_finish: boolean;
  index: number;
  conversation_id: string;
}

interface CozeChatCompleteResponse extends ChatCompletionResponse {
  model: string;
  conversation_id: string;
  code: 0;
  msg: string;
  messages: CozeChunkMessage[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const CozeChatCompleteResponseTransform: (
  response: CozeChatCompleteResponse | CozeErrorResponse,
  responseStatus: number
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if ('message' in response && responseStatus !== 200) {
    return generateErrorResponse(
      {
        message: response.message,
        type: response.type,
        param: response.param,
        code: response.code,
      },
      COZE_COM
    );
  }

  if ('messages' in response) {
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      provider: COZE_COM,
      choices: response.messages.map((c) => ({
        index: 0,
        message: {
          role: c.role,
          content: c.content,
        },
        finish_reason: '',
      })),
      usage: {
        prompt_tokens: 100,
        completion_tokens: 10,
        total_tokens: 110,
      },
    };
  }

  return generateInvalidProviderResponseError(response, COZE_COM);
};

export const CozeChatCompleteStreamChunkTransform: (
  response: string
) => string = (responseChunk) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data:/, '');
  chunk = chunk.trim();
  const parsedChunk: CozeStreamChunk = JSON.parse(chunk);
  if (parsedChunk.event === 'done') {
    return `data: [DONE]\n\n`;
  }
  if (parsedChunk.code) {
    return (
      `data: ${JSON.stringify({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: '',
        provider: COZE_COM,
        choices: [
          {
            index: 0,
            delta: parsedChunk.msg,
            finish_reason: 'stop',
          },
        ],
      })}` + '\n\n'
    );
  }
  return (
    `data: ${JSON.stringify({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: '',
      provider: COZE_COM,
      choices: [
        {
          index: parsedChunk.index,
          delta: parsedChunk.message.content,
          finish_reason: parsedChunk.is_finish ? 'stop' : '',
        },
      ],
    })}` + '\n\n'
  );
};
