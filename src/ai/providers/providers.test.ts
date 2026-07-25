/**
 * AI OS — AI Provider Tests
 *
 * Tests for the provider interface, registry, and dummy provider.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { dummyProvider } from './dummy';
import {
  registerProvider,
  getProvider,
  getDefaultProvider,
  setDefaultProvider,
  listProviders,
  _resetRegistry,
} from './registry';
import type { AiProvider, AiMessage } from './types';

// ─── Dummy Provider Tests ────────────────────────────────────────────

describe('dummyProvider', () => {
  it('has correct id and name', () => {
    expect(dummyProvider.id).toBe('dummy');
    expect(dummyProvider.name).toBe('Dummy Provider');
  });

  it('is always configured', () => {
    expect(dummyProvider.isConfigured()).toBe(true);
  });

  it('returns a response for a known command', async () => {
    const messages: AiMessage[] = [{ role: 'user', content: 'hello' }];
    const response = await dummyProvider.generate(messages);

    expect(response.content).toContain('dummy provider');
    expect(response.usage.totalTokens).toBeGreaterThan(0);
  });

  it('returns a default response for unknown input', async () => {
    const messages: AiMessage[] = [{ role: 'user', content: 'some random text' }];
    const response = await dummyProvider.generate(messages);

    expect(response.content).toContain('dummy response');
  });

  it('uses the last user message for response lookup', async () => {
    const messages: AiMessage[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'Hi there!' },
      { role: 'user', content: 'version' },
    ];
    const response = await dummyProvider.generate(messages);

    expect(response.content).toContain('v1.0.0');
  });

  it('respects abort signal', async () => {
    const controller = new AbortController();
    controller.abort();

    const messages: AiMessage[] = [{ role: 'user', content: 'hello' }];

    await expect(
      dummyProvider.generate(messages, { signal: controller.signal })
    ).rejects.toThrow('cancelled');
  });

  it('reports token usage based on message lengths', async () => {
    const messages: AiMessage[] = [{ role: 'user', content: 'hello' }];
    const response = await dummyProvider.generate(messages);

    expect(response.usage.inputTokens).toBe(5); // 'hello'.length
    expect(response.usage.outputTokens).toBe(response.content.length);
    expect(response.usage.totalTokens).toBe(
      response.usage.inputTokens + response.usage.outputTokens
    );
  });
});

// ─── Provider Registry Tests ─────────────────────────────────────────

describe('providerRegistry', () => {
  beforeEach(() => {
    _resetRegistry();
  });

  it('registers a provider and retrieves it by ID', () => {
    registerProvider(dummyProvider);

    expect(getProvider('dummy')).toBe(dummyProvider);
  });

  it('returns undefined for unregistered provider', () => {
    expect(getProvider('nonexistent')).toBeUndefined();
  });

  it('sets first registered provider as default', () => {
    registerProvider(dummyProvider);

    expect(getDefaultProvider()).toBe(dummyProvider);
  });

  it('throws when no default provider is registered', () => {
    expect(() => getDefaultProvider()).toThrow('No default provider');
  });

  it('allows changing the default provider', () => {
    const secondProvider: AiProvider = {
      id: 'test',
      name: 'Test Provider',
      async generate() {
        return { content: 'test', usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 } };
      },
      isConfigured: () => true,
    };

    registerProvider(dummyProvider);
    registerProvider(secondProvider);

    expect(getDefaultProvider().id).toBe('dummy');

    setDefaultProvider('test');
    expect(getDefaultProvider().id).toBe('test');
  });

  it('throws when setting default to unregistered provider', () => {
    expect(() => setDefaultProvider('nonexistent')).toThrow('not registered');
  });

  it('lists all registered providers', () => {
    registerProvider(dummyProvider);

    const list = listProviders();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('dummy');
  });

  it('resets correctly', () => {
    registerProvider(dummyProvider);
    _resetRegistry();

    expect(listProviders()).toHaveLength(0);
    expect(getProvider('dummy')).toBeUndefined();
  });
});
