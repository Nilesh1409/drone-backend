import Report from "../models/report-model.js"
import Mission from "../models/missionModel.js"
import { AppError } from "../utils/app-error.js"
import { logger } from "../utils/logger.js"

// Get all reports for the organization
export const getAllReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ organization: req.user.organization })
      .populate("mission", "name missionType")
      .populate("drone", "name serialNumber")
      .populate("createdBy", "name email")

    res.status(200).json({
      status: "success",
      results: reports.length,
      data: {
        reports,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Get a single report by ID
export const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })
      .populate("mission", "name missionType status location boundary waypoints parameters")
      .populate("drone", "name serialNumber model capabilities")
      .populate("createdBy", "name email")

    if (!report) {
      return next(new AppError("Report not found", 404))
    }

    res.status(200).json({
      status: "success",
      data: {
        report,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Create a new report
export const createReport = async (req, res, next) => {
  try {
    const { missionId, title, summary, flightStatistics, weatherConditions, issues, findings } = req.body

    // Check if mission exists and belongs to the organization
    const mission = await Mission.findOne({
      _id: missionId,
      organization: req.user.organization,
    })

    if (!mission) {
      return next(new AppError("Mission not found", 404))
    }

    // Check if mission is completed
    if (mission.status !== "completed") {
      return next(new AppError("Cannot create report for an incomplete mission", 400))
    }

    // Create the report
    const report = await Report.create({
      mission: missionId,
      organization: req.user.organization,
      drone: mission.drone,
      createdBy: req.user.id,
      title,
      summary,
      flightStatistics,
      weatherConditions,
      issues,
      findings,
      status: "draft",
    })

    logger.info(`New report created: ${report.title} (${report._id})`)

    res.status(201).json({
      status: "success",
      data: {
        report,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Update a report
export const updateReport = async (req, res, next) => {
  try {
    const { title, summary, flightStatistics, weatherConditions, issues, findings, status } = req.body

    const report = await Report.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })

    if (!report) {
      return next(new AppError("Report not found", 404))
    }

    // Update the report
    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      {
        title: title || report.title,
        summary: summary || report.summary,
        flightStatistics: flightStatistics || report.flightStatistics,
        weatherConditions: weatherConditions || report.weatherConditions,
        issues: issues || report.issues,
        findings: findings || report.findings,
        status: status || report.status,
      },
      {
        new: true,
        runValidators: true,
      }
    )

    logger.info(`Report updated: ${updatedReport.title} (${updatedReport._id})`)

    res.status(200).json({
      status: "success",
      data: {
        report: updatedReport,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Delete a report
export const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })

    if (!report) {
      return next(new AppError("Report not found", 404))
    }

    await Report.findByIdAndDelete(req.params.id)

    logger.info(`Report deleted: ${report.title} (${report._id})`)

    res.status(204).json({
      status: "success",
      data: null,
    })
  } catch (error) {
    next(error)
  }
}

// Get organization-wide statistics
export const getOrganizationStats = async (req, res, next) => {
  try {
    // Get total number of completed missions
    const totalMissions = await Mission.countDocuments({
      organization: req.user.organization,
      status: "completed",
    })

    // Get total flight time
    const reports = await Report.find({
      organization: req.user.organization,
    })

    let totalFlightTime = 0
    let totalDistance = 0
    let totalAreaCovered = 0

    reports.forEach((report) => {
      totalFlightTime += report.flightStatistics.duration || 0
      totalDistance += report.flightStatistics.distance || 0
      totalAreaCovered += report.flightStatistics.areaCovered || 0
    })

    // Get mission types breakdown
    const missionTypes = await Mission.aggregate([
      {
        $match: {
          organization: req.user.organization,
          status: "completed",
        },
      },
      {
        $group: {
          _id: "$missionType",
          count: { $sum: 1 },
        },
      },
    ])

    // Format mission types
    const missionTypesFormatted = missionTypes.map((type) => ({
      type: type._id,
      count: type.count,
    }))

    res.status(200).json({
      status: "success",
      data: {
        totalMissions,
        totalFlightTime,
        totalDistance,
        totalAreaCovered,
        missionTypes: missionTypesFormatted,
        totalReports: reports?.length || 0,
      },
    })
  } catch (error) {
    next(error)
  }
}
