import assert from 'assert';
import { NonEmptyString } from 'io-ts-types';
import { Buffer } from 'buffer';
import { MPCv2KeyGenStateEnum, MPCv2PartyFromStringOrNumber } from '@bitgo/public-types';
import { DklsTypes, MPSUtil, MPSTypes, MPSComms, MPSDkg } from '@bitgo/sdk-lib-mpc';

import { KeychainsTriplet } from '../../../baseCoin';
import { AddKeychainOptions, Keychain, KeyType } from '../../../keychain';
import { MPCv2PartiesEnum } from '../ecdsa/typesMPCv2';
import { generateGPGKeyPair } from '../../opengpgUtils';
import { envRequiresBitgoPubGpgKeyConfig, isBitgoMpcPubKey } from '../../../tss/bitgoPubKeys';

import { EDDSAMPCv2KeyGenSenderForEnterprise } from './eddsaMPCv2KeyGenSender';
import { BaseEddsaUtils } from './base';

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
}
