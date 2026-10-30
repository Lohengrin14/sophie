<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project workflow

- The owner requests autonomous implementation without routine clarification.
- Commit each completed task or meaningful milestone after its relevant checks pass.
- Make a separate feature branch for each substantial item; integrate completed items into the working branch with a merge that preserves that feature branch.
- Keep local credentials, `.env.local`, database contents, and private uploads out of Git.
- Design palette images belong in `docs`, separate from implementation. Generate them after the code tasks are complete.
