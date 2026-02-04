import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Alert, Linking, Modal, Image } from 'react-native';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { MEDIA_CONFIG } from '../../config/mediaConfig';
import { CompressionEngine } from '../../services/media/CompressionEngine';
import { MetadataService } from '../../services/media/MetadataService';
import { StorageManager } from '../../services/media/StorageManager';
import { MediaFile } from '../../../types/shared/models/photo';

const { width, height } = Dimensions.get('window');

interface PhotoCaptureButtonProps {
    onCaptureComplete: (mediaFile: MediaFile) => void;
    visitId: string;
    customerId: string;
    userId: string;
}

export const PhotoCaptureButton: React.FC<PhotoCaptureButtonProps> = ({
    onCaptureComplete,
    visitId,
    customerId,
    userId
}) => {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isCameraVisible, setIsCameraVisible] = useState(false);
    const [type, setType] = useState(CameraType.back);
    const [flash, setFlash] = useState(FlashMode.off);
    const [isProcessing, setIsProcessing] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const cameraRef = useRef<Camera>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const openCamera = () => {
        if (hasPermission === false) {
            Alert.alert(
                "Camera Permission Required",
                "Please enable camera access in your device settings to take photos.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Settings", onPress: () => Linking.openSettings() }
                ]
            );
            return;
        }
        setIsCameraVisible(true);
    };

    const closeCamera = () => {
        setIsCameraVisible(false);
        setCapturedImage(null);
    };

    const takePicture = async () => {
        if (cameraRef.current && !isProcessing) {
            setIsProcessing(true);
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 1.0, // We compress later manually
                    skipProcessing: true, // Speed up capture
                    exif: true,
                });
                setCapturedImage(photo.uri);
                // Immediately start processing in background (optimistic) or wait? 
                // Requirement: "Immediate Review/Retake/Save loop"
                // So we show review screen effectively by setting capturedImage.
            } catch (error) {
                console.error("Capture failed:", error);
                Alert.alert("Error", "Failed to capture photo.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const confirmPhoto = async () => {
        if (!capturedImage) return;
        setIsProcessing(true);
        try {
            // 1. Compress
            const compressed = await CompressionEngine.processImage(capturedImage);

            // 2. Metadata
            const fileName = MetadataService.generateFileName(customerId);
            // In a real app, we'd get location from LocationService here
            const metadata = MetadataService.createMetadata({
                // latitude: ... 
                deviceModel: Platform.OS + ' ' + Platform.Version
            });

            // 3. Save to pending
            await StorageManager.saveToPending(compressed.uri, fileName);

            // 4. Create MediaFile object
            const mediaObject: MediaFile = {
                localId: fileName, // temporarily using filename as ID or generate UUID
                fileName: fileName,
                mediaType: 'PHOTO',
                uploadStatus: 'PENDING',
                visitId,
                userId,
                customerId,
                metadata: metadata,
                fileSizeBytes: compressed.size,
                isDirty: true,
                versionNumber: 1,
                // ... populate other required BaseEntity fields mockly or properly
                serverId: '', // will be set by backend
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                clientTimestamp: new Date().toISOString(),
                serverTimestamp: new Date().toISOString(),
            };

            onCaptureComplete(mediaObject);
            closeCamera();
        } catch (error) {
            console.error("Processing failed:", error);
            Alert.alert("Error", "Failed to process photo.");
        } finally {
            setIsProcessing(false);
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
    };

    if (hasPermission === null) {
        return <View />; // Loading
    }

    return (
        <>
            <TouchableOpacity style={styles.launchButton} onPress={openCamera}>
                <Ionicons name="camera" size={24} color="white" />
                <Text style={styles.launchButtonText}>Add Photo</Text>
            </TouchableOpacity>

            <Modal visible={isCameraVisible} animationType="slide" onRequestClose={closeCamera}>
                <View style={styles.container}>
                    {capturedImage ? (
                        <View style={styles.previewContainer}>
                            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                            <View style={styles.previewControls}>
                                <TouchableOpacity style={styles.controlButton} onPress={retakePhoto} disabled={isProcessing}>
                                    <Ionicons name="refresh" size={30} color="white" />
                                    <Text style={styles.controlText}>Retake</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.controlButton, styles.saveButton]} onPress={confirmPhoto} disabled={isProcessing}>
                                    <Ionicons name="checkmark" size={30} color="white" />
                                    <Text style={styles.controlText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                            {isProcessing && (
                                <View style={styles.processingOverlay}>
                                    <Text style={styles.processingText}>Processing...</Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <Camera
                            style={styles.camera}
                            type={type}
                            flashMode={flash}
                            ref={cameraRef}
                            ratio="16:9" // Standard consistent ratio
                        >
                            <View style={styles.cameraControls}>
                                <View style={styles.topBar}>
                                    <TouchableOpacity onPress={closeCamera}>
                                        <Ionicons name="close" size={30} color="white" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setFlash(
                                        flash === FlashMode.off ? FlashMode.on :
                                            flash === FlashMode.on ? FlashMode.auto : FlashMode.off
                                    )}>
                                        <Ionicons name={
                                            flash === FlashMode.on ? "flash" :
                                                flash === FlashMode.auto ? "flash-outline" : "flash-off"
                                        } size={30} color="white" />
                                    </TouchableOpacity>
                                </View>

                                {MEDIA_CONFIG.camera.showGuidelines && (
                                    <View style={styles.guidelines}>
                                        <View style={styles.guideBox} />
                                        {MEDIA_CONFIG.camera.showHorizonGuide && (
                                            <View style={styles.horizonLine} />
                                        )}
                                    </View>
                                )}

                                <View style={styles.bottomBar}>
                                    <TouchableOpacity
                                        style={styles.captureButton}
                                        onPress={takePicture}
                                        disabled={isProcessing}
                                    >
                                        <View style={styles.captureinner} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Camera>
                    )}
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    launchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF', // Primary Blue
        padding: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    launchButtonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 8,
    },
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    cameraControls: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'space-between',
        padding: 20,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 40,
    },
    bottomBar: {
        alignItems: 'center',
        marginBottom: 30,
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureinner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
    },
    guidelines: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    guideBox: {
        width: width * 0.7,
        height: height * 0.5,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderStyle: 'dashed',
    },
    horizonLine: {
        position: 'absolute',
        width: width,
        height: 1,
        backgroundColor: 'rgba(255, 255, 0, 0.5)', // Yellowish
        top: height / 2,
    },
    previewContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    previewImage: {
        flex: 1,
        resizeMode: 'contain',
    },
    previewControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: 'black',
    },
    controlButton: {
        alignItems: 'center',
    },
    saveButton: {
        // Highlight save
    },
    controlText: {
        color: 'white',
        marginTop: 5,
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
