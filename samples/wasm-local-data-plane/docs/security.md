# Security boundary

The local cache is not a security boundary. Namespace fields (`tenantId`, `userObjectId`, `applicationId`) prevent accidental cross-context database mixing in this application, but they do not replace SharePoint permissions, Graph authorization, Conditional Access, tenant policy, encryption, or server-side row security. A user who can inspect their browser profile may inspect cached data.

No threshold bypass claim is made. Local queries can reduce repeated reads after authorized hydration, but remote service limits, list-view thresholds, permissions, throttling, and compliance obligations still apply. Real adapters must use the signed-in context and server-authorized endpoints.
