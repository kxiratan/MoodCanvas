# MoodCanvas Demo Script

## Setup (Before Presentation)
1. Open three browser windows:
   - User 1 (Main presenter)
   - User 2 (Team member)
   - User 3 (Team member)
2. Position windows side by side
3. Have example chat messages ready
4. Ensure audio is working and at appropriate volume

## Introduction (30 seconds)
"Hello everyone, I'm [Name] and we're excited to present MoodCanvas, an AI-powered collaborative workspace that brings emotional intelligence to remote collaboration."

## Demo Flow

### 1. Basic Features (60 seconds)
- Start with empty canvas
- Show basic drawing tools
- Demonstrate different brush types:
  ```
  "Our canvas supports multiple brush types, each designed to capture different emotional expressions"
  - Show pen tool
  - Show marker tool
  - Show highlighter tool
  ```
- Display color palette and opacity controls

### 2. Real-time Collaboration (45 seconds)
- Have team member join session
- Show simultaneous drawing
- Demonstrate cursor tracking
- Point out real-time updates:
  ```
  "Notice how changes appear instantly across all connected users, creating a truly synchronized experience"
  ```

### 3. Mood Analysis (45 seconds)
- Open chat panel
- Type positive message:
  ```
  "I'm really excited about this project! The team has done amazing work!"
  ```
- Show mood indicator change
- Point out ambient sound transition
- Type concerned message:
  ```
  "I'm worried we might not finish in time. This is challenging."
  ```
- Show mood shift and audio adaptation

### 4. Advanced Features (60 seconds)
- Demonstrate text elements
- Show sticky notes
- Create quick collaboration example:
  ```
  1. Draw basic sketch
  2. Add text annotation
  3. Have team member respond
  4. Show mood tracking
  ```

### 5. Technical Highlights (30 seconds)
- Show WebSocket connection
- Demonstrate low latency
- Point out AI analysis speed
- Highlight scalability

## Backup Plans
### If WebSocket Fails
- Have local demo ready
- Show recorded collaboration video

### If Audio Issues
- Focus on visual mood indicators
- Demonstrate without sound

### If AI Service Slow
- Have pre-analyzed examples ready
- Show cached responses

## Closing (30 seconds)
"MoodCanvas represents the future of remote collaboration, where technology doesn't just connect our screens, but helps connect our emotions and strengthen team relationships."

## Q&A Preparation

### Common Questions & Answers

1. Q: How does the mood analysis work?
   A: "We use Claude-3 AI to analyze text and drawing patterns, considering factors like speed, pressure, and color choice to determine emotional states."

2. Q: What about privacy concerns?
   A: "All mood data is anonymized and aggregated. Individual contributions are never exposed without user consent."

3. Q: How does it scale?
   A: "Our WebSocket architecture and MongoDB integration allow us to handle 50+ concurrent users with sub-50ms latency."

4. Q: Future development plans?
   A: "We're working on advanced analytics, enterprise integration, and mobile support."

## Technical Requirements Checklist
- [ ] Backend running (Node.js/Express)
- [ ] MongoDB connected
- [ ] WebSocket server active
- [ ] Frontend built and served
- [ ] Audio system tested
- [ ] Claude AI API configured
- [ ] Demo accounts ready
- [ ] Backup demo prepared
- [ ] Network connection verified
- [ ] Presentation slides loaded

## Demo Environment Variables
```env
FRONTEND_URL=http://localhost:5173
ANTHROPIC_API_KEY=[your-key]
MONGODB_URI=mongodb://localhost:27017/moodcanvas
```