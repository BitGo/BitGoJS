import assert from 'assert';
import { ClarityType, ContractCallPayload, createAddress, cvToString, cvToValue } from '@stacks/transactions';
import { coins } from '@bitgo/statics';
import should from 'should';

import { BaseTransaction } from '@bitgo/sdk-core';
import { StxLib } from '../../../src';
import * as testData from '../resources';

describe('Stacks: PoX-5 Builder', function () {
  const factory = new StxLib.TransactionBuilderFactory(coins.get('tstx'));
  const signerManager = 'STDE7Y8HV3RX8VBM2TZVWJTS7ZA1XB0SSC3NEVH0.signer-manager';
  const oldSignerManager = 'STDE7Y8HV3RX8VBM2TZVWJTS7ZA1XB0SSC3NEVH0.old-signer-manager';

  function configure(builder: StxLib.Pox5Builder): StxLib.Pox5Builder {
    builder.fee({ fee: '180' });
    builder.nonce(0);
    builder.fromPubKey(testData.TX_SENDER.pub);
    builder.numberSignatures(1);
    return builder;
  }

  function validLockupOutput() {
    return {
      height: 9231,
      tx: '00',
      outputIndex: 0,
      header: '00'.repeat(80),
      leafHashes: ['00'.repeat(32)],
      txCount: 1,
      txIndex: 0,
      amount: 10000,
      unlockBurnHeight: 9490,
    };
  }

  it('builds and parses register-for-bond with an L1 lockup', async () => {
    const builder = configure(factory.getPox5Builder());
    builder.registerForBond({
      bondIndex: 210,
      signerManager,
      amountUstx: '1005000',
      lockup: {
        kind: 'btc',
        unlockBytes: '00',
        outputs: [
          {
            height: 9231,
            tx: '00',
            outputIndex: 0,
            header: '00'.repeat(80),
            leafHashes: ['00'.repeat(32)],
            txCount: 1,
            txIndex: 0,
            amount: 10000,
            unlockBurnHeight: 9490,
          },
        ],
      },
      signerCalldata: '00',
    });

    const tx = await builder.build();
    const payload = tx.toJson().payload as any;
    should.equal(payload.functionName, 'register-for-bond');
    should.equal(payload.functionArgs.length, 5);
    should.equal(payload.functionArgs[0].type, ClarityType.UInt);
    should.equal(payload.functionArgs[1].type, ClarityType.PrincipalContract);
    should.equal(payload.functionArgs[3].type, ClarityType.ResponseOk);
    should.equal(payload.functionArgs[4].type, ClarityType.OptionalSome);

    const rebuiltBuilder = factory.from(tx.toBroadcastFormat());
    rebuiltBuilder.fromPubKey(testData.TX_SENDER.pub);
    const rebuilt = await rebuiltBuilder.build();
    should.equal(rebuilt.toBroadcastFormat(), tx.toBroadcastFormat());
  });

  it('validates the PoX-5 contract address during factory routing', async () => {
    const builder = configure(factory.getPox5Builder());
    builder.registerForBond({
      bondIndex: 210,
      signerManager,
      amountUstx: '1005000',
      lockup: { kind: 'btc', unlockBytes: '00', outputs: [validLockupOutput()] },
    });
    const tx = await builder.build();
    const payload = (tx as StxLib.Transaction).stxTransaction.payload as any;
    should.equal(StxLib.Pox5Builder.isValidContractCall(coins.get('tstx'), payload), true);
    should.equal(
      StxLib.Pox5Builder.isValidContractCall(coins.get('tstx'), {
        ...payload,
        contractAddress: createAddress(testData.ACCOUNT_1.address),
      }),
      false
    );
  });

  it('builds sBTC registration using response error', async () => {
    const builder = configure(factory.getPox5Builder());
    builder.registerForBond({
      bondIndex: 210,
      signerManager,
      amountUstx: '1005000',
      lockup: { kind: 'sbtc', sbtcSats: 10000 },
    });

    const tx = await builder.build();
    const payload = tx.toJson().payload as any;
    should.equal(payload.functionArgs[3].type, ClarityType.ResponseErr);
    should.equal(cvToValue(payload.functionArgs[3].value).toString(), '10000');
  });

  it('builds validator update, early exit, and reward calls', async () => {
    const update = configure(factory.getPox5Builder()).updateBondRegistration({
      signerManager,
      oldSignerManager,
      signerCalldata: '00',
    });
    should.equal(
      ((await update.build()).toJson().payload as { functionName: string }).functionName,
      'update-bond-registration'
    );

    const earlyExit = configure(factory.getPox5Builder()).announceL1EarlyExit({
      staker: testData.TX_SENDER.address,
      oldSignerManager,
    });
    const earlyExitPayload = (await earlyExit.build()).toJson().payload as any;
    should.equal(earlyExitPayload.functionName, 'announce-l1-early-exit');
    should.equal(cvToString(earlyExitPayload.functionArgs[0]), testData.TX_SENDER.address);

    const claims = configure(factory.getPox5Builder()).claimRewards({
      bondIndices: [210, 226],
      rewardCycle: 391,
    });
    const claimPayload = (await claims.build()).toJson().payload as any;
    should.equal(claimPayload.functionName, 'claim-rewards');
    should.equal(claimPayload.functionArgs[0].type, ClarityType.List);
    should.equal(claimPayload.functionArgs[1].type, ClarityType.UInt);
  });

  it('accepts every supported PoX-5 function name', () => {
    const functionNames = [
      'stake',
      'stake-update',
      'unstake',
      'register-for-bond',
      'update-bond-registration',
      'announce-l1-early-exit',
      'claim-rewards',
      'claim-staker-rewards-for-signer',
      'calculate-rewards',
    ];

    for (const functionName of functionNames) {
      configure(factory.getPox5Builder()).functionName(functionName);
    }
  });

  it('parses response, list, and explicit principal JSON values', async () => {
    const builder = configure(factory.getPox5Builder());
    builder.functionName('calculate-rewards');
    builder.functionArgs([
      {
        type: 'response',
        val: {
          type: 'ok',
          val: {
            type: 'list',
            val: [{ type: 'uint128', val: '210' }],
          },
        },
      },
      { type: 'contract-principal', val: oldSignerManager },
    ]);

    const args = ((await builder.build()).toJson().payload as any).functionArgs;
    should.equal(args[0].type, ClarityType.ResponseOk);
    should.equal(args[0].value.type, ClarityType.List);
    should.equal(args[1].type, ClarityType.PrincipalContract);
  });

  it('rejects invalid SPV proof byte lengths', () => {
    const lockup = {
      kind: 'btc' as const,
      unlockBytes: '00',
      outputs: [
        {
          height: 9231,
          tx: '00',
          outputIndex: 0,
          header: '00',
          leafHashes: ['00'.repeat(32)],
          txCount: 1,
          txIndex: 0,
          amount: 10000,
          unlockBurnHeight: 9490,
        },
      ],
    };

    assert.throws(
      () =>
        configure(factory.getPox5Builder()).registerForBond({
          bondIndex: 210,
          signerManager,
          amountUstx: '1005000',
          lockup,
        }),
      /header must be exactly 80 bytes/
    );

    assert.throws(
      () =>
        configure(factory.getPox5Builder()).registerForBond({
          bondIndex: 210,
          signerManager,
          amountUstx: '1005000',
          lockup: {
            ...lockup,
            outputs: [{ ...lockup.outputs[0], header: '00'.repeat(80), leafHashes: ['00'] }],
          },
        }),
      /leafHash must be exactly 32 bytes/
    );
  });

  it('rejects malformed lockup fields and contract principals', () => {
    const validLockup = { kind: 'btc' as const, unlockBytes: '00', outputs: [validLockupOutput()] };
    const register = (lockup: typeof validLockup, manager = signerManager) =>
      configure(factory.getPox5Builder()).registerForBond({
        bondIndex: 210,
        signerManager: manager,
        amountUstx: '1005000',
        lockup,
      });

    assert.throws(() => register(validLockup, 'no-dot'), /address.contract-name format/);
    assert.throws(() => register(validLockup, 'a.b.c'), /address.contract-name format/);
    assert.throws(() => register(validLockup, 'STDE7Y8HV3RX8VBM2TZVWJTS7ZA1XB0SSC3NEVH0.'), /address.contract-name/);
    assert.throws(
      () => register({ ...validLockup, outputs: [{ ...validLockup.outputs[0], tx: '0' }] }),
      /tx must be an even-length hexadecimal string/
    );
    assert.throws(
      () => register({ ...validLockup, outputs: [{ ...validLockup.outputs[0], tx: 'zz' }] }),
      /tx must be an even-length hexadecimal string/
    );
    assert.throws(
      () => register({ ...validLockup, outputs: Array.from({ length: 11 }, () => validLockupOutput()) }),
      /between 1 and 10 outputs/
    );
    assert.throws(
      () =>
        register({
          ...validLockup,
          outputs: [{ ...validLockup.outputs[0], leafHashes: Array(15).fill('00'.repeat(32)) }],
        }),
      /more than 14 merkle siblings/
    );
  });

  describe('PoX-5 Builder on tstxsignet', function () {
    // Stacks Foundation staking-testnet: chain ID 1280 (0x00000500) with the 0x80 testnet tx version
    const signetFactory = new StxLib.TransactionBuilderFactory(coins.get('tstxsignet'));
    const TSTXSIGNET_TX_PREFIX = '8000000500';
    const POX5_BOOT_ADDRESS = 'ST000000000000000000002AMW42H';

    function configure(builder: StxLib.Pox5Builder): StxLib.Pox5Builder {
      builder.fee({ fee: '180' });
      builder.nonce(0);
      builder.fromPubKey(testData.TX_SENDER.pub);
      builder.numberSignatures(1);
      return builder;
    }

    function payloadOf(tx: BaseTransaction): StxLib.StacksContractPayload {
      return tx.toJson().payload as StxLib.StacksContractPayload;
    }

    function uintArg(cv: { type: number; value?: unknown }, expected: string): void {
      cv.type.should.equal(ClarityType.UInt);
      String(cv.value).should.equal(expected);
    }

    it('builds a stake transaction carrying the tstxsignet chain ID', async () => {
      const builder = configure(signetFactory.getPox5Builder());
      builder.stake({
        signerManager,
        amountUstx: '100000000',
        numCycles: 1,
        startBurnHt: 66849,
      });

      const tx = await builder.build();
      tx.toBroadcastFormat().slice(0, 10).should.equal(TSTXSIGNET_TX_PREFIX);

      const payload = payloadOf(tx);
      payload.contractAddress.should.equal(POX5_BOOT_ADDRESS);
      payload.contractName.should.equal('pox-5');
      payload.functionName.should.equal('stake');
      payload.functionArgs.length.should.equal(5);
      payload.functionArgs[0].type.should.equal(ClarityType.PrincipalContract);
      cvToString(payload.functionArgs[0]).should.equal(signerManager);
      uintArg(payload.functionArgs[1], '100000000');

      uintArg(payload.functionArgs[2], '1');

      uintArg(payload.functionArgs[3], '66849');

      payload.functionArgs[4].type.should.equal(ClarityType.OptionalNone);
    });

    it('builds a stake-update transaction carrying the tstxsignet chain ID', async () => {
      const builder = configure(signetFactory.getPox5Builder());
      builder.stakeUpdate({
        signerManager,
        oldSignerManager,
        cyclesToExtend: 1,
        amountIncrease: '50000',
      });

      const tx = await builder.build();
      tx.toBroadcastFormat().slice(0, 10).should.equal(TSTXSIGNET_TX_PREFIX);

      const payload = payloadOf(tx);
      payload.functionName.should.equal('stake-update');
      payload.functionArgs.length.should.equal(5);
      cvToString(payload.functionArgs[0]).should.equal(signerManager);
      cvToString(payload.functionArgs[1]).should.equal(oldSignerManager);
      uintArg(payload.functionArgs[2], '1');
      uintArg(payload.functionArgs[3], '50000');
      payload.functionArgs[4].type.should.equal(ClarityType.OptionalNone);
    });

    it('builds an unstake transaction carrying the tstxsignet chain ID', async () => {
      const builder = configure(signetFactory.getPox5Builder());
      builder.unstake(oldSignerManager);

      const tx = await builder.build();
      tx.toBroadcastFormat().slice(0, 10).should.equal(TSTXSIGNET_TX_PREFIX);

      const payload = payloadOf(tx);
      payload.functionName.should.equal('unstake');
      payload.functionArgs.length.should.equal(1);
      cvToString(payload.functionArgs[0]).should.equal(oldSignerManager);
    });

    it('builds register-for-bond transactions (L1 lockup and sBTC) carrying the tstxsignet chain ID', async () => {
      const btcBuilder = configure(signetFactory.getPox5Builder());
      btcBuilder.registerForBond({
        bondIndex: 210,
        signerManager,
        amountUstx: '1005000',
        lockup: { kind: 'btc', unlockBytes: '00', outputs: [validLockupOutput()] },
      });
      const btcTx = await btcBuilder.build();
      btcTx.toBroadcastFormat().slice(0, 10).should.equal(TSTXSIGNET_TX_PREFIX);

      const btcPayload = payloadOf(btcTx);
      btcPayload.functionName.should.equal('register-for-bond');
      btcPayload.functionArgs[3].type.should.equal(ClarityType.ResponseOk);

      const sbtcBuilder = configure(signetFactory.getPox5Builder());
      sbtcBuilder.registerForBond({
        bondIndex: 210,
        signerManager,
        amountUstx: '1005000',
        lockup: { kind: 'sbtc', sbtcSats: 10000 },
      });
      const sbtcTx = await sbtcBuilder.build();
      sbtcTx.toBroadcastFormat().slice(0, 10).should.equal(TSTXSIGNET_TX_PREFIX);

      const sbtcPayload = payloadOf(sbtcTx);
      sbtcPayload.functionArgs[3].type.should.equal(ClarityType.ResponseErr);
    });

    it('rebuilds every staking flow byte-identically from raw hex', async () => {
      const stakeBuilder = configure(signetFactory.getPox5Builder());
      stakeBuilder.stake({
        signerManager,
        amountUstx: '100000000',
        numCycles: 1,
        startBurnHt: 66849,
      });
      const stakeTx = await stakeBuilder.build();

      const stakeRebuilt = signetFactory.from(stakeTx.toBroadcastFormat());
      stakeRebuilt.fromPubKey(testData.TX_SENDER.pub);
      (await stakeRebuilt.build()).toBroadcastFormat().should.equal(stakeTx.toBroadcastFormat());

      const unstakeBuilder = configure(signetFactory.getPox5Builder());
      unstakeBuilder.unstake(oldSignerManager);
      const unstakeTx = await unstakeBuilder.build();

      const unstakeRebuilt = signetFactory.from(unstakeTx.toBroadcastFormat());
      unstakeRebuilt.fromPubKey(testData.TX_SENDER.pub);
      (await unstakeRebuilt.build()).toBroadcastFormat().should.equal(unstakeTx.toBroadcastFormat());

      const registerBuilder = configure(signetFactory.getPox5Builder());
      registerBuilder.registerForBond({
        bondIndex: 210,
        signerManager,
        amountUstx: '1005000',
        lockup: { kind: 'sbtc', sbtcSats: 10000 },
      });
      const registerTx = await registerBuilder.build();

      const registerRebuilt = signetFactory.from(registerTx.toBroadcastFormat());
      registerRebuilt.fromPubKey(testData.TX_SENDER.pub);
      (await registerRebuilt.build()).toBroadcastFormat().should.equal(registerTx.toBroadcastFormat());
    });

    it('routes parsed stake transactions to the PoX-5 builder on tstxsignet', async () => {
      const builder = configure(signetFactory.getPox5Builder());
      builder.stake({
        signerManager,
        amountUstx: '100000000',
        numCycles: 1,
        startBurnHt: 66849,
      });
      const tx = await builder.build();
      const payload = (tx as StxLib.Transaction).stxTransaction.payload as unknown as ContractCallPayload;

      builder.should.be.an.instanceOf(StxLib.Pox5Builder);
      should.equal(StxLib.Pox5Builder.isValidContractCall(coins.get('tstxsignet'), payload), true);
      should.equal(
        StxLib.Pox5Builder.isValidContractCall(coins.get('tstxsignet'), {
          ...payload,
          contractAddress: createAddress(testData.ACCOUNT_1.address),
        }),
        false
      );

      const routed = signetFactory.from(tx.toBroadcastFormat());
      routed.should.be.an.instanceOf(StxLib.Pox5Builder);
    });

    it('exposes fee, nonce and sender on the built stake transaction', async () => {
      const builder = configure(signetFactory.getPox5Builder());
      builder.stake({
        signerManager,
        amountUstx: '100000000',
        numCycles: 1,
        startBurnHt: 66849,
      });

      const txJson = (await builder.build()).toJson();
      txJson.fee.should.equal('180');
      txJson.nonce.should.equal(0);
      txJson.id.should.match(/^[0-9a-f]{64}$/);
      txJson.from.should.equal(testData.TX_SENDER.address);
    });

    it('rejects a signer-manager principal without the address.contract-name shape', () => {
      const builder = configure(signetFactory.getPox5Builder());
      assert.throws(
        () =>
          builder.stake({
            signerManager: 'no-dot',
            amountUstx: '100000000',
            numCycles: 1,
            startBurnHt: 66849,
          }),
        /address.contract-name format/
      );
    });
  });
});
