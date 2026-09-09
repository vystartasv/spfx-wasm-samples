import { Adapter, ContactRecord, Page, ProjectRecord, UserRecord } from './types';
import { DEFAULT_COUNTS, page, projectAt, userAt, contactAt } from './fixtures';

export interface AdapterOptions { pageSize?: number; failure?: 'expired-cursor' | 'malformed-record' | 'offline' | 'throttle'; }

function checkFailure(options: AdapterOptions, cursor: string | null): void {
  if (options.failure === 'offline') throw Object.assign(new Error('The browser is offline.'), { code: 'OFFLINE' });
  if (options.failure === 'expired-cursor' && cursor) throw Object.assign(new Error('Cursor expired.'), { status: 410 });
  if (options.failure === 'throttle') throw Object.assign(new Error('Throttled.'), { status: 429 });
}

abstract class Paged<T> implements Adapter<T> {
  protected readonly pageSize: number;
  constructor(protected readonly options: AdapterOptions = {}) { this.pageSize = options.pageSize || 500; }
  abstract readonly baseUrl: string;
  abstract readonly total: number;
  abstract make(index: number): T;
  async bootstrap(cursor: string | null): Promise<Page<T>> { checkFailure(this.options, cursor); const result = page(this.make.bind(this), this.total, cursor, this.baseUrl, this.pageSize); if (this.options.failure === 'malformed-record') (result.items as unknown[]).push({ invalid: true }); return result; }
  async delta(cursor: string | null): Promise<Page<T>> { checkFailure(this.options, cursor); return { items: [], nextLink: null, deltaLink: cursor || `${this.baseUrl}/delta?token=opaque-0` }; }
  async write(record: T): Promise<{ record: T }> { return { record }; }
}

export class MockGraphUsersAdapter extends Paged<UserRecord> { readonly baseUrl = 'https://mock.graph/users'; readonly total = DEFAULT_COUNTS.users; make(index: number): UserRecord { return userAt(index); } }
export class MockSharePointListAdapter extends Paged<ProjectRecord> { readonly baseUrl = 'https://mock.sharepoint/lists/projects/items'; readonly total = DEFAULT_COUNTS.projects; make(index: number): ProjectRecord { return projectAt(index); } }
export class MockCrmContactsAdapter extends Paged<ContactRecord> { readonly baseUrl = 'https://mock.enterprise/contacts'; readonly total = DEFAULT_COUNTS.contacts; make(index: number): ContactRecord { return contactAt(index); } }

export class MockEnterpriseAdapter implements Adapter<ProjectRecord> {
  private readonly records = new Map<string, ProjectRecord>();
  constructor() { this.records.set('project-00001', { ...projectAt(1), changedAt: 1 }); }
  async bootstrap(cursor: string | null): Promise<Page<ProjectRecord>> { return { items: Array.from(this.records.values()), nextLink: null, deltaLink: 'https://mock.enterprise/projects/delta?changedSince=1&token=opaque-1' }; }
  async delta(cursor: string | null): Promise<Page<ProjectRecord>> { const changedSince = cursor ? Number(new URL(cursor).searchParams.get('changedSince') || 0) : 0; const items = Array.from(this.records.values()).filter(record => record.changedAt > changedSince); const latest = Math.max(changedSince, ...items.map(record => record.changedAt)); return { items, nextLink: null, deltaLink: `https://mock.enterprise/projects/delta?changedSince=${latest}&token=opaque-${latest}` }; }
  async write(record: ProjectRecord, expectedChangedAt: number | null): Promise<{ record: ProjectRecord } | { conflict: true; remote: ProjectRecord }> {
    const remote = this.records.get(record.id);
    if (remote && expectedChangedAt !== null && remote.changedAt !== expectedChangedAt) return { conflict: true, remote: { ...remote } };
    const saved = { ...record, changedAt: (remote?.changedAt || 0) + 1 };
    this.records.set(record.id, saved);
    return { record: saved };
  }
}
