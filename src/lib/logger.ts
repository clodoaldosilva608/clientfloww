/**
 * src/lib/logger.ts
 * Utility logger that only logs in development mode
 */

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },

  error: (...args: unknown[]) => {
    // Always log errors, but in production could send to error tracking service
    console.error(...args);
  },

  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },

  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },

  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  }
};

export default logger;
