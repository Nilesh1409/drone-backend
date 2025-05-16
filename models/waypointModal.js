import mongoose from "mongoose"
const { Schema } = mongoose

const waypointSchema = new Schema({
  mission: { type: Schema.Types.ObjectId, ref: "Mission", required: true },
  order: { type: Number, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  altitude: { type: Number, required: true },
  action: {
    type: String,
    enum: ["capture", "hover", "turn", "land", "takeoff"],
    default: "capture",
  },
  hoverTime: { type: Number, default: 0 },
})

const Waypoint = mongoose.model("Waypoint", waypointSchema)
export default Waypoint
