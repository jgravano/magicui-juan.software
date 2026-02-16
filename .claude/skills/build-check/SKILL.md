---
name: build-check
description: Run a production build, check for errors, and report bundle size. Use after making code changes to verify nothing is broken.
disable-model-invocation: false
allowed-tools: Bash
---

Run a full build check for the project:

1. Run `npx next build --no-lint 2>&1` and capture the full output
2. Report:
   - Whether the build **passed** or **failed**
   - If failed: show the exact error messages
   - If passed: show the route table with bundle sizes
   - Compare the main page JS size — flag if it exceeds 150kB First Load JS (Three.js will increase this for /v2)
3. If on branch `v2/the-gallery`, also check that `/v2` route exists in the output
4. Verify v1 route `/` still appears and hasn't regressed

Keep the output concise. Only show what matters.
