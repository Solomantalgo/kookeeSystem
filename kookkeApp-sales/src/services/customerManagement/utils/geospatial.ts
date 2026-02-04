/**
 * Geospatial Utilities
 * 
 * Functions for:
 * - Distance calculations (Haversine formula)
 * - Bearing/heading calculations
 * - Geofence checks
 * - Route optimization suggestions
 */

/**
 * Haversine Formula
 * 
 * Calculate great-circle distance between two points on Earth
 * given their longitude and latitude.
 * 
 * @param lat1 Latitude of point 1 (degrees)
 * @param lon1 Longitude of point 1 (degrees)
 * @param lat2 Latitude of point 2 (degrees)
 * @param lon2 Longitude of point 2 (degrees)
 * @returns Distance in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate bearing (compass direction) from point 1 to point 2
 * 
 * @param lat1 Latitude of point 1 (degrees)
 * @param lon1 Longitude of point 1 (degrees)
 * @param lat2 Latitude of point 2 (degrees)
 * @param lon2 Longitude of point 2 (degrees)
 * @returns Bearing in degrees (0-360)
 */
export function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δλ = toRadians(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return (toDegrees(θ) + 360) % 360;
}

/**
 * Calculate destination point given start point, bearing, and distance
 * 
 * @param lat Starting latitude
 * @param lon Starting longitude
 * @param bearing Bearing in degrees
 * @param distance Distance in meters
 * @returns [lat, lon] of destination
 */
export function destinationPoint(
  lat: number,
  lon: number,
  bearing: number,
  distance: number
): [number, number] {
  const R = 6371000; // Earth's radius in meters
  const φ1 = toRadians(lat);
  const λ1 = toRadians(lon);
  const θ = toRadians(bearing);

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(distance / R) +
      Math.cos(φ1) * Math.sin(distance / R) * Math.cos(θ)
  );

  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(distance / R) * Math.cos(φ1),
      Math.cos(distance / R) - Math.sin(φ1) * Math.sin(φ2)
    );

  return [toDegrees(φ2), toDegrees(λ2)];
}

/**
 * Check if a point is within a circular geofence
 * 
 * @param lat Point latitude
 * @param lon Point longitude
 * @param centerLat Geofence center latitude
 * @param centerLon Geofence center longitude
 * @param radiusMeters Geofence radius in meters
 * @returns true if point is within geofence
 */
export function isWithinGeofence(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number,
  radiusMeters: number
): boolean {
  const distance = haversineDistance(lat, lon, centerLat, centerLon);
  return distance <= radiusMeters;
}

/**
 * Check if a point is within a polygon geofence (GeoJSON format)
 * Uses ray-casting algorithm
 * 
 * @param lat Point latitude
 * @param lon Point longitude
 * @param polygon GeoJSON polygon coordinates [[[lon, lat], ...]]
 * @returns true if point is within polygon
 */
export function isPointInPolygon(
  lat: number,
  lon: number,
  polygon: [number, number][][]
): boolean {
  let inside = false;

  for (let i = 0, j = polygon[0].length - 1; i < polygon[0].length; j = i++) {
    const [xi, yi] = polygon[0][i];
    const [xj, yj] = polygon[0][j];

    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculate distance from a point to a line segment
 * Useful for checking proximity to a polyline/route
 * 
 * @param lat Point latitude
 * @param lon Point longitude
 * @param lat1 Line segment start latitude
 * @param lon1 Line segment start longitude
 * @param lat2 Line segment end latitude
 * @param lon2 Line segment end longitude
 * @returns Minimum distance in meters
 */
export function distanceToLineSegment(
  lat: number,
  lon: number,
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const A = haversineDistance(lat, lon, lat1, lon1);
  const B = haversineDistance(lat, lon, lat2, lon2);
  const C = haversineDistance(lat1, lon1, lat2, lon2);

  // If C is very small, points are too close
  if (C < 1) return Math.min(A, B);

  // Use Heron's formula to get area of triangle
  const s = (A + B + C) / 2;
  const area = Math.sqrt(s * (s - A) * (s - B) * (s - C));

  // Distance = 2 * Area / Base
  return (2 * area) / C;
}

/**
 * Calculate the center point of multiple coordinates
 * Useful for finding route center for map viewport
 * 
 * @param coordinates Array of [lat, lon] pairs
 * @returns Center point [lat, lon]
 */
export function centerPoint(coordinates: [number, number][]): [number, number] {
  if (coordinates.length === 0) return [0, 0];

  const sumLat = coordinates.reduce((sum, [lat]) => sum + lat, 0);
  const sumLon = coordinates.reduce((sum, [, lon]) => sum + lon, 0);

  return [sumLat / coordinates.length, sumLon / coordinates.length];
}

/**
 * Calculate bounding box for a set of coordinates
 * Useful for map viewport fitting
 * 
 * @param coordinates Array of [lat, lon] pairs
 * @returns Bounding box {north, south, east, west}
 */
export function boundingBox(
  coordinates: [number, number][]
): { north: number; south: number; east: number; west: number } {
  if (coordinates.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  let north = coordinates[0][0];
  let south = coordinates[0][0];
  let east = coordinates[0][1];
  let west = coordinates[0][1];

  coordinates.forEach(([lat, lon]) => {
    north = Math.max(north, lat);
    south = Math.min(south, lat);
    east = Math.max(east, lon);
    west = Math.min(west, lon);
  });

  return { north, south, east, west };
}

/**
 * Validate GeoJSON point format
 * 
 * @param point GeoJSON point object
 * @returns true if valid
 */
export function isValidGeoJSONPoint(point: any): boolean {
  return (
    point &&
    point.type === 'Point' &&
    Array.isArray(point.coordinates) &&
    point.coordinates.length === 2 &&
    typeof point.coordinates[0] === 'number' &&
    typeof point.coordinates[1] === 'number' &&
    Math.abs(point.coordinates[0]) <= 180 &&
    Math.abs(point.coordinates[1]) <= 90
  );
}

/**
 * Validate coordinate pair
 * 
 * @param lat Latitude
 * @param lon Longitude
 * @returns true if valid WGS84 coordinates
 */
export function isValidCoordinate(lat: number, lon: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180 &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lon)
  );
}

/**
 * Great-circle distance using Vincenty formula (more accurate than Haversine)
 * Slower but more precise for long distances
 * 
 * @param lat1 Latitude 1
 * @param lon1 Longitude 1
 * @param lat2 Latitude 2
 * @param lon2 Longitude 2
 * @returns Distance in meters
 */
export function vincentyDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const a = 6378137.0; // WGS-84 major axis in meters
  const b = 6356752.3142; // WGS-84 semi-major axis in meters
  const f = 1 / 298.257223563; // WGS-84 flattening

  const L = toRadians(lon2 - lon1);
  const U1 = Math.atan((1 - f) * Math.tan(toRadians(lat1)));
  const U2 = Math.atan((1 - f) * Math.tan(toRadians(lat2)));
  const sinU1 = Math.sin(U1);
  const cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2);
  const cosU2 = Math.cos(U2);

  let lambda = L;
  let lambdaP;
  let iterLimit = 100;
  let cosSqAlpha;
  let sinSigma;
  let cos2SigmaM;
  let cosSigma;
  let sigma;

  do {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);
    sinSigma = Math.sqrt(
      cosU2 * sinLambda * (cosU2 * sinLambda) +
        (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) *
          (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda)
    );

    if (sinSigma === 0) return 0; // co-incident points

    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    const sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
    cosSqAlpha = 1 - sinAlpha * sinAlpha;
    cos2SigmaM = cosSigma - (2 * sinU1 * sinU2) / cosSqAlpha;

    if (Number.isNaN(cos2SigmaM)) cos2SigmaM = 0;

    const C = (f / 16) * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    lambdaP = lambda;
    lambda =
      L +
      (1 - C) *
        f *
        sinAlpha *
        (sigma +
          C *
            sinSigma *
            (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
  } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

  if (iterLimit === 0) return NaN;

  const uSq = (cosSqAlpha * (a * a - b * b)) / (b * b);
  const A = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const deltaSigma =
    B *
    sinSigma *
    (cos2SigmaM +
      (B / 4) *
        (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
          (B / 6) *
            cos2SigmaM *
            (-3 + 4 * sinSigma * sinSigma) *
            (-3 + 4 * cos2SigmaM * cos2SigmaM)));

  const s = b * A * (sigma - deltaSigma);

  return s;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export default {
  haversineDistance,
  bearing,
  destinationPoint,
  isWithinGeofence,
  isPointInPolygon,
  distanceToLineSegment,
  centerPoint,
  boundingBox,
  isValidGeoJSONPoint,
  isValidCoordinate,
  vincentyDistance,
};
