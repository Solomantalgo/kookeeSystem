import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaFile } from '../../../types/shared/models/photo';
import { StorageManager } from '../../services/media/StorageManager';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const THUMBNAIL_SIZE = width / COLUMN_COUNT - 4;

interface MediaPreviewGridProps {
    files: MediaFile[];
    onDelete?: (file: MediaFile) => void;
    readonly?: boolean;
}

export const MediaPreviewGrid: React.FC<MediaPreviewGridProps> = ({
    files,
    onDelete,
    readonly = false
}) => {
    const [selectedImage, setSelectedImage] = useState<MediaFile | null>(null);
    const [localUris, setLocalUris] = useState<Record<string, string>>({});

    // Optimistically resolve local paths
    useEffect(() => {
        const resolvePaths = async () => {
            const uris: Record<string, string> = {};
            for (const file of files) {
                // Determine if file is pending or archived based on check?
                // Or try both? Or rely on filePath property?

                // Assuming filePath contains partial path (e.g. filename) or MediaFile has absolute path?
                // Our system stores filename.
                const pendingPath = `${StorageManager.getPendingDirectory()}${file.fileName}`;
                // Simplified: just assuming pending for now if recently captured

                // Real implementation would check existence or store absolute path in MediaFile in memory

                uris[file.fileName] = pendingPath;
            }
            setLocalUris(uris);
        };
        resolvePaths();
    }, [files]);

    const renderItem = ({ item }: { item: MediaFile }) => {
        const uri = localUris[item.fileName];

        return (
            <TouchableOpacity onPress={() => setSelectedImage(item)} style={styles.gridItem}>
                <Image
                    source={{ uri: uri }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                />
                {item.uploadStatus === 'PENDING' && (
                    <View style={styles.pendingIndicator}>
                        <Ionicons name="cloud-upload" size={12} color="white" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={files}
                renderItem={renderItem}
                keyExtractor={(item) => item.localId || item.fileName}
                numColumns={COLUMN_COUNT}
                scrollEnabled={false} // Often embedded in scrollview
            />

            <Modal visible={!!selectedImage} transparent={true} onRequestClose={() => setSelectedImage(null)}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedImage(null)}>
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>

                    {selectedImage && localUris[selectedImage.fileName] && (
                        <Image
                            source={{ uri: localUris[selectedImage.fileName] }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}

                    {!readonly && onDelete && selectedImage && (
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => {
                                onDelete(selectedImage);
                                setSelectedImage(null);
                            }}
                        >
                            <Ionicons name="trash" size={30} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
    },
    gridItem: {
        width: THUMBNAIL_SIZE,
        height: THUMBNAIL_SIZE,
        margin: 2,
        backgroundColor: '#eee',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    pendingIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 4,
        padding: 2,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: width,
        height: '80%',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        padding: 10,
        zIndex: 10,
    },
    deleteButton: {
        position: 'absolute',
        bottom: 40,
        backgroundColor: 'red',
        padding: 15,
        borderRadius: 30,
    },
});
