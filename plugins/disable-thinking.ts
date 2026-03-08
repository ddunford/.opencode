/**
 * Disable Qwen Thinking Mode
 *
 * Qwen 3.5 models have a built-in thinking/reasoning mode that consumes
 * most of the output token budget before generating tool calls, causing
 * the model to "think" endlessly without acting.
 *
 * This plugin prepends /no_think to the system prompt to disable it.
 */

import type { Plugin } from "@opencode-ai/plugin"

export const disableThinking: Plugin = async () => {
  return {
    "experimental.chat.system.transform": async (_input, output) => {
      output.system.unshift("/no_think")
    },
  }
}
