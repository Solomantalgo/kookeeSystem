import { MediaFile, UploadStatus } from '../../../types/shared/models/photo';
import { StorageManager } from './StorageManager';

// Mock dependency for API client
const API_UPLOAD_URL = '/api/media/upload';

export class UploadManager {
    private static uploadQueue: MediaFile[] = [];
    private static isUploading = false;

    static addToQueue(mediaFile: MediaFile) {
        this.uploadQueue.push(mediaFile);
        this.processQueue();
    }

    private static async processQueue() {
        if (this.isUploading || this.uploadQueue.length === 0) return;

        this.isUploading = true;
        const currentFile = this.uploadQueue[0];

        try {
            await this.uploadFile(currentFile);
            // On success
            this.uploadQueue.shift();
            // Move local file to archive? 
            // Depends on policy, usually we keep it until sync confirmation or purge time.
            // Update status in DB locally
        } catch (error) {
            console.error('Upload failed for', currentFile.fileName, error);
            // Retry logic would go here
            // Move to end of queue or mark failed
            this.uploadQueue.shift(); // Remove for now to prevent blocking
        } finally {
            this.isUploading = false;
            if (this.uploadQueue.length > 0) {
                this.processQueue();
            }
        }
    }

    private static async uploadFile(mediaFile: MediaFile): Promise<void> {
        // Implement multipart/form-data upload
        // This needs to read the file from storage
        const fileUri = mediaFile.filePath
            ? `${StorageManager.getPendingDirectory()}${mediaFile.fileName}` // Assuming relative path stored or checking both
            : null;

        if (!fileUri) throw new Error('File path missing');

        const formData = new FormData();
        formData.append('file', {
            uri: fileUri,
            name: mediaFile.fileName,
            type: mediaFile.fileType || 'image/jpeg',
        } as any);

        formData.append('metadata', JSON.stringify(mediaFile.metadata));
        formData.append('visitId', mediaFile.visitId);

        // Use standard fetch or Axios
        // const response = await fetch(API_UPLOAD_URL, {
        //     method: 'POST',
        //     body: formData,
        //     headers: {
        //         'Content-Type': 'multipart/form-data',
        //         // Authorization header...
        //     }
        // });

        // if (!response.ok) throw new Error('Upload failed');

        // Simulating upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Uploaded ${mediaFile.fileName}`);
    }
}
