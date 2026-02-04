import * as SQLite from 'expo-sqlite';
import { VisitData } from '../types/visitWorkflow';

export interface DraftVisit {
  id: string;
  customerId: string;
  visitId: string;
  status: string;
  formData: Record<string, any>;
  completedTasks: string[];
  photoIds: string[];
  createdAt: string;
  lastUpdatedAt: string;
}

export class LocalPersistenceService {
  private db: SQLite.Database | null = null;

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('kookee_visits.db');

      // Create tables if they don't exist
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS draft_visits (
          id TEXT PRIMARY KEY,
          customerId TEXT NOT NULL,
          visitId TEXT NOT NULL,
          status TEXT NOT NULL,
          formData TEXT NOT NULL,
          completedTasks TEXT NOT NULL,
          photoIds TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          lastUpdatedAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS visit_history (
          id TEXT PRIMARY KEY,
          customerId TEXT NOT NULL,
          visitId TEXT NOT NULL,
          status TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          gpsLat REAL,
          gpsLng REAL,
          duration INTEGER
        );

        CREATE TABLE IF NOT EXISTS photo_metadata (
          photoId TEXT PRIMARY KEY,
          visitId TEXT NOT NULL,
          customerId TEXT NOT NULL,
          imagePath TEXT NOT NULL,
          metadata TEXT NOT NULL,
          uploadStatus TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_draft_visits_customerId ON draft_visits(customerId);
        CREATE INDEX IF NOT EXISTS idx_visit_history_visitId ON visit_history(visitId);
        CREATE INDEX IF NOT EXISTS idx_photo_metadata_visitId ON photo_metadata(visitId);
      `);

      console.log('LocalPersistenceService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LocalPersistenceService:', error);
      throw error;
    }
  }

  async saveDraftVisit(visit: VisitData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const draftVisit: DraftVisit = {
        id: visit.visitId || `draft_${Date.now()}`,
        customerId: visit.customerId,
        visitId: visit.visitId || '',
        status: visit.status,
        formData: visit.formData,
        completedTasks: visit.completedTasks,
        photoIds: visit.photoIds,
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };

      await this.db.runAsync(
        `INSERT OR REPLACE INTO draft_visits (id, customerId, visitId, status, formData, completedTasks, photoIds, createdAt, lastUpdatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          draftVisit.id,
          draftVisit.customerId,
          draftVisit.visitId,
          draftVisit.status,
          JSON.stringify(draftVisit.formData),
          JSON.stringify(draftVisit.completedTasks),
          JSON.stringify(draftVisit.photoIds),
          draftVisit.createdAt,
          draftVisit.lastUpdatedAt,
        ]
      );

      console.log(`Draft visit saved: ${draftVisit.id}`);
    } catch (error) {
      console.error('Failed to save draft visit:', error);
      throw error;
    }
  }

  async loadActiveDraftVisit(customerId: string): Promise<VisitData | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync<DraftVisit>(
        `SELECT * FROM draft_visits WHERE customerId = ? AND status != 'checked-out' ORDER BY lastUpdatedAt DESC LIMIT 1`,
        [customerId]
      );

      if (!result) return null;

      return {
        customerId: result.customerId,
        visitId: result.visitId,
        status: result.status as any,
        formData: JSON.parse(result.formData),
        completedTasks: JSON.parse(result.completedTasks),
        photoIds: JSON.parse(result.photoIds),
        arrivedAt: new Date(),
        checkedInAt: undefined,
        processingStartedAt: undefined,
        checkedOutAt: undefined,
        checkInLocation: undefined,
        arrivalGPSAccuracy: 0,
        arrivalDiscrepancy: 0,
        draftData: {},
      };
    } catch (error) {
      console.error('Failed to load active draft visit:', error);
      return null;
    }
  }

  async deleteDraftVisit(visitId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM draft_visits WHERE visitId = ?', [visitId]);
      console.log(`Draft visit deleted: ${visitId}`);
    } catch (error) {
      console.error('Failed to delete draft visit:', error);
      throw error;
    }
  }

  async savePhotoMetadata(
    photoId: string,
    visitId: string,
    customerId: string,
    imagePath: string,
    metadata: Record<string, any>
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO photo_metadata (photoId, visitId, customerId, imagePath, metadata, uploadStatus, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          photoId,
          visitId,
          customerId,
          imagePath,
          JSON.stringify(metadata),
          'pending',
          new Date().toISOString(),
        ]
      );
    } catch (error) {
      console.error('Failed to save photo metadata:', error);
      throw error;
    }
  }

  async getPhotosByVisitId(visitId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results = await this.db.getAllAsync(
        'SELECT * FROM photo_metadata WHERE visitId = ?',
        [visitId]
      );

      return results.map((row: any) => ({
        ...row,
        metadata: JSON.parse(row.metadata),
      }));
    } catch (error) {
      console.error('Failed to get photos by visit ID:', error);
      return [];
    }
  }

  async updatePhotoUploadStatus(photoId: string, status: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('UPDATE photo_metadata SET uploadStatus = ? WHERE photoId = ?', [
        status,
        photoId,
      ]);
    } catch (error) {
      console.error('Failed to update photo upload status:', error);
      throw error;
    }
  }

  async saveVisitHistory(
    customerId: string,
    visitId: string,
    status: string,
    location?: { latitude: number; longitude: number },
    duration?: number
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const historyId = `history_${visitId}_${Date.now()}`;
      await this.db.runAsync(
        `INSERT INTO visit_history (id, customerId, visitId, status, timestamp, gpsLat, gpsLng, duration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          historyId,
          customerId,
          visitId,
          status,
          new Date().toISOString(),
          location?.latitude || null,
          location?.longitude || null,
          duration || null,
        ]
      );
    } catch (error) {
      console.error('Failed to save visit history:', error);
      throw error;
    }
  }

  async getVisitHistory(visitId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results = await this.db.getAllAsync(
        'SELECT * FROM visit_history WHERE visitId = ? ORDER BY timestamp ASC',
        [visitId]
      );

      return results as any[];
    } catch (error) {
      console.error('Failed to get visit history:', error);
      return [];
    }
  }

  async getPendingPhotos(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results = await this.db.getAllAsync(
        "SELECT * FROM photo_metadata WHERE uploadStatus = 'pending' OR uploadStatus = 'failed'"
      );

      return results.map((row: any) => ({
        ...row,
        metadata: JSON.parse(row.metadata),
      }));
    } catch (error) {
      console.error('Failed to get pending photos:', error);
      return [];
    }
  }

  async getAllDraftVisits(): Promise<VisitData[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results = await this.db.getAllAsync<DraftVisit>(
        "SELECT * FROM draft_visits WHERE status != 'checked-out' ORDER BY lastUpdatedAt DESC"
      );

      return results.map((row) => ({
        customerId: row.customerId,
        visitId: row.visitId,
        status: row.status as any,
        formData: JSON.parse(row.formData),
        completedTasks: JSON.parse(row.completedTasks),
        photoIds: JSON.parse(row.photoIds),
        arrivedAt: new Date(),
        checkedInAt: undefined,
        processingStartedAt: undefined,
        checkedOutAt: undefined,
        checkInLocation: undefined,
        arrivalGPSAccuracy: 0,
        arrivalDiscrepancy: 0,
        draftData: {},
      }));
    } catch (error) {
      console.error('Failed to get all draft visits:', error);
      return [];
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

// Singleton instance
export const localPersistenceService = new LocalPersistenceService();
