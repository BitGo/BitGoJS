import { ECDSA, Ecdsa } from '../../../../account-lib/mpc/tss';
import { SerializedKeyPair } from 'openpgp';
import { AddKeychainOptions, Keychain, KeyType } from '../../../keychain';
import ECDSAMethods, { ECDSAMethodTypes } from '../../../tss/ecdsa';
import * as openpgp from 'openpgp';
import { IBaseCoin, KeychainsTriplet } from '../../../baseCoin';
import * as crypto from 'crypto';
import baseTSSUtils from '../baseTSSUtils';
import { DecryptableNShare, KeyShare } from './types';
import { TxRequest } from '../baseTypes';
import { IRequestTracer } from '../../../../api';
import { getTxRequest } from '../../../tss/common';
import { AShare, DShare, SendShareType } from '../../../tss/ecdsa/types';
import { getBitgoGpgPubKey } from '../../opengpgUtils';
import { BitGoBase } from '../../../bitgoBase';
import { IWallet } from '../../../wallet';

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

    return this.bitgoPublicGpgKey!;
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

    const randomHexString = crypto.randomBytes(12).toString('hex');
    openpgp.config.rejectCurves = new Set();

    const userGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: randomHexString,
          email: `user-${randomHexString}@${randomHexString}.com`,
        },
      ],
      curve: 'secp256k1',
    });

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
    const userToBitgoShare = await encryptNShare(
      userKeyShare,
      recipientIndex,
      bitgoPublicGpgKey.armor(),
      userGpgKey.privateKey
    );

    const backupToBitgoShare = await encryptNShare(
      backupKeyShare,
      recipientIndex,
      bitgoPublicGpgKey.armor(),
      userGpgKey.privateKey
    );

    const createBitGoMPCParams: AddKeychainOptions = {
      keyType: 'tss' as KeyType,
      source: 'bitgo',
      keyShares: [
        {
          from: 'user',
          to: 'bitgo',
          publicShare: userToBitgoShare.publicShare,
          privateShare: userToBitgoShare.encryptedPrivateShare,
        },
        {
          from: 'backup',
          to: 'bitgo',
          publicShare: backupToBitgoShare.publicShare,
          privateShare: backupToBitgoShare.encryptedPrivateShare,
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

    const backupToUserShare = await encryptNShare(
      otherShare,
      recipientIndex,
      userGpgKey.publicKey,
      userGpgKey.privateKey
    );
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
        },
        recipientPrivateArmor: userGpgKey.privateKey,
        senderPublicArmor: bitgoPublicGpgKey.armor(),
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
   * Signs the transaction associated to the transaction request.
   * @param {string | TxRequest} params.txRequest - transaction request object or id
   * @param {string} params.prv - decrypted private key
   * @param { string} params.reqId - request id
   * @returns {Promise<TxRequest>} fully signed TxRequest object
   */
  async signTxRequest(params: {
    txRequest: string | TxRequest;
    prv: string;
    reqId: IRequestTracer;
  }): Promise<TxRequest> {
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

    const bitgoToUserAShare = (await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequestId,
      SendShareType.KShare,
      userSignShare.kShare
    )) as AShare;

    const userGammaAndMuShares = await ECDSAMethods.createUserGammaAndMuShare(userSignShare.wShare, bitgoToUserAShare);

    const bitgoToUserDShare = (await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequestId,
      SendShareType.MUShare,
      userGammaAndMuShares.muShare as ECDSA.MUShare
    )) as DShare;

    const userOmicronAndDeltaShare = await ECDSAMethods.createUserOmicronAndDeltaShare(
      userGammaAndMuShares.gShare as ECDSA.GShare
    );

    console.log(`********* txRequestResolved: ${JSON.stringify(txRequestResolved)}`);

    const signablePayload = Buffer.from(txRequestResolved.transactions[0].unsignedTx.signableHex, 'hex');

    const userSShare = await ECDSAMethods.createUserSignatureShare(
      userOmicronAndDeltaShare.oShare,
      bitgoToUserDShare,
      signablePayload
    );

    await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequestId,
      SendShareType.SShare,
      userSShare,
      userOmicronAndDeltaShare.dShare
    );
    return await getTxRequest(this.bitgo, this.wallet.id(), txRequestId);
  }
}
