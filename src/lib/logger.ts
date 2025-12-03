/**
 * Structured logging service
 * Provides context-aware logging with structured data
 * Simple implementation that works in both browser and server environments
 */

// Simple logger that uses console with structured formatting
const baseLogger = {
    debug: (obj: any, msg?: string) => {
        if (process.env.NODE_ENV === "development") {
            const message = msg || obj;
            const context = typeof obj === "object" && msg ? obj : undefined;
            if (context) {
                console.debug(`[DEBUG] ${message}`, context);
            } else {
                console.debug(`[DEBUG] ${message}`);
            }
        }
    },
    info: (obj: any, msg?: string) => {
        const message = msg || obj;
        const context = typeof obj === "object" && msg ? obj : undefined;
        if (context) {
            console.info(`[INFO] ${message}`, context);
        } else {
            console.info(`[INFO] ${message}`);
        }
    },
    warn: (obj: any, msg?: string) => {
        const message = msg || obj;
        const context = typeof obj === "object" && msg ? obj : undefined;
        if (context) {
            console.warn(`[WARN] ${message}`, context);
        } else {
            console.warn(`[WARN] ${message}`);
        }
    },
    error: (obj: any, msg?: string) => {
        const message = msg || obj;
        const context = typeof obj === "object" && msg ? obj : undefined;
        if (context) {
            console.error(`[ERROR] ${message}`, context);
        } else {
            console.error(`[ERROR] ${message}`);
        }
    },
    fatal: (obj: any, msg?: string) => {
        const message = msg || obj;
        const context = typeof obj === "object" && msg ? obj : undefined;
        if (context) {
            console.error(`[FATAL] ${message}`, context);
        } else {
            console.error(`[FATAL] ${message}`);
        }
    },
    child: (context: any) => baseLogger,
};

/**
 * Logger context type for adding metadata to logs
 */
export interface LogContext {
    userId?: string;
    requestId?: string;
    linkId?: string;
    categoryId?: string;
    url?: string;
    [key: string]: unknown;
}

/**
 * Create a child logger with context
 */
export function createLogger(context?: LogContext) {
    if (context) {
        return baseLogger.child(context);
    }
    return baseLogger;
}

/**
 * Default logger instance
 */
export const logger = baseLogger;

/**
 * Convenience methods for logging with context
 */
export const log = {
    /**
     * Log debug information
     */
    debug(message: string, context?: LogContext) {
        if (context) {
            logger.debug(context, message);
        } else {
            logger.debug(message);
        }
    },

    /**
     * Log informational messages
     */
    info(message: string, context?: LogContext) {
        if (context) {
            logger.info(context, message);
        } else {
            logger.info(message);
        }
    },

    /**
     * Log warnings
     */
    warn(message: string, context?: LogContext) {
        if (context) {
            logger.warn(context, message);
        } else {
            logger.warn(message);
        }
    },

    /**
     * Log errors
     */
    error(message: string, error?: Error | unknown, context?: LogContext) {
        const logContext = {
            ...context,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        };

        logger.error(logContext, message);
    },

    /**
     * Log fatal errors (critical failures)
     */
    fatal(message: string, error?: Error | unknown, context?: LogContext) {
        const logContext = {
            ...context,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        };

        logger.fatal(logContext, message);
    },
};
