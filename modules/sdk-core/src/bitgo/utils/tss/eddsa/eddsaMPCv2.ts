import assert from 'assert';
import * as pgp from 'openpgp';
import { NonEmptyString } from 'io-ts-types';
import {
  EddsaMPCv2KeyGenRound1Request,
  EddsaMPCv2KeyGenRound1Response,
  EddsaMPCv2KeyGenRound2Request,
  EddsaMPCv2KeyGenRound2Response,
  MPCv2KeyGenStateEnum,
  MPCv2PartyFromStringOrNumber,
} from '@bitgo/public-types';
import { EddsaMPSDkg, MPSComms, MPSTypes } from '@bitgo/sdk-lib-mpc';
import { KeychainsTriplet } from '../../../baseCoin';
import { AddKeychainOptions, Keychain, KeyType } from '../../../keychain';
import { envRequiresBitgoPubGpgKeyConfig, isBitgoEddsaMpcv2PubKey } from '../../../tss/bitgoPubKeys';
import { generateGPGKeyPair } from '../../opengpgUtils';
import { MPCv2PartiesEnum } from '../ecdsa/typesMPCv2';
import { BaseEddsaUtils } from './base';
import { EddsaMPCv2KeyGenSendFn, KeyGenSenderForEnterprise } from './eddsaMPCv2KeyGenSender';

export class EddsaMPCv2Utils extends BaseEddsaUtils {
  /** @inheritdoc */
  async createKeychains(params: {
    passphrase: string;
    enterprise: string;
    originalPasscodeEncryptionCode?: string;
  }): Promise<KeychainsTriplet> {
    const userKeyPair = await generateGPGKeyPair('ed25519');
    const userGpgKey = await pgp.readPrivateKey({ armoredKey: userKeyPair.privateKey });
    const userGpgPublicKey = userKeyPair.publicKey;
    const [userPk, userSk] = await MPSComms.extractEd25519KeyPair(userGpgKey);

    const backupKeyPair = await generateGPGKeyPair('ed25519');
    const backupGpgKey = await pgp.readPrivateKey({ armoredKey: backupKeyPair.privateKey });
    const backupGpgPublicKey = backupKeyPair.publicKey;
    const [backupPk, backupSk] = await MPSComms.extractEd25519KeyPair(backupGpgKey);

    // Get the BitGo EdDSA MPCv2 public key (ed25519). Using the default mpcv2PublicKey (secp256k1)
    // here would cause a WASM "Invalid Input" error, so we require the dedicated eddsaMpcv2PublicKey.
    const { eddsaMpcv2PublicKey } = await this.getBitgoGpgPubkeyBasedOnFeatureFlags(params.enterprise, true);
    const bitgoPublicGpgKey = eddsaMpcv2PublicKey ?? this.bitgoEddsaMpcv2PublicGpgKey;
    assert(bitgoPublicGpgKey, 'Failed to get BitGo EdDSA MPCv2 GPG public key');
    const bitgoPublicGpgKeyArmored = bitgoPublicGpgKey.armor();

    if (envRequiresBitgoPubGpgKeyConfig(this.bitgo.getEnv())) {
      assert(isBitgoEddsaMpcv2PubKey(bitgoPublicGpgKeyArmored), 'Invalid BitGo GPG public key');
    }

    const bitgoKeyObj = await pgp.readKey({ armoredKey: bitgoPublicGpgKeyArmored });
    const bitgoPk = await MPSComms.extractEd25519PublicKey(bitgoKeyObj);

    // Create DKG sessions for user (party 0) and backup (party 1)
    const userDkg = new EddsaMPSDkg.DKG(3, 2, MPCv2PartiesEnum.USER);
    const backupDkg = new EddsaMPSDkg.DKG(3, 2, MPCv2PartiesEnum.BACKUP);

    // #region round 1
    userDkg.initDkg(userSk, [backupPk, bitgoPk]);
    backupDkg.initDkg(backupSk, [userPk, bitgoPk]);

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
    const bitgoDeserializedMsg1: MPSTypes.DeserializedMessage = {
      from: MPCv2PartiesEnum.BITGO,
      payload: new Uint8Array(bitgoRawMsg1Bytes),
    };

    const round1Messages: MPSTypes.DeserializedMessages = [userMsg1, backupMsg1, bitgoDeserializedMsg1];

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
      commonPublicKey,
      bitgoMsg2,
    } = await this.sendKeyGenerationRound2(params.enterprise, {
      sessionId,
      userMsg2: userSignedMsg2,
      backupMsg2: backupSignedMsg2,
    });
    // #endregion

    // #region keychain creation
    assert.equal(sessionId, sessionIdRound2, 'Round 1 and round 2 session IDs do not match');

    const bitgoRawMsg2Bytes = await MPSComms.verifyMpsMessage(bitgoMsg2, bitgoKeyObj);
    const bitgoDeserializedMsg2: MPSTypes.DeserializedMessage = {
      from: MPCv2PartiesEnum.BITGO,
      payload: new Uint8Array(bitgoRawMsg2Bytes),
    };

    const round2Messages: MPSTypes.DeserializedMessages = [userMsg2, backupMsg2, bitgoDeserializedMsg2];

    const userFinalMsgs = userDkg.handleIncomingMessages(round2Messages);
    const backupFinalMsgs = backupDkg.handleIncomingMessages(round2Messages);

    assert(userFinalMsgs.length === 0, 'WASM round 2 should produce no output messages for user');
    assert(backupFinalMsgs.length === 0, 'WASM round 2 should produce no output messages for backup');

    const userCommonKey = userDkg.getSharePublicKey().toString('hex');
    const backupCommonKey = backupDkg.getSharePublicKey().toString('hex');

    assert.equal(userCommonKey, commonPublicKey, 'User computed public key does not match BitGo common public key');
    assert.equal(backupCommonKey, commonPublicKey, 'Backup computed public key does not match BitGo common public key');

    const userPrivateMaterial = userDkg.getKeyShare();
    const backupPrivateMaterial = backupDkg.getKeyShare();
    const userReducedPrivateMaterial = userDkg.getReducedKeyShare();
    const backupReducedPrivateMaterial = backupDkg.getReducedKeyShare();

    const userKeychainPromise = this.addUserKeychain(
      commonPublicKey,
      userPrivateMaterial,
      userReducedPrivateMaterial,
      params.passphrase,
      params.originalPasscodeEncryptionCode
    );
    const backupKeychainPromise = this.addBackupKeychain(
      commonPublicKey,
      backupPrivateMaterial,
      backupReducedPrivateMaterial,
      params.passphrase,
      params.originalPasscodeEncryptionCode
    );
    const bitgoKeychainPromise = this.addBitgoKeychain(commonPublicKey);

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

  // #region keychain utils
  async createParticipantKeychain(
    participantIndex: MPCv2PartyFromStringOrNumber,
    commonKeychain: string,
    privateMaterial?: Buffer,
    reducedPrivateMaterial?: Buffer,
    passphrase?: string,
    originalPasscodeEncryptionCode?: string
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
        encryptedPrv = this.bitgo.encrypt({
          input: privateMaterial.toString('base64'),
          password: passphrase,
        });
        // Encrypts the CBOR-encoded ReducedKeyShare (which contains the party's public
        // key) with the wallet passphrase. The result is stored as reducedEncryptedPrv
        // on the key card QR code and represents a second copy of key material
        // beyond the server-stored encryptedPrv.
        reducedEncryptedPrv = this.bitgo.encrypt({
          // Buffer.toString('base64') can not be used here as it does not work on the browser.
          // The browser deals with a Buffer as Uint8Array, therefore in the browser .toString('base64') just creates a comma separated string of the array values.
          input: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(reducedPrivateMaterial)))),
          password: passphrase,
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
    };

    const keychains = this.baseCoin.keychains();
    return { ...(await keychains.add(keychainParams)), reducedEncryptedPrv };
  }

  private async addUserKeychain(
    commonKeychain: string,
    privateMaterial: Buffer,
    reducedPrivateMaterial: Buffer,
    passphrase: string,
    originalPasscodeEncryptionCode?: string
  ): Promise<Keychain> {
    return this.createParticipantKeychain(
      MPCv2PartiesEnum.USER,
      commonKeychain,
      privateMaterial,
      reducedPrivateMaterial,
      passphrase,
      originalPasscodeEncryptionCode
    );
  }

  private async addBackupKeychain(
    commonKeychain: string,
    privateMaterial: Buffer,
    reducedPrivateMaterial: Buffer,
    passphrase: string,
    originalPasscodeEncryptionCode?: string
  ): Promise<Keychain> {
    return this.createParticipantKeychain(
      MPCv2PartiesEnum.BACKUP,
      commonKeychain,
      privateMaterial,
      reducedPrivateMaterial,
      passphrase,
      originalPasscodeEncryptionCode
    );
  }

  private async addBitgoKeychain(commonKeychain: string): Promise<Keychain> {
    return this.createParticipantKeychain(MPCv2PartiesEnum.BITGO, commonKeychain);
  }
  // #endregion

  async sendKeyGenerationRound1(
    enterprise: string,
    payload: EddsaMPCv2KeyGenRound1Request
  ): Promise<EddsaMPCv2KeyGenRound1Response> {
    return this.sendKeyGenerationRound1BySender(KeyGenSenderForEnterprise(this.bitgo, enterprise), payload);
  }

  async sendKeyGenerationRound1BySender(
    senderFn: EddsaMPCv2KeyGenSendFn<EddsaMPCv2KeyGenRound1Response>,
    payload: EddsaMPCv2KeyGenRound1Request
  ): Promise<EddsaMPCv2KeyGenRound1Response> {
    return senderFn(MPCv2KeyGenStateEnum['MPCv2-R1'], payload);
  }

  async sendKeyGenerationRound2(
    enterprise: string,
    payload: EddsaMPCv2KeyGenRound2Request
  ): Promise<EddsaMPCv2KeyGenRound2Response> {
    return this.sendKeyGenerationRound2BySender(KeyGenSenderForEnterprise(this.bitgo, enterprise), payload);
  }

  async sendKeyGenerationRound2BySender(
    senderFn: EddsaMPCv2KeyGenSendFn<EddsaMPCv2KeyGenRound2Response>,
    payload: EddsaMPCv2KeyGenRound2Request
  ): Promise<EddsaMPCv2KeyGenRound2Response> {
    return senderFn(MPCv2KeyGenStateEnum['MPCv2-R2'], payload);
  }
}
