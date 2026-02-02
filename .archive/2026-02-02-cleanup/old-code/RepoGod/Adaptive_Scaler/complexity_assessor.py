import sys
import re

def assess_complexity(user_input):
    """
    Determines the complexity of a task to decide the reasoning depth.
    This is a heuristic-based simulation of an Instance-Adaptive Scaling model.
    """
    complexity_score = 0
    keywords = {
        "high": ["refactor", "architect", "rewrite", "optimize", "system", "integrate", "debug"],
        "medium": ["add", "create", "update", "fix", "test"],
        "low": ["typo", "rename", "format", "style"]
    }

    # Length heuristic
    if len(user_input.split()) > 50:
        complexity_score += 2
    
    # Keyword analysis
    lower_input = user_input.lower()
    for word in keywords["high"]:
        if word in lower_input:
            complexity_score += 3
    for word in keywords["medium"]:
        if word in lower_input:
            complexity_score += 1
    
    # Classification
    if complexity_score >= 4:
        mode = "DEEP_REASONING"
        steps = "1. Plan  2. Audit  3. Prototype  4. Implement  5. Verify"
    elif complexity_score >= 2:
        mode = "STANDARD"
        steps = "1. Understand  2. Implement  3. Verify"
    else:
        mode = "FAST_PATH"
        steps = "1. Execute"

    return {
        "score": complexity_score,
        "mode": mode,
        "recommended_steps": steps
    }

if __name__ == "__main__":
    prompt = sys.argv[1] if len(sys.argv) > 1 else "default task"
    result = assess_complexity(prompt)
    print(f"--- Adaptive Scaling Assessment ---")
    print(f"Input: {prompt[:50]}...")
    print(f"Complexity Score: {result['score']}")
    print(f"Operational Mode: {result['mode']}")
    print(f"Strategy: {result['recommended_steps']}")
