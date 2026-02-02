#!/usr/bin/env python3
"""
Vectorize GLM 4.7 Datasheet
Creates embeddings for GLM 4.7 documentation using local sentence-transformers.
"""

import json
import sys
import os
from pathlib import Path
from typing import List, Dict, Any

try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    print("Installing sentence-transformers...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "sentence-transformers", "-q"])
    from sentence_transformers import SentenceTransformer
    import numpy as np


# Chunk the datasheet into manageable pieces
CHUNK_SIZE = 500  # characters per chunk
OVERLAP = 50  # character overlap between chunks


def read_datasheet(path: str) -> str:
    """Read the GLM 4.7 datasheet."""
    p = Path(path)
    if not p.exists():
        # Try default location
        p = Path("/Volumes/Storage/GLM LLM DATASHEETS/GLM 4.7.md")
    if not p.exists():
        raise FileNotFoundError(f"Datasheet not found at: {path}")
    with open(p, "r") as f:
        return f.read()


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = OVERLAP) -> List[str]:
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
    return chunks


def create_embeddings(texts: List[str], model_name: str = "all-MiniLM-L6-v2") -> List[List[float]]:
    """Create embeddings for text chunks."""
    print(f"Loading model: {model_name}...")
    model = SentenceTransformer(model_name)
    print(f"Creating embeddings for {len(texts)} chunks...")
    embeddings = model.encode(texts, show_progress_bar=True)
    return embeddings.tolist()


def extract_sections(text: str) -> List[Dict[str, Any]]:
    """Extract meaningful sections from the markdown datasheet."""
    sections = []
    current_section = {"title": "Introduction", "content": []}

    lines = text.split("\n")
    for line in lines:
        if line.startswith("#") and not line.startswith("##"):
            # Save previous section
            if current_section["content"]:
                content = "\n".join(current_section["content"])
                if content.strip():
                    sections.append({
                        "title": current_section["title"],
                        "content": content
                    })
            # Start new section
            current_section = {"title": line.lstrip("#").strip(), "content": []}
        else:
            current_section["content"].append(line)

    # Don't forget last section
    if current_section["content"]:
        content = "\n".join(current_section["content"])
        if content.strip():
            sections.append({
                "title": current_section["title"],
                "content": content
            })

    return sections


def vectorize_datasheet(
    datasheet_path: str = "/Volumes/Storage/GLM LLM DATASHEETS/GLM 4.7.md",
    output_path: str = "/Volumes/Storage/FLOYD_CLI/RepoGod/glm47_vectors.json"
) -> Dict[str, Any]:
    """
    Vectorize the GLM 4.7 datasheet into searchable embeddings.

    Returns:
        {
            "metadata": {...},
            "sections": [
                {
                    "title": "...",
                    "content": "...",
                    "embedding": [...]
                }
            ]
        }
    """
    print(f"Reading datasheet from: {datasheet_path}")
    text = read_datasheet(datasheet_path)

    print(f"Extracting sections...")
    sections = extract_sections(text)
    print(f"Found {len(sections)} sections")

    print(f"Creating embeddings...")
    texts = [s["content"][:1000] for s in sections]  # Truncate long content
    embeddings = create_embeddings(texts)

    result = {
        "metadata": {
            "source": datasheet_path,
            "model": "all-MiniLM-L6-v2",
            "dimensions": len(embeddings[0]) if embeddings else 0,
            "num_sections": len(sections),
            "created_at": str(os.popen("date").read().strip())
        },
        "sections": []
    }

    for i, (section, embedding) in enumerate(zip(sections, embeddings)):
        result["sections"].append({
            "index": i,
            "title": section["title"],
            "content": section["content"][:500],  # Preview
            "embedding": embedding
        })

    # Save
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"\n✓ Vectorized datasheet saved to: {output_path}")
    print(f"  - Sections: {len(sections)}")
    print(f"  - Dimensions: {result['metadata']['dimensions']}")
    print(f"  - Total size: {os.path.getsize(output_path) / 1024 / 1024:.1f} MB")

    return result


def search_vectors(query: str, vectors_path: str, top_k: int = 3) -> List[Dict]:
    """Search the vectorized datasheet for relevant sections."""
    from sentence_transformers import SentenceModel

    with open(vectors_path, "r") as f:
        data = json.load(f)

    model = SentenceTransformer("all-MiniLM-L6-v2")
    query_embedding = model.encode([query])[0]

    # Calculate cosine similarity
    import numpy as np
    results = []

    for section in data["sections"]:
        emb = np.array(section["embedding"])
        query_emb = np.array(query_embedding)
        similarity = np.dot(query_emb, emb) / (np.linalg.norm(query_emb) * np.linalg.norm(emb))
        results.append({
            "title": section["title"],
            "content": section["content"],
            "similarity": float(similarity)
        })

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:top_k]


def main():
    if len(sys.argv) < 2:
        print("GLM 4.7 Datasheet Vectorizer")
        print("=" * 50)
        print("\nUsage:")
        print("  python vectorize_glm.py build    # Create embeddings")
        print("  python vectorize_glm.py search \"<query>\"  # Search embeddings")
        print("\nExamples:")
        print('  python vectorize_glm.py build')
        print('  python vectorize_glm.py search "What are the context limits?"')
        print('  python vectorize_glm.py search "How do I use the embeddings API?"')
        sys.exit(1)

    command = sys.argv[1]

    if command == "build":
        vectorize_datasheet()

    elif command == "search":
        if len(sys.argv) < 3:
            print("Usage: python vectorize_glm.py search \"<query>\"")
            sys.exit(1)

        query = " ".join(sys.argv[2:])
        vectors_path = "/Volumes/Storage/FLOYD_CLI/RepoGod/glm47_vectors.json"

        if not Path(vectors_path).exists():
            print("Vectors not found. Run: python vectorize_glm.py build")
            sys.exit(1)

        results = search_vectors(query, vectors_path)

        print(f"\nTop results for: {query}")
        print("=" * 50)
        for i, r in enumerate(results, 1):
            print(f"\n[{i}] {r['title']} (similarity: {r['similarity']:.3f})")
            print(f"    {r['content'][:200]}...")

    else:
        print(f"Unknown command: {command}")
        print("Use 'build' or 'search'")
        sys.exit(1)


if __name__ == "__main__":
    main()
