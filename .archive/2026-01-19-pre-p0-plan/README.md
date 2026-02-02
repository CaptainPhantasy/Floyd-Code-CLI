# Archive: Pre-P0 Plan Documents

**Archived:** 2026-01-19
**Reason:** These documents conflict with or are superseded by the new P0 Critical Bugs plan.

## New Authoritative Documents

The following documents now govern Floyd development:

| Document | Purpose |
|----------|---------|
| `.floyd/P0_CRITICAL_BUGS.md` | Complete bug inventory (77 bugs) with detailed fixes |
| `.floyd/P0_IMPLEMENTATION_PLAN.md` | Phased execution plan with verification gates |

## Archived Files

| File | Original Location | Why Archived |
|------|-------------------|--------------|
| `TASK_QUEUE.md` | `.floyd/` | Referenced Go tasks and old phase structure |
| `master_plan.md` | `.floyd/` | Old phases conflict with bug-focused approach |
| `ECOSYSTEM_ROADMAP.md` | `.floyd/` | Old parity tracking, superseded |
| `path-forward.md` | `docs/` | Referenced Go code, "Repo Surgeon" persona |
| `CLI_FIRST_TEST_SIMULATION.md` | `.floyd/` | Historical simulation, potentially confusing |
| `CLI_USER_FLOW_SIMULATION.md` | `.floyd/` | Historical simulation |
| `ACTUAL_USER_FLOW_SIMULATION.md` | `.floyd/` | Historical simulation |
| `FIRST_TEST_SIMULATION_DESKTOP_SETTINGS.md` | `.floyd/` | Historical simulation |
| `ULTRATHINK_ANALYSIS.md` | `.floyd/` | Historical analysis, outdated |
| `ULTRATHINK_SIMULATION_LOG.md` | `.floyd/` | Historical log |
| `ULTRATHINK_SIMULATION_RESULTS.md` | `.floyd/` | Historical results |

## Recovery

If any archived content is needed:
```bash
cp .archive/2026-01-19-pre-p0-plan/FILENAME /destination/
```

**Do not restore these to their original locations** - they will conflict with the current plan.
