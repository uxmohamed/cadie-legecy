import { NextResponse } from 'next/server';
import { PostHogClient } from '@/lib/posthog-server';

/**
 * Example API route demonstrating server-side PostHog usage.
 * 
 * This route shows how to:
 * 1. Capture server-side events
 * 2. Fetch feature flags
 * 3. Properly shutdown the client
 * 
 * DELETE THIS FILE if you don't need it - it's just for demonstration.
 */
export async function GET() {
  const posthog = PostHogClient();
  
  try {
    // Example 1: Capture a server-side event
    posthog.capture({
      distinctId: 'user_123',
      event: 'api_called',
      properties: {
        endpoint: '/api/analytics/example',
        timestamp: new Date().toISOString(),
      }
    });

    // Example 2: Fetch feature flags for a user
    const flags = await posthog.getAllFlags('user_123');

    // Example 3: Check a specific feature flag
    const isFlagEnabled = await posthog.isFeatureEnabled(
      'new-feature',
      'user_123'
    );

    // Always shutdown the client to flush events
    await posthog.shutdown();

    return NextResponse.json({
      success: true,
      message: 'Server-side analytics example',
      flags,
      isFlagEnabled,
    });
  } catch {
    // Make sure to shutdown even on error
    await posthog.shutdown();
    
    return NextResponse.json(
      { error: 'Failed to process analytics' },
      { status: 500 }
    );
  }
}
