import assert from 'node:assert/strict';

import * as sinon from 'sinon';
import { IWallet, Triple, UnexpectedAddressError } from '@bitgo/sdk-core';

import { getDerivationPrefixFromPath, LEGACY_DERIVATION_PREFIX } from '../../../../src/address/derivationPrefix';
import { parseOutput } from '../../../../src/transaction/fixedScript/parseOutput';
import type { FixedScriptWalletOutput } from '../../../../src/transaction/types';
import { getUtxoCoin, keychainsBase58 } from '../../util';

describe('getDerivationPrefixFromPath', function () {
  it('returns undefined for chain/index only and for the legacy prefix', function () {
    assert.equal(getDerivationPrefixFromPath(undefined), undefined);
    assert.equal(getDerivationPrefixFromPath(null), undefined);
    assert.equal(getDerivationPrefixFromPath(''), undefined);
    assert.equal(getDerivationPrefixFromPath('0/1'), undefined);
    assert.equal(getDerivationPrefixFromPath(`${LEGACY_DERIVATION_PREFIX}/1/5`), undefined);
    assert.equal(getDerivationPrefixFromPath('m/0/0/20/5'), undefined);
    assert.equal(getDerivationPrefixFromPath('/0/0/20/5'), undefined);
  });

  it('returns every component except the last two, without a leading m/ or /', function () {
    assert.equal(getDerivationPrefixFromPath('44/0/1528449227/506574854/1/9'), '44/0/1528449227/506574854');
    assert.equal(getDerivationPrefixFromPath('m/44/0/1528449227/506574854/1/9'), '44/0/1528449227/506574854');
    assert.equal(getDerivationPrefixFromPath('/44/0/1528449227/506574854/1/9'), '44/0/1528449227/506574854');
  });

  it('returns other (non-legacy) prefixes unvalidated so that the canonical check can reject them', function () {
    assert.equal(getDerivationPrefixFromPath('m/0/1/20/5'), '0/1');
  });
});

describe('parseOutput derivation prefix', function () {
  const coin = getUtxoCoin('btc');
  const keychainArray = keychainsBase58.map((k) => ({ pub: k.pub })) as Triple<{ pub: string }>;
  const wallet = { migratedFrom: () => undefined } as unknown as IWallet;
  const prefix = '44/0/1528449227/506574854';

  async function parse(output: FixedScriptWalletOutput) {
    return parseOutput({
      currentOutput: output,
      coin,
      txPrebuild: {},
      verification: {},
      keychainArray,
      wallet,
      addressCodec: coin.addressCodec,
      txParams: { recipients: [] },
    });
  }

  afterEach(function () {
    sinon.restore();
  });

  it('passes the prefix recorded in the PSBT to isWalletAddress as coinSpecific.derivationPrefix', async function () {
    const isWalletAddress = sinon.stub(coin, 'isWalletAddress').resolves(true);
    const output = await parse({
      address: 'bc1qexample',
      amount: '1000',
      external: false,
      chain: 21,
      index: 3,
      derivationPrefix: prefix,
    });
    assert.equal(output.external, false);
    const args = isWalletAddress.getCall(0).args[0];
    assert.equal(args.chain, 21);
    assert.equal(args.index, 3);
    assert.deepEqual(args.coinSpecific, { derivationPrefix: prefix });
  });

  it('does not pass a coinSpecific for legacy outputs', async function () {
    const isWalletAddress = sinon.stub(coin, 'isWalletAddress').resolves(true);
    await parse({ address: 'bc1qexample', amount: '1000', external: false, chain: 21, index: 3 });
    assert.equal(isWalletAddress.getCall(0).args[0].coinSpecific, undefined);
  });

  it('classifies an output whose prefix is not canonical as external', async function () {
    sinon.stub(coin, 'isWalletAddress').rejects(new UnexpectedAddressError('not canonical'));
    const output = await parse({
      address: 'bc1qexample',
      amount: '1000',
      external: false,
      chain: 21,
      index: 3,
      derivationPrefix: prefix,
    });
    assert.equal(output.external, true);
  });
});
