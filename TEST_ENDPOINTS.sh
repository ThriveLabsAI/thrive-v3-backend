#!/bin/bash

# Test script for Phase 2 endpoints
# Usage: ./TEST_ENDPOINTS.sh "<firebase-id-token>"

set -e

FUNCTION_URL="https://us-central1-thrive-8e99c.cloudfunctions.net/api"

if [ -z "$1" ]; then
  echo "Note: Running tests without auth token"
  echo "Protected endpoints will return 401"
  echo ""
  echo "Usage: ./TEST_ENDPOINTS.sh \"<firebase-id-token>\""
  echo ""
fi

TOKEN="$1"

echo "===== Testing Thrive V3 Endpoints ====="
echo "Base URL: $FUNCTION_URL"
echo ""

# Test 1: Health check
echo "1. Testing GET /v3/health (public)"
echo "---"
curl -i "$FUNCTION_URL/v3/health"
echo ""
echo ""

# Test 2: Auth profile without token
echo "2. Testing GET /v3/auth/profile (without token)"
echo "---"
curl -i "$FUNCTION_URL/v3/auth/profile"
echo ""
echo ""

# Test 3-5: Protected endpoints (require token)
if [ -n "$TOKEN" ]; then
  echo "3. Testing GET /v3/auth/profile (with token)"
  echo "---"
  curl -i -H "Authorization: Bearer $TOKEN" "$FUNCTION_URL/v3/auth/profile"
  echo ""
  echo ""

  echo "4. Testing POST /v3/generateDailyGuidance"
  echo "---"
  curl -i -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"context":"I am working on a new project"}' \
    "$FUNCTION_URL/v3/generateDailyGuidance"
  echo ""
  echo ""

  echo "5. Testing POST /v3/generateBlueprint"
  echo "---"
  curl -i -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"context":"I want to improve my health and career"}' \
    "$FUNCTION_URL/v3/generateBlueprint"
  echo ""
  echo ""

  echo "6. Testing POST /v3/sendChatMessage"
  echo "---"
  curl -i -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message":"How can I be more productive?"}' \
    "$FUNCTION_URL/v3/sendChatMessage"
  echo ""
  echo ""
else
  echo "Skipping protected endpoints tests (no token provided)"
fi

echo "===== Tests Complete ====="
