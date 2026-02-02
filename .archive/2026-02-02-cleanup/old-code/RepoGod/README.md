# RepoGod Scaffold

This directory contains the operational scaffold for **RepoGod**, the sovereign agentic interface for the FLOYD repository.

## Architecture

This scaffold implements advanced MIT CSAIL LLM techniques to enhance agent performance:

1.  **RLM_Context_Processor/**: Implements *Recursive Language Model* strategies for handling infinite context windows by chunking and recursively summarizing the file tree.
2.  **Adaptive_Scaler/**: Implements *Instance-Adaptive Scaling* to dynamically adjust compute/reasoning depth based on task complexity.
3.  **Co_LLM_Router/**: Implements *Co-LLM* architecture, defining "specialist" sub-agents (e.g., Rust Expert, Security Auditor) that the main agent can delegate to.
4.  **Symbolic_Planner/**: (Placeholder) For *Neuro-Symbolic Fusion*, ensuring logical consistency in complex plans.
5.  **logs/**: External memory for the agent to store plans, intermediate states, and reasoning traces.

## Usage

To initialize the RepoGod agent, feed the content of `prompt.md` as the System Prompt.
The agent is then instructed to utilize the scripts in these directories to augment its reasoning.

### Example Workflow
1.  Agent receives a request: "Refactor the authentication module."
2.  Agent runs `python Adaptive_Scaler/complexity_assessor.py "Refactor the authentication module"`.
3.  Output suggests `DEEP_REASONING` mode.
4.  Agent runs `python RLM_Context_Processor/scanner.py src/auth` to understand the scope.
5.  Agent checks `Co_LLM_Router/router_config.json` and decides to adopt the `security_auditor` persona for the design phase.
6.  Agent writes its plan to `logs/auth_refactor_plan.md`.

---
