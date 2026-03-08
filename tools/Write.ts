import { tool } from "@opencode-ai/plugin"
import { writeFileSync, mkdirSync } from "fs"
import { dirname } from "path"

export default tool({
  description:
    "Write content to a file. Creates parent directories if needed.",
  args: {
    file_path: tool.schema.string().describe("Absolute path to the file to write"),
    content: tool.schema.string().describe("The content to write to the file"),
  },
  async execute(args) {
    try {
      mkdirSync(dirname(args.file_path), { recursive: true })
      writeFileSync(args.file_path, args.content, "utf-8")
      return `Successfully wrote ${args.content.split("\n").length} lines to ${args.file_path}`
    } catch (e: any) {
      return `Error writing file: ${e.message}`
    }
  },
})
