# Identity resolution

The showcase joins project owners to Graph users by stable owner ID and joins a CRM contact by normalized email only for the deterministic fixture. `source_identities` and `canonical_entities` are present for a future explicit identity-resolution pipeline with source, source ID, canonical ID, and confidence.

Email normalization is a composition convenience, not proof of identity and never an authorization decision. A real adapter must define tenant-approved matching keys, ambiguity handling, provenance, retention, and conflict behavior before claiming person-360 correctness.
