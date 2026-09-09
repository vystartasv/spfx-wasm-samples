import { MockCrmContactsAdapter, MockEnterpriseAdapter, MockGraphUsersAdapter, MockSharePointListAdapter } from '../../../core/adapters';
import { hydrateAll, syncSource } from '../../../core/sync-runner';
import { SqliteStore } from '../../../core/sqlite-store';
import { CONTRACT_VERSION, isValidRpcRequest, Namespace, ProjectRecord, RpcRequest, RpcResponse } from '../../../core/types';

const scope = self as unknown as { onmessage: ((event: MessageEvent<RpcRequest>) => void) | null; postMessage: (message: RpcResponse) => void };
let store: SqliteStore | undefined;
let namespace: Namespace | undefined;
const enterprise = new MockEnterpriseAdapter();

function errorResponse(request: RpcRequest, error: unknown): RpcResponse {
  const value = error as { code?: string; message?: string; retryable?: boolean; details?: unknown };
  return { version: CONTRACT_VERSION, id: request.id, ok: false, error: { code: value.code || 'WORKER_ERROR', message: value.message || String(error), retryable: value.retryable === true, details: value.details } };
}
function requireStore(): SqliteStore { if (!store) throw Object.assign(new Error('Call init before using the data plane.'), { code: 'NOT_INITIALIZED' }); return store; }
function adapters(failure?: 'expired-cursor' | 'malformed-record' | 'offline' | 'throttle'): { users: MockGraphUsersAdapter; projects: MockSharePointListAdapter; contacts: MockCrmContactsAdapter } { return { users: new MockGraphUsersAdapter({ failure }), projects: new MockSharePointListAdapter({ failure }), contacts: new MockCrmContactsAdapter({ failure }) }; }

async function handle(request: RpcRequest): Promise<unknown> {
  if (request.version !== CONTRACT_VERSION) throw Object.assign(new Error(`Unsupported RPC version ${request.version}.`), { code: 'UNSUPPORTED_VERSION' });
  switch (request.method) {
    case 'init':
      namespace = request.payload as Namespace;
      if (!namespace?.tenantId || !namespace.userObjectId || !namespace.applicationId) throw Object.assign(new Error('tenantId, userObjectId, and applicationId are required.'), { code: 'INVALID_NAMESPACE' });
      store = await SqliteStore.create(namespace);
      return store.status();
    case 'status': return requireStore().status();
    case 'hydrate': return hydrateAll(requireStore(), adapters());
    case 'sync': {
      const payload = (request.payload || {}) as { source?: string; failure?: 'expired-cursor' | 'malformed-record' | 'offline' | 'throttle' };
      const current = requireStore().sourceStates();
      const a = adapters(payload.failure);
      if (payload.source === 'graph-users') return syncSource('graph-users', a.users, requireStore(), current.find(s => s.source === 'graph-users'), 'users');
      if (payload.source === 'sharepoint-projects') return syncSource('sharepoint-projects', a.projects, requireStore(), current.find(s => s.source === 'sharepoint-projects'), 'projects');
      if (payload.source === 'crm-contacts') return syncSource('crm-contacts', a.contacts, requireStore(), current.find(s => s.source === 'crm-contacts'), 'contacts');
      return Promise.all([syncSource('graph-users', a.users, requireStore(), current.find(s => s.source === 'graph-users'), 'users'), syncSource('sharepoint-projects', a.projects, requireStore(), current.find(s => s.source === 'sharepoint-projects'), 'projects'), syncSource('crm-contacts', a.contacts, requireStore(), current.find(s => s.source === 'crm-contacts'), 'contacts')]);
    }
    case 'query-showcase': return requireStore().query((request.payload || {}) as { text?: string; status?: string; sort?: 'name' | 'owner'; limit?: number });
    case 'mutate-optimistic-project': { const payload = request.payload as { id: string; patch: Partial<ProjectRecord> }; requireStore().mutateProject(payload.id, payload.patch); return requireStore().status(); }
    case 'flush-outbox': {
      const localStore = requireStore();
      const results: Array<{ id: string; state: string }> = [];
      for (const item of localStore.pendingOutbox()) {
        localStore.markOutbox(item.id, 'sending');
        const result = await enterprise.write(item.payload, item.baseChangedAt);
        if ('conflict' in result) { localStore.addConflict(item.entityId, item.payload, result.remote); localStore.markOutbox(item.id, 'conflict'); results.push({ id: item.id, state: 'conflict' }); }
        else { localStore.upsertProjects([result.record]); localStore.markOutbox(item.id, 'sent'); results.push({ id: item.id, state: 'sent' }); }
      }
      return { results, status: localStore.status() };
    }
    case 'simulate-conflict': {
      const localStore = requireStore();
      const id = 'project-00001';
      localStore.mutateProject(id, { name: 'Local offline edit' });
      await enterprise.write({ id, name: 'Remote edit', ownerId: 'user-00001', status: 'Active', changedAt: 1 }, 1);
      return handle({ ...request, method: 'flush-outbox' });
    }
    case 'clear-data': requireStore().clear(); return requireStore().status();
    default: throw Object.assign(new Error('Unknown RPC method.'), { code: 'UNKNOWN_METHOD' });
  }
}

scope.onmessage = event => { const request = event.data; const usable = !!request && typeof request === 'object' && typeof request.id === 'string' ? request.id : undefined; if (!isValidRpcRequest(request)) { if (usable) scope.postMessage({ version: CONTRACT_VERSION, id: usable, ok: false, error: { code: 'BAD_REQUEST', message: 'Malformed worker request.', retryable: false } }); return; } handle(request).then(result => scope.postMessage({ version: CONTRACT_VERSION, id: request.id, ok: true, result })).catch(error => scope.postMessage(errorResponse(request, error))); };
