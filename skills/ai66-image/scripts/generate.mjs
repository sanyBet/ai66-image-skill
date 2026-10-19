#!/usr/bin/env node
// Generate an image through the AI66 Images API, reusing the API key Codex already has.
// Zero dependencies: requires Node.js 18+ (global fetch).

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

const DEFAULT_BASE_URL = 'https://api.ai66.app/v1'
const DEFAULT_MODEL = 'gpt-image-2'
const SUPPORTED_MODELS = ['gpt-image-2', 'gpt-image-2.5', 'gpt-image-2.5-flare']
const DEFAULT_OUT_DIR = 'ai66-images'
const DEFAULT_TIMEOUT_SECONDS = 300
const MAX_SLUG_LENGTH = 40
const MIN_NODE_MAJOR = 18

class UserFacingError extends Error {}

function parseCliArgs() {
  const { values } = parseArgs({
    options: {
      prompt: { type: 'string' },
      'prompt-file': { type: 'string' },
      model: { type: 'string', default: DEFAULT_MODEL },
      'out-dir': { type: 'string', default: DEFAULT_OUT_DIR },
      name: { type: 'string' },
      timeout: { type: 'string', default: String(DEFAULT_TIMEOUT_SECONDS) },
    },
  })
  return values
}

async function resolvePrompt(args) {
  if (args['prompt-file']) {
    const text = await readFile(args['prompt-file'], 'utf8')
    return text.trim()
  }
  return (args.prompt ?? '').trim()
}

async function readCodexApiKey() {
  const codexHome = process.env.CODEX_HOME || join(homedir(), '.codex')
  const authPath = join(codexHome, 'auth.json')
  let raw
  try {
    raw = await readFile(authPath, 'utf8')
  } catch {
    return { key: '', source: authPath }
  }
  try {
    const auth = JSON.parse(raw)
    return { key: (auth.OPENAI_API_KEY ?? '').trim(), source: authPath }
  } catch {
    throw new UserFacingError(`无法解析 ${authPath}，请确认它是合法的 JSON。`)
  }
}

async function resolveApiKey() {
  const fromEnv = (process.env.AI66_API_KEY ?? '').trim()
  if (fromEnv) return fromEnv
  const { key, source } = await readCodexApiKey()
  if (key) return key
  throw new UserFacingError(
    `没有找到 AI66 API Key：环境变量 AI66_API_KEY 为空，${source} 中也没有 OPENAI_API_KEY。` +
      '请先按 https://docs.ai66.app/docs/setup/codex 完成 Codex 配置。'
  )
}

function buildFileName(prompt, explicitName) {
  if (explicitName) return explicitName.endsWith('.png') ? explicitName : `${explicitName}.png`
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)
  const slug = prompt
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
  return slug ? `${stamp}-${slug}.png` : `${stamp}.png`
}

function describeHttpError(status, bodyText) {
  let message = bodyText.slice(0, 500)
  try {
    message = JSON.parse(bodyText)?.error?.message || message
  } catch {
    // Non-JSON error bodies are reported verbatim.
  }
  if (status === 401) return `API Key 无效、已禁用或已过期（401）。请在 https://ai66.app 的「API 密钥」页面检查。上游信息：${message}`
  if (status === 402 || status === 403) return `余额不足或无权使用该模型（${status}）。请在 https://ai66.app 的「钱包」页面充值。上游信息：${message}`
  if (status === 429) return `请求过于频繁（429），请稍后重试。上游信息：${message}`
  return `生成失败（HTTP ${status}）：${message}`
}

async function requestImage({ baseUrl, apiKey, model, prompt, timeoutSeconds }) {
  let response
  try {
    response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt }),
      signal: AbortSignal.timeout(timeoutSeconds * 1000),
    })
  } catch (error) {
    if (error?.name === 'TimeoutError') {
      throw new UserFacingError(`等待超过 ${timeoutSeconds} 秒仍未返回，请稍后重试。`)
    }
    throw new UserFacingError(
      `无法连接 ${baseUrl}（${error?.cause?.code || error?.message}）。` +
        '如果在 Codex 沙箱中运行，请允许该命令联网后重试。'
    )
  }
  const bodyText = await response.text()
  if (!response.ok) throw new UserFacingError(describeHttpError(response.status, bodyText))
  return JSON.parse(bodyText)
}

async function main() {
  const nodeMajor = Number(process.versions.node.split('.')[0])
  if (nodeMajor < MIN_NODE_MAJOR) {
    throw new UserFacingError(`需要 Node.js ${MIN_NODE_MAJOR} 或更高版本，当前为 ${process.versions.node}。`)
  }
  const args = parseCliArgs()
  const prompt = await resolvePrompt(args)
  if (!prompt) throw new UserFacingError('缺少图片描述：请通过 --prompt 或 --prompt-file 提供。')
  if (!SUPPORTED_MODELS.includes(args.model)) {
    throw new UserFacingError(`不支持的模型 ${args.model}，可选：${SUPPORTED_MODELS.join('、')}。`)
  }
  const timeoutSeconds = Number(args.timeout) || DEFAULT_TIMEOUT_SECONDS
  const baseUrl = (process.env.AI66_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
  const apiKey = await resolveApiKey()

  const result = await requestImage({ baseUrl, apiKey, model: args.model, prompt, timeoutSeconds })
  const imageBase64 = result?.data?.[0]?.b64_json
  if (!imageBase64) throw new UserFacingError('接口返回成功，但没有图片数据。')

  const outDir = resolve(args['out-dir'])
  await mkdir(outDir, { recursive: true })
  const filePath = join(outDir, buildFileName(prompt, args.name))
  await writeFile(filePath, Buffer.from(imageBase64, 'base64'))

  console.log(JSON.stringify({ file: filePath, model: args.model, size: result.size, usage: result.usage }))
}

main().catch((error) => {
  const message = error instanceof UserFacingError ? error.message : `意外错误：${error?.stack || error}`
  console.error(`[ai66-image] ${message}`)
  process.exit(1)
})
