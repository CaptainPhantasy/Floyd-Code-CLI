#!/usr/bin/env python3
"""
Instance-Adaptive Scaling - Complexity Assessor
Implements MIT CSAIL technique for dynamic compute allocation based on task complexity.
"""

import sys
import json
import os
from pathlib import Path

# Complexity indicators
COMPLEXITY_TRIGGERS = {
    "HIGH": [
        "refactor", "architecture", "design", "system", "rewrite",
        "migration", "integration", "orchestration", "pipeline",
        "agent", "multi", "distributed", "async", "concurrent",
        "database", "schema", "api", "protocol", "authentication",
        "authorization", "security", "encryption", "vector", "embedding"
    ],
    "MEDIUM": [
        "add", "create", "implement", "build", "feature",
        "function", "class", "component", "module", "handler",
        "endpoint", "route", "middleware", "service", "utility"
    ],
    "LOW": [
        "fix", "typo", "rename", "move", "delete", "remove",
        "update", "change", "format", "lint", "comment", "docs"
    ]
}

SCOPE_MULTIPLIERS = {
    "entire": 3.0,
    "all": 3.0,
    "full": 2.5,
    "whole": 2.5,
    "multiple": 2.0,
    "each": 1.8,
    "several": 1.5,
}

def assess_complexity(task: str) -> dict:
    """
    Assess task complexity and return recommended execution mode.

    Returns:
        {
            "complexity": "LOW" | "MEDIUM" | "HIGH",
            "mode": "DIRECT" | "PLANNED" | "DEEP_REASONING",
            "confidence": 0.0-1.0,
            "reasoning": "...",
            "steps": [...]
        }
    """
    task_lower = task.lower()

    # Count keyword matches
    scores = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for level, keywords in COMPLEXITY_TRIGGERS.items():
        for keyword in keywords:
            if keyword in task_lower:
                scores[level] += 1

    # Apply scope multipliers
    multiplier = 1.0
    for scope, mult in SCOPE_MULTIPLIERS.items():
        if scope in task_lower:
            multiplier = mult
            break

    # Calculate final score
    weighted = (scores["HIGH"] * 3 + scores["MEDIUM"] * 2 + scores["LOW"] * 1) * multiplier

    # Determine complexity
    if weighted >= 6 or scores["HIGH"] >= 2:
        complexity = "HIGH"
        mode = "DEEP_REASONING"
        confidence = min(0.95, 0.6 + weighted * 0.05)
        steps = [
            "1. DEEP_REASONING_MODE: Enable extended reasoning",
            "2. Run RLM_Context_Processor/scan.py on affected paths",
            "3. Check Co_LLM_Router/specialists.json for relevant personas",
            "4. Generate step-by-step plan in logs/execution_plan.md",
            "5. Verify assumptions BEFORE writing code",
            "6. Execute with validation checks"
        ]
        reasoning = f"High complexity detected (score: {weighted:.1f}). Multiple triggers: {list(k for k in COMPLEXITY_TRIGGERS['HIGH'] if k in task_lower)}. Scope multiplier: {multiplier}x."
    elif weighted >= 3 or scores["MEDIUM"] >= 1:
        complexity = "MEDIUM"
        mode = "PLANNED"
        confidence = min(0.85, 0.5 + weighted * 0.08)
        steps = [
            "1. PLANNED_MODE: Create brief execution plan",
            "2. Read affected files",
            "3. Check for relevant specialists",
            "4. Execute with verification",
            "5. Log results"
        ]
        reasoning = f"Medium complexity detected (score: {weighted:.1f}). Moderate task with clear scope."
    else:
        complexity = "LOW"
        mode = "DIRECT"
        confidence = 0.9
        steps = [
            "1. DIRECT_MODE: Execute immediately",
            "2. Verify change"
        ]
        reasoning = f"Low complexity detected (score: {weighted:.1f}). Simple, well-defined action."

    return {
        "task": task,
        "complexity": complexity,
        "mode": mode,
        "confidence": round(confidence, 2),
        "raw_score": round(weighted, 2),
        "reasoning": reasoning,
        "steps": steps
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python assess.py \"<task_description>\"")
        print("\nExample:")
        print('  python assess.py "Refactor the authentication module"')
        sys.exit(1)

    task = " ".join(sys.argv[1:])
    result = assess_complexity(task)

    # Print result
    print("\n" + "="*60)
    print(f"TASK: {result['task']}")
    print(f"COMPLEXITY: {result['complexity']}")
    print(f"MODE: {result['mode']}")
    print(f"CONFIDENCE: {result['confidence']*100}%")
    print(f"\nREASONING: {result['reasoning']}")
    print(f"\nRECOMMENDED STEPS:")
    for step in result['steps']:
        print(f"  {step}")
    print("="*60 + "\n")

    # Save to log
    log_dir = Path(__file__).parent.parent / "logs"
    log_dir.mkdir(exist_ok=True)
    log_file = log_dir / f"complexity_assessment_{os.urandom(4).hex()}.json"
    with open(log_file, "w") as f:
        json.dump(result, f, indent=2)
    print(f"Assessment logged to: {log_file}")


if __name__ == "__main__":
    main()
