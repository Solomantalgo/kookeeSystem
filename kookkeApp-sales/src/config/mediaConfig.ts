export const MEDIA_CONFIG = {
    compression: {
        maxEdgeSize: 1200, // pixels
        targetFileSizeKB: 350,
        quality: 0.8, // 0-1
        format: 'jpeg' as const, // expo-image-manipulator SaveFormat.JPEG
    },
    storage: {
        pendingDir: 'media/pending',
        archiveDir: 'media/archive',
        retentionDays: 3,
        maxStorageMB: 500,
    },
    upload: {
        chunkSizeKB: 256,
        maxRetries: 5,
        retryDelayMs: 2000,
        wifiOnlyDefault: false,
    },
    camera: {
        transitionTimeoutMs: 800,
        defaultFlash: false,
        showGuidelines: true,
        showHorizonGuide: true,
        focusMode: 'on' as const, // auto focus
    },
};
