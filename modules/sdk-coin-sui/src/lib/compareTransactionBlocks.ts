import assert from 'assert';

export function assertEqualTransactionBlocks(
  a: { inputs: unknown[]; transactions: unknown[] },
  b: { inputs: unknown[]; transactions: unknown[] }
): void {
  assert.deepStrictEqual(a.inputs, b.inputs, 'Different inputs');
  assert.deepStrictEqual(a.transactions, b.transactions, 'Different transactions');
}
