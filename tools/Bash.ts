import { tool } from "@opencode-ai/plugin"
import { execSync } from "child_process"

export default tool({
  description:
    "Execute a bash command and return its output.",
  args: {
    command: tool.schema.string().describe("The bash command to execute"),
    description: tool.schema
      .string()
      .optional()
      .describe("Description of what this command does"),
    timeout: tool.schema
      .number()
      .optional()
      .describe("Timeout in milliseconds (default: 120000)"),
  },
  async execute(args) {
    try {
      const timeout = args.timeout ?? 120_000
      const result = execSync(args.command, {
        encoding: "utf-8",
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        shell: "/bin/bash",
      })
      return result || "(no output)"
    } catch (e: any) {
      const stdout = e.stdout ?? ""
      const stderr = e.stderr ?? ""
      return `Command exited with code ${e.status ?? "unknown"}\n${stdout}\n${stderr}`.trim()
    }
  },
})
