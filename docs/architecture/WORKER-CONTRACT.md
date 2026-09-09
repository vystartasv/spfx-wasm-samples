# Worker contract

Requests and responses use version, type, id, bounded payloads, and explicit status/result/error variants. Validate at the worker boundary. Cancellation suppresses stale results and terminates unsafe-to-cancel engines. The UI never receives engine handles.
