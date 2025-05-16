import mongoose from "mongoose"

const reportSchema = new mongoose.Schema(
  {
    mission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mission",
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    drone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drone",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    flightStatistics: {
      duration: {
        type: Number, // minutes
        required: true,
      },
      distance: {
        type: Number, // kilometers
        required: true,
      },
      maxAltitude: {
        type: Number, // meters
        required: true,
      },
      maxSpeed: {
        type: Number, // km/h
        required: true,
      },
      areaCovered: {
        type: Number, // square meters
        required: true,
      },
      batteryUsed: {
        type: Number, // percentage
        required: true,
      },
    },
    weatherConditions: {
      temperature: Number, // celsius
      windSpeed: Number, // km/h
      humidity: Number, // percentage
      conditions: String, // e.g., "Clear", "Cloudy", "Rainy"
    },
    issues: [
      {
        type: {
          type: String,
          enum: ["technical", "environmental", "operational"],
        },
        description: String,
        severity: {
          type: String,
          enum: ["low", "medium", "high"],
        },
      },
    ],
    findings: [
      {
        category: String,
        description: String,
        location: {
          latitude: Number,
          longitude: Number,
        },
        priority: {
          type: String,
          enum: ["low", "medium", "high"],
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

const Report = mongoose.model("Report", reportSchema)

export default Report
