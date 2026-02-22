import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { GlobalCommandMenu } from "@/components/global-command-menu";

function renderMenu(overrides: Partial<React.ComponentProps<typeof GlobalCommandMenu>> = {}) {
  const props: React.ComponentProps<typeof GlobalCommandMenu> = {
    open: true,
    onOpenChange: jest.fn(),
    isTrashView: false,
    viewMode: "list",
    spaces: [],
    selectedCategoryId: null,
    onOpenAddMode: jest.fn(),
    onViewChange: jest.fn(),
    onViewModeChange: jest.fn(),
    onSortChange: jest.fn(),
    onToggleHelp: jest.fn(),
    onUploadClick: jest.fn(),
    onCreateNote: jest.fn(),
    onCreateSpace: jest.fn(),
    initialSearchQuery: "",
    onCommitSearch: jest.fn(),
    ...overrides,
  };

  render(<GlobalCommandMenu {...props} />);
  return props;
}

describe("GlobalCommandMenu", () => {
  it("keeps typed characters in command input and does not commit search while typing", async () => {
    const onCommitSearch = jest.fn();
    renderMenu({ onCommitSearch });

    const input = screen.getByPlaceholderText("Type to search links, colors, files, or run actions...");
    fireEvent.change(input, { target: { value: "nvm/12" } });

    expect(input).toHaveValue("nvm/12");
    expect(onCommitSearch).not.toHaveBeenCalled();
  });

  it("commits search only on explicit Enter confirmation", async () => {
    const onCommitSearch = jest.fn();
    renderMenu({ onCommitSearch });

    const input = screen.getByPlaceholderText("Type to search links, colors, files, or run actions...");
    fireEvent.change(input, { target: { value: "alpha" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCommitSearch).toHaveBeenCalledTimes(1);
    expect(onCommitSearch).toHaveBeenCalledWith("alpha");
  });

  it("executes focused item with Enter, not hovered item", async () => {
    const onCommitSearch = jest.fn();
    const onOpenAddMode = jest.fn();
    renderMenu({ onCommitSearch, onOpenAddMode });

    const input = screen.getByPlaceholderText("Type to search links, colors, files, or run actions...");
    fireEvent.change(input, { target: { value: "li" } });

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });

    const searchAction = screen.getByRole("button", { name: /search for/i });
    fireEvent.mouseEnter(searchAction);

    fireEvent.keyDown(input, { key: "Enter" });

    expect(onOpenAddMode).toHaveBeenCalledWith("li");
    expect(onCommitSearch).not.toHaveBeenCalled();
  });

  it("uses stronger hover style on command items", () => {
    renderMenu();

    const linkItem = screen.getByRole("button", { name: /link/i });
    expect(linkItem).toHaveClass("hover:bg-bg-hover");
  });
});
