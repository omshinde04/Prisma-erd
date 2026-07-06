import { parseAppEnvironment } from "./env-schema.js";
import { AppConfigurationError } from "../utils/errors.js";

export function loadAppConfig(environment = process.env) {
  const result = parseAppEnvironment(environment);

  if (!result.success) {
    throw AppConfigurationError.fromZodError(result.error);
  }

  return result.data;
}
