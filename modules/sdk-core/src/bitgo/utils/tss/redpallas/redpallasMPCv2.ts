import assert from 'assert';
import * as pgp from 'openpgp';
import { NonEmptyString } from 'io-ts-types';
import {
  MPCv2KeyGenStateEnum,
  RedpallasMPCv2KeyGenRound1Request,
  RedpallasMPCv2KeyGenRound1Response,
  RedpallasMPCv2KeyGenRound2Request,
  RedpallasMPCv2KeyGenRound2Response,
} from '@bitgo/public-types';
import { RedPallasMPSDkg, RedPallasMPSTypes, MPSComms } from '@bitgo/sdk-lib-mpc';
import { IBaseCoin, KeychainsTriplet } from '../../../baseCoin';
import { BitGoBase } from '../../../bitgoBase';
import { AddKeychainOptions, Keychain, KeyType } from '../../../keychain';
import { IWallet } from '../../../wallet';
import { EncryptionVersion } from '../../../../api';
import BaseTssUtils from '../baseTSSUtils';
import { MPCv2PartiesEnum } from '../ecdsa/typesMPCv2';
import { generateGPGKeyPair } from '../../opengpgUtils';
import {
  GenerateRedpallasMPCv2KeyRequestBody,
  GenerateRedpallasMPCv2KeyRequestResponse,
  RedpallasKeyGenSenderForEnterprise,
  RedpallasMPCv2KeyGenSendFn,
} from './redpallasMPCv2KeyGenSender';

/**
 * DKG-only MPCv2 utils for the Zcash Orchard shielded pool (RedPallas / "Ironwood").

 *
 * Mirrors `EddsaMPCv2Utils` (see `../eddsa/eddsaMPCv2.ts`) for the key-generation portion of the
 * protocol only: there is no MPCv1 predecessor to retrofit from, and no signing (DSG) support -
 * transaction signing for Zcash shielded addresses is out of scope for this SDK today.
 *
 * RedPallas MPS DKG completes in the same 2-round shape as EdDSA MPS DKG (round0 local, round1 +
 * round2 online), but round2 additionally requires a `derivationSeed`: a 32-byte value consumed by
 * a subsequent, platform-side-only key derivation step (Zcash Orchard ask/nk/rivk/ivks) that is
 * intentionally not implemented here. The resulting `commonPublicKeychain` is the raw 32-byte
 * RedPallas group public key (64 hex chars) - there is no BIP32-style chain code, unlike EdDSA/ECDSA
 * commonKeychains.
 */
export class RedpallasMPCv2Utils extends BaseTssUtils<unknown> {
  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, wallet?: IWallet) {
    super(bitgo, baseCoin, wallet);
    this.setBitgoGpgPubKey(bitgo);
  }

  /**
   * Creates user, backup, and BitGo keychains for a RedPallas MPCv2 (DKG-only) wallet.
   *
   * @param params.passphrase - passphrase to encrypt the user/backup private key shares with
   * @param params.enterprise - enterprise id the keys are generated under
   * @param params.derivationSeed - 32-byte seed (hex or Buffer) required by DKG round2; must be
   *   the same value supplied to all three parties (user, backup, BitGo).
   */
  async createKeychains(params: {
    passphrase: string;
    enterprise: string;
    derivationSeed: Buffer;
    originalPasscodeEncryptionCode?: string;
    encryptionVersion?: EncryptionVersion;
    safeId?: string;
  }): Promise<KeychainsTriplet> {
    assert(params.derivationSeed && params.derivationSeed.length === 32, 'derivationSeed must be 32 bytes');

    const userKeyPair = await generateGPGKeyPair('ed25519');
    const userGpgKey = await pgp.readPrivateKey({ armoredKey: userKeyPair.privateKey });
    const userGpgPublicKey = userKeyPair.publicKey;
    const [userPk, userSk] = await MPSComms.extractEd25519KeyPair(userGpgKey);

    const backupKeyPair = await generateGPGKeyPair('ed25519');
    const backupGpgKey = await pgp.readPrivateKey({ armoredKey: backupKeyPair.privateKey });
    const backupGpgPublicKey = backupKeyPair.publicKey;
    const [backupPk, backupSk] = await MPSComms.extractEd25519KeyPair(backupGpgKey);

    // RedPallas DKG needs X25519 keys, extracted the same way as EdDSA MPS DKG does (from an
    // ed25519-identity GPG key's encryption subkey) - reuse the same dedicated BitGo GPG key
    // used for EdDSA MPCv2, since no separate RedPallas-specific BitGo GPG key is provisioned.
    const { eddsaMpcv2PublicKey } = await this.getBitgoGpgPubkeyBasedOnFeatureFlags(params.enterprise, true);
    const bitgoPublicGpgKey = eddsaMpcv2PublicKey ?? this.bitgoEddsaMpcv2PublicGpgKey;
    assert(bitgoPublicGpgKey, 'Failed to get BitGo GPG public key for RedPallas MPCv2');
    const bitgoPublicGpgKeyArmored = bitgoPublicGpgKey.armor();
    const bitgoKeyObj = await pgp.readKey({ armoredKey: bitgoPublicGpgKeyArmored });
    const bitgoPk = await MPSComms.extractEd25519PublicKey(bitgoKeyObj);

    const userDkg = new RedPallasMPSDkg.RedPallasDKG(3, 2, MPCv2PartiesEnum.USER);
    const backupDkg = new RedPallasMPSDkg.RedPallasDKG(3, 2, MPCv2PartiesEnum.BACKUP);

    // #region round 1
    await userDkg.initDkg(userSk, [backupPk, bitgoPk]);
    await backupDkg.initDkg(backupSk, [userPk, bitgoPk]);

    const userMsg1 = userDkg.getFirstMessage();
    const backupMsg1 = backupDkg.getFirstMessage();

    const userSignedMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(userMsg1.payload), userGpgKey);
    const backupSignedMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(backupMsg1.payload), backupGpgKey);

    assert(NonEmptyString.is(userGpgPublicKey), 'User GPG public key is required');
    assert(NonEmptyString.is(backupGpgPublicKey), 'Backup GPG public key is required');

    const { sessionId, bitgoMsg1 } = await this.sendKeyGenerationRound1(params.enterprise, {
      userGpgPublicKey,
      backupGpgPublicKey,
      userMsg1: userSignedMsg1,
      backupMsg1: backupSignedMsg1,
    });
    // #endregion

    // #region round 2
    const bitgoRawMsg1Bytes = await MPSComms.verifyMpsMessage(bitgoMsg1, bitgoKeyObj);
    const bitgoDeserializedMsg1: RedPallasMPSTypes.DeserializedMessage = {
      from: MPCv2PartiesEnum.BITGO,
      payload: new Uint8Array(bitgoRawMsg1Bytes),
    };

    const round1Messages: RedPallasMPSTypes.DeserializedMessages = [userMsg1, backupMsg1, bitgoDeserializedMsg1];

    const userRound2Msgs = userDkg.handleIncomingMessages(round1Messages);
    const backupRound2Msgs = backupDkg.handleIncomingMessages(round1Messages);

    assert(userRound2Msgs.length === 1, 'User round 1 should produce exactly one round 2 message');
    assert(backupRound2Msgs.length === 1, 'Backup round 1 should produce exactly one round 2 message');

    const userMsg2 = userRound2Msgs[0];
    const backupMsg2 = backupRound2Msgs[0];

    const userSignedMsg2 = await MPSComms.detachSignMpsMessage(Buffer.from(userMsg2.payload), userGpgKey);
    const backupSignedMsg2 = await MPSComms.detachSignMpsMessage(Buffer.from(backupMsg2.payload), backupGpgKey);

    const {
      sessionId: sessionIdRound2,
      commonPublicKeychain,
      bitgoMsg2,
    } = await this.sendKeyGenerationRound2(params.enterprise, {
      sessionId,
      userMsg2: userSignedMsg2,
      backupMsg2: backupSignedMsg2,
      derivationSeed: params.derivationSeed.toString('hex'),
    });
    // #endregion

    // #region keychain creation
    assert.equal(sessionId, sessionIdRound2, 'Round 1 and round 2 session IDs do not match');

    const bitgoRawMsg2Bytes = await MPSComms.verifyMpsMessage(bitgoMsg2, bitgoKeyObj);
    const bitgoDeserializedMsg2: RedPallasMPSTypes.DeserializedMessage = {
      from: MPCv2PartiesEnum.BITGO,
      payload: new Uint8Array(bitgoRawMsg2Bytes),
    };

    const round2Messages: RedPallasMPSTypes.DeserializedMessages = [userMsg2, backupMsg2, bitgoDeserializedMsg2];

    const userFinalMsgs = userDkg.handleIncomingMessages(round2Messages, params.derivationSeed);
    const backupFinalMsgs = backupDkg.handleIncomingMessages(round2Messages, params.derivationSeed);

    assert(userFinalMsgs.length === 0, 'DKG round 2 should produce no output messages for user');
    assert(backupFinalMsgs.length === 0, 'DKG round 2 should produce no output messages for backup');

    const userCommonKeychain = userDkg.getSharePublicKey().toString('hex');
    const backupCommonKeychain = backupDkg.getSharePublicKey().toString('hex');

    assert.equal(
      userCommonKeychain,
      commonPublicKeychain,
      'User computed keychain does not match BitGo common keychain'
    );
    assert.equal(
      backupCommonKeychain,
      commonPublicKeychain,
      'Backup computed keychain does not match BitGo common keychain'
    );

    const userPrivateMaterial = userDkg.getKeyShare();
    const backupPrivateMaterial = backupDkg.getKeyShare();
    const userReducedPrivateMaterial = userDkg.getReducedKeyShare();
    const backupReducedPrivateMaterial = backupDkg.getReducedKeyShare();

    const userKeychainPromise = this.addUserKeychain(
      userCommonKeychain,
      userPrivateMaterial,
      userReducedPrivateMaterial,
      params.passphrase,
      params.originalPasscodeEncryptionCode,
      params.encryptionVersion,
      params.safeId
    );
    const backupKeychainPromise = this.addBackupKeychain(
      backupCommonKeychain,
      backupPrivateMaterial,
      backupReducedPrivateMaterial,
      params.passphrase,
      params.originalPasscodeEncryptionCode,
      params.encryptionVersion,
      params.safeId
    );
    const bitgoKeychainPromise = this.addBitgoKeychain(userCommonKeychain, params.safeId);

    const [userKeychain, backupKeychain, bitgoKeychain] = await Promise.all([
      userKeychainPromise,
      backupKeychainPromise,
      bitgoKeychainPromise,
    ]);
    // #endregion

    return { userKeychain, backupKeychain, bitgoKeychain };
  }

  // #region keychain helpers

  async createParticipantKeychain(
    participantIndex: MPCv2PartiesEnum,
    commonKeychain: string,
    privateMaterial?: Buffer,
    reducedPrivateMaterial?: Buffer,
    passphrase?: string,
    originalPasscodeEncryptionCode?: string,
    encryptionVersion?: EncryptionVersion,
    safeId?: string
  ): Promise<Keychain> {
    let source: string;
    let encryptedPrv: string | undefined = undefined;
    let reducedEncryptedPrv: string | undefined = undefined;

    switch (participantIndex) {
      case MPCv2PartiesEnum.USER:
      case MPCv2PartiesEnum.BACKUP:
        source = participantIndex === MPCv2PartiesEnum.USER ? 'user' : 'backup';
        assert(privateMaterial, `Private material is required for ${source} keychain`);
        assert(reducedPrivateMaterial, `Reduced private material is required for ${source} keychain`);
        assert(passphrase, `Passphrase is required for ${source} keychain`);
        encryptedPrv = await this.bitgo.encrypt({
          input: privateMaterial.toString('base64'),
          password: passphrase,
          encryptionVersion,
        });
        reducedEncryptedPrv = await this.bitgo.encrypt({
          input: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(reducedPrivateMaterial)))),
          password: passphrase,
          encryptionVersion,
        });
        break;
      case MPCv2PartiesEnum.BITGO:
        source = 'bitgo';
        break;
      default:
        throw new Error('Invalid participant index');
    }

    const keychainParams: AddKeychainOptions = {
      source,
      keyType: 'tss' as KeyType,
      commonKeychain,
      encryptedPrv,
      originalPasscodeEncryptionCode,
      isMPCv2: true,
      safeId,
    };

    const keychains = this.baseCoin.keychains();
    return { ...(await keychains.add(keychainParams)), reducedEncryptedPrv };
  }

  private async addUserKeychain(
    commonKeychain: string,
    privateMaterial: Buffer,
    reducedPrivateMaterial: Buffer,
    passphrase: string,
    originalPasscodeEncryptionCode?: string,
    encryptionVersion?: EncryptionVersion,
    safeId?: string
  ): Promise<Keychain> {
    return this.createParticipantKeychain(
      MPCv2PartiesEnum.USER,
      commonKeychain,
      privateMaterial,
      reducedPrivateMaterial,
      passphrase,
      originalPasscodeEncryptionCode,
      encryptionVersion,
      safeId
    );
  }

  private async addBackupKeychain(
    commonKeychain: string,
    privateMaterial: Buffer,
    reducedPrivateMaterial: Buffer,
    passphrase: string,
    originalPasscodeEncryptionCode?: string,
    encryptionVersion?: EncryptionVersion,
    safeId?: string
  ): Promise<Keychain> {
    return this.createParticipantKeychain(
      MPCv2PartiesEnum.BACKUP,
      commonKeychain,
      privateMaterial,
      reducedPrivateMaterial,
      passphrase,
      originalPasscodeEncryptionCode,
      encryptionVersion,
      safeId
    );
  }

  private async addBitgoKeychain(commonKeychain: string, safeId?: string): Promise<Keychain> {
    return this.createParticipantKeychain(
      MPCv2PartiesEnum.BITGO,
      commonKeychain,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      safeId
    );
  }
  // #endregion

  // #region platform round1/round2 dispatch

  async sendKeyGenerationRound1(
    enterprise: string,
    payload: RedpallasMPCv2KeyGenRound1Request,
    safeId?: string
  ): Promise<RedpallasMPCv2KeyGenRound1Response> {
    return this.sendKeyGenerationRound1BySender(
      RedpallasKeyGenSenderForEnterprise(this.bitgo, enterprise, safeId),
      payload
    );
  }

  async sendKeyGenerationRound1BySender(
    senderFn: RedpallasMPCv2KeyGenSendFn<GenerateRedpallasMPCv2KeyRequestResponse>,
    payload: RedpallasMPCv2KeyGenRound1Request
  ): Promise<RedpallasMPCv2KeyGenRound1Response> {
    return senderFn(
      MPCv2KeyGenStateEnum['MPCv2-R1'],
      payload as GenerateRedpallasMPCv2KeyRequestBody
    ) as Promise<RedpallasMPCv2KeyGenRound1Response>;
  }

  async sendKeyGenerationRound2(
    enterprise: string,
    payload: RedpallasMPCv2KeyGenRound2Request
  ): Promise<RedpallasMPCv2KeyGenRound2Response> {
    return this.sendKeyGenerationRound2BySender(RedpallasKeyGenSenderForEnterprise(this.bitgo, enterprise), payload);
  }

  async sendKeyGenerationRound2BySender(
    senderFn: RedpallasMPCv2KeyGenSendFn<GenerateRedpallasMPCv2KeyRequestResponse>,
    payload: RedpallasMPCv2KeyGenRound2Request
  ): Promise<RedpallasMPCv2KeyGenRound2Response> {
    return senderFn(
      MPCv2KeyGenStateEnum['MPCv2-R2'],
      payload as GenerateRedpallasMPCv2KeyRequestBody
    ) as Promise<RedpallasMPCv2KeyGenRound2Response>;
  }

  // #endregion
}
