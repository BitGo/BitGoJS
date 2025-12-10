import { CommandModule } from 'yargs';
import { BitGoAPI } from '@bitgo/sdk-api';
import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import { IWallet } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { BitGoApiArgs } from '../../bitGoArgs';
import { getBitGoWithUtxoCoin, selectWallet } from '../../util/bitGoInstance';
import { getXprv } from '../xprv';

/*

export const CoreDaoStakingParams = t.type({
  type: t.union([t.literal('delegate'), t.literal('undelegate')]),
  validator: t.string,
  amount: tt.BigIntFromString,
  expiration: tt.DateFromISOString,
  rewardAddress: t.string,
  version: t.number,
  fee: t.number,
});
 */

type BuildTransactionCoreDaoStakingParams = {
  type: 'delegate' | 'undelegate';
  validator: string;
  amount: string;
  expiration: string;
  rewardAddress: string;
  version: number;
  fee: number;
};

const sampleStakingParams = {
  // https://docs.coredao.org/docs/Learn/products/btc-staking/design#op_return-output-1
  rewardAddress: 'de60b7d0e6b758ca5dd8c61d377a2c5f1af51ec1',
  validatorAddress: 'a9e209f5ea0036c8c2f41078a3cebee57d8a47d5',
  expiration: '2024-04-04T08:00:31.000Z',
  version: 1,
  fee: 1,
};

export type StakeArgs = {
  from: string;
  to: string;
  amount: string;
  locktime: string;
  rewardAddress: string;
  validatorAddress: string;
  feeRateSatB: number;
  otp: string;
  walletPassphrase: string;
};

async function createStakingTransaction(
  bitgo: BitGoAPI,
  coin: AbstractUtxoCoin,
  fromWallet: IWallet,
  coreDaoStakingParams: BuildTransactionCoreDaoStakingParams,
  { feeRateSatB, walletPassphrase, otp }: { feeRateSatB: number; walletPassphrase: string; otp: string }
) {
  console.log('coreDaoStakingParams', JSON.stringify(coreDaoStakingParams, null, 2));
  const result = await bitgo
    .post(coin.url('/wallet/' + fromWallet.id() + '/tx/build'))
    .send({
      type: 'staking',
      stakingParams: { coreDao: coreDaoStakingParams },
      recipients: [],
      feeRate: feeRateSatB * 1000,
      staking: {},
    })
    .result();
  let psbt: utxolib.Psbt;
  if ('txBase64' in result && typeof result.txBase64 === 'string') {
    psbt = utxolib.bitgo.createPsbtDecode(result.txBase64, coin.network);
  } else {
    throw new Error('Expected psbt to be a string');
  }
  const key = await getXprv(coin, fromWallet, { walletPassphrase });
  psbt.signAllInputsHD(key);
  try {
    await bitgo.unlock({ otp });
  } catch (e) {
    if (!e.message.includes('Token is already unlocked longer')) {
      throw e;
    }
  }
  return bitgo
    .post(coin.url('/wallet/' + fromWallet.id() + '/tx/send'))
    .send({ txHex: psbt.toHex() })
    .result();
}

export const cmdStakingCreateTx = {
  command: 'createTx',
  builder(y) {
    return y
      .option('from', { type: 'string', demandOption: true })
      .option('amount', { type: 'string', demandOption: true })
      .option('feeRateSatB', { type: 'number', default: 10 })
      .option('locktime', { type: 'string', demandOption: true, default: sampleStakingParams.expiration })
      .option('rewardAddress', { type: 'string', demandOption: true, default: sampleStakingParams.rewardAddress })
      .option('validatorAddress', { type: 'string', demandOption: true, default: sampleStakingParams.validatorAddress })
      .option('otp', { type: 'string', demandOption: true, default: '0000000' })
      .option('walletPassphrase', { type: 'string', demandOption: true, default: 'setec astronomy' });
  },
  async handler(args) {
    const { bitgo, coin } = getBitGoWithUtxoCoin(args);
    const from = await selectWallet(bitgo, coin, { walletLabel: args.from });
    await createStakingTransaction(
      bitgo,
      coin,
      from,
      {
        type: 'delegate',
        validator: args.validatorAddress,
        amount: args.amount,
        expiration: args.locktime,
        rewardAddress: args.rewardAddress,
        version: 1,
        fee: 1,
      },
      {
        feeRateSatB: args.feeRateSatB,
        walletPassphrase: args.walletPassphrase,
        otp: args.otp,
      }
    );
  },
} satisfies CommandModule<BitGoApiArgs, BitGoApiArgs & StakeArgs>;
