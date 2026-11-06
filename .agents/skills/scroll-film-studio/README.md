# Scroll-Film Studio — Replit / Kimi K3 Edition

Adapted from the original free Scroll-Film Studio skill for **Replit Agent Skills**.
The creative methodology, motion playbook, verification scripts, and Lane A/Lane B
workflow are preserved; Claude-Code-specific paths and assumptions have been removed.

## Install in Replit

### Easiest: upload as a skill
1. Open Replit **Workspace Settings → Customization → Skills** (or the Skills picker in Agent).
2. Upload this ZIP / folder as a pre-existing skill.
3. Start a **new Agent chat** after installation; Replit only applies skill changes to future chats.
4. Manually invoke it with `/scroll-film-studio` if it does not auto-trigger.

### Project-level install
Place the folder at:

```text
.agents/skills/scroll-film-studio/
  SKILL.md
  references/
  scripts/
```

Replit officially loads project skills from `.agents/skills`.

## Recommended model
For premium visual work, use **Max → Kimi K3** (or another top visual/coding model you intentionally select).
Keep taste-bearing decisions on that primary model.

## Trigger

```text
/scroll-film-studio
Build me a scroll-film website.
```

The skill should interview you, pitch 2–3 named concepts, then build only after you pick one.

## Two lanes
- **Lane A — Pure code:** GSAP / ScrollTrigger / Lenis, zero external media-generation cost. Start here.
- **Lane B — Cinematic footage:** optional generated video using Higgsfield Seedance or another compatible provider. This spends external provider credits and must never run without explicit cost approval.

## Replit-specific notes
- Default iteration target: **Replit Preview / running Artifact**.
- Default publish target: **Replit Deployment**.
- Helper scripts are referenced from `.agents/skills/scroll-film-studio/scripts/...`.
- `shot.js` and `verify.js` need `puppeteer-core` plus Chrome/Chromium. Install once with:

```bash
cd .agents/skills/scroll-film-studio/scripts
npm install
```

- If Replit's environment uses a non-standard Chromium path, set `CHROME_PATH`.
- No Claude Code installation, `~/.claude` directory, `/skills` command, or Claude-only Task tool is required.

## Safety / spend
No credentials are bundled. Never paste API keys into source files. Use Replit Secrets for provider keys.
Lane B must quote expected provider cost and get explicit approval before generating paid media.
