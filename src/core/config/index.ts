/**
 * AI OS — Application Configuration
 *
 * Centralized application-level constants.
 * BUILD_TIME and BUILD_HASH are injected by Vite at build time.
 */

export const APP_VERSION = 'v0.3.0-alpha.0';

/** ISO 8601 timestamp of when this build was created */
export const BUILD_TIME: string = __BUILD_TIME__;

/** Short git commit hash (or 'dev' in development) */
export const BUILD_HASH: string = __BUILD_HASH__;
