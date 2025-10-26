import { MoodType } from '@/types/mood';

interface AudioLayer {
  source: AudioBufferSourceNode | null;
  gain: GainNode;
  filter: BiquadFilterNode;
  buffer: AudioBuffer | null;
}

class AudioManager {
  private audioContext: AudioContext | null = null;
  private layer: AudioLayer | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.3;
  
  private readonly audioFiles = {
    positive: '/audio/ambient-positive.wav',
    energetic: '/audio/ambient-positive.wav', // High energy version of positive
    neutral: '/audio/ambient-neutral.wav',
    negative: '/audio/ambient-negative.wav',
    calm: '/audio/ambient-neutral.wav', // Calmer version of neutral
    chaotic: '/audio/ambient-negative.wav' // Intense version of negative
  };
  
  private currentMood: MoodType = 'neutral';
  private activityLevel: number = 0;

  async initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create audio layer
      this.layer = this.createLayer();

      // Load initial neutral ambient sound
      await this.loadAudioFile(this.audioFiles.neutral);
    }
  }

  private createLayer(): AudioLayer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    // Configure filter
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;
    
    // Connect nodes
    filter.connect(gain);
    gain.connect(this.audioContext.destination);
    
    return {
      source: null,
      gain,
      filter,
      buffer: null
    };
  }

  private async loadAudioFile(url: string): Promise<void> {
    if (!this.audioContext || !this.layer) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.layer.buffer = audioBuffer;
      
      // Start playing if we're loading for the first time
      if (!this.layer.source) {
        this.playAudio();
      }
    } catch (error) {
      console.error('Error loading audio file:', error);
    }
  }

  private playAudio() {
    if (!this.audioContext || !this.layer || !this.layer.buffer) return;

    // Stop current source if it exists
    if (this.layer.source) {
      this.layer.source.stop();
      this.layer.source.disconnect();
    }

    // Create and configure new source
    const source = this.audioContext.createBufferSource();
    source.buffer = this.layer.buffer;
    source.loop = true;
    
    // Connect to filter chain
    source.connect(this.layer.filter);
    
    // Set initial volume
    this.layer.gain.gain.value = this.volume;
    
    // Start playing
    source.start(0);
    this.layer.source = source;
  }

  private stopCurrentSound() {
    if (!this.layer?.source) return;
    
    try {
      this.layer.source.stop();
      this.layer.source.disconnect();
    } catch (e) {
      // Node might already be stopped
    }
    this.layer.source = null;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.layer?.gain) {
      this.layer.gain.gain.setTargetAtTime(
        this.volume,
        this.audioContext?.currentTime || 0,
        0.1
      );
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.layer?.gain) {
      this.layer.gain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.volume,
        this.audioContext?.currentTime || 0,
        0.1
      );
    }
    return this.isMuted;
  }

  cleanup() {
    this.stopCurrentSound();
    if (this.layer) {
      this.layer.gain.disconnect();
      this.layer.filter.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  async setMood(mood: MoodType, intensity: number = 0.5) {
    if (!this.audioContext || !this.layer || this.isMuted) return;

    this.currentMood = mood;
    
    // Load appropriate audio file for the mood
    const audioFile = this.audioFiles[mood] || this.audioFiles.neutral;
    await this.loadAudioFile(audioFile);

    // Update filter parameters based on mood and intensity
    if (this.layer.filter) {
      const baseFreq = mood === 'positive' || mood === 'energetic' ? 2000 :
                      mood === 'negative' || mood === 'chaotic' ? 800 :
                      mood === 'calm' ? 1000 : 1200;
      
      const intensityFactor = intensity * 0.5 + 0.5; // Range: 0.5 to 1
      const filterFreq = baseFreq * intensityFactor;
      
      this.layer.filter.frequency.setTargetAtTime(
        filterFreq,
        this.audioContext.currentTime,
        0.5
      );

      // Adjust gain based on intensity
      this.layer.gain.gain.setTargetAtTime(
        this.volume * (0.7 + intensity * 0.3),
        this.audioContext.currentTime,
        0.3
      );
    }
  }

  registerChatActivity(intensity: number, mood: MoodType = 'neutral') {
    if (!this.audioContext || !this.layer) return;
    
    // Update activity level (decays over time)
    this.activityLevel = Math.min(1, this.activityLevel + intensity * 0.3);

    // If mood changes, update audio
    if (mood !== this.currentMood || this.activityLevel > 0.7) {
      this.setMood(mood, this.activityLevel);
    }

    // Schedule activity decay
    if (this.audioContext) {
      setTimeout(() => {
        this.activityLevel = Math.max(0, this.activityLevel - 0.1);
        if (this.activityLevel < 0.3) {
          this.setMood('neutral', this.activityLevel);
        }
      }, 5000);
    }
  }
}

// Export a singleton instance
export const audioManager = new AudioManager();