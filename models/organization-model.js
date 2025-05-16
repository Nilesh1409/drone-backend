import mongoose from "mongoose"

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    locations: [
      {
        name: {
          type: String,
          required: true,
        },
        address: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
      },
    ],
    settings: {
      defaultAltitude: {
        type: Number,
        default: 50, // meters
      },
      defaultOverlap: {
        type: Number,
        default: 30, // percentage
      },
      safetyParameters: {
        maxWindSpeed: {
          type: Number,
          default: 20, // km/h
        },
        minBatteryLevel: {
          type: Number,
          default: 20, // percentage
        },
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

const Organization = mongoose.model("Organization", organizationSchema)

export default Organization
