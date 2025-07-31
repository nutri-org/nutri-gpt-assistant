
const logger = require('../server/lib/logger');

/**
 * Centralized error handling middleware
 * Provides consistent JSON error responses and logging
 */
const errorHandler = (err, req, res, _next) => {
  // Log the error with context
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let status = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';

  // Handle known error types
  if (err.name === 'ValidationError') {
    status = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.message;
  } else if (err.name === 'UnauthorizedError' || err.message === 'Unauthorized') {
    status = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Authentication required';
  } else if (err.name === 'ForbiddenError' || err.message === 'Forbidden') {
    status = 403;
    errorCode = 'FORBIDDEN';
    message = 'Access denied';
  } else if (err.name === 'NotFoundError') {
    status = 404;
    errorCode = 'NOT_FOUND';
    message = 'Resource not found';
  } else if (err.status && err.status >= 400 && err.status < 600) {
    // Handle errors with explicit status
    status = err.status;
    errorCode = err.code || getErrorCodeForStatus(status);
    message = err.message || message;
  }

  // Send consistent error response
  res.status(status).json({
    error: errorCode,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Get standard error code for HTTP status
 */
const getErrorCodeForStatus = (status) => {
  const statusCodes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED', 
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE'
  };
  
  return statusCodes[status] || 'UNKNOWN_ERROR';
};

/**
 * Create a standardized error object
 */
const createError = (status, message, code = null) => {
  const error = new Error(message);
  error.status = status;
  error.code = code || getErrorCodeForStatus(status);
  return error;
};

/**
 * Async wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  createError,
  asyncHandler
};
