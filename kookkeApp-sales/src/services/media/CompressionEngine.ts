import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { MEDIA_CONFIG } from '../../config/mediaConfig';

export interface CompressedImage {
    uri: string;
    width: number;
    height: number;
    size: number; // bytes
}

export class CompressionEngine {
    /**
     * Compresses and resizes an image to meet the configuration targets.
     * @param uri Source image URI
     * @returns Promise resolving to CompressedImage object
     */
    static async processImage(uri: string): Promise<CompressedImage> {
        try {
            // Initial manipulation: Resize
            const actions: ImageManipulator.Action[] = [];

            // Get original dimensions (lightweight check)
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (!fileInfo.exists) {
                throw new Error(`File does not exist: ${uri}`);
            }

            // We can't get dimensions easily without loading, but manipulateAsync handles it.
            // We'll unconditionally add a resize action to safe bounds.
            // expo-image-manipulator resize maintains aspect ratio if only one dimension is provided, 
            // or we specific 'width' and 'height'.
            // However, to strictly limit the *longest* edge, logic is needed.
            // For efficiency, we'll try a generous resize first.

            // Actually, best practice is to just execute the manipulation with a max width/height assumption 
            // or process it to a safe standard size.
            // Let's assume standard portrait/landscape.

            // NOTE: To strictly constrain longest edge to 1200, we need dimensions. 
            // ImageManipulator.manipulateAsync returns result with width/height.
            // We can do a 2-pass if needed, or just assume a reasonable max width.

            // Simple approach: efficient resize to a bounding box.
            // ImageManipulator doesn't support "resize to fit box" directly in one pass without knowing dims.
            // But we can just run it with format conversion first to get dims? No, that's wasteful.
            // We'll proceed with a standard resize constraint. 
            // If we don't resize, we might blow memory.
            // Let's try to pass `compress` first.

            const result = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: MEDIA_CONFIG.compression.maxEdgeSize } }], // Naive: assumes width is driving dimension. 
                // Better: Check orientation or dimensions first?
                // For now, let's rely on the fact that most captures are portrait? 
                // No, that's unsafe.

                // Optimized approach:
                // 1. Compress with a reasonable quality to a temp file.
                // 2. Check result.

                // Let's stick to the prompt's explicit requirement: 
                // "Automatically resize and compress captured images to a maximum of 1200px on the longest edge"
                // To do this strictly, we'd need to know aspect ratio.
                // We'll skip pre-dimension check for speed and just cap width at 1200. 
                // (If height is > 1200, it might remain so? 
                // No, usually if we set width, height scales. If original was portrait (e.g. 3000x4000), 
                // resizing width to 1200 makes height ~1600. That violates longest edge 1200.

                // Correct logic:
                // We need to know orientation. 
                // For this implementation, we will use a safe resize strategy:
                // scale to a generic manageable size, or accept that we might need an image sizer utility.

                // Since we want SPEED (<800ms pipeline?), getting dimensions might be slow?
                // No, Image.getSize is fast on local files.
                // But we are in a pure service file.

                {
                    compress: MEDIA_CONFIG.compression.quality,
                    format: ImageManipulator.SaveFormat.JPEG,
                    base64: false
                }
            );

            // If the result is still too large, or dimensions are wrong, we might need a stored proc?
            // Re-check dimensions of the result
            let finalUri = result.uri;
            let finalWidth = result.width;
            let finalHeight = result.height;

            // Check if we need to resize further to respect maxEdgeSize STRICTLY
            const maxEdge = Math.max(finalWidth, finalHeight);
            if (maxEdge > MEDIA_CONFIG.compression.maxEdgeSize) {
                const resizeAction = finalWidth > finalHeight
                    ? { width: MEDIA_CONFIG.compression.maxEdgeSize }
                    : { height: MEDIA_CONFIG.compression.maxEdgeSize };

                const resizedResult = await ImageManipulator.manipulateAsync(
                    finalUri,
                    [{ resize: resizeAction }],
                    { compress: MEDIA_CONFIG.compression.quality, format: ImageManipulator.SaveFormat.JPEG }
                );
                finalUri = resizedResult.uri;
                finalWidth = resizedResult.width;
                finalHeight = resizedResult.height;
            }

            // Check file size
            const finalInfo = await FileSystem.getInfoAsync(finalUri);
            const size = finalInfo.exists ? finalInfo.size : 0;

            // If still too big, brute force compress lower? (Optional optimization)
            if (size > MEDIA_CONFIG.compression.targetFileSizeKB * 1024) {
                const aggressiveResult = await ImageManipulator.manipulateAsync(
                    finalUri,
                    [],
                    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
                );
                finalUri = aggressiveResult.uri;
                // update size
                const aggressiveInfo = await FileSystem.getInfoAsync(finalUri);
                // size = aggressiveInfo.size...
                return {
                    uri: finalUri,
                    width: aggressiveResult.width,
                    height: aggressiveResult.height,
                    size: aggressiveInfo.exists ? aggressiveInfo.size : 0
                };
            }

            return {
                uri: finalUri,
                width: finalWidth,
                height: finalHeight,
                size: size
            };
        } catch (error) {
            console.error('CompressionEngine Error:', error);
            throw error;
        }
    }
}
