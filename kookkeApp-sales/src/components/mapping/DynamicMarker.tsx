import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { RoutePoint } from '../../types/shared/models/location';

interface DynamicMarkerProps {
    routePoint: RoutePoint;
    onPress: () => void;
}

const DynamicMarker: React.FC<DynamicMarkerProps> = ({ routePoint, onPress }) => {
    const [pulseAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        if (routePoint.isUrgent && routePoint.status !== 'COMPLETED') {
            // Pulsing animation for urgent markers
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.3,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [routePoint.isUrgent, routePoint.status, pulseAnim]);

    const getMarkerColor = () => {
        if (routePoint.status === 'COMPLETED') return '#4CAF50'; // Green
        if (routePoint.isUrgent) return '#F44336'; // Red
        if (routePoint.status === 'ARRIVED') return '#FF9800'; // Orange
        return '#2196F3'; // Blue
    };

    const getMarkerIcon = () => {
        if (routePoint.requiresFreezerFix) return 'snow';
        if (routePoint.status === 'COMPLETED') return 'checkmark-circle';
        return 'location';
    };

    return (
        <Marker
            coordinate={routePoint.coordinate}
            onPress={onPress}
            tracksViewChanges={false}
        >
            <Animated.View
                style={[
                    styles.markerContainer,
                    {
                        transform: [{ scale: routePoint.isUrgent ? pulseAnim : 1 }],
                    },
                ]}
            >
                <View
                    style={[
                        styles.marker,
                        { backgroundColor: getMarkerColor() },
                    ]}
                >
                    <Ionicons name={getMarkerIcon()} size={20} color="white" />
                </View>
                {routePoint.sequenceOrder && (
                    <View style={styles.sequenceBadge}>
                        <Ionicons name="flag" size={12} color="white" />
                    </View>
                )}
            </Animated.View>
        </Marker>
    );
};

const styles = StyleSheet.create({
    markerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    marker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    sequenceBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FF5722',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
});

export default DynamicMarker;
