#!/usr/bin/env python3
"""
GLM Embedding API Client for Z.AI (ZhipuAI)
Uses embedding-2 or embedding-3 models for text vectorization

Supports both Standard API and GLM Coding Plan endpoints:
    - Standard: https://api.z.ai/api/paas/v4/
    - Coding: https://api.z.ai/api/coding/paas/v4/

Requirements:
    - Valid Z.AI API key from https://z.ai/model-api
    - Python 3.7+ (no external dependencies - uses urllib)

API Documentation:
    - https://docs.bigmodel.cn/cn/guide/models/embedding/embedding-3
    - https://docs.bigmodel.cn/cn/guide/models/embedding/embedding-2
"""

import json
import sys
import urllib.request
import urllib.error
import os
from typing import Union, List, Optional


# ============================================================================
# CONFIGURATION
# ============================================================================

# Get API key from environment variable or use default
API_KEY = os.getenv("ZHIPU_API_KEY", "f5b393c34e254182b9f4d154cf214494.4QO0WXhK920dgu1p")

# Use Coding endpoint for GLM Coding Plan subscribers
CODING_MODE = os.getenv("GLM_CODING_MODE", "true").lower() == "true"

# API Endpoints
if CODING_MODE:
    BASE_URL = "https://api.z.ai/api/coding/paas/v4"
    print("Using GLM Coding Plan endpoint")
else:
    BASE_URL = "https://api.z.ai/api/paas/v4"

CHAT_ENDPOINT = f"{BASE_URL}/chat/completions"
EMBEDDING_ENDPOINT = f"{BASE_URL}/embeddings"

# Available embedding models
EMBEDDING_MODELS = {
    "embedding-3": {"dimensions": "512-2048 (customizable)", "default_dim": 2048},
    "embedding-2": {"dimensions": "1024 (fixed)", "default_dim": 1024},
}


# ============================================================================
# API FUNCTIONS
# ============================================================================

def _make_request(endpoint: str, data: dict) -> dict:
    """Make HTTP POST request to Z.AI API."""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    req = urllib.request.Request(
        endpoint,
        data=json.dumps(data).encode('utf-8'),
        headers=headers,
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        raise Exception(f"API Error {e.code}: {error_body}")
    except urllib.error.URLError as e:
        raise Exception(f"Network Error: {e.reason}")


def get_embedding(
    text: Union[str, List[str]],
    model: str = "embedding-3",
    dimensions: Optional[int] = None
) -> dict:
    """
    Get text embeddings from Z.AI API.

    Args:
        text: Single text string or list of texts
        model: "embedding-2" or "embedding-3"
        dimensions: Vector dimensions (512-2048, only for embedding-3)

    Returns:
        API response with embeddings

    Raises:
        Exception: If API call fails
    """
    if model not in EMBEDDING_MODELS:
        raise ValueError(f"Unknown model: {model}. Available: {list(EMBEDDING_MODELS.keys())}")

    data = {"model": model, "input": text}

    if dimensions:
        if model == "embedding-2":
            print(f"Warning: embedding-2 has fixed dimensions. Ignoring custom dimensions.")
        else:
            if not (512 <= dimensions <= 2048):
                raise ValueError("Dimensions must be between 512 and 2048 for embedding-3")
            data["dimensions"] = dimensions

    return _make_request(EMBEDDING_ENDPOINT, data)


def test_api_key() -> bool:
    """Test if the API key is valid by calling a free model."""
    try:
        data = {
            "model": "glm-4.7-flash",
            "messages": [{"role": "user", "content": "Hi"}],
            "max_tokens": 5
        }
        response = _make_request(CHAT_ENDPOINT, data)
        return "choices" in response
    except Exception as e:
        print(f"Debug: {e}")
        return False


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def print_embedding_info(result: dict):
    """Print embedding information in a readable format."""
    print(f"\n{'='*60}")
    print(f"Model: {result.get('model', 'unknown')}")
    print(f"Object: {result.get('object', 'unknown')}")
    print(f"\nUsage:")
    usage = result.get('usage', {})
    print(f"  Prompt tokens: {usage.get('prompt_tokens', 0)}")
    print(f"  Total tokens: {usage.get('total_tokens', 0)}")

    print(f"\nGenerated {len(result.get('data', []))} embedding(s):")
    for item in result.get('data', []):
        embedding = item.get('embedding', [])
        idx = item.get('index', 0)
        print(f"  [{idx}] Dimensions: {len(embedding)}")
        if embedding:
            print(f"      First 5 values: {embedding[:5]}")
            print(f"      Last 5 values: {embedding[-5:]}")
    print(f"{'='*60}\n")


def save_result(result: dict, filename: str = "embedding_result.json"):
    """Save embedding result to JSON file."""
    with open(filename, "w") as f:
        json.dump(result, f, indent=2)
    print(f"Result saved to: {filename}")


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("GLM Embedding API Client for Z.AI (ZhipuAI)")
        print("=" * 50)
        print("\nUsing GLM Coding Plan endpoint")
        print(f"Endpoint: {EMBEDDING_ENDPOINT}")
        print("\nUsage: python glm_embeddings.py <text> [model] [dimensions]")
        print("\nExamples:")
        print('  python glm_embeddings.py "Hello world"')
        print('  python glm_embeddings.py "Hello world" embedding-3')
        print('  python glm_embeddings.py "Hello world" embedding-3 512')
        print('  python glm_embeddings.py "Hello world" embedding-2')
        print("\nAvailable models:")
        for model, info in EMBEDDING_MODELS.items():
            print(f"  - {model}: {info['dimensions']}")
        print("\nSet ZHIPU_API_KEY environment variable to override default.")
        sys.exit(1)

    # Test API key first
    print("Testing API key...")
    if not test_api_key():
        print("\n⚠️  API Key Error!")
        print("Your API key may be invalid or lacks access to these models.")
        print("\nTo get a valid API key:")
        print("  1. Visit: https://z.ai/model-api")
        print("  2. Register/login")
        print("  3. Create an API key")
        print("  4. Set environment variable: export ZHIPU_API_KEY=your-key")
        print("\nCommon error codes:")
        print("  1211: Model not available with your API key")
        print("  401: Invalid API key")
        sys.exit(1)
    print("✓ API key is valid\n")

    # Parse arguments
    text = sys.argv[1]
    model = sys.argv[2] if len(sys.argv) > 2 else "embedding-3"
    dimensions = int(sys.argv[3]) if len(sys.argv) > 3 else None

    try:
        result = get_embedding(text, model, dimensions)
        print_embedding_info(result)
        save_result(result)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
