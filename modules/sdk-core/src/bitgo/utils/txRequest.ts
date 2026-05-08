import { ApiVersion, IWallet } from '../wallet';
import assert from 'assert';

export function validateTxRequestApiVersion(wallet: IWallet, requestedApiVersion: ApiVersion): void {
  if (wallet.multisigType() !== 'tss') {
    // only tss wallets have api version requirements
    return;
  }
  if (wallet.baseCoin.getMPCAlgorithm() === 'ecdsa' || wallet.multisigTypeVersion() === 'MPCv2') {
    assert(requestedApiVersion === 'full', 'For MPCv2 tss wallets, parameter `apiVersion` must be `full`.');
  } else if (wallet.type() !== 'hot') {
    // all other cases should use full!
    assert(
      requestedApiVersion === 'full',
      'For non self-custodial (hot) tss wallets, parameter `apiVersion` must be `full`.'
    );
  }
  return;
}

/**
 * Get the api version for the provided wallet.
 * If the user requested api version is invalid, this will throw an error.
 * @param wallet
 * @param requestedApiVersion
 */
export function getTxRequestApiVersion(wallet: IWallet, requestedApiVersion?: ApiVersion): ApiVersion {
  if (requestedApiVersion) {
    validateTxRequestApiVersion(wallet, requestedApiVersion);
    return requestedApiVersion;
  }
  if (wallet.baseCoin.getMPCAlgorithm() === 'ecdsa' || wallet.multisigTypeVersion() === 'MPCv2') {
    return 'full';
  } else if (wallet.type() === 'hot') {
    // default to lite for hot eddsa tss wallets (v1 only)
    return 'lite';
  } else {
    // default to full for all other wallet types
    return 'full';
  }
}
