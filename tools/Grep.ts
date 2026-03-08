import { tool } from "@opencode-ai/plugin"
import { execSync } from "child_process"

export default tool({
  description:
    "Search file contents using ripgrep. Supports regex patterns and file filtering.",
  args: {
    pattern: tool.schema.string().describe("Regex pattern to search for"),
    path: tool.schema
      .string()
      .optional()
      .describe("File or directory to search in (default: cwd)"),
    glob: tool.schema
      .string()
      .optional()
      .describe('Glob pattern to filter files (e.g. "*.ts", "*.{js,jsx}")'),
    output_mode: tool.schema
      .enum(["content", "files_with_matches", "count"])
      .optional()
      .describe("Output mode (default: files_with_matches)"),
    "-i": tool.schema.boolean().optional().describe("Case insensitive search"),
    "-n": tool.schema.boolean().optional().describe("Show line numbers"),
    "-A": tool.schema.number().optional().describe("Lines after match"),
    "-B": tool.schema.number().optional().describe("Lines before match"),
    "-C": tool.schema.number().optional().describe("Context lines"),
    head_limit: tool.schema
      .number()
      .optional()
      .describe("Limit output to first N entries"),
  },
  async execute(args) {
    try {
      const mode = args.output_mode ?? "files_with_matches"
      const parts = ["rg"]

      if (mode === "files_with_matches") parts.push("-l")
      else if (mode === "count") parts.push("-c")

      if (args["-i"]) parts.push("-i")
      if (args["-n"] !== false && mode === "content") parts.push("-n")
      if (args["-A"] && mode === "content") parts.push(`-A${args["-A"]}`)
      if (args["-B"] && mode === "content") parts.push(`-B${args["-B"]}`)
      if (args["-C"] && mode === "content") parts.push(`-C${args["-C"]}`)
      if (args.glob) parts.push(`--glob`, args.glob)

      parts.push("--", args.pattern)
      if (args.path) parts.push(args.path)

      let cmd = parts.join(" ")
      if (args.head_limit) cmd += ` | head -n ${args.head_limit}`

      const result = execSync(cmd, {
        encoding: "utf-8",
        timeout: 30_000,
        maxBuffer: 5 * 1024 * 1024,
        shell: "/bin/bash",
      })
      return result || "(no matches)"
    } catch (e: any) {
      if (e.status === 1) return "(no matches)"
      return `Error: ${e.stderr || e.message}`
    }
  },
})
