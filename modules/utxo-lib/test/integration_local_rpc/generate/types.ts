/**
 * @prettier
 */
export type Transaction = {
  getId(): string;
  toBuffer(): Buffer;
};

export type Triple<T> = [T, T, T];
