import { BaseCoin as CoinConfig, NetworkType, coins } from '@bitgo/statics';
import { pubKeyfromPrivKey, publicKeyToString } from '@stacks/transactions';
import * as assert from 'assert';
import { StxLib } from '../../src';

const { toStacksNetwork, TransactionBuilderFactory } = StxLib;

describe('Stacks network plumbing', function () {
  it('keeps the stock mainnet chain identity when statics declares none', function () {
    const network = toStacksNetwork({ network: { type: NetworkType.MAINNET } } as unknown as CoinConfig);
    assert.strictEqual(network.chainId, 1);
    assert.strictEqual(network.version, 0);
  });

  it('keeps the stock testnet chain identity when statics declares none', function () {
    const network = toStacksNetwork({ network: { type: NetworkType.TESTNET } } as unknown as CoinConfig);
    assert.strictEqual(network.chainId, 2147483648);
    assert.strictEqual(network.version, 128);
  });

  it('applies a chain identity declared in statics', function () {
    const network = toStacksNetwork({
      network: { type: NetworkType.TESTNET, chainId: 1280, transactionVersion: 0x80 },
    } as unknown as CoinConfig);
    assert.strictEqual(network.chainId, 1280);
    assert.strictEqual(network.version, 0x80);
  });

  // staking-testnet rejects transactions carrying the public testnet chain ID with
  // "invalid chain ID 2147483648 (expected 1280)", so the chain ID has to reach the bytes.
  it('serializes a statics-declared chain ID into the transaction', async function () {
    const txHex = await buildTransfer(stakingTestnetCoinConfig());
    assert.strictEqual(txHex.slice(0, 10), '8000000500');
  });

  it('leaves public testnet transactions on the stock chain ID', async function () {
    const txHex = await buildTransfer(coins.get('tstx') as unknown as CoinConfig);
    assert.strictEqual(txHex.slice(0, 10), '8080000000');
  });
});

function stakingTestnetCoinConfig(): CoinConfig {
  const tstx = coins.get('tstx');
  return {
    ...tstx,
    network: { ...tstx.network, chainId: 1280, transactionVersion: 0x80 },
  } as unknown as CoinConfig;
}

async function buildTransfer(config: CoinConfig): Promise<string> {
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
