/**
 * Customer List Item Component
 * 
 * Individual customer card with:
 * - Swipe-to-action gestures (right: Visit, left: Call)
 * - Match score highlighting
 * - Distance and last visit info
 * - Category badge
 * - Completeness score visual
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Image,
  Dimensions,
} from 'react-native';
import { CustomerSearchResult, SwipeAction } from '../../types/customerManagement';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25; // 25% of screen width

interface CustomerListItemProps {
  result: CustomerSearchResult;
  onPress: () => void;
  onSwipeAction: (action: SwipeAction) => void;
}

/**
 * Customer List Item with Swipe Actions
 */
export const CustomerListItem: React.FC<CustomerListItemProps> = ({
  result,
  onPress,
  onSwipeAction,
}) => {
  const { customer, matchScore, matchReasons } = result;

  const swipeX = useRef(new Animated.Value(0)).current;
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal movement
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Limit swipe distance
        const clampedX = Math.max(-SWIPE_THRESHOLD, Math.min(SWIPE_THRESHOLD, gestureState.dx));
        swipeX.setValue(clampedX);
        setSwipeDirection(clampedX > 0 ? 'right' : clampedX < 0 ? 'left' : null);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const threshold = SWIPE_THRESHOLD * 0.5;

        if (gestureState.dx > threshold) {
          // Swiped right - Visit action
          onSwipeAction('VISIT');
          Animated.spring(swipeX, { toValue: 0, useNativeDriver: false }).start();
          setSwipeDirection(null);
        } else if (gestureState.dx < -threshold) {
          // Swiped left - Call action
          onSwipeAction('CALL');
          Animated.spring(swipeX, { toValue: 0, useNativeDriver: false }).start();
          setSwipeDirection(null);
        } else {
          // Snap back
          Animated.spring(swipeX, { toValue: 0, useNativeDriver: false }).start();
          setSwipeDirection(null);
        }
      },
    })
  ).current;

  /**
   * Get background color based on match score
   */
  const getMatchScoreColor = useCallback((score: number): string => {
    if (score >= 90) return '#4CAF50'; // Green
    if (score >= 70) return '#8BC34A'; // Light green
    if (score >= 50) return '#FFC107'; // Amber
    return '#FF9800'; // Orange
  }, []);

  /**
   * Get completeness badge
   */
  const getCompletenessPercentage = useCallback((score?: number): string => {
    if (!score) return '0%';
    return `${score}%`;
  }, []);

  /**
   * Format distance display
   */
  const formatDistance = useCallback((meters?: number): string => {
    if (!meters) return 'Distance unknown';
    if (meters < 1000) return `${Math.round(meters)}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
  }, []);

  const swipeOpacity = swipeX.interpolate({
    inputRange: [-SWIPE_THRESHOLD * 0.5, 0, SWIPE_THRESHOLD * 0.5],
    outputRange: [1, 0.5, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.swipeContainer}>
      {/* Left background - Call action */}
      <View style={styles.swipeActionLeft}>
        <Text style={styles.swipeActionText}>📞 Call</Text>
      </View>

      {/* Right background - Visit action */}
      <View style={styles.swipeActionRight}>
        <Text style={styles.swipeActionText}>✓ Visit</Text>
      </View>

      {/* Main content */}
      <Animated.View
        style={[styles.itemContent, { transform: [{ translateX: swipeX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.item}>
          {/* Customer Photo / Avatar */}
          <View style={styles.avatarContainer}>
            {customer.photoUrl ? (
              <Image
                source={{ uri: customer.photoUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {customer.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {customer.priorityBadge && (
              <View style={[styles.priorityBadge, styles[`priority${customer.priorityBadge}`]]}>
                <Text style={styles.priorityBadgeText}>!</Text>
              </View>
            )}
          </View>

          {/* Main info */}
          <View style={styles.mainInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.customerName} numberOfLines={1}>
                {customer.name}
              </Text>
              {/* Category badge */}
              <View style={[styles.categoryBadge, styles[`category${customer.category}`]]}>
                <Text style={styles.categoryText}>{customer.category}</Text>
              </View>
            </View>

            {/* Owner / Contact info */}
            {customer.ownerName && (
              <Text style={styles.ownerName} numberOfLines={1}>
                Owner: {customer.ownerName}
              </Text>
            )}

            {/* Match score */}
            <View style={styles.matchSection}>
              <View
                style={[
                  styles.matchScoreBadge,
                  { backgroundColor: getMatchScoreColor(matchScore) },
                ]}
              >
                <Text style={styles.matchScoreText}>{Math.round(matchScore)}%</Text>
              </View>
              <Text style={styles.matchReasons} numberOfLines={1}>
                {matchReasons.join(' • ')}
              </Text>
            </View>

            {/* Meta info */}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{formatDistance(customer.distanceMeters)}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{customer.lastVisitRelative}</Text>
            </View>
          </View>

          {/* Completeness score */}
          {customer.completenessScore !== undefined && (
            <View style={styles.completenessSection}>
              <View style={styles.completenessCircle}>
                <Text style={styles.completenessText}>
                  {getCompletenessPercentage(customer.completenessScore)}
                </Text>
              </View>
            </View>
          )}

          {/* Verified badge */}
          {customer.locationVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeIcon}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  swipeContainer: {
    height: 100,
    marginVertical: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
    borderRadius: 8,
  },
  swipeActionLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SWIPE_THRESHOLD,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  swipeActionRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SWIPE_THRESHOLD,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  swipeActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemContent: {
    flex: 1,
    zIndex: 2,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  priorityBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  priorityURGENT: {
    backgroundColor: '#FF1744',
  },
  priorityHIGH: {
    backgroundColor: '#FFA726',
  },
  mainInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  categoryWHOLESALE: {
    backgroundColor: '#E3F2FD',
  },
  categoryRETAIL: {
    backgroundColor: '#F3E5F5',
  },
  categoryKEY_ACCOUNT: {
    backgroundColor: '#FFF3E0',
  },
  categoryDISTRIBUTOR: {
    backgroundColor: '#E8F5E9',
  },
  categoryOTHER: {
    backgroundColor: '#ECEFF1',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#555',
  },
  ownerName: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  matchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  matchScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 38,
  },
  matchScoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  matchReasons: {
    fontSize: 10,
    color: '#666',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#999',
  },
  metaDot: {
    color: '#ccc',
  },
  completenessSection: {
    marginLeft: 8,
    marginRight: 8,
  },
  completenessCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  completenessText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  verifiedBadgeIcon: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CustomerListItem;
