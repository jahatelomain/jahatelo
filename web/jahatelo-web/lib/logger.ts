import pino from 'pino';

/**
 * Logger estructurado con Pino
 * Usa formato pretty en desarrollo, JSON en producción
 */
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    env: process.env.NODE_ENV,
  },
});

export default logger;

/**
 * Log de errores con contexto adicional
 */
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
};

/**
 * Log de requests HTTP
 */
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

/**
 * Log de eventos de autenticación
 */
export const logAuth = (
  action: 'login' | 'logout' | 'register' | 'failed_login',
  userId?: string,
  success?: boolean,
  metadata?: Record<string, any>
) => {
  logger.info({
    type: 'auth',
    action,
    userId,
    success,
    ...metadata,
  });
};

/**
 * Log de operaciones de base de datos
 */
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

/**
 * Log de eventos de negocio importantes
 */
export const logBusiness = (
  event: string,
  metadata: Record<string, any>
) => {
  logger.info({
    type: 'business',
    event,
    ...metadata,
  });
};

/**
 * Log de advertencias de seguridad
 */
export const logSecurity = (
  event: 'rate_limit_exceeded' | 'invalid_token' | 'unauthorized_access' | 'suspicious_activity',
  metadata: Record<string, any>
) => {
  logger.warn({
    type: 'security',
    event,
    ...metadata,
  });
};
