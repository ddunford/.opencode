import { platform } from "os";

export function notifyDesktop({ project, client, $ }: {
  project: any;
  client: any;
  $: any;
  directory: string;
  worktree: string;
}) {
  return {
    "session.idle": async (event: {
      notificationType?: string;
      hookEventName?: string;
      message?: string;
      systemMessage?: string;
      stopReason?: string;
    }) => {
      const title =
        event?.notificationType ||
        event?.hookEventName ||
        "OpenCode";
      const body =
        event?.message ||
        event?.systemMessage ||
        event?.stopReason ||
        "Notification";

      const os = platform();

      try {
        if (os === "darwin") {
          await $`osascript -e ${"display notification \"" + body.replace(/"/g, '\\"') + "\" with title \"" + title.replace(/"/g, '\\"') + "\""}`.quiet();
        } else if (os === "linux") {
          await $`notify-send ${title} ${body}`.quiet();
        } else if (os === "win32") {
          const psScript = `
            [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null;
            $t = New-Object Windows.Data.Xml.Dom.XmlDocument;
            $t.LoadXml('<toast><visual><binding template="ToastGeneric"><text>${title.replace(/'/g, "")}</text><text>${body.replace(/'/g, "")}</text></binding></visual></toast>');
            $toast = New-Object Windows.UI.Notifications.ToastNotification $t;
            [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('OpenCode').Show($toast)
          `;
          await $`powershell.exe -NoProfile -Command ${psScript}`.quiet();
        }
      } catch {
        // notification delivery is best-effort, never fail
      }

      return;
    },
  };
}
