/**
 * Customer Management Context
 * 
 * Provides global state for:
 * - Selected Customer (360° profile data)
 * - Active Route (current assignment and waypoints)
 * - Customer directory search/filter state
 * - Nearby leads browsing
 * 
 * This context is consumed by Customer Profile, Route Sequencer,
 * Navigation, and Visit Workflow agents.
 */

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import {
  CustomerManagementContextType,
  SelectedCustomer,
  ActiveRoute,
  CustomerDirectoryFilter,
  CustomerSearchResult,
  NearbyLeadsQuery,
  NearbyLeadsResult,
  CustomerVerificationStatus,
  RoutePointUIModel,
  RouteReorderTransaction,
  FuzzySearchConfig,
} from '../../types/customerManagement';
import { CustomerUIService } from '../services/customerManagement/CustomerUIService';
import { RouteCalculationService } from '../services/customerManagement/RouteCalculationService';
import { FuzzySearchService } from '../services/customerManagement/FuzzySearchService';

/**
 * Create the context with default undefined state
 */
const CustomerManagementContext = createContext<CustomerManagementContextType | undefined>(
  undefined
);

interface CustomerManagementProviderProps {
  children: React.ReactNode;
}

/**
 * Provider Component
 */
export const CustomerManagementProvider: React.FC<CustomerManagementProviderProps> = ({
  children,
}: CustomerManagementProviderProps) => {
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | undefined>();
  const [activeRoute, setActiveRoute] = useState<ActiveRoute | undefined>();
  const [nearbyLeads, setNearbyLeads] = useState<NearbyLeadsResult[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Initialize services
  const customerService = new CustomerUIService();
  const routeService = new RouteCalculationService();
  const fuzzyService = new FuzzySearchService();

  /**
   * Select a customer and load all related data:
   * - Verification status
   * - Timeline (visits, notes, stock audit history)
   * - Action center data
   * - Daily notes
   */
  const selectCustomer = useCallback(async (customerId: number): Promise<void> => {
    try {
      setIsLoadingCustomers(true);
      const customerData = await customerService.getCustomerUIModel(customerId);
      const verificationStatus = await customerService.getVerificationStatus(customerId);
      const timeline = await customerService.getCustomerTimeline(customerId);
      const actionCenter = await customerService.getActionCenter(customerId);
      const dailyNotes = await customerService.getDailyNotes(customerId);

      setSelectedCustomer({
        customer: customerData,
        verificationStatus,
        timeline,
        actionCenter,
        dailyNotes,
      });
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  /**
   * Clear selected customer
   */
  const clearSelectedCustomer = useCallback(() => {
    setSelectedCustomer(undefined);
  }, []);

  /**
   * Update customer verification status after pin tool or completion
   */
  const updateCustomerVerification = useCallback(
    async (customerId: number, status: Partial<CustomerVerificationStatus>): Promise<void> => {
      try {
        await customerService.updateVerificationStatus(customerId, status);
        // Refresh the selected customer if it matches
        if (selectedCustomer?.customer.id === customerId) {
          await selectCustomer(customerId);
        }
      } catch (error) {
        console.error('Failed to update verification status:', error);
        throw error;
      }
    },
    [selectedCustomer, selectCustomer]
  );

  /**
   * Set the active route and compute all necessary fields
   */
  const setActiveRouteData = useCallback(async (routeId: number): Promise<void> => {
    try {
      setIsLoadingRoute(true);
      const route = await routeService.getRouteUIModel(routeId);
      const assignment = await routeService.getRouteAssignment(routeId);
      const waypoints = route.routePointsUI.map((rp: any) => ({
        customerId: rp.customerId,
        latitude: rp.customerDetails.latitude || 0,
        longitude: rp.customerDetails.longitude || 0,
        sequenceNumber: rp.sequenceNumber,
      }));

      setActiveRoute({
        route,
        assignment,
        waypoints,
        currentStopIndex: route.routePointsUI.findIndex((rp: any) => rp.isActive) || 0,
        completedStopIndices: route.routePointsUI
          .map((rp: any, idx: number) => (rp.isVisited ? idx : -1))
          .filter((idx: number) => idx !== -1),
      });
    } finally {
      setIsLoadingRoute(false);
    }
  }, []);

  /**
   * Reorder route points and update all computed fields
   * (distance, ETA, progress, etc.)
   */
  const reorderRoutePoints = useCallback(
    async (reorderedSequence: RoutePointUIModel[]): Promise<RouteReorderTransaction> => {
      if (!activeRoute) throw new Error('No active route');

      try {
        const transaction = await routeService.reorderRoutePoints(
          activeRoute.route.id,
          reorderedSequence
        );

        // Refresh the active route to get updated calculations
        if (activeRoute.route.id) {
          await setActiveRouteData(activeRoute.route.id);
        }

        return transaction;
      } catch (error) {
        console.error('Failed to reorder route points:', error);
        throw error;
      }
    },
    [activeRoute, setActiveRouteData]
  );

  /**
   * Find nearby leads within a given radius
   */
  const getNearbyLeads = useCallback(
    async (query: NearbyLeadsQuery): Promise<NearbyLeadsResult[]> => {
      try {
        const leads = await customerService.getNearbyLeads(query);
        setNearbyLeads(leads);
        return leads;
      } catch (error) {
        console.error('Failed to get nearby leads:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Add a lead (prospect) to the current route
   */
  const addLeadToRoute = useCallback(
    async (leadId: number, insertAtSequenceNumber: number): Promise<void> => {
      if (!activeRoute) throw new Error('No active route');

      try {
        await routeService.addLeadToRoute(
          activeRoute.route.id,
          leadId,
          insertAtSequenceNumber
        );

        // Refresh the route
        if (activeRoute.route.id) {
          await setActiveRouteData(activeRoute.route.id);
        }
      } catch (error) {
        console.error('Failed to add lead to route:', error);
        throw error;
      }
    },
    [activeRoute, setActiveRouteData]
  );

  /**
   * Search customers with filters (fuzzy search, category, etc.)
   */
  const searchCustomers = useCallback(
    async (filter: CustomerDirectoryFilter): Promise<CustomerSearchResult[]> => {
      try {
        const results = await customerService.searchCustomers(filter);
        return results;
      } catch (error) {
        console.error('Failed to search customers:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Fuzzy search for customers with typo tolerance
   */
  const fuzzySearchCustomers = useCallback(
    async (keyword: string, config?: FuzzySearchConfig): Promise<CustomerSearchResult[]> => {
      try {
        const results = await fuzzyService.fuzzySearchCustomers(keyword, config);
        return results;
      } catch (error) {
        console.error('Failed to fuzzy search customers:', error);
        throw error;
      }
    },
    []
  );

  const value: CustomerManagementContextType = {
    selectedCustomer,
    activeRoute,
    nearbyLeads,
    isLoadingCustomers,
    isLoadingRoute,
    selectCustomer,
    clearSelectedCustomer,
    updateCustomerVerification,
    setActiveRoute: setActiveRouteData,
    reorderRoutePoints,
    getNearbyLeads,
    addLeadToRoute,
    searchCustomers,
    fuzzySearchCustomers,
  };

  return (
    <CustomerManagementContext.Provider value={value}>
      {children}
    </CustomerManagementContext.Provider>
  );
};

/**
 * Hook to use Customer Management context
 */
export const useCustomerManagement = (): CustomerManagementContextType => {
  const context = useContext(CustomerManagementContext);
  if (!context) {
    throw new Error(
      'useCustomerManagement must be used within CustomerManagementProvider'
    );
  }
  return context;
};

export default CustomerManagementContext;
