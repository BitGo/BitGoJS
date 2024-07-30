import assert from 'assert';
import { IBaseCoin } from '../../../../baseCoin';
import { BitGoBase } from '../../../../bitgoBase';
import { EcdsaMPCv2Utils } from '../ecdsaMPCv2';
import {
  BitgoToOVC1Round1Response,
  BitgoToOVC1Round2Response,
  BitgoToOVC1Round3Response,
  KeyCreationMPCv2States,
  OVC1ToBitgoRound3Payload,
  OVC2ToBitgoRound1Payload,
  OVC2ToBitgoRound2Payload,
  OVC_ONE,
  OVC_TWO,
} from './types';

import { Keychain } from '../../../..';

export class MPCv2SMCUtils {
  private MPCv2Utils: EcdsaMPCv2Utils;

  constructor(bitgo: BitGoBase, private baseCoin: IBaseCoin) {
    this.MPCv2Utils = new EcdsaMPCv2Utils(bitgo, baseCoin);
  }

  public async keyGenRound1(enterprise: string, payload: OVC2ToBitgoRound1Payload): Promise<BitgoToOVC1Round1Response> {
    assert(
      payload.state === KeyCreationMPCv2States.WaitingForBitgoRound1Data,
      `Invalid state for round 1, got: ${payload.state}`
    );
    const ovc1 = payload.ovc[OVC_ONE];
    const ovc2 = payload.ovc[OVC_TWO];
    const userGpgPublicKey = ovc1.gpgPubKey;
    const backupGpgPublicKey = ovc2.gpgPubKey;
    const messages = { p2pMessages: [], broadcastMessages: [ovc1.ovcMsg1, ovc2.ovcMsg1] };
    const result = await this.MPCv2Utils.sendKeyGenerationRound1(
      enterprise,
      userGpgPublicKey,
      backupGpgPublicKey,
      messages
    );

    return {
      wallet: {
        tssVersion: payload.tssVersion,
        walletType: payload.walletType,
        coin: payload.coin,
        ovc: payload.ovc,
        state: KeyCreationMPCv2States.WaitingForOVC1Round2Data,
        platform: {
          walletGpgPubKeySigs: result.walletGpgPubKeySigs,
          sessionId: result.sessionId,
          bitgoMsg1: this.MPCv2Utils.formatBitgoBroadcastMessage(result.bitgoMsg1),
          ovc: {
            [OVC_ONE]: { bitgoToOvcMsg2: this.MPCv2Utils.formatP2PMessage(result.bitgoToUserMsg2) },
            [OVC_TWO]: { bitgoToOvcMsg2: this.MPCv2Utils.formatP2PMessage(result.bitgoToBackupMsg2) },
          },
        },
      },
    };
  }

  public async keyGenRound2(enterprise: string, payload: OVC2ToBitgoRound2Payload): Promise<BitgoToOVC1Round2Response> {
    assert(
      payload.state === KeyCreationMPCv2States.WaitingForBitgoRound2Data,
      `Invalid state for round 2, got: ${payload.state}`
    );
    const ovc1 = payload.ovc[OVC_ONE];
    const ovc2 = payload.ovc[OVC_TWO];
    const sessionId = payload.platform.sessionId;
    const messages = { p2pMessages: [ovc1.ovcToBitgoMsg2, ovc2.ovcToBitgoMsg2], broadcastMessages: [] };
    const result = await this.MPCv2Utils.sendKeyGenerationRound2(enterprise, sessionId, messages);

    return {
      wallet: {
        tssVersion: payload.tssVersion,
        walletType: payload.walletType,
        coin: payload.coin,
        ovc: payload.ovc,
        state: KeyCreationMPCv2States.WaitingForOVC1Round3aData,
        platform: {
          ...payload.platform,
          sessionId: result.sessionId,
          bitgoCommitment2: result.bitgoCommitment2,
          ovc: {
            [OVC_ONE]: {
              ...payload.platform.ovc[OVC_ONE],
              bitgoToOvcMsg3: this.MPCv2Utils.formatP2PMessage(result.bitgoToUserMsg3),
            },
            [OVC_TWO]: {
              ...payload.platform.ovc[2],
              bitgoToOvcMsg3: this.MPCv2Utils.formatP2PMessage(result.bitgoToBackupMsg3),
            },
          },
        },
      },
    };
  }

  public async keyGenRound3(enterprise: string, payload: OVC1ToBitgoRound3Payload): Promise<BitgoToOVC1Round3Response> {
    assert(
      payload.state === KeyCreationMPCv2States.WaitingForBitgoRound3Data,
      `Invalid state for round 3, got: ${payload.state}`
    );
    const ovc1 = payload.ovc[OVC_ONE];
    const ovc2 = payload.ovc[OVC_TWO];
    const sessionId = payload.platform.sessionId;
    const messages = {
      p2pMessages: [ovc1.ovcToBitgoMsg3, ovc2.ovcToBitgoMsg3],
      broadcastMessages: [ovc1.ovcMsg4, ovc2.ovcMsg4],
    };
    const result = await this.MPCv2Utils.sendKeyGenerationRound3(enterprise, sessionId, messages);

    const keychains = this.baseCoin.keychains();
    const bitgoKeychain = await keychains.add({
      source: 'bitgo',
      keyType: 'tss',
      commonKeychain: result.commonKeychain,
      isMPCv2: true,
    });

    return {
      bitGoKeyId: bitgoKeychain.id,
      wallet: {
        tssVersion: payload.tssVersion,
        walletType: payload.walletType,
        coin: payload.coin,
        ovc: payload.ovc,
        state: KeyCreationMPCv2States.WaitingForOVC1GenerateKey,
        platform: {
          ...payload.platform,
          commonKeychain: result.commonKeychain,
          bitgoMsg4: this.MPCv2Utils.formatBitgoBroadcastMessage(result.bitgoMsg4),
        },
      },
    };
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
