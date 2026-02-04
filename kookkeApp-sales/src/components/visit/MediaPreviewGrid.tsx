import React, { useState, useMemo } from 'react';
import { useVisitWorkflow } from '../../contexts/VisitWorkflowContext';

/**
 * MediaPreviewGrid Component
 * High-performance gallery with lazy-loading thumbnails
 * Supports Full Screen Preview and Soft Delete actions
 */

interface MediaItem {
  id: string;
  uri: string;
  thumbnailUri?: string;
  timestamp: number;
  status: 'pending' | 'uploading' | 'synced' | 'failed';
}

interface MediaPreviewGridProps {
  items: MediaItem[];
  onItemDelete?: (itemId: string) => void;
  onItemPreview?: (itemId: string, uri: string) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export const MediaPreviewGrid: React.FC<MediaPreviewGridProps> = ({
  items = [],
  onItemDelete,
  onItemPreview,
  loading = false,
  emptyMessage = 'No photos captured yet',
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [fullScreenUri, setFullScreenUri] = useState<string | null>(null);
  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<string>>(new Set());

  const { visitContext } = useVisitWorkflow();

  // Lazy load thumbnails
  const handleThumbnailLoad = (itemId: string) => {
    setLoadedThumbnails((prev) => new Set([...prev, itemId]));
  };

  const handleDelete = (itemId: string) => {
    onItemDelete?.(itemId);
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
    }
  };

  const handlePreview = (item: MediaItem) => {
    setFullScreenUri(item.uri);
    setSelectedItemId(item.id);
    onItemPreview?.(item.id, item.uri);
  };

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.timestamp - a.timestamp),
    [items],
  );

  return (
    <div className="media-preview-grid-container">
      <div className="gallery-header">
        <h3 className="gallery-title">Captured Photos</h3>
        <span className="photo-count">{items.length} photo(s)</span>
      </div>

      {loading && <div className="loading-indicator">Loading gallery...</div>}

      {items.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <p className="empty-message">{emptyMessage}</p>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="gallery-grid">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                className={`gallery-item ${item.status} ${selectedItemId === item.id ? 'selected' : ''}`}
              >
                {/* Thumbnail */}
                <div className="thumbnail-container">
                  <img
                    src={item.thumbnailUri || item.uri}
                    alt={`Photo ${item.id}`}
                    className="thumbnail"
                    loading="lazy"
                    onLoad={() => handleThumbnailLoad(item.id)}
                    onClick={() => handlePreview(item)}
                  />

                  {!loadedThumbnails.has(item.id) && (
                    <div className="thumbnail-skeleton">
                      <div className="skeleton-pulse"></div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className={`status-badge status-${item.status}`}>
                    {item.status === 'synced' && '✓'}
                    {item.status === 'pending' && '⏱'}
                    {item.status === 'uploading' && '⬆'}
                    {item.status === 'failed' && '✕'}
                  </div>
                </div>

                {/* Photo Metadata */}
                <div className="photo-metadata">
                  <p className="photo-time">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="photo-actions">
                  <button
                    className="action-button preview-button"
                    onClick={() => handlePreview(item)}
                    title="Preview photo"
                  >
                    👁️
                  </button>
                  <button
                    className="action-button delete-button"
                    onClick={() => handleDelete(item.id)}
                    title="Delete photo"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Full Screen Preview Modal */}
          {fullScreenUri && (
            <div className="fullscreen-preview-modal" onClick={() => setFullScreenUri(null)}>
              <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
                <button
                  className="close-button"
                  onClick={() => setFullScreenUri(null)}
                  title="Close preview"
                >
                  ✕
                </button>
                <img src={fullScreenUri} alt="Full screen preview" className="preview-image" />
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .media-preview-grid-container {
          background: white;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }

        .gallery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e0e0e0;
        }

        .gallery-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .photo-count {
          background-color: #f0f0f0;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }

        .loading-indicator {
          text-align: center;
          padding: 32px 16px;
          color: #999;
          font-size: 14px;
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px;
          background-color: #f9f9f9;
          border-radius: 6px;
          border: 1px dashed #ddd;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .empty-message {
          margin: 0;
          color: #999;
          font-size: 14px;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }

        .gallery-item {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid #e0e0e0;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
        }

        .gallery-item:hover {
          border-color: #2196f3;
          box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
        }

        .gallery-item.selected {
          border-color: #2196f3;
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        }

        .gallery-item.failed {
          opacity: 0.6;
          border-color: #f44336;
        }

        .thumbnail-container {
          position: relative;
          width: 100%;
          padding-bottom: 100%;
          background-color: #f0f0f0;
          overflow: hidden;
        }

        .thumbnail {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .thumbnail:hover {
          transform: scale(1.1);
        }

        .thumbnail-skeleton {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: #f0f0f0;
        }

        .skeleton-pulse {
          width: 100%;
          height: 100%;
          animation: skeleton-pulse 1s infinite;
          background: linear-gradient(
            90deg,
            #f0f0f0 0%,
            #e0e0e0 50%,
            #f0f0f0 100%
          );
          background-size: 200% 100%;
        }

        @keyframes skeleton-pulse {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .status-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .status-synced {
          background-color: #4caf50;
          color: white;
        }

        .status-pending {
          background-color: #ff9800;
          color: white;
        }

        .status-uploading {
          background-color: #2196f3;
          color: white;
          animation: uploading-pulse 1s infinite;
        }

        .status-failed {
          background-color: #f44336;
          color: white;
        }

        @keyframes uploading-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .photo-metadata {
          padding: 8px;
          background-color: #fafafa;
        }

        .photo-time {
          margin: 0;
          font-size: 11px;
          color: #666;
          text-align: center;
        }

        .photo-actions {
          display: flex;
          gap: 4px;
          padding: 6px;
          background-color: white;
          border-top: 1px solid #e0e0e0;
        }

        .action-button {
          flex: 1;
          padding: 6px;
          border: none;
          background-color: #f5f5f5;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .action-button:hover {
          background-color: #e0e0e0;
        }

        .preview-button:active {
          background-color: #90caf9;
        }

        .delete-button:active {
          background-color: #ef5350;
        }

        .fullscreen-preview-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .fullscreen-content {
          position: relative;
          max-width: 90%;
          max-height: 90%;
        }

        .preview-image {
          width: 100%;
          height: auto;
          max-height: 80vh;
          object-fit: contain;
          border-radius: 8px;
        }

        .close-button {
          position: absolute;
          top: -40px;
          right: 0;
          background-color: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background-color: #f0f0f0;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default MediaPreviewGrid;
