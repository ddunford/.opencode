/**
 * Tool Name Compatibility Plugin
 *
 * Many models (Claude, Qwen, Llama, etc.) are trained on data containing
 * tool names like read_file, Read, Write, etc. that don't match OpenCode's
 * built-in tools (read, write, edit, bash, etc.).
 *
 * This plugin injects tool name guidance into the system prompt for ALL
 * models to ensure they use the correct OpenCode tool names.
 */

import type { Plugin } from "@opencode-ai/plugin"

const TOOL_NAME_GUIDANCE = `
## CRITICAL: Correct Tool Names

You MUST use ONLY these exact tool names. Any other tool name will fail.

To read a file: use "read" (NOT read_file, Read, ReadFile, cat)
To write/create a file: use "write" (NOT Write, WriteFile, write_file)
To edit a file: use "edit" (NOT Edit, str_replace_editor)
To run a shell command: use "bash" (NOT Bash, execute, terminal, shell)
To search file contents: use "grep" (NOT Grep, search, ripgrep)
To find files by pattern: use "glob" (NOT Glob, find, list_files)
To list a directory: use "list" (NOT ls, list_dir)
To fetch a URL: use "webfetch" (NOT WebFetch, fetch, curl)
To apply a patch: use "patch" (NOT Patch)

NEVER use read_file — it does not exist. The tool is called "read".
NEVER describe what you would do — actually call the tool.
`.trim()

export const toolCompat: Plugin = async () => {
  return {
    "experimental.chat.system.transform": async (_input, output) => {
      // Apply to ALL models — many are trained on Claude/Copilot transcripts
      output.system.push(TOOL_NAME_GUIDANCE)
    },
  }
}
