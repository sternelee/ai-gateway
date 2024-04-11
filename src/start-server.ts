#!/usr/bin/env node

import { handle } from 'hono/vercel';

import app from './index';

export const runtime = 'edge';

export default handle(app);

console.log(`Your AI Gateway is now running 🚀`);
