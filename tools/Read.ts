import { tool } from "@opencode-ai/plugin"
import { readFileSync } from "fs"

export default tool({
  description:
    "Read a file from the filesystem. Supports offset and limit for large files.",
  args: {
    file_path: tool.schema.string().describe("Absolute path to the file to read"),
    offset: tool.schema
      .number()
      .optional()
      .describe("Line number to start reading from (1-based)"),
    limit: tool.schema
      .number()
      .optional()
      .describe("Number of lines to read"),
  },
  async execute(args) {
    try {
      const content = readFileSync(args.file_path, "utf-8")
      const lines = content.split("\n")
      const start = Math.max(0, (args.offset ?? 1) - 1)
      const end = args.limit ? start + args.limit : lines.length
      const sliced = lines.slice(start, end)
      return sliced
        .map((line, i) => `${String(start + i + 1).padStart(6)}  ${line}`)
        .join("\n")
    } catch (e: any) {
      return `Error reading file: ${e.message}`
    }
  },
})
