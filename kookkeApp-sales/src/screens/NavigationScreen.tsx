import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, useColorScheme } from 'react-native';
import * as Location from 'expo-location';
import MapViewport from '../components/mapping/MapViewport';
import NextCustomerCard from '../components/navigation/NextCustomerCard';
import ProgressOverlay from '../components/navigation/ProgressOverlay';
import { LocationUpdate, RoutePoint, NavigationState } from '@types/shared/models/location';
import { Customer } from '@types/shared/models/customer';
import NavigationService from '../services/NavigationService';

const NavigationScreen: React.FC = () => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const [currentLocation, setCurrentLocation] = useState<LocationUpdate | null>(null);
    const [navigationState, setNavigationState] = useState<NavigationState>({
        currentLocation: null,
        targetPoint: null,
        distanceToTarget: 0,
        etaToTarget: 'N/A',
        isArrivalMode: false,
        isFreeLookMode: false,
        routeProgress: 0,
    });

    // Mock data - in production, this would come from state management or API
    const [routePoints, setRoutePoints] = useState<RoutePoint[]>([
        {
            id: '1',
            coordinate: { latitude: 0.3476, longitude: 32.5825 },
            customerId: 'cust-1',
            sequenceOrder: 1,
            status: 'PNDING',
            isUrgent: false,
        },
        {
            id: '2',
            coordinate: { latitude: 0.3500, longitude: 32.5850 },
            customerId: 'cust-2',
            sequenceOrder: 2,
            status: 'PNDING',
            isUrgent: true,
        },
        {
            id: '3',
            coordinate: { latitude: 0.3450, longitude: 32.5800 },
            customerId: 'cust-3',
            sequenceOrder: 3,
            status: 'PNDING',
            requiresFreezerFix: true,
        },
    ]);

    const [mockCustomer] = useState<Customer>({
        localId: 'cust-1',
        name: 'Kampala Central Store',
        code: 'KCS-001',
        address: 'Plot 12, Kampala Road, Kampala',
        latitude: 0.3476,
        longitude: 32.5825,
        territoryId: 'territory-1',
        freezerPresence: true,
        customAttributes: {},
        isActive: true,
        versionNumber: 1,
        isDirty: false,
    });

    const polylineCoordinates = [
        { latitude: 0.3476, longitude: 32.5825 },
        { latitude: 0.3485, longitude: 32.5835 },
        { latitude: 0.3500, longitude: 32.5850 },
        { latitude: 0.3475, longitude: 32.5820 },
        { latitude: 0.3450, longitude: 32.5800 },
    ];

    // Request location permissions and start tracking
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required for navigation.'
                );
                return;
            }

            // Get initial location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const locationUpdate: LocationUpdate = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy || 0,
                altitude: location.coords.altitude,
                heading: location.coords.heading,
                speed: location.coords.speed,
                timestamp: location.timestamp,
            };

            setCurrentLocation(locationUpdate);

            // Start watching location
            Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000,
                    distanceInterval: 10,
                },
                (location) => {
                    const update: LocationUpdate = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        accuracy: location.coords.accuracy || 0,
                        altitude: location.coords.altitude,
                        heading: location.coords.heading,
                        speed: location.coords.speed,
                        timestamp: location.timestamp,
                    };
                    setCurrentLocation(update);
                }
            );
        })();
    }, []);

    // Update navigation state every 60 seconds or when location changes
    useEffect(() => {
        const updatedState = NavigationService.updateNavigationState(
            currentLocation,
            routePoints,
            navigationState.isFreeLookMode
        );
        setNavigationState(updatedState);

        // Check for arrival
        if (updatedState.isArrivalMode && !navigationState.isArrivalMode) {
            Alert.alert(
                'Arrival',
                'You have arrived at your destination!',
                [{ text: 'OK' }]
            );
        }
    }, [currentLocation, routePoints]);

    const handleMarkerPress = (routePoint: RoutePoint) => {
        Alert.alert(
            'Customer',
            `Sequence: ${routePoint.sequenceOrder}\nStatus: ${routePoint.status}`,
            [{ text: 'OK' }]
        );
    };

    const handleStartVisit = () => {
        Alert.alert('Start Visit', 'Visit tracking started!');
        // In production, this would trigger visit creation logic
    };

    const handleNavigateExternal = () => {
        console.log('External navigation launched');
    };

    const completedStops = routePoints.filter((p) => p.status === 'COMPLETED').length;

    return (
        <View style={styles.container}>
            <MapViewport
                currentLocation={currentLocation}
                routePoints={routePoints}
                polylineCoordinates={polylineCoordinates}
                onMarkerPress={handleMarkerPress}
                isDarkMode={isDarkMode}
            />

            <ProgressOverlay
                routeProgress={navigationState.routeProgress}
                completedStops={completedStops}
                totalStops={routePoints.length}
            />

            <NextCustomerCard
                targetPoint={navigationState.targetPoint}
                customer={mockCustomer}
                distanceToTarget={navigationState.distanceToTarget}
                etaToTarget={navigationState.etaToTarget}
                onStartVisit={handleStartVisit}
                onNavigateExternal={handleNavigateExternal}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default NavigationScreen;
