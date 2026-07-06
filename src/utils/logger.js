function serializeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  return metadata;
}

export function createLogger({ serviceName }) {
  const baseMetadata = {
    service: serviceName,
  };

  function log(level, message, metadata) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...baseMetadata,
    };

    const serializedMetadata = serializeMetadata(metadata);

    if (serializedMetadata) {
      entry.metadata = serializedMetadata;
    }

    const output = JSON.stringify(entry);

    if (level === 'error') {
      console.error(output);
      return;
    }

    console.log(output);
  }

  return {
    info(message, metadata) {
      log('info', message, metadata);
    },
    warn(message, metadata) {
      log('warn', message, metadata);
    },
    error(message, metadata) {
      log('error', message, metadata);
    },
  };
}
