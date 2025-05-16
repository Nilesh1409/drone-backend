import Drone from "../models/drone-model.js"
import { AppError } from "../utils/app-error.js"
import { logger } from "../utils/logger.js"

// Get all drones for the organization
export const getAllDrones = async (req, res, next) => {
  try {
    const drones = await Drone.find({ organization: req.user.organization })

    res.status(200).json({
      status: "success",
      results: drones.length,
      data: {
        drones,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Get a single drone by ID
export const getDroneById = async (req, res, next) => {
  try {
    const drone = await Drone.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })

    if (!drone) {
      return next(new AppError("Drone not found", 404))
    }

    res.status(200).json({
      status: "success",
      data: {
        drone,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Create a new drone
export const createDrone = async (req, res, next) => {
  try {
    const { name, serialNumber, model, location, capabilities } = req.body

    // Check if drone with same serial number already exists
    const existingDrone = await Drone.findOne({ serialNumber })
    if (existingDrone) {
      return next(new AppError("Drone with this serial number already exists", 400))
    }

    const drone = await Drone.create({
      name,
      serialNumber,
      model,
      organization: req.user.organization,
      location,
      capabilities,
      status: "available",
      telemetry: {
        batteryLevel: 100,
        lastKnownPosition: null,
        lastUpdated: Date.now(),
      },
    })

    logger.info(`New drone created: ${drone.name} (${drone._id})`)

    res.status(201).json({
      status: "success",
      data: {
        drone,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Update a drone
export const updateDrone = async (req, res, next) => {
  try {
    const { name, model, location, status, capabilities } = req.body

    const drone = await Drone.findOneAndUpdate(
      {
        _id: req.params.id,
        organization: req.user.organization,
      },
      {
        name,
        model,
        location,
        status,
        capabilities,
        "telemetry.lastUpdated": Date.now(),
      },
      {
        new: true,
        runValidators: true,
      },
    )

    if (!drone) {
      return next(new AppError("Drone not found", 404))
    }

    logger.info(`Drone updated: ${drone.name} (${drone._id})`)

    res.status(200).json({
      status: "success",
      data: {
        drone,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Delete a drone
export const deleteDrone = async (req, res, next) => {
  try {
    const drone = await Drone.findOneAndDelete({
      _id: req.params.id,
      organization: req.user.organization,
    })

    if (!drone) {
      return next(new AppError("Drone not found", 404))
    }

    logger.info(`Drone deleted: ${drone.name} (${drone._id})`)

    res.status(204).json({
      status: "success",
      data: null,
    })
  } catch (error) {
    next(error)
  }
}

// Update drone telemetry
export const updateTelemetry = async (req, res, next) => {
  try {
    const { batteryLevel, latitude, longitude, altitude } = req.body

    const drone = await Drone.findOneAndUpdate(
      {
        _id: req.params.id,
        organization: req.user.organization,
      },
      {
        "telemetry.batteryLevel": batteryLevel,
        "telemetry.lastKnownPosition": {
          latitude,
          longitude,
          altitude,
        },
        "telemetry.lastUpdated": Date.now(),
      },
      {
        new: true,
        runValidators: true,
      },
    )

    if (!drone) {
      return next(new AppError("Drone not found", 404))
    }

    // Emit real-time update via Socket.io
    req.io.emit(`drone-telemetry-${drone._id}`, {
      droneId: drone._id,
      telemetry: drone.telemetry,
    })

    res.status(200).json({
      status: "success",
      data: {
        telemetry: drone.telemetry,
      },
    })
  } catch (error) {
    next(error)
  }
}
