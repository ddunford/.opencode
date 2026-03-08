import { existsSync } from "fs";
import { resolve } from "path";

export function qualityChecks({ project, client, $, directory }: {
  project: any;
  client: any;
  $: any;
  directory: string;
  worktree: string;
}) {
  const qualityTools = new Set(["edit", "write"]);

  return {
    "tool.execute.after": async (event: {
      tool: string;
      input: Record<string, any>;
      output: any;
    }) => {
      if (!qualityTools.has(event.tool)) {
        return;
      }

      const strict = process.env.OPENCODE_HOOK_STRICT === "1";
      const notes: string[] = [];

      // JS/TS projects
      const packageJson = resolve(directory, "package.json");
      if (existsSync(packageJson)) {
        const hasPnpm = await commandExists($, "pnpm");
        const hasNpm = await commandExists($, "npm");

        if (hasPnpm) {
          await runCheck($, directory, "pnpm -s format", null, notes);
          await runCheck($, directory, "pnpm -s lint", "JS lint failed", notes);
          await runCheck(
            $,
            directory,
            "pnpm -s typecheck",
            "TS typecheck failed",
            notes,
          );
          await runCheck($, directory, "pnpm -s test", "JS tests failed", notes);
        } else if (hasNpm) {
          await runCheck($, directory, "npm run -s format", null, notes);
          await runCheck(
            $,
            directory,
            "npm run -s lint",
            "JS lint failed",
            notes,
          );
          await runCheck(
            $,
            directory,
            "npm run -s typecheck",
            "TS typecheck failed",
            notes,
          );
          await runCheck($, directory, "npm test -s", "JS tests failed", notes);
        }
      }

      // PHP projects
      const composerJson = resolve(directory, "composer.json");
      if (existsSync(composerJson)) {
        const vendorBin = resolve(directory, "vendor/bin");

        // Formatters (non-blocking)
        if (existsSync(resolve(vendorBin, "pint"))) {
          await runCheck($, directory, "vendor/bin/pint", null, notes);
        }
        if (existsSync(resolve(vendorBin, "php-cs-fixer"))) {
          await runCheck(
            $,
            directory,
            "vendor/bin/php-cs-fixer fix",
            null,
            notes,
          );
        }

        // Static analysis
        if (existsSync(resolve(vendorBin, "phpstan"))) {
          await runCheck(
            $,
            directory,
            "vendor/bin/phpstan analyse",
            "PHPStan failed",
            notes,
          );
        }
        if (existsSync(resolve(vendorBin, "psalm"))) {
          await runCheck(
            $,
            directory,
            "vendor/bin/psalm",
            "Psalm failed",
            notes,
          );
        }

        // Tests
        if (existsSync(resolve(vendorBin, "pest"))) {
          await runCheck(
            $,
            directory,
            "vendor/bin/pest",
            "Pest tests failed",
            notes,
          );
        }
        if (existsSync(resolve(vendorBin, "phpunit"))) {
          await runCheck(
            $,
            directory,
            "vendor/bin/phpunit",
            "PHPUnit tests failed",
            notes,
          );
        }
      }

      if (notes.length > 0) {
        const reason = `Quality checks reported failures: ${notes.join("; ")}.`;
        client.app.log(`[quality-checks] ${reason}`);

        if (strict) {
          return { block: true, reason };
        }
      }

      return;
    },
  };
}

async function commandExists(
  $: any,
  cmd: string,
): Promise<boolean> {
  try {
    await $`command -v ${cmd}`;
    return true;
  } catch {
    return false;
  }
}

async function runCheck(
  $: any,
  cwd: string,
  command: string,
  failLabel: string | null,
  notes: string[],
): Promise<void> {
  try {
    await $`cd ${cwd} && ${command}`.quiet();
  } catch {
    if (failLabel) {
      notes.push(failLabel);
    }
  }
}
