import React from 'react';
import { Polyline } from 'react-native-maps';

interface RoutePolylineProps {
    coordinates: Array<{ latitude: number; longitude: number }>;
    trafficIntensity?: 'normal' | 'slow' | 'heavy';
}

const RoutePolyline: React.FC<RoutePolylineProps> = ({
    coordinates,
    trafficIntensity = 'normal',
}) => {
    const getStrokeColor = () => {
        switch (trafficIntensity) {
            case 'slow':
                return '#FFC107'; // Yellow
            case 'heavy':
                return '#F44336'; // Red
            default:
                return '#2196F3'; // Blue
        }
    };

    return (
        <Polyline
            coordinates={coordinates}
            strokeColor={getStrokeColor()}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
        />
    );
};

export default RoutePolyline;
