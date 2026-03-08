import { readFile } from "fs/promises";
import { resolve } from "path";
import { existsSync } from "fs";

export function sessionBanner({ project, client, directory }: {
  project: any;
  client: any;
  $: any;
  directory: string;
  worktree: string;
}) {
  return {
    "session.created": async () => {
      const banner =
        "Hooks active: Bash guard, sensitive path protection, post-edit quality checks, desktop notifications.";
      const parts: string[] = [banner];

      const globalLessons = resolve(
        process.env.HOME || "~",
        ".config/opencode/lessons.md",
      );
      const projectLessons = resolve(directory, "lessons.md");

      if (existsSync(globalLessons)) {
        try {
          const content = await readFile(globalLessons, "utf-8");
          parts.push("--- GLOBAL LESSONS (apply everywhere) ---");
          parts.push(content.trim());
        } catch {
          // file unreadable, skip
        }
      }

      if (
        existsSync(projectLessons) &&
        resolve(projectLessons) !== resolve(globalLessons)
      ) {
        try {
          const content = await readFile(projectLessons, "utf-8");
          parts.push("--- PROJECT LESSONS (specific to this project) ---");
          parts.push(content.trim());
        } catch {
          // file unreadable, skip
        }
      }

      const systemMessage = parts.join("\n\n");
      client.app.log(`[session-banner] ${banner}`);

      return { systemMessage };
    },
  };
}
