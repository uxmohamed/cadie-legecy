import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { SmartSearchChip } from "@/features/search/types/smart-search.types";

jest.mock("@/components/user-menu", () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}));

jest.mock("@/components/view-switcher", () => ({
  ViewSwitcher: () => <div data-testid="view-switcher" />,
}));

jest.mock("@/components/dock", () => ({
  Dock: () => <div data-testid="dock" />,
}));

jest.mock("@/components/global-command-menu", () => ({
  GlobalCommandMenu: () => <div data-testid="global-command-menu" />,
}));

jest.mock("@/components/shortcut-context", () => ({
  useShortcuts: () => ({
    registerShortcut: jest.fn(() => "shortcut-id"),
    unregisterShortcut: jest.fn(),
    toggleHelp: jest.fn(),
  }),
}));

function buildProps(overrides: Partial<React.ComponentProps<typeof DashboardShell>> = {}) {
  const chips: SmartSearchChip[] = overrides.smartChips || [];

  return {
    user: { id: "user-1", email: "test@example.com" } as any,
    children: <div>content</div>,
    selectedCategoryId: null,
    onViewChange: jest.fn(),
    sortBy: "date" as const,
    sortOrder: "desc" as const,
    onSortChange: jest.fn(),
    isAddingItem: false,
    onOpenAddMode: jest.fn(),
    searchQuery: "",
    onSearchChange: jest.fn(),
    onSearchSubmit: jest.fn(),
    smartChips: chips,
    onRemoveSmartChip: jest.fn(),
    onClearSmartChips: jest.fn(),
    isSmartParsing: false,
    selectedCount: 0,
    selectedLinks: [],
    onClearSelection: jest.fn(),
    onBatchDelete: jest.fn(),
    viewMode: "list" as const,
    onViewModeChange: jest.fn(),
    ...overrides,
  };
}

describe("DashboardShell smart search interactions", () => {
  it("submits smart parsing on Enter", () => {
    const onSearchSubmit = jest.fn();

    render(
      <DashboardShell
        {...buildProps({
          searchQuery: "yesterday twitter links",
          onSearchSubmit,
        })}
      />
    );

    const input = screen.getByLabelText("Search");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSearchSubmit).toHaveBeenCalledWith("yesterday twitter links");
  });

  it("removes last chip on Backspace when input is empty", () => {
    const onRemoveSmartChip = jest.fn();
    const chips: SmartSearchChip[] = [
      { id: "chip-1", kind: "date", label: "Yesterday", preset: "yesterday" },
      { id: "chip-2", kind: "source", label: "Twitter", sourceId: "twitter", domains: ["x.com"] },
    ];

    render(
      <DashboardShell
        {...buildProps({
          searchQuery: "",
          smartChips: chips,
          onRemoveSmartChip,
        })}
      />
    );

    const input = screen.getByLabelText("Search");
    fireEvent.keyDown(input, { key: "Backspace" });

    expect(onRemoveSmartChip).toHaveBeenCalledWith("chip-2");
  });

  it("clears text first, then clears chips on Escape", () => {
    const onSearchChange = jest.fn();
    const onClearSmartChips = jest.fn();

    const chips: SmartSearchChip[] = [
      { id: "chip-1", kind: "date", label: "Yesterday", preset: "yesterday" },
    ];

    const { rerender } = render(
      <DashboardShell
        {...buildProps({
          searchQuery: "twitter",
          smartChips: chips,
          onSearchChange,
          onClearSmartChips,
        })}
      />
    );

    const input = screen.getByLabelText("Search");
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onSearchChange).toHaveBeenCalledWith("");
    expect(onClearSmartChips).not.toHaveBeenCalled();

    rerender(
      <DashboardShell
        {...buildProps({
          searchQuery: "",
          smartChips: chips,
          onSearchChange,
          onClearSmartChips,
        })}
      />
    );

    fireEvent.keyDown(screen.getByLabelText("Search"), { key: "Escape" });
    expect(onClearSmartChips).toHaveBeenCalled();
  });
});
