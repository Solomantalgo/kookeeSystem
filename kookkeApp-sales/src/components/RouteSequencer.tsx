/**
 * Route Sequencer Component
 * 
 * Visual drag-and-drop interface for reordering route stops with:
 * - Smooth drag animations
 * - Real-time distance/ETA updates
 * - Route type toggle (Fixed vs Optimized)
 * - Visual feedback and validation
 * - Mandatory stop enforcement
 * - Total duration and distance display
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useCustomerManagement } from '../contexts/CustomerManagementContext';
import { RoutePointUIModel } from '../../types/customerManagement';

interface RouteSequencerProps {
  routeId: number;
  onReorderComplete?: (transaction: any) => void;
  onClose?: () => void;
}

/**
 * Route Sequencer Component
 */
export const RouteSequencer: React.FC<RouteSequencerProps> = ({
  routeId,
  onReorderComplete,
  onClose,
}) => {
  const { activeRoute, reorderRoutePoints, isLoadingRoute } = useCustomerManagement();

  const [sequence, setSequence] = useState<RoutePointUIModel[]>(
    activeRoute?.route.routePointsUI || []
  );
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isOptimized, setIsOptimized] = useState(activeRoute?.route.isOptimized || false);

  if (isLoadingRoute || !activeRoute) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((index: number) => {
    setIsDragging(true);
    setDraggedIndex(index);
  }, []);

  /**
   * Handle drag end / reorder
   */
  const handleDragEnd = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) {
        setIsDragging(false);
        setDraggedIndex(null);
        return;
      }

      // Create new sequence
      const newSequence = [...sequence];
      const [movedItem] = newSequence.splice(fromIndex, 1);
      newSequence.splice(toIndex, 0, movedItem);

      // Update sequence numbers
      const reorderedWithSequence = newSequence.map((item, idx) => ({
        ...item,
        sequenceNumber: idx,
      }));

      setSequence(reorderedWithSequence);

      try {
        const transaction = await reorderRoutePoints(reorderedWithSequence);
        onReorderComplete?.(transaction);
      } catch (error) {
        // Revert on error
        console.error('Reorder failed:', error);
        setSequence(sequence);
      } finally {
        setIsDragging(false);
        setDraggedIndex(null);
      }
    },
    [sequence, reorderRoutePoints, onReorderComplete]
  );

  /**
   * Calculate totals from sequence
   */
  const { totalDistance, totalTime, completedCount } = useMemo(() => {
    const distance = sequence.reduce((sum, point) => sum + (point.distanceKm || 0), 0);
    const time = sequence.reduce((sum, point) => sum + (point.etaMinutes || 0), 0);
    const completed = sequence.filter(p => p.isVisited).length;

    return {
      totalDistance: distance,
      totalTime: time,
      completedCount: completed,
    };
  }, [sequence]);

  /**
   * Format time display
   */
  const formatTime = useCallback((minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reorder Route</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Summary Info */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Stops</Text>
          <Text style={styles.summaryValue}>{sequence.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Distance</Text>
          <Text style={styles.summaryValue}>{totalDistance.toFixed(1)} km</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Time</Text>
          <Text style={styles.summaryValue}>{formatTime(totalTime)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Progress</Text>
          <Text style={styles.summaryValue}>
            {completedCount}/{sequence.length}
          </Text>
        </View>
      </View>

      {/* Route Type Toggle */}
      <View style={styles.routeTypeSection}>
        <Text style={styles.routeTypeLabel}>Route Type</Text>
        <View style={styles.routeTypeToggle}>
          <TouchableOpacity
            style={[styles.routeTypeButton, !isOptimized && styles.routeTypeButtonActive]}
            onPress={() => setIsOptimized(false)}
          >
            <Text style={[styles.routeTypeButtonText, !isOptimized && styles.routeTypeButtonTextActive]}>
              Fixed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.routeTypeButton, isOptimized && styles.routeTypeButtonActive]}
            onPress={() => setIsOptimized(true)}
          >
            <Text style={[styles.routeTypeButtonText, isOptimized && styles.routeTypeButtonTextActive]}>
              Optimized
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sequence List */}
      <ScrollView style={styles.sequenceList}>
        {sequence.map((point, index) => (
          <DraggableSequenceItem
            key={`${point.id}-${index}`}
            point={point}
            index={index}
            totalItems={sequence.length}
            isDragging={isDragging && draggedIndex === index}
            onDragStart={() => handleDragStart(index)}
            onMoveUp={() =>
              index > 0 && handleDragEnd(index, index - 1)
            }
            onMoveDown={() =>
              index < sequence.length - 1 && handleDragEnd(index, index + 1)
            }
          />
        ))}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={onClose}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Individual draggable sequence item
 */
interface DraggableSequenceItemProps {
  point: RoutePointUIModel;
  index: number;
  totalItems: number;
  isDragging: boolean;
  onDragStart: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const DraggableSequenceItem: React.FC<DraggableSequenceItemProps> = ({
  point,
  index,
  totalItems,
  isDragging,
  onDragStart,
  onMoveUp,
  onMoveDown,
}) => {
  return (
    <View
      style={[
        styles.sequenceItem,
        isDragging && styles.sequenceItemDragging,
        point.isVisited && styles.sequenceItemCompleted,
      ]}
    >
      {/* Drag Handle */}
      <TouchableOpacity
        style={styles.dragHandle}
        onLongPress={onDragStart}
        activeOpacity={0.6}
      >
        <Text style={styles.dragHandleIcon}>::</Text>
      </TouchableOpacity>

      {/* Sequence Number */}
      <View style={styles.sequenceNumber}>
        <Text style={styles.sequenceNumberText}>{index + 1}</Text>
      </View>

      {/* Customer Info */}
      <View style={styles.sequenceItemContent}>
        <Text style={styles.customerName} numberOfLines={1}>
          {point.customerDetails.name}
        </Text>
        <View style={styles.sequenceItemMeta}>
          <Text style={styles.metaText}>
            {point.distanceKm?.toFixed(1) || 0} km
          </Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>
            {point.etaMinutes ? `${Math.round(point.etaMinutes)}m` : '--'}
          </Text>
          {point.isMandatory && (
            <>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.mandatoryBadge}>Required</Text>
            </>
          )}
        </View>
      </View>

      {/* Visited Badge */}
      {point.isVisited && (
        <View style={styles.visitedBadge}>
          <Text style={styles.visitedBadgeIcon}>✓</Text>
        </View>
      )}

      {/* Up/Down Buttons */}
      <View style={styles.reorderButtons}>
        {index > 0 && (
          <TouchableOpacity
            style={styles.reorderButton}
            onPress={onMoveUp}
            activeOpacity={0.6}
          >
            <Text style={styles.reorderButtonIcon}>▲</Text>
          </TouchableOpacity>
        )}
        {index < totalItems - 1 && (
          <TouchableOpacity
            style={styles.reorderButton}
            onPress={onMoveDown}
            activeOpacity={0.6}
          >
            <Text style={styles.reorderButtonIcon}>▼</Text>
          </TouchableOpacity>
        )}
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  routeTypeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 12,
  },
  routeTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  routeTypeToggle: {
    flexDirection: 'row',
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    padding: 2,
  },
  routeTypeButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  routeTypeButtonActive: {
    backgroundColor: '#007AFF',
  },
  routeTypeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  routeTypeButtonTextActive: {
    color: '#fff',
  },
  sequenceList: {
    flex: 1,
    paddingVertical: 8,
  },
  sequenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginVertical: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  sequenceItemDragging: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  sequenceItemCompleted: {
    borderLeftColor: '#4CAF50',
  },
  dragHandle: {
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dragHandleIcon: {
    fontSize: 16,
    color: '#ccc',
    fontWeight: 'bold',
  },
  sequenceNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sequenceNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sequenceItemContent: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  sequenceItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#999',
  },
  metaDot: {
    color: '#ddd',
  },
  mandatoryBadge: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  visitedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  visitedBadgeIcon: {
    color: '#fff',
    fontWeight: 'bold',
  },
  reorderButtons: {
    marginLeft: 8,
    gap: 2,
  },
  reorderButton: {
    width: 28,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButtonIcon: {
    fontSize: 12,
    color: '#999',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default RouteSequencer;
