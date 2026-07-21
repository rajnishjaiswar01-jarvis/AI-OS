# ADR-004: Blob-First File Content Storage

> **Status:** ✅ Accepted (Owner Override)  
> **Date:** 2026-07-10  
> **Deciders:** Project Owner (override) + Principal Architect (original recommendation: strings)

---

## Context

AI OS v0.3.0 introduces a virtual file system stored in IndexedDB. File content must be stored alongside file metadata. The question: should file content be stored as strings (simple, text-only) or as Blobs (binary-compatible, future-proof)?

v0.3.0 only supports text and markdown files. Binary file support (images, PDFs) is not in scope until later versions.

## Options Considered

| Option | Pros | Cons |
|---|---|---|
| **String fields** | Simple, directly queryable, no conversion overhead | Schema migration required when binary files are added. Every existing file must be converted. |
| **Blob-first (all content as Blobs)** | Future-proof. No migration when binary support arrives. Dexie handles Blobs natively. | Requires `blob.text()` conversion for text files (negligible overhead). Content not directly queryable in IndexedDB. |
| **Hybrid (strings for text, Blobs for binary)** | Optimized per type | Two storage paths, conditional logic everywhere, migration complexity |

## Decision

**Blob-first.** All file content — including plain text and markdown — is stored as Blobs from day one.

This was an **owner override**. The architect originally recommended strings for v0.3.0 simplicity. The owner prioritized avoiding a future schema migration over v0.3.0 simplicity.

## Consequences

### Positive

- **Zero migration when binary files arrive.** Images, PDFs, and assets can be stored using the same schema.
- **Consistent storage model.** No conditional logic for "is this a text file or binary file?"
- **Dexie handles Blobs natively.** No special configuration needed.

### Negative

- **Text reading requires conversion.** `const text = await file.content.text();` — one extra async call.
- **Content not directly searchable in IndexedDB.** Full-text search across file content requires reading and indexing separately (relevant for v0.4 semantic search).
- **Slightly more complex debugging.** Blob content isn't visible in IndexedDB browser dev tools without conversion.

### Mitigations

- Create a `blob.ts` utility in `src/core/utils/` with helpers: `textToBlob(text)` and `blobToText(blob)`.
- The `blob.text()` overhead is negligible (microseconds for typical text files).

## References

- [ENGINEERING_DECISIONS.md Section 3.3](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ENGINEERING_DECISIONS.md)
- [DATABASE_DESIGN.md Section 3.2](file:///c:/Users/ritik/jarvis/AI%20OS/docs/phase2/DATABASE_DESIGN.md)
- [ARCHITECTURE_REVIEW.md Section 1.2](file:///c:/Users/ritik/jarvis/AI%20OS/docs/ARCHITECTURE_REVIEW.md) (owner override documented)
