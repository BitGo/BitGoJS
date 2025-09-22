import assert from 'assert';
import { promises as fs } from 'fs';

import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isLeft } from 'fp-ts/Either';
import * as utxolib from '@bitgo-beta/utxo-lib';
import { ast, Descriptor } from '@bitgo/wasm-miniscript';
import { PartialSig } from 'bip174/src/lib/interfaces';

import { BabylonDescriptorBuilder } from '../../../src/babylon';
import {
  toPartialSig,
  UndelegationResponse,
  assertValidSignatures,
  toUnbondingPsbtWithSignatures,
} from '../../../src/babylon/undelegation';
import { parseStakingDescriptor } from '../../../src/babylon/parseDescriptor';
import { assertTransactionEqualsFixture } from '../fixtures.utils';

const BtcDelegation = t.type({
  unbonding_time: t.number,
  undelegation_response: UndelegationResponse,
});

type BtcDelegation = t.TypeOf<typeof BtcDelegation>;

async function getFixture(txid: string): Promise<BtcDelegation> {
  // As returned by https://babylon.nodes.guru/api#/Query/BTCDelegation
  const BtcDelegationResponse = t.type({ btc_delegation: BtcDelegation }, 'BtcDelegationResponse');
  const filename = __dirname + `/../../fixtures/babylon/rpc/btc_delegation/testnet.${txid}.json`;
  const data = JSON.parse(await fs.readFile(filename, 'utf8'));
  const result = BtcDelegationResponse.decode(data);
  if (isLeft(result)) {
    throw new Error(`Failed to decode fixture data for txid ${txid}: ${PathReporter.report(result).join(', ')}`);
  }
  return result.right.btc_delegation;
}

type DescriptorLike = Descriptor | ast.DescriptorNode | string;

function toDescriptor(descriptor: DescriptorLike): Descriptor {
  return descriptor instanceof Descriptor
    ? descriptor
    : Descriptor.fromStringDetectType(typeof descriptor === 'string' ? descriptor : ast.formatNode(descriptor));
}

function runTest(network: utxolib.Network, txid: string, descriptor: Descriptor): void {
  describe(`Unbonding transaction ${txid}`, function () {
    let fixture: BtcDelegation;
    let psbt: utxolib.bitgo.UtxoPsbt;
    let signatures: PartialSig[];

    before('should create a PSBT from the unbonding transaction', async function () {
      fixture = await getFixture(txid);
      const txBuffer = Buffer.from(fixture.undelegation_response.unbonding_tx_hex, 'hex');
      const tx = utxolib.bitgo.createTransactionFromBuffer(txBuffer, network, {
        amountType: 'bigint',
      });
      signatures = fixture.undelegation_response.covenant_unbonding_sig_list.map((sig) => toPartialSig(sig));

      psbt = toUnbondingPsbtWithSignatures(
        tx,
        {
          script: Buffer.from('5120b81e8691ab3c46bddf8ea43f776e4d64abf417a0fa5a4d09976c8aaadabbb6a0', 'hex'),
          value: 100_000n,
        },
        descriptor,
        signatures,
        utxolib.networks.testnet
      );
    });

    it('should have valid signatures', async function () {
      assertValidSignatures(psbt, 0, signatures);
    });

    it('should match the fixture', async function () {
      await assertTransactionEqualsFixture(
        'test/fixtures/babylon/unbonding.' + txid.substring(0, 4) + '.psbt.json',
        psbt
      );
    });

    it('can spend from unbonding output', async function () {
      const parsed = parseStakingDescriptor(descriptor);
      assert(parsed);

      const descriptorBuilder = new BabylonDescriptorBuilder(
        parsed.stakerKey,
        parsed.finalityProviderKeys,
        parsed.covenantKeys,
        parsed.covenantThreshold,
        parsed.stakingTimeLock,
        fixture.unbonding_time
      );

      assert.deepStrictEqual(
        descriptorBuilder.getUnbondingMiniscriptNode(),
        parsed.unbondingMiniscriptNode,
        'Unbonding miniscript node does not match expected value'
      );

      assert(psbt.txOutputs.length === 1, 'Unbonding transaction should have exactly one output');

      assert.deepStrictEqual(
        psbt.txOutputs[0].script,
        Buffer.from(descriptorBuilder.getUnbondingDescriptor().scriptPubkey())
      );
    });
  });
}

runTest(
  utxolib.networks.bitcoinPublicSignet,
  '5d277e1b29e5589074aea95ac8c8230fd911c2ec3c58774aafdef915619b772c',
  toDescriptor({
    tr: [
      '50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0',
      [
        {
          and_v: [
            {
              and_v: [
                { 'v:pk': '1b443f34ddc1bbaef52a8c5162dfa5a84524636ec745292f949470369ee67391' },
                { 'v:pk': 'd23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76' },
              ],
            },
            {
              multi_a: [
                6,
                '0aee0509b16db71c999238a4827db945526859b13c95487ab46725357c9a9f25',
                '113c3a32a9d320b72190a04a020a0db3976ef36972673258e9a38a364f3dc3b0',
                '17921cf156ccb4e73d428f996ed11b245313e37e27c978ac4d2cc21eca4672e4',
                '3bb93dfc8b61887d771f3630e9a63e97cbafcfcc78556a474df83a31a0ef899c',
                '40afaf47c4ffa56de86410d8e47baa2bb6f04b604f4ea24323737ddc3fe092df',
                '79a71ffd71c503ef2e2f91bccfc8fcda7946f4653cef0d9f3dde20795ef3b9f0',
                'd21faf78c6751a0d38e6bd8028b907ff07e9a869a43fc837d6b3f8dff6119a36',
                'f5199efae3f28bb82476163a7e458c7ad445d9bffb0682d10d3bdb2cb41f8e8e',
                'fa9d882d45f4060bdb8042183828cd87544f1ea997380e586cab77d5fd698737',
              ],
            },
          ],
        },
        [
          {
            and_v: [
              { 'v:pk': '1b443f34ddc1bbaef52a8c5162dfa5a84524636ec745292f949470369ee67391' },
              {
                multi_a: [
                  6,
                  '0aee0509b16db71c999238a4827db945526859b13c95487ab46725357c9a9f25',
                  '113c3a32a9d320b72190a04a020a0db3976ef36972673258e9a38a364f3dc3b0',
                  '17921cf156ccb4e73d428f996ed11b245313e37e27c978ac4d2cc21eca4672e4',
                  '3bb93dfc8b61887d771f3630e9a63e97cbafcfcc78556a474df83a31a0ef899c',
                  '40afaf47c4ffa56de86410d8e47baa2bb6f04b604f4ea24323737ddc3fe092df',
                  '79a71ffd71c503ef2e2f91bccfc8fcda7946f4653cef0d9f3dde20795ef3b9f0',
                  'd21faf78c6751a0d38e6bd8028b907ff07e9a869a43fc837d6b3f8dff6119a36',
                  'f5199efae3f28bb82476163a7e458c7ad445d9bffb0682d10d3bdb2cb41f8e8e',
                  'fa9d882d45f4060bdb8042183828cd87544f1ea997380e586cab77d5fd698737',
                ],
              },
            ],
          },
          { and_v: [{ 'v:pk': '1b443f34ddc1bbaef52a8c5162dfa5a84524636ec745292f949470369ee67391' }, { older: 10000 }] },
        ],
      ],
    ],
  })
);
