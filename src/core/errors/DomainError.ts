/**
 * AI OS — Domain Errors
 *
 * Typed error class for business logic failures.
 * Used by services to communicate domain-specific errors to components.
 * Components catch these and display user-friendly feedback.
 *
 * @see SYSTEM_ARCHITECTURE.md §6 — Error Propagation Flow
 */

// ─── Error Codes ─────────────────────────────────────────────────────

export type DomainErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'DUPLICATE_NAME'
  | 'OPERATION_FAILED'
  | 'STORAGE_FULL';

// ─── Domain Error Class ──────────────────────────────────────────────

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly retryable: boolean;

  constructor(code: DomainErrorCode, message: string, retryable = false) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.retryable = retryable;
  }
}
