# Installing the ai66-image skill (instructions for Codex)

Install the skill directory `skills/ai66-image` from `https://github.com/sanyBet/ai66-image-skill` (branch `main`) into the user's Codex skills directory.

## Target

- Skills directory: `$CODEX_HOME/skills` if `CODEX_HOME` is set, otherwise `~/.codex/skills` (on Windows: `%USERPROFILE%\.codex\skills`).
- Final layout: `<skills-dir>/ai66-image/SKILL.md`, `<skills-dir>/ai66-image/scripts/generate.mjs`, `<skills-dir>/ai66-image/agents/openai.yaml`.
- If `<skills-dir>/ai66-image` already exists, tell the user it is already installed and ask before replacing it (replacing updates it to the latest version).

All methods need network access to GitHub. Request network / escalated permissions when the sandbox blocks it.

## Method 1: built-in skill installer (preferred when Python is available)

Use the preinstalled `$skill-installer` skill:

```bash
python "<codex-home>/skills/.system/skill-installer/scripts/install-skill-from-github.py" --repo sanyBet/ai66-image-skill --path skills/ai66-image
```

## Method 2: git

```bash
git clone --depth 1 https://github.com/sanyBet/ai66-image-skill.git <temp-dir>
# then copy <temp-dir>/skills/ai66-image to <skills-dir>/ai66-image and delete <temp-dir>
```

## Method 3: download the archive (no git, no Python)

Download `https://github.com/sanyBet/ai66-image-skill/archive/refs/heads/main.zip`, extract it, copy `ai66-image-skill-main/skills/ai66-image` to `<skills-dir>/ai66-image`, and delete the temporary files.

- Windows PowerShell: `Invoke-WebRequest` + `Expand-Archive`.
- macOS / Linux: `curl -fsSL -o` + `unzip` (or `tar -xf`).

## After installing

1. Verify `<skills-dir>/ai66-image/SKILL.md` exists.
2. Check `node --version` is 18 or higher; if not, tell the user to install Node.js LTS from https://nodejs.org.
3. Check the AI66 key is configured without printing it: `<codex-home>/auth.json` should contain a non-empty `OPENAI_API_KEY`. If missing, point the user to https://docs.ai66.app/docs/setup/codex.
4. Tell the user (in their language): installation finished; **quit and restart Codex** so the skill loads; then use it like `$ai66-image 画一只在笔记本电脑上写代码的小熊猫`.
