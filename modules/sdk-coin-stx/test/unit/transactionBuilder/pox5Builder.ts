import assert from 'assert';
import { ClarityType, createAddress, cvToString, cvToValue } from '@stacks/transactions';
import { coins } from '@bitgo/statics';
import should from 'should';

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
});
