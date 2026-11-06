# Replit adaptation notes

Changes from the original release:

- Replaced all `~/.claude/skills/...` paths with `.agents/skills/...`.
- Removed Claude Code installation and `/skills` assumptions.
- Replaced Claude-only sub-agent / Task-tool language with fresh Replit chats, isolated tasks, or parallel Agent tasks.
- Made the primary model generic to the selected Replit Max model (Kimi K3 recommended for this workflow).
- Changed iteration/deployment defaults to Replit Preview and Replit Deployment.
- Removed the embedded Higgsfield affiliate/signup instruction.
- Preserved both Lane A and Lane B, the creative interview, concept sparring, motion engine rules, continuity gates, QA scripts, and cost controls.
- Kept external video generation opt-in only; credentials belong in Replit Secrets, never files.
