---
agent: 'agent'
description: 'Analyze and explain significant changes in a file, handling new creations and prioritizing unstaged modifications'
---

# Git Diff Explainer Prompt

## Instructions

Analyze the changes in the specified file by performing the following steps:

1. **Determine Status**: Check if the file is untracked, staged, or modified but unstaged by running `git status --porcelain <file_path>`.
2. **Retrieve Content**:
   - **Untracked (New Creation)**: If the status is `??`, read the entire file content. Treat the entire content as a single "Added" block.
   - **Modified (Unstaged - Default)**: If the status indicates unstaged changes (e.g., ` M`), run `git diff <file_path>`.
   - **Staged**: If the file is already staged (e.g., `A ` or `M `), run `git diff --cached <file_path>`.
3. **Analyze Content**: Review the diff (or full content for new files) to identify significant code blocks.
4. **Filter Trivialities**: Ignore "obvious" or low-signal changes that do not alter logic or behavior, such as:
   - Variable or function renames (unless they imply a change in intent).
   - Whitespace adjustments, formatting, or semicolon changes.
   - Moving code blocks without changing their logic.
   - Purely stylistic comment updates.
5. **Explain Significant Changes**: Provide a concise explanation:
   - **New File**: Summarize the primary purpose, key data structures, and core logic introduced.
   - **Updates (Modified/Removed)**: Focus on changes to existing logic, bug fixes, or performance optimizations.
6. **Contextual Impact**: Briefly state how these changes affect the overall module or component.

## Output Format

- Use a bulleted list for clarity.
- Group explanations by "Added", "Modified", and "Removed".
- For a **New Creation**, clearly label it as such and provide a structured summary of the additions.
- If only trivial modifications were detected, state that explicitly.

## Error Handling

- If the file path is invalid or no changes are detected across any git state, inform the user.
