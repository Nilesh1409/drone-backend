import express from "express"
import {
  getAllDrones,
  getDroneById,
  createDrone,
  updateDrone,
  deleteDrone,
  updateTelemetry,
} from "../controllers/drone-controller.js"
import { protect } from "../middleware/auth-middleware.js"

const router = express.Router()

// All routes require authentication
router.use(protect)

router.route("/").get(getAllDrones).post(createDrone)

router.route("/:id").get(getDroneById).patch(updateDrone).delete(deleteDrone)

router.patch("/:id/telemetry", updateTelemetry)

export default router
