import { Action, ActionPanel, Form, Icon, List } from "@vicinae/api";
import { useEffect, useState } from "react";
import HandleMissingRequirements from "./handle-missing-requirements";
import { Output } from "./types";
import {
  cancelScreenMirror,
  getDisplayOutputs,
  isScreenMirrorRunning,
  isWlMirrorInstalled,
  isWlrRandrInstalled,
  startScreenMirror,
} from "./utils";

export default function MirrorScreen() {
  const [isWlrRandrFound, setIsWlrRandrFound] = useState(true);
  const [isWlMirrorFound, setIsWlMirrorFound] = useState(true);

  const [loading, setLoading] = useState(false);
  const [outputs, setOutputs] = useState<Output[]>();
  const [isScreenMirroring, setIsScreenMirroring] = useState(false);

  const loadOutputs = async () => {
    setLoading(true);

    const wlrRandrFound = await isWlrRandrInstalled();
    if (!wlrRandrFound) {
      setLoading(false);
      setIsWlrRandrFound(false);
      return;
    }
    const wlMirrorFound = await isWlMirrorInstalled();
    if (!wlMirrorFound) {
      setLoading(false);
      setIsWlMirrorFound(false);
      return;
    }

    const isRunning = await isScreenMirrorRunning();
    setIsScreenMirroring(isRunning);

    const data = await getDisplayOutputs();
    setOutputs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadOutputs();

    const interval = setInterval(async () => {
      const isRunning = await isScreenMirrorRunning();
      setIsScreenMirroring((prev) => (prev !== isRunning ? isRunning : prev));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const enabledDisplays = outputs?.filter((output) => output.enabled !== false);

  const handleSubmit = async (values: Form.Values) => {
    if (isScreenMirroring) {
      await cancelScreenMirror(setIsScreenMirroring);
      return;
    }

    const source =
      (values.source as string) || (enabledDisplays?.[0]?.name as string);
    const target =
      (values.target as string) || (enabledDisplays?.[1]?.name as string);

    await startScreenMirror({ source, target, setIsScreenMirroring });
  };

  if (!isWlrRandrFound) {
    return (
      <HandleMissingRequirements
        reason="wlr-randr-not-found"
        onRefresh={loadOutputs}
      />
    );
  }
  if (!isWlMirrorFound) {
    return (
      <HandleMissingRequirements
        reason="wl-mirror-not-found"
        onRefresh={loadOutputs}
      />
    );
  }
  if (enabledDisplays && enabledDisplays?.length <= 1) {
    return (
      <HandleMissingRequirements
        reason="monitors-req-not-met"
        onRefresh={loadOutputs}
      />
    );
  }

  return (
    <>
      {loading ? (
        <List.EmptyView
          icon={Icon.Monitor}
          title="No Monitors Found"
          description="Could not detect active monitor outputs."
        />
      ) : (
        <Form
          isLoading={loading}
          actions={
            <ActionPanel>
              <Action.SubmitForm
                title={
                  isScreenMirroring
                    ? "Stop Screen Mirror"
                    : "Start Screen Mirror"
                }
                style={
                  isScreenMirroring
                    ? Action.Style.Destructive
                    : Action.Style.Regular
                }
                onSubmit={handleSubmit}
              />
            </ActionPanel>
          }
        >
          <Form.Description
            title={isScreenMirroring ? "" : "Note"}
            text={
              isScreenMirroring
                ? "Screen mirroring is currently active."
                : "Make sure to select different monitors for source and destination, otherwise the mirror will not work."
            }
          />

          {!isScreenMirroring && (
            <>
              <Form.Separator />

              <Form.Dropdown
                id="source"
                title="Source Monitor"
                defaultValue={enabledDisplays?.[0]?.name}
              >
                {enabledDisplays?.map((output) => {
                  const current = output.modes.find((mode) => mode.current);
                  const res = `${current?.width}x${current?.height}@${current?.refresh}Hz`;
                  return (
                    <Form.Dropdown.Item
                      key={output.name}
                      title={`${output.name} ${output.make} - ${res}`}
                      value={output.name}
                    />
                  );
                })}
              </Form.Dropdown>

              <Form.Dropdown
                id="target"
                title="Target Monitor"
                defaultValue={enabledDisplays?.[1]?.name}
              >
                {enabledDisplays?.map((output) => {
                  const current = output.modes.find((mode) => mode.current);
                  const res = `${current?.width}x${current?.height}@${current?.refresh}Hz`;
                  return (
                    <Form.Dropdown.Item
                      key={output.name}
                      title={`${output.name} ${output.make} - ${res}`}
                      value={output.name}
                    />
                  );
                })}
              </Form.Dropdown>
            </>
          )}
        </Form>
      )}
    </>
  );
}
