---
name: "ai66-image"
description: "Generate images with AI66 GPT Image models (gpt-image-2, gpt-image-2.5, gpt-image-2.5-flare) through the AI66 Images API, reusing the API key already in the Codex config. Use when the user asks to generate, draw, or create a picture or illustration and Codex is connected to AI66, or when the user invokes $ai66-image. Prefer this over the built-in imagegen skill when Codex uses an AI66 API key, because built-in image generation is unavailable there. Does not edit existing images."
---

# AI66 Image

Generate a PNG with the AI66 Images API by running the bundled script. The script reads the API key from `$CODEX_HOME/auth.json` (default `~/.codex/auth.json`, field `OPENAI_API_KEY`) or the `AI66_API_KEY` environment variable. Never print, echo, or ask the user to paste the API key.

## Workflow

1. Turn the user's request into one clear image prompt. Keep the user's language; add useful detail on subject, style, composition, and lighting without changing their intent.
2. Pick the model:
   - `gpt-image-2` (default): fast and cheap, good for drafts and everyday images.
   - `gpt-image-2.5`: higher quality. Use when the user asks for 高清, 精细, high quality, or similar.
   - `gpt-image-2.5-flare`: best quality and most expensive. Use only when the user asks for the best quality or names this model.
3. Run the script from the user's current working directory. `<skill-dir>` is the directory containing this `SKILL.md`:

   ```bash
   node "<skill-dir>/scripts/generate.mjs" --model gpt-image-2 --prompt "<prompt>"
   ```

   - For long prompts, or prompts containing quotes or newlines, write the prompt to a temporary UTF-8 text file and pass `--prompt-file <path>` instead of `--prompt`. Delete the temporary file afterwards.
   - Optional: `--out-dir <dir>` (default `./ai66-images`), `--name <file-name>`.
   - Generation usually takes 20–60 seconds. Use a command timeout of at least 300 seconds and do not interrupt it early.
   - The command needs network access to `api.ai66.app`. If the sandbox blocks the network, rerun it with escalated permissions / network approval rather than giving up.
4. On success the script prints one JSON line: `{"file": ..., "model": ..., "size": ..., "usage": ...}`. Tell the user the saved file path, the model, and the actual size. If the environment can display local images, show the image.
5. On failure the script prints a `[ai66-image]` message in Chinese and exits non-zero. Relay that message and its suggested fix. Do not retry more than once for the same error.

## Limits

- Size and quality are decided by the upstream service; do not promise a specific resolution. The returned `size` is the real one.
- Generating several images means running the script several times; confirm with the user before generating more than 4, since each image is billed.
- This skill only creates new images. It does not edit, extend, or remove backgrounds from existing images.

## Help

- Codex setup for AI66: https://docs.ai66.app/docs/setup/codex
- Pricing: https://ai66.app/pricing
