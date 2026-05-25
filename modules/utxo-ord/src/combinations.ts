export function powerset<T>(arr: T[]): T[][] {
  if (arr.length === 0) {
    return [[]];
  } else {
    const [a, ...rest] = arr;
    return powerset(rest).flatMap((s) => [[a, ...s], s]);
  }
}
