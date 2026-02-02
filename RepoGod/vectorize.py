import json
from sentence_transformers import SentenceTransformer
from pathlib import Path

# Read datasheet
try:
    with open("/Volumes/Storage/GLM LLM DATASHEETS/GLM 4.7.md") as f:
        text = f.read()
except FileNotFoundError:
    print("Error: Datasheet not found at /Volumes/Storage/GLM LLM DATASHEETS/GLM 4.7.md")
    exit(1)

# Split into sections
sections = []
current = []
current_title = "Introduction"
for line in text.split('\n'):
    if line.startswith('#') and not line.startswith('##'):
        if current:
            sections.append({"title": current_title, "content": "\n".join(current)})
        current_title = line.lstrip('#').strip()
        current = []
    else:
        current.append(line)

if current:
    sections.append({"title": current_title, "content": "\n".join(current)})

# Create embeddings
print("Loading model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print(f"Vectorizing {len(sections)} sections...")

result = {"sections": []}
for section in sections:
    # Embedding the first 1000 chars of content for efficiency/context limit
    embedding = model.encode(section["content"][:1000]).tolist()
    result["sections"].append({
        "title": section["title"],
        "content": section["content"][:500], # Storing first 500 chars for preview
        "embedding": embedding
    })

with open("glm_vectors.json", "w") as f:
    json.dump(result, f, indent=2)

print(f"Created glm_vectors.json with {len(result['sections'])} sections")
