import { Action, ActionPanel, Form, Icon, List } from "@vicinae/api";
import { useEffect, useState } from "react";
import {
  getDisplayOutputs,
  isWlMirrorInstalled,
  isWlrRandrInstalled,
  startScreenMirror,
} from "./utils";
import { Output } from "./types";
import HandleMissingRequirements from "./handle-missing-requirements";

export default function ControlledList() {
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

    const data = await getDisplayOutputs();
    setOutputs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadOutputs();
  }, []);

  const enabledDisplays = outputs?.filter((output) => output.enabled !== false);

  const handleSubmit = async (values: Form.Values) => {
    const { source, target } = values as unknown as {
      source: string;
      target: string;
    };
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
                onSubmit={handleSubmit}
              />
            </ActionPanel>
          }
        >
          <Form.Description
            title="Note"
            text="Make sure to select different monitors for source and destination, otherwise the mirror will not work."
          />
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
        </Form>
      )}
    </>
  );
}
