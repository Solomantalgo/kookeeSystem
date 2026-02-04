/**
 * Geospatial Utility Functions
 * Handles distance calculations, bearing, and geofencing logic
 */

interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
export function calculateHaversineDistance(
  point1: Coordinate,
  point2: Coordinate
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate bearing (direction) from point1 to point2
 * Returns bearing in degrees (0-360)
 */
export function calculateBearing(point1: Coordinate, point2: Coordinate): number {
  const dLon = toRad(point2.longitude - point1.longitude);
  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.latitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Check if a point is within a geofence (circular)
 * @param point - The point to check
 * @param center - The center of the geofence
 * @param radiusMeters - Radius in meters
 */
export function isPointInGeofence(
  point: Coordinate,
  center: Coordinate,
  radiusMeters: number
): boolean {
  const distance = calculateHaversineDistance(point, center);
  return distance <= radiusMeters;
}

/**
 * Check if a point is within a polygon (using ray casting algorithm)
 */
export function isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
  let inside = false;
  const x = point.longitude;
  const y = point.latitude;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculate the center point (centroid) of multiple coordinates
 */
export function calculateCentroid(points: Coordinate[]): Coordinate {
  if (points.length === 0) throw new Error('Cannot calculate centroid of empty array');

  let lat = 0;
  let lon = 0;

  for (const point of points) {
    lat += point.latitude;
    lon += point.longitude;
  }

  return {
    latitude: lat / points.length,
    longitude: lon / points.length,
  };
}

/**
 * Calculate bounding box from multiple coordinates
 */
export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export function calculateBoundingBox(points: Coordinate[]): BoundingBox {
  if (points.length === 0) {
    throw new Error('Cannot calculate bounding box of empty array');
  }

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLon = points[0].longitude;
  let maxLon = points[0].longitude;

  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLon = Math.min(minLon, point.longitude);
    maxLon = Math.max(maxLon, point.longitude);
  }

  return {
    north: maxLat,
    south: minLat,
    east: maxLon,
    west: minLon,
  };
}

/**
 * Calculate total distance of a polyline (sum of all segments)
 */
export function calculatePolylineDistance(points: Coordinate[]): number {
  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += calculateHaversineDistance(points[i], points[i + 1]);
  }
  return totalDistance;
}

/**
 * Interpolate a point along a polyline at a given distance
 */
export function interpolatePointOnPolyline(
  points: Coordinate[],
  distanceMeters: number
): Coordinate | null {
  let cumDistance = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const segmentDistance = calculateHaversineDistance(points[i], points[i + 1]);
    if (cumDistance + segmentDistance >= distanceMeters) {
      const ratio = (distanceMeters - cumDistance) / segmentDistance;
      return {
        latitude: points[i].latitude + (points[i + 1].latitude - points[i].latitude) * ratio,
        longitude: points[i].longitude + (points[i + 1].longitude - points[i].longitude) * ratio,
      };
    }
    cumDistance += segmentDistance;
  }

  return null;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

/**
 * Estimate travel time based on distance (assumes ~40 km/h average speed)
 */
export function estimateTravelTime(distanceMeters: number): number {
  const avgSpeedMs = 40000 / 3600; // 40 km/h in m/s
  return Math.round(distanceMeters / avgSpeedMs / 60); // Return in minutes
}

/**
 * Format time duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${Math.round(mins)}m`;
}

/**
 * Calculate distance and bearing between multiple points
 */
export interface RouteSegment {
  from: Coordinate;
  to: Coordinate;
  distance: number;
  bearing: number;
  duration: number;
}

export function calculateRouteSegments(points: Coordinate[]): RouteSegment[] {
  const segments: RouteSegment[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const distance = calculateHaversineDistance(points[i], points[i + 1]);
    segments.push({
      from: points[i],
      to: points[i + 1],
      distance,
      bearing: calculateBearing(points[i], points[i + 1]),
      duration: estimateTravelTime(distance),
    });
  }

  return segments;
}

/**
 * Simplify a polyline using Douglas-Peucker algorithm
 * Useful for reducing complexity of GPS traces
 */
export function simplifyPolyline(
  points: Coordinate[],
  toleranceMeters: number
): Coordinate[] {
  if (points.length <= 2) return points;

  const simplified = douglasPeucker(points, toleranceMeters);
  return simplified;
}

function douglasPeucker(points: Coordinate[], tolerance: number): Coordinate[] {
  if (points.length < 3) return points;

  let maxDistance = 0;
  let maxIndex = 0;

  // Find the point with the maximum distance from the line
  const lineStart = points[0];
  const lineEnd = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], lineStart, lineEnd);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const results1 = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const results2 = douglasPeucker(points.slice(maxIndex), tolerance);
    return results1.slice(0, -1).concat(results2);
  }

  // Otherwise, return the simplified line
  return [lineStart, lineEnd];
}

function perpendicularDistance(
  point: Coordinate,
  lineStart: Coordinate,
  lineEnd: Coordinate
): number {
  const lat1 = toRad(lineStart.latitude);
  const lon1 = toRad(lineStart.longitude);
  const lat2 = toRad(lineEnd.latitude);
  const lon2 = toRad(lineEnd.longitude);
  const latP = toRad(point.latitude);
  const lonP = toRad(point.longitude);

  const R = 6371000; // Earth radius in meters

  // Convert to 3D Cartesian coordinates
  const x1 = R * Math.cos(lat1) * Math.cos(lon1);
  const y1 = R * Math.cos(lat1) * Math.sin(lon1);
  const z1 = R * Math.sin(lat1);

  const x2 = R * Math.cos(lat2) * Math.cos(lon2);
  const y2 = R * Math.cos(lat2) * Math.sin(lon2);
  const z2 = R * Math.sin(lat2);

  const xp = R * Math.cos(latP) * Math.cos(lonP);
  const yp = R * Math.cos(latP) * Math.sin(lonP);
  const zp = R * Math.sin(latP);

  // Calculate cross product
  const v1x = x2 - x1;
  const v1y = y2 - y1;
  const v1z = z2 - z1;

  const vpx = xp - x1;
  const vpy = yp - y1;
  const vpz = zp - z1;

  const cross_x = v1y * vpz - v1z * vpy;
  const cross_y = v1z * vpx - v1x * vpz;
  const cross_z = v1x * vpy - v1y * vpx;

  const distance = Math.sqrt(cross_x * cross_x + cross_y * cross_y + cross_z * cross_z) / Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z);

  return distance;
}

// Helper functions
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Convert coordinate string to Coordinate object
 */
export function parseCoordinateString(coordinateString: string): Coordinate | null {
  const parts = coordinateString.split(',').map((p) => p.trim());
  if (parts.length !== 2) return null;

  const latitude = parseFloat(parts[0]);
  const longitude = parseFloat(parts[1]);

  if (isNaN(latitude) || isNaN(longitude)) return null;

  return { latitude, longitude };
}

/**
 * Validate if coordinates are within valid ranges
 */
export function isValidCoordinate(coord: Coordinate): boolean {
  return (
    coord.latitude >= -90 &&
    coord.latitude <= 90 &&
    coord.longitude >= -180 &&
    coord.longitude <= 180
  );
}
