import { importPKCS8, SignJWT } from 'jose';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API_BASE = 'https://www.googleapis.com/webmasters/v3';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

type SearchRow = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number };
type SitemapContent = { type?: string; submitted?: string; indexed?: string };
type Sitemap = { path?: string; lastSubmitted?: string; isPending?: boolean; isSitemapsIndex?: boolean; errors?: string; warnings?: string; contents?: SitemapContent[] };

function configuration() {
  return {
    clientEmail: process.env.SEARCH_CONSOLE_CLIENT_EMAIL?.trim() ?? '',
    privateKey: process.env.SEARCH_CONSOLE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim() ?? '',
    siteUrl: process.env.SEARCH_CONSOLE_SITE_URL?.trim() ?? 'https://www.jahatelo.com/',
  };
}

export function isSearchConsoleConfigured() {
  const config = configuration();
  return Boolean(config.clientEmail && config.privateKey && config.siteUrl);
}

async function accessToken() {
  const config = configuration();
  const key = await importPKCS8(config.privateKey, 'RS256');
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(config.clientEmail)
    .setAudience(TOKEN_URL)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Search Console authentication failed (${response.status})`);
  const payload = await response.json() as { access_token?: string };
  if (!payload.access_token) throw new Error('Search Console did not return an access token');
  return payload.access_token;
}

function dateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function googleRequest<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Search Console API failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function getSearchConsoleDashboard(days = 28) {
  const config = configuration();
  const token = await accessToken();
  const endDate = new Date();
  endDate.setUTCDate(endDate.getUTCDate() - 2);
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - days + 1);
  const site = encodeURIComponent(config.siteUrl);
  const queryBody = { startDate: dateString(startDate), endDate: dateString(endDate), type: 'web', dataState: 'final' };

  const [summary, queries, pages, sitemapResponse] = await Promise.all([
    googleRequest<{ rows?: SearchRow[] }>(token, `/sites/${site}/searchAnalytics/query`, { method: 'POST', body: JSON.stringify(queryBody) }),
    googleRequest<{ rows?: SearchRow[] }>(token, `/sites/${site}/searchAnalytics/query`, { method: 'POST', body: JSON.stringify({ ...queryBody, dimensions: ['query'], rowLimit: 10 }) }),
    googleRequest<{ rows?: SearchRow[] }>(token, `/sites/${site}/searchAnalytics/query`, { method: 'POST', body: JSON.stringify({ ...queryBody, dimensions: ['page'], rowLimit: 10 }) }),
    googleRequest<{ sitemap?: Sitemap[] }>(token, `/sites/${site}/sitemaps`),
  ]);

  const total = summary.rows?.[0];
  const sitemaps = (sitemapResponse.sitemap ?? []).map((sitemap) => ({
    path: sitemap.path ?? '',
    lastSubmitted: sitemap.lastSubmitted ?? null,
    pending: Boolean(sitemap.isPending),
    errors: Number(sitemap.errors ?? 0),
    warnings: Number(sitemap.warnings ?? 0),
    submitted: (sitemap.contents ?? []).reduce((sum, content) => sum + Number(content.submitted ?? 0), 0),
    indexed: (sitemap.contents ?? []).reduce((sum, content) => sum + Number(content.indexed ?? 0), 0),
  }));

  return {
    configured: true as const,
    siteUrl: config.siteUrl,
    period: { days, startDate: dateString(startDate), endDate: dateString(endDate) },
    summary: {
      clicks: total?.clicks ?? 0,
      impressions: total?.impressions ?? 0,
      ctr: total?.ctr ?? 0,
      position: total?.position ?? 0,
    },
    indexation: {
      submitted: sitemaps.reduce((sum, sitemap) => sum + sitemap.submitted, 0),
      indexed: sitemaps.reduce((sum, sitemap) => sum + sitemap.indexed, 0),
      errors: sitemaps.reduce((sum, sitemap) => sum + sitemap.errors, 0),
      warnings: sitemaps.reduce((sum, sitemap) => sum + sitemap.warnings, 0),
    },
    queries: (queries.rows ?? []).map((row) => ({ query: row.keys?.[0] ?? '', clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, ctr: row.ctr ?? 0, position: row.position ?? 0 })),
    pages: (pages.rows ?? []).map((row) => ({ page: row.keys?.[0] ?? '', clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, ctr: row.ctr ?? 0, position: row.position ?? 0 })),
    sitemaps,
  };
}
