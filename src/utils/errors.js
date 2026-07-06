export class AppError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = this.constructor.name;
    this.code = options.code ?? 'APP_ERROR';
  }
}

export class AppConfigurationError extends AppError {
  constructor(message, options = {}) {
    super(message, {
      ...options,
      code: options.code ?? 'APP_CONFIGURATION_ERROR',
    });
  }
}
