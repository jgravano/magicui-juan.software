---
name: next-task
description: Show the next available task from the backlog and optionally start working on it. Use to keep the project moving forward systematically.
disable-model-invocation: false
---

Check the task board and find the next task to work on:

1. Use `TaskList` to see all tasks
2. Find the first **pending** task that has **no blockers** (no `blockedBy` or all blockers are completed)
3. Show the task details using `TaskGet`
4. Ask the user: "Ready to start this task?" with options:
   - **Start it** — mark as in_progress and begin working
   - **Skip it** — move to the next available task
   - **Show full backlog** — display all tasks with their status and dependencies

If there are no unblocked tasks, explain what needs to be completed first to unblock the next batch.
