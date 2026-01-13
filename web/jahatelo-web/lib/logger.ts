type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

const shouldLog = (level: LogLevel) =>
  LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel];

const log = (level: LogLevel, payload: Record<string, unknown>) => {
  if (!shouldLog(level)) return;
  const entry = {
    level,
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  if (level === 'error') {
    console.error(entry);
    return;
  }

  if (level === 'warn') {
    console.warn(entry);
    return;
  }

  console.log(entry);
};

const logger = {
  debug: (payload: Record<string, unknown>) => log('debug', payload),
  info: (payload: Record<string, unknown>) => log('info', payload),
  warn: (payload: Record<string, unknown>) => log('warn', payload),
  error: (payload: Record<string, unknown>) => log('error', payload),
};

export default logger;

export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error({
    type: 'error',
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
};

export const logRequest = (
  method: string,
  url: string,
  duration: number,
  status: number,
  userId?: string
) => {
  logger.info({
    type: 'request',
    method,
    url,
    duration,
    status,
    userId,
  });
};

export const logAuth = (
  action: 'login' | 'logout' | 'register' | 'failed_login',
  userId?: string,
  success?: boolean,
  metadata?: Record<string, unknown>
) => {
  logger.info({
    type: 'auth',
    action,
    userId,
    success,
    ...metadata,
  });
};

export const logDatabase = (
  operation: 'create' | 'read' | 'update' | 'delete',
  entity: string,
  entityId?: string,
  duration?: number
) => {
  logger.debug({
    type: 'database',
    operation,
    entity,
    entityId,
    duration,
  });
};

export const logBusiness = (
  event: string,
  metadata: Record<string, unknown>
) => {
  logger.info({
    type: 'business',
    event,
    ...metadata,
  });
};

export const logSecurity = (
  event: 'rate_limit_exceeded' | 'invalid_token' | 'unauthorized_access' | 'suspicious_activity',
  metadata: Record<string, unknown>
) => {
  logger.warn({
    type: 'security',
    event,
    ...metadata,
  });
};
