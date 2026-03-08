import { readdir, readFile } from "fs/promises";
import { resolve, join } from "path";
import { existsSync } from "fs";

export function promptContext({ project, client, directory }: {
  project: any;
  client: any;
  $: any;
  directory: string;
  worktree: string;
}) {
  return {
    "tui.prompt.append": async () => {
      const base =
        "House rules: prefer minimal diffs, follow existing repo conventions, and run the fastest available checks (lint, typecheck, tests) after code changes. Do not touch secrets or .env files. If a change is risky, explain the risk and a rollback plan. CRITICAL: NEVER skip, defer, or partially implement a task. Complete every task fully before marking it done. If blocked, ask the user — do not silently skip.";

      let planContext = "";
      const planDir = resolve(directory, "plan");

      if (existsSync(planDir)) {
        try {
          const files = await readdir(planDir);

          // Implementation task progress
          const phaseFiles = files.filter(
            (f) => f.startsWith("phase-") && f.endsWith(".md"),
          );
          let totalTasks = 0;
          let doneTasks = 0;
          let nextTask = "";
          let nextFile = "";

          for (const file of phaseFiles) {
            const content = await readFile(join(planDir, file), "utf-8");
            const lines = content.split("\n");
            for (const line of lines) {
              if (/^- \[[ x]\]/.test(line)) {
                totalTasks++;
                if (/^- \[x\]/.test(line)) {
                  doneTasks++;
                } else if (!nextTask) {
                  nextTask = line.replace(/^- \[ \] /, "");
                  nextFile = file;
                }
              }
            }
          }

          const pendingTasks = totalTasks - doneTasks;
          if (pendingTasks > 0 && nextTask) {
            planContext += ` | PLAN PROGRESS: ${doneTasks}/${totalTasks} tasks complete (${pendingTasks} pending). Next: ${nextTask} (${nextFile})`;
          }

          // Test plan progress
          const testFiles = files.filter(
            (f) => f.startsWith("test-plan-") && f.endsWith(".md"),
          );
          let testTotal = 0;
          let testPass = 0;
          let testFail = 0;

          for (const file of testFiles) {
            const content = await readFile(join(planDir, file), "utf-8");
            const lines = content.split("\n");
            for (const line of lines) {
              if (/^- \[[ x!]\]/.test(line)) {
                testTotal++;
                if (/^- \[x\]/.test(line)) {
                  testPass++;
                } else if (/^- \[!\]/.test(line)) {
                  testFail++;
                }
              }
            }
          }

          const testUntested = testTotal - testPass - testFail;
          if ((testTotal > 0 && testUntested > 0) || testFail > 0) {
            let testContext = ` | TEST PROGRESS: ${testPass}/${testTotal} passing`;
            if (testFail > 0) {
              testContext += `, ${testFail} FAILING`;
            }
            if (testUntested > 0) {
              testContext += `, ${testUntested} untested`;
            }
            planContext += testContext;
          }
        } catch {
          // plan dir unreadable, skip
        }
      }

      return { additionalContext: `${base}${planContext}` };
    },
  };
}
