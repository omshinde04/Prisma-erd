import { AppConfigurationError } from '../utils/errors.js';

const VALID_NODE_ENVS = new Set(['development', 'test', 'production']);
const VALID_STARTUP_MODES = new Set(['oneshot', 'server']);

export function loadAppConfig() {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const startupMode = process.env.APP_STARTUP_MODE ?? 'oneshot';
  const serviceName = 'prisma-visual-diagram-generator';

  if (!VALID_NODE_ENVS.has(nodeEnv)) {
    throw new AppConfigurationError(
      `Invalid NODE_ENV value: ${nodeEnv}. Expected one of ${Array.from(VALID_NODE_ENVS).join(', ')}.`
    );
  }

  if (!VALID_STARTUP_MODES.has(startupMode)) {
    throw new AppConfigurationError(
      `Invalid APP_STARTUP_MODE value: ${startupMode}. Expected one of ${Array.from(VALID_STARTUP_MODES).join(', ')}.`
    );
  }

  return {
    nodeEnv,
    serviceName,
    startupMode,
  };
}
