# Visit Workflow & Photo Management System Documentation

## Overview

This document describes the complete implementation of the Visit Workflow Agent and Photo Management Agent systems for the Kookee Sales App. These systems handle the entire lifecycle of field operations from arrival at a customer location through checkout and data synchronization.

## Architecture

### Core Components

#### 1. Visit Lifecycle State Machine (`useVisitLifecycle.ts`)

**Responsibilities:**
- Manages strict state transitions: `Arrived → Checked-In → Processing → Checked-Out`
- Prevents illegal state transitions (e.g., checking in to multiple customers simultaneously)
- Timestamps and geotaggs all state changes
- Maintains visit history

**Key Functions:**
```typescript
- handleArrival(): Initiates visit when customer is detected
- handleCheckIn(): Confirms arrival and begins data collection
- handleStartProcessing(): Marks the beginning of form filling
- handleCheckOut(): Completes the visit with validation
- updateFormData(): Persists user input in real-time
- markTaskComplete(): Tracks mandatory vs optional task completion
- addPhoto(): Registers captured photos with the visit
```

**State Transitions:**
```
┌─────────┐      ┌──────────┐     ┌────────────┐     ┌────────────┐
│ Arrived │──────┤ Checked- │─────┤ Processing │─────┤ Checked-Out│
│         │      │   In     │     │            │     │            │
└─────────┘      └──────────┘     └────────────┘     └────────────┘
```

---

#### 2. Dynamic Form Engine (`FormEngine.tsx` + `FormValidationService.ts`)

**Purpose:** Renders context-sensitive forms based on customer type with real-time validation.

**Supported Customer Types:**
- **Retail**: Stock Audit + Brand Presence + Field Intelligence
- **Wholesale**: Brand Presence + Stock Audit
- **Distributor**: Stock Audit + Delivery Notes

**Validation:**
- Uses Zod for schema-based validation
- Real-time field-level validation with error display
- Quantity warnings for unusually high values (e.g., > 100 units when max is 100)
- Character limits enforced for text fields

**Example:**
```typescript
// Validates stock quantity in real-time
const error = FormValidator.validateStockQuantity(9999);
// Returns: "Please verify this quantity; it seems unusually high."
```

---

#### 3. Image Compression Service (`ImageCompressionService.ts`)

**Key Features:**
- Automatically compresses images to < 350KB from typical 5MB
- Resizes to max 1200px on longest edge
- Preserves text readability for delivery notes
- Maintains metadata (GPS, timestamp, user, customer, visit IDs)
- Manages file organization: `/media/pending` → `/media/archive`

**Process Flow:**
```
Raw Image (5MB)
    ↓
expo-image-manipulator
    ↓
Compress with quality iteration
    ↓
Generate metadata file (JSON sidecar)
    ↓
Save to /media/pending/
    ↓
Ready for queue upload
```

**API:**
```typescript
ImageCompressionService.compressImage(imageUri, metadata)
  → CompressedImageResult {
    uri: string,
    size: number,
    metadata: MediaMetadata
  }

ImageCompressionService.injectEXIFData(path, metadata)
ImageCompressionService.moveToArchive(imagePath)
ImageCompressionService.cleanupOldPhotos(daysToKeep)
```

---

#### 4. Chunk-Based Upload Manager (`ChunkBasedUploadManager.ts`)

**Capabilities:**
- Splits large files into 256KB chunks
- Resumable uploads if connection interrupts
- Exponential backoff retry logic (up to 3 attempts per chunk)
- Optimistic UI (thumbnail shows immediately while upload queues)
- Progress tracking per photo
- Handles network failures gracefully

**Upload Process:**
```
Photo Captured
    ↓
Queue for upload
    ↓
Initialize session with backend
    ↓
Upload chunks (256KB each) with retry
    ↓
Finalize session
    ↓
Move to archive
    ↓
Update sync status
```

**API:**
```typescript
uploadManager.queueUpload(photoId, imagePath, metadata)
uploadManager.onProgress(photoId, callback)  // Track progress
uploadManager.pauseUpload(photoId)
uploadManager.resumeUpload(photoId, imagePath, metadata)
uploadManager.cancelUpload(photoId)
```

---

#### 5. Local Persistence Service (`LocalPersistenceService.ts`)

**Storage:** SQLite with the following tables:
- `draft_visits` - In-progress visit data
- `visit_history` - State change events with timestamps
- `photo_metadata` - Photo-visit associations and upload status

**Crash Recovery:**
- On app restart, checks for active drafts
- Restores the user to the exact point where they left off
- All form data re-populated with previous inputs

**API:**
```typescript
localPersistenceService.initialize()
localPersistenceService.saveDraftVisit(visit)
localPersistenceService.loadActiveDraftVisit(customerId)
localPersistenceService.savePhotoMetadata(photoId, visitId, customerId, path, metadata)
localPersistenceService.getPendingPhotos()  // For offline sync
```

---

#### 6. Voice-to-Text Service (`VoiceToTextService.ts`)

**Features:**
- Native speech recognition integration
- Automatic transcription of voice notes
- Metadata tagging with timestamp, customer, visit context
- Fallback to manual text input if permission denied

**API:**
```typescript
voiceToTextService.startRecording(visitId, customerId, onTranscription, onError)
voiceToTextService.stopRecording()
voiceToTextService.saveAudioNote(transcription, visitId, customerId)
voiceToTextService.speakText(text, language)  // For audio playback
```

---

#### 7. Photo Capture Button (`PhotoCaptureButton.tsx`)

**UI/UX Features:**
- **Streamlined Camera Interface**: Tap to focus, manual flash override
- **Guideline Overlay**: Ghost box to encourage proper framing
- **Rapid Capture Loop**: Tap → Review → Retake → Save (minimal interactions)
- **Permission Handling**: Clear prompts to enable camera in settings
- **Performance**: Camera transition < 800ms to avoid frustration

**States:**
- Closed (button visible)
- Open (full-screen camera with controls)
- Capturing (progress indicator)
- Compressing (progress bar)

---

#### 8. Media Preview Grid (`MediaPreviewGrid.tsx`)

**Features:**
- Lazy-loaded thumbnails (responsive even with 500+ photos)
- Full-screen preview with swipe navigation
- Soft delete (removes from current visit, archives for audit)
- Upload status indicators (pending, uploading, synced, failed)
- Data saver toggle (high-res vs low-res thumbnails)

---

#### 9. Visit Progress Header (`VisitProgressHeader.tsx`)

**Displays:**
- Current visit state (Arrived | Checked-In | Processing | Checked-Out)
- Progress bar (% of mandatory tasks completed)
- Task checklist:
  - ✓ Check-In (mandatory)
  - ✓ Photo Capture (mandatory)
  - ✓ Form Data (mandatory)
  - Optional: Voice Notes, Additional Photos
- **Locked Check-Out Button**: Disabled until all mandatory tasks are complete

---

#### 10. Visit Completion Summary (`VisitCompletionSummary.tsx`)

**Motivational Screen ("Dopamine Loop"):**
- Success banner with celebration tone
- Stats: Time spent, photos taken, tasks completed
- Accomplishments listing
- Next customer ETA
- Performance metrics (geolocation accuracy)
- Navigation to next stop
- Back to dashboard option

---

### Context Integration (`VisitWorkflowContext.tsx`)

**Provides:**
- Global visit state accessible throughout the app
- Dispatch functions for state changes
- Helper hooks for mandatory task validation
- Service initialization on app startup

**Usage:**
```typescript
const { visitContext, updateFormData, addPhoto, handleCheckOut } = useVisitWorkflow();
```

---

## Data Flow

### Happy Path: Complete Visit

```
1. Customer Arrival Detected (GPS)
   └─→ ArrivalContext captured (coords, accuracy, discrepancy)
   └─→ Local notification: "Tap to Check-In"

2. User Taps Check-In
   └─→ State: Arrived → Checked-In
   └─→ Timestamp + GPS accuracy logged
   └─→ VisitProgressHeader unlocks form fields

3. User Fills Forms + Captures Photos
   └─→ Stock Audit → Real-time validation → Draft auto-saved every 5 seconds
   └─→ Photo → Compressed → Metadata injected → Queued for upload
   └─→ Voice Notes → Transcribed → Saved

4. Mandatory Tasks Complete
   └─→ VisitProgressHeader shows 100% completion
   └─→ Check-Out button enabled

5. User Taps Check-Out
   └─→ Geofence validation (must be within customer location)
   └─→ If outside: Option to override with reason
   └─→ Final draft saved
   └─→ State: Processing → Checked-Out
   └─→ Show Completion Summary

6. Navigation to Next Customer
   └─→ Photos upload in background
   └─→ Drafts cleared after confirmation
```

---

### Crash Recovery

```
1. App Crashes During Visit
   └─→ Draft visit + form data + photos remain in SQLite

2. User Reopens App
   └─→ LoadActiveDraftVisit() called
   └─→ If active draft exists:
       ├─→ Auto-navigate to VisitScreen
       ├─→ Pre-populate all form fields
       ├─→ Show captured photos
       └─→ Allow resumption from exact point

3. User Can:
   ├─→ Continue filling form
   ├─→ Add more photos
   ├─→ Complete checkout normally
   └─→ OR cancel and start new visit
```

---

### Offline Sync (Background)

```
While device is offline:
  └─→ All new data saved locally (draft)
  └─→ Photos compressed + queued
  └─→ Upload manager holds queue

When device comes online:
  └─→ ChunkBasedUploadManager wakes up
  └─→ Resumes photo uploads from last chunk
  └─→ Updates status in photo_metadata table
  └─→ If all chunks succeed → move to archive
  └─→ If any chunk fails → retry with backoff
```

---

## Validation Rules

### Stock Quantity
- Min: 0
- Max: 10,000
- Warning threshold: 100 units
- Warning message: "Please verify this quantity; it seems unusually high"

### Brand Display Quality
- Scale: 1-5 stars
- Required for: Wholesale, Retail customers

### Field Intelligence Notes
- Min length: 1 character
- Max length: 1,000 characters
- Optional but encouraged

### Delivery Notes (Distributor)
- Order ID: Required
- Items Delivered: Min 1
- Total Amount: Non-negative number

---

## Error Handling

### Network Errors
- Chunk upload fails → Automatic retry with exponential backoff
- Connection drops mid-file → Session resumed from last chunk
- No internet → Queue held locally, retried when online

### Permission Errors
- Camera denied → Clear prompt to enable in Settings
- Microphone denied → Text notes as fallback
- Storage denied → Error alert with retry option

### Validation Errors
- Stock count too high → Warning toast, allow override
- Required field empty → Disable checkout, show error message
- Outside geofence at checkout → Prompt for override reason

---

## Test Scenarios

### Test 1: Crash Recovery
1. Start visit with 5 form fields filled
2. Capture 3 photos
3. Force-close app (pull power)
4. Reopen app
5. **Expected**: Auto-navigate to visit with all 5 fields + 3 photos restored

### Test 2: Quantity Validation
1. Open form
2. Enter stock quantity: 99,999
3. **Expected**: Warning toast: "Please verify this quantity..."
4. Accept override and proceed

### Test 3: Double Check-In Prevention
1. Check-in to Customer A
2. Attempt to check-in to Customer B
3. **Expected**: Alert: "You're currently checked-in at Customer A. Check-out first?"

### Test 4: Offline Upload
1. Capture 10 photos (each 5MB)
2. Disconnect internet
3. Verify app shows "Pending Upload" status
4. Reconnect internet
5. **Expected**: Uploads resume automatically from last chunk

### Test 5: Low Battery Capture
1. Set device battery to 15%
2. Enable flash
3. Capture photo
4. **Expected**: Photo saved successfully, battery warning appears

---

## Performance Targets

| Metric | Target | Implementation |
|--------|--------|-----------------|
| Camera open → ready | < 800ms | CameraView preloading |
| Image compression | < 2 seconds | Parallel quality iteration |
| Photo upload (300KB) | < 5 seconds | 256KB chunks, parallel |
| Form validation | < 100ms | Zod lightweight validation |
| Crash recovery | < 2 seconds | SQLite indexed queries |
| Thumbnail load (100) | < 3 seconds | Lazy loading + virtualization |

---

## Integration Checklist

- [x] Visit Lifecycle State Machine
- [x] Dynamic Form Engine with validation
- [x] Image Compression Service
- [x] Chunk-Based Upload Manager
- [x] Local Persistence (SQLite)
- [x] Voice-to-Text Integration
- [x] Photo Capture Component
- [x] Media Preview Grid
- [x] Visit Progress Header
- [x] Visit Completion Summary
- [x] VisitWorkflowContext integration
- [x] Auto-save draft mechanism
- [x] Crash recovery
- [ ] Offline sync retry loop (backend integration)
- [ ] GPS geofence validation
- [ ] Push notifications (arrival)
- [ ] Analytics tracking

---

## Dependencies

```json
{
  "expo-camera": "^13.x",
  "expo-image-manipulator": "^11.x",
  "expo-file-system": "^15.x",
  "expo-sqlite": "^13.x",
  "expo-speech": "^11.x",
  "react-hook-form": "^7.x",
  "zod": "^3.x",
  "@hookform/resolvers": "^3.x"
}
```

---

## Future Enhancements

1. **AR Horizon Guide**: Level line on camera preview
2. **Smart Form Pre-filling**: Last visit data as grayed placeholder
3. **Batch Thumbnail Loading**: High-res vs data-saving toggle
4. **Resumable Multipart Uploads**: S3-style resumable protocol
5. **Voice Note Playback**: Review captured audio
6. **Handwriting Recognition**: Signature capture for delivery notes
7. **Computer Vision**: Auto-detect shelf position, brand presence
8. **Route Optimization**: Real-time ETA adjustment

---

## Support & Debugging

**Enable verbose logging:**
```typescript
if (__DEV__) {
  console.log('Visit State:', visitContext);
  console.log('Pending Uploads:', uploadManager.getAllProgress());
  console.log('Storage Usage:', await ImageCompressionService.getStorageUsage());
}
```

**Monitor SQLite:**
```bash
adb shell sqlite3 /data/data/com.kookee.sales/databases/kookee_visits.db ".dump"
```

**Check media files:**
```bash
adb shell ls -la /data/data/com.kookee.sales/files/media/
```

---

**Implementation Date**: January 22, 2026  
**Last Updated**: January 22, 2026  
**Version**: 1.0.0
