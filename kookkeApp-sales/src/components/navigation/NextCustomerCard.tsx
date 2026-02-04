import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Linking,
    Animated,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoutePoint } from '../../types/shared/models/location';
import { formatDistance } from '../../services/NavigationService';

interface NextCustomerCardProps {
    targetPoint: RoutePoint | null;
    customerName?: string;
    customerCategory?: string;
    distanceToTarget: number;
    etaToTarget: string;
    isArrivalMode?: boolean;
    progressPercentage?: number;
    onStartVisit?: () => void;
    onNavigateExternal?: () => void;
    onViewDetails?: () => void;
}

const NextCustomerCard: React.FC<NextCustomerCardProps> = ({
    targetPoint,
    customerName = 'Unknown',
    customerCategory = 'Retail',
    distanceToTarget,
    etaToTarget,
    isArrivalMode = false,
    progressPercentage = 0,
    onStartVisit,
    onNavigateExternal,
    onViewDetails,
}) => {
    const [scaleAnim] = useState(new Animated.Value(1));
    
    useEffect(() => {
        if (isArrivalMode) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.05,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            scaleAnim.setValue(1);
        }
    }, [isArrivalMode, scaleAnim]);

    if (!targetPoint) {
        return null;
    }

    const handleExternalNav = () => {
        const { latitude, longitude } = targetPoint.coordinate;
        const label = encodeURIComponent(customerName);

        const url = Platform.select({
            ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
            android: `geo:0,0?q=${latitude},${longitude}(${label})`,
        });

        if (url) {
            Linking.canOpenURL(url).then((supported) => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
                    Linking.openURL(webUrl);
                }
            });
        }

        onNavigateExternal?.();
    };

    return (
        <Animated.View
            style={[
                styles.container,
                isArrivalMode && styles.containerArrived,
                {
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            {/* Status Indicator */}
            {isArrivalMode && (
                <View style={styles.arrivedIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                    <Text style={styles.arrivedText}>ARRIVED</Text>
                </View>
            )}

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.sequenceIcon}>
                        <Ionicons name="map" size={20} color="#2196F3" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Next Stop</Text>
                        <Text style={styles.sequenceInfo}>{targetPoint.sequenceOrder}</Text>
                    </View>
                </View>
                <View style={styles.distanceBadge}>
                    <Ionicons name="pin" size={14} color="#FF5722" />
                    <Text style={styles.distanceText}>{formatDistance(distanceToTarget)}</Text>
                </View>
            </View>

            {/* Customer Name & Category */}
            <View style={styles.customerSection}>
                <Text style={styles.customerName} numberOfLines={2}>
                    {customerName}
                </Text>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{customerCategory}</Text>
                </View>
            </View>

            {/* Route Progress Bar */}
            {progressPercentage > 0 && (
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <Animated.View
                            style={[
                                styles.progressFill,
                                { width: `${progressPercentage * 100}%` },
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {Math.round(progressPercentage * 100)}% complete
                    </Text>
                </View>
            )}

            {/* ETA Section */}
            <View style={styles.etaSection}>
                <View style={styles.etaItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.etaLabel}>ETA</Text>
                    <Text style={styles.etaValue}>{etaToTarget}</Text>
                </View>
                <View style={styles.etaDivider} />
                <View style={styles.etaItem}>
                    <Ionicons name="speedometer" size={16} color="#666" />
                    <Text style={styles.etaLabel}>Status</Text>
                    <Text style={[styles.etaValue, isArrivalMode && { color: '#4CAF50' }]}>
                        {isArrivalMode ? 'Ready' : 'In Route'}
                    </Text>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                {isArrivalMode ? (
                    <>
                        <TouchableOpacity
                            style={[styles.button, styles.startVisitButton]}
                            onPress={onStartVisit}
                        >
                            <Ionicons name="play-circle" size={18} color="white" />
                            <Text style={styles.buttonText}>Start Visit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.detailsButton]}
                            onPress={onViewDetails}
                        >
                            <Ionicons name="information-circle" size={18} color="#2196F3" />
                            <Text style={styles.detailsButtonText}>Details</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity
                            style={[styles.button, styles.navigateButton]}
                            onPress={handleExternalNav}
                        >
                            <Ionicons name="navigate" size={18} color="white" />
                            <Text style={styles.buttonText}>Navigate</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.detailsButton]}
                            onPress={onViewDetails}
                        >
                            <Ionicons name="chevron-forward" size={18} color="#2196F3" />
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Status Tags */}
            {targetPoint.isUrgent && (
                <View style={styles.urgentTag}>
                    <Ionicons name="alert-circle" size={14} color="#FF5722" />
                    <Text style={styles.urgentText}>Urgent Reminder</Text>
                </View>
            )}

            {targetPoint.requiresFreezerFix && (
                <View style={styles.freezerTag}>
                    <Ionicons name="snow" size={14} color="#00BCD4" />
                    <Text style={styles.freezerTagText}>Freezer Fix Required</Text>
                </View>
            )}
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
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 12,
    },
    containerArrived: {
        backgroundColor: '#F0F8FF',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    arrivedIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    arrivedText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sequenceIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    sequenceInfo: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    distanceText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF5722',
    },
    customerSection: {
        marginBottom: 12,
    },
    customerName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 6,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: 11,
        color: '#2E7D32',
        fontWeight: '600',
    },
    progressContainer: {
        marginBottom: 12,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#F0F0F0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 11,
        color: '#999',
        fontWeight: '500',
    },
    etaSection: {
        flexDirection: 'row',
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },
    etaItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    etaDivider: {
        width: 1,
        backgroundColor: '#E0E0E0',
    },
    etaLabel: {
        fontSize: 11,
        color: '#999',
        fontWeight: '500',
    },
    etaValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2196F3',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    startVisitButton: {
        backgroundColor: '#4CAF50',
    },
    navigateButton: {
        backgroundColor: '#2196F3',
    },
    detailsButton: {
        backgroundColor: '#E3F2FD',
    },
    buttonText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
    },
    detailsButtonText: {
        color: '#2196F3',
        fontSize: 13,
        fontWeight: '700',
    },
    urgentTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#FFEBEE',
        borderLeftWidth: 3,
        borderLeftColor: '#FF5722',
        borderRadius: 6,
        marginBottom: 8,
    },
    urgentText: {
        fontSize: 12,
        color: '#C62828',
        fontWeight: '600',
    },
    freezerTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#E0F2F1',
        borderLeftWidth: 3,
        borderLeftColor: '#00BCD4',
        borderRadius: 6,
    },
    freezerTagText: {
        fontSize: 12,
        color: '#00695C',
        fontWeight: '600',
        fontWeight: '500',
    },
});

export default NextCustomerCard;
