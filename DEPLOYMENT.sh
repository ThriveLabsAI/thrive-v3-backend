#!/bin/bash

# Thrive V3 Backend Deployment Script
# Usage: ./DEPLOYMENT.sh "<firebase-token>"

set -e

if [ -z "$1" ]; then
  echo "Error: Firebase token required"
  echo "Usage: ./DEPLOYMENT.sh \"<firebase-token>\""
  exit 1
fi

FIREBASE_TOKEN="$1"
PROJECT_ID="thrive-8e99c"
REGION="us-central1"

echo "===== Thrive V3 Backend Deployment ====="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Check for DEEPSEEK_API_KEY
if [ -z "$DEEPSEEK_API_KEY" ]; then
  echo "Warning: DEEPSEEK_API_KEY not set"
  echo "AI endpoints will return 503 errors until API key is configured"
  echo ""
  echo "To set: export DEEPSEEK_API_KEY=\"<key>\""
  echo "Then: firebase functions:config:set ai.deepseek_key=\"<key>\" --project $PROJECT_ID"
fi

# Build functions
echo "1. Building functions..."
cd functions
npm run build
cd ..

# Deploy
echo ""
echo "2. Deploying to Firebase..."
firebase deploy \
  --only functions,firestore:rules,firestore:indexes \
  --project "$PROJECT_ID" \
  --token "$FIREBASE_TOKEN"

# Verify deployment
echo ""
echo "3. Verifying deployment..."
firebase functions:list --project "$PROJECT_ID" --token "$FIREBASE_TOKEN"

# Get function URL
FUNCTION_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net/api"

echo ""
echo "===== Deployment Complete ====="
echo "Base URL: $FUNCTION_URL"
echo ""
echo "Test health endpoint:"
echo "  curl -i $FUNCTION_URL/v3/health"
echo ""
echo "Test with auth (requires Firebase token):"
echo "  curl -i -H 'Authorization: Bearer <token>' $FUNCTION_URL/v3/auth/profile"
echo ""
