import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Photo & Media Management Service
 * Handles capture, compression, metadata tagging, local caching, and upload management
 */

export interface MediaMetadata {
  gps_lat: number;
  gps_lng: number;
  timestamp: number;
  user_id: string;
  customer_id: string;
  visit_id: string;
  filename: string;
  file_size: number;
  width: number;
  height: number;
  compression_ratio: number;
}

export interface MediaObject {
  id: string;
  fileUri: string;
  thumbnailUri?: string;
  metadata: MediaMetadata;
  status: 'pending' | 'uploading' | 'synced' | 'failed';
  uploadProgress?: number;
  createdAt: number;
}

const MEDIA_PENDING_DIR = `${FileSystem.DocumentDirectory}media/pending/`;
const MEDIA_ARCHIVE_DIR = `${FileSystem.DocumentDirectory}media/archive/`;
const MEDIA_METADATA_FILE = `${FileSystem.DocumentDirectory}media/metadata.json`;

/**
 * Initialize media directories on app startup
 */
export const initializeMediaDirectories = async (): Promise<void> => {
  try {
    const pendingDirInfo = await FileSystem.getInfoAsync(MEDIA_PENDING_DIR);
    if (!pendingDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MEDIA_PENDING_DIR, { intermediates: true });
    }

    const archiveDirInfo = await FileSystem.getInfoAsync(MEDIA_ARCHIVE_DIR);
    if (!archiveDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MEDIA_ARCHIVE_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Failed to initialize media directories:', error);
  }
};

/**
 * Compress and optimize image
 * Target: < 350KB, max 1200px on longest edge
 */
export const compressImage = async (
  sourceUri: string,
  customerId: string,
  visitId: string,
): Promise<{
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  originalSize: number;
}> => {
  try {
    // Get original file size
    const originalInfo = await FileSystem.getInfoAsync(sourceUri);
    const originalSize = originalInfo.size || 0;

    // Determine compression parameters
    let compressionQuality = 0.8;
    let maxWidth = 1200;
    let maxHeight = 1200;

    // Progressively compress if needed
    let compressed = await ImageManipulator.manipulateAsync(sourceUri, [
      { resize: { width: maxWidth, height: maxHeight } },
    ], {
      compress: compressionQuality,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    // Check file size and compress further if needed
    let compressedInfo = await FileSystem.getInfoAsync(compressed.uri);
    let currentSize = compressedInfo.size || 0;

    let iterations = 0;
    while (currentSize > 350000 && compressionQuality > 0.3 && iterations < 3) {
      compressionQuality -= 0.15;
      const nextCompressed = await ImageManipulator.manipulateAsync(compressed.uri, [], {
        compress: compressionQuality,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      compressedInfo = await FileSystem.getInfoAsync(nextCompressed.uri);
      currentSize = compressedInfo.size || 0;
      compressed = nextCompressed;
      iterations++;
    }

    return {
      uri: compressed.uri,
      width: compressed.width,
      height: compressed.height,
      fileSize: currentSize,
      originalSize,
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error(`Image compression failed: ${error}`);
  }
};

/**
 * Save compressed image with metadata tagging
 * Naming convention: [CustomerID]_[YYYYMMDD]_[UnixTime].jpg
 */
export const savePhotoWithMetadata = async (
  compressedUri: string,
  metadata: Omit<MediaMetadata, 'filename' | 'file_size' | 'width' | 'height' | 'compression_ratio'>,
  imageInfo: { width: number; height: number; fileSize: number; originalSize: number },
): Promise<MediaObject> => {
  try {
    // Generate filename
    const date = new Date(metadata.timestamp);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const unixTime = Math.floor(metadata.timestamp / 1000);
    const filename = `${metadata.customer_id}_${dateStr}_${unixTime}.jpg`;

    // Save to pending directory
    const destinationUri = `${MEDIA_PENDING_DIR}${filename}`;
    await FileSystem.copyAsync({
      from: compressedUri,
      to: destinationUri,
    });

    // Clean up temporary file
    await FileSystem.deleteAsync(compressedUri, { idempotent: true });

    // Create media object
    const mediaObject: MediaObject = {
      id: `media_${unixTime}_${Math.random().toString(36).substr(2, 9)}`,
      fileUri: destinationUri,
      metadata: {
        ...metadata,
        filename,
        file_size: imageInfo.fileSize,
        width: imageInfo.width,
        height: imageInfo.height,
        compression_ratio: imageInfo.originalSize > 0
          ? (imageInfo.fileSize / imageInfo.originalSize) * 100
          : 0,
      },
      status: 'pending',
      createdAt: Date.now(),
    };

    // Persist metadata
    await persistMediaMetadata(mediaObject);

    return mediaObject;
  } catch (error) {
    console.error('Error saving photo with metadata:', error);
    throw new Error(`Failed to save photo: ${error}`);
  }
};

/**
 * Create thumbnail for gallery preview (lazy loading)
 */
export const createThumbnail = async (
  sourceUri: string,
  targetSize: 'small' | 'medium' = 'small',
): Promise<string> => {
  try {
    const size = targetSize === 'small' ? 100 : 200;

    const thumbnail = await ImageManipulator.manipulateAsync(sourceUri, [
      { resize: { width: size, height: size } },
    ], {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return thumbnail.uri;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    throw new Error(`Thumbnail creation failed: ${error}`);
  }
};

/**
 * Persist media metadata to local storage
 */
export const persistMediaMetadata = async (mediaObject: MediaObject): Promise<void> => {
  try {
    let mediaList: MediaObject[] = [];

    // Load existing metadata
    try {
      const existing = await FileSystem.readAsStringAsync(MEDIA_METADATA_FILE);
      mediaList = JSON.parse(existing);
    } catch {
      // File doesn't exist yet
      mediaList = [];
    }

    // Add new media object
    mediaList.push(mediaObject);

    // Save back
    await FileSystem.writeAsStringAsync(MEDIA_METADATA_FILE, JSON.stringify(mediaList, null, 2));
  } catch (error) {
    console.error('Error persisting media metadata:', error);
  }
};

/**
 * Load all pending media objects
 */
export const loadPendingMedia = async (): Promise<MediaObject[]> => {
  try {
    const content = await FileSystem.readAsStringAsync(MEDIA_METADATA_FILE);
    const mediaList: MediaObject[] = JSON.parse(content);

    // Filter pending and uploading items
    return mediaList.filter((m) => m.status === 'pending' || m.status === 'uploading');
  } catch (error) {
    console.warn('No pending media found or error loading:', error);
    return [];
  }
};

/**
 * Update media status after upload
 */
export const updateMediaStatus = async (
  mediaId: string,
  status: 'synced' | 'failed',
  uploadProgress?: number,
): Promise<void> => {
  try {
    const content = await FileSystem.readAsStringAsync(MEDIA_METADATA_FILE);
    const mediaList: MediaObject[] = JSON.parse(content);

    const mediaIndex = mediaList.findIndex((m) => m.id === mediaId);
    if (mediaIndex !== -1) {
      mediaList[mediaIndex].status = status;
      if (uploadProgress !== undefined) {
        mediaList[mediaIndex].uploadProgress = uploadProgress;
      }

      await FileSystem.writeAsStringAsync(MEDIA_METADATA_FILE, JSON.stringify(mediaList, null, 2));

      // Move to archive if synced
      if (status === 'synced') {
        const media = mediaList[mediaIndex];
        const archiveUri = `${MEDIA_ARCHIVE_DIR}${media.metadata.filename}`;
        await FileSystem.moveAsync({
          from: media.fileUri,
          to: archiveUri,
        });
        mediaList[mediaIndex].fileUri = archiveUri;
        await FileSystem.writeAsStringAsync(MEDIA_METADATA_FILE, JSON.stringify(mediaList, null, 2));
      }
    }
  } catch (error) {
    console.error('Error updating media status:', error);
  }
};

/**
 * Soft delete media (mark as deleted without removing file)
 */
export const softDeleteMedia = async (mediaId: string): Promise<void> => {
  try {
    const content = await FileSystem.readAsStringAsync(MEDIA_METADATA_FILE);
    const mediaList: MediaObject[] = JSON.parse(content);

    const mediaIndex = mediaList.findIndex((m) => m.id === mediaId);
    if (mediaIndex !== -1) {
      mediaList.splice(mediaIndex, 1);
      await FileSystem.writeAsStringAsync(MEDIA_METADATA_FILE, JSON.stringify(mediaList, null, 2));

      // Delete actual file
      const media = mediaList[mediaIndex];
      await FileSystem.deleteAsync(media.fileUri, { idempotent: true });
    }
  } catch (error) {
    console.error('Error soft-deleting media:', error);
  }
};

/**
 * Get storage info (for cleanup suggestions)
 */
export const getMediaStorageInfo = async (): Promise<{
  totalSize: number;
  fileCount: number;
  oldestFile?: { filename: string; timestamp: number };
}> => {
  try {
    const files = await FileSystem.readDirectoryAsync(MEDIA_PENDING_DIR);
    let totalSize = 0;
    let oldestTimestamp = Date.now();
    let oldestFile: string | undefined;

    for (const file of files) {
      const fileUri = `${MEDIA_PENDING_DIR}${file}`;
      const info = await FileSystem.getInfoAsync(fileUri);
      totalSize += info.size || 0;

      // Extract timestamp from filename [CustomerID]_[YYYYMMDD]_[UnixTime].jpg
      const parts = file.split('_');
      if (parts.length >= 3) {
        const timestamp = parseInt(parts[parts.length - 1].split('.')[0], 10) * 1000;
        if (timestamp < oldestTimestamp) {
          oldestTimestamp = timestamp;
          oldestFile = file;
        }
      }
    }

    return {
      totalSize,
      fileCount: files.length,
      oldestFile: oldestFile ? { filename: oldestFile, timestamp: oldestTimestamp } : undefined,
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { totalSize: 0, fileCount: 0 };
  }
};

/**
 * Cleanup old media files (retention policy)
 */
export const cleanupOldMedia = async (retentionDays: number = 3): Promise<number> => {
  try {
    const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const files = await FileSystem.readDirectoryAsync(MEDIA_PENDING_DIR);
    let deletedCount = 0;

    for (const file of files) {
      const fileUri = `${MEDIA_PENDING_DIR}${file}`;
      const info = await FileSystem.getInfoAsync(fileUri);

      if ((info.modificationTime || 0) * 1000 < cutoffTime) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
        deletedCount++;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old media:', error);
    return 0;
  }
};

/**
 * Export media data for backup
 */
export const exportMediaData = async (): Promise<string> => {
  try {
    const content = await FileSystem.readAsStringAsync(MEDIA_METADATA_FILE);
    return content;
  } catch (error) {
    console.error('Error exporting media data:', error);
    return '[]';
  }
};
