import { CommandModule } from 'yargs';
import * as utxolib from '@bitgo/utxo-lib';
import { coreDao } from '@bitgo/utxo-staking';

import { BitGoApiArgs } from '../../bitGoArgs';
import { cmdCreate, createDescriptorWallet, CreateWalletArgs } from '../createWallet';
import { getBitGoWithUtxoCoin, getDefaultEnterpriseId } from '../../util/bitGoInstance';
import { Descriptor } from '@bitgo/wasm-miniscript';

type CreateStakingWalletArgs = CreateWalletArgs & {
  locktime: string;
};

function toLocktime(locktime: string): number | Date {
  const locktimeNumber = parseInt(locktime, 10);
  if (!isNaN(locktimeNumber)) {
    return locktimeNumber;
  }
  const locktimeDate = Date.parse(locktime);
  if (!isNaN(locktimeDate)) {
    return Math.floor(locktimeDate / 1000);
  }
  throw new Error('Invalid locktime');
}

export const cmdCreateStakingWallet: CommandModule<BitGoApiArgs, BitGoApiArgs & CreateStakingWalletArgs> = {
  command: 'createWallet',
  describe: 'Create a staking wallet',
  builder(y) {
    return cmdCreate.builder(y).option('locktime', { type: 'string', demandOption: true });
  },
  async handler(args) {
    const { bitgo, coin } = getBitGoWithUtxoCoin(args);
    const locktime = toLocktime(args.locktime);
    createDescriptorWallet(bitgo, coin, {
      name: args.name,
      enterpriseId: args.enterpriseId ?? (await getDefaultEnterpriseId(bitgo)),
      walletPassphrase: args.walletPassphrase,
      descriptorBuilder(keychains) {
        const keys = keychains.map((k) => {
          if (!k.pub) {
            throw new Error('Missing public key');
          }
          return utxolib.bip32.fromBase58(k.pub);
        });
        return Descriptor.fromString(
          coreDao.createMultiSigDescriptor(
            'sh-wsh',
            typeof locktime === 'number' ? locktime : locktime.getTime() / 1000,
            2,
            keys
          ),
          'derivable'
        ).toString();
      },
    });
  },
};
