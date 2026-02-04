-- GPS & Location Services Database Schema
-- Add these tables to your SQLite database for breadcrumb and geofence tracking

-- Breadcrumb Table: Stores spatiotemporal GPS points for auditing and route replay
CREATE TABLE IF NOT EXISTS breadcrumbs (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  user_id TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy REAL NOT NULL,
  altitude REAL,
  speed REAL,
  heading REAL,
  timestamp INTEGER NOT NULL,
  battery_level REAL NOT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT 1,
  is_manual_adjustment BOOLEAN NOT NULL DEFAULT 0,
  version_number INTEGER NOT NULL DEFAULT 1,
  is_dirty BOOLEAN NOT NULL DEFAULT 1,
  sync_status TEXT DEFAULT 'PENDING',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
  deleted_at INTEGER
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_breadcrumb_user_timestamp ON breadcrumbs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_breadcrumb_timestamp ON breadcrumbs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_breadcrumb_dirty ON breadcrumbs(is_dirty, sync_status);
CREATE INDEX IF NOT EXISTS idx_breadcrumb_valid ON breadcrumbs(is_valid);

-- Breadcrumb Batch Table: Groups breadcrumbs for efficient syncing
CREATE TABLE IF NOT EXISTS breadcrumb_batches (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  user_id TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  breadcrumb_count INTEGER NOT NULL,
  distance_traveled REAL NOT NULL,
  average_speed REAL NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  is_dirty BOOLEAN NOT NULL DEFAULT 1,
  sync_status TEXT DEFAULT 'PENDING',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_batch_user_time ON breadcrumb_batches(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_batch_dirty ON breadcrumb_batches(is_dirty, sync_status);

-- Geofence Activity Log: Tracks arrival and exit events at customer outlets
CREATE TABLE IF NOT EXISTS geofence_activities (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  user_id TEXT NOT NULL,
  outlet_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy REAL NOT NULL,
  distance_error REAL,
  event_time INTEGER NOT NULL,
  duration_ms INTEGER,
  version_number INTEGER NOT NULL DEFAULT 1,
  is_dirty BOOLEAN NOT NULL DEFAULT 1,
  sync_status TEXT DEFAULT 'PENDING',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_geofence_user_outlet ON geofence_activities(user_id, outlet_id);
CREATE INDEX IF NOT EXISTS idx_geofence_event_time ON geofence_activities(event_time DESC);
CREATE INDEX IF NOT EXISTS idx_geofence_dirty ON geofence_activities(is_dirty, sync_status);

-- Location Service State: Tracks current tracking state and health
CREATE TABLE IF NOT EXISTS location_service_state (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  is_tracking BOOLEAN NOT NULL DEFAULT 0,
  is_background_tracking BOOLEAN NOT NULL DEFAULT 0,
  precision_mode TEXT NOT NULL DEFAULT 'HIGH_ACCURACY',
  last_location_lat REAL,
  last_location_lng REAL,
  last_location_accuracy REAL,
  last_location_timestamp INTEGER,
  last_background_update INTEGER,
  service_health_status TEXT DEFAULT 'HEALTHY',
  restart_attempts INTEGER DEFAULT 0,
  last_restart_time INTEGER,
  battery_level INTEGER,
  is_motion_detected BOOLEAN DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
);

-- Geofence History: For analytics and route replay
CREATE TABLE IF NOT EXISTS geofence_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  outlet_id TEXT NOT NULL,
  arrival_time INTEGER NOT NULL,
  exit_time INTEGER,
  duration_ms INTEGER,
  arrival_latitude REAL NOT NULL,
  arrival_longitude REAL NOT NULL,
  arrival_accuracy REAL,
  tasks_completed INTEGER DEFAULT 0,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
);

CREATE INDEX IF NOT EXISTS idx_geofence_history_user ON geofence_history(user_id, arrival_time DESC);
CREATE INDEX IF NOT EXISTS idx_geofence_history_outlet ON geofence_history(outlet_id);

-- Location Accuracy Cache: For monitoring signal quality
CREATE TABLE IF NOT EXISTS location_accuracy_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  accuracy REAL NOT NULL,
  signal_strength TEXT,
  is_valid BOOLEAN DEFAULT 1,
  speed REAL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
);

CREATE INDEX IF NOT EXISTS idx_accuracy_user_time ON location_accuracy_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_accuracy_signal ON location_accuracy_log(signal_strength);

-- Cleanup old breadcrumbs (keep last 7 days)
-- Run this periodically via a background job or sync agent
-- DELETE FROM breadcrumbs 
-- WHERE timestamp < (strftime('%s','now')*1000 - 7*24*60*60*1000)
-- AND sync_status = 'SYNCED';
