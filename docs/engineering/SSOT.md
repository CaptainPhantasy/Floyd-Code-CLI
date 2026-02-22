# Single Source of Truth (SSOT) Documentation

**Last Updated:** 2026-02-01
**Version:** 1.0

---

## Purpose

This document establishes the Single Source of Truth (SSOT) principles for FLOYD CLI documentation. All documentation changes must reference this document to maintain consistency.

---

## 1. Documentation Update Rules

### 1.1 Code ↔ Documentation Parity

**Rule:** Every behavior change requires corresponding documentation update.

**When to Update Documentation:**
- Function signature changes
- New features added
- Behavior modifications
- Configuration changes
- Deprecations

**Verification:**
```bash
# Check if code changes have corresponding doc updates
git diff HEAD --name-only | grep -E "\.(ts|js)$" | while read f; do
  if [ -f "${f%.*}.md" ]; then
    git diff HEAD "${f%.*}.md" | head -5
  fi
done
```

### 1.2 Receipt Format Requirements

All phase receipts MUST follow this format:

```markdown
### Phase XX: [Name] - RECEIPTS
**Date:** YYYY-MM-DD
**Status:** ✅ COMPLETE / ⏸ IN PROGRESS / ❌ BLOCKED

**Items Completed:**
- Item NN: [Name] - [Brief description]

**Files Created:**
- path/to/file.ext

**Build Status:** PASS / FAIL
**Test Status:** PASS / FAIL / SKIP
```

### 1.3 Documentation Categories

| Category | Location | Owner | Update Frequency |
|----------|----------|-------|------------------|
| API Docs | `docs/api/` | Tech Lead | Per release |
| Architecture | `docs/architecture/` | Architect | As needed |
| Contributing | `CONTRIBUTING.md` | Maintainer | Quarterly |
| Phase Plans | `FLOYD ECOSYSTEM/REBUILD PLANS BY PHASE/` | Project Lead | Per phase |
| Test Feedback | `INK/floyd-cli/docs/TESTING_FEEDBACK.md` | QA Team | Per test run |

---

## 2. Documentation Standards

### 2.1 Markdown Formatting

- Use ATX-style headers (`#`, `##`, `###`)
- Add blank line after headers
- Use fenced code blocks with language specifier
- Bullet points with `-` (not `*`)
- Numbered lists for sequences
- Tables for structured data

### 2.2 Code Documentation

All public APIs must have JSDoc/TSDoc comments:

```typescript
/**
 * Brief description of function.
 *
 * @param param1 - Description of parameter
 * @param param2 - Description of parameter
 * @returns Description of return value
 *
 * @example
 * ```typescript
 * const result = functionName(arg1, arg2);
 * ```
 */
export function functionName(param1: string, param2: number): boolean {
  // Implementation
}
```

### 2.3 Phase Documentation

Each phase must have:
1. Plan document (`PHASE_XX_Name_Plan.md`)
2. Audit report (`phase_X_audit_report.md`)
3. Completion receipt (in checkpoint or status file)

---

## 3. Document Review Process

### 3.1 Pre-Commit Checklist

- [ ] Run `npm run lint` to check code style
- [ ] Run `npm run build` to verify compilation
- [ ] Run `npm test` to verify tests pass
- [ ] Update relevant documentation
- [ ] Add/update JSDoc comments for new/modified functions
- [ ] Update TESTING_FEEDBACK.md if adding tests

### 3.2 Documentation Review Gates

Before marking a phase as complete:

1. **Golden Path:** User can reproduce the documented workflow
2. **Evidence Tokens:** All claims have code/output evidence
3. **Wiring Proof:** No gaps >2 hops from user action to result
4. **Temporal Risks:** No outdated information
5. **Failure Modes:** Error cases documented
6. **Doc Compliance:** This SSOT followed

---

## 4. File Organization

### 4.1 Root Documentation

```
/FLOYD_CLI
├── README.md                 # Project overview (auto-generated)
├── CLAUDE.md                 # Claude Code instructions
├── CONTRIBUTING.md           # Contribution guidelines
├── docs/                     # Additional documentation
│   ├── SSOT.md              # This file
│   ├── api/                 # API documentation
│   └── architecture/        # Architecture docs
├── FLOYD ECOSYSTEM/
│   └── REBUILD PLANS BY PHASE/
│   ├── CHECKPOINT_YYYY-MM-DD.md
│   └── AUDIT_REPORTS/
└── INK/floyd-cli/docs/
    └── TESTING_FEEDBACK.md   # Test results tracking
```

### 4.2 Phase Documentation

Each phase directory contains:
- `PHASE_XX_Name_Plan.md` - Implementation plan
- Item-specific notes as needed
- Audit reports in `AUDIT_REPORTS/`

---

## 5. Change Documentation Template

When making changes, use this template:

```markdown
## Change: [Brief Description]

**Date:** YYYY-MM-DD
**Author:** [Name]
**Phase:** [XX - Phase Name]

### Files Modified
- `path/to/file1.ext` - [Change description]
- `path/to/file2.ext` - [Change description]

### Behavior Changes
- [Describe any behavior changes]

### Documentation Updates
- [List updated documentation files]

### Testing
- [Test approach and results]

### Verification Commands
```bash
# Commands to verify the change
```
```

---

## 6. Version Control

### 6.1 Commit Messages

Follow conventional commits:

```
<type>: <brief description>

<optional detailed description>

<type> can be:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- refactor: Code refactoring
- test: Test additions/changes
- chore: Build/config changes
```

### 6.2 Branch Naming

- `phase-XX-item-NN` - Phase-specific work
- `fix/description` - Bug fixes
- `feat/description` - New features
- `docs/description` - Documentation updates

---

## 7. Accessibility

All documentation must be:
- **Readable:** Clear language, no jargon without explanation
- **Searchable:** Use consistent terminology
- **Maintainable:** Easy to update, no duplication
- **Traceable:** Link to code/examples where applicable

---

## 8. Compliance Verification

To verify SSOT compliance:

```bash
# Check for missing JSDoc on exported functions
grep -r "export function" src/ | while read line; do
  file=$(echo "$line" | cut -d: -f1)
  func=$(echo "$line" | cut -d: -f2- | sed 's/export function //; s/(.*//')
  if ! grep -B2 "function $func" "$file" | grep -q "/\*\*"; then
    echo "$file: $func missing JSDoc"
  fi
done

# Check for orphaned markdown files (not referenced anywhere)
find docs -name "*.md" -exec sh -c 'grep -r "$(basename {}")" . --exclude-dir=node_modules --exclude-dir=.git | grep -v "Binary file" || echo "{}: orphaned"' \;
```

---

## 9. Updates to This Document

When updating SSOT.md:
1. Increment version number
2. Update "Last Updated" date
3. Add change note to this section:

**Changelog:**
- v1.0 (2026-02-01): Initial SSOT document created
