# Anti-Patterns

This directory captures recurring coding mistakes and patterns identified from
code review, incidents, and automated PR analysis.

Each file follows the naming convention `AP-NNN-short-name.md`.

Anti-pattern records are created automatically by the nightshift `pr-feedback-loop`
task and require expert review before merge. See `CODEOWNERS` for reviewers.

## Format

```markdown
# AP-NNN: <Title>

**Status:** Draft — pending expert review | Accepted | Deprecated
**Detected:** YYYY-MM-DD
**Source PRs:** #<n>, #<n>

## Description

What the anti-pattern is and why it is harmful.

## Example

```language
// Bad
<bad code>

// Good
<preferred alternative>
```

## Detection

How to spot this in code review or static analysis.
```
