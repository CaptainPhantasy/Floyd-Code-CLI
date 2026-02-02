#!/usr/bin/env python3
"""
Co-LLM Router - Specialist Sub-Agent Delegation
Implements MIT CSAIL Collaborative Swarm Architecture for routing to specialist personas.
"""

import sys
import json
from pathlib import Path

# Load specialists configuration
SPECIALISTS_FILE = Path(__file__).parent / "specialists.json"


def load_specialists() -> dict:
    """Load specialist personas from config."""
    with open(SPECIALISTS_FILE, "r") as f:
        return json.load(f)


def route_to_specialist(task: str, context: str = "") -> dict:
    """
    Analyze task and recommend specialist persona(s).

    Returns:
        {
            "recommended_specialist": "name",
            "confidence": 0.0-1.0,
            "trigger_keywords": [...],
            "persona": "...",
            "reasoning": "..."
        }
    """
    config = load_specialists()
    specialists = config["specialists"]

    task_lower = task.lower() + " " + context.lower()

    # Score each specialist
    scores = {}
    for name, spec in specialists.items():
        score = 0
        matched = []
        for keyword in spec["trigger_keywords"]:
            if keyword.lower() in task_lower:
                score += 1
                matched.append(keyword)
        if matched:
            scores[name] = {"score": score, "matched": matched}

    if not scores:
        return {
            "recommended_specialist": None,
            "confidence": 0.0,
            "trigger_keywords": [],
            "persona": "Generalist - Use standard engineering best practices.",
            "reasoning": "No specific specialist triggers detected.",
            "all_scores": {}
        }

    # Find highest score
    best_name = max(scores, key=lambda k: scores[k]["score"])
    best = scores[best_name]
    specialist = specialists[best_name]

    # Calculate confidence
    total_matches = sum(s["score"] for s in scores.values())
    confidence = best["score"] / max(total_matches, 1)

    # Check for multi-specialist scenario
    if len([s for s in scores.values() if s["score"] >= 2]) >= 2:
        multi = [k for k, v in scores.items() if v["score"] >= 2]
        return {
            "recommended_specialist": "multi",
            "confidence": round(confidence, 2),
            "trigger_keywords": best["matched"],
            "persona": f"Combine perspectives from: {', '.join(multi)}",
            "reasoning": f"Multiple specialists triggered. Consider combining: {', '.join(multi)}",
            "all_scores": {k: v["score"] for k, v in scores.items()},
            "specialists_to_combine": [
                {"name": k, "specialist": specialists[k]}
                for k in multi
            ]
        }

    return {
        "recommended_specialist": best_name,
        "confidence": round(confidence, 2),
        "trigger_keywords": best["matched"],
        "persona": specialist["persona"],
        "strengths": specialist["strengths"],
        "reasoning": f"Matched {best['score']} keywords: {', '.join(best['matched'])}",
        "all_scores": {k: v["score"] for k, v in scores.items()}
    }


def generate_specialist_prompt(task: str, routing_result: dict) -> str:
    """Generate a prompt optimized for the recommended specialist."""
    if not routing_result["recommended_specialist"]:
        return task

    if routing_result["recommended_specialist"] == "multi":
        lines = [
            f"# Multi-Specialist Task\n",
            f"You are operating as a coordinated team of specialists.\n"
        ]
        for spec in routing_result.get("specialists_to_combine", []):
            lines.append(f"## {spec['name']}")
            lines.append(f"{spec['persona']}\n")
            lines.append(f"Strengths: {', '.join(spec['strengths'])}\n")
        lines.extend([
            f"\n## Task",
            f"{task}\n",
            f"## Instruction",
            f"Synthesize perspectives from all relevant specialists above to provide a comprehensive solution."
        ])
        return "\n".join(lines)

    specialist = routing_result["recommended_specialist"]
    return f"""# {routing_result['trigger_keywords'][0].upper()} Specialist Task

## Persona
{routing_result['persona']}

## Your Strengths
{', '.join(routing_result['strengths'])}

## Task
{task}

## Instruction
Apply your specialist expertise to this task. Think from your unique perspective and provide insights that a generalist might miss.
"""


def main():
    if len(sys.argv) < 2:
        config = load_specialists()
        print("Co-LLM Router - Specialist Sub-Agent Delegation")
        print("=" * 50)
        print("\nAvailable specialists:")
        for name, spec in config["specialists"].items():
            print(f"  - {name}: {spec['name']}")
        print(f"\nUsage: python router.py \"<task>\" [context]")
        print("\nExample:")
        print('  python router.py "Refactor the authentication module"')
        sys.exit(1)

    task = sys.argv[1]
    context = sys.argv[2] if len(sys.argv) > 2 else ""

    result = route_to_specialist(task, context)

    print("\n" + "="*60)
    print(f"TASK: {task}")
    print("="*60)
    print(f"\nRecommended Specialist: {result.get('recommended_specialist', 'Generalist')}")
    print(f"Confidence: {result.get('confidence', 0)*100}%")
    print(f"Matched Keywords: {result.get('trigger_keywords', [])}")
    print(f"\nReasoning: {result.get('reasoning', '')}")

    if result.get('recommended_specialist') and result.get('recommended_specialist') != "multi":
        print(f"\nSpecialist Persona:")
        print(f"  {result.get('persona', '')}")

    print("\n" + "="*60)
    print("\nGENERATED SPECIALIST PROMPT:")
    print("="*60)
    print(generate_specialist_prompt(task, result))
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
