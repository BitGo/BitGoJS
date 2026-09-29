import assert from 'assert';

import { BaseCoin as CoinConfig, coins } from '@bitgo/statics';
import { pubKeyfromPrivKey, publicKeyToString } from '@stacks/transactions';

import { StxLib } from '../../src';

const { toStacksNetwork, TransactionBuilderFactory } = StxLib;

describe('Stacks network plumbing', function () {
  it('keeps the stock mainnet chain identity for stx', function () {
    const network = toStacksNetwork(coins.get('stx'));
    assert.strictEqual(network.chainId, 1);
    assert.strictEqual(network.version, 0);
  });

  it('keeps the stock testnet chain identity for tstx', function () {
    const network = toStacksNetwork(coins.get('tstx'));
    assert.strictEqual(network.chainId, 2147483648);
    assert.strictEqual(network.version, 128);
  });

  it('applies the tstxsignet chain identity declared in statics', function () {
    const network = toStacksNetwork(coins.get('tstxsignet'));
    assert.strictEqual(network.chainId, 1280);
    assert.strictEqual(network.version, 0x80);
  });

  // staking-testnet rejects transactions carrying the public testnet chain ID with
  // "SignatureValidation: invalid chain ID 2147483648 (expected 1280)", so the chain ID and
  // version have to reach the serialized bytes: version byte 0x80 followed by chain ID 1280.
  it('serializes the tstxsignet chain ID and version into the transaction', async function () {
    const txHex = await buildTransfer(coins.get('tstxsignet'));
    assert.strictEqual(txHex.slice(0, 10), '8000000500');
  });

  it('leaves tstx transactions on the stock testnet chain ID', async function () {
    const txHex = await buildTransfer(coins.get('tstx'));
    assert.strictEqual(txHex.slice(0, 10), '8080000000');
  });
});

async function buildTransfer(config: Readonly<CoinConfig>): Promise<string> {
  const publicKey = publicKeyToString(
    pubKeyfromPrivKey('0f4fad1041051740108cdf523c346199e99d80cc845a4ea8d4d29b1a81fd22fc01')
  );
  const builder = new TransactionBuilderFactory(config).getTransferBuilder();
  builder.to('STHT87WKW17VGMPFFNB6QD1ABNKGB1600ZE7YVW4');
  builder.amount('1000');
  builder.fee({ fee: '200' });
  builder.nonce(0);
  builder.fromPubKey([publicKey]);
  const transaction = await builder.build();
  return transaction.toBroadcastFormat();
}
