import { showToast, Toast } from "@vicinae/api";
import { exec } from "child_process";
import { promisify } from "util";
export const execAsync = promisify(exec);

type ScreenMirrorProps = {
  source: string;
  target: string;
  setIsScreenMirroring: React.Dispatch<React.SetStateAction<boolean>>;
};

export async function isWlrRandrInstalled(): Promise<boolean> {
  try {
    await execAsync("wlr-randr");
    return true;
  } catch {
    return false;
  }
}

export async function isWlMirrorInstalled(): Promise<boolean> {
  try {
    await execAsync("wl-mirror --version");
    return true;
  } catch {
    return false;
  }
}

export async function getDisplayOutputs() {
  try {
    const { stdout } = await execAsync("wlr-randr --json");
    return JSON.parse(stdout);
  } catch (error) {
    return {};
  }
}

export async function startScreenMirror({
  source,
  target,
  setIsScreenMirroring,
}: ScreenMirrorProps) {
  try {
    if (source === target) {
      showToast({
        style: Toast.Style.Failure,
        title: "Source and destination cannot be the same.",
      });
      setIsScreenMirroring(false);
      return false;
    }
    await execAsync(
      `wl-mirror --fullscreen-output ${target} --fullscreen ${source}`,
    );
    showSuccess("Screen mirroring started successfully.");
    setIsScreenMirroring(true);
    return true;
  } catch (error) {
    handleError("Failed to start screen mirroring.", error);
    console.log(error);
    setIsScreenMirroring(false);
    return false;
  }
}

export function showSuccess(title: string, message?: string) {
  showToast({
    style: Toast.Style.Success,
    title,
    ...(message && { message }),
  });
}
export function handleError(title: string, error: unknown) {
  showToast({
    style: Toast.Style.Failure,
    title,
    message: error instanceof Error ? error.message : "Unknown error",
  });
}
