import Mission from "../models/missionModel.js"
import Drone from "../models/drone-model.js"
import { AppError } from "../utils/app-error.js"
import { generateWaypoints } from "../utils/mission-utils.js"
import Waypoint from "../models/waypointModal.js"

import { logger } from "../utils/logger.js"

// Get all missions for the organization
export const getAllMissions = async (req, res, next) => {
  try {
    const missions = await Mission.find({ organization: req.user.organization })
      .populate("drone", "name serialNumber model status")
      .populate("createdBy", "name email")

    res.status(200).json({
      status: "success",
      results: missions.length,
      data: {
        missions,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Get a single mission by ID
export const getMissionById = async (req, res, next) => {
  try {
    const mission = await Mission.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })
      .populate("drone", "name serialNumber model status telemetry")
      .populate("createdBy", "name email")

    if (!mission) {
      return next(new AppError("Mission not found", 404))
    }

    res.status(200).json({
      status: "success",
      data: {
        mission,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Create a new mission
export const createMission = async (req, res) => {
  const { name, description, droneId, location, missionType, patternType, parameters, boundary, schedule } = req.body

  try {
    // Create the mission without waypoints
    const mission = await Mission.create({
      name,
      description,
      organization: req.user.organization,
      location,
      drone: droneId,
      createdBy: req.user.id,
      missionType,
      patternType,
      parameters,
      boundary,
      schedule,
      progress: {
        percentComplete: 0,
        currentWaypoint: 0,
        estimatedTimeRemaining: 0, // Adjust as needed
      },
    })

    // Generate waypoints
    const waypoints = generateWaypoints(boundary, patternType, parameters)
    console.log(`Number of waypoints generated: ${waypoints.length}`)

    // Prepare waypoint documents linked to the mission
    const waypointDocs = waypoints.map((wp) => ({
      mission: mission._id,
      order: wp.order,
      latitude: wp.latitude,
      longitude: wp.longitude,
      altitude: wp.altitude,
      action: wp.action,
      hoverTime: wp.hoverTime,
    }))

    // Insert waypoints into the Waypoint collection
    await Waypoint.insertMany(waypointDocs)

    res.status(201).json(mission)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update a mission
export const updateMission = async (req, res, next) => {
  try {
    const { name, description, location, missionType, patternType, parameters, boundary, schedule } = req.body

    // Find the mission
    const mission = await Mission.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })

    if (!mission) {
      return next(new AppError("Mission not found", 404))
    }

    // Check if mission can be updated (only if it's in 'planned' status)
    if (mission.status !== "planned") {
      return next(new AppError(`Cannot update mission in ${mission.status} status`, 400))
    }

    // If boundary or pattern type changed, regenerate waypoints
    let waypoints = mission.waypoints
    if (boundary || patternType || parameters) {
      waypoints = generateWaypoints(
        boundary || mission.boundary,
        patternType || mission.patternType,
        parameters || mission.parameters
      )
    }

    // Update the mission
    const updatedMission = await Mission.findByIdAndUpdate(
      req.params.id,
      {
        name: name || mission.name,
        description: description || mission.description,
        location: location || mission.location,
        missionType: missionType || mission.missionType,
        patternType: patternType || mission.patternType,
        parameters: parameters || mission.parameters,
        boundary: boundary || mission.boundary,
        waypoints,
        schedule: schedule || mission.schedule,
      },
      {
        new: true,
        runValidators: true,
      }
    )

    logger.info(`Mission updated: ${updatedMission.name} (${updatedMission._id})`)

    res.status(200).json({
      status: "success",
      data: {
        mission: updatedMission,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Delete a mission
export const deleteMission = async (req, res, next) => {
  try {
    const mission = await Mission.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })

    if (!mission) {
      return next(new AppError("Mission not found", 404))
    }

    // Check if mission can be deleted (only if it's in 'planned' status)
    if (mission.status !== "planned") {
      return next(new AppError(`Cannot delete mission in ${mission.status} status`, 400))
    }

    await Mission.findByIdAndDelete(req.params.id)

    logger.info(`Mission deleted: ${mission.name} (${mission._id})`)

    res.status(204).json({
      status: "success",
      data: null,
    })
  } catch (error) {
    next(error)
  }
}

// Start a mission
export const startMission = async (req, res, next) => {
  try {
    const mission = await Mission.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })

    if (!mission) {
      return next(new AppError("Mission not found", 404))
    }

    // Check if mission can be started
    if (mission.status !== "planned") {
      return next(new AppError(`Cannot start mission in ${mission.status} status`, 400))
    }

    // Check if drone is available
    const drone = await Drone.findById(mission.drone)
    if (!drone) {
      return next(new AppError("Drone not found", 404))
    }

    // Update mission status and start time
    const updatedMission = await Mission.findByIdAndUpdate(
      req.params.id,
      {
        status: "in-progress",
        "progress.startedAt": Date.now(),
      },
      {
        new: true,
        runValidators: true,
      }
    )

    // Update drone status
    await Drone.findByIdAndUpdate(mission.drone, { status: "in-mission" })

    // Emit real-time update via Socket.io
    req.io.to(req.params.id).emit("mission-started", {
      missionId: updatedMission._id,
      status: updatedMission.status,
      startedAt: updatedMission.progress.startedAt,
    })

    logger.info(`Mission started: ${mission.name} (${mission._id})`)

    res.status(200).json({
      status: "success",
      data: {
        mission: updatedMission,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Pause a mission
export const pauseMission = async (req, res, next) => {
  try {
    const mission = await Mission.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })

    if (!mission) {
      return next(new AppError("Mission not found", 404))
    }

    // Check if mission can be paused
    if (mission.status !== "in-progress") {
      return next(new AppError(`Cannot pause mission in ${mission.status} status`, 400))
    }

    // Add log entry
    mission.logs.push({
      timestamp: Date.now(),
      level: "info",
      message: "Mission paused by operator",
    })

    await mission.save()

    // Emit real-time update via Socket.io
    req.io.to(req.params.id).emit("mission-paused", {
      missionId: mission._id,
      message: "Mission paused by operator",
    })

    logger.info(`Mission paused: ${mission.name} (${mission._id})`)

    res.status(200).json({
      status: "success",
      data: {
        mission,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Resume a mission
export const resumeMission = async (req, res, next) => {
  try {
    const mission = await Mission.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })

    if (!mission) {
      return next(new AppError("Mission not found", 404))
    }

    // Add log entry
    mission.logs.push({
      timestamp: Date.now(),
      level: "info",
      message: "Mission resumed by operator",
    })

    await mission.save()

    // Emit real-time update via Socket.io
    req.io.to(req.params.id).emit("mission-resumed", {
      missionId: mission._id,
      message: "Mission resumed by operator",
    })

    logger.info(`Mission resumed: ${mission.name} (${mission._id})`)

    res.status(200).json({
      status: "success",
      data: {
        mission,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Abort a mission
export const abortMission = async (req, res, next) => {
  try {
    const mission = await Mission.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })

    if (!mission) {
      return next(new AppError("Mission not found", 404))
    }

    // Check if mission can be aborted
    if (mission.status !== "in-progress") {
      return next(new AppError(`Cannot abort mission in ${mission.status} status`, 400))
    }

    // Update mission status
    mission.status = "aborted"
    mission.logs.push({
      timestamp: Date.now(),
      level: "warning",
      message: `Mission aborted by operator: ${req.body.reason || "No reason provided"}`,
    })

    await mission.save()

    // Update drone status
    await Drone.findByIdAndUpdate(mission.drone, { status: "available" })

    // Emit real-time update via Socket.io
    req.io.to(req.params.id).emit("mission-aborted", {
      missionId: mission._id,
      status: mission.status,
      reason: req.body.reason || "No reason provided",
    })

    logger.info(`Mission aborted: ${mission.name} (${mission._id})`)

    res.status(200).json({
      status: "success",
      data: {
        mission,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Complete a mission
export const completeMission = async (req, res, next) => {
  try {
    const mission = await Mission.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })

    if (!mission) {
      return next(new AppError("Mission not found", 404))
    }

    // Update mission status
    mission.status = "completed"
    mission.progress.percentComplete = 100
    mission.progress.estimatedTimeRemaining = 0
    mission.progress.completedAt = Date.now()

    mission.logs.push({
      timestamp: Date.now(),
      level: "info",
      message: "Mission completed successfully",
    })

    await mission.save()

    // Update drone status
    await Drone.findByIdAndUpdate(mission.drone, { status: "available" })

    // Emit real-time update via Socket.io
    req.io.to(req.params.id).emit("mission-completed", {
      missionId: mission._id,
      status: mission.status,
      completedAt: mission.progress.completedAt,
    })

    logger.info(`Mission completed: ${mission.name} (${mission._id})`)

    res.status(200).json({
      status: "success",
      data: {
        mission,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Update mission progress
export const updateMissionProgress = async (req, res, next) => {
  try {
    const { percentComplete, currentWaypoint, estimatedTimeRemaining, telemetry } = req.body

    const mission = await Mission.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })

    if (!mission) {
      return next(new AppError("Mission not found", 404))
    }

    // Check if mission is in progress
    if (mission.status !== "in-progress") {
      return next(new AppError(`Cannot update progress for mission in ${mission.status} status`, 400))
    }

    // Update progress
    mission.progress.percentComplete = percentComplete || mission.progress.percentComplete
    mission.progress.currentWaypoint = currentWaypoint || mission.progress.currentWaypoint
    mission.progress.estimatedTimeRemaining = estimatedTimeRemaining || mission.progress.estimatedTimeRemaining

    // Add telemetry data if provided
    if (telemetry) {
      mission.telemetry.push({
        timestamp: Date.now(),
        position: telemetry.position,
        batteryLevel: telemetry.batteryLevel,
        speed: telemetry.speed,
        heading: telemetry.heading,
      })
    }

    await mission.save()

    // Emit real-time update via Socket.io
    req.io.to(req.params.id).emit("mission-progress", {
      missionId: mission._id,
      progress: mission.progress,
      telemetry: telemetry ? mission.telemetry[mission.telemetry.length - 1] : null,
    })

    res.status(200).json({
      status: "success",
      data: {
        progress: mission.progress,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Helper function to calculate total distance of waypoints
function calculateTotalDistance(waypoints) {
  let totalDistance = 0

  for (let i = 0; i < waypoints.length - 1; i++) {
    const point1 = waypoints[i]
    const point2 = waypoints[i + 1]

    // Calculate distance between two points using Haversine formula
    const distance = calculateHaversineDistance(point1.latitude, point1.longitude, point2.latitude, point2.longitude)

    totalDistance += distance
  }

  return totalDistance
}

// Haversine formula to calculate distance between two coordinates in kilometers
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in km

  return distance
}
