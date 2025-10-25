import { MoodType, SentimentInput, MoodState } from '@/types/mood';

const POSITIVE_KEYWORDS = [
  'great', 'awesome', 'excited', 'love', 'happy', 'yes', 'perfect',
  'amazing', 'excellent', 'wonderful', 'fantastic', 'brilliant', 'good',
  'nice', 'cool', 'yay', 'hooray', 'congrats', 'success', 'win'
];

const NEGATIVE_KEYWORDS = [
  'problem', 'issue', 'stuck', 'frustrated', 'no', 'difficult',
  'hard', 'bad', 'wrong', 'error', 'fail', 'broken', 'bug',
  'annoying', 'confused', 'help', 'struggling'
];

const ENERGETIC_KEYWORDS = [
  'go', 'fast', 'quick', 'now', 'hurry', 'rush', 'action',
  'move', 'sprint', 'push', 'drive', 'power'
];

const CALM_KEYWORDS = [
  'focus', 'think', 'consider', 'plan', 'slow', 'careful',
  'steady', 'calm', 'relax', 'breathe', 'pause', 'reflect'
];

export class MoodEngine {
  private recentInputs: SentimentInput[] = [];
  private readonly MAX_HISTORY = 10;

  analyzeSentiment(input: SentimentInput): MoodState {
    // Add to history
    this.recentInputs.push(input);
    if (this.recentInputs.length > this.MAX_HISTORY) {
      this.recentInputs.shift();
    }

    const text = input.text.toLowerCase();
    
    // Count keyword matches
    let positiveScore = 0;
    let negativeScore = 0;
    let energeticScore = 0;
    let calmScore = 0;

    POSITIVE_KEYWORDS.forEach(keyword => {
      if (text.includes(keyword)) positiveScore++;
    });

    NEGATIVE_KEYWORDS.forEach(keyword => {
      if (text.includes(keyword)) negativeScore++;
    });

    ENERGETIC_KEYWORDS.forEach(keyword => {
      if (text.includes(keyword)) energeticScore++;
    });

    CALM_KEYWORDS.forEach(keyword => {
      if (text.includes(keyword)) calmScore++;
    });

    // Check for exclamation marks and caps (energetic indicators)
    const exclamationCount = (text.match(/!/g) || []).length;
    const capsRatio = text.replace(/[^a-zA-Z]/g, '').split('').filter(c => c === c.toUpperCase()).length / text.length;
    
    if (exclamationCount > 0) energeticScore += exclamationCount;
    if (capsRatio > 0.5) energeticScore += 2;

    // Check for emojis (positive/energetic indicators)
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]/gu;
    const emojiCount = (text.match(emojiRegex) || []).length;
    if (emojiCount > 0) {
      positiveScore += emojiCount;
      energeticScore += emojiCount;
    }

    // Determine mood type
    let moodType: MoodType = 'neutral';
    let intensity = 50;

    if (energeticScore > 2) {
      moodType = 'energetic';
      intensity = Math.min(100, 60 + energeticScore * 10);
    } else if (positiveScore > negativeScore && positiveScore > 0) {
      moodType = 'positive';
      intensity = Math.min(100, 50 + positiveScore * 10);
    } else if (negativeScore > positiveScore && negativeScore > 0) {
      moodType = 'negative';
      intensity = Math.min(100, 50 + negativeScore * 10);
    } else if (calmScore > 0) {
      moodType = 'calm';
      intensity = Math.min(100, 40 + calmScore * 10);
    }

    return {
      type: moodType,
      intensity,
      timestamp: Date.now()
    };
  }

  getAggregateMood(): MoodState {
    if (this.recentInputs.length === 0) {
      return { type: 'neutral', intensity: 50, timestamp: Date.now() };
    }

    // Analyze all recent inputs with time weighting
    const now = Date.now();
    const weightedMoods = this.recentInputs.map(input => {
      const mood = this.analyzeSentiment(input);
      const age = now - input.timestamp;
      const weight = Math.max(0.1, 1 - (age / 300000)); // Decay over 5 minutes
      return { mood, weight };
    });

    // Aggregate scores
    const moodScores: Record<MoodType, number> = {
      positive: 0,
      negative: 0,
      neutral: 0,
      energetic: 0,
      calm: 0,
      chaotic: 0
    };

    weightedMoods.forEach(({ mood, weight }) => {
      moodScores[mood.type] += (mood.intensity / 100) * weight;
    });

    // Find dominant mood
    let dominantMood: MoodType = 'neutral';
    let maxScore = 0;

    Object.entries(moodScores).forEach(([mood, score]) => {
      if (score > maxScore) {
        maxScore = score;
        dominantMood = mood as MoodType;
      }
    });

    return {
      type: dominantMood,
      intensity: Math.min(100, maxScore * 50),
      timestamp: now
    };
  }

  generateAISummary(): string {
    const mood = this.getAggregateMood();
    
    const summaries: Record<MoodType, string[]> = {
      positive: [
        "Team energy is high and positive! Great momentum. 🚀",
        "The vibe is excellent! Everyone seems engaged and excited. ✨",
        "Positive energy flowing! Keep up the great work! 💪"
      ],
      energetic: [
        "Wow! The energy is electric! Team is firing on all cylinders! ⚡",
        "High energy detected! Great brainstorming happening here! 🔥",
        "The team is buzzing with ideas! Fantastic energy! 💥"
      ],
      calm: [
        "Team is in focused mode. Good thoughtful discussion happening. 🧘",
        "Calm and collected energy. Deep thinking in progress. 💭",
        "Steady focus detected. Team is working through ideas carefully. 🎯"
      ],
      negative: [
        "Sensing some frustration. Maybe time for a quick break? ☕",
        "Energy seems a bit low. Consider switching approaches or taking a breather. 🌿",
        "Team might be hitting some roadblocks. Let's regroup and refocus. 🔄"
      ],
      neutral: [
        "Team is in steady working mode. Keep the momentum going! 📊",
        "Balanced energy. Good collaborative flow happening. 🤝",
        "Team is working through ideas at a good pace. 📝"
      ],
      chaotic: [
        "Lots of rapid activity! Ideas are flying fast! 🌪️",
        "High intensity brainstorming! Channel this energy! ⚡",
        "Fast-paced session! Make sure to capture all these ideas! 📝"
      ]
    };

    const options = summaries[mood.type];
    return options[Math.floor(Math.random() * options.length)];
  }
}