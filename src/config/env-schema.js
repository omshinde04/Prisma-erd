import { z } from 'zod';

const nodeEnvSchema = z.enum(['development', 'test', 'production']);
const startupModeSchema = z.enum(['oneshot', 'server']);

export const appConfigSchema = z.object({
  nodeEnv: nodeEnvSchema.default('development'),
  startupMode: startupModeSchema.default('oneshot'),
  serviceName: z.literal('prisma-visual-diagram-generator'),
});

export function parseAppEnvironment(environment) {
  return appConfigSchema.safeParse({
    nodeEnv: environment.NODE_ENV,
    startupMode: environment.APP_STARTUP_MODE,
    serviceName: 'prisma-visual-diagram-generator',
  });
}
