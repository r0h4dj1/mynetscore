---
agent: 'agent'
description: 'Scan selected files to analyze inline comments, removing redundant or harmful ones while preserving those that provide context, intent, or critical warnings'
---

# Inline Comment Cleanup Prompt

## Instructions

Analyze source code in selected files and clean up inline comments (`//`, `#`, `/* */`, `<!-- -->`) by:

1. **Remove** comments that are:
   - Obvious explanations of readable code
   - Redundant translations of syntax (e.g., `i++ // increment iterator`)
   - Commented-out code blocks (unless marked as reference examples)
   - Closing markers (e.g., `} // end if`)
   - Attribution/history metadata (e.g., `// Added by Dave 2023`)

2. **Keep** comments that provide value:
   - Intent or business logic explanations
   - Warnings about side effects or dependencies
   - Workarounds for external bugs/APIs
   - Task markers like `TODO`, `FIXME`, `HACK`

3. **Formatting**:
   - Remove entire lines for standalone comments
   - Remove end-of-line comments and trailing whitespace, preserving code syntax

## Error Handling

- If unsure about a comment's value, keep it to preserve context
- Avoid altering execution logic (e.g., comments in strings or regex)
