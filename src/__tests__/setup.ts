import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';
import { ReadableStream, TransformStream, WritableStream } from 'stream/web';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
}

if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = ReadableStream as unknown as typeof global.ReadableStream;
}

if (typeof global.WritableStream === 'undefined') {
  global.WritableStream = WritableStream as unknown as typeof global.WritableStream;
}

if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = TransformStream as unknown as typeof global.TransformStream;
}

if (typeof global.MessagePort === 'undefined' || typeof global.MessageChannel === 'undefined') {
  class MockMessageEvent<T = unknown> extends Event {
    data: T;

    constructor(type: string, init?: { data?: T }) {
      super(type);
      this.data = init?.data as T;
    }
  }

  class MockMessagePort extends EventTarget {
    onmessage: ((event: MessageEvent) => void) | null = null;
    private counterpart: MockMessagePort | null = null;
    private isClosed = false;

    setCounterpart(counterpart: MockMessagePort) {
      this.counterpart = counterpart;
    }

    postMessage(message?: unknown) {
      if (this.isClosed || !this.counterpart || this.counterpart.isClosed) return;

      queueMicrotask(() => {
        if (!this.counterpart || this.counterpart.isClosed) return;
        const event = new MockMessageEvent("message", { data: message }) as unknown as MessageEvent;
        this.counterpart.dispatchEvent(event);
        this.counterpart.onmessage?.(event);
      });
    }

    start() {
      return undefined;
    }

    close() {
      this.isClosed = true;
      this.onmessage = null;
    }
  }

  class MockMessageChannel {
    port1: MockMessagePort;
    port2: MockMessagePort;

    constructor() {
      this.port1 = new MockMessagePort();
      this.port2 = new MockMessagePort();
      this.port1.setCounterpart(this.port2);
      this.port2.setCounterpart(this.port1);
    }
  }

  global.MessagePort = MockMessagePort as unknown as typeof global.MessagePort;
  global.MessageChannel = MockMessageChannel as unknown as typeof global.MessageChannel;
}

if (typeof global.Request === "undefined") {
  class MockRequest {
    url: string;
    headers: Headers;
    method: string;

    constructor(input: string, init?: { headers?: HeadersInit; method?: string }) {
      this.url = input;
      this.headers = new Headers(init?.headers);
      this.method = init?.method || "GET";
    }
  }

  global.Request = MockRequest as unknown as typeof global.Request;
}

if (typeof global.Response === "undefined") {
  class MockResponse {
    headers: Headers;
    status: number;
    ok: boolean;

    constructor(_body?: unknown, init?: { headers?: HeadersInit; status?: number }) {
      this.headers = new Headers(init?.headers);
      this.status = init?.status ?? 200;
      this.ok = this.status >= 200 && this.status < 300;
    }
  }

  global.Response = MockResponse as unknown as typeof global.Response;
}

// =============================================================================
// Mock: Supabase Client
// =============================================================================

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    }),
    getSession: jest.fn().mockResolvedValue({
      data: { session: { access_token: 'mock-token' } },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnValue('SUBSCRIBED'),
  })),
  removeChannel: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
  createAdminClient: jest.fn(() => mockSupabaseClient),
}));

// =============================================================================
// Mock: Toast Notifications
// =============================================================================

jest.mock('sonner', () => ({
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn().mockReturnValue('toast-id'),
    dismiss: jest.fn(),
  }),
}));

// =============================================================================
// Mock: Navigator Clipboard
// =============================================================================

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
  writable: true,
});

// =============================================================================
// Mock: Next.js Navigation
// =============================================================================

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// =============================================================================
// Mock: Window methods
// =============================================================================

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// =============================================================================
// Global Fetch Mock (can be overridden per test)
// =============================================================================

global.fetch = jest.fn();

// =============================================================================
// Reset all mocks before each test
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockReset();
});

// =============================================================================
// Export mock for use in tests
// =============================================================================

export { mockSupabaseClient };
