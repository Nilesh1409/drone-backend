import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import http from "http"
import { Server } from "socket.io"
import helmet from "helmet"
import morgan from "morgan"
import rateLimit from "express-rate-limit"
import mongoSanitize from "express-mongo-sanitize"
import xss from "xss-clean"
import hpp from "hpp"
import compression from "compression"
import authRoutes from "./routes/auth-routes.js"
import droneRoutes from "./routes/drone-routes.js"
import missionRoutes from "./routes/mission-routes.js"
import reportRoutes from "./routes/report-routes.js"
import { errorHandler } from "./middleware/error-middleware.js"
import { logger } from "./utils/logger.js"

// Load environment variables
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` })

// Initialize Express app
const app = express()
const server = http.createServer(app)

// Setup Socket.io for real-time communication
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// Implement security headers
app.use(helmet())

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"))
} else {
  app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }))
}

// Rate limiting
const limiter = rateLimit({
  max: 100, // 100 requests per IP
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: "Too many requests from this IP, please try again after 15 minutes",
})
app.use("/api", limiter)

// Body parser
app.use(express.json({ limit: "10kb" }))
app.use(express.urlencoded({ extended: true, limit: "10kb" }))

// Data sanitization against NoSQL query injection
app.use(mongoSanitize())

// Data sanitization against XSS
app.use(xss())

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ["status", "missionType", "patternType"],
  })
)

// Compression middleware
app.use(compression())

// CORS middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  })
)

// Socket.io connection handling
io.on("connection", (socket) => {
  logger.info(`Client connected: ${socket.id}`)

  socket.on("join-mission", (missionId) => {
    socket.join(missionId)
    logger.info(`Socket ${socket.id} joined mission: ${missionId}`)
  })

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`)
  })
})

// Make io accessible to route handlers
app.use((req, res, next) => {
  req.io = io
  next()
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/drones", droneRoutes)
app.use("/api/missions", missionRoutes)
app.use("/api/reports", reportRoutes)

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// Handle undefined routes
app.all("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  })
})

// Error handling middleware
app.use(errorHandler)

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000

// Graceful shutdown function
const gracefulShutdown = async () => {
  logger.info("Received shutdown signal, closing connections...")

  try {
    await mongoose.connection.close()
    logger.info("MongoDB connection closed")

    server.close(() => {
      logger.info("HTTP server closed")
      process.exit(0)
    })

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error("Could not close connections in time, forcefully shutting down")
      process.exit(1)
    }, 10000)
  } catch (error) {
    logger.error("Error during shutdown:", error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on("SIGTERM", gracefulShutdown)
process.on("SIGINT", gracefulShutdown)

// Connect to MongoDB with retry logic
const connectWithRetry = async (retries = 5, interval = 5000) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log("🚀 ~ connectWithRetry ~ rocess.env.MONGODB_URI:", process.env.MONGODB_URI)
    logger.info("Connected to MongoDB")

    server.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
    })
  } catch (err) {
    if (retries === 0) {
      logger.error("MongoDB connection failed after multiple attempts:", err)
      process.exit(1)
    }

    logger.warn(`MongoDB connection attempt failed. Retrying in ${interval / 1000}s... (${retries} attempts left)`)
    setTimeout(() => connectWithRetry(retries - 1, interval), interval)
  }
}

connectWithRetry()

// Export for testing purposes
export { app, io }
