import * as FileSystem from 'expo-file-system';
import { MediaMetadata } from './ImageCompressionService';

export interface UploadProgress {
  photoId: string;
  bytesSent: number;
  totalBytes: number;
  percentage: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused';
  error?: string;
}

export interface ChunkUploadConfig {
  chunkSize: number; // bytes
  maxRetries: number;
  timeoutMs: number;
  apiEndpoint: string;
  resumable: boolean;
}

export class ChunkBasedUploadManager {
  private uploadQueue: Map<string, UploadProgress> = new Map();
  private activeUploads: Map<string, AbortController> = new Map();
  private config: ChunkUploadConfig;
  private progressCallbacks: Map<string, (progress: UploadProgress) => void> = new Map();

  constructor(config: Partial<ChunkUploadConfig> = {}) {
    this.config = {
      chunkSize: config.chunkSize || 256000, // 256KB default
      maxRetries: config.maxRetries || 3,
      timeoutMs: config.timeoutMs || 30000,
      apiEndpoint: config.apiEndpoint || '/api/media/upload',
      resumable: config.resumable !== false,
    };
  }

  async queueUpload(
    photoId: string,
    imagePath: string,
    metadata: MediaMetadata
  ): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imagePath);
      const totalBytes = fileInfo.size || 0;

      const uploadProgress: UploadProgress = {
        photoId,
        bytesSent: 0,
        totalBytes,
        percentage: 0,
        status: 'pending',
      };

      this.uploadQueue.set(photoId, uploadProgress);
      this.notifyProgress(photoId, uploadProgress);

      // Queue for background processing
      setTimeout(() => this.processUpload(photoId, imagePath, metadata), 100);
    } catch (error) {
      console.error('Failed to queue upload:', error);
      this.updateUploadStatus(photoId, 'failed', error as string);
    }
  }

  private async processUpload(
    photoId: string,
    imagePath: string,
    metadata: MediaMetadata,
    retryCount: number = 0
  ): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imagePath);
      const totalBytes = fileInfo.size || 0;
      let uploadedBytes = 0;

      // Initialize resumable session if supported
      let sessionId = '';
      if (this.config.resumable) {
        sessionId = await this.initializeUploadSession(photoId, metadata);
      }

      const abortController = new AbortController();
      this.activeUploads.set(photoId, abortController);

      // Read file and upload in chunks
      const fileBase64 = await FileSystem.readAsStringAsync(imagePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Split into chunks
      const chunks = this.createChunks(fileBase64, this.config.chunkSize);

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        if (abortController.signal.aborted) {
          throw new Error('Upload cancelled');
        }

        const chunk = chunks[chunkIndex];
        const chunkSize = chunk.length;

        // Upload chunk with retry logic
        let chunkUploaded = false;
        for (let retryAttempt = 0; retryAttempt < this.config.maxRetries; retryAttempt++) {
          try {
            await this.uploadChunk(
              photoId,
              sessionId,
              chunkIndex,
              chunks.length,
              chunk,
              metadata,
              abortController.signal
            );
            chunkUploaded = true;
            break;
          } catch (error) {
            if (retryAttempt === this.config.maxRetries - 1) {
              throw error;
            }
            // Exponential backoff
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryAttempt) * 1000)
            );
          }
        }

        if (!chunkUploaded) {
          throw new Error(`Failed to upload chunk ${chunkIndex} after ${this.config.maxRetries} retries`);
        }

        // Update progress
        uploadedBytes += chunkSize;
        const percentage = Math.round((uploadedBytes / totalBytes) * 100);
        this.updateUploadProgress(photoId, uploadedBytes, totalBytes, percentage, 'uploading');
      }

      // Finalize upload session
      if (this.config.resumable) {
        await this.finalizeUploadSession(photoId, sessionId, metadata);
      }

      this.updateUploadStatus(photoId, 'completed');
      this.activeUploads.delete(photoId);
    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        // Retry entire upload with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.processUpload(photoId, imagePath, metadata, retryCount + 1);
      }

      console.error('Upload failed after all retries:', error);
      this.updateUploadStatus(photoId, 'failed', error as string);
      this.activeUploads.delete(photoId);
    }
  }

  private createChunks(base64String: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < base64String.length; i += chunkSize) {
      chunks.push(base64String.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async uploadChunk(
    photoId: string,
    sessionId: string,
    chunkIndex: number,
    totalChunks: number,
    chunkData: string,
    metadata: MediaMetadata,
    signal: AbortSignal
  ): Promise<void> {
    const formData = new FormData();
    formData.append('photoId', photoId);
    formData.append('sessionId', sessionId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('chunkData', chunkData);
    formData.append('metadata', JSON.stringify(metadata));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.apiEndpoint}/chunk`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  private async initializeUploadSession(
    photoId: string,
    metadata: MediaMetadata
  ): Promise<string> {
    const response = await fetch(`${this.config.apiEndpoint}/init-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId, metadata }),
    });

    if (!response.ok) {
      throw new Error('Failed to initialize upload session');
    }

    const data = await response.json();
    return data.sessionId;
  }

  private async finalizeUploadSession(
    photoId: string,
    sessionId: string,
    metadata: MediaMetadata
  ): Promise<void> {
    const response = await fetch(`${this.config.apiEndpoint}/finalize-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId, sessionId, metadata }),
    });

    if (!response.ok) {
      throw new Error('Failed to finalize upload session');
    }
  }

  pauseUpload(photoId: string): void {
    const abort = this.activeUploads.get(photoId);
    if (abort) {
      abort.abort();
      this.updateUploadStatus(photoId, 'paused');
    }
  }

  resumeUpload(
    photoId: string,
    imagePath: string,
    metadata: MediaMetadata
  ): void {
    this.activeUploads.delete(photoId);
    this.updateUploadStatus(photoId, 'pending');
    this.processUpload(photoId, imagePath, metadata);
  }

  cancelUpload(photoId: string): void {
    const abort = this.activeUploads.get(photoId);
    if (abort) {
      abort.abort();
    }
    this.uploadQueue.delete(photoId);
    this.progressCallbacks.delete(photoId);
    this.activeUploads.delete(photoId);
  }

  onProgress(photoId: string, callback: (progress: UploadProgress) => void): void {
    this.progressCallbacks.set(photoId, callback);
  }

  getProgress(photoId: string): UploadProgress | undefined {
    return this.uploadQueue.get(photoId);
  }

  getAllProgress(): UploadProgress[] {
    return Array.from(this.uploadQueue.values());
  }

  private updateUploadProgress(
    photoId: string,
    bytesSent: number,
    totalBytes: number,
    percentage: number,
    status: UploadProgress['status']
  ): void {
    const progress: UploadProgress = {
      photoId,
      bytesSent,
      totalBytes,
      percentage,
      status,
    };
    this.uploadQueue.set(photoId, progress);
    this.notifyProgress(photoId, progress);
  }

  private updateUploadStatus(
    photoId: string,
    status: UploadProgress['status'],
    error?: string
  ): void {
    const currentProgress = this.uploadQueue.get(photoId);
    if (currentProgress) {
      const updatedProgress: UploadProgress = {
        ...currentProgress,
        status,
        error,
      };
      this.uploadQueue.set(photoId, updatedProgress);
      this.notifyProgress(photoId, updatedProgress);
    }
  }

  private notifyProgress(photoId: string, progress: UploadProgress): void {
    const callback = this.progressCallbacks.get(photoId);
    if (callback) {
      callback(progress);
    }
  }
}

// Singleton instance
export const uploadManager = new ChunkBasedUploadManager();
