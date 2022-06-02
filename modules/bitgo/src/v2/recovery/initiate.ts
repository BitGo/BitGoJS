import { BitGoBase, InitiateRecoveryOptions } from '@bitgo/sdk-core';
import * as stellar from 'stellar-sdk';

export function getStellarKeys(bitgo: BitGoBase, params: InitiateRecoveryOptions): stellar.Keypair[] {
  const keys: stellar.Keypair[] = [];
  let userKey = params.userKey;
  let backupKey = params.backupKey;

  // Stellar's Ed25519 public keys start with a G, while private keys start with an S
  const isKrsRecovery = backupKey.startsWith('G') && !userKey.startsWith('G');
  const isUnsignedSweep = backupKey.startsWith('G') && userKey.startsWith('G');

  try {
    if (!userKey.startsWith('S') && !userKey.startsWith('G')) {
      userKey = bitgo.decrypt({
        input: userKey,
        password: params.walletPassphrase,
      });
    }

    const userKeyPair = isUnsignedSweep ? stellar.Keypair.fromPublicKey(userKey) : stellar.Keypair.fromSecret(userKey);
    keys.push(userKeyPair);
  } catch (e) {
    throw new Error('Failed to decrypt user key with passcode - try again!');
  }

  try {
    if (!backupKey.startsWith('S') && !isKrsRecovery && !isUnsignedSweep) {
      backupKey = bitgo.decrypt({
        input: backupKey,
        password: params.walletPassphrase,
      });
    }

    if (isKrsRecovery || isUnsignedSweep) {
      keys.push(stellar.Keypair.fromPublicKey(backupKey));
    } else {
      keys.push(stellar.Keypair.fromSecret(backupKey));
    }
  } catch (e) {
    throw new Error('Failed to decrypt backup key with passcode - try again!');
  }

  return keys;
}
