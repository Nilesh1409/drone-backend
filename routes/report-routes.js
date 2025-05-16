import express from "express"
import {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  getOrganizationStats,
} from "../controllers/report-controller.js"
import { protect } from "../middleware/auth-middleware.js"

const router = express.Router()

// All routes require authentication
router.use(protect)

router.route("/").get(getAllReports).post(createReport)

router.route("/:id").get(getReportById).patch(updateReport).delete(deleteReport)

// Organization-wide statistics
router.get("/stats/organization", getOrganizationStats)

export default router
