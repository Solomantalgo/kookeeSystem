import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useVisitWorkflow } from '../contexts/VisitWorkflowContext';
import { VisitProgressHeader } from './visit/VisitProgressHeader';
import { PhotoCaptureButton } from './visit/PhotoCaptureButton';
import { VisitCompletionSummary } from './visit/VisitCompletionSummary';
import { ImageCompressionService, MediaMetadata } from '../services/ImageCompressionService';
import { FormValidator, getFormSchemaByCustomerType } from '../services/FormValidationService';
import { localPersistenceService } from '../services/LocalPersistenceService';
import { uploadManager } from '../services/ChunkBasedUploadManager';
import { voiceToTextService } from '../services/VoiceToTextService';

interface VisitScreenProps {
  route: {
    params: {
      customerId: string;
      routeId: string;
      customerType: string;
      location: { latitude: number; longitude: number };
      userId: string;
    };
  };
}

export const VisitScreen: React.FC<any> = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { visitContext, updateFormField, markTaskComplete, addPhoto, handleCheckOut, updateFormData } =
    useVisitWorkflow();

  const { customerId, routeId, customerType, location, userId } = route.params;

  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<
    Array<{ uri: string; metadata: MediaMetadata }>
  >([]);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Auto-save draft when form changes
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      if (visitContext.currentVisit && Object.keys(formData).length > 0) {
        try {
          await localPersistenceService.saveDraftVisit({
            ...visitContext.currentVisit,
            formData,
          });
        } catch (error) {
          console.error('Failed to auto-save draft:', error);
        }
      }
    }, 5000); // Auto-save every 5 seconds

    return () => clearInterval(saveInterval);
  }, [visitContext, formData]);

  // Handle form field change with real-time validation
  const handleFormFieldChange = useCallback(
    (fieldName: string, value: any) => {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));
      updateFormData({ [fieldName]: value });

      // Real-time validation
      const schema = getFormSchemaByCustomerType(customerType);
      const error = FormValidator.validateField(fieldName, value, schema);

      if (error) {
        setFormErrors((prev) => ({ ...prev, [fieldName]: error }));
      } else {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    },
    [customerType, updateFormData]
  );

  // Handle photo capture
  const handlePhotoCapture = useCallback(
    async (photoPath: string, metadata: MediaMetadata) => {
      try {
        setIsLoading(true);

        // Add to local state
        setCapturedPhotos((prev) => [...prev, { uri: photoPath, metadata }]);
        addPhoto(metadata.visitId || `photo_${Date.now()}`);

        // Save metadata to local persistence
        await localPersistenceService.savePhotoMetadata(
          metadata.visitId || `photo_${Date.now()}`,
          visitContext.currentVisit?.visitId || '',
          customerId,
          photoPath,
          metadata
        );

        // Queue for upload
        const photoId = metadata.visitId || `photo_${Date.now()}`;
        uploadManager.queueUpload(photoId, photoPath, metadata);

        // Track upload progress
        uploadManager.onProgress(photoId, (progress) => {
          console.log(`Photo ${photoId} upload: ${progress.percentage}%`);
        });

        // Mark task as complete
        markTaskComplete('photo-capture');

        Alert.alert('Success', 'Photo captured and queued for upload!');
      } catch (error) {
        console.error('Photo capture error:', error);
        Alert.alert('Error', `Failed to process photo: ${error}`);
      } finally {
        setIsLoading(false);
      }
    },
    [customerId, visitContext, addPhoto, markTaskComplete]
  );

  // Handle audio note
  const handleStartAudioNote = useCallback(async () => {
    if (isRecordingAudio) {
      // Stop recording
      voiceToTextService.stopRecording();
      setIsRecordingAudio(false);
      markTaskComplete('audio-note');
    } else {
      // Start recording
      setIsRecordingAudio(true);
      try {
        await voiceToTextService.startRecording(
          visitContext.currentVisit?.visitId || '',
          customerId,
          (transcription) => {
            handleFormFieldChange('voiceNote', transcription);
            Alert.alert('Transcription', transcription);
          },
          (error) => {
            Alert.alert('Recording Error', error);
            setIsRecordingAudio(false);
          }
        );
      } catch (error) {
        Alert.alert('Error', `Failed to start recording: ${error}`);
        setIsRecordingAudio(false);
      }
    }
  }, [isRecordingAudio, customerId, visitContext, handleFormFieldChange, markTaskComplete]);

  // Handle checkout
  const handleCheckOutPress = useCallback(async () => {
    try {
      setIsLoading(true);

      // Validate all mandatory fields
      const schema = getFormSchemaByCustomerType(customerType);
      const validation = FormValidator.validateForm(formData, schema);

      if (!validation.valid) {
        const errorMessages = Object.values(validation.errors).join('\n');
        Alert.alert('Validation Error', errorMessages);
        setFormErrors(validation.errors);
        return;
      }

      // Check if geofence is within bounds (simplified check)
      const distanceFromExpected = 0; // Would calculate actual distance here
      if (distanceFromExpected > 50) {
        Alert.alert(
          'Location Issue',
          'You are outside the expected location. Are you sure you want to check out?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Confirm',
              onPress: async () => {
                await completeCheckout();
              },
            },
          ]
        );
      } else {
        await completeCheckout();
      }
    } catch (error) {
      Alert.alert('Error', `Checkout failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [formData, customerType]);

  const completeCheckout = async () => {
    try {
      // Final save to persistence
      await localPersistenceService.saveDraftVisit({
        ...visitContext.currentVisit!,
        formData,
      });

      // Perform checkout
      handleCheckOut(customerType, location, undefined);

      // Show completion summary
      navigation.navigate('VisitSummary', {
        visit: visitContext.currentVisit,
        nextCustomerETA: '15 mins',
      });
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  };

  // Show completion summary if already checked out
  if (visitContext.currentVisit?.status === 'checked-out') {
    return (
      <VisitCompletionSummary
        visit={visitContext.currentVisit}
        nextCustomerETA="15 mins"
        onNavigateToNext={() => navigation.navigate('Navigation')}
        onStartNewRoute={() => navigation.navigate('Dashboard')}
        isLoading={isLoading}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Visit Progress Header */}
        <VisitProgressHeader onCheckOut={handleCheckOutPress} isCheckOutDisabled={isLoading} />

        {/* Main Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Visit Details</Text>

          {/* Customer Type Specific Forms */}
          {customerType === 'retail' && (
            <>
              {/* Stock Audit Form */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Stock Audit (SKU)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter SKU"
                  value={formData.sku || ''}
                  onChangeText={(text) => handleFormFieldChange('sku', text)}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter quantity"
                  keyboardType="number-pad"
                  value={formData.quantity?.toString() || ''}
                  onChangeText={(text) => handleFormFieldChange('quantity', parseInt(text, 10))}
                  editable={!isLoading}
                />
                {formErrors.quantity && (
                  <Text style={styles.errorText}>{formErrors.quantity}</Text>
                )}
              </View>

              {/* Brand Presence */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Display Quality (1-5)</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingButton,
                        formData.displayQuality === rating && styles.ratingButtonActive,
                      ]}
                      onPress={() => handleFormFieldChange('displayQuality', rating)}
                      disabled={isLoading}
                    >
                      <MaterialIcons
                        name="star"
                        size={24}
                        color={formData.displayQuality === rating ? '#FFC107' : '#DDD'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Field Intelligence Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add field intelligence notes"
              multiline
              numberOfLines={4}
              value={formData.notes || ''}
              onChangeText={(text) => handleFormFieldChange('notes', text)}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Photo Capture Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo Evidence</Text>
          <PhotoCaptureButton
            customerId={customerId}
            visitId={visitContext.currentVisit?.visitId || ''}
            userId={userId}
            location={location}
            onPhotoCapture={handlePhotoCapture}
            disabled={isLoading}
          />
          <Text style={styles.helperText}>
            {capturedPhotos.length} photo{capturedPhotos.length !== 1 ? 's' : ''} captured
          </Text>
        </View>

        {/* Voice Note Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Notes</Text>
          <TouchableOpacity
            style={[styles.voiceButton, isRecordingAudio && styles.voiceButtonRecording]}
            onPress={handleStartAudioNote}
            disabled={isLoading}
          >
            <MaterialIcons
              name={isRecordingAudio ? 'stop' : 'mic'}
              size={24}
              color={isRecordingAudio ? 'red' : 'white'}
            />
            <Text style={styles.voiceButtonText}>
              {isRecordingAudio ? 'Stop Recording' : 'Start Voice Note'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sticky Check-Out Button */}
      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          style={[styles.checkOutButton, isLoading && styles.disabledButton]}
          onPress={handleCheckOutPress}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialIcons name="check-circle" size={20} color="white" />
              <Text style={styles.checkOutButtonText}>Check Out</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// Placeholder TextInput for React Native
const TextInput = (props: any) => (
  <View style={[styles.nativeInput, props.style]}>
    <Text style={styles.placeholder}>{props.placeholder}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  formSection: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginVertical: 8,
  },
  section: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  nativeInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  placeholder: {
    color: '#999',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  ratingButton: {
    padding: 8,
  },
  ratingButtonActive: {
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  voiceButtonRecording: {
    backgroundColor: '#F44336',
  },
  voiceButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  checkOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  checkOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
});
