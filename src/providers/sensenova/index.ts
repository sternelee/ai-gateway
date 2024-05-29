import { ProviderConfigs } from '../types';
import SensenovaAPIConfig from './api';
import {
  SensenovaChatCompleteConfig,
  SensenovaChatCompleteResponseTransform,
  SensenovaChatCompleteStreamChunkTransform,
} from './chatComplete';

const SensenovaConfig: ProviderConfigs = {
  chatComplete: SensenovaChatCompleteConfig,
  api: SensenovaAPIConfig,
  responseTransforms: {
    chatComplete: SensenovaChatCompleteResponseTransform,
    'stream-chatComplete': SensenovaChatCompleteStreamChunkTransform,
  },
};

export default SensenovaConfig;
