import assert from 'assert';
import {
  EddsaBitgoToOVC1Round1Response,
  EddsaBitgoToOVC1Round2Response,
  EddsaKeyCreationMPCv2StateEnum,
  EddsaMPCv2KeyGenRound1Response,
  EddsaMPCv2KeyGenRound2Response,
  EddsaOVC1ToBitgoRound1Payload,
  EddsaOVC2ToBitgoRound2Payload,
  OVCIndexEnum,
} from '@bitgo/public-types';
import { IBaseCoin } from '../../../../baseCoin';
import { BitGoBase } from '../../../../bitgoBase';
import { decodeOrElse, Keychain } from '../../../..';
import { EddsaMPCv2Utils } from '../eddsaMPCv2';
import { EddsaMPCv2KeyGenSendFn, KeyGenSenderForEnterprise } from '../eddsaMPCv2KeyGenSender';

export class MPCv2SMCUtils {
  private MPCv2Utils: EddsaMPCv2Utils;

  constructor(private bitgo: BitGoBase, private baseCoin: IBaseCoin) {
    this.MPCv2Utils = new EddsaMPCv2Utils(bitgo, baseCoin);
  }

  public async keyGenRound1(
    enterprise: string,
    payload: EddsaOVC1ToBitgoRound1Payload
  ): Promise<EddsaBitgoToOVC1Round1Response> {
    return this.keyGenRound1BySender(KeyGenSenderForEnterprise(this.bitgo, enterprise), payload);
  }

  public async keyGenRound2(
    enterprise: string,
    payload: EddsaOVC2ToBitgoRound2Payload
  ): Promise<EddsaBitgoToOVC1Round2Response> {
    return this.keyGenRound2BySender(KeyGenSenderForEnterprise(this.bitgo, enterprise), payload);
  }

  public async keyGenRound1BySender(
    senderFn: EddsaMPCv2KeyGenSendFn<EddsaMPCv2KeyGenRound1Response>,
    payload: EddsaOVC1ToBitgoRound1Payload
  ): Promise<EddsaBitgoToOVC1Round1Response> {
    assert(
      payload.state === EddsaKeyCreationMPCv2StateEnum.WaitingForBitgoRound1Data,
      `Invalid state for round 1, expected: ${EddsaKeyCreationMPCv2StateEnum.WaitingForBitgoRound1Data}, got: ${payload.state}`
    );
    decodeOrElse(EddsaOVC1ToBitgoRound1Payload.name, EddsaOVC1ToBitgoRound1Payload, payload, (errors) => {
      throw new Error(`error(s) parsing payload: ${errors}`);
    });

    const ovc1 = payload.ovc[OVCIndexEnum.ONE];
    const ovc2 = payload.ovc[OVCIndexEnum.TWO];
    const result = await this.MPCv2Utils.sendKeyGenerationRound1BySender(senderFn, {
      userGpgPublicKey: ovc1.gpgPubKey,
      backupGpgPublicKey: ovc2.gpgPubKey,
      userMsg1: ovc1.ovcMsg1,
      backupMsg1: ovc2.ovcMsg1,
    });

    const response = {
      state: EddsaKeyCreationMPCv2StateEnum.WaitingForOVC1Round2Data,
      tssVersion: payload.tssVersion,
      walletType: payload.walletType,
      coin: payload.coin,
      ovc: payload.ovc,
      platform: {
        walletGpgPubKeySigs: (result as EddsaMPCv2KeyGenRound1Response & { walletGpgPubKeySigs: string })
          .walletGpgPubKeySigs,
        sessionId: result.sessionId,
        bitgoMsg1: result.bitgoMsg1,
      },
    };

    return decodeOrElse(EddsaBitgoToOVC1Round1Response.name, EddsaBitgoToOVC1Round1Response, response, (errors) => {
      throw new Error(`error(s) parsing response: ${errors}`);
    });
  }

  public async keyGenRound2BySender(
    senderFn: EddsaMPCv2KeyGenSendFn<EddsaMPCv2KeyGenRound2Response>,
    payload: EddsaOVC2ToBitgoRound2Payload
  ): Promise<EddsaBitgoToOVC1Round2Response> {
    assert(
      payload.state === EddsaKeyCreationMPCv2StateEnum.WaitingForBitgoRound2Data,
      `Invalid state for round 2, expected: ${EddsaKeyCreationMPCv2StateEnum.WaitingForBitgoRound2Data}, got: ${payload.state}`
    );
    decodeOrElse(EddsaOVC2ToBitgoRound2Payload.name, EddsaOVC2ToBitgoRound2Payload, payload, (errors) => {
      throw new Error(`error(s) parsing payload: ${errors}`);
    });

    const ovc1 = payload.ovc[OVCIndexEnum.ONE];
    const ovc2 = payload.ovc[OVCIndexEnum.TWO];
    const sessionId = payload.platform.sessionId;
    const result = await this.MPCv2Utils.sendKeyGenerationRound2BySender(senderFn, {
      sessionId,
      userMsg2: ovc1.ovcMsg2,
      backupMsg2: ovc2.ovcMsg2,
    });

    assert.equal(sessionId, result.sessionId, 'Round 1 and round 2 session IDs do not match');

    const keychains = this.baseCoin.keychains();
    const bitgoKeychain = await keychains.add({
      source: 'bitgo',
      keyType: 'tss',
      commonKeychain: result.commonPublicKeychain,
      isMPCv2: true,
    });

    const response = {
      state: EddsaKeyCreationMPCv2StateEnum.WaitingForOVC1GenerateKey,
      bitGoKeyId: bitgoKeychain.id,
      tssVersion: payload.tssVersion,
      walletType: payload.walletType,
      coin: payload.coin,
      ovc: payload.ovc,
      platform: {
        ...payload.platform,
        commonPublicKeychain: result.commonPublicKeychain,
        bitgoMsg2: result.bitgoMsg2,
      },
    };

    return decodeOrElse(EddsaBitgoToOVC1Round2Response.name, EddsaBitgoToOVC1Round2Response, response, (errors) => {
      throw new Error(`error(s) parsing response: ${errors}`);
    });
  }

  public async uploadClientKeys(
    bitgoKeyId: string,
    userCommonKeychain: string,
    backupCommonKeychain: string
  ): Promise<{ userKeychain: Keychain; backupKeychain: Keychain; bitgoKeychain: Keychain }> {
    assert(
      userCommonKeychain === backupCommonKeychain,
      'Common keychain mismatch between the user and backup keychains'
    );

    const keychains = this.baseCoin.keychains();
    const bitgoKeychain = await keychains.get({ id: bitgoKeyId });
    assert(bitgoKeychain, 'Keychain not found');
    assert(bitgoKeychain.source === 'bitgo', 'The keychain is not a BitGo keychain');
    assert(bitgoKeychain.type === 'tss', 'BitGo keychain is not a TSS keychain');
    assert(bitgoKeychain.commonKeychain, 'BitGo keychain does not have a common keychain');
    assert(bitgoKeychain.commonKeychain === userCommonKeychain, 'Common keychain mismatch between the OVCs and BitGo');

    const userKeychainPromise = keychains.add({
      source: 'user',
      keyType: 'tss',
      commonKeychain: userCommonKeychain,
      isMPCv2: true,
    });
    const backupKeychainPromise = keychains.add({
      source: 'backup',
      keyType: 'tss',
      commonKeychain: backupCommonKeychain,
      isMPCv2: true,
    });

    const [userKeychain, backupKeychain] = await Promise.all([userKeychainPromise, backupKeychainPromise]);
    return { userKeychain, backupKeychain, bitgoKeychain };
  }
}
