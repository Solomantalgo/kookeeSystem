import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as EXIF from 'pixi-exif';

export interface MediaMetadata {
  gpsLat: number;
  gpsLng: number;
  timestamp: string;
  userId: string;
  customerId: string;
  visitId: string;
  originalFileName: string;
  compressedSize: number;
  originalSize: number;
}

export interface CompressedImageResult {
  uri: string;
  size: number;
  width: number;
  height: number;
  metadata: MediaMetadata;
}

const MEDIA_PENDING_DIR = `${FileSystem.documentDirectory}media/pending`;
const MEDIA_ARCHIVE_DIR = `${FileSystem.documentDirectory}media/archive`;
const MAX_DIMENSION = 1200;
const MAX_FILE_SIZE = 350000; // 350KB in bytes

export class ImageCompressionService {
  static async initializeDirs() {
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
  }

  static async compressImage(
    imageUri: string,
    metadata: Omit<MediaMetadata, 'compressedSize' | 'originalSize'>
  ): Promise<CompressedImageResult> {
    try {
      // Get original file info
      const originalInfo = await FileSystem.getInfoAsync(imageUri);
      const originalSize = originalInfo.size || 0;

      // Start with a compression quality and progressively reduce if needed
      let quality = 0.8;
      let compressed = await this.performCompression(imageUri, quality);

      // If still too large, reduce quality iteratively
      while (compressed.size > MAX_FILE_SIZE && quality > 0.3) {
        quality -= 0.1;
        compressed = await this.performCompression(imageUri, quality);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${metadata.customerId}_${new Date().toISOString().split('T')[0]}_${timestamp}.jpg`;
      const pendingPath = `${MEDIA_PENDING_DIR}/${fileName}`;

      // Move compressed image to pending directory
      await FileSystem.moveAsync({
        from: compressed.uri,
        to: pendingPath,
      });

      // Create metadata file
      const metadataWithSizes: MediaMetadata = {
        ...metadata,
        originalSize: originalSize,
        compressedSize: compressed.size,
      };

      const metadataPath = `${MEDIA_PENDING_DIR}/${fileName.replace('.jpg', '.json')}`;
      await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadataWithSizes, null, 2));

      return {
        uri: pendingPath,
        size: compressed.size,
        width: compressed.width,
        height: compressed.height,
        metadata: metadataWithSizes,
      };
    } catch (error) {
      console.error('Image compression failed:', error);
      throw new Error(`Failed to compress image: ${error}`);
    }
  }

  private static async performCompression(
    imageUri: string,
    quality: number
  ): Promise<{ uri: string; size: number; width: number; height: number }> {
    try {
      const result = await manipulateAsync(imageUri, [], {
        compress: quality,
        format: SaveFormat.JPEG,
      });

      const info = await FileSystem.getInfoAsync(result.uri);
      return {
        uri: result.uri,
        size: info.size || 0,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Compression operation failed:', error);
      throw error;
    }
  }

  static async injectEXIFData(
    imagePath: string,
    metadata: MediaMetadata
  ): Promise<void> {
    try {
      // Note: Full EXIF injection requires native modules
      // This is a simplified implementation using metadata sidecar file
      const metadataPath = imagePath.replace('.jpg', '.json');
      await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Failed to inject EXIF data:', error);
    }
  }

  static async moveToArchive(imagePath: string): Promise<string> {
    try {
      const fileName = imagePath.split('/').pop() || '';
      const archivePath = `${MEDIA_ARCHIVE_DIR}/${fileName}`;

      await FileSystem.moveAsync({
        from: imagePath,
        to: archivePath,
      });

      // Also move metadata file
      const metadataPath = imagePath.replace('.jpg', '.json');
      const archiveMetadataPath = `${MEDIA_ARCHIVE_DIR}/${fileName.replace('.jpg', '.json')}`;
      const metadataExists = await FileSystem.getInfoAsync(metadataPath);
      if (metadataExists.exists) {
        await FileSystem.moveAsync({
          from: metadataPath,
          to: archiveMetadataPath,
        });
      }

      return archivePath;
    } catch (error) {
      console.error('Failed to move image to archive:', error);
      throw error;
    }
  }

  static async deleteImage(imagePath: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(imagePath);

      // Also delete metadata file
      const metadataPath = imagePath.replace('.jpg', '.json');
      const metadataExists = await FileSystem.getInfoAsync(metadataPath);
      if (metadataExists.exists) {
        await FileSystem.deleteAsync(metadataPath);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }

  static async getPendingImages(): Promise<CompressedImageResult[]> {
    try {
      const files = await FileSystem.readDirectoryAsync(MEDIA_PENDING_DIR);
      const imageFiles = files.filter((f) => f.endsWith('.jpg'));

      const results: CompressedImageResult[] = [];
      for (const imageFile of imageFiles) {
        const imagePath = `${MEDIA_PENDING_DIR}/${imageFile}`;
        const metadataPath = `${MEDIA_PENDING_DIR}/${imageFile.replace('.jpg', '.json')}`;

        const imageInfo = await FileSystem.getInfoAsync(imagePath);
        const metadataExists = await FileSystem.getInfoAsync(metadataPath);

        if (metadataExists.exists) {
          const metadataContent = await FileSystem.readAsStringAsync(metadataPath);
          const metadata = JSON.parse(metadataContent);

          results.push({
            uri: imagePath,
            size: imageInfo.size || 0,
            width: 0, // Would need to decode image to get dimensions
            height: 0,
            metadata,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to get pending images:', error);
      return [];
    }
  }

  static async getStorageUsage(): Promise<{
    pending: number;
    archive: number;
    total: number;
  }> {
    try {
      const pendingFiles = await FileSystem.readDirectoryAsync(MEDIA_PENDING_DIR);
      const archiveFiles = await FileSystem.readDirectoryAsync(MEDIA_ARCHIVE_DIR);

      let pendingSize = 0;
      for (const file of pendingFiles.filter((f) => f.endsWith('.jpg'))) {
        const info = await FileSystem.getInfoAsync(`${MEDIA_PENDING_DIR}/${file}`);
        pendingSize += info.size || 0;
      }

      let archiveSize = 0;
      for (const file of archiveFiles.filter((f) => f.endsWith('.jpg'))) {
        const info = await FileSystem.getInfoAsync(`${MEDIA_ARCHIVE_DIR}/${file}`);
        archiveSize += info.size || 0;
      }

      return {
        pending: pendingSize,
        archive: archiveSize,
        total: pendingSize + archiveSize,
      };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return { pending: 0, archive: 0, total: 0 };
    }
  }

  static async cleanupOldPhotos(daysToKeep: number = 3): Promise<number> {
    try {
      const files = await FileSystem.readDirectoryAsync(MEDIA_ARCHIVE_DIR);
      const now = Date.now();
      const cutoffTime = now - daysToKeep * 24 * 60 * 60 * 1000;

      let deletedCount = 0;
      for (const file of files.filter((f) => f.endsWith('.jpg'))) {
        const filePath = `${MEDIA_ARCHIVE_DIR}/${file}`;
        const info = await FileSystem.getInfoAsync(filePath);
        if (info.modificationTime && info.modificationTime * 1000 < cutoffTime) {
          await this.deleteImage(filePath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old photos:', error);
      return 0;
    }
  }
}
