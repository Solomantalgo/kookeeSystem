/**
 * Customer UI Service
 * 
 * Handles all customer-related data transformations and business logic:
 * - Loading customer profile with all related data
 * - Computing verification status
 * - Building customer timeline from visits and notes
 * - Finding nearby leads
 * - Advanced filtering and search
 */

import {
  Customer,
  CustomerContact,
  Visit,
  TaskReport,
  User,
} from '../../../types/shared/models';
import {
  CustomerUIModel,
  CustomerVerificationStatus,
  CustomerTimelineEntry,
  CustomerActionCenter,
  DailyNote,
  CustomerDirectoryFilter,
  CustomerSearchResult,
  NearbyLeadsQuery,
  NearbyLeadsResult,
  Lead,
} from '../../../types/customerManagement';

export class CustomerUIService {
  /**
   * Get enhanced customer UI model with computed fields
   */
  async getCustomerUIModel(customerId: number): Promise<CustomerUIModel> {
    // TODO: Fetch from SQLite and enhance with UI fields
    const customer = await this.getCustomer(customerId);
    const distanceMeters = await this.calculateDistanceFromCurrent(customer);
    const lastVisitRelative = this.formatRelativeTime(customer.lastVisited);

    return {
      ...customer,
      distanceMeters,
      lastVisitRelative,
      isCurrentlyVisiting: false,
      priorityBadge: undefined,
      completenessScore: this.calculateCompletenessScore(customer),
    };
  }

  /**
   * Get customer verification status
   * Checks:
   * - Is location GPS verified?
   * - Does it have storefront photos?
   * - Is contact information complete?
   */
  async getVerificationStatus(customerId: number): Promise<CustomerVerificationStatus> {
    const customer = await this.getCustomer(customerId);
    const photos = await this.getCustomerPhotos(customerId);
    const lastPhotoAt = photos.length > 0 ? photos[0].metadata?.capturedAt : undefined;

    // Determine missing fields
    const missingFields: (keyof Customer)[] = [];
    if (!customer.phonePrimary && !customer.whatsappNumber) {
      missingFields.push('phonePrimary');
    }
    if (!customer.address) {
      missingFields.push('address');
    }
    if (!customer.ownerName) {
      missingFields.push('ownerName');
    }
    if (!customer.email && !customer.whatsappNumber) {
      missingFields.push('email');
    }

    return {
      customerId,
      isLocationVerified: customer.locationVerified || false,
      lastLocationVerificationAt: customer.lastVisited,
      hasStorefrontPhotos: photos.length > 0,
      photoCount: photos.length,
      lastPhotoAt,
      hasCompleteContactInfo: missingFields.length === 0,
      missingFields,
      lastCompletionCheckAt: new Date(),
    };
  }

  /**
   * Get customer timeline: reverse chronological list of visits, notes, audits
   */
  async getCustomerTimeline(customerId: number): Promise<CustomerTimelineEntry[]> {
    const visits = await this.getCustomerVisits(customerId);
    const notes = await this.getDailyNotes(customerId);
    const photos = await this.getCustomerPhotos(customerId);

    const entries: CustomerTimelineEntry[] = [];

    // Add visits
    visits.forEach((visit, index) => {
      entries.push({
        id: `visit-${visit.id}`,
        type: 'VISIT',
        timestamp: visit.checkInTime || visit.visitDate,
        userId: visit.userId,
        userName: '', // TODO: fetch from user record
        title: `Visit at ${this.formatDate(visit.checkInTime || visit.visitDate)}`,
        description: `Duration: ${visit.durationMinutes || 0} mins`,
        icon: '📍',
        data: {
          visitId: visit.id,
          duration: visit.durationMinutes,
        },
      });
    });

    // Add notes
    notes.forEach(note => {
      entries.push({
        id: `note-${note.id}`,
        type: 'NOTE',
        timestamp: note.recordedAt,
        userId: 0, // TODO: from note
        userName: note.recordedByUserName,
        title: `Note from ${note.recordedByUserName}`,
        description: note.content,
        icon: '📝',
      });
    });

    // Add photos
    photos.forEach((photo, index) => {
      entries.push({
        id: `photo-${photo.id}`,
        type: 'PHOTO',
        timestamp: photo.metadata?.capturedAt || new Date(),
        userId: photo.userId,
        userName: '', // TODO: fetch from user
        title: `Photo uploaded`,
        icon: '📷',
        data: {
          photosCount: 1,
        },
      });
    });

    // Sort by timestamp descending (most recent first)
    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get action center data for customer
   */
  async getActionCenter(customerId: number): Promise<CustomerActionCenter> {
    const customer = await this.getCustomer(customerId);
    const visits = await this.getCustomerVisits(customerId);
    const lastVisit = visits[0];
    const nextVisit = await this.getNextPlannedVisit(customerId);

    return {
      customerId,
      callPrimary: customer.phonePrimary
        ? {
            number: customer.phonePrimary,
            isAvailable: !!customer.phonePrimary,
          }
        : undefined,
      whatsapp: customer.whatsappNumber
        ? {
            number: customer.whatsappNumber,
            isAvailable: !!customer.whatsappNumber,
          }
        : undefined,
      googleMapsNavigation: {
        latitude: customer.latitude || 0,
        longitude: customer.longitude || 0,
        address: customer.address,
      },
      visitHistoryCount: visits.length,
      lastVisitDate: lastVisit?.checkOutTime || lastVisit?.visitDate,
      nextPlannedVisit: nextVisit,
    };
  }

  /**
   * Get daily notes for customer
   */
  async getDailyNotes(customerId: number): Promise<DailyNote[]> {
    // TODO: Fetch from SQLite
    // const db = await SQLite.openDatabaseAsync('kookee.db');
    // const notes = await db.getAllAsync(
    //   'SELECT * FROM daily_notes WHERE customer_id = ? ORDER BY recorded_at DESC',
    //   [customerId]
    // );
    // return notes;

    return [];
  }

  /**
   * Advanced customer search with filters
   */
  async searchCustomers(filter: CustomerDirectoryFilter): Promise<CustomerSearchResult[]> {
    // TODO: Implement SQLite query with filters
    // Build WHERE clause based on filter
    // Apply pagination
    // Calculate distance if sorting by distance

    return [];
  }

  /**
   * Get nearby leads within radius
   */
  async getNearbyLeads(query: NearbyLeadsQuery): Promise<NearbyLeadsResult[]> {
    // TODO: Fetch from SQLite with spatial query
    // SELECT * FROM customers/leads
    // WHERE distance(latitude, longitude, ?, ?) <= ?
    // ORDER BY distance ASC
    // LIMIT ?

    return [];
  }

  /**
   * Private helper methods
   */

  private async getCustomer(customerId: number): Promise<Customer> {
    // TODO: Fetch from SQLite
    return {
      id: customerId,
      name: '',
      category: 'RETAIL',
      territoryId: 0,
      locationVerified: false,
      geofenceRadiusMeters: 50,
      isActive: true,
      isDeleted: false,
      versionNumber: 0,
      isDirty: false,
      serverTimestamp: new Date(),
    };
  }

  private async getCustomerVisits(customerId: number): Promise<Visit[]> {
    // TODO: Fetch from SQLite
    return [];
  }

  private async getCustomerPhotos(customerId: number): Promise<any[]> {
    // TODO: Fetch from SQLite
    return [];
  }

  private async getNextPlannedVisit(customerId: number): Promise<Date | undefined> {
    // TODO: Check route assignments for next planned visit
    return undefined;
  }

  private async calculateDistanceFromCurrent(customer: Customer): Promise<number | undefined> {
    // TODO: Use GPS location service to calculate distance
    return undefined;
  }

  private calculateCompletenessScore(customer: Customer): number {
    let score = 0;
    const maxScore = 100;
    const fieldCount = 10;
    const pointPerField = maxScore / fieldCount;

    if (customer.phonePrimary) score += pointPerField;
    if (customer.whatsappNumber) score += pointPerField;
    if (customer.email) score += pointPerField;
    if (customer.address) score += pointPerField;
    if (customer.ownerName) score += pointPerField;
    if (customer.latitude && customer.longitude) score += pointPerField;
    if (customer.locationVerified) score += pointPerField;
    if (customer.notes && customer.notes.length > 0) score += pointPerField;
    if (customer.businessType) score += pointPerField;
    if (customer.photoUrl) score += pointPerField;

    return Math.round(score);
  }

  private formatRelativeTime(date?: Date): string {
    if (!date) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

    return this.formatDate(date);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  }

  private updateVerificationStatus(
    customerId: number,
    status: Partial<CustomerVerificationStatus>
  ): Promise<void> {
    // TODO: Update in SQLite
    return Promise.resolve();
  }
}

export default CustomerUIService;
