import { SENSENOVA } from '../../globals';
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

export const SensenovaChatCompleteConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: true,
  },
  n: {
    param: 'n',
    default: 1,
  },
  messages: {
    param: 'messages',
    default: [],
  },
  repetition_penalty: {
    param: 'repetition_penalty',
  },
  know_ids: {
    param: 'know_ids',
    default: [],
  },
  max_tokens: {
    param: 'max_new_tokens',
    default: 1024,
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
  user: {
    param: 'user',
    default: 'apiuser'
  },
  stream: {
    param: 'stream',
    default: false,
  },
  knowledge_config: {
    param: 'knowledge_config',
  },
  plugins: {
    param: 'plugins',
  },
};

interface SensenovaChatCompleteResponse extends ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface SensenovaErrorResponse {
  object: string;
  message: string;
  type: string;
  param: string | null;
  code: string;
}

interface SensenovaStreamChunk {
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

export const SensenovaChatCompleteResponseTransform: (
  response: SensenovaChatCompleteResponse | SensenovaErrorResponse,
  responseStatus: number
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  console.log(response)
  if ('message' in response && responseStatus !== 200) {
    return generateErrorResponse(
      {
        message: response.message,
        type: response.type,
        param: response.param,
        code: response.code,
      },
      SENSENOVA
    );
  }

  if ('choices' in response) {
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      provider: SENSENOVA,
      choices: response.choices.map((c) => ({
        index: c.index,
        message: {
          role: c.message.role,
          content: c.message.content,
        },
        finish_reason: c.finish_reason,
      })),
      usage: {
        prompt_tokens: response.usage?.prompt_tokens,
        completion_tokens: response.usage?.completion_tokens,
        total_tokens: response.usage?.total_tokens,
      },
    };
  }

  return generateInvalidProviderResponseError(response, SENSENOVA);
};

export const SensenovaChatCompleteStreamChunkTransform: (
  response: string
) => string = (responseChunk) => {
  let chunk = responseChunk.trim();
  chunk = chunk.replace(/^data: /, '');
  chunk = chunk.trim();
  console.log(chunk)
  if (chunk === '[DONE]') {
    return `data: ${chunk}\n\n`;
  }
  const parsedChunk: SensenovaStreamChunk = JSON.parse(chunk);
  return (
    `data: ${JSON.stringify({
      id: parsedChunk.id,
      object: parsedChunk.object,
      created: parsedChunk.created,
      model: parsedChunk.model,
      provider: SENSENOVA,
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
