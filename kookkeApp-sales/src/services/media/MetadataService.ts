import { MediaMetadata } from '../../../types/shared/models/photo';
import * as Customer from '../../../../types/shared/models/base'; // Import if needed for types

export class MetadataService {
    /**
     * Generates a unique filename based on the convention:
     * [CustomerID]_[YYYYMMDD]_[UnixTime].jpg
     */
    static generateFileName(customerId: string): string {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        const timeStr = Math.floor(now.getTime() / 1000).toString(); // UnixTime
        // Sanitize customerId to be safe for filenames
        const safeCustId = customerId.replace(/[^a-zA-Z0-9]/g, '_');
        return `${safeCustId}_${dateStr}_${timeStr}.jpg`;
    }

    static createMetadata(
        context: {
            latitude?: number;
            longitude?: number;
            accuracy?: number;
            deviceModel?: string;
        }
    ): MediaMetadata {
        return {
            timestamp: new Date().toISOString(),
            gpsLatitude: context.latitude,
            gpsLongitude: context.longitude,
            gpsAccuracyMeters: context.accuracy,
            deviceModel: context.deviceModel,
            // Additional fields like camera make, orientation can be added here
        };
    }
}
