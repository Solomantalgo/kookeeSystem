/**
 * Voice Memo Service
 * Handles recording, playback, and storage of 10-second voice notes
 * Allows sales reps to leave quick daily notes for their team
 */

import { Audio } from 'expo-av';

export interface VoiceMemo {
  id: string;
  customerId: string;
  authorId: string;
  authorName: string;
  content: string; // Transcript or description
  audioUrl: string;
  duration: number; // in seconds
  timestamp: number;
  createdAt: number;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // in milliseconds
  maxDuration: number; // 10 seconds = 10000ms
}

export class VoiceMemoService {
  private static readonly MAX_DURATION = 10000; // 10 seconds in milliseconds
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private recordingState: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    maxDuration: VoiceMemoService.MAX_DURATION,
  };

  private listeners: Set<(state: RecordingState) => void> = new Set();

  constructor() {
    this.initializeAudio();
  }

  /**
   * Initialize audio system
   */
  private async initializeAudio(): Promise<void> {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionMode: Audio.InterruptionMode.DoNotMix,
      });
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  /**
   * Start recording a voice memo
   */
  async startRecording(): Promise<void> {
    try {
      if (this.recording) {
        throw new Error('Recording already in progress');
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.updateRecordingState({
        isRecording: true,
        isPaused: false,
        duration: 0,
      });

      // Start duration timer
      this.startDurationTimer();
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and get the audio file
   */
  async stopRecording(): Promise<string> {
    if (!this.recording) {
      throw new Error('No active recording');
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      this.recording = null;
      this.updateRecordingState({
        isRecording: false,
        isPaused: false,
        duration: 0,
      });

      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  /**
   * Pause recording
   */
  async pauseRecording(): Promise<void> {
    if (!this.recording || this.recordingState.isPaused) {
      return;
    }

    try {
      await this.recording.pauseAsync();
      this.updateRecordingState({
        isPaused: true,
      });
    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw error;
    }
  }

  /**
   * Resume recording
   */
  async resumeRecording(): Promise<void> {
    if (!this.recording || !this.recordingState.isPaused) {
      return;
    }

    try {
      await this.recording.resumeAsync();
      this.updateRecordingState({
        isPaused: false,
      });
    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw error;
    }
  }

  /**
   * Play a voice memo
   */
  async playMemo(audioUri: string): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      this.sound = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Failed to play memo:', error);
      throw error;
    }
  }

  /**
   * Stop playback
   */
  async stopPlayback(): Promise<void> {
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    } catch (error) {
      console.error('Failed to stop playback:', error);
      throw error;
    }
  }

  /**
   * Get current recording state
   */
  getRecordingState(): RecordingState {
    return { ...this.recordingState };
  }

  /**
   * Subscribe to recording state changes
   */
  onStateChange(callback: (state: RecordingState) => void): () => void {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Update recording state and notify listeners
   */
  private updateRecordingState(
    updates: Partial<RecordingState>
  ): void {
    this.recordingState = {
      ...this.recordingState,
      ...updates,
    };

    // Notify all listeners
    this.listeners.forEach((callback) => {
      callback(this.recordingState);
    });
  }

  /**
   * Start a timer to track recording duration
   */
  private startDurationTimer(): void {
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= VoiceMemoService.MAX_DURATION) {
        // Auto-stop when max duration reached
        this.stopRecording().catch(console.error);
        clearInterval(timer);
      } else {
        this.updateRecordingState({
          duration: elapsed,
        });
      }
    }, 100);
  }

  /**
   * Format duration for display
   */
  static formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  }

  /**
   * Check if recording duration is valid (at least 1 second)
   */
  isValidRecording(): boolean {
    return this.recordingState.duration >= 1000;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.recording) {
      await this.stopRecording().catch(console.error);
    }

    if (this.sound) {
      await this.stopPlayback().catch(console.error);
    }

    this.listeners.clear();
  }
}

export default VoiceMemoService;
