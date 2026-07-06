import { createApplication } from "./core/application.js";
import { formatErrorForConsole } from "./utils/errors.js";

try {
  const application = createApplication();
  await application.start();
} catch (error) {
  console.error("[fatal] Application failed to start");
  console.error(formatErrorForConsole(error));

  process.exitCode = 1;
}
