import assert from 'assert';
import openpgp from 'openpgp';

import { NonEmptyString } from 'io-ts-types';
import { Buffer } from 'buffer';
import { MPCv2KeyGenStateEnum, MPCv2PartyFromStringOrNumber } from '@bitgo/public-types';
import { DklsTypes, MPSUtil, MPSTypes, MPSComms, MPSDkg, MPSDsg } from '@bitgo/sdk-lib-mpc';
import createKeccakHash from 'keccak';

import { KeychainsTriplet } from '../../../baseCoin';
import { AddKeychainOptions, Keychain, KeyType } from '../../../keychain';
import { MPCv2PartiesEnum } from '../ecdsa/typesMPCv2';
import { generateGPGKeyPair } from '../../opengpgUtils';
import { envRequiresBitgoPubGpgKeyConfig, isBitgoMpcPubKey } from '../../../tss/bitgoPubKeys';

import { EDDSAMPCv2KeyGenSenderForEnterprise } from './eddsaMPCv2KeyGenSender';
import { Hash } from 'crypto';
import { sendTxRequest, sendSignatureShareV2 } from '../../../tss/common';
import { RequestType, TSSParamsForMessageWithPrv, TSSParamsWithPrv, TxRequest } from '../baseTypes';
import { BaseEddsaUtils } from './base';
import { MPCv2SignatureShareRound1Output } from './types';
import {
  getSignatureShareRoundOne,
  verifyBitGoMessagesAndSignaturesRoundOne,
  getSignatureShareRoundTwo,
} from '../../../tss/eddsa/eddsaMPCv2';
import { IRequestTracer } from 'modules/sdk-core/src/api';

export class EddsaMPCv2Utils extends BaseEddsaUtils {
  async createKeychains(params: {
    passphrase: string;
    enterprise: string;
    originalPasscodeEncryptionCode?: string;
  }): Promise<KeychainsTriplet> {
    const { userSession, backupSession } = this.getUserAndBackupSession(3, 2);
    const [userGpgKey, backupGpgKey] = await Promise.all([
      generateGPGKeyPair('secp256k1'),
      generateGPGKeyPair('secp256k1'),
    ]);

    const bitgoPublicGpgKey = (
      (await this.getBitgoGpgPubkeyBasedOnFeatureFlags(params.enterprise, true)) ?? this.bitgoMPCv2PublicGpgKey
    ).armor();

    if (envRequiresBitgoPubGpgKeyConfig(this.bitgo.getEnv())) {
      // Ensure the public key is one of the expected BitGo public keys when in test or prod.
      assert(isBitgoMpcPubKey(bitgoPublicGpgKey, 'mpcv2'), 'Invalid BitGo GPG public key');
    }

    const userGpgPrvKey: DklsTypes.PartyGpgKey = {
      partyId: MPCv2PartiesEnum.USER,
      gpgKey: userGpgKey.privateKey,
    };
    const backupGpgPrvKey: DklsTypes.PartyGpgKey = {
      partyId: MPCv2PartiesEnum.BACKUP,
      gpgKey: backupGpgKey.privateKey,
    };
    const bitgoGpgPubKey: DklsTypes.PartyGpgKey = {
      partyId: MPCv2PartiesEnum.BITGO,
      gpgKey: bitgoPublicGpgKey,
    };

    // #region round 1

    const userPubKey = await userSession.getPublicKey();
    const backupPubKey = await backupSession.getPublicKey();

    const { sessionKeys, sessionId } = await this.sendKeyGenerationRound1(
      params.enterprise,
      userGpgKey.publicKey,
      backupGpgKey.publicKey,
      Buffer.from(userPubKey).toString('base64'),
      Buffer.from(backupPubKey).toString('base64')
    );
    // #endregion

    // #region round 2
    const bitgoPubKey = sessionKeys.bitgo;

    const publicKeys = await Promise.all([userPubKey, backupPubKey, bitgoPubKey]);
    const publicKeyConcat = MPSUtil.concatBytes(publicKeys);

    await userSession.initDkg(publicKeyConcat);
    await backupSession.initDkg(publicKeyConcat);

    const userRound1Msg = userSession.getFirstMessage();
    const backupRound1Msg = backupSession.getFirstMessage();

    const serializedMessagesRound1 = MPSUtil.serializeMessages([userRound1Msg, backupRound1Msg]);

    const round2EncryptedMsg = await MPSComms.encryptAndAuthOutgoingMessages(serializedMessagesRound1, [
      userGpgPrvKey,
      backupGpgPrvKey,
    ]);

    const { sessionId: sessionIdRound2, r2_messages } = await this.sendKeyGenerationRound2(
      params.enterprise,
      sessionId,
      round2EncryptedMsg
    );
    // #endregion

    // #region round 2 response handling
    assert.equal(sessionId, sessionIdRound2, 'Round 1 and 2 Session IDs do not match');

    const decryptedRound2Msgs = await MPSComms.decryptAndVerifyIncomingMessages(r2_messages, [bitgoGpgPubKey]);

    const serializedBitgoRound1Msg = decryptedRound2Msgs.find((m) => m.from === MPCv2PartiesEnum.BITGO);
    assert(serializedBitgoRound1Msg, 'BitGo Round 1 message not found');

    const bitgoRound1Msg = MPSUtil.deserializeMessages([serializedBitgoRound1Msg])[0];

    const round1Messages = [userRound1Msg, backupRound1Msg, bitgoRound1Msg];

    const userRound2Msg = userSession.handleIncomingMessages(round1Messages);
    const backupRound2Msg = backupSession.handleIncomingMessages(round1Messages);

    const serializedMessagesRound2 = MPSUtil.serializeMessages([...userRound2Msg, ...backupRound2Msg]);

    const round3EncryptedMsg = await MPSComms.encryptAndAuthOutgoingMessages(serializedMessagesRound2, [
      userGpgPrvKey,
      backupGpgPrvKey,
    ]);

    const {
      sessionId: sessionIdRound3,
      r3_messages,
      bitgoCommonKeychain,
    } = await this.sendKeyGenerationRound3(params.enterprise, sessionId, round3EncryptedMsg);
    // #endregion

    // #region keychain creation
    assert.equal(sessionId, sessionIdRound3, 'Round 1 and 3 Session IDs do not match');

    const decryptedRound3Msgs = await MPSComms.decryptAndVerifyIncomingMessages(r3_messages, [bitgoGpgPubKey]);

    const serializedBitgoRound2Msg = decryptedRound3Msgs.find((m) => m.from === MPCv2PartiesEnum.BITGO);
    assert(serializedBitgoRound2Msg, 'BitGo Round 2 message not found');

    const bitgoRound2Msg = MPSUtil.deserializeMessages([serializedBitgoRound2Msg]);

    const r2Messages = [...userRound2Msg, ...backupRound2Msg, ...bitgoRound2Msg];

    // handle round 2 messages
    userSession.handleIncomingMessages(r2Messages);
    backupSession.handleIncomingMessages(r2Messages);

    // Get key shares
    const userPrivateMaterial = userSession.getKeyShare();
    const backupPrivateMaterial = backupSession.getKeyShare();

    const userCommonKeychain = DklsTypes.getCommonKeychain(userPrivateMaterial);
    const backupCommonKeychain = DklsTypes.getCommonKeychain(backupPrivateMaterial);

    assert.equal(bitgoCommonKeychain, userCommonKeychain, 'User and Bitgo Common keychains do not match');
    assert.equal(bitgoCommonKeychain, backupCommonKeychain, 'Backup and Bitgo Common keychains do not match');

    const userKeychainPromise = this.addUserKeychain(
      bitgoCommonKeychain,
      userPrivateMaterial,
      params.passphrase,
      params.originalPasscodeEncryptionCode
    );
    const backupKeychainPromise = this.addBackupKeychain(
      bitgoCommonKeychain,
      backupPrivateMaterial,
      params.passphrase,
      params.originalPasscodeEncryptionCode
    );
    const bitgoKeychainPromise = this.addBitgoKeychain(bitgoCommonKeychain);

    const [userKeychain, backupKeychain, bitgoKeychain] = await Promise.all([
      userKeychainPromise,
      backupKeychainPromise,
      bitgoKeychainPromise,
    ]);
    // #endregion

    return {
      userKeychain,
      backupKeychain,
      bitgoKeychain,
    };
  }

  private getUserAndBackupSession(totalParties: number, threshold: number) {
    const userSession = new MPSDkg.DKG(threshold, totalParties, MPCv2PartiesEnum.USER);
    const backupSession = new MPSDkg.DKG(threshold, totalParties, MPCv2PartiesEnum.BACKUP);
    return {
      userSession,
      backupSession,
    };
  }

  private validateRoundPayload(sessionId: string, payload: MPSTypes.AuthEncMessage[]): void {
    assert(NonEmptyString.is(sessionId), 'Session ID is required');
    const userMsg = payload.find((m) => m.from === MPCv2PartiesEnum.USER);
    const backupMsg = payload.find((m) => m.from === MPCv2PartiesEnum.BACKUP);
    assert(userMsg, 'User message not found in payload');
    assert(backupMsg, 'Backup message not found in payload');
  }

  private async sendKeyGenerationRound1(
    enterprise: string,
    userGpgPublicKey: string,
    backupGpgPublicKey: string,
    userPubKey: string,
    backupPubKey: string
  ): Promise<any> {
    assert(NonEmptyString.is(userGpgPublicKey), 'User GPG public key is required');
    assert(NonEmptyString.is(backupGpgPublicKey), 'Backup GPG public key is required');
    assert(NonEmptyString.is(userPubKey), 'User public key is required');
    assert(NonEmptyString.is(backupPubKey), 'Backup public key is required');

    return EDDSAMPCv2KeyGenSenderForEnterprise(this.bitgo, enterprise)(MPCv2KeyGenStateEnum['MPCv2-R1'], {
      userGpgPublicKey,
      backupGpgPublicKey,
      userPubKey,
      backupPubKey,
    });
  }

  private async sendKeyGenerationRound2(
    enterprise: string,
    sessionId: string,
    payload: MPSTypes.AuthEncMessage[]
  ): Promise<any> {
    this.validateRoundPayload(sessionId, payload);
    return EDDSAMPCv2KeyGenSenderForEnterprise(this.bitgo, enterprise)(MPCv2KeyGenStateEnum['MPCv2-R2'], {
      sessionId,
      payload,
    });
  }

  private async sendKeyGenerationRound3(
    enterprise: string,
    sessionId: string,
    payload: MPSTypes.AuthEncMessage[]
  ): Promise<any> {
    this.validateRoundPayload(sessionId, payload);
    return EDDSAMPCv2KeyGenSenderForEnterprise(this.bitgo, enterprise)(MPCv2KeyGenStateEnum['MPCv2-R3'], {
      sessionId,
      payload,
    });
  }

  private async addUserKeychain(
    commonKeychain: string,
    privateMaterial: Buffer,
    passphrase: string,
    originalPasscodeEncryptionCode?: string
  ): Promise<Keychain> {
    return this.createParticipantKeychain(
      MPCv2PartiesEnum.USER,
      commonKeychain,
      privateMaterial,
      passphrase,
      originalPasscodeEncryptionCode
    );
  }

  private async addBackupKeychain(
    commonKeychain: string,
    privateMaterial: Buffer,
    passphrase: string,
    originalPasscodeEncryptionCode?: string
  ): Promise<Keychain> {
    return this.createParticipantKeychain(
      MPCv2PartiesEnum.BACKUP,
      commonKeychain,
      privateMaterial,
      passphrase,
      originalPasscodeEncryptionCode
    );
  }

  private async addBitgoKeychain(commonKeychain: string): Promise<Keychain> {
    return this.createParticipantKeychain(MPCv2PartiesEnum.BITGO, commonKeychain);
  }

  // #region keychain utils
  async createParticipantKeychain(
    participantIndex: MPCv2PartyFromStringOrNumber,
    commonKeychain: string,
    privateMaterial?: Buffer,
    passphrase?: string,
    originalPasscodeEncryptionCode?: string
  ): Promise<Keychain> {
    let source: string;
    let encryptedPrv: string | undefined;
    switch (participantIndex) {
      case MPCv2PartiesEnum.USER:
      case MPCv2PartiesEnum.BACKUP:
        source = participantIndex === MPCv2PartiesEnum.USER ? 'user' : 'backup';
        assert(privateMaterial, `Private material is required for ${source} keychain`);
        assert(passphrase, `Passphrase is required for ${source} keychain`);
        encryptedPrv = this.bitgo.encrypt({
          input: privateMaterial.toString('base64'),
          password: passphrase,
        });
        break;
      case MPCv2PartiesEnum.BITGO:
        source = 'bitgo';
        break;
      default:
        throw new Error('Invalid participant index');
    }

    const recipientKeychainParams: AddKeychainOptions = {
      source,
      keyType: 'tss' as KeyType,
      commonKeychain,
      encryptedPrv,
      originalPasscodeEncryptionCode,
      isMPCv2: true,
    };

    const keychains = this.baseCoin.keychains();
    return await keychains.add(recipientKeychainParams);
  }
  // #endregion

  // #region sign tx request

  /**
   * Signs the transaction associated to the transaction request.
   * @param {string | TxRequest} params.txRequest - transaction request object or id
   * @param {string} params.prv - decrypted private key
   * @param {string} params.reqId - request id
   * @param {string} params.mpcv2PartyId - party id for the signer involved in this mpcv2 request (either 0 for user or 1 for backup)
   * @returns {Promise<TxRequest>} fully signed TxRequest object
   */

  async signTxRequest(params: TSSParamsWithPrv): Promise<TxRequest> {
    this.bitgo.setRequestTracer(params.reqId);
    return this.signRequestBase(params, RequestType.tx);
  }

  /**
   * Base method for signing transaction or message requests using EdDSA MPCv2
   * Orchestrates the complete signing flow including key setup, hash generation, and multi-round signing
   *
   * @param {TSSParamsWithPrv | TSSParamsForMessageWithPrv} params - signing parameters
   * @param {string | TxRequest} params.txRequest - transaction request object or id
   * @param {string} params.prv - base64 encoded decrypted private key share
   * @param {string} params.reqId - request id for tracing
   * @param {0 | 1} params.mpcv2PartyId - party id for the signer (0 for user, 1 for backup)
   * @param {RequestType} requestType - the type of request being signed (tx or message)
   * @returns {Promise<TxRequest>} fully signed transaction request object
   * @throws {Error} if BitGo GPG key is missing or signing process fails
   *
   * @description
   * This method performs the following steps:
   * 1. Resolves and verifies the transaction request
   * 2. Generates GPG keys and retrieves BitGo's public key
   * 3. Prepares the message/transaction hash for signing
   * 4. Initializes the DSG (Distributed Signature Generation) signer
   * 5. Executes Round 1: User sends initial message and receives BitGo's responses
   * 6. Executes Round 2: User processes BitGo's messages and sends final signature share
   * 7. Returns the fully signed transaction request
   */
  private async signRequestBase(
    params: TSSParamsWithPrv | TSSParamsForMessageWithPrv,
    requestType: RequestType
  ): Promise<TxRequest> {
    const userKeyShare = Buffer.from(params.prv, 'base64');
    const { txRequestResolved: txRequest } = await this.resolveTxRequest(params.txRequest, params.reqId);
    const userGpgKey = await generateGPGKeyPair('secp256k1');
    const bitgoGpgPubKey = await this.pickBitgoPubGpgKeyForSigning(true, params.reqId, txRequest.enterpriseId);

    if (!bitgoGpgPubKey) {
      throw new Error('Missing BitGo GPG key for MPCv2');
    }

    const unsignedTx = this.getUnsignedTxFromRequest(txRequest);
    const txOrMessageToSign = unsignedTx.signableHex;
    const derivationPath = unsignedTx.derivationPath;
    const bufferContent = Buffer.from(txOrMessageToSign, 'hex');

    let hash: Hash;
    try {
      hash = this.baseCoin.getHashFunction();
    } catch (err) {
      hash = createKeccakHash('keccak256') as Hash;
    }
    // check what the encoding is supposed to be for message
    const hashBuffer = hash.update(bufferContent).digest();

    const otherSigner = new MPSDsg.DSG(
      userKeyShare,
      params.mpcv2PartyId ? params.mpcv2PartyId : 0,
      derivationPath,
      hashBuffer
    );
    await otherSigner.init();

    /** Round 1 **/
    const userSignerBroadcastMsg1 = otherSigner.getFirstMessage();
    const { bitgoToUserMessagesRound1, bitgoToUserMessagesRound2 } = await this.handleSigningRound1(
      userSignerBroadcastMsg1,
      userGpgKey,
      bitgoGpgPubKey,
      txRequest,
      params.mpcv2PartyId ? params.mpcv2PartyId : 0,
      requestType,
      params.reqId
    );

    /** Round 2 **/
    await this.handleSigningRound2(
      otherSigner,
      userSignerBroadcastMsg1,
      bitgoToUserMessagesRound1,
      bitgoToUserMessagesRound2,
      userGpgKey,
      bitgoGpgPubKey,
      txRequest,
      params.mpcv2PartyId ? params.mpcv2PartyId : 0,
      requestType,
      params.reqId
    );

    return sendTxRequest(this.bitgo, txRequest.walletId, txRequest.txRequestId, requestType, params.reqId);
  }

  /**
   * Handles Round 1 of the EdDSA MPCv2 signing process
   * @param {MPSTypes.DeserializedMessage} userSignerBroadcastMsg1 - the user's first broadcast message
   * @param {openpgp.SerializedKeyPair<string>} userGpgKey - the user's GPG key
   * @param {openpgp.Key} bitgoGpgPubKey - BitGo's GPG public key
   * @param {TxRequest} txRequest - the transaction request object
   * @param {0 | 1} mpcv2PartyId - party id for the signer (0 for user, 1 for backup)
   * @param {RequestType} requestType - the type of request (tx or message)
   * @param {IRequestTracer} reqId - request id for tracing
   * @returns {Promise<{bitgoToUserMessagesRound1: MPSTypes.DeserializedMessage, bitgoToUserMessagesRound2: MPSTypes.DeserializedMessage}>} deserialized BitGo messages for round 1 and 2
   */
  private async handleSigningRound1(
    userSignerBroadcastMsg1: MPSTypes.DeserializedMessage,
    userGpgKey: openpgp.SerializedKeyPair<string>,
    bitgoGpgPubKey: openpgp.Key,
    txRequest: TxRequest,
    mpcv2PartyId: 0 | 1 = 0,
    requestType: RequestType,
    reqId: IRequestTracer
  ): Promise<{
    bitgoToUserMessagesRound1: MPSTypes.DeserializedMessage;
    bitgoToUserMessagesRound2: MPSTypes.DeserializedMessage;
  }> {
    const signatureShareRound1 = await getSignatureShareRoundOne(
      userSignerBroadcastMsg1,
      userGpgKey,
      bitgoGpgPubKey,
      mpcv2PartyId
    );

    const latestTxRequest = await sendSignatureShareV2(
      this.bitgo,
      txRequest.walletId,
      txRequest.txRequestId,
      [signatureShareRound1],
      requestType,
      this.baseCoin.getMPCAlgorithm(),
      userGpgKey.publicKey,
      undefined,
      this.wallet.multisigTypeVersion(),
      reqId
    );

    assert(latestTxRequest.transactions || latestTxRequest.messages, 'Invalid txRequest Object');

    const bitgoToUserMessages1And2 = latestTxRequest.transactions?.[0].signatureShares;
    assert(bitgoToUserMessages1And2, 'Missing BitGo to User messages for round 1 and 2');

    // TODO: Use codec for parsing
    const parsedBitGoToUserSigShareRoundOne = JSON.parse(
      bitgoToUserMessages1And2[bitgoToUserMessages1And2.length - 1].share
    ) as MPCv2SignatureShareRound1Output;

    if (parsedBitGoToUserSigShareRoundOne.type !== 'round1Output') {
      throw new Error('Unexpected signature share response. Unable to parse data.');
    }

    const serializedBitGoToUserMessagesRound1And2 = await verifyBitGoMessagesAndSignaturesRoundOne(
      parsedBitGoToUserSigShareRoundOne,
      userGpgKey,
      bitgoGpgPubKey
    );

    const [bitgoToUserMessagesRound1, bitgoToUserMessagesRound2] = MPSUtil.deserializeMessages(
      serializedBitGoToUserMessagesRound1And2
    );

    return {
      bitgoToUserMessagesRound1,
      bitgoToUserMessagesRound2,
    };
  }

  /**
   * Handles Round 2 of the EdDSA MPCv2 signing process
   * @param {MPSDsg.DSG} otherSigner - the DSG instance for the signer
   * @param {MPSTypes.DeserializedMessage} userSignerBroadcastMsg1 - the user's first broadcast message
   * @param {MPSTypes.DeserializedMessage} bitgoToUserMessagesRound1 - BitGo's round 1 message
   * @param {MPSTypes.DeserializedMessage} bitgoToUserMessagesRound2 - BitGo's round 2 message
   * @param {any} userGpgKey - the user's GPG key
   * @param {openpgp.Key} bitgoGpgPubKey - BitGo's GPG public key
   * @param {TxRequest} txRequest - the transaction request object
   * @param {0 | 1} mpcv2PartyId - party id for the signer (0 for user, 1 for backup)
   * @param {RequestType} requestType - the type of request (tx or message)
   * @param {IRequestTracer} reqId - request id for tracing
   * @returns {Promise<TxRequest>} the updated transaction request
   */
  private async handleSigningRound2(
    otherSigner: MPSDsg.DSG,
    userSignerBroadcastMsg1: MPSTypes.DeserializedMessage,
    bitgoToUserMessagesRound1: MPSTypes.DeserializedMessage,
    bitgoToUserMessagesRound2: MPSTypes.DeserializedMessage,
    userGpgKey: openpgp.SerializedKeyPair<string>,
    bitgoGpgPubKey: openpgp.Key,
    txRequest: TxRequest,
    mpcv2PartyId: 0 | 1 = 0,
    requestType: RequestType,
    reqId: IRequestTracer
  ): Promise<TxRequest> {
    const userToBitGoMessagesRound2 = otherSigner.handleIncomingMessages([
      userSignerBroadcastMsg1,
      bitgoToUserMessagesRound1,
    ])[0];
    const userToBitGoMessagesRound3 = otherSigner.handleIncomingMessages([
      userToBitGoMessagesRound2[0],
      bitgoToUserMessagesRound2,
    ])[0];

    const signatureShareRoundTwo = await getSignatureShareRoundTwo(
      userToBitGoMessagesRound2,
      userToBitGoMessagesRound3,
      userGpgKey,
      bitgoGpgPubKey,
      mpcv2PartyId
    );

    const latestTxRequest = await sendSignatureShareV2(
      this.bitgo,
      txRequest.walletId,
      txRequest.txRequestId,
      [signatureShareRoundTwo],
      requestType,
      this.baseCoin.getMPCAlgorithm(),
      userGpgKey.publicKey,
      undefined,
      this.wallet.multisigTypeVersion(),
      reqId
    );

    assert(latestTxRequest.transactions || latestTxRequest.messages, 'Invalid txRequest Object');

    return latestTxRequest;
  }
}
