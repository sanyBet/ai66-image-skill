# AI66 生图 Skill（ai66-image）

在 Codex 中用一句话生成图片。Skill 会自动复用 Codex 配置中的 AI66 API Key，调用 AI66 的 GPT Image 模型，并把图片保存到当前目录。

## 安装

把下面这句话发给 Codex：

```text
请按 https://github.com/sanyBet/ai66-image-skill/blob/main/INSTALL.md 的说明，帮我安装 ai66-image skill。
```

安装完成后，**退出并重新启动 Codex**。

## 使用

```text
$ai66-image 画一只在笔记本电脑上写代码的小熊猫，扁平插画风格
```

图片默认保存在当前目录的 `ai66-images/` 中。需要更高画质时，在描述里写「高清」或指定模型 `gpt-image-2.5`、`gpt-image-2.5-flare`。

## 前提条件

- 已按 [AI66 Codex 配置教程](https://docs.ai66.app/docs/setup/codex) 完成配置（`~/.codex/auth.json` 中有 AI66 的 API Key）。
- Node.js 18 或更高版本。
- 首次生成时，Codex 可能请求联网权限，请选择允许。

## 说明

- 图片按实际用量从 AI66 余额扣费，价格见 [模型定价](https://ai66.app/pricing)。
- 图片尺寸和画质由上游决定，暂不支持指定。
- 本 Skill 只生成新图片，不支持编辑已有图片。
- 更多说明见 [AI66 文档：图片生成](https://docs.ai66.app/docs/setup/image)。

## 不经过 Codex 直接使用

```bash
node skills/ai66-image/scripts/generate.mjs --prompt "a red panda coding" --model gpt-image-2
```

API Key 读取顺序：环境变量 `AI66_API_KEY`，然后是 `$CODEX_HOME/auth.json`（默认 `~/.codex/auth.json`）中的 `OPENAI_API_KEY`。

## License

MIT
