// SHODS SHOP Android update decisions are deliberately pure and independently testable.
// The backend advertises releases; the installed APK never downloads code silently.
export const validAppVersion = value => typeof value === 'string' && /^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value);

export function compareAppVersions(left, right) {
  if (!validAppVersion(left) || !validAppVersion(right)) return null;
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  }
  return 0;
}

export function safeApkDownloadUrl(value) {
  if (typeof value !== 'string' || value.length > 900) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) return null;
    if (/^localhost$/i.test(parsed.hostname) || /(?:^|\.)local$/i.test(parsed.hostname)) return null;
    if (!['443', ''].includes(parsed.port)) return null;
    return parsed.toString();
  } catch { return null; }
}

export function evaluateAndroidRelease(payload, installedVersion) {
  if (!payload || payload.releasePublished !== true) return {status: 'unpublished'};
  const version = payload.version;
  const url = safeApkDownloadUrl(payload.downloadUrl);
  const comparison = compareAppVersions(version, installedVersion);
  if (!url || comparison === null) return {status: 'invalid'};
  if (comparison <= 0) return {status: 'current', version: installedVersion};
  return {status: 'available', version, url, notes: String(payload.notes || '').slice(0, 320)};
}
