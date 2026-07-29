import { BitGoBase } from '../bitgoBase';
import { IBaseCoin } from '../baseCoin';

import { Wallet } from '../wallet';
import { KeyIndices } from '../keychain';
import { WalletWithKeychains } from '../wallet/iWallets';

/**
 * Interface for EVM keyring wallet creation parameters
 */
export interface CreateEvmKeyRingWalletParams {
  label: string;
  evmKeyRingReferenceWalletId: string;
  bitgo: BitGoBase;
  baseCoin: IBaseCoin;
}

/**
 * @param params - The wallet creation parameters
 * @param baseCoin - The base coin instance
 * @throws Error if validation fails
 * @returns boolean - true if validation passes
 */
export function validateEvmKeyRingWalletParams(params: any, baseCoin: IBaseCoin): boolean {
  if (!params.evmKeyRingReferenceWalletId) return false;

  if (typeof params.evmKeyRingReferenceWalletId !== 'string') {
    throw new Error('invalid evmKeyRingReferenceWalletId argument, expecting string');
  }
  if (!baseCoin.isEVM()) {
    throw new Error('evmKeyRingReferenceWalletId is only supported for EVM chains');
  }
  return true;
}

/**
 * Creates an EVM keyring wallet with shared keys from a reference wallet
 * @param params - The parameters for creating the EVM keyring wallet
 * @returns Promise<WalletWithKeychains> - The created wallet with its keychains
 */
export async function createEvmKeyRingWallet(params: CreateEvmKeyRingWalletParams): Promise<WalletWithKeychains> {
  const { label, evmKeyRingReferenceWalletId, bitgo, baseCoin } = params;
  // For EVM keyring wallets, this bypasses the normal key generation process since keys are shared via keyring
  const addWalletParams = {
    label,
    evmKeyRingReferenceWalletId,
  };

  const newWallet = await bitgo.post(baseCoin.url('/wallet/add')).send(addWalletParams).result();

  const userKeychain = baseCoin.keychains().get({ id: newWallet.keys[KeyIndices.USER] });
  const backupKeychain = baseCoin.keychains().get({ id: newWallet.keys[KeyIndices.BACKUP] });
  const bitgoKeychain = baseCoin.keychains().get({ id: newWallet.keys[KeyIndices.BITGO] });

  const [userKey, backupKey, bitgoKey] = await Promise.all([userKeychain, backupKeychain, bitgoKeychain]);

  const result: WalletWithKeychains = {
    wallet: new Wallet(bitgo, baseCoin, newWallet),
    userKeychain: userKey,
    backupKeychain: backupKey,
    bitgoKeychain: bitgoKey,
    responseType: 'WalletWithKeychains',
  };

  return result;
}
