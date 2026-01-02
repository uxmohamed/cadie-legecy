'use client';

import posthog from 'posthog-js';

interface LinkEventProperties {
  link_id?: string;
  url?: string;
  domain?: string;
  category_id?: string | null;
  content_type?: string;
  has_notes?: boolean;
  has_rich_text?: boolean;
}

interface CategoryEventProperties {
  category_id: string;
  category_name: string;
  link_count?: number;
}

interface SearchEventProperties {
  query: string;
  results_count?: number;
  filter_type?: string;
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
 * Track when a user creates a category
 */
export function trackCategoryCreated(properties: CategoryEventProperties) {
  posthog.capture('category_created', properties);
}

/**
 * Track when a user performs a search
 */
export function trackSearch(properties: SearchEventProperties) {
  posthog.capture('search_performed', properties);
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


interface OnboardingEventProperties {
  step?: string;
  success?: boolean;
}

interface ViewEventProperties {
  view_name: string;
  category_id?: string | null;
}

interface BulkActionEventProperties {
  action_type: string;
  item_count: number;
}

interface ThemeEventProperties {
  theme: string;
}

/**
 * Track when a user starts onboarding
 */
export function trackOnboardingStarted() {
  posthog.capture('onboarding_started');
}

/**
 * Track when a user completes an onboarding step
 */
export function trackOnboardingStepCompleted(step: string) {
  posthog.capture('onboarding_step_completed', { step });
}

/**
 * Track when a user completes onboarding
 */
export function trackOnboardingCompleted() {
  posthog.capture('onboarding_completed');
}

/**
 * Track when a user opens a link
 */
export function trackLinkOpened(properties: LinkEventProperties) {
  posthog.capture('link_opened', properties);
}

/**
 * Track when a user performs a bulk action
 */
export function trackBulkAction(properties: BulkActionEventProperties) {
  posthog.capture('bulk_action_performed', properties);
}

/**
 * Track when a user changes the view
 */
export function trackViewChanged(properties: ViewEventProperties) {
  posthog.capture('view_changed', properties);
}

/**
 * Track when a user changes the theme
 */
export function trackThemeChanged(properties: ThemeEventProperties) {
  posthog.capture('theme_changed', properties);
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
