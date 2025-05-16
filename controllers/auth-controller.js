import jwt from "jsonwebtoken"
import User from "../models/user-model.js"
import Organization from "../models/organization-model.js"
import { AppError } from "../utils/app-error.js"
import { logger } from "../utils/logger.js"

// Register a new user and organization
export const register = async (req, res, next) => {
  try {
    const { email, password, name, organizationName, organizationDescription } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return next(new AppError("User with this email already exists", 400))
    }

    // Create organization
    const organization = await Organization.create({
      name: organizationName,
      description: organizationDescription || "",
      locations: [],
    })

    // Create user with admin role
    const user = await User.create({
      email,
      password,
      name,
      role: "admin",
      organization: organization._id,
    })

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role, organization: user.organization }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    })

    // Update last login
    user.lastLogin = Date.now()
    await user.save()

    logger.info(`New user registered: ${user.email} (${user._id})`)

    res.status(201).json({
      status: "success",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: {
          id: organization._id,
          name: organization.name,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

// Login user
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    console.log("🚀 ~ login ~ email, password:", email, password)

    // Check if user exists
    const user = await User.findOne({ email: "operator@example.com" }).select("+password")
    if (!user) {
      console.log("user", user)
      return next(new AppError("Invalid email or password", 401))
    }

    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      console.log("user", isPasswordValid)

      return next(new AppError("Invalid email or password", 401))
    }

    // Get organization details
    const organization = await Organization.findById(user.organization)
    if (!organization) {
      return next(new AppError("Organization not found", 404))
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role, organization: user.organization }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    })

    // Update last login
    user.lastLogin = Date.now()
    await user.save()

    logger.info(`User logged in: ${user.email} (${user._id})`)

    res.status(200).json({
      status: "success",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: {
          id: organization._id,
          name: organization.name,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

// Get current user profile
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return next(new AppError("User not found", 404))
    }

    const organization = await Organization.findById(user.organization)

    res.status(200).json({
      status: "success",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: {
          id: organization._id,
          name: organization.name,
          locations: organization.locations,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

// Create a new user (admin only)
export const createUser = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body

    // Check if user is admin
    if (req.user.role !== "admin") {
      return next(new AppError("Only admins can create new users", 403))
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return next(new AppError("User with this email already exists", 400))
    }

    // Create user with the same organization as the admin
    const user = await User.create({
      email,
      password,
      name,
      role: role || "operator",
      organization: req.user.organization,
    })

    logger.info(`New user created by admin: ${user.email} (${user._id})`)

    res.status(201).json({
      status: "success",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    next(error)
  }
}
