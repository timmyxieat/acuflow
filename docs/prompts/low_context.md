# Session Management Prompts

## Starting a New Session

```
Read these files to understand the project:
1. `.claude.md` - project context, conventions, and patterns
2. `docs/handoffs/` - find and read the latest handoff doc (highest number)
3. `prisma/schema.prisma` - data model

Then be ready to program. I'll tell you what to work on.
```

---

## Ending a Session (Low Context)

```
You're running low on context. Before this session ends:

1. Commit and push all current changes with a descriptive commit message
2. Create a handoff doc at `docs/handoffs/` that includes:
   - What was built/changed this session
   - Key files modified
   - Current state of the feature
   - Any pending work or known issues
   - Session summary
3. Update `.claude.md` if there are any new patterns, conventions, or important context the next agent should know
4. Push everything
```
