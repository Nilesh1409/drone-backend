import { AppError } from "../utils/app-error.js"
import { logger } from "../utils/logger.js"

// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message
  error.stack = err.stack

  // Log error
  logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
  })

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ")
    error = new AppError(message, 400)
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const value = err.keyValue[field]
    const message = `Duplicate field value: ${field} with value: ${value}. Please use another value.`
    error = new AppError(message, 400)
  }

  // Mongoose CastError (invalid ID)
  if (err.name === "CastError") {
    const message = `Invalid ${err.path}: ${err.value}`
    error = new AppError(message, 400)
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token. Please log in again.", 401)
  }

  if (err.name === "TokenExpiredError") {
    error = new AppError("Your token has expired. Please log in again.", 401)
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    status: error.status || "error",
    message: error.message || "Something went wrong",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  })
}
