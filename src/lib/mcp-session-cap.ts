/**
 * When a session map is at capacity, removes the oldest entry (FIFO order of `Map`)
 * and invokes `closeValue` so transports/servers are torn down.
 */
export function evictOldestSessionIfMapAtCapacity<K, V>(
  map: Map<K, V>,
  maxEntries: number,
  closeValue: (value: V) => Promise<void>,
  kind: string
): void {
  if (map.size < maxEntries) {
    return;
  }

  const oldestKey = map.keys().next().value as K | undefined;
  if (oldestKey === undefined) {
    return;
  }

  const oldest = map.get(oldestKey);
  map.delete(oldestKey);

  if (oldest !== undefined) {
    process.stderr.write(
      `[peoplesafe-mcp] MCP ${kind} session map at limit (${maxEntries}); closing oldest session to cap memory.\n`
    );
    void closeValue(oldest).catch(() => undefined);
  }
}
