#!/usr/bin/env python3
"""
Vectorize GLM 4.7 Datasheet - Simple chunking + hash-based vectors
Works without external ML dependencies.
"""

import json
import sys
import os
import hashlib
from pathlib import Path
from typing import List, Dict, Any
from collections import Counter
import re


def simple_tokenize(text: str) -> List[str]:
    """Simple word tokenizer."""
    # Lowercase and split on non-alphanumeric
    words = re.findall(r'\b\w+\b', text.lower())
    return words


def simple_hash_embedding(text: str, dimensions: int = 384) -> List[float]:
    """
    Create a deterministic embedding-like vector using hash functions.
    This creates consistent vectors for the same text.
    """
    # Create multiple hash values for different parts of the vector
    words = simple_tokenize(text)

    # Use word frequency as base signal
    word_counts = Counter(words)
    unique_words = sorted(word_counts.keys())

    # Create vector from multiple hash-derived signals
    vector = []

    for i in range(dimensions):
        # Combine multiple hash functions for distribution
        word_idx = i % len(unique_words) if unique_words else 0
        word = unique_words[word_idx]

        # Hash-based value with position and word influence
        h = hashlib.md5(f"{word}{i}".encode())
        hash_val = int(h.hexdigest()[:8], 16)

        # Normalize to -1 to 1 range
        normalized = (hash_val / 2**32) * 2 - 1

        # Add frequency weighting
        if word in word_counts:
            freq_weight = min(word_counts[word] / 10, 1.0)
            normalized = normalized * (0.5 + 0.5 * freq_weight)

        vector.append(float(normalized))

    return vector


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = sum(x * x for x in a) ** 0.5
    mag_b = sum(y * y for y in b) ** 0.5
    return dot / (mag_a * mag_b) if mag_a and mag_b else 0.0


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> List[Dict[str, Any]]:
    """Split text into chunks with metadata."""
    chunks = []
    start = 0
    chunk_id = 0

    while start < len(text):
        end = start + chunk_size
        chunk_text = text[start:end]

        # Try to break at sentence boundary
        if end < len(text):
            # Look for sentence end
            last_period = chunk_text.rfind('.')
            last_newline = chunk_text.rfind('\n')
            break_point = max(last_period, last_newline)
            if break_point > chunk_size // 2:
                chunk_text = chunk_text[:break_point + 1]
                end = start + break_point + 1

        # Extract title (first # heading or first line)
        lines = chunk_text.split('\n')
        title = lines[0].strip() if lines else f"Chunk {chunk_id}"
        for line in lines:
            if line.strip().startswith('#'):
                title = line.strip().lstrip('#').strip()
                break

        chunks.append({
            "id": chunk_id,
            "title": title[:100],
            "content": chunk_text,
            "start": start,
            "end": end
        })

        start = end - overlap
        chunk_id += 1

    return chunks


def vectorize_glm47_datasheet(
    datasheet_path: str = "/Volumes/Storage/GLM LLM DATASHEETS/GLM 4.7.md",
    output_path: str = "/Volumes/Storage/FLOYD_CLI/RepoGod/glm47_vectors.json"
) -> Dict[str, Any]:
    """Vectorize the GLM 4.7 datasheet."""

    print(f"Reading datasheet from: {datasheet_path}")
    with open(datasheet_path, 'r', encoding='utf-8') as f:
        text = f.read()

    print(f"Datasheet size: {len(text):,} characters")

    # Chunk the text
    print("Creating chunks...")
    chunks = chunk_text(text, chunk_size=1500, overlap=150)
    print(f"Created {len(chunks)} chunks")

    # Create embeddings
    print("Creating embeddings...")
    dimensions = 384
    for chunk in chunks:
        chunk["embedding"] = simple_hash_embedding(chunk["content"], dimensions)
        chunk["dimensions"] = dimensions

    result = {
        "metadata": {
            "source": datasheet_path,
            "method": "hash-based",
            "dimensions": dimensions,
            "num_chunks": len(chunks),
            "total_chars": len(text),
            "created_at": str(os.popen("date").read().strip())
        },
        "chunks": [
            {
                "id": c["id"],
                "title": c["title"],
                "content_preview": c["content"][:200] + "..." if len(c["content"]) > 200 else c["content"],
                "embedding": c["embedding"],
                "char_range": [c["start"], c["end"]]
            }
            for c in chunks
        ]
    }

    # Save
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"\nSaved to: {output_path}")
    print(f"  Chunks: {len(chunks)}")
    print(f"  Dimensions: {dimensions}")
    print(f"  File size: {os.path.getsize(output_path) / 1024 / 1024:.1f} MB")

    return result


def search_vectors(query: str, vectors_path: str, top_k: int = 3) -> List[Dict]:
    """Search the vectorized datasheet."""
    with open(vectors_path, "r") as f:
        data = json.load(f)

    # Create query embedding
    query_emb = simple_hash_embedding(query, data["metadata"]["dimensions"])

    # Calculate similarities
    results = []
    for chunk in data["chunks"]:
        similarity = cosine_similarity(query_emb, chunk["embedding"])
        results.append({
            "title": chunk["title"],
            "content_preview": chunk["content_preview"],
            "similarity": float(similarity)
        })

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:top_k]


def main():
    if len(sys.argv) < 2:
        print("GLM 4.7 Datasheet Vectorizer (Hash-based)")
        print("=" * 50)
        print("\nUsage:")
        print("  python vectorize_glm_simple.py build    # Create embeddings")
        print("  python vectorize_glm_simple.py search \"<query>\"  # Search")
        print("\nExamples:")
        print('  python vectorize_glm_simple.py build')
        print('  python vectorize_glm_simple.py search "context length"')
        print('  python vectorize_glm_simple.py search "API endpoint"')
        sys.exit(1)

    command = sys.argv[1]

    if command == "build":
        vectorize_glm47_datasheet()

    elif command == "search":
        if len(sys.argv) < 3:
            print("Usage: python vectorize_glm_simple.py search \"<query>\"")
            sys.exit(1)

        query = " ".join(sys.argv[2:])
        vectors_path = "/Volumes/Storage/FLOYD_CLI/RepoGod/glm47_vectors.json"

        if not Path(vectors_path).exists():
            print("Vectors not found. Run: python vectorize_glm_simple.py build")
            sys.exit(1)

        results = search_vectors(query, vectors_path)

        print(f"\nTop results for: {query}")
        print("=" * 50)
        for i, r in enumerate(results, 1):
            print(f"\n[{i}] {r['title']} (similarity: {r['similarity']:.3f})")
            print(f"    {r['content_preview']}")


if __name__ == "__main__":
    main()
