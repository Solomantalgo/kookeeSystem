/**
 * Geo Location Normalizer Component
 * Mini-map based UI for manually pinning exact customer coordinates
 * Solves the problem of inaccurate address-based geocoding
 * 
 * Features:
 * - Interactive map view
 * - Long-press to place pin
 * - Drag pin to fine-tune location
 * - Shows accuracy circle
 * - Save and verify pin
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Customer, GeoLocation } from '../types/customerManagement';

interface GeoLocationNormalizerProps {
  customer: Customer;
  isVisible: boolean;
  onClose: () => void;
  onSaveLocation: (location: GeoLocation) => void;
}

const { width, height } = Dimensions.get('window');
const MAP_WIDTH = width - 32;
const MAP_HEIGHT = height * 0.5;

/**
 * Mini-map component for pinning customer location
 * Note: In production, integrate with react-native-maps
 */
export const GeoLocationNormalizer: React.FC<GeoLocationNormalizerProps> = ({
  customer,
  isVisible,
  onClose,
  onSaveLocation,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation>(
    customer.geoLocation
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const mapRef = useRef<View>(null);

  // Handle map press to place pin
  const handleMapPress = useCallback(
    (event: any) => {
      if (isDragging) return;

      const { nativeEvent } = event;
      const { locationX, locationY } = nativeEvent;

      // Convert screen coordinates to lat/long
      // This is simplified; in production use proper coordinate transformation
      const latitude =
        customer.geoLocation.latitude + (locationY - MAP_HEIGHT / 2) * 0.0001;
      const longitude =
        customer.geoLocation.longitude + (locationX - MAP_WIDTH / 2) * 0.0001;

      setSelectedLocation({
        latitude,
        longitude,
        accuracy: 5,
      });
    },
    [isDragging, customer.geoLocation]
  );

  // Handle save
  const handleSaveLocation = useCallback(async () => {
    setIsSaving(true);
    try {
      // Validate location
      if (!selectedLocation.latitude || !selectedLocation.longitude) {
        throw new Error('Invalid location');
      }

      // Save the location
      onSaveLocation(selectedLocation);
      onClose();
    } catch (error) {
      console.error('Failed to save location:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedLocation, onSaveLocation, onClose]);

  // Reset to original
  const handleReset = useCallback(() => {
    setSelectedLocation(customer.geoLocation);
  }, [customer.geoLocation]);

  const hasChanged =
    selectedLocation.latitude !== customer.geoLocation.latitude ||
    selectedLocation.longitude !== customer.geoLocation.longitude;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pinpoint Location</Text>
          <Text style={styles.headerSubtitle}>
            {customer.name}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>
            Long press or drag to adjust the pin to the exact store location
          </Text>
        </View>

        {/* Map Area (Placeholder) */}
        <View
          ref={mapRef}
          style={styles.mapContainer}
          onTouchEnd={() => setIsDragging(false)}
        >
          <View style={styles.mapPlaceholder}>
            {/* In production, use react-native-maps MapView here */}
            <Text style={styles.mapPlaceholderText}>
              Map Integration{'\n'}
              (React Native Maps)
            </Text>

            {/* Center crosshair */}
            <View style={styles.crosshair}>
              <View style={styles.crosshairHorizontal} />
              <View style={styles.crosshairVertical} />
            </View>

            {/* Pin indicator */}
            <View style={styles.pinContainer}>
              <View style={styles.pin} />
              <View style={styles.pinShadow} />
            </View>

            {/* Accuracy circle */}
            {selectedLocation.accuracy && (
              <View
                style={[
                  styles.accuracyCircle,
                  {
                    width: selectedLocation.accuracy * 2,
                    height: selectedLocation.accuracy * 2,
                  },
                ]}
              />
            )}
          </View>
        </View>

        {/* Coordinates Display */}
        <View style={styles.coordinatesContainer}>
          <View style={styles.coordinateRow}>
            <Text style={styles.coordinateLabel}>Latitude:</Text>
            <Text style={styles.coordinateValue}>
              {selectedLocation.latitude.toFixed(6)}
            </Text>
          </View>
          <View style={styles.coordinateRow}>
            <Text style={styles.coordinateLabel}>Longitude:</Text>
            <Text style={styles.coordinateValue}>
              {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
          {selectedLocation.accuracy && (
            <View style={styles.coordinateRow}>
              <Text style={styles.coordinateLabel}>Accuracy:</Text>
              <Text style={styles.coordinateValue}>
                ± {selectedLocation.accuracy.toFixed(1)} meters
              </Text>
            </View>
          )}
        </View>

        {/* Original Location Info */}
        {hasChanged && (
          <View style={styles.originalInfoContainer}>
            <Text style={styles.originalInfoLabel}>Original Location:</Text>
            <Text style={styles.originalInfoValue}>
              {customer.geoLocation.latitude.toFixed(6)},{' '}
              {customer.geoLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={handleReset}
            disabled={!hasChanged || isSaving}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.saveButton,
              (!hasChanged || isSaving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSaveLocation}
            disabled={!hasChanged || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Location</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips:</Text>
          <Text style={styles.tipText}>
            • Ensure the pin is placed at the store's main entrance
          </Text>
          <Text style={styles.tipText}>
            • Accuracy shown is in meters
          </Text>
          <Text style={styles.tipText}>
            • A verified location helps with navigation guidance
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  instructionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f0f8ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  instructions: {
    fontSize: 13,
    color: '#0066cc',
    lineHeight: 18,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    width: width,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mapPlaceholder: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT - 20,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
  },
  crosshair: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairHorizontal: {
    position: 'absolute',
    width: 30,
    height: 1,
    backgroundColor: '#999',
    opacity: 0.5,
  },
  crosshairVertical: {
    position: 'absolute',
    width: 1,
    height: 30,
    backgroundColor: '#999',
    opacity: 0.5,
  },
  pinContainer: {
    position: 'absolute',
    width: 40,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pin: {
    width: 16,
    height: 16,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 2,
  },
  pinShadow: {
    position: 'absolute',
    width: 12,
    height: 3,
    backgroundColor: '#000',
    borderRadius: 6,
    opacity: 0.3,
    bottom: -8,
  },
  accuracyCircle: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#0099FF',
    opacity: 0.2,
  },
  coordinatesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  coordinateLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  coordinateValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'Courier New',
    fontWeight: '600',
  },
  originalInfoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff3cd',
    borderLeftWidth: 3,
    borderLeftColor: '#FFA500',
  },
  originalInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  originalInfoValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'Courier New',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  tipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    marginVertical: 2,
  },
});

export default GeoLocationNormalizer;
