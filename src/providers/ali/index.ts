import { ProviderConfigs } from '../types';
import AliAPIConfig from './api';
import {
  AliChatCompleteConfig,
  AliChatCompleteResponseTransform,
  AliChatCompleteStreamChunkTransform,
} from './chatComplete';

const AliConfig: ProviderConfigs = {
  chatComplete: AliChatCompleteConfig,
  api: AliAPIConfig,
  responseTransforms: {
    chatComplete: AliChatCompleteResponseTransform,
    'stream-chatComplete': AliChatCompleteStreamChunkTransform,
  },
};

export default AliConfig;
