
import { SupabaseLinkRepository } from "@/features/links/repositories/supabase-link.repository";

// Mock Supabase client
const mockOr = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockRange = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockIn = jest.fn().mockReturnThis();
const mockSelect = jest.fn().mockReturnThis();
const mockLinkSpacesSelect = jest.fn().mockReturnThis();
const mockLinkSpacesEq = jest.fn().mockReturnThis();

const mockFrom = jest.fn().mockReturnValue({
  select: mockSelect,
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
});

const mockSupabase = {
  from: (table: string) => {
    if (table === 'link_spaces') {
      return {
        select: mockLinkSpacesSelect,
        // Mock the chain explicitly for link_spaces
        eq: (col: string, val: string) => {
             // Return the mock but also ensure it has a 'then' or can be awaited if treated as promise
             // The repo awaits it: const { data } = await ...
             // So we need to return a Promise-like object or just valid data
             return Promise.resolve({ data: [{ link_id: 'link-123' }], error: null });
        }
      };
    }
    return mockFrom(table);
  },
};

// Mock createClient
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));

// Setup chain for tests
mockSelect.mockReturnValue({
  eq: mockEq,
  or: mockOr,
  order: mockOrder,
  range: mockRange,
  in: mockIn,
});

mockEq.mockReturnValue({
  eq: mockEq,
  or: mockOr,
  order: mockOrder,
  range: mockRange,
  in: mockIn,
});

mockIn.mockReturnValue({
  eq: mockEq,
  or: mockOr,
  order: mockOrder,
  range: mockRange,
});

mockOr.mockReturnValue({
  order: mockOrder,
  range: mockRange,
});

mockOrder.mockReturnValue({
  range: mockRange,
  order: mockOrder,
});

mockRange.mockResolvedValue({ data: [], error: null, count: 0 });

// Handle link_spaces mocking specifically
mockLinkSpacesSelect.mockReturnValue({
    eq: jest.fn().mockResolvedValue({ data: [{ link_id: 'link-123' }], error: null })
});


describe("SupabaseLinkRepository Query Construction", () => {
  let repository: SupabaseLinkRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new SupabaseLinkRepository();
  });

  it("should quote search terms in .or() clause (Standard Link Query)", async () => {
    const userId = "user-123";
    const searchQuery = "search_term";
    
    await repository.findAll(userId, undefined, 10, 0, searchQuery);

    const expectedSearchTerm = `%${searchQuery}%`;
    const orCalls = mockOr.mock.calls;
    // We expect at least one call. Since we cleared mocks, it should be the only one associated with this flow
    // calling specific matcher
    const orCall = orCalls.find(call => call[0].includes("title.ilike"));
    
    expect(orCall).toBeDefined();
    expect(orCall[0]).toContain(`title.ilike."${expectedSearchTerm}"`);
    expect(orCall[0]).toContain(`url.ilike."${expectedSearchTerm}"`);
  });

  it("should quote search terms in .or() clause (Space Filtered Query)", async () => {
    const userId = "user-123";
    const spaceId = "space-123";
    const searchQuery = "search_term";

    // Re-setup mock specifically to ensure link_spaces returns data 
    // The implementation above in mockSupabase should handle it, but let's be sure
    
    await repository.findAll(userId, { space_id: spaceId }, 10, 0, searchQuery);

    const expectedSearchTerm = `%${searchQuery}%`;
    const orCalls = mockOr.mock.calls;
    const orCall = orCalls.find(call => call[0].includes("title.ilike"));
    
    expect(orCall).toBeDefined();
    expect(orCall[0]).toContain(`title.ilike."${expectedSearchTerm}"`);
    expect(orCall[0]).toContain(`url.ilike."${expectedSearchTerm}"`);
  });
});
