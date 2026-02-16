import * as React from "react";
import { render, waitFor } from "@testing-library/react";
import { DashboardContent } from "@/components/dashboard-content";
import { createMockLink, resetLinkIdCounter } from "@/__tests__/fixtures/link.fixtures";
import type { LinkFilters } from "@/features/links/types";

const useLinksQueryMock = jest.fn();
const useSearchLinksMock = jest.fn();
const useLinkMutationsMock = jest.fn();
const useSpacesMock = jest.fn();
const fromMock = jest.fn();

let latestLinkListProps: any = null;

jest.mock("@/features/links/queries/use-links-query", () => ({
  useLinksQuery: (...args: unknown[]) => useLinksQueryMock(...args),
}));

jest.mock("@/features/links/hooks/use-search-links", () => ({
  useSearchLinks: (...args: unknown[]) => useSearchLinksMock(...args),
}));

jest.mock("@/features/links/queries/use-link-mutations", () => ({
  useLinkMutations: (...args: unknown[]) => useLinkMutationsMock(...args),
  useCopyUrl: () => ({ copyUrl: jest.fn() }),
}));

jest.mock("@/features/spaces/queries", () => ({
  useSpaces: (...args: unknown[]) => useSpacesMock(...args),
}));

jest.mock("@/components/link-list", () => ({
  LinkList: (props: any) => {
    latestLinkListProps = props;
    return <div data-testid="link-list" />;
  },
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (...args: unknown[]) => fromMock(...args),
  }),
}));

function buildMutations() {
  return {
    deleteLink: jest.fn(),
    restoreLink: jest.fn(),
    permanentDeleteLink: jest.fn(),
    updateLink: jest.fn(),
    pinLink: jest.fn(),
    unpinLink: jest.fn(),
    batchDeleteLinks: jest.fn(),
    batchRestoreLinks: jest.fn(),
    batchPermanentDeleteLinks: jest.fn(),
    batchPinLinks: jest.fn(),
    batchUnpinLinks: jest.fn(),
    addLinks: jest.fn(),
    addImageFiles: jest.fn(),
    addDocumentFiles: jest.fn(),
    addNote: jest.fn(),
    isAddingLinks: false,
    isUploadingImages: false,
  };
}

function renderDashboardContent(props: Partial<React.ComponentProps<typeof DashboardContent>> = {}) {
  render(
    <DashboardContent
      user={{ id: "user-1", email: "test@example.com" } as any}
      selectedCategoryId={null}
      sortBy="date"
      sortOrder="desc"
      isAddingItem={false}
      addInputValue=""
      onAddInputChange={jest.fn()}
      onAddSubmit={jest.fn()}
      onAddCancel={jest.fn()}
      onSelectionChange={jest.fn()}
      searchQuery=""
      smartChips={[]}
      timezone="UTC"
      viewMode="list"
      {...props}
    />
  );
}

describe("DashboardContent smart-search behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetLinkIdCounter();
    latestLinkListProps = null;

    useSpacesMock.mockReturnValue({
      spaces: [],
      addLinksToSpace: jest.fn(),
      removeLinksFromSpace: jest.fn(),
    });
    useLinkMutationsMock.mockReturnValue(buildMutations());
    fromMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({ data: [] }),
      }),
    });
  });

  it("keeps selected space scope when smart chips are present", async () => {
    const scopedLinks = [createMockLink({ id: "in-space" })];
    useLinksQueryMock.mockImplementation((filters: LinkFilters) => {
      expect(filters).toEqual({
        space_id: "11111111-1111-1111-1111-111111111111",
        is_deleted: false,
        is_archived: false,
      });
      return {
        links: scopedLinks,
        isLoading: false,
        isFetching: false,
      };
    });
    useSearchLinksMock.mockReturnValue(scopedLinks);

    renderDashboardContent({
      selectedCategoryId: "11111111-1111-1111-1111-111111111111",
      smartChips: [{ id: "chip-type", kind: "content_type", label: "Images", value: "image" }],
    });

    await waitFor(() => {
      expect(useLinksQueryMock).toHaveBeenCalled();
      expect(latestLinkListProps.links).toEqual(scopedLinks);
    });
  });

  it("preserves relevance order during search mode", async () => {
    const linkA = createMockLink({ id: "a", title: "A", created_at: "2026-01-01T00:00:00.000Z" });
    const linkB = createMockLink({ id: "b", title: "B", created_at: "2026-02-01T00:00:00.000Z", is_pinned: true });
    const linkC = createMockLink({ id: "c", title: "C", created_at: "2026-01-15T00:00:00.000Z" });
    const allLinks = [linkA, linkB, linkC];
    const relevanceOrder = [linkC, linkA, linkB];

    useLinksQueryMock.mockReturnValue({
      links: allLinks,
      isLoading: false,
      isFetching: false,
    });
    useSearchLinksMock.mockImplementation((_links: unknown, query: string) => {
      return query.trim() ? relevanceOrder : allLinks;
    });

    renderDashboardContent({
      searchQuery: "query",
    });

    await waitFor(() => {
      expect(latestLinkListProps.links.map((link: any) => link.id)).toEqual(["c", "a", "b"]);
    });
  });

  it("keeps date/pinned sorting in non-search mode", async () => {
    const linkA = createMockLink({ id: "a", title: "A", created_at: "2026-01-01T00:00:00.000Z" });
    const linkB = createMockLink({ id: "b", title: "B", created_at: "2026-02-01T00:00:00.000Z", is_pinned: true });
    const linkC = createMockLink({ id: "c", title: "C", created_at: "2026-01-15T00:00:00.000Z" });
    const allLinks = [linkA, linkB, linkC];

    useLinksQueryMock.mockReturnValue({
      links: allLinks,
      isLoading: false,
      isFetching: false,
    });
    useSearchLinksMock.mockReturnValue(allLinks);

    renderDashboardContent({
      searchQuery: "",
    });

    await waitFor(() => {
      expect(latestLinkListProps.links.map((link: any) => link.id)).toEqual(["b", "c", "a"]);
    });
  });

  it("relaxes weak url-type chip when strict search returns zero", async () => {
    const portfolioNote = createMockLink({
      id: "portfolio-note",
      content_type: "note",
      title: "Portfolio Ideas",
    });

    useLinksQueryMock.mockReturnValue({
      links: [portfolioNote],
      isLoading: false,
      isFetching: false,
    });

    useSearchLinksMock
      .mockImplementationOnce(() => []) // strict path (url chip filtered out everything)
      .mockImplementationOnce(() => [portfolioNote]); // relaxed path

    renderDashboardContent({
      plannerRewrittenQuery: "portfolio",
      smartChips: [
        { id: "chip-url", kind: "content_type", label: "Links", value: "url" },
        { id: "chip-keyword", kind: "keyword", label: "portfolio", term: "portfolio" },
      ],
    });

    await waitFor(() => {
      expect(latestLinkListProps.links.map((link: any) => link.id)).toEqual(["portfolio-note"]);
    });
  });
});
