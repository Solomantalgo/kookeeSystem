import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ProgressOverlayProps {
    routeProgress: number; // 0 to 1
    completedStops: number;
    totalStops: number;
}

const ProgressOverlay: React.FC<ProgressOverlayProps> = ({
    routeProgress,
    completedStops,
    totalStops,
}) => {
    const size = 80;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - routeProgress * circumference;

    return (
        <View style={styles.container}>
            <Svg width={size} height={size}>
                {/* Background Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#E0E0E0"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Progress Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#4CAF50"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>
            <View style={styles.textContainer}>
                <Text style={styles.progressText}>{Math.round(routeProgress * 100)}%</Text>
                <Text style={styles.stopsText}>
                    {completedStops}/{totalStops}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    textContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4CAF50',
    },
    stopsText: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
    },
});

export default ProgressOverlay;
