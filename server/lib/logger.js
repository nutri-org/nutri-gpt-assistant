
/**
 * Simple structured logger utility
 * Can be extended to use Winston or other logging libraries
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.info;

/**
 * Format log message with timestamp and metadata
 */
const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...meta
  };
  
  return JSON.stringify(logEntry);
};

/**
 * Log error messages
 */
const error = (message, meta = {}) => {
  if (currentLevel >= LOG_LEVELS.error) {
    console.error(formatMessage('error', message, meta));
  }
};

/**
 * Log warning messages
 */
const warn = (message, meta = {}) => {
  if (currentLevel >= LOG_LEVELS.warn) {
    console.warn(formatMessage('warn', message, meta));
  }
};

/**
 * Log info messages
 */
const info = (message, meta = {}) => {
  if (currentLevel >= LOG_LEVELS.info) {
    console.log(formatMessage('info', message, meta));
  }
};

/**
 * Log debug messages
 */
const debug = (message, meta = {}) => {
  if (currentLevel >= LOG_LEVELS.debug) {
    console.log(formatMessage('debug', message, meta));
  }
};

module.exports = {
  error,
  warn,
  info,
  debug
};
