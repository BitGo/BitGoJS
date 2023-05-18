/**
 * @prettier
 */
import assert from 'assert';
import * as bs58 from 'bs58';
import * as openpgp from 'openpgp';
import { Ed25519BIP32 } from '../../../../account-lib';
import Eddsa, { SignShare, GShare } from '../../../../account-lib/mpc/tss';
import { AddKeychainOptions, Keychain, KeyType, CreateBackupOptions } from '../../../keychain';
import { verifyWalletSignature } from '../../../tss/eddsa/eddsa';
import { encryptText, getBitgoGpgPubKey, createShareProof, generateGPGKeyPair } from '../../opengpgUtils';
import {
  createUserSignShare,
  createUserToBitGoGShare,
  getBitgoToUserRShare,
  getTxRequest,
  offerUserToBitgoRShare,
  sendUserToBitgoGShare,
  SigningMaterial,
} from '../../../tss';
import {
  CustomGShareGeneratingFunction,
  CustomRShareGeneratingFunction,
  SignatureShareRecord,
  TSSParams,
  TxRequest,
} from '../baseTypes';
import { CreateEddsaBitGoKeychainParams, CreateEddsaKeychainParams, KeyShare, YShare, Commitment } from './types';
import baseTSSUtils from '../baseTSSUtils';
import { KeychainsTriplet } from '../../../baseCoin';
import { exchangeEddsaCommitments } from '../../../tss/common';
import { createHash } from 'crypto';

/**
 * Utility functions for TSS work flows.
 */

export class EddsaUtils extends baseTSSUtils<KeyShare> {
  async verifyWalletSignatures(
    userGpgPub: string,
    backupGpgPub: string,
    bitgoKeychain: Keychain,
    decryptedShare: string,
    verifierIndex: 1 | 2
  ): Promise<void> {
    assert(bitgoKeychain.commonKeychain);
    assert(bitgoKeychain.walletHSMGPGPublicKeySigs);

    const bitgoGpgKey = await getBitgoGpgPubKey(this.bitgo);

    const userKeyPub = await openpgp.readKey({ armoredKey: userGpgPub });
    const userKeyId = userKeyPub.keyPacket.getFingerprint();

    const backupKeyPub = await openpgp.readKey({ armoredKey: backupGpgPub });
    const backupKeyId = backupKeyPub.keyPacket.getFingerprint();

    const walletSignatures = await openpgp.readKeys({ armoredKeys: bitgoKeychain.walletHSMGPGPublicKeySigs });
    if (walletSignatures.length !== 2) {
      throw new Error('Invalid wallet signatures');
    }

    if (userKeyId !== walletSignatures[0].keyPacket.getFingerprint()) {
      throw new Error(`first wallet signature's fingerprint does not match passed user gpg key's fingerprint`);
    }

    if (backupKeyId !== walletSignatures[1].keyPacket.getFingerprint()) {
      throw new Error(`second wallet signature's fingerprint does not match passed backup gpg key's fingerprint`);
    }

    await verifyWalletSignature({
      walletSignature: walletSignatures[0],
      commonKeychain: bitgoKeychain.commonKeychain,
      userKeyId,
      backupKeyId,
      bitgoPub: bitgoGpgKey,
      decryptedShare,
      verifierIndex,
    });

    await verifyWalletSignature({
      walletSignature: walletSignatures[1],
      commonKeychain: bitgoKeychain.commonKeychain,
      userKeyId,
      backupKeyId,
      bitgoPub: bitgoGpgKey,
      decryptedShare,
      verifierIndex,
    });
  }

  /**
   * Creates a Keychain containing the User's TSS signing materials.
   * We need to have the passphrase be optional to allow for the client to store their backup key on their premises
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - user's TSS key share
   * @param backupKeyShare - backup's TSS key share
   * @param bitgoKeychain - previously created BitGo keychain; must be compatible with user and backup key shares
   * @param [passphrase] - optional wallet passphrase used to encrypt user's signing materials
   * @param [originalPasscodeEncryptionCode] - optional encryption code needed for wallet password reset for hot wallets
   */
  async createUserKeychain({
    userGpgKey,
    backupGpgKey,
    userKeyShare,
    backupKeyShare,
    bitgoKeychain,
    passphrase,
    originalPasscodeEncryptionCode,
  }: CreateEddsaKeychainParams): Promise<Keychain> {
    const MPC = await Eddsa.initialize();
    const bitgoKeyShares = bitgoKeychain.keyShares;
    if (!bitgoKeyShares) {
      throw new Error('Missing BitGo key shares');
    }

    const bitGoToUserShare = bitgoKeyShares.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'user');
    if (!bitGoToUserShare) {
      throw new Error('Missing BitGo to User key share');
    }

    const bitGoToUserPrivateShare = await this.decryptPrivateShare(bitGoToUserShare.privateShare, userGpgKey);

    await this.verifyWalletSignatures(
      userGpgKey.publicKey,
      backupGpgKey.publicKey,
      bitgoKeychain,
      bitGoToUserPrivateShare,
      1
    );

    const bitgoToUser: YShare = {
      i: 1,
      j: 3,
      y: bitGoToUserShare.publicShare.slice(0, 64),
      v: bitGoToUserShare.vssProof,
      u: bitGoToUserPrivateShare.slice(0, 64),
      chaincode: bitGoToUserPrivateShare.slice(64),
    };

    // TODO(BG-47170): use tss.createCombinedKey helper when signatures are supported
    const userCombined = MPC.keyCombine(userKeyShare.uShare, [backupKeyShare.yShares[1], bitgoToUser]);
    const commonKeychain = userCombined.pShare.y + userCombined.pShare.chaincode;
    if (commonKeychain !== bitgoKeychain.commonKeychain) {
      throw new Error('Failed to create user keychain - commonKeychains do not match.');
    }

    const userSigningMaterial: SigningMaterial = {
      uShare: userKeyShare.uShare,
      bitgoYShare: bitgoToUser,
      backupYShare: backupKeyShare.yShares[1],
    };

    const userKeychainParams: AddKeychainOptions = {
      source: 'user',
      keyType: 'tss' as KeyType,
      commonKeychain: bitgoKeychain.commonKeychain,
      originalPasscodeEncryptionCode,
    };
    if (passphrase !== undefined) {
      userKeychainParams.encryptedPrv = this.bitgo.encrypt({
        input: JSON.stringify(userSigningMaterial),
        password: passphrase,
      });
    }

    return await this.baseCoin.keychains().add(userKeychainParams);
  }

  /**
   * Creates a Keychain containing the Backup party's TSS signing materials.
   * We need to have the passphrase be optional to allow for the client to store their backup key on their premises
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - User's TSS Keyshare
   * @param backupGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between backup and server
   * @param backupKeyShare - Backup's TSS Keyshare
   * @param bitgoKeychain - previously created BitGo keychain; must be compatible with user and backup key shares
   * @param [passphrase] - optional wallet passphrase used to encrypt user's signing materials
   */
  async createBackupKeychain({
    userGpgKey,
    backupGpgKey,
    userKeyShare,
    backupKeyShare,
    bitgoKeychain,
    passphrase,
  }: CreateEddsaKeychainParams): Promise<Keychain> {
    const MPC = await Eddsa.initialize();
    const bitgoKeyShares = bitgoKeychain.keyShares;
    if (!bitgoKeyShares) {
      throw new Error('Invalid bitgo keyshares');
    }

    const bitGoToBackupShare = bitgoKeyShares.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'backup');
    if (!bitGoToBackupShare) {
      throw new Error('Missing BitGo to User key share');
    }

    const bitGoToBackupPrivateShare = await this.decryptPrivateShare(bitGoToBackupShare.privateShare, backupGpgKey);

    await this.verifyWalletSignatures(
      userGpgKey.publicKey,
      backupGpgKey.publicKey,
      bitgoKeychain,
      bitGoToBackupPrivateShare,
      2
    );

    const bitgoToBackup: YShare = {
      i: 2,
      j: 3,
      y: bitGoToBackupShare.publicShare.slice(0, 64),
      v: bitGoToBackupShare.vssProof,
      u: bitGoToBackupPrivateShare.slice(0, 64),
      chaincode: bitGoToBackupPrivateShare.slice(64),
    };

    // TODO(BG-47170): use tss.createCombinedKey helper when signatures are supported
    const backupCombined = MPC.keyCombine(backupKeyShare.uShare, [userKeyShare.yShares[2], bitgoToBackup]);
    const commonKeychain = backupCombined.pShare.y + backupCombined.pShare.chaincode;
    if (commonKeychain !== bitgoKeychain.commonKeychain) {
      throw new Error('Failed to create backup keychain - commonKeychains do not match.');
    }

    const backupSigningMaterial: SigningMaterial = {
      uShare: backupKeyShare.uShare,
      bitgoYShare: bitgoToBackup,
      userYShare: userKeyShare.yShares[2],
    };
    const prv = JSON.stringify(backupSigningMaterial);

    const params: CreateBackupOptions = {
      source: 'backup',
      keyType: 'tss',
      commonKeychain: bitgoKeychain.commonKeychain,
      prv: prv,
    };

    if (passphrase !== undefined) {
      params.encryptedPrv = this.bitgo.encrypt({ input: prv, password: passphrase });
    }

    return await this.baseCoin.keychains().createBackup(params);
  }

  /**
   * Creates a Keychain containing BitGo's TSS signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - user's TSS key share
   * @param backupKeyShare - backup's TSS key share
   * @param enterprise - enterprise associated to the wallet
   */
  async createBitgoKeychain({
    userGpgKey,
    backupGpgKey,
    userKeyShare,
    backupKeyShare,
    enterprise,
  }: CreateEddsaBitGoKeychainParams): Promise<Keychain> {
    // TODO(BG-47170): use tss.encryptYShare helper when signatures are supported
    const userToBitgoPublicShare = Buffer.concat([
      Buffer.from(userKeyShare.uShare.y, 'hex'),
      Buffer.from(userKeyShare.uShare.chaincode, 'hex'),
    ]).toString('hex');
    const userToBitgoPrivateShare = Buffer.concat([
      Buffer.from(userKeyShare.yShares[3].u, 'hex'),
      Buffer.from(userKeyShare.yShares[3].chaincode, 'hex'),
    ]).toString('hex');
    const userToBitgoKeyShare = {
      publicShare: userToBitgoPublicShare,
      privateShare: userToBitgoPrivateShare,
      privateShareProof: await createShareProof(userGpgKey.privateKey, userToBitgoPrivateShare.slice(0, 64), 'eddsa'),
      vssProof: userKeyShare.yShares[3].v,
    };

    const backupToBitgoPublicShare = Buffer.concat([
      Buffer.from(backupKeyShare.uShare.y, 'hex'),
      Buffer.from(backupKeyShare.uShare.chaincode, 'hex'),
    ]).toString('hex');
    const backupToBitgoPrivateShare = Buffer.concat([
      Buffer.from(backupKeyShare.yShares[3].u, 'hex'),
      Buffer.from(backupKeyShare.yShares[3].chaincode, 'hex'),
    ]).toString('hex');
    const backupToBitgoKeyShare = {
      publicShare: backupToBitgoPublicShare,
      privateShare: backupToBitgoPrivateShare,
      privateShareProof: await createShareProof(
        backupGpgKey.privateKey,
        backupToBitgoPrivateShare.slice(0, 64),
        'eddsa'
      ),
      vssProof: backupKeyShare.yShares[3].v,
    };

    return await this.createBitgoKeychainInWP(
      userGpgKey,
      backupGpgKey,
      userToBitgoKeyShare,
      backupToBitgoKeyShare,
      'tss',
      enterprise
    );
  }

  /**
   * Creates User, Backup, and BitGo TSS Keychains.
   *
   * @param params.passphrase - passphrase used to encrypt signing materials created for User and Backup
   */
  async createKeychains(params: {
    passphrase?: string;
    enterprise?: string;
    originalPasscodeEncryptionCode?: string;
  }): Promise<KeychainsTriplet> {
    const MPC = await Eddsa.initialize();
    const m = 2;
    const n = 3;

    const userKeyShare = MPC.keyShare(1, m, n);
    const backupKeyShare = MPC.keyShare(2, m, n);

    const userGpgKey = await generateGPGKeyPair('secp256k1');
    const backupGpgKey = await generateGPGKeyPair('secp256k1');

    const bitgoKeychain = await this.createBitgoKeychain({
      userGpgKey,
      userKeyShare,
      backupGpgKey,
      backupKeyShare,
      enterprise: params.enterprise,
    });
    const userKeychainPromise = this.createUserKeychain({
      userGpgKey,
      userKeyShare,
      backupGpgKey,
      backupKeyShare,
      bitgoKeychain,
      passphrase: params.passphrase,
      originalPasscodeEncryptionCode: params.originalPasscodeEncryptionCode,
    });
    const backupKeychainPromise = this.createBackupKeychain({
      userGpgKey,
      userKeyShare,
      backupGpgKey,
      backupKeyShare,
      bitgoKeychain,
      passphrase: params.passphrase,
    });
    const [userKeychain, backupKeychain] = await Promise.all([userKeychainPromise, backupKeychainPromise]);

    // create wallet
    const keychains = {
      userKeychain,
      backupKeychain,
      bitgoKeychain,
    };

    return keychains;
  }

  async createRShareFromTxRequest(params: {
    txRequest: TxRequest;
    prv: string;
  }): Promise<{ rShare: SignShare; signingKeyYShare: YShare }> {
    const { txRequest, prv } = params;
    const txRequestResolved: TxRequest = txRequest;

    const hdTree = await Ed25519BIP32.initialize();
    const MPC = await Eddsa.initialize(hdTree);

    const userSigningMaterial: SigningMaterial = JSON.parse(prv);
    if (!userSigningMaterial.backupYShare) {
      throw new Error('Invalid user key - missing backupYShare');
    }

    assert(txRequestResolved.transactions || txRequestResolved.unsignedTxs, 'Unable to find transactions in txRequest');
    const unsignedTx =
      txRequestResolved.apiVersion === 'full'
        ? txRequestResolved.transactions![0].unsignedTx
        : txRequestResolved.unsignedTxs[0];

    const signingKey = MPC.keyDerive(
      userSigningMaterial.uShare,
      [userSigningMaterial.bitgoYShare, userSigningMaterial.backupYShare],
      unsignedTx.derivationPath
    );

    const signablePayload = Buffer.from(unsignedTx.signableHex, 'hex');

    const userSignShare = await createUserSignShare(signablePayload, signingKey.pShare);

    return { rShare: userSignShare, signingKeyYShare: signingKey.yShares[3] };
  }

  async createGShareFromTxRequest(params: {
    txRequest: string | TxRequest;
    prv: string;
    bitgoToUserCommitment: Commitment;
    bitgoToUserRShare: SignatureShareRecord;
    userToBitgoRShare: SignShare;
  }): Promise<GShare> {
    let txRequestResolved: TxRequest;

    const { txRequest, prv, bitgoToUserCommitment, bitgoToUserRShare, userToBitgoRShare } = params;

    if (typeof txRequest === 'string') {
      txRequestResolved = await getTxRequest(this.bitgo, this.wallet.id(), txRequest);
    } else {
      txRequestResolved = txRequest;
    }

    const userSigningMaterial: SigningMaterial = JSON.parse(prv);
    if (!userSigningMaterial.backupYShare) {
      throw new Error('Invalid user key - missing backupYShare');
    }

    assert(txRequestResolved.transactions || txRequestResolved.unsignedTxs, 'Unable to find transactions in txRequest');
    const unsignedTx =
      txRequestResolved.apiVersion === 'full'
        ? txRequestResolved.transactions![0].unsignedTx
        : txRequestResolved.unsignedTxs[0];

    const signablePayload = Buffer.from(unsignedTx.signableHex, 'hex');

    const userToBitGoGShare = await createUserToBitGoGShare(
      userToBitgoRShare,
      bitgoToUserCommitment,
      bitgoToUserRShare,
      userSigningMaterial.backupYShare,
      userSigningMaterial.bitgoYShare,
      signablePayload
    );
    return userToBitGoGShare;
  }

  async signUsingExternalSigner(
    txRequest: string | TxRequest,
    externalSignerRShareGenerator: CustomRShareGeneratingFunction,
    externalSignerGShareGenerator: CustomGShareGeneratingFunction
  ): Promise<TxRequest> {
    let txRequestResolved: TxRequest;
    let txRequestId: string;
    if (typeof txRequest === 'string') {
      txRequestResolved = await getTxRequest(this.bitgo, this.wallet.id(), txRequest);
      txRequestId = txRequestResolved.txRequestId;
    } else {
      txRequestResolved = txRequest;
      txRequestId = txRequest.txRequestId;
    }
    const rSignShareTransactionParams = {
      txRequest: txRequestResolved,
    };
    const { rShare, signingKeyYShare } = await externalSignerRShareGenerator(rSignShareTransactionParams);
    const signerShare = signingKeyYShare.u + signingKeyYShare.chaincode;
    const bitgoGpgKey = await getBitgoGpgPubKey(this.bitgo);
    const encryptedSignerShare = await encryptText(signerShare, bitgoGpgKey);

    // TODO: need to fix this to work
    await offerUserToBitgoRShare(this.bitgo, this.wallet.id(), txRequestId, rShare, encryptedSignerShare, 'full');
    const bitgoToUserRShare = await getBitgoToUserRShare(this.bitgo, this.wallet.id(), txRequestId);
    const gSignShareTransactionParams = {
      txRequest: txRequestResolved,
      bitgoToUserRShare: bitgoToUserRShare,
      userToBitgoRShare: rShare,
    };
    const gShare = await externalSignerGShareGenerator(gSignShareTransactionParams);
    await sendUserToBitgoGShare(this.bitgo, this.wallet.id(), txRequestId, gShare, 'full');
    return await getTxRequest(this.bitgo, this.wallet.id(), txRequestId);
  }

  /**
   * Signs the transaction associated to the transaction request.
   *
   * @param txRequest - transaction request object or id
   * @param prv - decrypted private key
   * @param reqId - request id
   * @returns {Promise<TxRequest>} fully signed TxRequest object
   */
  async signTxRequest(params: TSSParams): Promise<TxRequest> {
    let txRequestResolved: TxRequest;
    let txRequestId: string;
    const { txRequest, prv, apiVersion } = params;
    if (typeof txRequest === 'string') {
      txRequestResolved = await getTxRequest(this.bitgo, this.wallet.id(), txRequest);
      txRequestId = txRequestResolved.txRequestId;
    } else {
      txRequestResolved = txRequest;
      txRequestId = txRequest.txRequestId;
    }
    const hdTree = await Ed25519BIP32.initialize();
    const MPC = await Eddsa.initialize(hdTree);
    const userSigningMaterial: SigningMaterial = JSON.parse(prv);
    if (!userSigningMaterial.backupYShare) {
      throw new Error('Invalid user key - missing backupYShare');
    }

    assert(txRequestResolved.transactions || txRequestResolved.unsignedTxs, 'Unable to find transactions in txRequest');
    const unsignedTx =
      txRequestResolved.apiVersion === 'full'
        ? txRequestResolved.transactions![0].unsignedTx
        : txRequestResolved.unsignedTxs[0];

    const signingKey = MPC.keyDerive(
      userSigningMaterial.uShare,
      [userSigningMaterial.bitgoYShare, userSigningMaterial.backupYShare],
      unsignedTx.derivationPath
    );
    const signablePayload = Buffer.from(unsignedTx.signableHex, 'hex');
    const userSignShare = await createUserSignShare(signablePayload, signingKey.pShare);
    const bitgoIndex = 3;
    const signerShare = signingKey.yShares[bitgoIndex].u + signingKey.yShares[bitgoIndex].chaincode;
    const bitgoGpgKey = await getBitgoGpgPubKey(this.bitgo);
    const encryptedSignerShare = await encryptText(signerShare, bitgoGpgKey);
    const userGpgKey = await generateGPGKeyPair('secp256k1');
    const privateShareProof = await createShareProof(userGpgKey.privateKey, signingKey.yShares[bitgoIndex].u, 'eddsa');
    const vssProof = signingKey.yShares[bitgoIndex].v;
    const userPublicGpgKey = userGpgKey.publicKey;
    const publicShare = signingKey.yShares[bitgoIndex].y + signingKey.yShares[bitgoIndex].chaincode;
    const exchangeCommitmentResponse = await exchangeEddsaCommitments(
      this.bitgo,
      this.wallet.id(),
      txRequestId,
      userSignShare.commitment,
      unsignedTx.serializedTxHex,
      encryptedSignerShare
    );

    const bitgoToUserCommitment = {
      c: exchangeCommitmentResponse.commitment,
      z: createHash('sha256').update(unsignedTx.serializedTxHex).digest().toString('hex'),
    } as Commitment;

    await offerUserToBitgoRShare(
      this.bitgo,
      this.wallet.id(),
      txRequestId,
      userSignShare,
      encryptedSignerShare,
      apiVersion,
      vssProof,
      privateShareProof,
      userPublicGpgKey,
      publicShare
    );

    const bitgoToUserRShare = await getBitgoToUserRShare(this.bitgo, this.wallet.id(), txRequestId);
    const userToBitGoGShare = await createUserToBitGoGShare(
      userSignShare,
      bitgoToUserCommitment,
      bitgoToUserRShare,
      userSigningMaterial.backupYShare,
      userSigningMaterial.bitgoYShare,
      signablePayload
    );

    await sendUserToBitgoGShare(this.bitgo, this.wallet.id(), txRequestId, userToBitGoGShare, apiVersion);
    return await getTxRequest(this.bitgo, this.wallet.id(), txRequestId);
  }

  /**
   * Get the commonPub portion of the commonKeychain.
   *
   * @param {String} commonKeychain
   * @returns {string}
   */
  static getPublicKeyFromCommonKeychain(commonKeychain: string): string {
    if (commonKeychain.length !== 128) {
      throw new Error(`Invalid commonKeychain length, expected 128, got ${commonKeychain.length}`);
    }
    const commonPubHexStr = commonKeychain.slice(0, 64);
    return bs58.encode(Buffer.from(commonPubHexStr, 'hex'));
  }
}
/**
 * @deprecated - use EddsaUtils
 */
export const TssUtils = EddsaUtils;
