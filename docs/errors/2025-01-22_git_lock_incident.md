
# Git lock‑file incident — 22 Jan 2025

**Context**  
- While working in Replit, multiple git lock files (`index.lock`, `config.lock`, `gc.pid.lock`) prevented git operations.  
- Error surfaced as _"unsafe operation… ability to go back to other points in time"_.  
- Issue occurred when Assistant attempted shell commands for git operations (add/commit/push).

**Root cause**  
- Concurrent git operations between Replit's background processes and shell commands.
- Replit's auto-sync/save features conflicted with manual git shell commands.
- Lock files remained after interrupted git processes.

**Resolution**  
1. Cleaned all git lock files: `rm -f .git/*.lock .git/refs/**/*.lock`
2. Established rule: **No shell commands for git operations** - use Git pane only.
3. Git pane operations work harmoniously with Replit's background processes.

**Follow‑ups / guard‑rails**  
- Assistant will never propose git-related shell commands (add, commit, push, pull).
- All git operations must be done through Replit's Git pane interface.
- Document this constraint in project README for future reference.

**Lesson learned**  
Replit's integrated Git pane is designed to prevent these conflicts. Shell-based git commands should be avoided entirely in Replit environment.
