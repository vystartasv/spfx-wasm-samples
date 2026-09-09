# Sync model

The system is local ACID plus eventual remote synchronization. It is not distributed ACID: a local commit can be durable while a remote request is offline, throttled, rejected, or conflicted. `sync_outbox` tracks optimistic project writes as `pending → sending → sent`, or `failed`/`conflict`; an open `sync_conflicts` row is visible to the UI.

Bootstrap follows paged adapter responses. The worker commits records and only then advances `sync_sources.next_link`; the final page replaces it with the adapter's deltaLink. Delta sync uses that deltaLink. Both are opaque full URLs/tokens, retained byte-for-byte; the worker does not interpret or normalize them as a persistence contract. A 410/expired cursor is a non-retryable bootstrap-required failure. An interrupted page leaves the previous committed cursor, making replay safe through primary keys and changedAt ordering.

Graph JSON batch implementations must send no more than 20 requests per batch. A throttled subrequest is independently retryable and must not cause successful siblings to be replayed unnecessarily. The deterministic milestone mocks model the cursor and classification contracts; they do not claim to emulate service throttling.
