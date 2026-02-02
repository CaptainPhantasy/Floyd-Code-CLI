import json
import numpy as np
import sys
import os
from sentence_transformers import SentenceTransformer
import warnings
warnings.filterwarnings("ignore") # suppress torch warnings for clean output

# Determine the directory of the script to find the json file reliably
script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, "glm_vectors.json")

try:
    with open(json_path) as f:
        data = json.load(f)
except FileNotFoundError:
    print(f"Error: Could not find vector database at {json_path}")
    sys.exit(1)

# Get query from args or default
query = sys.argv[1] if len(sys.argv) > 1 else "GLM architecture"

model = SentenceTransformer('all-MiniLM-L6-v2')
query_emb = model.encode(query)

results = []
for s in data["sections"]:
    emb = np.array(s["embedding"])
    # Cosine similarity
    sim = np.dot(query_emb, emb) / (np.linalg.norm(query_emb) * np.linalg.norm(emb))
    results.append((sim, s["title"], s["content"]))

print(f"--- Search Results for '{query}' ---")
for sim, title, content in sorted(results, reverse=True)[:3]:
    print(f"[{sim:.2f}] {title}")
    # Print first line or truncated content cleanly
    preview = content.replace('\n', ' ')[:100]
    print(f"  {preview}...")
