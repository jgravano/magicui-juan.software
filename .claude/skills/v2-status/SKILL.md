---
name: v2-status
description: Show the full status of the v2 Gallery project — branch state, task progress, milestone completion, and open questions.
disable-model-invocation: false
allowed-tools: Bash, Read
---

Generate a complete v2 project status report:

## 1. Git Status
- Current branch: !`git branch --show-current`
- Commits ahead of master: !`git rev-list master..HEAD --count 2>/dev/null || echo "N/A"`
- Uncommitted changes: !`git status --short`

## 2. Task Progress
Use `TaskList` to get all tasks and calculate:
- Total tasks
- Completed / In Progress / Pending / Blocked
- Current milestone (M0, M1, M2, etc.)
- Next unblocked task

## 3. Milestone Progress
Read `docs/v2/PROJECT_PLAN.md` and report:
- Which milestones are complete
- Current milestone and % done
- What's blocking the next milestone

## 4. Open Questions
List any unresolved questions from the project plan.

## 5. Next Steps
Recommend the 2-3 most impactful things to work on next.

Format the output as a clean status dashboard.
