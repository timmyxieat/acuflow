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

## Ending a Feature Session

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

---

## Ending a Meta Session 

Use this when the session focused on project organization, documentation restructuring, tooling changes, etc. rather than feature development.

```
You're running low on context. Before this session ends:

1. Commit and push all current changes with a descriptive commit message
2. Create a handoff doc at `docs/handoffs/meta/` using the format:
   - Filename: `{current_version}_1_{description}.md` (e.g., `1.16_1_claude_md_restructure.md`)
   - The version number ties it to the current feature development timeline

   Include in the handoff:
   - What was reorganized/changed this session
   - Before/after comparison (if applicable)
   - Key decisions and rationale
   - Files created, modified, or removed
   - Any follow-up considerations

3. Update `.claude.md` or `.claude/rules/` if this session established new patterns or conventions
4. Push everything
```

---

## When to Use Which Ending

| Session Type        | Handoff Location                             | Example                     |
| ------------------- | -------------------------------------------- | --------------------------- |
| Feature development | `docs/handoffs/1.XX_feature_name.md`       | Building SOAP note UI       |
| Meta/maintenance    | `docs/handoffs/meta/1.XX_1_description.md` | Restructuring documentation |
