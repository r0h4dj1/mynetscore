---
agent: 'agent'
description: 'Use GitHub MCP to gather details of a specific issue and save it to a markdown file in the project root'
---

# GitHub Issue to Markdown Prompt

## Instructions

Execute the following workflow to retrieve a GitHub issue and save its details:

1. **Get Issue Number**: Obtain the target issue number from the user's request.
2. **Fetch Issue Details**: Use the GitHub MCP server (e.g., `get_issue` tool) to fetch the details for the specified issue in the `r0h4dj1/mynetscore` repository. This should include the issue title, body/description, state, author, and labels.
3. **Format Content**: Format the retrieved issue details into a clear, readable Markdown document. Include:
   - A main heading: `# Issue X: [Issue Title]`
   - Metadata section (State, Author, Labels, Created Date)
   - The main issue body/description
4. **Create File**: Write the formatted Markdown content to a new file in the project root directory.
   - Use a sensible filename format, such as `issue-<number>.md` or `issue-<number>-<short-title>.md` (ensure the title is sanitized for file systems).
5. **Confirm Action**: Notify the user that the file has been successfully created and provide the path to the new file.

## Error Handling

- If the issue cannot be found, inform the user clearly.
- If the GitHub MCP integration is unavailable or lacks permissions, explain the problem.
- Provide clear feedback if the file cannot be written due to file system errors.
