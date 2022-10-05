import { ECDSA, Ecdsa } from '../../../../account-lib/mpc/tss';
import * as openpgp from 'openpgp';
import { SerializedKeyPair } from 'openpgp';
import { AddKeychainOptions, Keychain, KeyType } from '../../../keychain';
import ECDSAMethods, { ECDSAMethodTypes } from '../../../tss/ecdsa';
import { IBaseCoin, KeychainsTriplet } from '../../../baseCoin';
import baseTSSUtils from '../baseTSSUtils';
import { DecryptableNShare, KeyShare } from './types';
import { RequestType, TSSParams, TxRequest } from '../baseTypes';
import { getTxRequest } from '../../../tss/common';
import { AShare, DShare, SendShareType } from '../../../tss/ecdsa/types';
import { generateGPGKeyPair, getBitgoGpgPubKey } from '../../opengpgUtils';
import { BitGoBase } from '../../../bitgoBase';
import { IWallet } from '../../../wallet';
import assert from 'assert';
import { bip32 } from '@bitgo/utxo-lib';

const encryptNShare = ECDSAMethods.encryptNShare;

/** @inheritdoc */
export class EcdsaUtils extends baseTSSUtils<KeyShare> {
  private bitgoPublicGpgKey: openpgp.Key | undefined = undefined;

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, wallet?: IWallet) {
    super(bitgo, baseCoin, wallet);
    this.setBitgoGpgPubKey(bitgo);
  }

  private async setBitgoGpgPubKey(bitgo) {
    this.bitgoPublicGpgKey = await getBitgoGpgPubKey(bitgo);
  }

  async getBitgoPublicGpgKey(): Promise<openpgp.Key> {
    if (!this.bitgoPublicGpgKey) {
      // retry getting bitgo's gpg key
      await this.setBitgoGpgPubKey(this.bitgo);
      if (!this.bitgoPublicGpgKey) {
        throw new Error("Failed to get Bitgo's gpg key");
      }
    }

    return this.bitgoPublicGpgKey;
  }

  /** @inheritdoc */
  async createKeychains(params: {
    passphrase: string;
    enterprise?: string | undefined;
    originalPasscodeEncryptionCode?: string | undefined;
  }): Promise<KeychainsTriplet> {
    const MPC = new Ecdsa();
    const m = 2;
    const n = 3;

    const userKeyShare = await MPC.keyShare(1, m, n);
    const backupKeyShare = await MPC.keyShare(2, m, n);

    const userGpgKey = await generateGPGKeyPair('secp256k1');

    const bitgoKeychain = await this.createBitgoKeychain(userGpgKey, userKeyShare, backupKeyShare, params.enterprise);
    const userKeychainPromise = this.createParticipantKeychain(
      userGpgKey,
      1,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      params.passphrase,
      params.originalPasscodeEncryptionCode
    );
    const backupKeychainPromise = this.createParticipantKeychain(
      userGpgKey,
      2,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      params.passphrase
    );

    const [userKeychain, backupKeychain] = await Promise.all([userKeychainPromise, backupKeychainPromise]);

    return {
      userKeychain,
      backupKeychain,
      bitgoKeychain,
    };
  }

  createUserKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string,
    originalPasscodeEncryptionCode: string
  ): Promise<Keychain> {
    return this.createParticipantKeychain(
      userGpgKey,
      1,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      passphrase,
      originalPasscodeEncryptionCode
    );
  }

  createBackupKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string
  ): Promise<Keychain> {
    return this.createParticipantKeychain(userGpgKey, 2, userKeyShare, backupKeyShare, bitgoKeychain, passphrase);
  }

  /** @inheritdoc */
  async createBitgoKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    enterprise?: string
  ): Promise<Keychain> {
    const bitgoPublicGpgKey = await this.getBitgoPublicGpgKey();
    const recipientIndex = 3;
    const userToBitgoShare = await encryptNShare(userKeyShare, recipientIndex, bitgoPublicGpgKey.armor());

    const backupToBitgoShare = await encryptNShare(backupKeyShare, recipientIndex, bitgoPublicGpgKey.armor());

    const createBitGoMPCParams: AddKeychainOptions = {
      keyType: 'tss' as KeyType,
      source: 'bitgo',
      keyShares: [
        {
          from: 'user',
          to: 'bitgo',
          publicShare: userToBitgoShare.publicShare,
          privateShare: userToBitgoShare.encryptedPrivateShare,
          n: userToBitgoShare.n,
        },
        {
          from: 'backup',
          to: 'bitgo',
          publicShare: backupToBitgoShare.publicShare,
          privateShare: backupToBitgoShare.encryptedPrivateShare,
          n: backupToBitgoShare.n,
        },
      ],
      userGPGPublicKey: userGpgKey.publicKey,
      backupGPGPublicKey: userGpgKey.publicKey,
      enterprise: enterprise,
    };

    const keychains = await this.baseCoin.keychains().add(createBitGoMPCParams);
    return keychains;
  }

  /** @inheritdoc */
  async createParticipantKeychain(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    recipientIndex: number,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string,
    originalPasscodeEncryptionCode?: string
  ): Promise<Keychain> {
    const bitgoKeyShares = bitgoKeychain.keyShares;
    if (!bitgoKeyShares) {
      throw new Error('Missing BitGo key shares');
    }
    if (!bitgoKeychain.commonKeychain) {
      throw new Error(`Missing common key chain: ${bitgoKeychain.commonKeychain}`);
    }

    let user: string;
    let keyShare: KeyShare;
    let otherShare: KeyShare;
    if (recipientIndex === 1) {
      keyShare = userKeyShare;
      otherShare = backupKeyShare;
      user = 'user';
    } else if (recipientIndex === 2) {
      keyShare = backupKeyShare;
      otherShare = userKeyShare;
      user = 'backup';
    } else {
      throw new Error('Invalid user index');
    }

    const bitGoToUserShare = bitgoKeyShares.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === user);
    if (!bitGoToUserShare) {
      throw new Error('Missing BitGo to User key share');
    }

    const bitgoPublicGpgKey = await this.getBitgoPublicGpgKey();

    const backupToUserShare = await encryptNShare(otherShare, recipientIndex, userGpgKey.publicKey);
    const encryptedNShares: DecryptableNShare[] = [
      {
        nShare: backupToUserShare,
        recipientPrivateArmor: userGpgKey.privateKey,
        senderPublicArmor: userGpgKey.publicKey,
      },
      {
        nShare: {
          i: recipientIndex,
          j: 3,
          publicShare: bitGoToUserShare.publicShare,
          encryptedPrivateShare: bitGoToUserShare.privateShare,
          n: bitGoToUserShare.n!,
        },
        recipientPrivateArmor: userGpgKey.privateKey,
        senderPublicArmor: bitgoPublicGpgKey.armor(),
        isbs58Encoded: false,
      },
    ];

    const userCombinedKey = await ECDSAMethods.createCombinedKey(
      keyShare,
      encryptedNShares,
      bitgoKeychain.commonKeychain
    );

    const prv = JSON.stringify(userCombinedKey.signingMaterial);
    const userKeychainParams = {
      source: user,
      keyType: 'tss' as KeyType,
      commonKeychain: bitgoKeychain.commonKeychain,
      prv: prv,
      encryptedPrv: this.bitgo.encrypt({
        input: prv,
        password: passphrase,
      }),
      originalPasscodeEncryptionCode,
    };

    const keychains = this.baseCoin.keychains();
    const result =
      recipientIndex === 1 ? await keychains.add(userKeychainParams) : await keychains.createBackup(userKeychainParams);
    return result;
  }

  /**
   * Gets signing key, txRequestResolved and txRequestId
   * @param {string | TxRequest} params.txRequest - transaction request object or id
   * @param {string} params.prv - decrypted private key
   * @param { string} params.reqId - request id
   * @returns {Promise<ECDSASigningRequestBaseResult>}
   */
  private async signRequestBase(params: TSSParams, requestType: RequestType): Promise<TxRequest> {
    let txRequestResolved: TxRequest;
    let txRequestId: string;

    const { txRequest, prv } = params;

    if (typeof txRequest === 'string') {
      txRequestResolved = await getTxRequest(this.bitgo, this.wallet.id(), txRequest);
      txRequestId = txRequestResolved.txRequestId;
    } else {
      txRequestResolved = txRequest;
      txRequestId = txRequest.txRequestId;
    }

    const userSigningMaterial: ECDSAMethodTypes.SigningMaterial = JSON.parse(prv);
    if (userSigningMaterial.pShare.i !== 1) {
      throw new Error('Invalid user key');
    }
    if (!userSigningMaterial.backupNShare) {
      throw new Error('Invalid user key - missing backupNShare');
    }

    const MPC = new Ecdsa();
    const signingKey = MPC.keyCombine(userSigningMaterial.pShare, [
      userSigningMaterial.bitgoNShare,
      userSigningMaterial.backupNShare,
    ]);

    const userSignShare = await ECDSAMethods.createUserSignShare(signingKey.xShare, signingKey.yShares[3]);
    let u = userSigningMaterial.bitgoNShare.u;
    while (u.length < 64) {
      u = '0' + u;
    }

    let chaincode = userSigningMaterial.bitgoNShare.chaincode;
    while (chaincode.length < 64) {
      chaincode = '0' + chaincode;
    }
    const signerShare = bip32.fromPrivateKey(Buffer.from(u, 'hex'), Buffer.from(chaincode, 'hex')).toBase58();
    const bitgoGpgKey = await getBitgoGpgPubKey(this.bitgo);
    const encryptedSignerShare = (await openpgp.encrypt({
      message: await openpgp.createMessage({
        text: signerShare,
      }),
      config: {
        rejectCurves: new Set(),
      },
      encryptionKeys: [bitgoGpgKey],
    })) as string;

    const bitgoToUserAShare = (await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequestId,
      requestType,
      SendShareType.KShare,
      userSignShare.kShare,
      encryptedSignerShare
    )) as AShare;

    const userGammaAndMuShares = await ECDSAMethods.createUserGammaAndMuShare(userSignShare.wShare, bitgoToUserAShare);
    const userOmicronAndDeltaShare = await ECDSAMethods.createUserOmicronAndDeltaShare(
      userGammaAndMuShares.gShare as ECDSA.GShare
    );

    const muShare = userGammaAndMuShares.muShare!;
    const dShare = userOmicronAndDeltaShare.dShare;
    const bitgoToUserDShare = (await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequestId,
      requestType,
      SendShareType.MUShare,
      { muShare, dShare, i: muShare.i }
    )) as DShare;

    let signablePayload;

    if (requestType === RequestType.tx) {
      signablePayload = Buffer.from(txRequestResolved.transactions[0].unsignedTx.signableHex, 'hex');
    } else if (requestType === RequestType.message) {
      assert(txRequestResolved.unsignedMessages?.[0]);
      signablePayload = Buffer.from(txRequestResolved.unsignedMessages[0].message, 'hex');
    }

    const userSShare = await ECDSAMethods.createUserSignatureShare(
      userOmicronAndDeltaShare.oShare,
      bitgoToUserDShare,
      signablePayload
    );

    await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequestId,
      requestType,
      SendShareType.SShare,
      userSShare
    );
    return await getTxRequest(this.bitgo, this.wallet.id(), txRequestId);
  }

  /**
   * Signs the transaction associated to the transaction request.
   * @param {string | TxRequest} params.txRequest - transaction request object or id
   * @param {string} params.prv - decrypted private key
   * @param {string} params.reqId - request id
   * @returns {Promise<TxRequest>} fully signed TxRequest object
   */
  async signTxRequest(params: TSSParams): Promise<TxRequest> {
    return this.signRequestBase(params, RequestType.tx);
  }

  /**
   * Signs the message associated to the transaction request.
   * @param {string | TxRequest} params.txRequest - transaction request object or id
   * @param {string} params.prv - decrypted private key
   * @param {string} params.reqId - request id
   * @returns {Promise<TxRequest>} fully signed TxRequest object
   */
  async signTxRequestForMessage(params: TSSParams): Promise<TxRequest> {
    return this.signRequestBase(params, RequestType.message);
  }
}
