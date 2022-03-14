/**
 * @prettier
 */

import * as bs58 from 'bs58';
import * as crypto from 'crypto';
import * as openpgp from 'openpgp';
import Eddsa, {
  KeyShare,
  JShare,
  SignShare,
  PShare,
  XShare,
  RShare,
  GShare,
} from '@bitgo/account-lib/dist/src/mpc/tss';

import { BaseCoin, KeychainsTriplet } from '../baseCoin';
import { Keychain } from '../keychains';
import { BitGo } from '../../bitgo';
import { MpcUtils } from './mpcUtils';
import { Memo, Wallet } from '..';
import { RequestTracer } from '../internal/util';
import _ = require('lodash');

// #region Interfaces
interface PrebuildTransactionWithIntentOptions {
  reqId: RequestTracer;
  intentType: string;
  sequenceId?: string;
  recipients: {
    address: string;
    amount: string | number;
  }[];
  comment?: string;
  memo?: Memo;
  token?: string;
}

enum ShareKeyPosition {
  USER = '1',
  BACKUP = '2',
  BITGO = '3',
}

// complete with more props if neccesary
export interface TxRequest {
  txRequestId: string;
  unsignedTxs: {
    serializedTxHex: string;
    signableHex: string;
    feeInfo?: {
      fee: number;
      feeString: string;
    };
  }[];
  signatureShares?: SignatureShareRecord[];
}

export enum SignatureShareType {
  USER = 'user',
  BACKUP = 'backup',
  BITGO = 'bitgo',
}

export interface SignatureShareRecord {
  from: SignatureShareType;
  to: SignatureShareType;
  share: string;
}
// #endregion

/**
 * Utility functions for TSS work flows.
 */

export class TssUtils extends MpcUtils {
  private _wallet?: Wallet;

  constructor(bitgo: BitGo, baseCoin: BaseCoin, wallet?: Wallet) {
    super(bitgo, baseCoin);
    this._wallet = wallet;
  }

  private get wallet(): Wallet {
    if (_.isNil(this._wallet)) {
      throw new Error('Wallet not defined');
    }
    return this._wallet;
  }

  /**
   * Creates a Keychain containing the User's TSS signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - user's TSS key share
   * @param backupKeyShare - backup's TSS key share
   * @param bitgoKeychain - previously created BitGo keychain; must be compatible with user and backup key shares
   * @param passphrase - wallet passphrase used to encrypt user's signing materials
   */
  async createUserKeychain(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string,
    originalPasscodeEncryptionCode?: string
  ): Promise<Keychain> {
    const MPC = await Eddsa();
    const bitgoKeyShares = bitgoKeychain.keyShares;
    if (!bitgoKeyShares) {
      throw new Error('Missing BitGo key shares');
    }

    const bitGoToUserShare = bitgoKeyShares.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'user');
    if (!bitGoToUserShare) {
      throw new Error('Missing BitGo to User key share');
    }

    const bitGoToUserPrivateShare = await this.decryptPrivateShare(bitGoToUserShare.privateShare, userGpgKey);

    const bitgoToUser = {
      i: '1',
      j: '3',
      y: Buffer.from(bs58.decode(bitGoToUserShare.publicShare)).toString('hex'),
      u: bitGoToUserPrivateShare,
    };

    const userCombined = MPC.keyCombine(userKeyShare.uShare, [backupKeyShare.yShares[1], bitgoToUser]);
    const commonPub = bs58.encode(Buffer.from(userCombined.pShare.y, 'hex'));
    if (commonPub !== bitgoKeychain.commonPub) {
      throw new Error('Failed to create user keychain - commonPubs do not match.');
    }

    const userKeychainParams: any = {
      source: 'user',
      type: 'tss',
      commonPub: bs58.encode(Buffer.from(userCombined.pShare.y, 'hex')),
      encryptedPrv: this.bitgo.encrypt({ input: JSON.stringify(userCombined.pShare), password: passphrase }),
    };

    if (this.baseCoin.supportsDerivationKeypair()) {
      const addressDerivationKeypair = this.baseCoin.keychains().create();
      if (!addressDerivationKeypair.pub) {
        throw new Error('Expected address derivation keypair to contain a public key.');
      }

      const encryptedPrv = this.bitgo.encrypt({ password: passphrase, input: addressDerivationKeypair.prv });
      userKeychainParams.addressDerivationKeypair = {
        pub: addressDerivationKeypair.pub,
        encryptedPrv: encryptedPrv,
        originalPasscodeEncryptionCode: originalPasscodeEncryptionCode,
      };
    }

    return await this.baseCoin.keychains().add(userKeychainParams);
  }

  /**
   * Creates a Keychain containing the Backup party's TSS signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - User's TSS Keyshare
   * @param backupKeyShare - Backup's TSS Keyshare
   * @param bitgoKeychain - previously created BitGo keychain; must be compatible with user and backup key shares
   * @param passphrase - wallet passphrase used to encrypt user's signing materials
   */
  async createBackupKeychain(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string
  ): Promise<Keychain> {
    const MPC = await Eddsa();
    const bitgoKeyShares = bitgoKeychain.keyShares;
    if (!bitgoKeyShares) {
      throw new Error('Invalid bitgo keyshares');
    }

    const bitGoToBackupShare = bitgoKeyShares.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'backup');
    if (!bitGoToBackupShare) {
      throw new Error('Missing BitGo to User key share');
    }

    const bitGoToBackupPrivateShare = await this.decryptPrivateShare(bitGoToBackupShare.privateShare, userGpgKey);

    const bitgoToBackup = {
      i: '2',
      j: '3',
      y: Buffer.from(bs58.decode(bitGoToBackupShare.publicShare)).toString('hex'),
      u: bitGoToBackupPrivateShare,
    };

    const backupCombined = MPC.keyCombine(backupKeyShare.uShare, [userKeyShare.yShares[2], bitgoToBackup]);
    const commonPub = bs58.encode(Buffer.from(backupCombined.pShare.y, 'hex'));
    if (commonPub !== bitgoKeychain.commonPub) {
      throw new Error('Failed to create backup keychain - commonPubs do not match.');
    }

    const prv = JSON.stringify(backupCombined.pShare);

    return await this.baseCoin.keychains().createBackup({
      source: 'backup',
      type: 'tss',
      commonPub,
      prv: prv,
      encryptedPrv: this.bitgo.encrypt({ input: prv, password: passphrase }),
    });
  }

  /**
   * Creates a Keychain containing BitGo's TSS signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - user's TSS key share
   * @param backupKeyShare - backup's TSS key share
   */
  async createBitgoKeychain(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    enterprise?: string
  ): Promise<Keychain> {
    const userToBitgoPublicShare = bs58.encode(Buffer.from(userKeyShare.yShares[3].y, 'hex'));
    const userToBitgoPrivateShare = Buffer.concat([
      Buffer.from(userKeyShare.yShares[3].u, 'hex'),
      Buffer.alloc(32),
    ]).toString('hex');
    const userToBitgoKeyShare = {
      publicShare: userToBitgoPublicShare,
      privateShare: userToBitgoPrivateShare,
    };

    const backupToBitgoPublicShare = bs58.encode(Buffer.from(backupKeyShare.yShares[3].y, 'hex'));
    const backupToBitgoPrivateShare = Buffer.concat([
      Buffer.from(backupKeyShare.yShares[3].u, 'hex'),
      Buffer.alloc(32),
    ]).toString('hex');
    const backupToBitgoKeyShare = {
      publicShare: backupToBitgoPublicShare,
      privateShare: backupToBitgoPrivateShare,
    };

    return await this.createBitgoKeychainInWP(
      userGpgKey,
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
    passphrase: string;
    enterprise?: string;
    originalPasscodeEncryptionCode?: string;
  }): Promise<KeychainsTriplet> {
    const MPC = await Eddsa();
    const m = 2;
    const n = 3;

    const userKeyShare = MPC.keyShare(1, m, n);
    const backupKeyShare = MPC.keyShare(2, m, n);

    const randomHexString = crypto.randomBytes(12).toString('hex');

    const userGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: randomHexString,
          email: `${randomHexString}@${randomHexString}.com`,
        },
      ],
    });

    const bitgoKeychain = await this.createBitgoKeychain(userGpgKey, userKeyShare, backupKeyShare, params.enterprise);
    const userKeychainPromise = this.createUserKeychain(
      userGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      params.passphrase,
      params.originalPasscodeEncryptionCode
    );
    const backupKeychainPromise = this.createBackupKeychain(
      userGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      params.passphrase
    );
    const [userKeychain, backupKeychain] = await Promise.all([userKeychainPromise, backupKeychainPromise]);

    // create wallet
    const keychains = {
      userKeychain,
      backupKeychain,
      bitgoKeychain,
    };

    return keychains;
  }

  /**
   * Signs the transaction associated to the transaction request.
   *
   * @param txRequest - transaction request object or id
   * @param prv - decrypted private key
   * @param reqId - request id
   * @returns {Promise<TxRequest>} fully signed TxRequest object
   */
  async signTxRequest(txRequest: string | TxRequest, prv: string, reqId: RequestTracer): Promise<TxRequest> {
    let txRequestResolved: TxRequest;
    let txRequestId: string;

    if (typeof txRequest === 'string') {
      txRequestResolved = await this.getTxRequest(txRequest);
      txRequestId = txRequestResolved.txRequestId;
    } else {
      txRequestResolved = txRequest;
      txRequestId = txRequest.txRequestId;
    }

    const signablePayload = Buffer.from(txRequestResolved.unsignedTxs[0].signableHex, 'hex');

    const userSignShare = await this.createUserSignShare(signablePayload, prv);

    await this.offerUserToBitgoRShare(txRequestId, userSignShare);

    const bitgoToUserRShare = await this.getBitgoToUserRShare(txRequestId);

    const userToBitGoGShare = await this.createUserToBitGoGShare(userSignShare, bitgoToUserRShare, signablePayload);

    await this.sendUserToBitgoGShare(txRequestId, userToBitGoGShare);

    return await this.getTxRequest(txRequestId);
  }

  /**
   * Builds a tx request from params and verify it
   *
   * @param {PrebuildTransactionWithIntentOptions} params - parameters to build the tx
   * @returns {Promise<TxRequest>} - a built tx request
   */
  async prebuildTxWithIntent(params: PrebuildTransactionWithIntentOptions): Promise<TxRequest> {
    const chain = this.baseCoin.getChain();
    const intentRecipients = params.recipients.map((recipient) => ({
      address: { address: recipient.address },
      amount: { value: `${recipient.amount}`, asset: chain },
    }));

    const whitelistedParams = {
      intent: {
        intentType: params.intentType,
        sequenceId: params.sequenceId,
        comment: params.comment,
        recipients: intentRecipients,
        memo: params.memo?.value,
        token: params.token,
      },
    };

    const unsignedTx = (await this.bitgo
      .post(this.bitgo.url('/wallet/' + this.wallet.id() + '/txrequests', 2))
      .send(whitelistedParams)
      .result()) as TxRequest;

    return unsignedTx;
  }

  /**
   * Creates the User Sign Share containing the User XShare and the User to Bitgo RShare
   *
   * @param {Buffer} signablePayload - the signablePayload as a buffer
   * @param {String} userPShare - User PShare as a JSON stringified
   * @returns {Promise<SignShare>} - User Sign Share
   */
  async createUserSignShare(signablePayload: Buffer, userPShare: string): Promise<SignShare> {
    const pShare: PShare = JSON.parse(userPShare);
    if (pShare.i !== ShareKeyPosition.USER) {
      throw new Error('Invalid PShare, PShare doesnt belong to the User');
    }
    const jShare: JShare = { i: ShareKeyPosition.BITGO, j: ShareKeyPosition.USER };
    const MPC = await Eddsa();
    return MPC.signShare(signablePayload, pShare, [jShare]);
  }

  /**
   * Sends a Signature Share
   *
   * @param {String} txRequestId - the txRequest Id
   * @param {SignatureShareRecord} signatureShare - a Signature Share
   * @returns {Promise<SignatureShareRecord>} - a Signature Share
   */
  async sendSignatureShare(txRequestId: string, signatureShare: SignatureShareRecord): Promise<SignatureShareRecord> {
    return this.bitgo
      .post(this.bitgo.url('/wallet/' + this.wallet.id() + '/txrequests/' + txRequestId + '/signatureshares', 2))
      .send(signatureShare)
      .result();
  }

  /**
   * Sends the User to Bitgo RShare to Bitgo
   *
   * @param {String} txRequestId - the txRequest Id
   * @param {SignShare} userSignShare - the user Sign Share
   * @returns {Promise<void>}
   */
  async offerUserToBitgoRShare(txRequestId: string, userSignShare: SignShare): Promise<void> {
    const rShare: RShare = userSignShare.rShares[ShareKeyPosition.BITGO];
    if (_.isNil(rShare)) {
      throw new Error('userToBitgo RShare not found');
    }
    if (rShare.i !== ShareKeyPosition.BITGO || rShare.j !== ShareKeyPosition.USER) {
      throw new Error('Invalid RShare, is not from User to Bitgo');
    }
    const signatureShare: SignatureShareRecord = {
      from: SignatureShareType.USER,
      to: SignatureShareType.BITGO,
      share: rShare.r + rShare.R,
    };
    await this.sendSignatureShare(txRequestId, signatureShare);
  }

  /**
   * Gets the Bitgo to User RShare from Bitgo
   *
   * @param {String} txRequestId - the txRequest Id
   * @returns {Promise<SignatureShareRecord>} - a Signature Share
   */
  async getBitgoToUserRShare(txRequestId: string): Promise<SignatureShareRecord> {
    const txRequest = await this.getTxRequest(txRequestId);
    const signatureShares = txRequest.signatureShares;
    if (_.isNil(signatureShares) || _.isEmpty(signatureShares)) {
      throw new Error(`No signatures shares found for id: ${txRequestId}`);
    }

    // at this point we expect the only share to be the RShare
    const bitgoToUserRShare = signatureShares.find(
      (sigShare) => sigShare.from === SignatureShareType.BITGO && sigShare.to === SignatureShareType.USER
    );
    if (_.isNil(bitgoToUserRShare)) {
      throw new Error(`Bitgo to User RShare not found for id: ${txRequestId}`);
    }
    return bitgoToUserRShare;
  }

  /**
   * Gets the latest Tx Request by id
   *
   * @param {String} txRequestId - the txRequest Id
   * @returns {Promise<TxRequest>}
   */
  async getTxRequest(txRequestId: string): Promise<TxRequest> {
    const txRequestRes: { txRequests: TxRequest[] } = await this.bitgo
      .get(this.bitgo.url('/wallet/' + this.wallet.id() + '/txrequests', 2))
      .query({ txRequestIds: txRequestId, latest: 'true' })
      .result();

    if (txRequestRes.txRequests.length <= 0) {
      throw new Error(`Unable to find TxRequest with id ${txRequestId}`);
    }

    return txRequestRes.txRequests[0];
  }

  /**
   * Call delete signature shares for a txRequest, the endpoint delete the signatures and return them
   *
   * @param {string} txRequestId tx id reference to delete signature shares
   * @returns {SignatureShareRecord[]}
   */
  async deleteSignatureShares(txRequestId: string): Promise<SignatureShareRecord[]> {
    return this.bitgo
      .del(this.bitgo.url(`/wallet/${this.wallet.id()}/txrequests/${txRequestId}/signatureshares`, 2))
      .send()
      .result();
  }

  /**
   * Creates the User to Bitgo GShare
   *
   * @param {SignShare} userSignShare - the User Sign Share
   * @param {SignatureShareRecord} bitgoToUserRShare - the Bitgo to User RShare
   * @param {Buffer} signablePayload - the signable payload from a tx
   * @returns {Promise<GShare>} - the User to Bitgo GShare
   */
  async createUserToBitGoGShare(
    userSignShare: SignShare,
    bitgoToUserRShare: SignatureShareRecord,
    signablePayload: Buffer
  ): Promise<GShare> {
    if (userSignShare.xShare.i !== ShareKeyPosition.USER) {
      throw new Error('Invalid XShare, doesnt belong to the User');
    }
    if (bitgoToUserRShare.from !== SignatureShareType.BITGO || bitgoToUserRShare.to !== SignatureShareType.USER) {
      throw new Error('Invalid RShare, is not from Bitgo to User');
    }

    const userXShare: XShare = userSignShare.xShare;
    const RShare: RShare = {
      i: ShareKeyPosition.USER,
      j: ShareKeyPosition.BITGO,
      r: bitgoToUserRShare.share.substring(0, 64),
      R: bitgoToUserRShare.share.substring(64, 128),
    };
    const MPC = await Eddsa();
    return MPC.sign(signablePayload, userXShare, [RShare]);
  }

  /**
   * Sends the User to Bitgo GShare to Bitgo
   *
   * @param {String} txRequestId - the txRequest Id
   * @param {GShare} userToBitgoGShare - the User to Bitgo GShare
   * @returns {Promise<void>}
   */
  async sendUserToBitgoGShare(txRequestId: string, userToBitgoGShare: GShare): Promise<void> {
    if (userToBitgoGShare.i !== ShareKeyPosition.USER) {
      throw new Error('Invalid GShare, doesnt belong to the User');
    }
    const signatureShare: SignatureShareRecord = {
      from: SignatureShareType.USER,
      to: SignatureShareType.BITGO,
      share: userToBitgoGShare.R + userToBitgoGShare.gamma,
    };

    await this.sendSignatureShare(txRequestId, signatureShare);
  }

  /**
   * Initialize the send procedure once Bitgo has the User To Bitgo GShare
   *
   * @param {String} txRequestId - the txRequest Id
   * @returns {Promise<any>}
   */
  async sendTxRequest(txRequestId: string): Promise<any> {
    return this.bitgo
      .post(this.baseCoin.url('/wallet/' + this.wallet.id() + '/tx/send'))
      .send({ txRequestId })
      .result();
  }

  /**
   * Delete signature shares, get the tx request without them from the db and sign it to finally send it.
   *
   * Note : This can be performed in order to reach latest network conditions required on pending approval flow.
   *
   * @param {String} txRequestId - the txRequest Id to make the requests.
   * @param {String} decryptedPrv - decrypted prv to sign the tx request.
   * @param {RequestTracer} reqId id tracer.
   * @returns {Promise<any>}
   */
  async recreateTxRequest(txRequestId: string, decryptedPrv: string, reqId: RequestTracer): Promise<TxRequest> {
    await this.deleteSignatureShares(txRequestId);
    // after delete signatures shares get the tx without them
    const txRequest = await this.getTxRequest(txRequestId);
    return await this.signTxRequest(txRequest, decryptedPrv, reqId);
  }
}
