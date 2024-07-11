import { DEEPSEEK } from '../../globals';

import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from '../types';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';

export const AliChatCompleteConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
    default: '',
  },
  messages: {
    param: 'messages',
    default: '',
  },
  max_tokens: {
    param: 'max_tokens',
    default: 100,
    min: 0,
  },
  temperature: {
    param: 'temperature',
    default: 1,
    min: 0,
    max: 2,
  },
  top_p: {
    param: 'top_p',
    default: 1,
    min: 0,
    max: 1,
  },
  stream: {
    param: 'stream',
    default: false,
  },
};

type AliChatCompleteResponse = ChatCompletionResponse & {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface AliErrorResponse {
  object: string;
  message: string;
  type: string;
  param: string | null;
  code: string;
}

interface AliStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    delta: {
      role?: string | null;
      content?: string;
    };
    index: number;
    finish_reason: string | null;
  }[];
}

export const AliChatCompleteResponseTransform: (
  response: AliChatCompleteResponse | AliErrorResponse,
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
      DEEPSEEK
    );
  }

  if ('choices' in response) {
    return {
      id: response.id,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      provider: DEEPSEEK,
      choices: response.choices.map((c) => ({
        index: c.index,
        message: {
          role: c.message.role,
          content: c.message.content,
        },
        finish_reason: c.finish_reason,
      })),
      usage: {
        prompt_tokens: response.usage?.input_tokens,
        completion_tokens: response.usage?.output_tokens,
        total_tokens: response.usage?.input_tokens + response.usage?.output_tokens,
      },
    };
  }

  return generateInvalidProviderResponseError(response, DEEPSEEK);
};

export const AliChatCompleteStreamChunkTransform: (
  response: string
) => string = (responseChunk) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data: /, '');
  chunk = chunk.trim();
  if (chunk === '[DONE]') {
    return `data: ${chunk}\n\n`;
  }
  const parsedChunk: AliStreamChunk = JSON.parse(chunk);
  return (
    `data: ${JSON.stringify({
      id: parsedChunk.id,
      object: parsedChunk.object,
      created: Math.floor(Date.now() / 1000),
      model: parsedChunk.model,
      provider: DEEPSEEK,
      choices: [
        {
          index: parsedChunk.choices[0].index,
          delta: parsedChunk.choices[0].delta,
          finish_reason: parsedChunk.choices[0].finish_reason,
        },
      ],
    })}` + '\n\n'
  );
};
