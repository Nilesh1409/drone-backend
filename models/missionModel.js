import mongoose from "mongoose"
const { Schema } = mongoose

// Helper to disable automatic _id creation on sub-documents
const noId = { _id: false }

/* --------------------
   Sub‑schemas
   --------------------*/
const locationSchema = new Schema(
  {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  noId
)

const boundarySchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Polygon"],
      default: "Polygon",
    },
    coordinates: {
      type: [[[Number]]], // GeoJSON Polygon
      required: true,
    },
  },
  noId
)

const sensorSettingsSchema = new Schema(
  {
    captureInterval: { type: Number, default: 2 },
    activeSensors: [
      {
        type: String,
        enum: ["rgb", "thermal", "lidar", "multispectral"],
      },
    ],
  },
  noId
)

const parametersSchema = new Schema(
  {
    altitude: { type: Number, required: true },
    speed: { type: Number, required: true },
    overlap: { type: Number, default: 30 },
    sensorSettings: sensorSettingsSchema,
  },
  noId
)

const scheduleSchema = new Schema(
  {
    startTime: Date,
    endTime: Date,
    isRecurring: { type: Boolean, default: false },
    recurrencePattern: new Schema(
      {
        frequency: { type: String, enum: ["daily", "weekly", "monthly"] },
        interval: Number,
        daysOfWeek: [Number],
        endDate: Date,
      },
      noId
    ),
  },
  noId
)

const progressSchema = new Schema(
  {
    percentComplete: { type: Number, default: 0 },
    currentWaypoint: { type: Number, default: 0 },
    estimatedTimeRemaining: { type: Number, default: 0 },
    startedAt: Date,
    completedAt: Date,
  },
  noId
)

const telemetrySchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    position: {
      latitude: Number,
      longitude: Number,
      altitude: Number,
    },
    batteryLevel: Number,
    speed: Number,
    heading: Number,
  },
  noId
)

const logSchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    level: { type: String, enum: ["info", "warning", "error"] },
    message: String,
  },
  noId
)

// const waypointSchema = new Schema(
//   {
//     order: { type: Number, required: true },
//     latitude: { type: Number, required: true },
//     longitude: { type: Number, required: true },
//     altitude: { type: Number, required: true },
//     action: {
//       type: String,
//       enum: ["capture", "hover", "turn", "land", "takeoff"],
//       default: "capture",
//     },
//     hoverTime: { type: Number, default: 0 },
//   },
//   noId
// )

/* --------------------
   Mission schema
   --------------------*/
const missionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    location: locationSchema,
    drone: { type: Schema.Types.ObjectId, ref: "Drone", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["planned", "in-progress", "completed", "aborted", "failed"],
      default: "planned",
    },
    missionType: { type: String, enum: ["inspection", "mapping", "security", "custom"], required: true },
    patternType: { type: String, enum: ["grid", "crosshatch", "perimeter", "custom"], default: "grid" },
    parameters: parametersSchema,
    boundary: boundarySchema,
    // Remove waypoints field
    schedule: scheduleSchema,
    progress: progressSchema,
    telemetry: [
      {
        timestamp: { type: Date, default: Date.now },
        position: { latitude: Number, longitude: Number, altitude: Number },
        batteryLevel: Number,
        speed: Number,
        heading: Number,
      },
    ],
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        level: { type: String, enum: ["info", "warning", "error"] },
        message: String,
      },
    ],
  },
  { timestamps: true }
)

export default mongoose.models.Mission || mongoose.model("Mission", missionSchema)
