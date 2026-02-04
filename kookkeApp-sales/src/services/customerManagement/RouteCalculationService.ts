/**
 * Route Calculation Service
 * 
 * Handles:
 * - Building route UI models with computed fields
 * - Distance and ETA calculations
 * - Route point reordering with validation
 * - Adding leads to routes
 * - Real-time route optimization suggestions
 */

import {
  Route,
  RoutePoint,
  Customer,
  RouteAssignment,
} from '../../../types/shared/models';
import {
  RouteUIModel,
  RoutePointUIModel,
  CustomerUIModel,
  RouteReorderTransaction,
} from '../../../types/customerManagement';
import { haversineDistance } from '../utils/geospatial';
import { CustomerUIService } from './CustomerUIService';

export class RouteCalculationService {
  private customerService = new CustomerUIService();

  /**
   * Get complete Route UI Model with all computed fields
   */
  async getRouteUIModel(routeId: number): Promise<RouteUIModel> {
    const route = await this.getRoute(routeId);
    const routePoints = await this.getRoutePoints(routeId);

    // Enhance route points with UI data
    const routePointsUI = await Promise.all(
      routePoints.map(async (rp, idx) => {
        const customerDetails = await this.customerService.getCustomerUIModel(rp.customerId);
        const distanceKm = await this.calculateDistanceToPoint(idx, routePoints);
        const etaMinutes = await this.calculateETAToPoint(idx, routePoints);

        return {
          ...rp,
          customerDetails,
          distanceKm,
          etaMinutes,
          isVisited: rp.isVisited,
          isActive: idx === 0, // TODO: compute from active assignment
          originalIndex: idx,
        } as RoutePointUIModel;
      })
    );

    // Calculate totals
    const totalDistanceKm = routePointsUI.reduce((sum, rp) => sum + (rp.distanceKm || 0), 0);
    const totalEstimatedMinutes = routePointsUI.reduce((sum, rp) => sum + (rp.etaMinutes || 0), 0);
    const completedStops = routePointsUI.filter(rp => rp.isVisited).length;
    const progressPercentage =
      routePointsUI.length > 0 ? (completedStops / routePointsUI.length) * 100 : 0;

    return {
      ...route,
      routePointsUI,
      totalDistanceKm,
      totalEstimatedMinutes,
      completedStops,
      progressPercentage,
      nextStopETA: routePointsUI[0]?.etaMinutes
        ? new Date(Date.now() + routePointsUI[0].etaMinutes * 60000)
        : undefined,
    };
  }

  /**
   * Get route assignment for a route
   */
  async getRouteAssignment(routeId: number): Promise<RouteAssignment> {
    // TODO: Fetch current active assignment from SQLite
    return {
      id: 1,
      routeId,
      userId: 1,
      assignedDate: new Date(),
      assignmentStatus: 'ACTIVE',
      completionPercentage: 0,
      versionNumber: 0,
      isDirty: false,
      serverTimestamp: new Date(),
    };
  }

  /**
   * Reorder route points and update sequence numbers
   * Validates that mandatory stops are still included
   */
  async reorderRoutePoints(
    routeId: number,
    reorderedSequence: RoutePointUIModel[]
  ): Promise<RouteReorderTransaction> {
    const originalRoute = await this.getRouteUIModel(routeId);
    const previousSequence = originalRoute.routePointsUI;

    // Validate: all mandatory stops must still be present
    const mandatoryStops = previousSequence.filter(rp => rp.isMandatory);
    const reorderedMandatoryIds = reorderedSequence
      .filter(rp => rp.isMandatory)
      .map(rp => rp.customerId);
    const allMandatoryPresent = mandatoryStops.every(ms =>
      reorderedMandatoryIds.includes(ms.customerId)
    );

    if (!allMandatoryPresent) {
      throw new Error('Cannot remove mandatory stops from route');
    }

    // Calculate changed indices
    const changedIndices: number[] = [];
    reorderedSequence.forEach((newPoint, newIdx) => {
      const oldIdx = previousSequence.findIndex(p => p.id === newPoint.id);
      if (oldIdx !== newIdx) {
        changedIndices.push(newIdx);
      }
    });

    // Recalculate totals for new sequence
    const previousDistance = originalRoute.totalDistanceKm;
    const previousTime = originalRoute.totalEstimatedMinutes;

    // TODO: Calculate new distance/time with new sequence
    const newDistance = previousDistance;
    const newTime = previousTime;

    const transaction: RouteReorderTransaction = {
      routeId,
      previousSequence,
      newSequence: reorderedSequence,
      changedIndices,
      totalDistanceChangedKm: newDistance - previousDistance,
      estimatedTimeChangedMinutes: newTime - previousTime,
      timestamp: new Date(),
    };

    // Persist the changes
    await this.updateRoutePointSequences(routeId, reorderedSequence);

    return transaction;
  }

  /**
   * Add a lead (prospect) to a route at a specific sequence
   */
  async addLeadToRoute(
    routeId: number,
    leadId: number,
    insertAtSequenceNumber: number
  ): Promise<void> {
    // TODO: Create new RoutePoint linking lead (as customer)
    // to the route with the specified sequence number
    // Adjust sequence numbers for all existing points >= insertAtSequenceNumber
    // Mark route as isDirty = true
  }

  /**
   * Private helper methods
   */

  private async getRoute(routeId: number): Promise<Route> {
    // TODO: Fetch from SQLite
    return {
      id: routeId,
      name: '',
      routeType: 'DAILY',
      territoryId: 0,
      isOptimized: false,
      isActive: true,
      isDeleted: false,
      versionNumber: 0,
      isDirty: false,
      serverTimestamp: new Date(),
    };
  }

  private async getRoutePoints(routeId: number): Promise<RoutePoint[]> {
    // TODO: Fetch from SQLite, sorted by sequence_number
    return [];
  }

  private async calculateDistanceToPoint(
    pointIndex: number,
    allPoints: RoutePoint[]
  ): Promise<number> {
    if (pointIndex === 0) {
      // TODO: Distance from current location to first point
      return 0;
    }

    const fromPoint = allPoints[pointIndex - 1];
    const toPoint = allPoints[pointIndex];

    // TODO: Get customer coordinates
    // Use routing API for real distance, not just haversine
    return 0;
  }

  private async calculateETAToPoint(
    pointIndex: number,
    allPoints: RoutePoint[]
  ): Promise<number> {
    // TODO: Use Google Maps API or similar for ETA
    // For now, assume average speed of 30 km/h
    const distance = await this.calculateDistanceToPoint(pointIndex, allPoints);
    const averageSpeedKmh = 30;
    return Math.round((distance / averageSpeedKmh) * 60); // Convert to minutes
  }

  private async updateRoutePointSequences(
    routeId: number,
    orderedPoints: RoutePointUIModel[]
  ): Promise<void> {
    // TODO: Update sequence_number for each route point in SQLite
  }
}

export default RouteCalculationService;
