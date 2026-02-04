/**
 * Customer UI Service
 * Handles all customer-related data transformations and business logic:
 * - Filtering and sorting customers
 * - Computing verification status
 * - Building customer timeline
 * - Finding nearby leads
 * - Advanced search and filtering
 */

import { Customer, VisitNote, GeoLocation } from '../../types/customerManagement';
import { calculateHaversineDistance, estimateTravelTime, formatDistance, formatDuration } from './utils/geospatialUtils';

export interface CustomerFilterOptions {
  category?: string;
  searchQuery?: string;
  includeVisited?: boolean;
  excludeArchived?: boolean;
}

export interface CustomerSortOptions {
  sortBy: 'name' | 'distance' | 'priority' | 'lastVisit' | 'category';
  sortOrder: 'asc' | 'desc';
  userLocation?: GeoLocation;
}

export class CustomerUIService {
  /**
   * Filter customers based on options
   */
  filterCustomers(
    customers: Customer[],
    options: CustomerFilterOptions
  ): Customer[] {
    let filtered = [...customers];

    // Category filter
    if (options.category && options.category !== 'All') {
      filtered = filtered.filter((c) => c.category === options.category);
    }

    // Archive filter
    if (options.excludeArchived !== false) {
      filtered = filtered.filter((c) => !c.isArchived);
    }

    // Search query filter (basic string matching)
    if (options.searchQuery && options.searchQuery.trim()) {
      const query = options.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.address.toLowerCase().includes(query) ||
          c.phoneNumber?.toLowerCase().includes(query)
      );
    }

    // Visit status filter
    if (options.includeVisited === false) {
      filtered = filtered.filter((c) => !c.lastVisitDate);
    }

    return filtered;
  }

  /**
   * Sort customers based on criteria
   */
  sortCustomers(
    customers: Customer[],
    options: CustomerSortOptions
  ): Customer[] {
    const sorted = [...customers];

    switch (options.sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;

      case 'distance':
        if (!options.userLocation) {
          throw new Error('User location required for distance sorting');
        }
        sorted.sort((a, b) => {
          const distA = calculateHaversineDistance(
            options.userLocation!,
            a.geoLocation
          );
          const distB = calculateHaversineDistance(
            options.userLocation!,
            b.geoLocation
          );
          return distA - distB;
        });
        break;

      case 'priority':
        sorted.sort((a, b) => {
          const aPriority = a.isPriority ? 1 : 0;
          const bPriority = b.isPriority ? 1 : 0;
          return bPriority - aPriority; // Higher priority first
        });
        break;

      case 'lastVisit':
        sorted.sort((a, b) => {
          const aDate = a.lastVisitDate || 0;
          const bDate = b.lastVisitDate || 0;
          return bDate - aDate; // Most recent first
        });
        break;

      case 'category':
        sorted.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }

    // Apply sort order
    if (options.sortOrder === 'desc') {
      sorted.reverse();
    }

    return sorted;
  }

  /**
   * Calculate distance from user to customer
   */
  calculateDistanceFromUser(
    customer: Customer,
    userLocation: GeoLocation
  ): { value: number; formatted: string } {
    const distance = calculateHaversineDistance(userLocation, customer.geoLocation);
    return {
      value: distance,
      formatted: formatDistance(distance),
    };
  }

  /**
   * Calculate estimated time to reach customer
   */
  calculateETA(
    customer: Customer,
    userLocation: GeoLocation
  ): { minutes: number; formatted: string } {
    const distance = calculateHaversineDistance(userLocation, customer.geoLocation);
    const minutes = estimateTravelTime(distance);
    return {
      minutes,
      formatted: formatDuration(minutes),
    };
  }

  /**
   * Build customer timeline from visits and notes
   */
  buildTimeline(customer: Customer): TimelineEntry[] {
    const entries: TimelineEntry[] = [];

    // Add visit notes in reverse chronological order
    if (customer.visitHistory) {
      customer.visitHistory.forEach((note) => {
        entries.push({
          id: note.id,
          type: 'note',
          timestamp: note.timestamp,
          content: note.content,
          author: note.authorName,
          isVoiceMemo: note.type === 'voice_memo',
          voiceMemoUrl: note.voiceMemoUrl,
        });
      });
    }

    // Add stock history events
    if (customer.stockHistory) {
      customer.stockHistory.forEach((stock) => {
        entries.push({
          id: `stock-${stock.timestamp}`,
          type: 'stock',
          timestamp: stock.timestamp,
          content: `${stock.productName}: ${stock.quantity} ${stock.unitOfMeasure}`,
          author: 'Stock Audit',
        });
      });
    }

    // Sort by timestamp, most recent first
    entries.sort((a, b) => b.timestamp - a.timestamp);

    return entries;
  }

  /**
   * Format relative time (e.g., "2 days ago")
   */
  formatRelativeTime(timestamp: number | undefined): string {
    if (!timestamp) return 'Never';

    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 4) return `${weeks}w ago`;
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  }

  /**
   * Calculate completeness score for a customer profile (0-100)
   */
  calculateCompletenessScore(customer: Customer): number {
    let score = 0;
    let totalFields = 0;

    // Name (required)
    if (customer.name) score += 20;
    totalFields += 20;

    // Location (required)
    if (customer.geoLocation) score += 20;
    totalFields += 20;

    // Contact info
    if (customer.phoneNumber) score += 15;
    totalFields += 15;

    // Address
    if (customer.address) score += 15;
    totalFields += 15;

    // Photos
    if (customer.storefrontPhotos && customer.storefrontPhotos.length > 0) score += 10;
    totalFields += 10;

    // Notes
    if (customer.locationNotes) score += 5;
    totalFields += 5;

    return Math.round((score / totalFields) * 100);
  }

  /**
   * Get action center data (call, whatsapp, navigate)
   */
  getActionCenterData(
    customer: Customer,
    userLocation?: GeoLocation
  ): ActionCenterData {
    return {
      canCall: !!customer.phoneNumber,
      canWhatsapp: !!customer.whatsappNumber,
      canNavigate: !!customer.geoLocation,
      distance: userLocation
        ? this.calculateDistanceFromUser(customer, userLocation)
        : undefined,
      eta: userLocation
        ? this.calculateETA(customer, userLocation)
        : undefined,
    };
  }

  /**
   * Get nearby customers within a radius
   */
  getNearbyCustomers(
    customers: Customer[],
    centerLocation: GeoLocation,
    radiusMeters: number = 5000
  ): Customer[] {
    return customers.filter((customer) => {
      const distance = calculateHaversineDistance(
        centerLocation,
        customer.geoLocation
      );
      return distance <= radiusMeters;
    });
  }

  /**
   * Group customers by category
   */
  groupByCategory(customers: Customer[]): Map<string, Customer[]> {
    const grouped = new Map<string, Customer[]>();

    customers.forEach((customer) => {
      if (!grouped.has(customer.category)) {
        grouped.set(customer.category, []);
      }
      grouped.get(customer.category)!.push(customer);
    });

    return grouped;
  }

  /**
   * Format customer for display
   */
  formatCustomerForDisplay(customer: Customer): FormattedCustomer {
    return {
      ...customer,
      displayName: customer.name,
      displayCategory: this.formatCategory(customer.category),
      completenessScore: this.calculateCompletenessScore(customer),
      hasPhotos: customer.storefrontPhotos && customer.storefrontPhotos.length > 0,
      hasNotes: !!customer.locationNotes,
      lastVisitText: customer.lastVisitDate
        ? this.formatRelativeTime(customer.lastVisitDate)
        : 'Never visited',
    };
  }

  /**
   * Format category for display
   */
  private formatCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      wholesale: 'Wholesale',
      retail: 'Retail',
      key_account: 'Key Account',
      lead: 'Lead',
    };
    return categoryMap[category] || category;
  }

  /**
   * Calculate customer priority badge
   */
  getPriorityBadge(customer: Customer): PriorityBadge | undefined {
    if (customer.isPriority) {
      return {
        label: 'Priority',
        color: '#FF4444',
        icon: 'star',
      };
    }

    // Check if overdue for visit
    if (customer.lastVisitDate) {
      const daysSinceVisit = (Date.now() - customer.lastVisitDate) / (1000 * 60 * 60 * 24);
      if (daysSinceVisit > 30) {
        return {
          label: 'Overdue',
          color: '#FFA500',
          icon: 'alert',
        };
      }
    }

    return undefined;
  }

  /**
   * Check if customer needs verification
   */
  needsVerification(customer: Customer): boolean {
    return customer.verificationStatus === 'unverified';
  }

  /**
   * Get verification status text
   */
  getVerificationStatusText(customer: Customer): string {
    const statusMap: Record<string, string> = {
      unverified: 'Unverified',
      gps_verified: 'GPS Verified',
      manual_pin: 'Manually Pinned',
      pending: 'Pending Verification',
    };
    return statusMap[customer.verificationStatus] || 'Unknown';
  }
}

// Type definitions
export interface TimelineEntry {
  id: string;
  type: 'note' | 'stock' | 'visit';
  timestamp: number;
  content: string;
  author: string;
  isVoiceMemo?: boolean;
  voiceMemoUrl?: string;
}

export interface ActionCenterData {
  canCall: boolean;
  canWhatsapp: boolean;
  canNavigate: boolean;
  distance?: { value: number; formatted: string };
  eta?: { minutes: number; formatted: string };
}

export interface FormattedCustomer extends Customer {
  displayName: string;
  displayCategory: string;
  completenessScore: number;
  hasPhotos: boolean;
  hasNotes: boolean;
  lastVisitText: string;
}

export interface PriorityBadge {
  label: string;
  color: string;
  icon: string;
}
