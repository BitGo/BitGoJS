export function splitKeys(key: string, limit: number): string[] {
  if (key.length <= limit) {
    return [key];
  }

  const keys: string[] = [];

  let rightIndex = limit;
  for (let i = 0; i < key.length; i += limit) {
    keys.push(key.substring(i, rightIndex));
    rightIndex = Math.min(rightIndex + limit, key.length);
  }

  return keys;
}
