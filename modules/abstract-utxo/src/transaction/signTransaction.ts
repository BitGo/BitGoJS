import _ from 'lodash';
import { AbstractUtxoCoin, SignTransactionOptions } from '../abstractUtxoCoin';
import { isDescriptorWallet } from '../descriptor';
import * as fixedScript from './fixedScript';
import { IWallet } from '@bitgo/sdk-core';

export async function signTransaction<TNumber extends number | bigint>(
  coin: AbstractUtxoCoin,
  params: SignTransactionOptions<TNumber>
): Promise<{ txHex: string }> {
  const txPrebuild = params.txPrebuild;

  if (_.isUndefined(txPrebuild) || !_.isObject(txPrebuild)) {
    if (!_.isUndefined(txPrebuild) && !_.isObject(txPrebuild)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txPrebuild}`);
    }
    throw new Error('missing txPrebuild parameter');
  }

  const tx = coin.decodeTransactionFromPrebuild(params.txPrebuild);

  if (params.wallet && isDescriptorWallet(params.wallet as IWallet)) {
    throw new Error('Descriptor wallets are not supported');
  } else {
    return fixedScript.signTransaction(coin, tx, {
      walletId: params.txPrebuild.walletId,
      txInfo: params.txPrebuild.txInfo,
      isLastSignature: params.isLastSignature ?? false,
      prv: typeof params.prv === 'string' ? params.prv : undefined,
      signingStep: params.signingStep,
      allowNonSegwitSigningWithoutPrevTx: params.allowNonSegwitSigningWithoutPrevTx ?? false,
      pubs: params.pubs,
      cosignerPub: params.cosignerPub,
    });
  }
}
