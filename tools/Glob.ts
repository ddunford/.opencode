import { tool } from "@opencode-ai/plugin"
import { execSync } from "child_process"

export default tool({
  description:
    "Find files matching a glob pattern. Returns paths sorted by modification time.",
  args: {
    pattern: tool.schema
      .string()
      .describe('Glob pattern to match files (e.g. "**/*.ts", "src/**/*.md")'),
    path: tool.schema
      .string()
      .optional()
      .describe("Directory to search in (default: cwd)"),
  },
  async execute(args) {
    try {
      const dir = args.path ?? "."
      // Use rg --files with glob to find matching files, sorted by mtime
      const cmd = `find ${dir} -path '${args.pattern}' -type f 2>/dev/null | head -200 | xargs -r ls -t 2>/dev/null`
      const result = execSync(cmd, {
        encoding: "utf-8",
        timeout: 20_000,
        maxBuffer: 5 * 1024 * 1024,
        shell: "/bin/bash",
      })
      return result || "(no matches)"
    } catch (e: any) {
      // Fallback: try rg --files --glob
      try {
        const dir = args.path ?? "."
        const result = execSync(
          `rg --files --glob '${args.pattern}' ${dir} 2>/dev/null | head -200`,
          {
            encoding: "utf-8",
            timeout: 20_000,
            shell: "/bin/bash",
          },
        )
        return result || "(no matches)"
      } catch {
        return `Error: ${e.message}`
      }
    }
  },
})
