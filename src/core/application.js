import { loadAppConfig } from '../config/app-config.js';
import { createLogger } from '../utils/logger.js';

export function createApplication() {
  const config = loadAppConfig();
  const logger = createLogger({ serviceName: config.serviceName });

  return {
    async start() {
      logger.info('Starting application bootstrap', {
        environment: config.nodeEnv,
        startupMode: config.startupMode,
      });

      if (config.startupMode === 'oneshot') {
        logger.info('Bootstrap completed successfully', {
          status: 'ready',
          mode: 'oneshot',
        });

        return;
      }

      logger.info('Application is running in persistent mode', {
        status: 'ready',
        mode: 'server',
      });

      const shutdownSignals = ['SIGINT', 'SIGTERM'];

      await new Promise((resolve) => {
        const shutdown = (signal) => {
          logger.info('Received shutdown signal', { signal });

          for (const currentSignal of shutdownSignals) {
            process.off(currentSignal, shutdown);
          }

          resolve();
        };

        for (const signal of shutdownSignals) {
          process.on(signal, shutdown);
        }
      });

      logger.info('Application shutdown completed', {
        status: 'stopped',
      });
    },
  };
}
