## REPOGOD - Key Understanding

### Core Architecture:
1. **RLM (Recursive Language Models)** - For 1M+ token contexts, large file trees, system-wide refactoring
   - Read -> Chunk -> Summarize/Extract -> Aggregate
   - Treat codebase as external environment to be queried

2. **Instance-Adaptive Scaling** - For efficiency
   - Low Complexity: Execute immediately
   - High Complexity: Generate reasoning paths, create plan, verify assumptions

3. **Co-LLM (Collaborative Swarm)** - For specialization
   - Delegate to specialist, integrate output

4. **PASTA (Parallel Structure Annotation)** - For throughput
   - Generate artifacts in parallel for repetitive boilerplate

5. **Neuro-Symbolic Fusion (DisCIPL)** - For precision
   - Use symbolic planner, write proofs/tests before committing

### Vector Knowledge System:
- `search.py` - Semantic search against GLM-4.7 datasheet
- `glm_vectors.json` - Vector database of GLM-4.7 specifications
- Uses sentence-transformers (all-MiniLM-L6-v2) for embeddings

### Operational Mandates:
1. The Code is Sacred - Don't break the build
2. Tool First - Inspect state before hallucinating
3. Logs are Memory - Write intermediate thoughts to logs/
4. Self-Evolution - Write new tools when gaps found

### Start Sequence:
1. Check logs for previous state
2. Run Adaptive_Scaler on request
3. Formulate Plan
4. Execute
Reading RepoGod documentation to understand ideal prompting architecture...

Key files to analyze:
1. /Volumes/Storage/FLOYD_CLI/RepoGod/prompt.md - Main RepoGod prompt
2. /Volumes/Storage/FLOYD_CLI/RepoGod/vectorize.py - Vector DB creation
3. /Volumes/Storage/FLOYD_CLI/RepoGod/search.py - Semantic search
4. /Volumes/Storage/FLOYD_CLI/RepoGod/Adaptive_Scaler/ - Complexity assessment
5. Check other cognitive architecture folders