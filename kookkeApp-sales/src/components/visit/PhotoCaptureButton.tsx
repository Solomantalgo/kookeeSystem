import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Text,
} from 'react-native';
import { CameraView, Camera, CameraType } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { ImageCompressionService, MediaMetadata } from '../../services/ImageCompressionService';

interface PhotoCaptureButtonProps {
  customerId: string;
  visitId: string;
  userId: string;
  location?: { latitude: number; longitude: number };
  onPhotoCapture: (photoPath: string, metadata: MediaMetadata) => Promise<void>;
  disabled?: boolean;
}

interface CameraState {
  isOpen: boolean;
  isTakingPhoto: boolean;
  isCompressing: boolean;
  permission: boolean | null;
  cameraType: CameraType;
  flash: boolean;
}

export const PhotoCaptureButton: React.FC<PhotoCaptureButtonProps> = ({
  customerId,
  visitId,
  userId,
  location,
  onPhotoCapture,
  disabled = false,
}) => {
  const cameraRef = useRef<CameraView>(null);
  const [cameraState, setCameraState] = useState<CameraState>({
    isOpen: false,
    isTakingPhoto: false,
    isCompressing: false,
    permission: null,
    cameraType: 'back',
    flash: false,
  });

  // Request camera permission on mount
  useEffect(() => {
    const requestPermission = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraState((prev) => ({
        ...prev,
        permission: status === 'granted',
      }));

      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {} },
          ]
        );
      }
    };

    requestPermission();
  }, []);

  const handleOpenCamera = () => {
    if (!cameraState.permission) {
      Alert.alert('Camera Permission', 'Camera permission is required to take photos.');
      return;
    }
    setCameraState((prev) => ({ ...prev, isOpen: true }));
  };

  const handleCloseCamera = () => {
    setCameraState((prev) => ({
      ...prev,
      isOpen: false,
      isTakingPhoto: false,
      isCompressing: false,
    }));
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || cameraState.isTakingPhoto) return;

    setCameraState((prev) => ({ ...prev, isTakingPhoto: true }));

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        exif: true,
      });

      if (!photo) {
        throw new Error('Failed to capture photo');
      }

      // Compress the image
      setCameraState((prev) => ({ ...prev, isCompressing: true }));

      const metadata: Omit<MediaMetadata, 'compressedSize' | 'originalSize'> = {
        gpsLat: location?.latitude || 0,
        gpsLng: location?.longitude || 0,
        timestamp: new Date().toISOString(),
        userId,
        customerId,
        visitId,
        originalFileName: `${customerId}_${visitId}_${Date.now()}.jpg`,
      };

      const compressedResult = await ImageCompressionService.compressImage(photo.uri, metadata);

      // Inject metadata as EXIF
      await ImageCompressionService.injectEXIFData(compressedResult.uri, compressedResult.metadata);

      // Notify parent component
      await onPhotoCapture(compressedResult.uri, compressedResult.metadata);

      // Close camera and reset state
      handleCloseCamera();

      Alert.alert('Success', 'Photo captured and compressed successfully!');
    } catch (error) {
      console.error('Photo capture error:', error);
      Alert.alert('Error', `Failed to capture photo: ${error}`);
      setCameraState((prev) => ({ ...prev, isTakingPhoto: false, isCompressing: false }));
    }
  };

  const handleToggleFlash = () => {
    setCameraState((prev) => ({ ...prev, flash: !prev.flash }));
  };

  const handleToggleCameraType = () => {
    setCameraState((prev) => ({
      ...prev,
      cameraType: prev.cameraType === 'back' ? 'front' : 'back',
    }));
  };

  // Camera UI - Full screen camera modal
  if (cameraState.isOpen) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraState.cameraType}
          flash={cameraState.flash ? 'on' : 'off'}
          enableTorch={cameraState.flash}
        >
          {/* Guideline Overlay */}
          <View style={styles.guidelineContainer}>
            <View style={styles.guidelineBox} />
            <Text style={styles.guidelineText}>Keep subject in frame</Text>
          </View>

          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseCamera}
              disabled={cameraState.isTakingPhoto || cameraState.isCompressing}
            >
              <MaterialIcons name="close" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, cameraState.flash && styles.activeControl]}
              onPress={handleToggleFlash}
              disabled={cameraState.isTakingPhoto || cameraState.isCompressing}
            >
              <MaterialIcons
                name={cameraState.flash ? 'flash-on' : 'flash-off'}
                size={24}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleToggleCameraType}
              disabled={cameraState.isTakingPhoto || cameraState.isCompressing}
            >
              <MaterialIcons name="flip-camera-ios" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {cameraState.isCompressing && (
              <View style={styles.compressionIndicator}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.compressionText}>Compressing...</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.captureButton,
                (cameraState.isTakingPhoto || cameraState.isCompressing) && styles.disabledButton,
              ]}
              onPress={handleTakePhoto}
              disabled={cameraState.isTakingPhoto || cameraState.isCompressing}
            >
              {cameraState.isTakingPhoto ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  // Camera Button
  return (
    <TouchableOpacity
      style={[styles.buttonContainer, disabled && styles.disabledButtonContainer]}
      onPress={handleOpenCamera}
      disabled={disabled || cameraState.permission === false}
    >
      <MaterialIcons name="camera-alt" size={28} color="white" />
      <Text style={styles.buttonText}>Take Photo</Text>
    </TouchableOpacity>
  };

  useEffect(() => {
    // Simulate camera ready state
    setTimeout(() => setCameraReady(true), 500);
  }, []);

  return (
    <div className="photo-capture-button-container">
      <button
        className={`photo-capture-button ${disabled || !cameraReady ? 'disabled' : ''} ${isCapturing ? 'capturing' : ''}`}
        onClick={handlePhotoCapture}
        disabled={disabled || !cameraReady || isCapturing}
        title={disabled ? 'Photo capture is disabled' : 'Tap to capture photo'}
      >
        {isCapturing ? (
          <>
            <span className="capture-icon">⏳</span>
            <span className="button-text">Capturing...</span>
          </>
        ) : (
          <>
            <span className="capture-icon">📷</span>
            <span className="button-text">{label}</span>
          </>
        )}
      </button>

      <style jsx>{`
        .photo-capture-button-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 12px;
        }

        .photo-capture-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          background: linear-gradient(135deg, #ff6f3c 0%, #ff5722 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(255, 87, 34, 0.3);
          min-width: 200px;
        }

        .photo-capture-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 87, 34, 0.4);
          background: linear-gradient(135deg, #ff8153 0%, #ff5722 100%);
        }

        .photo-capture-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(255, 87, 34, 0.3);
        }

        .photo-capture-button.disabled,
        .photo-capture-button:disabled {
          background: linear-gradient(135deg, #ccc 0%, #999 100%);
          color: #666;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
          opacity: 0.6;
        }

        .photo-capture-button.capturing {
          animation: pulse 0.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .capture-icon {
          font-size: 20px;
          display: inline-block;
        }

        .button-text {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default PhotoCaptureButton;
