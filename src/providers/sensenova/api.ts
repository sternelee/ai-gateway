import { ProviderAPIConfig } from '../types';

const SensenovaAPIConfig: ProviderAPIConfig = {
  getBaseURL: () => 'https://api.sensenova.cn/v1/llm',
  headers: ({ providerOptions }) => {
    return { Authorization: `Bearer ${providerOptions.apiKey}` };
  },
  getEndpoint: ({ fn }) => {
    switch (fn) {
      case 'chatComplete':
        return '/chat-completions';
      default:
        return '';
    }
  },
};

export default SensenovaAPIConfig;
