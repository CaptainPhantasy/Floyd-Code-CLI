#!/usr/bin/env python3
"""
Vectorize GLM 4.7 Datasheet - TF-IDF based embeddings
Uses scikit-learn for better quality embeddings.
"""

import json
import sys
import os
from pathlib import Path
from typing import List, Dict, Any

# Try to import sklearn
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    import numpy as np
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


def create_tfidf_embeddings(texts: List[str], max_features: int = 384) -> List[List[float]]:
    """Create TF-IDF based embeddings."""
    if not SKLEARN_AVAILABLE:
        raise ImportError("scikit-learn not available")

    vectorizer = TfidfVectorizer(
        max_features=max_features,
        stop_words='english',
        ngram_range=(1, 2),
        norm='l2'
    )

    # Fit on all texts
    tfidf_matrix = vectorizer.fit_transform(texts)

    # Convert to list of lists
    return tfidf_matrix.toarray().tolist()


def chunk_text(text: str, chunk_size: int = 1500, overlap: int = 150) -> List[Dict[str, Any]]:
    """Split text into chunks with metadata."""
    chunks = []
    start = 0
    chunk_id = 0

    while start < len(text):
        end = start + chunk_size
        chunk_text = text[start:end]

        # Try to break at sentence boundary
        if end < len(text):
            last_period = chunk_text.rfind('.')
            last_newline = chunk_text.rfind('\n')
            break_point = max(last_period, last_newline)
            if break_point > chunk_size // 2:
                chunk_text = chunk_text[:break_point + 1]
                end = start + break_point + 1

        # Extract title
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


def build_vectors(
    datasheet_path: str = "/Volumes/Storage/GLM LLM DATASHEETS/GLM 4.7.md",
    output_path: str = "/Volumes/Storage/FLOYD_CLI/RepoGod/glm47_tfidf_vectors.json"
):
    """Build TF-IDF vectors."""
    print(f"Reading: {datasheet_path}")
    with open(datasheet_path, 'r', encoding='utf-8') as f:
        text = f.read()

    print(f"Size: {len(text):,} chars")

    print("Chunking...")
    chunks = chunk_text(text)
    print(f"Chunks: {len(chunks)}")

    print("Creating TF-IDF embeddings...")
    texts = [c["content"] for c in chunks]
    embeddings = create_tfidf_embeddings(texts)

    for i, chunk in enumerate(chunks):
        chunk["embedding"] = embeddings[i]

    result = {
        "metadata": {
            "source": datasheet_path,
            "method": "tf-idf",
            "dimensions": len(embeddings[0]) if embeddings else 0,
            "num_chunks": len(chunks),
            "created_at": str(os.popen("date").read().strip())
        },
        "chunks": [
            {
                "id": c["id"],
                "title": c["title"],
                "content_preview": c["content"][:200] + "..." if len(c["content"]) > 200 else c["content"],
                "embedding": c["embedding"]
            }
            for c in chunks
        ]
    }

    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"\nSaved: {output_path}")
    print(f"  Size: {os.path.getsize(output_path) / 1024 / 1024:.1f} MB")

    return result


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Cosine similarity."""
    import numpy as np
    a_arr = np.array(a)
    b_arr = np.array(b)
    return float(np.dot(a_arr, b_arr) / (np.linalg.norm(a_arr) * np.linalg.norm(b_arr)))


def search(query: str, vectors_path: str, top_k: int = 3):
    """Search vectors."""
    import numpy as np

    with open(vectors_path, "r") as f:
        data = json.load(f)

    # Create query embedding
    vectorizer = TfidfVectorizer(max_features=data["metadata"]["dimensions"], stop_words='english')
    texts = [c["content_preview"] for c in data["chunks"]]
    vectorizer.fit(texts)
    query_emb = vectorizer.transform([query]).toarray()[0].tolist()

    # Calculate similarities
    results = []
    for chunk in data["chunks"]:
        sim = cosine_similarity(query_emb, chunk["embedding"])
        results.append({
            "title": chunk["title"],
            "content_preview": chunk["content_preview"],
            "similarity": sim
        })

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:top_k]


def main():
    if len(sys.argv) < 2:
        print("GLM 4.7 Vectorizer (TF-IDF)")
        print("=" * 40)
        print("\nUsage:")
        print("  python vectorize_glm_tfidf.py build")
        print("  python vectorize_glm_tfidf.py search \"<query>\"")
        sys.exit(1)

    command = sys.argv[1]

    if command == "build":
        if not SKLEARN_AVAILABLE:
            print("Installing scikit-learn...")
            import subprocess
            subprocess.run([sys.executable, "-m", "pip", "install", "scikit-learn", "-q", "--user"])
        build_vectors()

    elif command == "search":
        query = " ".join(sys.argv[2:])
        vectors_path = "/Volumes/Storage/FLOYD_CLI/RepoGod/glm47_tfidf_vectors.json"

        if not Path(vectors_path).exists():
            print("Vectors not found. Run: python vectorize_glm_tfidf.py build")
            sys.exit(1)

        results = search(query, vectors_path)

        print(f"\nResults for: {query}")
        print("=" * 40)
        for i, r in enumerate(results, 1):
            print(f"\n[{i}] {r['title']} ({r['similarity']:.3f})")
            print(f"    {r['content_preview'][:150]}...")


if __name__ == "__main__":
    main()
