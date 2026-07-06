import { createApplication } from './core/application.js';

const application = createApplication();

try {
  await application.start();
} catch (error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);

  console.error('[fatal] Application failed to start');
  console.error(message);

  process.exitCode = 1;
}
