import { BitGoBase, ExternalEd25519Signer, InitiateRecoveryOptions } from '@bitgo/sdk-core';
import * as stellar from 'stellar-sdk';
import { Utils } from './lib';

export async function getStellarKeys(
  bitgo: BitGoBase,
  params: Omit<InitiateRecoveryOptions, 'backupKey'> & { backupKey?: string },
  externalBackupSigner?: ExternalEd25519Signer
): Promise<stellar.Keypair[]> {
  const keys: stellar.Keypair[] = [];
  let userKey = params.userKey;
  let backupKey = params.backupKey;

  // Stellar's Ed25519 public keys start with a G, while private keys start with an S
  const hasPublicBackupKey = backupKey !== undefined && backupKey.startsWith('G');
  const isKrsRecovery = !externalBackupSigner && hasPublicBackupKey && !userKey.startsWith('G');
  const isUnsignedSweep = !externalBackupSigner && hasPublicBackupKey && userKey.startsWith('G');

  /**
   * Get User Key
   */
  try {
    if (!userKey.startsWith('S') && !userKey.startsWith('G')) {
      userKey = await bitgo.decrypt({
        input: userKey,
        password: params.walletPassphrase,
      });

      // After decryption, we could have a root key, so we need to encode it to a Stellar format key
      if (Utils.isValidRootPrivateKey(userKey)) {
        userKey = Utils.encodePrivateKey(Buffer.from(userKey.slice(0, 64), 'hex'));
      } else if (Utils.isValidRootPublicKey(userKey)) {
        userKey = Utils.encodePublicKey(Buffer.from(userKey, 'hex'));
      }
    }

    const userKeyPair = isUnsignedSweep ? stellar.Keypair.fromPublicKey(userKey) : stellar.Keypair.fromSecret(userKey);
    keys.push(userKeyPair);
  } catch (e) {
    throw new Error('Failed to decrypt user key with passcode - try again!');
  }

  /**
   * Get Backup Key
   */
  if (externalBackupSigner) {
    keys.push(
      stellar.Keypair.fromPublicKey(
        stellar.StrKey.encodeEd25519PublicKey(Buffer.from(externalBackupSigner.publicKey, 'hex'))
      )
    );
  } else {
    if (!backupKey) {
      throw new Error('backupKey is required for non-bitgo recovery when no external backup signer is provided');
    }
    try {
      if (!backupKey.startsWith('S') && !isKrsRecovery && !isUnsignedSweep) {
        backupKey = await bitgo.decrypt({
          input: backupKey,
          password: params.walletPassphrase,
        });

        // After decryption we could have a root key, so we need to encode it to a Stellar format key
        if (Utils.isValidRootPrivateKey(backupKey)) {
          backupKey = Utils.encodePrivateKey(Buffer.from(backupKey.slice(0, 64), 'hex'));
        } else if (Utils.isValidRootPublicKey(backupKey)) {
          backupKey = Utils.encodePublicKey(Buffer.from(backupKey, 'hex'));
        }
      }

      if (isKrsRecovery || isUnsignedSweep) {
        keys.push(stellar.Keypair.fromPublicKey(backupKey));
      } else {
        keys.push(stellar.Keypair.fromSecret(backupKey));
      }
    } catch (e) {
      throw new Error('Failed to decrypt backup key with passcode - try again!');
    }
  }

  return keys;
}
