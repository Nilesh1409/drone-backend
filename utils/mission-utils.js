// Utility functions for mission planning and waypoint generation

// Generate waypoints based on boundary, pattern type, and parameters
export const generateWaypoints = (boundary, patternType, parameters) => {
  // Extract boundary coordinates
  const coordinates = boundary.coordinates[0]

  // Calculate bounding box
  const boundingBox = calculateBoundingBox(coordinates)

  // Generate waypoints based on pattern type
  let waypoints = []

  switch (patternType) {
    case "grid":
      waypoints = generateGridPattern(boundingBox, parameters)
      break
    case "crosshatch":
      waypoints = generateCrosshatchPattern(boundingBox, parameters)
      break
    case "perimeter":
      waypoints = generatePerimeterPattern(coordinates, parameters)
      break
    case "custom":
      // For custom patterns, we would typically receive the waypoints directly
      // Here we'll just generate a simple path as a fallback
      waypoints = generateSimplePattern(boundingBox, parameters)
      break
    default:
      waypoints = generateGridPattern(boundingBox, parameters)
  }

  return waypoints
}

// Calculate bounding box from polygon coordinates
function calculateBoundingBox(coordinates) {
  let minLat = Number.POSITIVE_INFINITY
  let maxLat = Number.NEGATIVE_INFINITY
  let minLng = Number.POSITIVE_INFINITY
  let maxLng = Number.NEGATIVE_INFINITY

  coordinates.forEach((coord) => {
    const lng = coord[0]
    const lat = coord[1]

    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
  })

  return {
    minLat,
    maxLat,
    minLng,
    maxLng,
  }
}

// Generate grid pattern waypoints
function generateGridPattern(boundingBox, parameters) {
  const { minLat, maxLat, minLng, maxLng } = boundingBox
  const { altitude, overlap } = parameters

  // Calculate step size based on overlap percentage
  // This is a simplified calculation - in a real system, this would be more complex
  // and would take into account the drone's camera FOV, altitude, etc.
  const overlapFactor = (100 - overlap) / 100
  const latStep = 0.0001 * overlapFactor // Approximately 10 meters at equator
  const lngStep = 0.0001 * overlapFactor

  const waypoints = []
  let order = 0
  let direction = 1 // 1 for east, -1 for west

  // Add takeoff waypoint
  waypoints.push({
    order: order++,
    latitude: minLat,
    longitude: minLng,
    altitude,
    action: "takeoff",
  })

  // Generate grid pattern
  for (let lat = minLat; lat <= maxLat; lat += latStep) {
    if (direction === 1) {
      // East direction
      for (let lng = minLng; lng <= maxLng; lng += lngStep) {
        waypoints.push({
          order: order++,
          latitude: lat,
          longitude: lng,
          altitude,
          action: "capture",
        })
      }
    } else {
      // West direction
      for (let lng = maxLng; lng >= minLng; lng -= lngStep) {
        waypoints.push({
          order: order++,
          latitude: lat,
          longitude: lng,
          altitude,
          action: "capture",
        })
      }
    }

    // Reverse direction for the next row
    direction *= -1
  }

  // Add landing waypoint
  waypoints.push({
    order: order++,
    latitude: minLat,
    longitude: minLng,
    altitude: 0,
    action: "land",
  })

  return waypoints
}

// Generate crosshatch pattern waypoints
function generateCrosshatchPattern(boundingBox, parameters) {
  const { minLat, maxLat, minLng, maxLng } = boundingBox
  const { altitude, overlap } = parameters

  // Calculate step size based on overlap percentage
  const overlapFactor = (100 - overlap) / 100
  const latStep = 0.0001 * overlapFactor
  const lngStep = 0.0001 * overlapFactor

  const waypoints = []
  let order = 0

  // Add takeoff waypoint
  waypoints.push({
    order: order++,
    latitude: minLat,
    longitude: minLng,
    altitude,
    action: "takeoff",
  })

  // Generate horizontal lines
  let direction = 1
  for (let lat = minLat; lat <= maxLat; lat += latStep * 2) {
    if (direction === 1) {
      // East direction
      for (let lng = minLng; lng <= maxLng; lng += lngStep) {
        waypoints.push({
          order: order++,
          latitude: lat,
          longitude: lng,
          altitude,
          action: "capture",
        })
      }
    } else {
      // West direction
      for (let lng = maxLng; lng >= minLng; lng -= lngStep) {
        waypoints.push({
          order: order++,
          latitude: lat,
          longitude: lng,
          altitude,
          action: "capture",
        })
      }
    }

    // Reverse direction for the next row
    direction *= -1
  }

  // Generate vertical lines
  direction = 1
  for (let lng = minLng; lng <= maxLng; lng += lngStep * 2) {
    if (direction === 1) {
      // North direction
      for (let lat = minLat; lat <= maxLat; lat += latStep) {
        waypoints.push({
          order: order++,
          latitude: lat,
          longitude: lng,
          altitude,
          action: "capture",
        })
      }
    } else {
      // South direction
      for (let lat = maxLat; lat >= minLat; lat -= latStep) {
        waypoints.push({
          order: order++,
          latitude: lat,
          longitude: lng,
          altitude,
          action: "capture",
        })
      }
    }

    // Reverse direction for the next column
    direction *= -1
  }

  // Add landing waypoint
  waypoints.push({
    order: order++,
    latitude: minLat,
    longitude: minLng,
    altitude: 0,
    action: "land",
  })

  // Sort waypoints by order
  waypoints.sort((a, b) => a.order - b.order)

  return waypoints
}

// Generate perimeter pattern waypoints
function generatePerimeterPattern(coordinates, parameters) {
  const { altitude } = parameters

  const waypoints = []
  let order = 0

  // Add takeoff waypoint
  waypoints.push({
    order: order++,
    latitude: coordinates[0][1],
    longitude: coordinates[0][0],
    altitude,
    action: "takeoff",
  })

  // Add waypoints for each coordinate in the perimeter
  for (let i = 0; i < coordinates.length; i++) {
    waypoints.push({
      order: order++,
      latitude: coordinates[i][1],
      longitude: coordinates[i][0],
      altitude,
      action: "capture",
    })
  }

  // Add a final waypoint to close the loop
  waypoints.push({
    order: order++,
    latitude: coordinates[0][1],
    longitude: coordinates[0][0],
    altitude,
    action: "capture",
  })

  // Add landing waypoint
  waypoints.push({
    order: order++,
    latitude: coordinates[0][1],
    longitude: coordinates[0][0],
    altitude: 0,
    action: "land",
  })

  return waypoints
}

// Generate simple pattern waypoints (fallback for custom)
function generateSimplePattern(boundingBox, parameters) {
  const { minLat, maxLat, minLng, maxLng } = boundingBox
  const { altitude } = parameters

  const waypoints = []
  let order = 0

  // Add takeoff waypoint
  waypoints.push({
    order: order++,
    latitude: minLat,
    longitude: minLng,
    altitude,
    action: "takeoff",
  })

  // Add corner waypoints
  waypoints.push({
    order: order++,
    latitude: minLat,
    longitude: maxLng,
    altitude,
    action: "capture",
  })

  waypoints.push({
    order: order++,
    latitude: maxLat,
    longitude: maxLng,
    altitude,
    action: "capture",
  })

  waypoints.push({
    order: order++,
    latitude: maxLat,
    longitude: minLng,
    altitude,
    action: "capture",
  })

  // Add landing waypoint
  waypoints.push({
    order: order++,
    latitude: minLat,
    longitude: minLng,
    altitude: 0,
    action: "land",
  })

  return waypoints
}
