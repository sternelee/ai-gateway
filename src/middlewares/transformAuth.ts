import { Context } from 'hono';
import { POWERED_BY } from '../globals';

type Bindings = {
  KV: KVNamespace
}

interface ProviderKey {
  provider: string,
  api_key: string
}

type KVVirtualKey = {
  retry?: {
    attempts: number;
    on_status_codes: number[];
  },
  cache?: {
    mode: "simple" | "semantic";
    max_age: number;
  },
  strategy?: {
    mode: 'single' | 'fallback' | 'loadbalance' | 'scientist';
  },
  targets: ProviderKey[],
  mappings?: {
    [model: string]: {
      provider: string;
      model: string;
    }
  }
}

export const transformAuth = async (c: Context<{ Bindings: Bindings }>, next: any) => {
  const requestHeaders = Object.fromEntries(c.req.raw.headers);
  const authorization = requestHeaders.authorization;
  const kv = c.env.KV;
  const model = (await c.req.json()).model;
  if (kv) {
    const config: KVVirtualKey | null = await kv.get(authorization, { type: 'json' });
    if (config) {
      const { strategy, targets, mappings = {}, ...rest } = config;
      const mode = config.strategy?.mode || "single";
      if (mode === "single" && mappings[model]) {
        const mapping = mappings[model];
        const provider = mapping.provider
        const apiKey = targets.find(x => x.provider === provider)?.api_key
        c.header(`x-${POWERED_BY}-provider`, provider);
        c.header(`authorization`, apiKey || authorization);
        c.header(`x-${POWERED_BY}-config`, JSON.stringify({
          ...rest,
          provider,
          apiKey,
          overrideParams: {
            model: mapping.model,
          }
        }));
      } else {
        c.header(`x-${POWERED_BY}-config`, JSON.stringify(config));
      }
    }
    return next()
  }
}
