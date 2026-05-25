export type PromiseProps<T> = { [K in keyof T]?: Promise<T[K] | undefined> };
export async function promiseProps<T extends Record<string, unknown>>(obj: PromiseProps<T>): Promise<T> {
  const promKeys = Object.keys(obj) as (keyof T)[];
  return (await Promise.all(Object.values(obj))).reduce((acc: T, cur, idx) => {
    acc[promKeys[idx]] = cur;
    return acc;
  }, {});
}
