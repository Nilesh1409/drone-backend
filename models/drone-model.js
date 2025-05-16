import mongoose from "mongoose"

const droneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization.locations",
    },
    status: {
      type: String,
      enum: ["available", "in-mission", "maintenance", "offline"],
      default: "available",
    },
    capabilities: {
      maxFlightTime: {
        type: Number, // minutes
        required: true,
      },
      maxSpeed: {
        type: Number, // km/h
        required: true,
      },
      maxAltitude: {
        type: Number, // meters
        required: true,
      },
      sensors: [
        {
          type: String,
          enum: ["rgb", "thermal", "lidar", "multispectral"],
        },
      ],
    },
    telemetry: {
      batteryLevel: {
        type: Number, // percentage
        default: 100,
      },
      lastKnownPosition: {
        latitude: Number,
        longitude: Number,
        altitude: Number,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    maintenanceInfo: {
      lastMaintenance: Date,
      flightHours: {
        type: Number,
        default: 0,
      },
      nextMaintenanceDue: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

const Drone = mongoose.model("Drone", droneSchema)

export default Drone
