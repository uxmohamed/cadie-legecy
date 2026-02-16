'use client';

import posthog from 'posthog-js';

interface LinkEventProperties {
  link_id?: string;
  url?: string;
  domain?: string;
  space_id?: string | null;
  content_type?: string;
  has_notes?: boolean;
  has_rich_text?: boolean;
}

interface SpaceEventProperties {
  space_id: string;
  space_name: string;
  link_count?: number;
}

interface SearchEventProperties {
  query: string;
  results_count?: number;
  filter_type?: string;
}

interface SmartSearchPlanAppliedProperties {
  chip_count: number;
  chip_kinds: string[];
  confidence: number;
  scope_type: "all" | "space" | "trash";
  latency_ms: number;
}

interface SmartSearchPlanFallbackProperties {
  reason: "timeout" | "ai_error" | "ai_unavailable";
  scope_type: "all" | "space" | "trash";
  latency_ms: number;
}

interface SmartSearchPlanLatencyProperties {
  outcome: "smart" | "literal";
  scope_type: "all" | "space" | "trash";
  latency_ms: number;
  reason?: "timeout" | "ai_error" | "ai_unavailable";
}

/**
 * Track when a user saves a new link
 */
export function trackLinkSaved(properties: LinkEventProperties) {
  posthog.capture('link_saved', properties);
}

/**
 * Track when a user archives a link
 */
export function trackLinkArchived(properties: LinkEventProperties) {
  posthog.capture('link_archived', properties);
}

/**
 * Track when a user favorites a link
 */
export function trackLinkFavorited(properties: LinkEventProperties) {
  posthog.capture('link_favorited', properties);
}

/**
 * Track when a user deletes a link
 */
export function trackLinkDeleted(properties: LinkEventProperties) {
  posthog.capture('link_deleted', properties);
}

/**
 * Track when a user updates a link
 */
export function trackLinkUpdated(properties: LinkEventProperties) {
  posthog.capture('link_updated', properties);
}

/**
 * Track when a user creates a space
 */
export function trackSpaceCreated(properties: SpaceEventProperties) {
  posthog.capture('space_created', properties);
}

/**
 * Track when a user performs a search
 */
export function trackSearch(properties: SearchEventProperties) {
  posthog.capture('search_performed', properties);
}

/**
 * Track smart-search planner success
 */
export function trackSmartSearchPlanApplied(properties: SmartSearchPlanAppliedProperties) {
  posthog.capture("smart_search_plan_applied", properties);
}

/**
 * Track smart-search planner fallback
 */
export function trackSmartSearchPlanFallback(properties: SmartSearchPlanFallbackProperties) {
  posthog.capture("smart_search_plan_fallback", properties);
}

/**
 * Track smart-search planner latency
 */
export function trackSmartSearchPlanLatency(properties: SmartSearchPlanLatencyProperties) {
  posthog.capture("smart_search_plan_latency", properties);
}

/**
 * Track when a user opens the extension authorization flow
 */
export function trackExtensionAuthStarted() {
  posthog.capture('extension_auth_started');
}

/**
 * Track when a user completes extension authorization
 */
export function trackExtensionAuthCompleted() {
  posthog.capture('extension_auth_completed');
}

/**
 * Generic event tracking function for custom events
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  posthog.capture(eventName, properties);
}

/**
 * Identify a user for PostHog analytics
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  posthog.identify(userId, properties);
}
