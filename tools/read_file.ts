import { tool } from "@opencode-ai/plugin"
import { readFileSync } from "fs"

export default tool({
  description: "Read a file from the filesystem. Alias for the built-in read tool.",
  args: {
    file_path: tool.schema.string().describe("The absolute path to the file to read"),
    offset: tool.schema.number().optional().describe("Line number to start reading from"),
    limit: tool.schema.number().optional().describe("Number of lines to read"),
  },
  async execute(args) {
    try {
      const content = readFileSync(args.file_path, "utf-8")
      const lines = content.split("\n")
      const start = (args.offset ?? 1) - 1
      const end = args.limit ? start + args.limit : lines.length
      const sliced = lines.slice(Math.max(0, start), end)
      return sliced
        .map((line, i) => `${String(start + i + 1).padStart(6)}  ${line}`)
        .join("\n")
    } catch (e: any) {
      return `Error reading file: ${e.message}`
    }
  },
})
