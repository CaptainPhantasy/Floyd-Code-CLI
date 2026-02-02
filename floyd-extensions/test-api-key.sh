#!/bin/bash
# Test GLM-4.7 API key

set -e

echo "🧪 Testing GLM-4.7 API Key..."
echo ""

# Load API key from .env.local
source /Volumes/Storage/FLOYD_CLI/.env.local 2>/dev/null || true
source ~/.floyd/.env.local 2>/dev/null || true

API_KEY="${FLOYD_GLM_API_KEY:-${GLM_API_KEY}}"
API_ENDPOINT="${FLOYD_GLM_ENDPOINT:-https://api.z.ai/api/coding/paas/v4}"
API_MODEL="${FLOYD_GLM_MODEL:-glm-4.7}"

echo "📋 Configuration:"
echo "   API Endpoint: $API_ENDPOINT"
echo "   API Model: $API_MODEL"
echo "   API Key: ${API_KEY:0:20}...${API_KEY: -4}"
echo ""

if [ -z "$API_KEY" ]; then
  echo "❌ ERROR: No API key found!"
  echo ""
  echo "Please set FLOYD_GLM_API_KEY in either:"
  echo "   - /Volumes/Storage/FLOYD_CLI/.env.local"
  echo "   - ~/.floyd/.env.local"
  exit 1
fi

echo "🚀 Making test request..."
echo ""

# Test API
response=$(curl -s -w "\n%{http_code}" \
  -X POST \
  "$API_ENDPOINT/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"model\": \"$API_MODEL\",
    \"max_tokens\": 50,
    \"messages\": [
      {\"role\": \"user\", \"content\": \"Say hello\"}
    ]
  }")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "📡 HTTP Status: $http_code"
echo ""

if [ "$http_code" = "200" ]; then
  echo "✅ SUCCESS: API key is valid!"
  echo ""
  echo "Response:"
  echo "$body" | jq -r '.choices[0].message.content' 2>/dev/null || echo "$body"
else
  echo "❌ ERROR: API request failed!"
  echo ""
  echo "Response:"
  echo "$body" | jq . 2>/dev/null || echo "$body"
  echo ""
  echo "Check your API key and endpoint configuration."
  exit 1
fi

echo ""
echo "🎉 API key test completed successfully!"
