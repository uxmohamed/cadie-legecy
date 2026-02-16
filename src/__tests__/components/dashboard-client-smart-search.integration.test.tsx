import * as React from "react";
import { act, render, waitFor } from "@testing-library/react";
import { DashboardClient } from "@/components/dashboard-client";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/trash",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => () => null,
}));

jest.mock("@/features/links/hooks/use-realtime-sync.hook", () => ({
  useRealtimeSync: jest.fn(),
}));

jest.mock("@/features/spaces/queries", () => ({
  useSpaces: () => ({
    spaces: [{ id: "space-1", name: "Research", color: "#000", user_id: "user-1" }],
    createSpace: jest.fn(),
    updateSpace: jest.fn(),
    deleteSpace: jest.fn(),
  }),
}));

jest.mock("@/components/note-editor-modal", () => ({
  NoteEditorModal: () => null,
}));

let latestShellProps: any = null;
let latestContentProps: any = null;

jest.mock("@/components/dashboard-shell", () => ({
  DashboardShell: (props: any) => {
    latestShellProps = props;
    return <div>{props.children}</div>;
  },
}));

jest.mock("@/components/dashboard-content", () => ({
  DashboardContent: (props: any) => {
    latestContentProps = props;
    return <div data-testid="dashboard-content" />;
  },
}));

describe("DashboardClient smart-search flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestShellProps = null;
    latestContentProps = null;
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        mode: "smart",
        plan: {
          rewrittenQuery: "images",
          confidence: 0.9,
          chips: [{ id: "chip-image", kind: "content_type", label: "Images", value: "image" }],
        },
      }),
    });
  });

  it("always runs planner on Enter and applies chips without forcing global view", async () => {
    render(
      <DashboardClient
        user={{ id: "user-1", email: "test@example.com" } as any}
        initialView={"trash"}
      />
    );

    expect(latestShellProps).toBeTruthy();

    act(() => {
      latestShellProps.onSearchChange("imgs");
    });

    await act(async () => {
      await latestShellProps.onSearchSubmit("imgs");
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(latestShellProps.smartChips).toHaveLength(1);
      expect(latestShellProps.searchQuery).toBe("");
    });

    expect(latestShellProps.smartChips[0]).toMatchObject({ kind: "content_type", value: "image" });
    expect(latestContentProps.smartChips).toHaveLength(1);
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0]?.[1] as RequestInit | undefined;
    const parsedBody = fetchCall?.body ? JSON.parse(fetchCall.body as string) : null;
    expect(parsedBody?.currentScope).toEqual({ selectedCategoryId: "trash" });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("applies smart fallback chips when planner returns literal timeout", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        mode: "literal",
        reason: "timeout",
      }),
    });

    render(
      <DashboardClient
        user={{ id: "user-1", email: "test@example.com" } as any}
        initialView={null}
      />
    );

    await act(async () => {
      await latestShellProps.onSearchSubmit("Portfolio links");
    });

    await waitFor(() => {
      expect(latestShellProps.smartChips.length).toBeGreaterThan(0);
      expect(latestShellProps.searchQuery).toBe("");
    });
  });
});
