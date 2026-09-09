# Limitations

- Sync is simulated; there is no SharePoint REST or Graph request and no credential handling.
- OPFS availability and persistence vary by browser and embedding context and are not verified by Jest tests.
- The memory fallback is intentionally non-persistent and is not a security boundary.
- The sample demonstrates one list-style dataset, not a general synchronization framework.
- Namespace isolation is a keying contract covered by tests; tenant behavior is not verified in a tenant.
- Conflict resolution is intentionally not implemented; conflicts remain visible until reset.
