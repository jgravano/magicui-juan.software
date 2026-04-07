---
name: v2-status
description: Show the full status of the v2 "Inside the Machine" project — branch state, task progress, milestone completion, and open questions.
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
- Current milestone (M3=Pivot, M4=Fragments, M5=Portal, M6=AI, M7=Ship)
- Next unblocked task

## 3. Milestone Progress
Read `docs/v2/PROJECT_PLAN.md` and report:
- M0-M2: ✅ Complete (foundation + gallery MVP — being repurposed)
- M3 (The Pivot): Transform gallery → machine interior
- M4 (The Fragments): Interactive moments
- M5 (The Portal): v1 → v2 connection
- M6 (AI Presence): Machine intelligence
- M7 (Polish & Ship): Production readiness

## 4. Open Questions
List any unresolved questions from the project plan.

## 5. Next Steps
Recommend the 2-3 most impactful things to work on next.

Format the output as a clean status dashboard.
