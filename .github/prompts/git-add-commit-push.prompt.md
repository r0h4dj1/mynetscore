---
agent: 'agent'
description: 'Execute git commands to stage all changes, commit with a concise message following GitHub best practices, and push to remote'
---

# Git Workflow Prompt

## Instructions

Execute the following git workflow, adhering to GitHub best practices:

1. **Stage changes**: Run `git add .` to stage all modified, new, and deleted files. Ensure commits are atomic by only staging related changes together.
2. **Commit**: Run `git commit -m "message"`.
   - Follow conventional commit format (e.g., `feat:`, `fix:`, `docs:`).
   - Keep the subject line under 72 characters.
   - Use the imperative mood and do not end with a period.
   - If no changes are staged, skip this step.
3. **Push**: Run `git push` to the default remote branch.
   - Ensure the branch is up-to-date before pushing.
   - If merge conflicts occur, advise the user to resolve them manually.

## Error Handling

- Handle failures gracefully and provide clear feedback on actions taken.
