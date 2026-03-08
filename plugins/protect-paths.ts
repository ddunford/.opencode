export function protectPaths({ project, client }: {
  project: any;
  client: any;
  $: any;
  directory: string;
  worktree: string;
}) {
  // Pre-compile deny patterns from globs
  const denyPatterns: RegExp[] = [
    /(?:^|\/)\.env$/, // .env
    /(?:^|\/)\.env\./, // .env.*
    /(?:^|\/)secrets\//, // secrets/* and secrets/**
    /(?:^|\/)id_rsa$/, // **/id_rsa
    /\.pem$/, // **/*.pem
    /credentials/i, // **/*credentials*
  ];

  const protectedTools = new Set(["read", "edit", "write"]);

  return {
    "tool.execute.before": async (event: {
      tool: string;
      input: Record<string, any>;
    }) => {
      if (!protectedTools.has(event.tool)) {
        return;
      }

      const filePath =
        event.input?.path || event.input?.file_path || event.input?.filePath || "";
      if (!filePath) {
        return;
      }

      for (const pattern of denyPatterns) {
        if (pattern.test(filePath)) {
          client.app.log(
            `[protect-paths] Blocked access to sensitive path: ${filePath}`,
          );
          return {
            deny: true,
            reason:
              "Blocked access to a sensitive path by policy. Use redacted fixtures or document the values instead.",
          };
        }
      }

      return;
    },
  };
}
