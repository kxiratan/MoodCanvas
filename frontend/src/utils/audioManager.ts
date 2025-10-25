import { MoodType } from '@/types/mood';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private currentOscillators: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.3;

  initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.volume;
    }
  }

  setMood(mood: MoodType) {
    if (!this.audioContext || !this.gainNode || this.isMuted) return;

    // Stop current oscillators
    this.stopCurrentSound();

    // Create new soundscape based on mood
    const config = this.getMoodAudioConfig(mood);
    
    config.frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const oscGain = this.audioContext!.createGain();
      
      oscillator.type = config.waveType;
      oscillator.frequency.value = freq;
      
      oscGain.gain.value = config.volumes[index];
      
      oscillator.connect(oscGain);
      oscGain.connect(this.gainNode!);
      
      oscillator.start();
      this.currentOscillators.push(oscillator);
    });
  }

  private getMoodAudioConfig(mood: MoodType) {
    const configs = {
      positive: {
        frequencies: [220, 330, 440],
        volumes: [0.1, 0.08, 0.06],
        waveType: 'sine' as OscillatorType
      },
      energetic: {
        frequencies: [440, 554, 659],
        volumes: [0.12, 0.1, 0.08],
        waveType: 'square' as OscillatorType
      },
      calm: {
        frequencies: [174, 261, 349],
        volumes: [0.08, 0.06, 0.04],
        waveType: 'sine' as OscillatorType
      },
      negative: {
        frequencies: [196, 246, 293],
        volumes: [0.06, 0.05, 0.04],
        waveType: 'triangle' as OscillatorType
      },
      neutral: {
        frequencies: [220, 277, 330],
        volumes: [0.05, 0.04, 0.03],
        waveType: 'sine' as OscillatorType
      },
      chaotic: {
        frequencies: [392, 493, 587, 698],
        volumes: [0.1, 0.09, 0.08, 0.07],
        waveType: 'sawtooth' as OscillatorType
      }
    };

    return configs[mood];
  }

  private stopCurrentSound() {
    this.currentOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Oscillator already stopped
      }
    });
    this.currentOscillators = [];
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopCurrentSound();
    }
    return this.isMuted;
  }

  cleanup() {
    this.stopCurrentSound();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}