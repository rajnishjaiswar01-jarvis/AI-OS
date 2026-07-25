/**
 * AI OS — AI Provider Registry
 *
 * Central registry for AI providers. Manages registration, lookup,
 * and default provider selection.
 *
 * Sprint 0B bootstraps this with a dummy provider.
 * Gemini adapter registration happens in Sprint 1+.
 */

import type { AiProvider } from './types';

// ─── Registry State ──────────────────────────────────────────────────

const providers = new Map<string, AiProvider>();
let defaultProviderId: string | null = null;

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Register an AI provider. The first registered provider becomes
 * the default automatically.
 */
export function registerProvider(provider: AiProvider): void {
  if (providers.has(provider.id)) {
    console.warn(`[AI Registry] Provider "${provider.id}" is already registered. Overwriting.`);
  }

  providers.set(provider.id, provider);

  // First provider registered becomes default
  if (defaultProviderId === null) {
    defaultProviderId = provider.id;
  }
}

/** Get a provider by ID. Returns undefined if not found. */
export function getProvider(id: string): AiProvider | undefined {
  return providers.get(id);
}

/**
 * Get the current default provider.
 * Throws if no providers are registered.
 */
export function getDefaultProvider(): AiProvider {
  if (defaultProviderId === null || !providers.has(defaultProviderId)) {
    throw new Error(
      '[AI Registry] No default provider registered. ' +
      'Call registerProvider() before requesting the default.'
    );
  }
  return providers.get(defaultProviderId)!;
}

/** Set the default provider by ID. Throws if the provider is not registered. */
export function setDefaultProvider(id: string): void {
  if (!providers.has(id)) {
    throw new Error(
      `[AI Registry] Cannot set default: provider "${id}" is not registered.`
    );
  }
  defaultProviderId = id;
}

/** List all registered providers. */
export function listProviders(): AiProvider[] {
  return Array.from(providers.values());
}

/**
 * Reset the registry. Primarily for testing.
 * @internal
 */
export function _resetRegistry(): void {
  providers.clear();
  defaultProviderId = null;
}
