import jwt from "jsonwebtoken"
import { promisify } from "util"
import User from "../models/user-model.js"
import { AppError } from "../utils/app-error.js"
import { logger } from "../utils/logger.js"

export const protect = async (req, res, next) => {
  try {
    // 1) Check if token exists
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      return next(new AppError("You are not logged in. Please log in to get access.", 401))
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    // 3) Check if user still exists
    const user = await User.findById(decoded.id)
    if (!user) {
      return next(new AppError("The user belonging to this token no longer exists.", 401))
    }

    // 4) Set user in request
    req.user = {
      id: user._id,
      role: user.role,
      organization: user.organization,
    }

    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please log in again.", 401))
    }
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Your token has expired. Please log in again.", 401))
    }
    next(error)
  }
}

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt: User ${req.user.id} tried to access a restricted route`)
      return next(new AppError("You do not have permission to perform this action", 403))
    }
    next()
  }
}
