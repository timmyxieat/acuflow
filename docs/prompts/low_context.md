# Low Context Handoff Prompt

Use this prompt when an AI coding agent is running low on context:

---

You're running low on context. Before this session ends:

1. **Commit and push** all current changes with a descriptive commit message
2. **Update or create a handoff doc** at `docs/handoffs/` that includes:
   - What was built/changed this session
   - Key files modified
   - Current state of the feature
   - Any pending work or known issues
   - Session summary
3. **Update `.claude.md`** if there are any new patterns, conventions, or important context the next agent should know
4. Push everything and give me instructions for starting the next session, including which files the new agent should read first.

---

## Starting a New Session

Tell the new agent:

```
Read these files to get up to speed:
- .claude.md (project context)
- docs/handoffs/[latest].md (current state)
- prisma/schema.prisma (data model)

Then read the specific files for what we're working on.
```
