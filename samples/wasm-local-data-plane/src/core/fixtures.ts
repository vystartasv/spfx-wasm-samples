import { ContactRecord, EntityRecord, ProjectRecord, QueryOptions, RelationshipRecord, ShowcaseRow, UserRecord } from './types';

export interface FixtureData { users: UserRecord[]; projects: ProjectRecord[]; contacts: ContactRecord[]; relationships: RelationshipRecord[]; }
export interface FixtureCounts { users: number; projects: number; contacts: number; relationships: number; }
export const DEFAULT_COUNTS: FixtureCounts = { users: 10000, projects: 10000, contacts: 5000, relationships: 20000 };
const id = (value: number): string => ('00000' + value).slice(-5);

export function userAt(index: number): UserRecord { return { id: `user-${id(index)}`, displayName: `User ${id(index)}`, mail: `user${index}@example.test`, department: ['Sales', 'Engineering', 'Operations', 'Finance'][index % 4], changedAt: 1 }; }
export function projectAt(index: number): ProjectRecord { return { id: `project-${id(index)}`, name: `Project ${id(index)}`, ownerId: userAt((index % DEFAULT_COUNTS.users) + 1).id, status: index % 3 === 0 ? 'Active' : index % 3 === 1 ? 'Planned' : 'Done', changedAt: 1 }; }
export function contactAt(index: number): ContactRecord { const userIndex = ((index - 1) % DEFAULT_COUNTS.users) + 1; return { id: `contact-${id(index)}`, name: `Contact ${id(index)}`, email: userAt(userIndex).mail, account: `Account ${('00' + ((index % 50) + 1)).slice(-2)}`, changedAt: 1 }; }

export function buildFixture(counts: FixtureCounts = DEFAULT_COUNTS): FixtureData {
  const users = Array.from({ length: counts.users }, (_, i) => userAt(i + 1));
  const projects = Array.from({ length: counts.projects }, (_, i) => projectAt((i % DEFAULT_COUNTS.projects) + 1));
  const contacts = Array.from({ length: counts.contacts }, (_, i) => contactAt(i + 1));
  const relationships = Array.from({ length: counts.relationships }, (_, i) => ({ sourceType: 'project', sourceId: projectAt((i % counts.projects) + 1).id, targetType: 'user', targetId: userAt((i % counts.users) + 1).id, relation: 'owner' }));
  return { users, projects, contacts, relationships };
}

export function page<T>(make: (index: number) => T, total: number, cursor: string | null, baseUrl: string, size: number): { items: T[]; nextLink: string | null; deltaLink: string | null } {
  const offset = cursor ? Number(new URL(cursor).searchParams.get('offset') || 0) : 0;
  const items = Array.from({ length: Math.max(0, Math.min(size, total - offset)) }, (_, i) => make(offset + i + 1));
  const nextOffset = offset + items.length;
  return { items, nextLink: nextOffset < total ? `${baseUrl}?offset=${nextOffset}&cursor=opaque-${nextOffset}` : null, deltaLink: `${baseUrl}/delta?token=opaque-${total}` };
}

export function queryFixture(fixture: FixtureData, options: QueryOptions): ShowcaseRow[] {
  const byMail = new Map(fixture.contacts.map(contact => [contact.email.toLowerCase(), contact]));
  const rows = fixture.projects.filter(project => !options.status || project.status === options.status).filter(project => !options.text || `${project.name} ${project.ownerId}`.toLowerCase().includes(options.text.toLowerCase())).map(project => {
    const owner = fixture.users.find(user => user.id === project.ownerId);
    const contact = owner ? byMail.get(owner.mail.toLowerCase()) : undefined;
    return { projectId: project.id, projectName: project.name, projectStatus: project.status, ownerId: project.ownerId, ownerName: owner?.displayName || 'Unknown owner', ownerMail: owner?.mail || '', contactName: contact?.name || null, contactAccount: contact?.account || null };
  });
  rows.sort((a, b) => (options.sort === 'owner' ? a.ownerName.localeCompare(b.ownerName) : a.projectName.localeCompare(b.projectName)) || a.projectId.localeCompare(b.projectId));
  return rows.slice(0, options.limit || 50);
}

export function recordBytes(records: EntityRecord[]): number { return new TextEncoder().encode(JSON.stringify(records)).byteLength; }
