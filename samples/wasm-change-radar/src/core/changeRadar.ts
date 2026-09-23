export const RPC_VERSION = 1;
export const MAX_PAGES = 80;
export const MAX_CONTENT_CHARS = 64 * 1024;
export const MAX_REFERENCES_PER_PAGE = 50;
export const MAX_PAGE_REQUESTS = 5;
export const MAX_CONTEXT_CHARS = 180;

export type ScopeMode = 'demo' | 'current-site';
export type ProposedAction = 'retire' | 'move' | 'rename' | 'replace';

export interface PageRecord {
  url: string;
  title: string;
  content: string;
  permission?: 'ok' | 'denied';
  warning?: string;
}

export interface AnalysisInput {
  scope: ScopeMode;
  siteUrl: string;
  targetUrl: string;
  action: ProposedAction;
  replacementUrl?: string;
  pages?: PageRecord[];
}

export interface ImpactItem {
  url: string;
  title: string;
  relation: 'direct' | 'indirect';
  distance: number;
  cycle: boolean;
  context: string;
  warnings: string[];
}

export interface AnalysisResult {
  targetUrl: string;
  action: ProposedAction;
  source: 'Demo fixture' | 'Current-site GET adapter';
  engine: 'Native TypeScript';
  durationMs: number;
  summary: {
    pagesScanned: number;
    direct: number;
    indirect: number;
    cycles: number;
    missing: number;
    external: number;
    warnings: number;
  };
  impacts: ImpactItem[];
  warnings: string[];
}

export interface RpcAnalyzeRequest { version: typeof RPC_VERSION; id: string; method: 'analyze'; payload: AnalysisInput; }
export interface RpcCancelRequest { version: typeof RPC_VERSION; id: string; method: 'cancel'; }
export type RpcRequest = RpcAnalyzeRequest | RpcCancelRequest;
export interface RpcResponse { version: typeof RPC_VERSION; id: string; ok: boolean; result?: AnalysisResult; error?: { code: string; message: string }; }

export class AnalysisCancelledError extends Error {
  public readonly code = 'CANCELLED';
  public constructor() { super('Analysis request cancelled.'); }
}

const ACTIONS: ProposedAction[] = ['retire', 'move', 'rename', 'replace'];
const SCOPES: ScopeMode[] = ['demo', 'current-site'];

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function cleanPath(pathname: string): string {
  const path = pathname.replace(/\/+/g, '/').replace(/\/$/, '');
  return path || '/';
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, number: string) => String.fromCodePoint(Number(number)));
}

function siteRoot(siteUrl: string): URL | undefined {
  try {
    const url = new URL(siteUrl);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return undefined;
    url.hash = ''; url.search = ''; url.pathname = cleanPath(url.pathname);
    return url;
  } catch { return undefined; }
}

export interface UrlCheck { valid: boolean; normalized?: string; external?: boolean; reason?: string; }

export function normalizeSiteUrl(value: string): string | undefined {
  const root = siteRoot(value);
  return root?.toString().replace(/\/$/, '');
}

export function validateSameSiteUrl(siteUrl: string, value: string): UrlCheck {
  const root = siteRoot(siteUrl);
  if (!root) return { valid: false, reason: 'The site URL must be an HTTP(S) URL.' };
  let candidate: URL;
  try { candidate = new URL(value, `${root.toString().replace(/\/$/, '')}/`); }
  catch { return { valid: false, reason: 'The URL is not valid.' }; }
  if (!/^https?:$/.test(candidate.protocol)) return { valid: false, reason: 'Only HTTP(S) URLs are supported.' };
  if (candidate.origin !== root.origin) return { valid: false, external: true, reason: 'The URL is outside the current site.' };
  const rootPath = cleanPath(root.pathname);
  const candidatePath = cleanPath(candidate.pathname);
  if (candidatePath !== rootPath && !candidatePath.startsWith(`${rootPath}/`)) return { valid: false, reason: 'The URL does not preserve the current site managed path.' };
  candidate.pathname = candidatePath;
  candidate.search = '';
  candidate.hash = '';
  return { valid: true, normalized: candidate.toString().replace(/\/$/, '') };
}

export interface ExtractedReference { raw: string; url?: string; external: boolean; context: string; }

function contextFor(content: string, index: number): string {
  const start = Math.max(0, index - 100);
  const excerpt = decodeHtml(content.slice(start, index + 160)).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return excerpt.slice(0, MAX_CONTEXT_CHARS) || '(no surrounding text)';
}

export function extractReferences(content: string, siteUrl: string): ExtractedReference[] {
  const references: ExtractedReference[] = [];
  const seen = new Set<string>();
  const hrefPattern = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  const add = (rawValue: string, index: number): void => {
    const raw = decodeHtml(rawValue).trim().replace(/^(["'])(.*)\1$/, '$2').replace(/[),.;]+$/, '');
    if (!raw || seen.has(raw)) return;
    seen.add(raw);
    const parsed = validateSameSiteUrl(siteUrl, raw);
    if (parsed.valid) references.push({ raw, url: parsed.normalized, external: false, context: contextFor(content, index) });
    else references.push({ raw, external: parsed.external === true, context: contextFor(content, index) });
  };
  let match: RegExpExecArray | null;
  while ((match = hrefPattern.exec(content)) && references.length < MAX_REFERENCES_PER_PAGE) add(match[1] || match[2] || match[3] || '', match.index);
  return references;
}

export function validateAnalysisInput(value: unknown): string[] {
  const input = asRecord(value);
  const errors: string[] = [];
  if (!input || SCOPES.indexOf(input.scope as ScopeMode) < 0) errors.push('Choose a supported scan scope.');
  if (!input || typeof input.siteUrl !== 'string' || !normalizeSiteUrl(input.siteUrl)) errors.push('Enter a valid HTTP(S) site URL.');
  if (!input || typeof input.targetUrl !== 'string' || !input.targetUrl.trim()) errors.push('Choose a target URL.');
  else if (typeof input.siteUrl === 'string' && !validateSameSiteUrl(input.siteUrl, input.targetUrl).valid) errors.push('The target URL must stay within the current site managed path.');
  if (!input || ACTIONS.indexOf(input.action as ProposedAction) < 0) errors.push('Choose a proposed action.');
  if (input?.action !== 'retire' && typeof input?.replacementUrl !== 'string') errors.push('Enter a replacement or destination URL for this action.');
  if (typeof input?.replacementUrl === 'string' && input.replacementUrl.trim() && typeof input.siteUrl === 'string' && !validateSameSiteUrl(input.siteUrl, input.replacementUrl).valid) errors.push('The replacement URL must stay within the current site managed path.');
  if (input?.pages !== undefined) {
    if (!Array.isArray(input.pages) || input.pages.length > MAX_PAGES) errors.push(`Provide no more than ${MAX_PAGES} pages.`);
    else input.pages.forEach((page, index) => {
      const record = asRecord(page);
      if (!record || typeof record.url !== 'string' || typeof record.title !== 'string' || typeof record.content !== 'string') errors.push(`Page ${index + 1} is malformed.`);
      else {
        if (record.content.length > MAX_CONTENT_CHARS) errors.push(`${record.url} exceeds the ${MAX_CONTENT_CHARS} character content limit.`);
        if (record.permission !== undefined && record.permission !== 'ok' && record.permission !== 'denied') errors.push(`${record.url} has an invalid permission state.`);
        if (record.warning !== undefined && typeof record.warning !== 'string') errors.push(`${record.url} has a malformed warning.`);
      }
    });
  }
  return errors;
}

function uniqueSorted(values: ReadonlyArray<string>): string[] { return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b)); }

function canReach(start: string, goal: string, adjacency: Map<string, string[]>): boolean {
  const seen = new Set<string>(); const pending = [...(adjacency.get(start) || [])];
  while (pending.length) { const current = pending.pop() as string; if (current === goal) return true; if (!seen.has(current)) { seen.add(current); pending.push(...(adjacency.get(current) || [])); } }
  return false;
}

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value as object).sort().map(key => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(',')}}`;
  return JSON.stringify(value) || 'null';
}

export function stableHash(value: unknown): string {
  let hash = 2166136261;
  const text = stableJson(value);
  for (let index = 0; index < text.length; index += 1) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619) >>> 0; }
  return (`00000000${hash.toString(16)}`).slice(-8);
}

export function exportReport(result: AnalysisResult): string {
  const { durationMs: _durationMs, ...deterministicResult } = result;
  return JSON.stringify({ formatVersion: 1, result: deterministicResult, hash: stableHash(deterministicResult) }, null, 2);
}

export function fixturePages(siteUrl: string): PageRecord[] {
  const root = normalizeSiteUrl(siteUrl) || 'https://contoso.sharepoint.com/sites/demo';
  const page = (name: string): string => `${root}/SitePages/${name}.aspx`;
  return [
    { url: page('Legacy'), title: 'Legacy page (target)', content: '<p>Proposed retirement target.</p>' },
    { url: page('Home'), title: 'Home', content: `<a href="${page('Legacy')}">legacy link</a><a href="${page('Overview')}">overview</a>` },
    { url: page('Overview'), title: 'Overview', content: `<a href="${page('Legacy')}?view=compact&amp;mode=1">legacy overview reference</a>` },
    { url: page('Guide'), title: 'Guide', content: `<a href="${page('Overview')}">read the overview</a>` },
    { url: `${page('Guide')}/`, title: 'Guide duplicate record', content: `<a href="${page('Overview')}">duplicate canonical URL</a>` },
    { url: page('CycleA'), title: 'Cycle A', content: `<a href="${page('Legacy')}">legacy dependency</a><a href="${page('CycleB')}">cycle B</a>` },
    { url: page('CycleB'), title: 'Cycle B', content: `<a href="${page('CycleA')}">cycle A</a>` },
    { url: page('Missing'), title: 'Missing reference example', content: `<a href="${page('Legacy')}">legacy dependency</a><a href="${page('NotCollected')}">uncollected page</a>` },
    { url: page('External'), title: 'External reference example', content: `<a href="${page('Legacy')}">legacy dependency</a><a href="https://external.example.invalid/policy">external policy</a>` },
    { url: page('Escaped'), title: 'Escaped and malformed content', content: `<p>Escaped link: <a href=&quot;${page('Legacy')}&quot;>legacy</a><a href="${page('Legacy')}">unterminated` },
    { url: page('Permission'), title: 'Permission warning example', permission: 'denied', warning: 'Permission denied while reading this page.' , content: `<a href="${page('Legacy')}">hidden legacy link</a>` },
    { url: page('Throttle'), title: 'Throttle warning example', warning: 'SharePoint reported a throttling warning for this page.', content: `<a href="${page('Legacy')}">legacy link</a>` }
  ];
}

export function analyzePages(input: AnalysisInput, isCancelled: () => boolean = () => false): AnalysisResult {
  const errors = validateAnalysisInput(input);
  if (errors.length) throw Object.assign(new Error(errors.join(' ')), { code: 'INVALID_INPUT' });
  const site = normalizeSiteUrl(input.siteUrl) as string;
  const target = validateSameSiteUrl(site, input.targetUrl).normalized as string;
  const pages = input.pages || fixturePages(site);
  const source = input.scope === 'demo' ? 'Demo fixture' : 'Current-site GET adapter';
  const warnings: string[] = [];
  const records = new Map<string, { page: PageRecord; title: string; content: string; warnings: string[] }>();
  const duplicateUrls: string[] = [];
  const sortedPages = [...pages].sort((a, b) => a.url.localeCompare(b.url));
  for (let index = 0; index < sortedPages.length; index += 1) {
    if (isCancelled()) throw new AnalysisCancelledError();
    const page = sortedPages[index];
    const normalized = validateSameSiteUrl(site, page.url).normalized;
    if (!normalized) { warnings.push(`Skipped page outside the current site: ${page.url}`); continue; }
    if (records.has(normalized)) { duplicateUrls.push(normalized); continue; }
    records.set(normalized, { page, title: page.title || normalized, content: page.content.slice(0, MAX_CONTENT_CHARS), warnings: page.warning ? [page.warning] : [] });
  }
  duplicateUrls.forEach(url => warnings.push(`Duplicate canonical URL ignored: ${url}`));
  const adjacency = new Map<string, string[]>();
  const edgeContexts = new Map<string, Map<string, string>>();
  const reverse = new Map<string, string[]>();
  let missing = 0; let external = 0;
  records.forEach((_, url) => {
    adjacency.set(url, []); reverse.set(url, []); edgeContexts.set(url, new Map());
  });
  records.forEach((record, url) => {
    if (record.page.permission === 'denied') { record.warnings.push('Content was not included because permission was denied.'); return; }
    const refs = extractReferences(record.content, site);
    refs.forEach(reference => {
      if (reference.external) { external += 1; warnings.push(`External reference ignored: ${reference.raw}`); return; }
      if (!reference.url) { warnings.push(`Malformed or unsupported reference ignored: ${reference.raw}`); return; }
      if (!records.has(reference.url)) { missing += 1; warnings.push(`Missing scanned page: ${reference.url}`); return; }
      const edges = adjacency.get(url) as string[];
      if (edges.indexOf(reference.url) < 0) { edges.push(reference.url); (reverse.get(reference.url) as string[]).push(url); }
      const contexts = edgeContexts.get(url) as Map<string, string>;
      if (!contexts.has(reference.url)) contexts.set(reference.url, reference.context);
    });
  });
  adjacency.forEach(edges => edges.sort((a, b) => a.localeCompare(b)));
  reverse.forEach(edges => edges.sort((a, b) => a.localeCompare(b)));
  const distances = new Map<string, number>([[target, 0]]); const queue = [target];
  while (queue.length) {
    if (isCancelled()) throw new AnalysisCancelledError();
    const current = queue.shift() as string;
    for (const parent of reverse.get(current) || []) if (!distances.has(parent)) { distances.set(parent, (distances.get(current) as number) + 1); queue.push(parent); }
  }
  const cycleNodes = new Set<string>();
  distances.forEach((_, url) => { if (canReach(url, url, adjacency)) cycleNodes.add(url); });
  const impacts: ImpactItem[] = [];
  distances.forEach((distance, url) => {
    if (url === target) return;
    const record = records.get(url);
    if (!record) return;
    const next = (adjacency.get(url) || []).find(edge => distances.get(edge) === distance - 1);
    const context = next ? edgeContexts.get(url)?.get(next) || '' : '';
    impacts.push({ url, title: record.title, relation: distance === 1 ? 'direct' : 'indirect', distance, cycle: cycleNodes.has(url), context, warnings: uniqueSorted(record.warnings) });
  });
  impacts.sort((a, b) => a.distance - b.distance || a.url.localeCompare(b.url));
  if (!records.has(target)) warnings.push(`Target is not present in the scanned page set: ${target}`);
  const sortedWarnings = uniqueSorted(warnings);
  return {
    targetUrl: target, action: input.action, source, engine: 'Native TypeScript', durationMs: 0,
    summary: { pagesScanned: records.size, direct: impacts.filter(item => item.relation === 'direct').length, indirect: impacts.filter(item => item.relation === 'indirect').length, cycles: impacts.filter(item => item.cycle).length, missing, external, warnings: sortedWarnings.length },
    impacts, warnings: sortedWarnings
  };
}

export function isRpcRequest(value: unknown): value is RpcRequest {
  const record = asRecord(value);
  if (!record || record.version !== RPC_VERSION || typeof record.id !== 'string' || record.id.length < 1 || record.id.length > 64 || (record.method !== 'analyze' && record.method !== 'cancel')) return false;
  return record.method === 'cancel' || validateAnalysisInput(record.payload).length === 0;
}

export function isRpcResponse(value: unknown): value is RpcResponse {
  const record = asRecord(value);
  if (!record || record.version !== RPC_VERSION || typeof record.id !== 'string' || typeof record.ok !== 'boolean') return false;
  if (!record.ok) {
    const error = asRecord(record.error);
    return !!error && typeof error.code === 'string' && typeof error.message === 'string';
  }
  const result = asRecord(record.result);
  if (!result || typeof result.targetUrl !== 'string' || typeof result.engine !== 'string' || typeof result.source !== 'string' || !Array.isArray(result.impacts) || result.impacts.length > MAX_PAGES || !Array.isArray(result.warnings) || result.warnings.length > MAX_PAGES * 2) return false;
  return result.impacts.every(item => {
    const impact = asRecord(item);
    return !!impact && typeof impact.url === 'string' && typeof impact.title === 'string' && (impact.relation === 'direct' || impact.relation === 'indirect')
      && typeof impact.distance === 'number' && typeof impact.cycle === 'boolean' && typeof impact.context === 'string' && impact.context.length <= MAX_CONTEXT_CHARS
      && Array.isArray(impact.warnings) && impact.warnings.length <= MAX_REFERENCES_PER_PAGE;
  });
}
