export function verifyTimestamp(timestamp: string): boolean {
  const now = Date.now();
  const ts = new Date(timestamp).getTime();

  if (isNaN(ts)) return false;

  const MAX_DRIFT_MS = 5 * 60 * 1000; // 5 minutes

  return Math.abs(now - ts) <= MAX_DRIFT_MS;
}
