import mongoose from "mongoose"
import dotenv from "dotenv"
import bcrypt from "bcryptjs"
import User from "../models/user-model.js"
import Organization from "../models/organization-model.js"
import Drone from "../models/drone-model.js"
import Mission from "../models/missionModel.js"
import Report from "../models/report-model.js"
import { logger } from "../utils/logger.js"

// Load environment variables
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` })

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("MongoDB connected for seeding"))
  .catch((err) => {
    logger.error("MongoDB connection error:", err)
    process.exit(1)
  })

// Sample data
const sampleData = {
  organizations: [
    {
      name: "Acme Drone Surveys",
      description: "Leading drone survey company for industrial inspections",
      locations: [
        {
          name: "Headquarters",
          address: "123 Main St, San Francisco, CA",
          coordinates: {
            latitude: 37.7749,
            longitude: -122.4194,
          },
        },
        {
          name: "Field Office",
          address: "456 Market St, Los Angeles, CA",
          coordinates: {
            latitude: 34.0522,
            longitude: -118.2437,
          },
        },
      ],
      settings: {
        defaultAltitude: 50,
        defaultOverlap: 30,
        safetyParameters: {
          maxWindSpeed: 20,
          minBatteryLevel: 20,
        },
      },
    },
  ],
  users: [
    {
      email: "admin@example.com",
      password: "password123",
      name: "Admin User",
      role: "admin",
    },
    {
      email: "operator@example.com",
      password: "password123",
      name: "Operator User",
      role: "operator",
    },
    {
      email: "viewer@example.com",
      password: "password123",
      name: "Viewer User",
      role: "viewer",
    },
  ],
  drones: [
    {
      name: "Surveyor X1",
      serialNumber: "SX1-001",
      model: "DJI Phantom 4 RTK",
      status: "available",
      capabilities: {
        maxFlightTime: 30,
        maxSpeed: 45,
        maxAltitude: 120,
        sensors: ["rgb", "multispectral"],
      },
      telemetry: {
        batteryLevel: 100,
        lastKnownPosition: {
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: 0,
        },
      },
    },
    {
      name: "Mapper Pro",
      serialNumber: "MP-002",
      model: "DJI Matrice 300 RTK",
      status: "available",
      capabilities: {
        maxFlightTime: 55,
        maxSpeed: 55,
        maxAltitude: 200,
        sensors: ["rgb", "thermal", "lidar"],
      },
      telemetry: {
        batteryLevel: 85,
        lastKnownPosition: {
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: 0,
        },
      },
    },
  ],
}

// Seed function
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({})
    await Organization.deleteMany({})
    await Drone.deleteMany({})
    await Mission.deleteMany({})
    await Report.deleteMany({})

    logger.info("Cleared existing data")

    // Create organizations
    const organizations = await Organization.create(sampleData.organizations)
    logger.info(`Created ${organizations.length} organizations`)

    // Create users
    const users = []
    for (const userData of sampleData.users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        organization: organizations[0]._id,
      })
      users.push(user)
    }
    logger.info(`Created ${users.length} users`)

    // Create drones
    const drones = []
    for (const droneData of sampleData.drones) {
      const drone = await Drone.create({
        ...droneData,
        organization: organizations[0]._id,
      })
      drones.push(drone)
    }
    logger.info(`Created ${drones.length} drones`)

    // Create a sample mission
    const mission = await Mission.create({
      name: "Factory Roof Inspection",
      description: "Monthly inspection of factory roof",
      organization: organizations[0]._id,
      location: {
        name: "Factory Site",
        coordinates: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      },
      drone: drones[0]._id,
      createdBy: users[0]._id,
      status: "completed",
      missionType: "inspection",
      patternType: "grid",
      parameters: {
        altitude: 40,
        speed: 5,
        overlap: 30,
        sensorSettings: {
          captureInterval: 2,
          activeSensors: ["rgb"],
        },
      },
      boundary: {
        type: "Polygon",
        coordinates: [
          [
            [-122.4205, 37.7739],
            [-122.4205, 37.7759],
            [-122.4185, 37.7759],
            [-122.4185, 37.7739],
            [-122.4205, 37.7739],
          ],
        ],
      },
      waypoints: [
        {
          order: 0,
          latitude: 37.7739,
          longitude: -122.4205,
          altitude: 40,
          action: "takeoff",
        },
        {
          order: 1,
          latitude: 37.7759,
          longitude: -122.4205,
          altitude: 40,
          action: "capture",
        },
        {
          order: 2,
          latitude: 37.7759,
          longitude: -122.4185,
          altitude: 40,
          action: "capture",
        },
        {
          order: 3,
          latitude: 37.7739,
          longitude: -122.4185,
          altitude: 40,
          action: "capture",
        },
        {
          order: 4,
          latitude: 37.7739,
          longitude: -122.4205,
          altitude: 0,
          action: "land",
        },
      ],
      progress: {
        percentComplete: 100,
        currentWaypoint: 4,
        estimatedTimeRemaining: 0,
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        completedAt: new Date(),
      },
    })
    logger.info("Created sample mission")

    // Create a sample report
    const report = await Report.create({
      mission: mission._id,
      organization: organizations[0]._id,
      drone: drones[0]._id,
      createdBy: users[0]._id,
      title: "Factory Roof Inspection Report",
      summary: "Monthly inspection completed successfully",
      status: "published",
      flightStatistics: {
        duration: 15,
        distance: 0.5,
        maxAltitude: 40,
        maxSpeed: 5,
        areaCovered: 10000,
        batteryUsed: 25,
      },
      weatherConditions: {
        temperature: 22,
        windSpeed: 5,
        humidity: 65,
        conditions: "Clear",
      },
    })
    logger.info("Created sample report")

    logger.info("Database seeded successfully")
  } catch (error) {
    logger.error("Error seeding database:", error)
  } finally {
    mongoose.connection.close()
    logger.info("MongoDB connection closed")
  }
}

// Run the seed function
seedDatabase()
