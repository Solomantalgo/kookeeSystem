import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoutePoint, LocationUpdate } from '../../types/shared/models/location';
import { calculateETA, formatDistance } from '../../services/NavigationService';

interface BottomSheetNavigationDashboardProps {
    targetPoint: RoutePoint | null;
    currentLocation: LocationUpdate | null;
    distance: number;
    eta: string;
    isArrivalMode: boolean;
    onStartVisit?: () => void;
    onNavigate?: () => void;
}

const BottomSheetNavigationDashboard: React.FC<BottomSheetNavigationDashboardProps> = ({
    targetPoint,
    currentLocation,
    distance,
    eta,
    isArrivalMode,
    onStartVisit,
    onNavigate,
}) => {
    const [slideAnim] = useState(new Animated.Value(1));
    const [nextActionIcon, setNextActionIcon] = useState('navigate');

    useEffect(() => {
        // Determine next action icon based on context
        if (isArrivalMode) {
            setNextActionIcon('checkmark-circle');
        } else if (currentLocation && targetPoint) {
            setNextActionIcon('navigate');
        }
    }, [isArrivalMode, currentLocation, targetPoint]);

    if (!targetPoint || !currentLocation) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [
                        {
                            translateY: slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [200, 0],
                            }),
                        },
                    ],
                },
            ]}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.handleBar} />

                {/* Target Destination */}
                <View style={styles.destinationSection}>
                    <View style={styles.destinationHeader}>
                        <View style={styles.destinationIcon}>
                            <Ionicons name="location" size={20} color="#2196F3" />
                        </View>
                        <View style={styles.destinationInfo}>
                            <Text style={styles.customerName} numberOfLines={1}>
                                {targetPoint.id}
                            </Text>
                            <Text style={styles.status}>
                                {isArrivalMode ? '📍 You have arrived!' : 'Heading to destination'}
                            </Text>
                        </View>
                        {isArrivalMode && (
                            <View style={styles.arrivedBadge}>
                                <Ionicons name="checkmark" size={16} color="white" />
                            </View>
                        )}
                    </View>
                </View>

                {/* Distance & ETA Display */}
                <View style={styles.etaSection}>
                    <View style={styles.etaCard}>
                        <View style={styles.etaItem}>
                            <Text style={styles.etaLabel}>Distance</Text>
                            <Text style={styles.etaValue}>{formatDistance(distance)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.etaItem}>
                            <Text style={styles.etaLabel}>ETA</Text>
                            <Text style={styles.etaValue}>{eta}</Text>
                        </View>
                    </View>
                </View>

                {/* Next Action Instruction */}
                <View style={styles.actionSection}>
                    <View
                        style={[
                            styles.actionIcon,
                            isArrivalMode && styles.actionIconArrived,
                        ]}
                    >
                        <Ionicons
                            name={nextActionIcon}
                            size={24}
                            color={isArrivalMode ? '#4CAF50' : '#2196F3'}
                        />
                    </View>
                    <Text style={styles.actionText}>
                        {isArrivalMode
                            ? 'Ready to start your visit'
                            : `Continue on your route`}
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonsContainer}>
                    {isArrivalMode && (
                        <TouchableOpacity
                            style={[styles.button, styles.startVisitButton]}
                            onPress={onStartVisit}
                        >
                            <Ionicons name="play-circle" size={20} color="white" />
                            <Text style={styles.buttonText}>Start Visit</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.button, styles.navigateButton]}
                        onPress={onNavigate}
                    >
                        <Ionicons
                            name="navigate"
                            size={20}
                            color={isArrivalMode ? '#2196F3' : 'white'}
                        />
                        <Text
                            style={[
                                styles.buttonText,
                                isArrivalMode && styles.navigateButtonText,
                            ]}
                        >
                            Navigate
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Speed & Accuracy Info */}
                {currentLocation && (
                    <View style={styles.infoBar}>
                        <View style={styles.infoItem}>
                            <Ionicons name="speedometer" size={14} color="#666" />
                            <Text style={styles.infoText}>
                                {currentLocation.speed ? `${(currentLocation.speed * 3.6).toFixed(0)} km/h` : 'N/A'}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="ellipse" size={10} color="#999" />
                            <Text style={styles.infoText}>
                                ±{Math.round(currentLocation.accuracy)}m
                            </Text>
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    safeArea: {
        paddingBottom: 20,
    },
    handleBar: {
        height: 4,
        width: 40,
        backgroundColor: '#DDD',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16,
    },
    destinationSection: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    destinationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    destinationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    destinationInfo: {
        flex: 1,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    status: {
        fontSize: 12,
        color: '#666',
    },
    arrivedBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    etaSection: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    etaCard: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    etaItem: {
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: '#DDD',
        marginHorizontal: 8,
    },
    etaLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    etaValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2196F3',
    },
    actionSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        paddingVertical: 12,
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionIconArrived: {
        backgroundColor: '#E8F5E9',
    },
    actionText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
        color: '#333',
    },
    buttonsContainer: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 8,
    },
    startVisitButton: {
        backgroundColor: '#4CAF50',
    },
    navigateButton: {
        backgroundColor: '#2196F3',
    },
    navigateButtonText: {
        color: '#2196F3',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    infoBar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        gap: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 12,
        color: '#666',
    },
});

export default BottomSheetNavigationDashboard;
