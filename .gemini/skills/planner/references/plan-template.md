# Implementation Plan Templates

Choose the template that matches the request type:

1.  **Feature Implementation Template**: Use this for new features, enhancements, or architectural changes.
2.  **Bug Fix Template**: Use this for reporting and fixing existing issues, errors, or unexpected behavior.

---

# Feature Implementation Plan: <feature>

[Brief description of the requirements and goals of the feature]

## Architecture and Design

Describe the high-level architecture and design considerations.

- **Components**: Which components are affected?
- **Data Flow**: How will data move through the system?

## Impacted Files

List the files that will be created, modified, or deleted.

- `src/path/to/file.ts` (modify)
- `src/path/to/new_file.ts` (create)

## Tasks

Break down the implementation into smaller, manageable tasks using a Markdown checklist format.

- [ ] Create ...
- [ ] Update ...
- [ ] Add tests for ...

## Verification Plan

How will you verify the feature works as intended?

- **Automated Tests**: Unit/Integration tests to run or add.
- **Manual Verification**: Steps to manually test the feature.

## Open Questions

Outline 1-3 open questions or uncertainties that need to be clarified.

---

# Bug Fix Plan: <bug_name>

[Brief summary of the bug, including symptoms and steps to reproduce if known.]

## Root Cause Analysis

Describe the underlying cause of the bug based on code analysis or reproduction.

- **Found in file**: `src/path/to/buggy_file.ts`
- **Logic Error**: Description of why the code is failing.

## Proposed Fix

Detail the strategy for fixing the bug and why this approach was chosen.

## Impacted Files

List the files that will be modified to fix the bug.

- `src/path/to/file.ts` (modify)

## Verification Plan

List the specific tests (unit, integration, or manual) that will be used to verify the fix and ensure no regressions.

- **New Test Case**: Describe the new test case to be added.
- **Existing Tests**: Which existing tests should pass?

## Tasks

Break down the fix into smaller, manageable tasks using a Markdown checklist format.

- [ ] Reproduce bug with a test case
- [ ] Apply fix
- [ ] Verify fix
