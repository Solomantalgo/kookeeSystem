import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { VisitData } from '../types/visitWorkflow';

interface VisitCompletionSummaryProps {
  visit: VisitData;
  nextCustomerETA?: string;
  onNavigateToNext?: () => void;
  onStartNewRoute?: () => void;
  isLoading?: boolean;
}

export const VisitCompletionSummary: React.FC<VisitCompletionSummaryProps> = ({
  visit,
  nextCustomerETA,
  onNavigateToNext,
  onStartNewRoute,
  isLoading = false,
}) => {
  const duration = visit.totalDuration ? Math.round(visit.totalDuration / 1000 / 60) : 0;
  const photoCount = visit.photoIds?.length || 0;
  const hasStockData = Object.keys(visit.formData).some((key) => key.includes('quantity'));
  const hasNotes = visit.formData.notes || false;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIconContainer}>
            <MaterialIcons name="check-circle" size={80} color="#4CAF50" />
          </View>
          <Text style={styles.successTitle}>Job Well Done!</Text>
          <Text style={styles.successSubtitle}>Visit completed successfully</Text>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <SummaryStatCard
            icon="access-time"
            label="Time Spent"
            value={`${duration} min`}
            color="#2196F3"
          />
          <SummaryStatCard
            icon="camera-alt"
            label="Photos Taken"
            value={photoCount.toString()}
            color="#FF9800"
          />
          <SummaryStatCard
            icon="check"
            label="Tasks Completed"
            value={visit.completedTasks?.length.toString() || '0'}
            color="#4CAF50"
          />
        </View>

        {/* Detailed Accomplishments */}
        <View style={styles.accomplishmentsSection}>
          <Text style={styles.sectionTitle}>Accomplishments</Text>

          {photoCount > 0 && (
            <AccomplishmentItem
              icon="check-circle"
              text={`Captured ${photoCount} high-quality photo${photoCount > 1 ? 's' : ''}`}
            />
          )}

          {hasStockData && (
            <AccomplishmentItem icon="check-circle" text="Completed stock audit" />
          )}

          {hasNotes && <AccomplishmentItem icon="check-circle" text="Added field intelligence notes" />}

          {visit.completedTasks && visit.completedTasks.length > 0 && (
            <AccomplishmentItem
              icon="check-circle"
              text={`Completed ${visit.completedTasks.length} mandatory tasks`}
            />
          )}
        </View>

        {/* Next Customer Card */}
        {nextCustomerETA && (
          <View style={styles.nextCustomerCard}>
            <View style={styles.nextCustomerHeader}>
              <MaterialIcons name="navigation" size={24} color="#2196F3" />
              <Text style={styles.nextCustomerTitle}>Next Stop ETA</Text>
            </View>
            <Text style={styles.etaText}>{nextCustomerETA}</Text>
            <Text style={styles.etaSubtext}>Optimal route calculated</Text>
          </View>
        )}

        {/* Performance Metrics */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>

          <MetricRow
            label="Visit Duration"
            value={`${duration} minutes`}
            icon="schedule"
          />
          <MetricRow
            label="Data Quality"
            value={photoCount > 0 ? 'Excellent' : 'Good'}
            icon="assessment"
          />
          <MetricRow
            label="Geolocation"
            value={`±${Math.round(visit.arrivalGPSAccuracy || 0)}m accuracy`}
            icon="location-on"
          />
        </View>

        {/* Motivation Message */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationText}>
            🎯 Keep up the great work! You're doing an excellent job out in the field.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {onNavigateToNext && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onNavigateToNext}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialIcons name="directions" size={20} color="white" />
                <Text style={styles.buttonText}>Navigate to Next</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {onStartNewRoute && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onStartNewRoute}
            disabled={isLoading}
          >
            <MaterialIcons name="home" size={20} color="#2196F3" />
            <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const SummaryStatCard: React.FC<{
  icon: string;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
      <MaterialIcons name={icon as any} size={32} color={color} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const AccomplishmentItem: React.FC<{
  icon: string;
  text: string;
}> = ({ icon, text }) => (
  <View style={styles.accomplishmentItem}>
    <MaterialIcons name={icon as any} size={20} color="#4CAF50" />
    <Text style={styles.accomplishmentText}>{text}</Text>
  </View>
);

const MetricRow: React.FC<{
  label: string;
  value: string;
  icon: string;
}> = ({ label, value, icon }) => (
  <View style={styles.metricRow}>
    <View style={styles.metricLeft}>
      <MaterialIcons name={icon as any} size={20} color="#666" />
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    paddingBottom: 100,
  },
  successHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#E8F5E9',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#558B2F',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    marginTop: -24,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  accomplishmentsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  accomplishmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
  },
  accomplishmentText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  nextCustomerCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  nextCustomerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextCustomerTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  etaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  etaSubtext: {
    fontSize: 12,
    color: '#999',
  },
  metricsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  motivationCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FBC02D',
  },
  motivationText: {
    fontSize: 14,
    color: '#F57F17',
    fontStyle: 'italic',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
});
