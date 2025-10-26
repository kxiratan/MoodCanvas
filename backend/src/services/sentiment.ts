import { MoodType, MoodState } from '../types/mood';
import dotenv from 'dotenv';
import '../types/global';

dotenv.config();

// Emotional word mappings with weighted scores
// Simplified emotional patterns with core emotion words
// Advanced emotion detection patterns
const emotionalPatterns = {
  positive: {
    // Positive emotions with contextual awareness
    words: /\b(?:happy|joy(?:ful)?|love|smile|good|great|excited|awesome|nice|wonderful|beautiful|perfect|thx|thanks|ty)\b|[:;]-?[)D]|[<3]|🙂|😊|😄|👍/gi,
    color: 'yellow'
  },
  negative: {
    // Enhanced negative detection with multiple triggers
    words: /\b(?:angry|mad|hate|furious|rage|annoyed|upset|frustrated|stupid|dumb|idiot|awful|terrible|worst|bad|ugly|horrible|sucks|fuck|shit|crap|ass|wtf|wth|ffs|smh)\b|[:;]-?[(/]|😠|😡|👎|[A-Z\d]{2,}[!?]*|(?:\b\w+[!]{2,})|(?:^[A-Z\s!?]+$)/gim,
    color: 'red'
  },
  energetic: {
    // Dynamic and action-oriented words
    words: /\b(?:energetic|hyper|active|alive|pumped|strong|power|fast|quick|rush|speed|go|yes|lets|come|move|run|jump|dance|🏃‍♂️|💪|⚡)\b/gi,
    color: 'green'
  },
  calm: {
    // Peaceful and relaxing expressions
    words: /\b(?:calm|peace(?:ful)?|quiet|relax|chill|tranquil|zen|slow|gentle|soft|easy|breathe|rest|🧘‍♂️|😌|🌊)\b/gi,
    color: 'blue'
  },
  chaotic: {
    // Stress and confusion indicators
    words: /\b(?:stress|anxious|worried|nervous|panic|chaos|wild|crazy|insane|mental|confused|lost|help|what|(?:\?{2,}))|😰|😱|🤯/gi,
    color: 'purple'
  }
};

// Message counter and timestamp tracking for AI responses and spam prevention
const messageTracker = {
  count: 0,
  lastMessage: Date.now(),
  lastAIResponse: Date.now()
};

// AI response templates based on mood
const aiResponses: Record<MoodType, string[]> = {
  positive: [
    "That's the spirit! Keep that positive energy flowing! 🌟",
    "Love seeing such positivity in the team! 💫",
    "Your enthusiasm is contagious! 🌈"
  ],
  negative: [
    "Let's take a deep breath and work through this together. 🫂",
    "I understand your frustration. How can we help? 🤝",
    "Perhaps we could approach this from a different angle? 🤔"
  ],
  energetic: [
    "The energy in this room is amazing! Keep it going! ⚡",
    "You're on fire today! 🔥",
    "Love this dynamic energy! 💫"
  ],
  calm: [
    "What a peaceful atmosphere we have here. 🌊",
    "This calm energy is perfect for focusing. ✨",
    "Maintaining this peaceful vibe. 🌸"
  ],
  chaotic: [
    "Let's take a moment to center ourselves. 🎯",
    "One step at a time, we'll figure this out. 🌟",
    "Deep breaths everyone - we've got this! 🌈"
  ],
  neutral: [
    "I'm here to help if needed! 💫",
    "How's everyone doing today? 🌟",
    "Don't hesitate to reach out if you need anything! ✨"
  ]
};

export async function handleMoodUpdate(text: string): Promise<MoodState> {
  // Spam prevention: Check time since last message
  const now = Date.now();
  const timeSinceLastMessage = now - messageTracker.lastMessage;
  if (timeSinceLastMessage < 500) { // 500ms minimum between messages
    return {
      type: 'neutral',
      intensity: 50,
      timestamp: now
    };
  }
  messageTracker.lastMessage = now;
  messageTracker.count++;

  // Initialize mood scores
  const scores: Record<MoodType, number> = {
    positive: 0,
    negative: 0,
    energetic: 0,
    calm: 0,
    chaotic: 0,
    neutral: 0
  };

  // Enhanced text preprocessing
  const cleanText = text.trim();
  const isUpperCase = text === text.toUpperCase() && text.length >= 2;
  const hasExclamation = text.includes('!');
  const hasQuestion = text.includes('?');
  const hasMultipleMarks = /[!?]{2,}/.test(text);
  
  // Detect tone modifiers
  const isAggressive = isUpperCase || hasMultipleMarks;
  const isQuestioning = hasQuestion && !hasExclamation;
  const isEmphatic = hasExclamation && !hasQuestion;
  
  // Process each mood type with enhanced pattern matching
  Object.entries(emotionalPatterns).forEach(([mood, { words }]) => {
    const matches = (text.match(words) || []).length;
    
    // Base score from matches with context awareness
    scores[mood as MoodType] = matches;
    
    // Contextual scoring adjustments
    if (mood === 'negative' && isAggressive) {
      scores[mood as MoodType] *= 1.5; // 50% boost for aggressive tone
    }
    if (mood === 'chaotic' && isQuestioning) {
      scores[mood as MoodType] *= 1.2; // 20% boost for questioning tone
    }
    if (mood === 'positive' && isEmphatic) {
      scores[mood as MoodType] *= 1.2; // 20% boost for emphatic positive
    }
  });

  // Smart mood detection
  let dominantMood: MoodType = 'neutral';
  let maxScore = -1;

  // Priority-based mood selection with contextual weights
  const moodPriority: [MoodType, number][] = [
    ['negative', 1.5],   // Higher weight for negative emotions
    ['chaotic', 1.3],    // Increased chaos detection
    ['positive', 1.2],   // Slightly boost positive recognition
    ['energetic', 1.1],
    ['calm', 1.0],
    ['neutral', 0.5]
  ];

  // Apply contextual mood detection
  moodPriority.forEach(([mood, weight]) => {
    const contextualScore = scores[mood] * weight;
    if (contextualScore > maxScore) {
      dominantMood = mood;
      maxScore = contextualScore;
    }
  });

  // Quick triggers for immediate mood changes
  if (isAggressive && cleanText.length <= 10) { // Short aggressive messages
    dominantMood = 'negative';
    maxScore = 2; // Ensure it takes precedence
  }

  // Dynamic intensity calculation
  const baseIntensity = dominantMood === 'neutral' ? 50 : 70;
  const toneIntensity = (isAggressive ? 25 : 0) + 
                       (isEmphatic ? 15 : 0) + 
                       (hasMultipleMarks ? 10 : 0);
  const intensity = Math.min(100, baseIntensity + toneIntensity);

  // AI response generation with rate limiting
  const timeSinceLastAI = now - messageTracker.lastAIResponse;
  if (messageTracker.count % 15 === 0 && timeSinceLastAI > 30000) { // 30s minimum between AI responses
    const responses = aiResponses[dominantMood];
    const response = responses[Math.floor(Math.random() * responses.length)];
    messageTracker.lastAIResponse = now;
    
    setTimeout(() => {
      if (global.io) {
        global.io.emit('chat_message', {
          text: response,
          username: 'MoodCanvas AI',
          timestamp: now,
          isAI: true
        });
      }
    }, 1000);
  }

  return {
    type: dominantMood,
    intensity,
    timestamp: Date.now()
  };
}