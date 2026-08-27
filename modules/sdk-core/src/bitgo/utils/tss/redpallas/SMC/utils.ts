import assert from 'assert';
import {
  OVCIndexEnum,
  RedpallasBitgoToOVC1Round1Response,
  RedpallasBitgoToOVC1Round2Response,
  RedpallasKeyCreationMPCv2StateEnum,
  RedpallasMPCv2KeyGenRound1Response,
  RedpallasMPCv2KeyGenRound2Response,
  RedpallasOVC1ToBitgoRound1Payload,
  RedpallasOVC2ToBitgoRound2Payload,
} from '@bitgo/public-types';
import { IBaseCoin } from '../../../../baseCoin';
import { BitGoBase } from '../../../../bitgoBase';
import { decodeOrElse, Keychain } from '../../../..';
import { RedpallasMPCv2Utils } from '../redpallasMPCv2';
import { RedpallasMPCv2KeyGenSendFn, RedpallasKeyGenSenderForEnterprise } from '../redpallasMPCv2KeyGenSender';

/**
 * Custodial (SMC/OVC) DKG-only key generation for the Zcash Orchard shielded pool (RedPallas).
 *
 * Mirrors for both custodial and SMC wallet
 * ceremonies driven by external OVC (offline vault console) clients: round1/round2 payloads are
 * relayed from OVC1/OVC2 to BitGo and back. There is no round3 (no signing) - RedPallas MPS DKG
 * completes key generation in 2 online rounds, same as EdDSA MPS DKG.
 */
export class RedpallasMPCv2SMCUtils {
  private MPCv2Utils: RedpallasMPCv2Utils;

  constructor(private bitgo: BitGoBase, private baseCoin: IBaseCoin) {
    this.MPCv2Utils = new RedpallasMPCv2Utils(bitgo, baseCoin);
  }

  public async keyGenRound1(
    enterprise: string,
    payload: RedpallasOVC1ToBitgoRound1Payload
  ): Promise<RedpallasBitgoToOVC1Round1Response> {
    return this.keyGenRound1BySender(RedpallasKeyGenSenderForEnterprise(this.bitgo, enterprise), payload);
  }

  public async keyGenRound2(
    enterprise: string,
    payload: RedpallasOVC2ToBitgoRound2Payload
  ): Promise<RedpallasBitgoToOVC1Round2Response> {
    return this.keyGenRound2BySender(RedpallasKeyGenSenderForEnterprise(this.bitgo, enterprise), payload);
  }

  public async keyGenRound1BySender(
    senderFn: RedpallasMPCv2KeyGenSendFn<RedpallasMPCv2KeyGenRound1Response>,
    payload: RedpallasOVC1ToBitgoRound1Payload
  ): Promise<RedpallasBitgoToOVC1Round1Response> {
    assert(
      payload.state === RedpallasKeyCreationMPCv2StateEnum.WaitingForBitgoRound1Data,
      `Invalid state for round 1, expected: ${RedpallasKeyCreationMPCv2StateEnum.WaitingForBitgoRound1Data}, got: ${payload.state}`
    );
    decodeOrElse(RedpallasOVC1ToBitgoRound1Payload.name, RedpallasOVC1ToBitgoRound1Payload, payload, (errors) => {
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
      state: RedpallasKeyCreationMPCv2StateEnum.WaitingForOVC1Round2Data,
      tssVersion: payload.tssVersion,
      walletType: payload.walletType,
      coin: payload.coin,
      ovc: payload.ovc,
      platform: {
        sessionId: result.sessionId,
        bitgoMsg1: result.bitgoMsg1,
      },
    };

    return decodeOrElse(
      RedpallasBitgoToOVC1Round1Response.name,
      RedpallasBitgoToOVC1Round1Response,
      response,
      (errors) => {
        throw new Error(`error(s) parsing response: ${errors}`);
      }
    );
  }

  public async keyGenRound2BySender(
    senderFn: RedpallasMPCv2KeyGenSendFn<RedpallasMPCv2KeyGenRound2Response>,
    payload: RedpallasOVC2ToBitgoRound2Payload
  ): Promise<RedpallasBitgoToOVC1Round2Response> {
    assert(
      payload.state === RedpallasKeyCreationMPCv2StateEnum.WaitingForBitgoRound2Data,
      `Invalid state for round 2, expected: ${RedpallasKeyCreationMPCv2StateEnum.WaitingForBitgoRound2Data}, got: ${payload.state}`
    );
    decodeOrElse(RedpallasOVC2ToBitgoRound2Payload.name, RedpallasOVC2ToBitgoRound2Payload, payload, (errors) => {
      throw new Error(`error(s) parsing payload: ${errors}`);
    });

    const ovc1 = payload.ovc[OVCIndexEnum.ONE];
    const ovc2 = payload.ovc[OVCIndexEnum.TWO];
    const sessionId = payload.platform.sessionId;
    const result = await this.MPCv2Utils.sendKeyGenerationRound2BySender(senderFn, {
      sessionId,
      userMsg2: ovc1.ovcMsg2,
      backupMsg2: ovc2.ovcMsg2,
      derivationSeed: payload.derivationSeed,
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
      state: RedpallasKeyCreationMPCv2StateEnum.WaitingForOVC1GenerateKey,
      bitGoKeyId: bitgoKeychain.id,
      tssVersion: payload.tssVersion,
      walletType: payload.walletType,
      coin: payload.coin,
      ovc: payload.ovc,
      derivationSeed: payload.derivationSeed,
      platform: {
        // sessionId/bitgoMsg1 carried over from payload.platform; safe because the assert
        // above guarantees payload.platform.sessionId equals result.sessionId.
        ...payload.platform,
        commonPublicKeychain: result.commonPublicKeychain,
        bitgoMsg2: result.bitgoMsg2,
      },
    };

    return decodeOrElse(
      RedpallasBitgoToOVC1Round2Response.name,
      RedpallasBitgoToOVC1Round2Response,
      response,
      (errors) => {
        throw new Error(`error(s) parsing response: ${errors}`);
      }
    );
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
