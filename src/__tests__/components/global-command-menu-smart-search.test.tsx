import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { GlobalCommandMenu } from "@/components/global-command-menu";

jest.mock("@/components/ui/command", () => ({
  CommandDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandEmpty: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input aria-label="command-input" {...props} />
  ),
  CommandItem: ({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) => (
    <button type="button" onClick={onSelect}>
      {children}
    </button>
  ),
  CommandList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandSeparator: () => <hr />,
  CommandShortcut: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

describe("GlobalCommandMenu smart search", () => {
  it("routes search command through onSearchSubmit", () => {
    const onSearchSubmit = jest.fn();
    const onSearchChange = jest.fn();

    render(
      <GlobalCommandMenu
        open={true}
        onOpenChange={jest.fn()}
        isTrashView={false}
        viewMode="list"
        selectedCategoryId={null}
        onOpenAddMode={jest.fn()}
        onViewChange={jest.fn()}
        onViewModeChange={jest.fn()}
        onSortChange={jest.fn()}
        onToggleHelp={jest.fn()}
        searchQuery="yesterday twitter links"
        onSearchChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Search for/i }));

    expect(onSearchSubmit).toHaveBeenCalledWith("yesterday twitter links");
  });
});
