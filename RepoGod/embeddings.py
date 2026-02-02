#!/usr/bin/env python3
"""
Text Embedding Client
Supports both local models (sentence-transformers) and Z.AI API

Local models (no API key required):
    - all-MiniLM-L6-v2: 384 dimensions, fast, English-focused
    - paraphrase-multilingual-MPNet-B: 768 dimensions, multilingual

Z.AI API models (requires valid API key):
    - embedding-3: 512-2048 dimensions (customizable)
    - embedding-2: 1024 dimensions (fixed)

Note: Z.AI embedding models may not be available with GLM Coding Plan keys.
Use local models for embedding functionality with Coding Plan subscription.
"""

import json
import sys
import os
from typing import Union, List, Optional, Dict

# Try to import optional dependencies
try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

# API Configuration
API_KEY = os.getenv("ZHIPU_API_KEY", "")
CODING_MODE = os.getenv("GLM_CODING_MODE", "true").lower() == "true"

# API Endpoints
if CODING_MODE:
    BASE_URL = "https://api.z.ai/api/coding/paas/v4"
else:
    BASE_URL = "https://api.z.ai/api/paas/v4"

EMBEDDING_ENDPOINT = f"{BASE_URL}/embeddings"


# ============================================================================
# LOCAL EMBEDDINGS (sentence-transformers)
# ============================================================================

LOCAL_MODELS = {
    "all-MiniLM-L6-v2": {
        "dimensions": 384,
        "description": "Fast, English-focused, good for general semantic search"
    },
    "paraphrase-multilingual-MPNet-B": {
        "dimensions": 768,
        "description": "Multilingual support, better for non-English text"
    },
}

_local_model_cache = {}


def get_local_embedding(text: Union[str, List[str]], model: str = "all-MiniLM-L6-v2") -> Dict:
    """
    Get embeddings using local sentence-transformers model.

    Args:
        text: Single text string or list of texts
        model: Model name from LOCAL_MODELS

    Returns:
        Dict with embedding results in API-compatible format
    """
    if not SENTENCE_TRANSFORMERS_AVAILABLE:
        raise ImportError(
            "sentence_transformers not installed. Install with:\n"
            "  pip install sentence-transformers"
        )

    if model not in LOCAL_MODELS:
        raise ValueError(f"Unknown local model: {model}. Available: {list(LOCAL_MODELS.keys())}")

    # Load model (with caching)
    if model not in _local_model_cache:
        print(f"Loading local model: {model}...")
        _local_model_cache[model] = SentenceTransformer(model)
        print(f"Model loaded.")

    model_instance = _local_model_cache[model]

    # Generate embeddings
    if isinstance(text, str):
        text = [text]

    embeddings = model_instance.encode(text, convert_to_numpy=True)

    # Calculate approximate token count (rough estimate: ~4 chars per token)
    total_chars = sum(len(t) for t in text)
    prompt_tokens = total_chars // 4

    # Format response like API
    data = []
    for idx, embedding in enumerate(embeddings):
        data.append({
            "index": idx,
            "object": "embedding",
            "embedding": embedding.tolist() if isinstance(embedding, np.ndarray) else embedding
        })

    return {
        "model": f"local/{model}",
        "object": "list",
        "data": data,
        "usage": {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": 0,
            "total_tokens": prompt_tokens
        }
    }


# ============================================================================
# Z.AI API EMBEDDINGS
# ============================================================================

def get_api_embedding(
    text: Union[str, List[str]],
    model: str = "embedding-3",
    dimensions: Optional[int] = None
) -> dict:
    """
    Get embeddings from Z.AI API.

    Note: Embedding models may not be available with GLM Coding Plan keys.
    """
    import urllib.request

    if not API_KEY:
        raise ValueError("ZHIPU_API_KEY environment variable not set")

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    data = {"model": model, "input": text}
    if dimensions and model == "embedding-3":
        data["dimensions"] = dimensions

    req = urllib.request.Request(
        EMBEDDING_ENDPOINT,
        data=json.dumps(data).encode('utf-8'),
        headers=headers,
        method='POST'
    )

    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode('utf-8'))


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def print_result(result: dict):
    """Print embedding result."""
    print(f"\n{'='*60}")
    print(f"Model: {result.get('model', 'unknown')}")
    print(f"Object: {result.get('object', 'unknown')}")

    usage = result.get('usage', {})
    print(f"\nUsage:")
    print(f"  Prompt tokens: {usage.get('prompt_tokens', 0)}")
    print(f"  Total tokens: {usage.get('total_tokens', 0)}")

    print(f"\nGenerated {len(result.get('data', []))} embedding(s):")
    for item in result.get('data', []):
        embedding = item.get('embedding', [])
        idx = item.get('index', 0)
        print(f"  [{idx}] Dimensions: {len(embedding)}")
        if embedding:
            print(f"      First 5: {embedding[:5]}")
            print(f"      Last 5: {embedding[-5:]}")
    print(f"{'='*60}\n")


def save_result(result: dict, filename: str = "embedding_result.json"):
    """Save result to JSON file."""
    with open(filename, "w") as f:
        json.dump(result, f, indent=2)
    print(f"Saved to: {filename}")


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Text Embedding Client")
        print("=" * 50)
        print("\nUsage: python embeddings.py <text> [--local|--api] [model] [dimensions]")
        print("\nLocal Models (no API key):")
        for model, info in LOCAL_MODELS.items():
            print(f"  {model}: {info['dimensions']} dim - {info['description']}")
        print("\n  Install: pip install sentence-transformers")
        print("\nAPI Models (requires ZHIPU_API_KEY):")
        print("  embedding-3: 512-2048 dim (customizable)")
        print("  embedding-2: 1024 dim (fixed)")
        print("\nExamples:")
        print('  # Local embedding (recommended for Coding Plan)')
        print('  python embeddings.py "Hello world" --local')
        print('  python embeddings.py "Hello world" --local all-MiniLM-L6-v2')
        print('\n  # API embedding (may not work with Coding Plan keys)')
        print('  export ZHIPU_API_KEY=your-key')
        print('  python embeddings.py "Hello world" --api embedding-3')
        sys.exit(1)

    text = sys.argv[1]
    mode = "--local" if "--local" in sys.argv[2:] else "--api"
    model = sys.argv[3] if len(sys.argv) > 3 else "all-MiniLM-L6-v2"

    if mode == "--api":
        model = sys.argv[3] if len(sys.argv) > 3 else "embedding-3"
        dimensions = int(sys.argv[4]) if len(sys.argv) > 4 else None
        try:
            result = get_api_embedding(text, model, dimensions)
        except Exception as e:
            print(f"\n⚠️  API Error: {e}")
            print("\nEmbedding models may not be available with GLM Coding Plan.")
            print("Try using local embeddings instead:")
            print('  python embeddings.py "Hello world" --local')
            sys.exit(1)
    else:
        # Local mode
        try:
            result = get_local_embedding(text, model)
        except ImportError as e:
            print(f"\n⚠️  {e}")
            print("\nQuick install:")
            print("  pip install sentence-transformers")
            sys.exit(1)

    print_result(result)
    save_result(result)


if __name__ == "__main__":
    main()
