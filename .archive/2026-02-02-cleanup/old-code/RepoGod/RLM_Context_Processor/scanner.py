import os

def recursive_scan(directory, max_depth=3, current_depth=0):
    """
    Simulates the RLM approach by walking the directory tree 
    and preparing it for chunked processing.
    """
    if current_depth > max_depth:
        return []

    structure = []
    try:
        for entry in os.scandir(directory):
            if entry.name.startswith('.') or entry.name == '__pycache__':
                continue
            
            if entry.is_dir():
                structure.append(f"[DIR]  {'  ' * current_depth}{entry.name}")
                structure.extend(recursive_scan(entry.path, max_depth, current_depth + 1))
            else:
                structure.append(f"[FILE] {'  ' * current_depth}{entry.name}")
    except PermissionError:
        pass
    
    return structure

if __name__ == "__main__":
    import sys
    # Default to the project root if no argument is provided
    default_root = "/Volumes/Storage/FLOYD_CLI"
    target_dir = sys.argv[1] if len(sys.argv) > 1 else default_root
    
    print(f"--- RLM Context Scan for: {target_dir} ---")
    tree = recursive_scan(target_dir)
    print("\n".join(tree))
    print(f"\n[RLM Meta-Data]: Total Nodes: {len(tree)}")
    print("[Instruction]: Feed this structure to the Chunking Agent to determine reading priority.")
