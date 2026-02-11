import 'should';
import assert from 'assert';

import { type TestBitGoAPI, TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI, encrypt } from '@bitgo/sdk-api';
import { fixedScriptWallet, type CoinName } from '@bitgo/wasm-utxo';
import * as testutils from '@bitgo/wasm-utxo/testutils';
import { Wallet } from '@bitgo/sdk-core';

import { Tbtc } from '../../../../../src/impl/btc';

import { btcBackupKey } from './fixtures';

const { BitGoPsbt, ChainCode } = fixedScriptWallet;

type Input = { scriptType: fixedScriptWallet.OutputScriptType; value: bigint };
type Output = { address: string; value: bigint };
type PsbtOptions = { lockTime?: number; sequence?: number };

function constructPsbt(
  inputs: Input[],
  outputs: Output[],
  network: CoinName,
  walletKeys: fixedScriptWallet.RootWalletKeys,
  options?: PsbtOptions
): fixedScriptWallet.BitGoPsbt {
  const psbt = BitGoPsbt.createEmpty(network, walletKeys, { lockTime: options?.lockTime });

  inputs.forEach((input, index) => {
    const chain = ChainCode.value(input.scriptType, 'external');
    psbt.addWalletInput(
      { txid: '00'.repeat(32), vout: index, value: input.value, sequence: options?.sequence },
      walletKeys,
      { scriptId: { chain, index }, signPath: { signer: 'user', cosigner: 'bitgo' } }
    );
  });

  outputs.forEach((output) => {
    psbt.addOutput(output.address, output.value);
  });

  return psbt;
}

describe('BTC:', () => {
  let bitgo: TestBitGoAPI;

  before(() => {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('tbtc', Tbtc.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Address validation:', () => {
    let coin: Tbtc;
    before(() => {
      coin = bitgo.coin('tbtc') as Tbtc;
    });

    it('should validate a base58 address', () => {
      const validBase58Address = '2Mv1fGp8gHSqsiXYG7WqcYmHZdurDGVtUbn';
      coin.isValidAddress(validBase58Address).should.be.true();
      const invalidBase58Address = '2MV1FGP8GHSQSSXYG7WQCYMHZDURDGVTUBN';
      coin.isValidAddress(invalidBase58Address).should.be.false();
    });

    it('should validate a bech32 address', () => {
      const validBech32Address = 'tb1qtxxqmkkdx4n4lcp0nt2cct89uh3h3dlcu940kw9fcqyyq36peh0st94hfp';
      coin.isValidAddress(validBech32Address).should.be.true();
      coin.isValidAddress(validBech32Address.toUpperCase()).should.be.false();
    });

    it('should validate a bech32m address', () => {
      // https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki#Test_vectors_for_Bech32m
      const validBech32mAddress = 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7';
      coin.isValidAddress(validBech32mAddress).should.be.true();
      coin.isValidAddress(validBech32mAddress.toUpperCase()).should.be.false();
    });
  });

  describe('Post Build Validation', () => {
    let coin: Tbtc;
    before(() => {
      coin = bitgo.coin('tbtc') as Tbtc;
    });

    it('should not modify locktime on postProcessPrebuild', async () => {
      const walletKeys = testutils.getDefaultWalletKeys();

      // Create a PSBT with lockTime=0 and sequence=0xffffffff
      const psbt = constructPsbt(
        [{ scriptType: 'p2wsh' as const, value: BigInt(100000) }],
        [{ address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7', value: BigInt(90000) }],
        'tbtc',
        walletKeys,
        { lockTime: 0, sequence: 0xffffffff }
      );

      const txHex = Buffer.from(psbt.serialize()).toString('hex');
      const blockHeight = 100;
      const preBuild = { txHex, blockHeight };
      const postProcessBuilt = await coin.postProcessPrebuild(preBuild);

      // Parse result as PSBT
      const resultPsbt = BitGoPsbt.fromBytes(Buffer.from(postProcessBuilt.txHex as string, 'hex'), 'tbtc');

      resultPsbt.lockTime.should.equal(0);

      // Check sequences via parseTransactionWithWalletKeys
      const parsed = resultPsbt.parseTransactionWithWalletKeys(walletKeys, { publicKeys: [] });
      for (const input of parsed.inputs) {
        input.sequence.should.equal(0xffffffff);
      }
    });
  });

  describe('Audit Key', () => {
    const { key } = btcBackupKey;
    let coin: Tbtc;
    before(() => {
      coin = bitgo.coin('tbtc') as Tbtc;
    });

    it('should return for valid inputs', () => {
      coin.assertIsValidKey({
        encryptedPrv: key,
        walletPassphrase: 'kAm[EFQ6o=SxlcLFDw%,',
      });
    });

    it('should throw error if the walletPassphrase is incorrect', () => {
      assert.throws(
        () =>
          coin.assertIsValidKey({
            encryptedPrv: key,
            walletPassphrase: 'foo',
          }),
        { message: "failed to decrypt prv: ccm: tag doesn't match" }
      );
    });

    it('should return throw if the key is altered', () => {
      const alteredKey = key.replace(/[0-9]/g, '0');
      assert.throws(
        () =>
          coin.assertIsValidKey({
            encryptedPrv: alteredKey,
            walletPassphrase: 'kAm[EFQ6o=SxlcLFDw%,',
          }),
        { message: 'failed to decrypt prv: json decrypt: invalid parameters' }
      );
    });
  });

  describe('Unspent management spoofability - Consolidation (BUILD_SIGN_SEND)', () => {
    let coin: Tbtc;
    let bitgoTest: TestBitGoAPI;
    before(() => {
      bitgoTest = TestBitGo.decorate(BitGoAPI, { env: 'test' });
      bitgoTest.safeRegister('tbtc', Tbtc.createInstance);
      bitgoTest.initializeTestVars();
      coin = bitgoTest.coin('tbtc') as Tbtc;
    });

    it('should detect hex spoofing in BUILD_SIGN_SEND', async (): Promise<void> => {
      const keyTriple = testutils.getKeyTriple('default');
      const rootWalletKey = testutils.getDefaultWalletKeys();
      const [user] = keyTriple;

      const wallet = new Wallet(bitgoTest, coin, {
        id: '5b34252f1bf349930e34020a',
        coin: 'tbtc',
        keys: ['user', 'backup', 'bitgo'],
      });

      // originalPsbt is created to show what the legitimate transaction would look like
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const originalPsbt = constructPsbt(
        [{ scriptType: 'p2wsh' as const, value: BigInt(10000) }],
        [{ address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7', value: BigInt(9000) }],
        'tbtc',
        rootWalletKey
      );
      const spoofedPsbt = constructPsbt(
        [{ scriptType: 'p2wsh' as const, value: BigInt(10000) }],
        [{ address: 'tb1pjgg9ty3s2ztp60v6lhgrw76f7hxydzuk9t9mjsndh3p2gf2ah7gs4850kn', value: BigInt(9000) }],
        'tbtc',
        rootWalletKey
      );
      const spoofedHex: string = Buffer.from(spoofedPsbt.serialize()).toString('hex');

      const bgUrl: string = (bitgoTest as any)._baseUrl;
      const nock = require('nock');

      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/consolidateUnspents`)
        .reply(200, { txHex: spoofedHex, consolidateId: 'test' });

      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`)
        .reply((requestBody: any) => {
          if (requestBody?.txHex === spoofedHex) {
            throw new Error('Spoofed transaction was sent: spoofing protection failed');
          }
          return [200, { txid: 'test-txid-123', status: 'signed' }];
        });

      const pubs = keyTriple.map((k) => k.neutered().toBase58());
      const responses = [
        { pub: pubs[0], encryptedPrv: encrypt('pass', user.toBase58()) },
        { pub: pubs[1] },
        { pub: pubs[2] },
      ];
      wallet
        .keyIds()
        .forEach((id, i) => nock(bgUrl).get(`/api/v2/${wallet.coin()}/key/${id}`).reply(200, responses[i]));

      await assert.rejects(
        wallet.consolidateUnspents({ walletPassphrase: 'pass' }),
        (e: any) =>
          typeof e?.message === 'string' &&
          e.message.includes('prebuild attempts to spend to unintended external recipients')
      );
    });
  });

  describe('Unspent management spoofability - Fanout (BUILD_SIGN_SEND)', () => {
    let coin: Tbtc;
    let bitgoTest: TestBitGoAPI;
    before(() => {
      bitgoTest = TestBitGo.decorate(BitGoAPI, { env: 'test' });
      bitgoTest.safeRegister('tbtc', Tbtc.createInstance);
      bitgoTest.initializeTestVars();
      coin = bitgoTest.coin('tbtc') as Tbtc;
    });

    it('should detect hex spoofing in fanout BUILD_SIGN_SEND', async (): Promise<void> => {
      const keyTriple = testutils.getKeyTriple('default');
      const rootWalletKey = testutils.getDefaultWalletKeys();
      const [user] = keyTriple;

      const wallet = new Wallet(bitgoTest, coin, {
        id: '5b34252f1bf349930e34020a',
        coin: 'tbtc',
        keys: ['user', 'backup', 'bitgo'],
      });

      // originalPsbt is created to show what the legitimate transaction would look like
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const originalPsbt = constructPsbt(
        [{ scriptType: 'p2wsh' as const, value: BigInt(10000) }],
        [{ address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7', value: BigInt(9000) }],
        'tbtc',
        rootWalletKey
      );

      const spoofedPsbt = constructPsbt(
        [{ scriptType: 'p2wsh' as const, value: BigInt(10000) }],
        [{ address: 'tb1pjgg9ty3s2ztp60v6lhgrw76f7hxydzuk9t9mjsndh3p2gf2ah7gs4850kn', value: BigInt(9000) }],
        'tbtc',
        rootWalletKey
      );
      const spoofedHex: string = Buffer.from(spoofedPsbt.serialize()).toString('hex');

      const bgUrl: string = (bitgoTest as any)._baseUrl;
      const nock = require('nock');

      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/fanoutUnspents`)
        .reply(200, { txHex: spoofedHex, fanoutId: 'test' });

      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`)
        .reply((requestBody: any) => {
          if (requestBody?.txHex === spoofedHex) {
            throw new Error('Spoofed transaction was sent: spoofing protection failed');
          }
          return [200, { txid: 'test-txid-123', status: 'signed' }];
        });

      const pubs = keyTriple.map((k) => k.neutered().toBase58());
      const responses = [
        { pub: pubs[0], encryptedPrv: encrypt('pass', user.toBase58()) },
        { pub: pubs[1] },
        { pub: pubs[2] },
      ];
      wallet
        .keyIds()
        .forEach((id, i) => nock(bgUrl).get(`/api/v2/${wallet.coin()}/key/${id}`).reply(200, responses[i]));

      await assert.rejects(
        wallet.fanoutUnspents({ walletPassphrase: 'pass' }),
        (e: any) =>
          typeof e?.message === 'string' &&
          e.message.includes('prebuild attempts to spend to unintended external recipients')
      );
    });
  });
});
