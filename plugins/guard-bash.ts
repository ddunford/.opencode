export function guardBash({ project, client }: {
  project: any;
  client: any;
  $: any;
  directory: string;
  worktree: string;
}) {
  return {
    "tool.execute.before": async (event: {
      tool: string;
      input: Record<string, any>;
    }) => {
      if (event.tool !== "bash") {
        return;
      }

      const cmd = event.input?.command || "";
      if (!cmd) {
        return;
      }

      const denyPatterns: RegExp[] = [
        /(?:^|\s)rm\s+-rf\s+[/~.*]/,
        /(?:^|\s)mkfs\./,
        /(?:^|\s)dd\s.*of=\/dev\//,
        /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;?\s*:/,
        /(?:^|\s)curl\s.*\|\s*(sh|bash)/,
        /(?:^|\s)wget\s.*\|\s*(sh|bash)/,
        /(?:^|\s)git\s+reset\s+--hard\s+HEAD~/,
        /(?:^|\s)git\s+push\s+--force/,
      ];

      for (const pattern of denyPatterns) {
        if (pattern.test(cmd)) {
          client.app.log(
            `[guard-bash] Blocked dangerous command: ${cmd.substring(0, 80)}`,
          );
          return {
            deny: true,
            reason:
              "Blocked dangerous Bash command by policy. If you really need this, run it manually.",
          };
        }
      }

      return;
    },
  };
}
