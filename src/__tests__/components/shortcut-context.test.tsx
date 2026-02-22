import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { ShortcutProvider, useShortcuts } from "@/components/shortcut-context";

const setThemeMock = jest.fn();
const routerMock = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

jest.mock("@/components/theme-provider", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: setThemeMock,
  }),
}));

function Harness({
  shortcutKey,
  onTrigger,
  allowInInput,
  includeCommandInput = true,
}: {
  shortcutKey: string;
  onTrigger: () => void;
  allowInInput?: boolean;
  includeCommandInput?: boolean;
}) {
  const { registerShortcut, unregisterShortcut } = useShortcuts();

  React.useEffect(() => {
    const id = registerShortcut({
      key: shortcutKey,
      description: "test shortcut",
      category: "Global",
      action: onTrigger,
      allowInInput,
      priority: 999,
    });

    return () => unregisterShortcut(id);
  }, [allowInInput, onTrigger, registerShortcut, shortcutKey, unregisterShortcut]);

  return includeCommandInput ? <input data-command-input="true" data-testid="command-input" /> : <div data-testid="outside" />;
}

describe("ShortcutProvider command-input behavior", () => {
  it("ignores single-key shortcuts when focus is inside command input", () => {
    const onTrigger = jest.fn();

    render(
      <ShortcutProvider>
        <Harness shortcutKey="n" onTrigger={onTrigger} />
      </ShortcutProvider>
    );

    const input = screen.getByTestId("command-input");
    input.focus();
    fireEvent.keyDown(input, { key: "n" });

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("keeps modifier shortcuts active in command input when allowed", () => {
    const onTrigger = jest.fn();

    render(
      <ShortcutProvider>
        <Harness shortcutKey="Cmd+k" onTrigger={onTrigger} allowInInput />
      </ShortcutProvider>
    );

    const input = screen.getByTestId("command-input");
    input.focus();
    fireEvent.keyDown(input, { key: "k", metaKey: true });

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("still triggers shortcuts outside command input", () => {
    const onTrigger = jest.fn();

    render(
      <ShortcutProvider>
        <Harness shortcutKey="n" onTrigger={onTrigger} includeCommandInput={false} />
      </ShortcutProvider>
    );

    fireEvent.keyDown(document.body, { key: "n" });

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });
});
