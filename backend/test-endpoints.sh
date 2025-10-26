#!/bin/bash

# Test health endpoint
echo "Testing health endpoint..."
curl http://localhost:3000/health

# Create a test session
echo -e "\n\nCreating test session..."
SESSION_ID=$(curl -s -X POST http://localhost:3000/api/session/create | jq -r '.id')
echo "Created session: $SESSION_ID"

# Test sentiment analysis
echo -e "\n\nTesting sentiment analysis..."
curl -X POST http://localhost:3000/api/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"I am feeling really happy today!\", \"sessionId\": \"$SESSION_ID\"}"

# Get current mood
echo -e "\n\nGetting current mood..."
curl http://localhost:3000/api/sentiment/$SESSION_ID/mood

# Force cleanup (admin endpoint)
echo -e "\n\nTesting cleanup endpoint..."
curl -X POST http://localhost:3000/admin/cleanup