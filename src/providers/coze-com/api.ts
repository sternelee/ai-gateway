import { ProviderAPIConfig } from '../types';

const CozeAPIConfig: ProviderAPIConfig = {
  getBaseURL: () => 'https://api.coze.com',
  headers: ({ providerOptions }) => {
    return { Authorization: `Bearer ${providerOptions.apiKey}` };
  },
  getEndpoint: ({ fn }) => {
    switch (fn) {
      case 'chatComplete':
        return '/open_api/v2/chat';
      default:
        return '';
    }
  },
};

export default CozeAPIConfig;
