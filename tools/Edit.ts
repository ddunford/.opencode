import { tool } from "@opencode-ai/plugin"
import { readFileSync, writeFileSync } from "fs"

export default tool({
  description:
    "Perform exact string replacement in a file. Replaces old_string with new_string.",
  args: {
    file_path: tool.schema.string().describe("Absolute path to the file to edit"),
    old_string: tool.schema.string().describe("The exact text to find and replace"),
    new_string: tool.schema.string().describe("The replacement text"),
    replace_all: tool.schema
      .boolean()
      .optional()
      .describe("Replace all occurrences (default: false)"),
  },
  async execute(args) {
    try {
      const content = readFileSync(args.file_path, "utf-8")
      if (!content.includes(args.old_string)) {
        return `Error: old_string not found in ${args.file_path}. Make sure the string matches exactly.`
      }
      const count = content.split(args.old_string).length - 1
      if (count > 1 && !args.replace_all) {
        return `Error: old_string found ${count} times in ${args.file_path}. Provide more context to make it unique, or set replace_all: true.`
      }
      const updated = args.replace_all
        ? content.replaceAll(args.old_string, args.new_string)
        : content.replace(args.old_string, args.new_string)
      writeFileSync(args.file_path, updated, "utf-8")
      const replaced = args.replace_all ? count : 1
      return `Successfully replaced ${replaced} occurrence(s) in ${args.file_path}`
    } catch (e: any) {
      return `Error editing file: ${e.message}`
    }
  },
})
