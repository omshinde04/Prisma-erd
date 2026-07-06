export class AppError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = this.constructor.name;
    this.code = options.code ?? "APP_ERROR";
    this.details = options.details ?? [];
  }
}

export class AppConfigurationError extends AppError {
  constructor(message, options = {}) {
    super(message, {
      ...options,
      code: options.code ?? "APP_CONFIGURATION_ERROR",
    });
  }

  static fromZodError(error) {
    const details = error.issues.map((issue) => {
      const path =
        issue.path.length > 0 ? issue.path.join(".") : "configuration";

      return {
        path,
        message: issue.message,
      };
    });

    return new AppConfigurationError("Invalid application configuration", {
      details,
      cause: error,
    });
  }
}

export function formatErrorForConsole(error) {
  if (error instanceof AppConfigurationError && error.details.length > 0) {
    const detailLines = error.details.map(
      (detail) => `- ${detail.path}: ${detail.message}`,
    );
    return [error.message, ...detailLines].join("\n");
  }

  if (error instanceof Error) {
    return error.stack || error.message;
  }

  return String(error);
}
