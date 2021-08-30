/**
 * @prettier
 */
import * as assert from 'assert';
import { Network } from '../src/networkTypes';

const Transaction = require('../src/transaction');

export function parseTransactionRoundTrip(buf: Buffer, network: Network) {
  const tx = Transaction.fromBuffer(buf, network);
  assert.strictEqual(tx.byteLength(), buf.length);
  assert.strictEqual(tx.toBuffer().toString('hex'), buf.toString('hex'));
  assert.strictEqual(tx.clone().toBuffer().toString('hex'), buf.toString('hex'));
  return tx;
}
