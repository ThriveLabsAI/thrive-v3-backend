#!/bin/bash
# thrive-v3-backend Deploy Script
# Usage: ./deploy.sh [--production]
# Uses gcloud service account auth (firebase-adminsdk-qn2g9@thrive-8e99c)

set -euo pipefail

echo "=== Building functions ==="
cd "$(dirname "$0")/functions"
npx tsc
echo "Build successful"

cd ..

echo ""
echo "=== Getting auth token ==="
TOKEN=$(gcloud auth print-access-token 2>/dev/null || \
  sudo /snap/bin/gcloud auth print-access-token 2>/dev/null)

if [ -z "$TOKEN" ] || [ ${#TOKEN} -lt 50 ]; then
  echo "ERROR: Failed to get gcloud access token."
  echo "Run: gcloud auth activate-service-account --key-file=<path> --project=thrive-8e99c"
  exit 1
fi
echo "Token acquired (${#TOKEN} chars)"

echo ""
echo "=== Deploying firestore rules ==="
npx firebase deploy --only firestore:rules --project thrive-8e99c --token "$TOKEN"

echo ""
echo "=== Deploying firestore indexes ==="
npx firebase deploy --only firestore:indexes --project thrive-8e99c --token "$TOKEN"

echo ""
echo "=== Deploying functions ==="
npx firebase deploy --only functions --project thrive-8e99c --token "$TOKEN"

echo ""
echo "=== Verifying health ==="
sleep 3
curl -s --max-time 10 "https://us-central1-thrive-8e99c.cloudfunctions.net/api/v3/health" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(f'Health: {d[\"status\"]} (v{d[\"version\"]})')" 2>/dev/null || echo "Health check failed"

echo ""
echo "=== Deploy complete ==="
