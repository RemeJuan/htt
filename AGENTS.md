<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commit composition rules

- When creating commits, first analyse whether the current diff contains more than one logical change.
- Prefer logical, reviewable commits over a single mixed commit.
- Use Conventional Commits formatting.
- Prefer whole-file staging; use partial staging only when hunks are clearly independent and safe.
- Never split changes into commits that leave the project in an obviously broken intermediate state.