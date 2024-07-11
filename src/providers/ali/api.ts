import { ProviderAPIConfig } from '../types';

const CozeAPIConfig: ProviderAPIConfig = {
  getBaseURL: () => `https://dashscope.aliyuncs.com/api/v1/services`,
  headers: ({ providerOptions }) => {
    return { Authorization: `Bearer ${providerOptions.apiKey}` };
  },
  getEndpoint: ({ fn, gatewayRequestBody }) => {
    const { model } = gatewayRequestBody
    switch (fn) {
      case 'chatComplete':
        return model?.includes('qwen-vl') ? '/aigc/text-generation/generation' : '/aigc/multimodal-generation/generation';
      case 'embed':
        return '/embeddings/text-embedding/text-embedding';
      default:
        return '';
    }
  },
};

export default CozeAPIConfig;
