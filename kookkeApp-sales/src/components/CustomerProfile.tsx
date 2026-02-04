/**
 * Customer Profile Component
 * 
 * Comprehensive 360-degree customer detail screen with:
 * - Photo header with gradient overlay
 * - Action center (Call, WhatsApp, Maps)
 * - Customer insights timeline (visits, notes, stock history)
 * - Identity data (address, contact, GPS pin)
 * - Geolocation pin correction tool
 * - Quick-floating Check-In button
 * - Completeness score and missing fields
 * 
 * This is the "hub" screen for all customer interactions
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useCustomerManagement } from '../contexts/CustomerManagementContext';
import { SelectedCustomer } from '../../types/customerManagement';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 200;
const FLOATING_BUTTON_OFFSET = 60;

interface CustomerProfileProps {
  customerId: number;
  onCheckIn?: () => void;
  onClose?: () => void;
}

/**
 * Customer Profile Screen
 */
export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  customerId,
  onCheckIn,
  onClose,
}) => {
  const { selectedCustomer, isLoadingCustomers, updateCustomerVerification } =
    useCustomerManagement();

  const [scrollY] = useState(new Animated.Value(0));
  const [showGeolocationTool, setShowGeolocationTool] = useState(false);
  const [showVoiceMemo, setShowVoiceMemo] = useState(false);

  if (isLoadingCustomers || !selectedCustomer) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const { customer, verificationStatus, timeline, actionCenter, dailyNotes } = selectedCustomer;

  /**
   * Handle action center buttons
   */
  const handleCall = useCallback(() => {
    if (actionCenter.callPrimary) {
      Linking.openURL(`tel:${actionCenter.callPrimary.number}`);
    }
  }, [actionCenter]);

  const handleWhatsApp = useCallback(() => {
    if (actionCenter.whatsapp) {
      const url = `whatsapp://send?phone=${actionCenter.whatsapp.number}`;
      Linking.openURL(url).catch(() => {
        // WhatsApp not installed
        console.log('WhatsApp not installed');
      });
    }
  }, [actionCenter]);

  const handleMapsNavigation = useCallback(() => {
    const { googleMapsNavigation } = actionCenter;
    const url = Platform.select({
      ios: `maps://maps.apple.com/?daddr=${googleMapsNavigation.latitude},${googleMapsNavigation.longitude}`,
      android: `geo:${googleMapsNavigation.latitude},${googleMapsNavigation.longitude}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  }, [actionCenter]);

  /**
   * Interpolate header opacity based on scroll
   */
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT / 2],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  /**
   * Memoized missing fields list
   */
  const missingFieldsList = useMemo(() => {
    return verificationStatus.missingFields
      .map(field => {
        const labels: Record<string, string> = {
          phonePrimary: 'Primary phone',
          whatsappNumber: 'WhatsApp number',
          email: 'Email address',
          address: 'Physical address',
          ownerName: 'Owner name',
          latitude: 'GPS coordinates',
          longitude: 'GPS coordinates',
          businessType: 'Business type',
        };
        return labels[field] || field;
      })
      .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
  }, [verificationStatus.missingFields]);

  return (
    <View style={styles.container}>
      {/* Header with Photo */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        {customer.photoUrl ? (
          <Image source={{ uri: customer.photoUrl }} style={styles.headerPhoto} />
        ) : (
          <View style={[styles.headerPhoto, styles.headerPhotoPlaceholder]}>
            <Text style={styles.headerPhotoPlaceholderText}>{customer.name}</Text>
          </View>
        )}
        <View style={styles.headerGradient} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{customer.name}</Text>
          <Text style={styles.headerSubtitle}>{customer.category}</Text>
        </View>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.content}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        {/* Action Center */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {actionCenter.callPrimary && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonCall]}
                onPress={handleCall}
              >
                <Text style={styles.actionButtonIcon}>📞</Text>
                <Text style={styles.actionButtonText}>Call</Text>
                <Text style={styles.actionButtonSubtext}>{actionCenter.callPrimary.number}</Text>
              </TouchableOpacity>
            )}

            {actionCenter.whatsapp && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonWhatsApp]}
                onPress={handleWhatsApp}
              >
                <Text style={styles.actionButtonIcon}>💬</Text>
                <Text style={styles.actionButtonText}>WhatsApp</Text>
                <Text style={styles.actionButtonSubtext}>{actionCenter.whatsapp.number}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonMaps]}
              onPress={handleMapsNavigation}
            >
              <Text style={styles.actionButtonIcon}>🗺️</Text>
              <Text style={styles.actionButtonText}>Navigate</Text>
              <Text style={styles.actionButtonSubtext}>Google Maps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer Identity Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>

          {customer.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{customer.address}</Text>
            </View>
          )}

          {customer.ownerName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Owner</Text>
              <Text style={styles.infoValue}>{customer.ownerName}</Text>
            </View>
          )}

          {customer.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{customer.email}</Text>
            </View>
          )}

          {customer.latitude && customer.longitude && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>GPS Coordinates</Text>
              <View style={styles.gpsInfo}>
                <Text style={styles.infoValue}>
                  {customer.latitude.toFixed(6)}, {customer.longitude.toFixed(6)}
                </Text>
                {verificationStatus.isLocationVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                  </View>
                )}
                {!verificationStatus.isLocationVerified && (
                  <TouchableOpacity
                    style={styles.updatePinButton}
                    onPress={() => setShowGeolocationTool(true)}
                  >
                    <Text style={styles.updatePinButtonText}>Update Pin</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {customer.hasFreezer && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Freezer Status</Text>
              <Text style={styles.infoValue}>{customer.freezerCondition || 'Not assessed'}</Text>
            </View>
          )}
        </View>

        {/* Completeness Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Completeness</Text>
          <View style={styles.completenessBar}>
            <View
              style={[
                styles.completenessBarFill,
                { width: `${customer.completenessScore || 0}%` },
              ]}
            />
          </View>
          <Text style={styles.completenessText}>
            {customer.completenessScore || 0}% complete
          </Text>

          {missingFieldsList.length > 0 && (
            <View style={styles.missingFieldsContainer}>
              <Text style={styles.missingFieldsTitle}>Missing Information:</Text>
              {missingFieldsList.map((field, idx) => (
                <Text key={idx} style={styles.missingFieldItem}>
                  • {field}
                </Text>
              ))}
              <TouchableOpacity style={styles.completeProfileButton}>
                <Text style={styles.completeProfileButtonText}>Complete Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Visit Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visit History</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{actionCenter.visitHistoryCount}</Text>
              <Text style={styles.statLabel}>Total Visits</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{verificationStatus.photoCount}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{dailyNotes.length}</Text>
              <Text style={styles.statLabel}>Notes</Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Timeline</Text>
          {timeline.length === 0 ? (
            <Text style={styles.emptyTimeline}>No activity yet</Text>
          ) : (
            timeline.slice(0, 5).map((entry) => (
              <View key={entry.id} style={styles.timelineEntry}>
                <Text style={styles.timelineIcon}>{entry.icon}</Text>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{entry.title}</Text>
                  <Text style={styles.timelineTime}>
                    {entry.timestamp.toLocaleDateString()}{' '}
                    {entry.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {entry.description && (
                    <Text style={styles.timelineDescription} numberOfLines={2}>
                      {entry.description}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Daily Notes */}
        {dailyNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team Notes</Text>
            {dailyNotes.map((note, idx) => (
              <View key={idx} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <Text style={styles.noteAuthor}>{note.recordedByUserName}</Text>
                  <Text style={styles.noteDate}>
                    {note.recordedAt.toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.noteContent}>{note.content}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Spacer for floating button */}
        <View style={{ height: FLOATING_BUTTON_OFFSET }} />
      </Animated.ScrollView>

      {/* Floating Check-In Button */}
      <TouchableOpacity
        style={styles.floatingCheckInButton}
        onPress={onCheckIn}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingCheckInButtonIcon}>✓</Text>
        <Text style={styles.floatingCheckInButtonText}>Check-In</Text>
      </TouchableOpacity>

      {/* Close Button */}
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    overflow: 'hidden',
  },
  headerPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerPhotoPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPhotoPlaceholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  headerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonCall: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonWhatsApp: {
    backgroundColor: '#25D366',
  },
  actionButtonMaps: {
    backgroundColor: '#4285F4',
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtonSubtext: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  gpsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
  },
  verifiedBadgeText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
  updatePinButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF3E0',
    borderRadius: 4,
  },
  updatePinButtonText: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '600',
  },
  completenessBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  completenessBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  completenessText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  missingFieldsContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  missingFieldsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  missingFieldItem: {
    fontSize: 12,
    color: '#E65100',
    marginBottom: 4,
  },
  completeProfileButton: {
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: '#E65100',
    borderRadius: 6,
    alignItems: 'center',
  },
  completeProfileButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyTimeline: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
  timelineEntry: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timelineIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  timelineTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  timelineDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  noteCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  noteDate: {
    fontSize: 11,
    color: '#999',
  },
  noteContent: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  floatingCheckInButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCheckInButtonIcon: {
    fontSize: 20,
    color: '#fff',
  },
  floatingCheckInButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CustomerProfile;
