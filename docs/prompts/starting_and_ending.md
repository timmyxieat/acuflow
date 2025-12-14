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

**Important:** Replace `{VERSION}` below with the actual current version number before sending. Check the latest handoff doc in `docs/handoffs/` to find the current version (e.g., if latest is `1.19_soap_sections.md`, use `1.19`).

```
This session is ending. Before this session ends:

1. Commit and push all current changes with a descriptive commit message
2. Create a handoff doc at `docs/handoffs/meta/` using the format:
   - Filename: `{VERSION}_N_{description}.md` 
   - N is a sequence number (1, 2, 3...) for multiple meta handoffs in the same version
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

| Session Type        | Handoff Location                                  | Example                     |
| ------------------- | ------------------------------------------------- | --------------------------- |
| Feature development | `docs/handoffs/{VERSION}_feature_name.md`       | `1.19_soap_sections.md`   |
| Meta/maintenance    | `docs/handoffs/meta/{VERSION}_N_description.md` | `1.19_1_status_colors.md` |

**How to find the current version:** Look at the latest handoff doc in `docs/handoffs/` (not meta). The number before the underscore is the version.
