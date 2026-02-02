#!/usr/bin/env python3
"""
Neuro-Symbolic Fusion (DisCIPL) - Logical Consistency Verifier
Implements MIT CSAIL technique for ensuring logical consistency in complex reasoning.
"""

import sys
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional


# Logical constraint patterns
CONSTRAINT_PATTERNS = {
    "dependency": [
        r"requires\s+(\w+)",
        r"depends\s+on\s+(\w+)",
        r"needs\s+(\w+)",
        r"before\s+(\w+)"
    ],
    "mutual_exclusion": [
        r"either\s+(\w+)\s+or\s+(\w+)",
        r"not\s+both\s+(\w+)\s+and\s+(\w+)"
    ],
    "implication": [
        r"if\s+(\w+)\s+then\s+(\w+)",
        r"when\s+(\w+)\s+must\s+(\w+)"
    ],
    "invariant": [
        r"always\s+(\w+)",
        r"never\s+(\w+)",
        r"must\s+(?:be\s+)?(\w+)"
    ]
}


def parse_constraints(description: str) -> List[Dict[str, Any]]:
    """
    Extract logical constraints from natural language description.

    Returns list of: {type, raw_match, entities}
    """
    constraints = []
    description_lower = description.lower()

    for constraint_type, patterns in CONSTRAINT_PATTERNS.items():
        for pattern in patterns:
            matches = re.finditer(pattern, description_lower)
            for match in matches:
                constraints.append({
                    "type": constraint_type,
                    "raw_match": match.group(0),
                    "entities": match.groups(),
                    "start": match.start(),
                    "end": match.end()
                })

    return constraints


def detect_conflicts(constraints: List[Dict]) -> List[str]:
    """Detect logical conflicts in constraints."""
    conflicts = []

    # Check for mutual exclusions that are both required
    mutual_exclusions = [c for c in constraints if c["type"] == "mutual_exclusion"]
    for me in mutual_exclusions:
        entities = me["entities"]
        # Check if both entities are separately required elsewhere
        for other in constraints:
            if other["type"] in ["dependency", "invariant"]:
                for entity in entities:
                    if entity in other["entities"]:
                        conflicts.append(
                            f"CONFLICT: Mutual exclusion '{me['raw_match']}' "
                            f"conflicts with requirement '{other['raw_match']}'"
                        )

    # Check for circular dependencies
    deps = [(c["entities"][0], c["entities"][1]) for c in constraints if c["type"] == "dependency"]
    for a, b in deps:
        if (b, a) in deps:
            conflicts.append(f"CONFLICT: Circular dependency between '{a}' and '{b}'")

    return conflicts


def generate_proof_steps(description: str) -> List[str]:
    """
    Generate proof-like verification steps for a plan.
    """
    constraints = parse_constraints(description)
    conflicts = detect_conflicts(constraints)

    steps = [
        "1. LOGICAL VERIFICATION",
        "   Extracted constraints: " + str(len(constraints))
    ]

    if constraints:
        steps.append("\n   Identified constraints:")
        for c in constraints:
            steps.append(f"   - [{c['type'].upper()}] {c['raw_match']}")

    if conflicts:
        steps.append("\n   ⚠️  CONFLICTS DETECTED:")
        for conflict in conflicts:
            steps.append(f"   - {conflict}")
        steps.append("\n   RESOLUTION REQUIRED: Fix conflicts before proceeding.")
    else:
        steps.append("\n   ✓ No logical conflicts detected.")

    steps.append("\n2. VERIFICATION CHECKLIST")
    steps.append("   Before execution, verify:")
    steps.append("   [ ] All dependencies are satisfiable")
    steps.append("   [ ] No circular requirements exist")
    steps.append("   [ ] Invariants are properly defined")
    steps.append("   [ ] Edge cases are covered")

    steps.append("\n3. EXECUTION PROOF")
    steps.append("   For each step in plan:")
    steps.append("   a) State preconditions")
    steps.append("   b) Execute action")
    steps.append("   c) Verify postconditions")
    steps.append("   d) Log result")

    return steps


def generate_logical_plan(task: str) -> Dict[str, Any]:
    """
    Generate a logically verified plan for the task.
    """
    constraints = parse_constraints(task)
    conflicts = detect_conflicts(constraints)
    steps = generate_proof_steps(task)

    return {
        "task": task,
        "constraints_found": len(constraints),
        "constraints": [
            {"type": c["type"], "raw": c["raw_match"], "entities": c["entities"]}
            for c in constraints
        ],
        "conflicts": conflicts,
        "verification_steps": steps,
        "status": "CONFLICT" if conflicts else "VALID"
    }


def main():
    if len(sys.argv) < 2:
        print("Neuro-Symbolic Fusion - Logical Consistency Verifier")
        print("=" * 50)
        print("\nUsage: python verify.py \"<task_or_plan>\"")
        print("\nExample:")
        print('  python verify.py "Refactor auth module. Requires user service. Must not break existing sessions."')
        print("\nThis will:")
        print("  1. Extract logical constraints from description")
        print("  2. Detect conflicts")
        print("  3. Generate verification steps")
        sys.exit(1)

    task = " ".join(sys.argv[1:])
    result = generate_logical_plan(task)

    print("\n" + "="*60)
    print(f"LOGICAL VERIFICATION: {result['task'][:50]}...")
    print("="*60)
    print(f"\nStatus: {result['status']}")
    print(f"Constraints Found: {result['constraints_found']}")

    if result['constraints']:
        print("\nExtracted Constraints:")
        for c in result['constraints']:
            print(f"  [{c['type']}] {c['raw']}")

    if result['conflicts']:
        print("\n⚠️  CONFLICTS:")
        for conflict in result['conflicts']:
            print(f"  {conflict}")
    else:
        print("\n✓ No conflicts detected.")

    print("\nVerification Steps:")
    for step in result['verification_steps']:
        print(step)

    # Save to log
    log_dir = Path(__file__).parent.parent / "logs"
    log_dir.mkdir(exist_ok=True)
    log_file = log_dir / f"symbolic_verify_{os.urandom(4).hex()}.json"
    import os
    with open(log_file, "w") as f:
        json.dump(result, f, indent=2)
    print(f"\nVerification saved to: {log_file}")


if __name__ == "__main__":
    main()
