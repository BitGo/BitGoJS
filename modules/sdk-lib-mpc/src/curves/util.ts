export function pathToIndices(path: string): number[] {
  return path
    .replace(/^m?\//, '')
    .split('/')
    .map((index) => parseInt(index, 10));
}
