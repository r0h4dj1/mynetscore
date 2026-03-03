---
agent: 'agent'
description: 'Execute an interactive rebase or reset workflow to clean up the last N commits and recreate them with better logical grouping and conventional commit messages'
---

# Git Clean and Recommit Workflow Prompt

## Instructions

Execute the following git workflow to clean up and reorganize the recent commit history, adhering to GitHub best practices:

1. **Determine Scope**: Identify the number of recent commits (`N`) the user wants to clean up.
2. **Analyze Changes**: Run `git log -n <N>` and `git diff HEAD~<N>` to review the changes and plan the new logical groupings.
3. **Uncommit (Soft Reset)**: The safest way to regroup changes is to uncommit them while keeping the work:
   - Run `git reset --soft HEAD~<N>` to undo the last `N` commits but keep changes in the working directory.
   - Run `git restore --staged .` (or `git reset HEAD`) to unstage everything for granular control.
4. **Stage and Regroup**: Analyze the modified files. Stage related changes together into atomic, logical units using `git add <files...>`.
5. **Recommit**: For each logical group, create a new commit using `git commit -m "message"`.
   - Follow conventional commit format (e.g., `feat:`, `fix:`, `refactor:`).
   - Keep the subject line under 72 characters.
   - Use the imperative mood and do not end with a period.
6. **Push (with Caution)**: If the original commits were already pushed to a remote, a force push is required.
   - Run `git push --force-with-lease` to safely update the remote branch.
   - **Important**: Always ask for user confirmation before executing a force push.

## Advanced (Interactive Rebase)

- If only minor adjustments are needed (like rewording or dropping specific commits), instruct or assist the user with `git rebase -i HEAD~<N>`, explaining how to use `pick`, `reword`, `squash`, and `drop`. For total restructuring, the soft reset approach (Step 3) is preferred.

## Error Handling

- Handle failures gracefully and provide clear feedback.
- If the reset process goes wrong, remind the user they can recover the previous state using `git reflog` or `git reset --keep ORIG_HEAD`.
