import express from "express"
import {
  getAllMissions,
  getMissionById,
  createMission,
  updateMission,
  deleteMission,
  startMission,
  pauseMission,
  resumeMission,
  abortMission,
  completeMission,
  updateMissionProgress,
} from "../controllers/mission-controller.js"
import { protect } from "../middleware/auth-middleware.js"

const router = express.Router()

// All routes require authentication
router.use(protect)

router.route("/").get(getAllMissions).post(createMission)

router.route("/:id").get(getMissionById).patch(updateMission).delete(deleteMission)

// Mission control endpoints
router.post("/:id/start", startMission)
router.post("/:id/pause", pauseMission)
router.post("/:id/resume", resumeMission)
router.post("/:id/abort", abortMission)
router.post("/:id/complete", completeMission)
router.patch("/:id/progress", updateMissionProgress)

export default router
