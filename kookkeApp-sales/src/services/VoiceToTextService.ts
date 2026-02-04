import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';

export interface AudioNoteMetadata {
  noteId: string;
  visitId: string;
  customerId: string;
  duration: number;
  timestamp: string;
  transcription?: string;
  confidence?: number;
  language: string;
}

export interface AudioNoteResult {
  noteId: string;
  audioPath: string;
  metadata: AudioNoteMetadata;
  transcription?: string;
}

export class VoiceToTextService {
  private isListening = false;
  private recordingStartTime: number = 0;
  private recognitionTimeout: NodeJS.Timeout | null = null;

  async startRecording(
    visitId: string,
    customerId: string,
    onTranscription: (text: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      // Initialize speech recognition
      const speakPromise = new Promise<string>((resolve, reject) => {
        this.isListening = true;
        this.recordingStartTime = Date.now();

        // Use a transcription API (Google Cloud Speech-to-Text or similar)
        // This is a placeholder for the actual implementation
        this.recognitionTimeout = setTimeout(() => {
          this.stopRecording();
          reject(new Error('Recording timeout'));
        }, 30000); // 30 second max recording

        // Note: In a real implementation, you would use a native speech recognition API
        // or integrate with a cloud-based speech-to-text service
      });

      await speakPromise;
    } catch (error) {
      console.error('Voice recording error:', error);
      onError(error instanceof Error ? error.message : 'Recording failed');
    }
  }

  stopRecording(): void {
    this.isListening = false;
    if (this.recognitionTimeout) {
      clearTimeout(this.recognitionTimeout);
      this.recognitionTimeout = null;
    }
  }

  async saveAudioNote(
    transcription: string,
    visitId: string,
    customerId: string
  ): Promise<AudioNoteResult> {
    try {
      const noteId = `note_${customerId}_${visitId}_${Date.now()}`;
      const audioPath = `${FileSystem.documentDirectory}audio_notes/${noteId}.json`;

      // Ensure directory exists
      const audioDir = `${FileSystem.documentDirectory}audio_notes`;
      const audioInfo = await FileSystem.getInfoAsync(audioDir);
      if (!audioInfo.exists) {
        await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
      }

      const metadata: AudioNoteMetadata = {
        noteId,
        visitId,
        customerId,
        duration: Date.now() - this.recordingStartTime,
        timestamp: new Date().toISOString(),
        transcription,
        language: 'en-US',
      };

      // Save metadata and transcription
      await FileSystem.writeAsStringAsync(
        audioPath,
        JSON.stringify({
          ...metadata,
          transcription,
        }, null, 2)
      );

      return {
        noteId,
        audioPath,
        metadata,
        transcription,
      };
    } catch (error) {
      console.error('Failed to save audio note:', error);
      throw error;
    }
  }

  async getAudioNote(noteId: string): Promise<AudioNoteMetadata | null> {
    try {
      const audioPath = `${FileSystem.documentDirectory}audio_notes/${noteId}.json`;
      const audioExists = await FileSystem.getInfoAsync(audioPath);

      if (!audioExists.exists) {
        return null;
      }

      const content = await FileSystem.readAsStringAsync(audioPath);
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to get audio note:', error);
      return null;
    }
  }

  async deleteAudioNote(noteId: string): Promise<void> {
    try {
      const audioPath = `${FileSystem.documentDirectory}audio_notes/${noteId}.json`;
      await FileSystem.deleteAsync(audioPath);
    } catch (error) {
      console.error('Failed to delete audio note:', error);
    }
  }

  async speakText(text: string, language: string = 'en-US'): Promise<void> {
    try {
      await Speech.speak(text, {
        language,
        pitch: 1.0,
        rate: 1.0,
      });
    } catch (error) {
      console.error('Failed to speak text:', error);
    }
  }

  // Transcription via cloud API (placeholder)
  private async transcribeAudio(audioPath: string): Promise<string> {
    // This would integrate with Google Cloud Speech-to-Text,
    // Azure Speech Services, or similar
    try {
      const audioData = await FileSystem.readAsStringAsync(audioPath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Make API call to transcription service
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: audioData,
          language: 'en-US',
        }),
      });

      const data = await response.json();
      return data.transcription || '';
    } catch (error) {
      console.error('Transcription failed:', error);
      return '';
    }
  }
}

// Singleton instance
export const voiceToTextService = new VoiceToTextService();
