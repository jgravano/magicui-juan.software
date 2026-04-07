---
name: build-check
description: Run a production build, check for errors, and report bundle size. Use after making code changes to verify nothing is broken.
disable-model-invocation: false
allowed-tools: Bash
---

Run a full build check for the project:

1. Run `npm run build:fast 2>&1` and capture the full output
2. Report:
   - Whether the build **passed** or **failed**
   - If failed: show the exact error messages
   - If passed: show the route table with bundle sizes
   - Compare the main page JS size — flag if it exceeds 180kB First Load JS
3. Verify `/` and `/resonance` routes both appear in the output
4. If additional experiment routes exist in catalog (`/alma`, `/umbral`, etc.), verify they appear too

Keep the output concise. Only show what matters.
