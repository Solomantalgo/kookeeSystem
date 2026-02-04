/**
 * QUICK START EXAMPLES
 * Copy-paste ready code snippets for integrating Customer & Route Management
 */

// ============================================================================
// 1. SETUP: Wrap app with CustomerManagementProvider
// ============================================================================

// App.tsx
import { CustomerManagementProvider } from './src/contexts/CustomerManagementContext';

export default function App() {
  return (
    <CustomerManagementProvider>
      <YourMainScreen />
    </CustomerManagementProvider>
  );
}

// ============================================================================
// 2. FUZZY SEARCH: Find customers with typo tolerance
// ============================================================================

import { FuzzySearchService } from './src/services/customerManagement/FuzzySearchService';
import { Customer } from './src/types/customerManagement';

// Search with typo tolerance
const fuzzyService = new FuzzySearchService();

// Example: User types "luk" but means "Lukaya Supermarket"
const results = fuzzyService.search('luk', customers, {
  threshold: 0.6,  // 60% minimum match
  maxResults: 20,
  searchFields: ['name', 'address'],
  caseSensitive: false,
});

// Results:
// [
//   {
//     customer: { id: '123', name: 'Lukaya Supermarket', ... },
//     score: 0.95,
//     matchField: 'name',
//     matchType: 'fuzzy'
//   }
// ]

// ============================================================================
// 3. CUSTOMER FILTERING & SORTING
// ============================================================================

import { CustomerUIService } from './src/services/customerManagement/CustomerUIService_new';

const uiService = new CustomerUIService();

// Filter by category
const retailCustomers = uiService.filterCustomers(allCustomers, {
  category: 'Retail',
  excludeArchived: true,
  searchQuery: 'market', // optional search
});

// Sort by distance
const nearestCustomers = uiService.sortCustomers(retailCustomers, {
  sortBy: 'distance',
  sortOrder: 'asc',
  userLocation: { latitude: -1.123, longitude: 36.456 },
});

// Calculate distance and ETA
const distanceInfo = uiService.calculateDistanceFromUser(
  customer,
  userLocation
);
// { value: 2500, formatted: "2.5 km" }

const etaInfo = uiService.calculateETA(customer, userLocation);
// { minutes: 12, formatted: "12 mins" }

// ============================================================================
// 4. CUSTOMER PROFILE WITH TIMELINE
// ============================================================================

import { useCustomerManagement } from './src/contexts/CustomerManagementContext';

// In your component
const { selectedCustomer, selectCustomer } = useCustomerManagement();

// Select a customer
await selectCustomer(customerId);

// Build timeline
const timeline = uiService.buildTimeline(selectedCustomer.customer);
// [
//   {
//     id: 'note-1',
//     type: 'note',
//     timestamp: 1640000000,
//     content: 'Stock levels good',
//     author: 'John Doe',
//     isVoiceMemo: false
//   },
//   ...
// ]

// Get profile completeness
const score = uiService.calculateCompletenessScore(selectedCustomer.customer);
// 85 (out of 100)

// Get action center data
const actions = uiService.getActionCenterData(
  selectedCustomer.customer,
  userLocation
);
// {
//   canCall: true,
//   canWhatsapp: true,
//   canNavigate: true,
//   distance: { value: 2500, formatted: "2.5 km" },
//   eta: { minutes: 12, formatted: "12 mins" }
// }

// ============================================================================
// 5. VOICE MEMO RECORDING
// ============================================================================

import { VoiceMemoService } from './src/services/VoiceMemoService';

const voiceMemoService = new VoiceMemoService();

// Listen to recording state changes
const unsubscribe = voiceMemoService.onStateChange((state) => {
  console.log(`Recording: ${VoiceMemoService.formatDuration(state.duration)}`);
  console.log(`Max: ${VoiceMemoService.formatDuration(state.maxDuration)}`);
});

// Start recording
try {
  await voiceMemoService.startRecording();
  
  // User speaks for up to 10 seconds...
  // (auto-stops at 10 seconds)
  
  // Stop recording and get audio file URI
  const audioUri = await voiceMemoService.stopRecording();
  
  // Check if recording is valid (at least 1 second)
  if (voiceMemoService.isValidRecording()) {
    // Save to database
    await saveVisitNote({
      customerId,
      voiceMemoUrl: audioUri,
      voiceMemoDuration: voiceMemoService.getRecordingState().duration,
      type: 'voice_memo',
      timestamp: Date.now(),
      authorName: currentUser.name,
    });
  }
} catch (error) {
  console.error('Recording failed:', error);
} finally {
  // Cleanup
  await voiceMemoService.cleanup();
  unsubscribe(); // Stop listening
}

// Play recorded memo
await voiceMemoService.playMemo(audioUri);

// ============================================================================
// 6. GEOLOCATION NORMALIZATION (PIN TOOL)
// ============================================================================

import { GeoLocationNormalizer } from './src/components/GeoLocationNormalizer';

// In your JSX
const [showGeoNormalizer, setShowGeoNormalizer] = useState(false);

const handleSaveLocation = async (location: GeoLocation) => {
  // Update customer location
  await updateCustomerLocation(customer.id, location);
  
  // Update verification status
  const { selectCustomer } = useCustomerManagement();
  await selectCustomer(customer.id); // Refresh
  
  setShowGeoNormalizer(false);
};

return (
  <>
    <TouchableOpacity onPress={() => setShowGeoNormalizer(true)}>
      <Text>Update GPS Pin</Text>
    </TouchableOpacity>

    <GeoLocationNormalizer
      customer={customer}
      isVisible={showGeoNormalizer}
      onClose={() => setShowGeoNormalizer(false)}
      onSaveLocation={handleSaveLocation}
    />
  </>
);

// ============================================================================
// 7. ROUTE OPTIMIZATION & REORDERING
// ============================================================================

import { RouteCalculationService } from './src/services/customerManagement/RouteCalculationService';

const routeService = new RouteCalculationService();

// Calculate route metrics
const calculation = routeService.calculateRoute(
  currentRoute,
  customerMap, // Map<customerId, Customer>
  userLocation
);
// {
//   totalDistance: 25000,
//   totalDuration: 45,
//   distanceFormatted: "25.0 km",
//   durationFormatted: "45 min",
//   segments: [...]
// }

// Reorder a route point (drag-and-drop)
const reorderResult = routeService.reorderRoute(
  currentRoute,
  fromIndex,  // 2
  toIndex,    // 0 (move to beginning)
  customerMap,
  userLocation
);
// {
//   reorderedPoints: [...],
//   calculation: { ... } // New metrics
// }

// Optimize route (AI suggestion)
const optimization = routeService.optimizeRoute(
  currentRoute,
  customerMap,
  userLocation
);
// {
//   optimizedSequence: [...],
//   savings: {
//     distance: 5000,  // 5 km saved
//     duration: 10      // 10 min saved
//   },
//   calculationResult: { ... }
// }

// Add a new stop to route
const newCalculation = routeService.addStopToRoute(
  currentRoute,
  newCustomerId,
  insertAtSequence,
  customerMap,
  userLocation
);

// Get ETA for specific point
const eta = routeService.getETAForPoint(
  currentRoute,
  pointIndex,
  customerMap,
  userLocation,
  currentLocation
);
// 12 (minutes)

// ============================================================================
// 8. CUSTOMER DIRECTORY WITH FUZZY SEARCH
// ============================================================================

import { CustomerDirectory } from './src/components/CustomerDirectory';

// In your screen
const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

return (
  <>
    <CustomerDirectory
      customers={allCustomers}
      onSelectCustomer={(customer) => {
        setSelectedCustomer(customer);
        openCustomerProfile();
      }}
      userLocation={currentLocation}
      onRefresh={async () => {
        const fresh = await fetchCustomers();
        setAllCustomers(fresh);
      }}
      isLoading={isLoading}
    />

    {selectedCustomer && (
      <CustomerProfile
        customer={selectedCustomer}
        userLocation={currentLocation}
        onClose={() => setSelectedCustomer(null)}
        onCheckIn={(customerId) => {
          recordCheckIn(customerId);
        }}
        onUpdateLocation={async (customerId, location) => {
          await updateCustomerLocation(customerId, location);
        }}
      />
    )}
  </>
);

// ============================================================================
// 9. GEOSPATIAL UTILITIES
// ============================================================================

import {
  calculateHaversineDistance,
  calculateBearing,
  isPointInGeofence,
  estimateTravelTime,
  formatDistance,
  formatDuration,
} from './src/services/customerManagement/utils/geospatialUtils';

const point1 = { latitude: -1.2865, longitude: 36.8172 };
const point2 = { latitude: -1.2755, longitude: 36.8315 };

// Distance in meters
const distance = calculateHaversineDistance(point1, point2);
// 2543

// Formatted distance
const formatted = formatDistance(distance);
// "2.5 km"

// Bearing (direction)
const bearing = calculateBearing(point1, point2);
// 45 (degrees, 0-360)

// Check if point is in geofence
const isInGeofence = isPointInGeofence(
  point1,
  { latitude: -1.290, longitude: 36.820 }, // center
  5000 // 5 km radius
);

// Estimate travel time
const travelMinutes = estimateTravelTime(distance);
// 10 (minutes, assuming 40 km/h average)

const travelFormatted = formatDuration(travelMinutes * 60);
// "10 min"

// ============================================================================
// 10. CONTEXT USAGE IN COMPONENTS
// ============================================================================

import { useCustomerManagement } from './src/contexts/CustomerManagementContext';

function MyComponent() {
  const {
    selectedCustomer,
    activeRoute,
    nearbyLeads,
    selectCustomer,
    setActiveRoute,
    reorderRoutePoints,
    getNearbyLeads,
    searchCustomers,
    fuzzySearchCustomers,
  } = useCustomerManagement();

  // Select and view a customer
  const handleViewCustomer = async (customerId: string) => {
    try {
      await selectCustomer(customerId);
      // selectedCustomer is now populated
    } catch (error) {
      console.error('Failed to select customer:', error);
    }
  };

  // Search for nearby leads
  const handleFindNearbyLeads = async () => {
    const leads = await getNearbyLeads({
      centerLocation: currentLocation,
      radiusMeters: 5000,
      limit: 10,
    });
    // leads is now populated in context
  };

  // Fuzzy search
  const handleSearch = async (query: string) => {
    const results = await fuzzySearchCustomers(query, {
      threshold: 0.5,
    });
    // results contains matched customers
  };

  // Reorder route
  const handleReorderRoute = async (newSequence) => {
    const transaction = await reorderRoutePoints(newSequence);
    // activeRoute is updated in context
  };

  return (
    <View>
      {selectedCustomer && (
        <Text>{selectedCustomer.customer.name}</Text>
      )}

      {activeRoute && (
        <Text>Route: {activeRoute.route.points.length} stops</Text>
      )}

      {nearbyLeads.map((lead) => (
        <Text key={lead.id}>{lead.name}</Text>
      ))}
    </View>
  );
}

// ============================================================================
// 11. COMPLETE SCREEN INTEGRATION EXAMPLE
// ============================================================================

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { CustomerDirectory } from './src/components/CustomerDirectory';
import { CustomerProfile } from './src/components/CustomerProfile';
import { RouteSequencer } from './src/components/RouteSequencer';

export const SalesScreen = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showRouteSequencer, setShowRouteSequencer] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [userLocation, setUserLocation] = useState<GeoLocation | null>(null);

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    // Your API call
    const data = await api.getCustomers();
    setCustomers(data);
  };

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    // Load full profile data if needed
  };

  const handleCheckIn = async (customerId: string) => {
    await api.recordCheckIn(customerId);
    // Update UI
  };

  const handleReorderRoute = async (reorderedPoints) => {
    await api.updateRoute(currentRoute.id, reorderedPoints);
    setCurrentRoute({ ...currentRoute, points: reorderedPoints });
  };

  return (
    <View style={styles.container}>
      {!selectedCustomer ? (
        <CustomerDirectory
          customers={customers}
          onSelectCustomer={handleSelectCustomer}
          userLocation={userLocation}
          onRefresh={fetchCustomers}
        />
      ) : (
        <CustomerProfile
          customer={selectedCustomer}
          userLocation={userLocation}
          onClose={() => setSelectedCustomer(null)}
          onCheckIn={handleCheckIn}
        />
      )}

      <RouteSequencer
        route={currentRoute}
        customers={new Map(customers.map((c) => [c.id, c]))}
        userLocation={userLocation}
        isVisible={showRouteSequencer}
        onClose={() => setShowRouteSequencer(false)}
        onReorder={handleReorderRoute}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

// ============================================================================
// END OF QUICK START EXAMPLES
// ============================================================================
