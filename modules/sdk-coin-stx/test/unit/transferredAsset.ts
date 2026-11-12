import assert from 'assert';
import nock from 'nock';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { BaseTransaction, Wallet } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { noneCV, privateKeyToPublic, publicKeyToHex, standardPrincipalCV, uintCV } from '@stacks/transactions';

import { Sip10Token, Stx, StxLib } from '../../src';
import { RecoveryInfo, RecoveryOptions } from '../../src/lib/iface';
import * as fixtures from '../fixtures';
import * as testData from './resources';

// A coin instance must only explain, sign and verify transfers of its own asset: the native coin
// refuses SIP-10 token transfers, and a token refuses native transfers and other tokens' transfers.
describe('Stacks: transferred asset must match the coin', function () {
  const SBTC_CONTRACT_ADDRESS = 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4';
  const SBTC_CONTRACT_NAME = 'sbtc-token';
  const SBTC_CONTRACT_ID = `${SBTC_CONTRACT_ADDRESS}.${SBTC_CONTRACT_NAME}`;
  const MISMATCH = /cannot sign or explain/;

  let bitgo: TestBitGoAPI;
  // Signed transactions carry the sender's public key, so they can be explained without passing
  // publicKeys. The unsigned one is used where the coin itself signs.
  let sbtcTransfer: BaseTransaction;
  let unsignedSbtcTransfer: BaseTransaction;
  let nativeTransfer: BaseTransaction;
  // Testnet payloads that are not token transfers
  let sbtcWithdrawal: BaseTransaction;
  const sendMany = testData.SIGNED_SEND_MANY_WITH_MEMO;
  const staking = testData.SIGNED_SELF_STACK_CONTRACT_CALL;

  async function buildSbtcWithdrawal(): Promise<BaseTransaction> {
    const builder = new StxLib.TransactionBuilderFactory(coins.get('tstx')).getSbtcWithdrawBuilder();
    builder.fee({ fee: '1000' });
    builder.nonce(1);
    builder.fromPubKey(testData.prvKeysString.map((prv) => publicKeyToHex(privateKeyToPublic(prv))));
    builder.numberSignatures(2);
    builder.withdraw({ amount: '100000', btcAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', maxFee: '5000' });
    builder.sign({ key: testData.prvKeysString[0] });
    builder.sign({ key: testData.prvKeysString[1] });
    return builder.build();
  }

  async function buildSbtcTransfer({ signed }: { signed: boolean }): Promise<BaseTransaction> {
    const builder = new StxLib.TransactionBuilderFactory(coins.get('stx:sbtc')).getFungibleTokenTransferBuilder();
    builder.fee({ fee: '180' });
    builder.nonce(0);
    builder.contractAddress(SBTC_CONTRACT_ADDRESS);
    builder.contractName(SBTC_CONTRACT_NAME);
    builder.functionName('transfer');
    builder.tokenName('sbtc-token');
    builder.functionArgs([
      uintCV('100000000'), // 1 sBTC
      standardPrincipalCV(testData.address1),
      standardPrincipalCV(testData.address2),
      noneCV(),
    ]);
    builder.fromPubKey(testData.pub1);
    builder.numberSignatures(1);
    if (signed) {
      builder.sign({ key: testData.prv1 });
    }
    return builder.build();
  }

  async function buildNativeTransfer(): Promise<BaseTransaction> {
    const builder = new StxLib.TransactionBuilderFactory(coins.get('stx')).getTransferBuilder();
    builder.fee({ fee: '180' });
    builder.nonce(0);
    builder.to(testData.address2);
    builder.amount('1000000000000'); // 1,000,000 STX
    builder.sign({ key: testData.prv1 });
    return builder.build();
  }

  function explain(coin: Stx, tx: BaseTransaction) {
    return coin.explainTransaction({ txHex: tx.toBroadcastFormat(), feeInfo: { fee: '' } });
  }

  function sign(coin: Stx, tx: BaseTransaction) {
    return coin.signTransaction({
      txPrebuild: { txHex: tx.toBroadcastFormat(), source: testData.address1 },
      prv: testData.prv1,
    });
  }

  function verify(coin: Stx, tx: BaseTransaction, amount: string) {
    return coin.verifyTransaction({
      txPrebuild: { txHex: tx.toBroadcastFormat() },
      txParams: { recipients: [{ address: testData.address2, amount }] },
      wallet: new Wallet(bitgo, coin, {}),
    });
  }

  before(async function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('stx', Stx.createInstance);
    Sip10Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    sbtcTransfer = await buildSbtcTransfer({ signed: true });
    unsignedSbtcTransfer = await buildSbtcTransfer({ signed: false });
    nativeTransfer = await buildNativeTransfer();
    sbtcWithdrawal = await buildSbtcWithdrawal();
  });

  afterEach(function () {
    nock.cleanAll();
  });

  describe('native stx refuses a SIP-10 transfer', function () {
    it('explainTransaction', async function () {
      await assert.rejects(explain(bitgo.coin('stx') as Stx, sbtcTransfer), MISMATCH);
    });

    it('signTransaction', async function () {
      await assert.rejects(sign(bitgo.coin('stx') as Stx, unsignedSbtcTransfer), MISMATCH);
    });

    it('verifyTransaction, even when the amount matches', async function () {
      await assert.rejects(verify(bitgo.coin('stx') as Stx, sbtcTransfer, '100000000'), MISMATCH);
    });
  });

  describe('a SIP-10 token refuses a transfer of a different token', function () {
    it('explainTransaction', async function () {
      await assert.rejects(explain(bitgo.coin('stx:aeusdc') as Stx, sbtcTransfer), MISMATCH);
    });

    it('signTransaction', async function () {
      await assert.rejects(sign(bitgo.coin('stx:aeusdc') as Stx, sbtcTransfer), MISMATCH);
    });

    it('verifyTransaction', async function () {
      await assert.rejects(verify(bitgo.coin('stx:aeusdc') as Stx, sbtcTransfer, '100000000'), MISMATCH);
    });
  });

  describe('a SIP-10 token refuses a native STX transfer', function () {
    it('explainTransaction', async function () {
      await assert.rejects(explain(bitgo.coin('stx:sbtc') as Stx, nativeTransfer), MISMATCH);
    });

    it('signTransaction', async function () {
      await assert.rejects(sign(bitgo.coin('stx:sbtc') as Stx, nativeTransfer), MISMATCH);
    });

    it('verifyTransaction', async function () {
      await assert.rejects(verify(bitgo.coin('stx:sbtc') as Stx, nativeTransfer, '1000000000000'), MISMATCH);
    });
  });

  describe('a SIP-10 token refuses payloads that are not its own transfer', function () {
    const cases: Array<{ name: string; coin: string; txHex: () => string }> = [
      { name: 'send-many (moves native STX)', coin: 'tstx:tsip6dp', txHex: () => sendMany },
      { name: 'staking contract call', coin: 'tstx:tsip6dp', txHex: () => staking },
      { name: 'sBTC withdrawal', coin: 'tstx:tsbtc', txHex: () => sbtcWithdrawal.toBroadcastFormat() },
    ];

    for (const { name, coin, txHex } of cases) {
      it(`${coin} refuses to explain ${name}`, async function () {
        await assert.rejects(
          (bitgo.coin(coin) as Stx).explainTransaction({ txHex: txHex(), feeInfo: { fee: '' } }),
          MISMATCH
        );
      });

      it(`${coin} refuses to sign ${name}`, async function () {
        await assert.rejects(
          (bitgo.coin(coin) as Stx).signTransaction({
            txPrebuild: { txHex: txHex(), source: testData.address1 },
            prv: testData.prvKeysString[2],
          }),
          MISMATCH
        );
      });
    }
  });

  describe('native stx still accepts payloads that move or lock STX', function () {
    const cases: Array<{ name: string; txHex: () => string }> = [
      { name: 'send-many', txHex: () => sendMany },
      { name: 'staking contract call', txHex: () => staking },
      { name: 'sBTC withdrawal', txHex: () => sbtcWithdrawal.toBroadcastFormat() },
    ];

    for (const { name, txHex } of cases) {
      it(`tstx explains ${name}`, async function () {
        const explained = await (bitgo.coin('tstx') as Stx).explainTransaction({
          txHex: txHex(),
          feeInfo: { fee: '' },
        });
        assert.ok(explained);
      });
    }
  });

  describe('malformed input keeps the factory errors', function () {
    it('non-hex txHex fails with ParseTransactionError', async function () {
      await assert.rejects(
        (bitgo.coin('stx') as Stx).explainTransaction({ txHex: 'zz', feeInfo: { fee: '' } }),
        /Invalid raw transaction/
      );
    });

    it('truncated txHex fails with ParseTransactionError', async function () {
      const truncated = nativeTransfer.toBroadcastFormat().slice(0, 40);
      await assert.rejects(
        (bitgo.coin('stx') as Stx).explainTransaction({ txHex: truncated, feeInfo: { fee: '' } }),
        /Invalid raw transaction/
      );
    });
  });

  describe('matching assets still work', function () {
    it('native stx explains a native transfer', async function () {
      const explained = await explain(bitgo.coin('stx') as Stx, nativeTransfer);
      assert.strictEqual(explained?.outputAmount, '1000000000000');
    });

    it('stx:sbtc explains an sBTC transfer', async function () {
      const explained = await explain(bitgo.coin('stx:sbtc') as Stx, sbtcTransfer);
      assert.strictEqual(explained?.outputAmount, '100000000');
      assert.strictEqual(explained?.outputs[0].tokenName, 'stx:sbtc');
    });

    it('stx:sbtc signs an sBTC transfer', async function () {
      const signed = await (bitgo.coin('stx:sbtc') as Stx).signTransaction({
        txPrebuild: { txHex: unsignedSbtcTransfer.toBroadcastFormat(), source: testData.address1 },
        prv: testData.prv1,
        pubKeys: [testData.pub1],
      });
      assert.ok('txHex' in signed || 'halfSigned' in signed);
    });
  });

  describe('offline vault files are labelled with the transferred asset', function () {
    it('a token sweep built from native stx is labelled with the token', async function () {
      const stx = bitgo.coin('stx') as Stx;
      const info = await stx['formatForOfflineVault'](sbtcTransfer);
      assert.strictEqual(info.coin, 'stx:sbtc');
      assert.strictEqual(info.outputs[0].tokenName, 'stx:sbtc');
    });

    it('an unsigned token sweep through native tstx recover() is labelled with the token', async function () {
      const rootAddress = fixtures.COLD_WALLET_ROOT_ADDRESS;
      nock('https://api.testnet.hiro.so')
        .get(`/extended/v2/addresses/${rootAddress}/balances/stx`)
        .reply(200, fixtures.ACCOUNT_BALANCE_RESPONSE);
      nock('https://api.testnet.hiro.so')
        .get(`/extended/v2/addresses/${rootAddress}/balances/ft/${fixtures.STX_TOKEN_ASSET_ID}`)
        .reply(200, fixtures.TOKEN_BALANCE_RESPONSE);
      nock('https://api.testnet.hiro.so', { allowUnmocked: true })
        .get(`/extended/v1/address/${rootAddress}/nonces`)
        .reply(200, fixtures.ACCOUNT_NONCE_RESPONSE);
      nock('https://api.testnet.hiro.so')
        .post('/v2/fees/transaction')
        .reply(200, fixtures.FEE_ESTIMATION_TOKEN_RESPONSE);

      const recoveryOptions: RecoveryOptions = {
        backupKey: fixtures.COLD_WALLET_PUBLIC_KEY_INFO.BACKUP_KEY,
        userKey: fixtures.COLD_WALLET_PUBLIC_KEY_INFO.USER_KEY,
        rootAddress,
        recoveryDestination: fixtures.DESTINATION_ADDRESS_WRW,
        bitgoKey: fixtures.COLD_WALLET_PUBLIC_KEY_INFO.BITGO_PUB_KEY,
        contractId: 'STAG18E45W613FZ3H4ZMF6QHH426EXM5QTSAVWYH.tsip6dp-token',
      };
      const response = (await (bitgo.coin('tstx') as Stx).recover(recoveryOptions)) as RecoveryInfo;
      assert.strictEqual(response.txHex, fixtures.COLD_WALLET_TOKEN_UNSIGNED_SWEEP_TX_HEX);
      assert.strictEqual(response.coin, 'tstx:tsip6dp');
    });

    it('a native sweep built from a token coin is labelled with the base coin', async function () {
      const sbtc = bitgo.coin('stx:sbtc') as Stx;
      const info = await sbtc['formatForOfflineVault'](nativeTransfer);
      assert.strictEqual(info.coin, 'stx');
    });

    it('a native sweep stays labelled stx', async function () {
      const stx = bitgo.coin('stx') as Stx;
      const info = await stx['formatForOfflineVault'](nativeTransfer);
      assert.strictEqual(info.coin, 'stx');
    });
  });

  it('matches the sBTC contract id exactly', function () {
    assert.strictEqual(StxLib.Utils.findTokenNameByContractId(SBTC_CONTRACT_ID), 'stx:sbtc');
    assert.strictEqual(StxLib.Utils.findTokenNameByContractId(`${SBTC_CONTRACT_ID}-v2`), undefined);
  });
});
