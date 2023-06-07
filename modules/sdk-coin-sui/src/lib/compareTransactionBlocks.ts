import assert from 'assert';
import { SuiTransaction } from './iface';

export function assertEqualTransactionBlocks(
  a: { inputs: SuiTransaction['tx']['inputs']; transactions: unknown[] },
  b: { inputs: SuiTransaction['tx']['inputs']; transactions: unknown[] }
): void {
  assert.deepStrictEqual(a.inputs, b.inputs, 'Different inputs');
  assert.deepStrictEqual(a.transactions, b.transactions, 'Different transactions');
}
