#!/usr/bin/env python3
"""
Recursive Language Model (RLM) Context Processor
Implements MIT CSAIL technique for handling infinite context through chunking and recursive summarization.
"""

import sys
import os
import json
from pathlib import Path
from typing import List, Dict, Any

# Files to ignore
IGNORE_PATTERNS = [
    "node_modules", ".git", "dist", "build", ".next", "coverage",
    "__pycache__", ".pyc", ".DS_Store", "*.log", ".cache"
]

# Files to prioritize (read first)
PRIORITY_PATTERNS = [
    "README*", "CLAUDE.md", "SSOT*", "*SSOT*", "package.json",
    "tsconfig.json", "*.config.js", "*.config.ts"
]


def should_ignore(path: Path) -> bool:
    """Check if path should be ignored."""
    for pattern in IGNORE_PATTERNS:
        if pattern in str(path) or path.match(pattern):
            return True
    return False


def get_priority_score(path: Path) -> int:
    """Higher score = read earlier."""
    name = path.name
    for i, pattern in enumerate(PRIORITY_PATTERNS):
        if pattern.replace("*", "") in name or path.match(pattern):
            return 100 - i  # Priority files get 100, 99, 98...
    return 0


def scan_directory(target_path: str, max_files: int = 50, max_depth: int = 10) -> Dict[str, Any]:
    """
    Recursively scan directory and return structured context.

    Implements RLM strategy: Don't read everything at once.
    Returns a prioritized list with summaries.
    """
    root = Path(target_path)
    if not root.exists():
        root = Path(__file__).parent.parent.parent / target_path

    if not root.exists():
        return {"error": f"Path not found: {target_path}"}

    files = []
    total_size = 0

    # Collect files
    for item in sorted(root.rglob("*")):
        if should_ignore(item):
            continue
        if item.is_file() and item.suffix not in {".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2"}:
            try:
                size = item.stat().st_size
                total_size += size
                files.append({
                    "path": str(item.relative_to(root)),
                    "full_path": str(item),
                    "size": size,
                    "extension": item.suffix,
                    "priority": get_priority_score(item),
                    "depth": len(item.relative_to(root).parts)
                })
            except OSError:
                continue

    # Sort by priority, then by extension (docs/types first)
    ext_priority = {".md": 1, ".json": 2, ".ts": 3, ".tsx": 4, ".js": 5, ".py": 6}
    files.sort(key=lambda f: (
        -f["priority"],
        ext_priority.get(f["extension"], 99),
        f["depth"],
        f["path"]
    ))

    # Truncate to max_files
    selected = files[:max_files]

    # Generate summary statistics
    extensions = {}
    for f in files:
        ext = f["extension"] or "no_ext"
        extensions[ext] = extensions.get(ext, 0) + 1

    return {
        "root": str(root),
        "total_files": len(files),
        "selected_files": len(selected),
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / 1024 / 1024, 2),
        "extensions": extensions,
        "files": [
            {
                "path": f["path"],
                "size_kb": round(f["size"] / 1024, 1),
                "priority": f["priority"],
                "depth": f["depth"]
            }
            for f in selected
        ],
        "recommended_reading_order": [f["path"] for f in selected[:10]]
    }


def generate_context_summary(scan_result: Dict) -> str:
    """Generate human-readable context summary."""
    if "error" in scan_result:
        return f"ERROR: {scan_result['error']}"

    lines = [
        f"\n{'='*60}",
        f"RLM CONTEXT SCAN: {scan_result['root']}",
        f"{'='*60}",
        f"",
        f"Total files found: {scan_result['total_files']}",
        f"Selected for review: {scan_result['selected_files']}",
        f"Total size: {scan_result['total_size_mb']} MB",
        f"",
        f"File breakdown by extension:"
    ]

    for ext, count in sorted(scan_result['extensions'].items(), key=lambda x: -x[1]):
        lines.append(f"  {ext or 'no_ext'}: {count}")

    lines.extend([
        f"",
        f"Recommended reading order (top 10):",
        f""
    ])

    for i, path in enumerate(scan_result['recommended_reading_order'][:10], 1):
        lines.append(f"  {i}. {path}")

    lines.extend([
        f"",
        f"{'='*60}",
        f"RLM STRATEGY: Read prioritized files first, chunk rest.",
        f"{'='*60}\n"
    ])

    return "\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print("Usage: python scan.py <target_path> [max_files]")
        print("\nExample:")
        print('  python scan.py src/auth')
        print('  python scan.py . 100')
        sys.exit(1)

    target = sys.argv[1]
    max_files = int(sys.argv[2]) if len(sys.argv) > 2 else 50

    result = scan_directory(target, max_files)
    summary = generate_context_summary(result)

    print(summary)

    # Save result
    log_dir = Path(__file__).parent.parent / "logs"
    log_dir.mkdir(exist_ok=True)
    log_file = log_dir / f"context_scan_{os.urandom(4).hex()}.json"
    with open(log_file, "w") as f:
        json.dump(result, f, indent=2)
    print(f"Full scan saved to: {log_file}")


if __name__ == "__main__":
    main()
