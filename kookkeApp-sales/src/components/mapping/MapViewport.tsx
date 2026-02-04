import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Platform,
    Text,
    ActivityIndicator,
    Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import SuperCluster from 'react-native-maps-super-cluster';
import { Ionicons } from '@expo/vector-icons';
import { LocationUpdate, RoutePoint } from '../../types/shared/models/location';
import DynamicMarker from './DynamicMarker';
import RoutePolyline from './RoutePolyline';

interface MapViewportProps {
    currentLocation: LocationUpdate | null;
    routePoints: RoutePoint[];
    polylineCoordinates: Array<{ latitude: number; longitude: number }>;
    targetPoint?: RoutePoint | null;
    onMarkerPress: (routePoint: RoutePoint) => void;
    onArrival?: (point: RoutePoint) => void;
    isDarkMode?: boolean;
    onDarkModeToggle?: (isDark: boolean) => void;
}

const MapViewport: React.FC<MapViewportProps> = ({
    currentLocation,
    routePoints,
    polylineCoordinates,
    targetPoint,
    onMarkerPress,
    onArrival,
    isDarkMode = false,
    onDarkModeToggle,
}) => {
    const mapRef = useRef<MapView>(null);
    const [isFreeLookMode, setIsFreeLookMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [clusteringEnabled, setClusteringEnabled] = useState(true);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [region, setRegion] = useState({
        latitude: currentLocation?.latitude || 0.3476,
        longitude: currentLocation?.longitude || 32.5825,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    // Arrival detection with geofencing (150m radius)
    const ARRIVAL_THRESHOLD = 150;
    useEffect(() => {
        if (currentLocation && targetPoint && onArrival) {
            const distance = calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                targetPoint.coordinate.latitude,
                targetPoint.coordinate.longitude
            );

            if (distance < ARRIVAL_THRESHOLD && targetPoint.status !== 'COMPLETED') {
                onArrival(targetPoint);
            }
        }
    }, [currentLocation, targetPoint, onArrival]);

    // Camera follow logic with smooth animation
    useEffect(() => {
        if (currentLocation && !isFreeLookMode && mapRef.current) {
            mapRef.current.animateToRegion(
                {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                },
                800
            );
        }
    }, [currentLocation, isFreeLookMode]);

    // Calculate distance between two coordinates
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371000; // Earth's radius in meters
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleCenterOnMe = useCallback(() => {
        setIsFreeLookMode(false);
        if (currentLocation && mapRef.current) {
            mapRef.current.animateToRegion(
                {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                },
                500
            );
        }
    }, [currentLocation]);

    const handleRegionChangeComplete = useCallback((region: any) => {
        // Update zoom level for clustering logic
        const zoom = Math.log2(360 / (region.longitudeDelta || 1));
        setZoomLevel(zoom);
        // User manually panned the map - disable auto-follow
        setIsFreeLookMode(true);
    }, []);

    const handleMapPress = useCallback(() => {
        // Clear free-look mode when user taps map (auto-focus)
    }, []);

    const handleDarkModeToggle = useCallback(() => {
        onDarkModeToggle?.(!isDarkMode);
    }, [isDarkMode, onDarkModeToggle]);

    const handleOpenNavigation = useCallback((provider: 'waze' | 'maps' | 'apple') => {
        if (!targetPoint) return;

        const { latitude, longitude } = targetPoint.coordinate;
        const label = targetPoint.id;

        switch (provider) {
            case 'waze':
                Linking.openURL(`waze://?ll=${latitude},${longitude}&navigate=yes`);
                break;
            case 'maps':
                const url = Platform.OS === 'ios'
                    ? `maps://maps.apple.com/?daddr=${latitude},${longitude}`
                    : `google.navigation:q=${latitude},${longitude}`;
                Linking.openURL(url);
                break;
            default:
                break;
        }
    }, [targetPoint]);

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={region}
                onRegionChangeComplete={handleRegionChangeComplete}
                onPress={handleMapPress}
                showsUserLocation
                showsMyLocationButton={false}
                customMapStyle={isDarkMode ? darkMapStyle : []}
                loadingEnabled
                loadingIndicatorColor="#2196F3"
                zoomControlEnabled={true}
            >
                {/* Route Polyline */}
                {polylineCoordinates.length > 0 && (
                    <RoutePolyline coordinates={polylineCoordinates} />
                )}

                {/* Route Point Markers with Clustering */}
                {clusteringEnabled && zoomLevel < 15 ? (
                    <SuperCluster
                        data={routePoints}
                        renderCluster={(cluster: any) => (
                            <Marker
                                key={`cluster-${cluster.properties.cluster_id}`}
                                coordinate={{
                                    latitude: cluster.geometry.coordinates[1],
                                    longitude: cluster.geometry.coordinates[0],
                                }}
                                onPress={() => {
                                    // Zoom into cluster
                                    if (mapRef.current) {
                                        mapRef.current.animateToRegion(
                                            {
                                                latitude: cluster.geometry.coordinates[1],
                                                longitude: cluster.geometry.coordinates[0],
                                                latitudeDelta: 0.5,
                                                longitudeDelta: 0.5,
                                            },
                                            500
                                        );
                                    }
                                }}
                            >
                                <View style={styles.clusterMarker}>
                                    <Text style={styles.clusterText}>
                                        {cluster.properties.point_count}
                                    </Text>
                                </View>
                            </Marker>
                        )}
                        renderMarker={(point: RoutePoint) => (
                            <DynamicMarker
                                key={point.id}
                                routePoint={point}
                                onPress={() => onMarkerPress(point)}
                            />
                        )}
                        maxZoom={17}
                        minZoom={1}
                    />
                ) : (
                    routePoints.map((point) => (
                        <DynamicMarker
                            key={point.id}
                            routePoint={point}
                            onPress={() => onMarkerPress(point)}
                        />
                    ))
                )}

                {/* Current Location Marker */}
                {currentLocation && (
                    <Marker
                        coordinate={{
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude,
                        }}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.currentLocationMarker}>
                            <View style={styles.currentLocationDot} />
                            <View style={styles.currentLocationRing} />
                        </View>
                    </Marker>
                )}
            </MapView>

            {/* Top Right Controls */}
            <View style={styles.topRightControls}>
                {/* Dark Mode Toggle */}
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleDarkModeToggle}
                >
                    <Ionicons
                        name={isDarkMode ? 'moon' : 'sunny'}
                        size={20}
                        color={isDarkMode ? '#FFD700' : '#FF9800'}
                    />
                </TouchableOpacity>
            </View>

            {/* Center on Me Button */}
            <TouchableOpacity
                style={[styles.centerButton, isFreeLookMode && styles.centerButtonActive]}
                onPress={handleCenterOnMe}
            >
                <Ionicons
                    name="locate"
                    size={24}
                    color={isFreeLookMode ? '#2196F3' : '#666'}
                />
            </TouchableOpacity>

            {/* Navigation Provider Buttons */}
            {targetPoint && (
                <View style={styles.navigationButtonsContainer}>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => handleOpenNavigation('maps')}
                    >
                        <Ionicons name="navigate" size={18} color="white" />
                        <Text style={styles.navButtonText}>Maps</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.navButton, styles.wazeButton]}
                        onPress={() => handleOpenNavigation('waze')}
                    >
                        <Ionicons name="navigate" size={18} color="white" />
                        <Text style={styles.navButtonText}>Waze</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Loading Indicator */}
            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                </View>
            )}
        </View>
    );
};

const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9080' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3751b' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
    { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    topRightControls: {
        position: 'absolute',
        top: 60,
        right: 20,
        gap: 10,
    },
    controlButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    centerButton: {
        position: 'absolute',
        bottom: 200,
        right: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    centerButtonActive: {
        backgroundColor: '#E3F2FD',
    },
    currentLocationMarker: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentLocationDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2196F3',
    },
    currentLocationRing: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#2196F3',
        position: 'absolute',
    },
    clusterMarker: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    clusterText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
    },
    navigationButtonsContainer: {
        position: 'absolute',
        bottom: 120,
        right: 20,
        gap: 8,
    },
    navButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    wazeButton: {
        backgroundColor: '#0066FF',
    },
    navButtonText: {
        fontSize: 12,
        color: 'white',
        fontWeight: '600',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(33, 150, 243, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentLocationDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2196F3',
        borderWidth: 2,
        borderColor: 'white',
    },
});

// Dark mode map style
const darkMapStyle = [
    {
        elementType: 'geometry',
        stylers: [{ color: '#242f3e' }],
    },
    {
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#242f3e' }],
    },
    {
        elementType: 'labels.text.fill',
        stylers: [{ color: '#746855' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#38414e' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#212a37' }],
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }],
    },
];

export default MapViewport;
