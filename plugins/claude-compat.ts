/**
 * Claude Model Compatibility Plugin
 *
 * Injects tool name corrections into the system prompt when using Claude models.
 * Claude models are trained with their own tool names (Read, Write, Edit, Bash, etc.)
 * which don't match OpenCode's built-in tools (read, write, edit, bash, etc.).
 * This plugin adds a system prompt section that redirects the model to use the
 * correct OpenCode tool names.
 */

import type { Plugin } from "@opencode-ai/plugin"

const TOOL_NAME_GUIDANCE = `
## CRITICAL: Tool Names

You are running inside OpenCode. You MUST use the exact tool names listed below.
Do NOT use Claude Code tool names — they will fail silently.

| Action | Use this tool | DO NOT use |
|--------|--------------|------------|
| Read a file | read | Read, read_file, ReadFile, cat |
| Write/create a file | write | Write, WriteFile, write_file |
| Edit/replace in a file | edit | Edit, str_replace_editor |
| Run a shell command | bash | Bash, execute, terminal, shell |
| Search file contents | grep | Grep, search, ripgrep, rg |
| Find files by pattern | glob | Glob, find, list_files |
| List a directory | list | ls, list_dir, ListDir |
| Fetch a URL | webfetch | WebFetch, fetch, curl, web_search |
| Apply a patch | patch | Patch |

IMPORTANT:
- Always call the actual tool. Never just describe what you would do.
- If you need to create a file, call the write tool. If you need to edit, call the edit tool.
- Do not hallucinate tool calls or pretend you called a tool. Actually invoke it.
`.trim()

export const claudeCompat: Plugin = async ({ client }) => {
  return {
    "experimental.chat.system.transform": async (input, output) => {
      // Only inject for Claude/Anthropic models
      const modelId = input.model?.id ?? ""
      const provider = input.model?.provider ?? ""
      if (
        provider.includes("anthropic") ||
        modelId.includes("claude")
      ) {
        output.system.push(TOOL_NAME_GUIDANCE)
      }
    },
  }
}
