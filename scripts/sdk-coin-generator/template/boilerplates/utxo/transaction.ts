// Install and import coin specific packages
import bitgo from '@bitgo/utxo-lib';

const { networks, UtxoTransaction } = bitgo

// Add networks.<%= symbol %> and networks.<%= symbol %>Test to @bitgo/utxo-lib
export type <%= constructor %>Network = typeof networks.<%= symbol %> | typeof networks.<%= symbol %>Test;

export class UnsupportedTransactionError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class <%= constructor %>Transaction extends UtxoTransaction {
  constructor(public network: <%= constructor %>Network, tx?: <%= constructor %>Transaction) {
    super(network, tx);
  }
}
