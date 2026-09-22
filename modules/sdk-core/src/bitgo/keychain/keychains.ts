import { TssSettings, type KeyBulkUpdateBody, type KeyBulkUpdateResponse } from '@bitgo/public-types';
import assert from 'assert';
import * as _ from 'lodash';
import * as common from '../../common';
import { IBaseCoin, KeychainsTriplet, KeyPair } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { IncorrectPasswordError, SafeMpcCeremonyUnsupportedError } from '../errors';
import {
  decodeEd25519StrKeyPublicKey,
  encodeDerivableEd25519Pub,
  generateEd25519ChainCode,
  isValidEd25519StrKeyPublicKey,
} from '@bitgo/sdk-lib-safes';
import { decodeOrElse, ECDSAUtils, EDDSAUtils, generateRandomPassword, RequestTracer } from '../utils';
import {
  AddKeychainOptions,
  ApiKeyShare,
  ChangedKeychains,
  CreateBackupOptions,
  CreateBitGoOptions,
  CreateMpcOptions,
  GetKeychainOptions,
  GetKeysForSigningOptions,
  IKeychains,
  Keychain,
  ListKeychainOptions,
  ListKeychainsResult,
  RecreateMpcOptions,
  RotateKeychainOptions,
  UpdatePasswordOptions,
  UpdateSingleKeychainPasswordOptions,
} from './iKeychains';
import { BitGoKeyFromOvcShares, BitGoToOvcJSON, OvcToBitGoJSON } from './ovcJsonCodec';
import { EncryptionVersion, IEncryptionSession } from '../../api';

/** Server-side transaction budget for one bulk key update: each write is sub-KB, so hundreds of
 * envelopes fit in one Mongo transaction. Only batches past this size are chunked, at the cost
 * of all-or-nothing across chunks. */
const BULK_KEY_UPDATE_BATCH_SIZE = 500;

export class Keychains implements IKeychains {
  private readonly bitgo: BitGoBase;
  private readonly baseCoin: IBaseCoin;

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
  }

  /**
   * Get a keychain by ID
   * @param params
   * @param params.id
   * @param params.xpub (optional)
   * @param params.ethAddress (optional)
   * @param params.reqId (optional)
   */
  async get(params: GetKeychainOptions): Promise<Keychain> {
    common.validateParams(params, [], ['xpub', 'ethAddress']);

    if (_.isUndefined(params.id)) {
      throw new Error('id must be defined');
    }

    const id = params.id;
    if (params.reqId) {
      this.bitgo.setRequestTracer(params.reqId);
    }
    return await this.bitgo.get(this.baseCoin.url('/key/' + encodeURIComponent(id))).result();
  }

  /**
   * list the users keychains
   * @param params
   * @param params.limit - Max number of results in a single call.
   * @param params.prevId - Continue iterating (provided by nextBatchPrevId in the previous list)
   * @param params.safeId - Optional safe id; scopes the listing to the safe's keys (requires safe
   *   admin). The result set is coin-independent — the same safe yields the same keys through any
   *   coin's keychains().
   * @returns {*}
   */
  async list(params: ListKeychainOptions = {}): Promise<ListKeychainsResult> {
    const queryObject: any = {};

    if (!_.isUndefined(params.limit)) {
      if (!_.isNumber(params.limit)) {
        throw new Error('invalid limit argument, expecting number');
      }
      queryObject.limit = params.limit;
    }
    if (!_.isUndefined(params.prevId)) {
      if (!_.isString(params.prevId)) {
        throw new Error('invalid prevId argument, expecting string');
      }
      queryObject.prevId = params.prevId;
    }
    if (!_.isUndefined(params.safeId)) {
      if (!_.isString(params.safeId)) {
        throw new Error('invalid safeId argument, expecting string');
      }
      queryObject.safeId = params.safeId;
    }

    return this.bitgo.get(this.baseCoin.url('/key')).query(queryObject).result();
  }

  /**
   * Change the decryption password for keychains. One method, two modes — the optional `safeId`
   * parameter flips BOTH the error philosophy and the persistence story, so pick the mode
   * deliberately:
   *
   * **Legacy mode (no `safeId`)** — login-password sync. Walks all keychains associated with the
   * user for this coin, decrypts each one with `oldPassword` and re-encrypts it with
   * `newPassword`, silently skipping keychains that fail to decrypt (e.g. wallets that never
   * matched the login password). Persists NOTHING: the returned `changedKeys` map
   * (`{ xpub|keyId → newEncryptedPrv }`) is the caller's job to persist.
   *
   * **Safe mode (`safeId` present)** — safe passphrase rotation. Requires safe admin. Walks the
   * safe's keychains (all slots plus every minted MPC wallet's user key; keychains without an
   * `encryptedPrv` are skipped), decrypts every envelope with `oldPassword` BEFORE any write and
   * fails fast with `IncorrectPasswordError` on the first undecryptable one — so a wrong
   * passphrase results in zero writes instead of a half-rotated safe. Re-encrypts through a
   * single shared encryption session (one Argon2 for the whole fan-out) and persists everything
   * atomically server-side via the coinless batch endpoint `PUT /api/v2/key/bulk`, per-key
   * compare-and-swap against the old envelope (a stale envelope — e.g. after an in-flight mint —
   * is rejected with a 409 naming the key; re-run the rotation). Resolves with the batch
   * response, NOT a `changedKeys` map. In this mode envelopes are emitted at the shared
   * session's version (`encryptionVersion`, default v2), not per-keychain source versions.
   *
   * @param params
   * @param params.oldPassword - The old password used for encrypting the key
   * @param params.newPassword - The new password to be used for encrypting the key
   * @param params.safeId - Optional safe id; switches to safe mode (see above)
   * @returns legacy mode: changedKeys Object - e.g.:
   *  {
   *    xpub1: encryptedPrv,
   *    ...
   *  }
   * @returns safe mode: the batch response, one `{ keyId, updated }` item per rotated key
   */
  async updatePassword(params: UpdatePasswordOptions & { safeId: string }): Promise<KeyBulkUpdateResponse>;
  async updatePassword(params: UpdatePasswordOptions): Promise<ChangedKeychains>;
  async updatePassword(params: UpdatePasswordOptions): Promise<ChangedKeychains | KeyBulkUpdateResponse> {
    common.validateParams(params, ['oldPassword', 'newPassword'], ['safeId']);
    if (!_.isUndefined(params.safeId)) {
      return this.updateSafePassword(params as UpdatePasswordOptions & { safeId: string });
    }
    const changedKeys: ChangedKeychains = {};
    let prevId;
    let keysLeft = true;
    while (keysLeft) {
      const result: ListKeychainsResult = await this.list({ limit: 500, prevId });
      for (const key of result.keys) {
        const oldEncryptedPrv = key.encryptedPrv;
        if (_.isUndefined(oldEncryptedPrv)) {
          continue;
        }
        try {
          const updatedKeychain = await this.updateSingleKeychainPassword({
            keychain: key,
            oldPassword: params.oldPassword,
            newPassword: params.newPassword,
            encryptionVersion: params.encryptionVersion,
            encryptionSession: params.encryptionSession,
          });
          if (updatedKeychain.encryptedPrv) {
            // Both TSS and multi-user-ofc keys have multiple public keys in their key document and thus need to use objectID
            const changedKeyIdentifier =
              updatedKeychain.type === 'tss' || Keychains.isMultiUserKey(updatedKeychain)
                ? updatedKeychain.id
                : updatedKeychain.pub;
            if (changedKeyIdentifier) {
              changedKeys[changedKeyIdentifier] = updatedKeychain.encryptedPrv;
            }
          }
        } catch (e) {
          // if the password was incorrect, silence the error, throw otherwise.
          // updateSingleKeychainPassword wraps a wrong-password (or corrupt input) failure as
          // 'failed to update keychain password: ...', so treat that as a skip-able error.
          if (
            !e.message.includes('private key is incorrect') &&
            !e.message.includes('failed to update keychain password')
          ) {
            throw e;
          }
        }
      }
      if (result.nextBatchPrevId) {
        prevId = result.nextBatchPrevId;
      } else {
        keysLeft = false;
      }
    }
    return changedKeys;
  }

  /**
   * Safe-mode implementation of {@link Keychains.updatePassword} (`params.safeId` present).
   *
   * Walks the safe's keychains page by page (`GET /:coin/key?safeId=...`), decrypts every
   * envelope with the old password as it goes (the fail-fast preflight — the first
   * undecryptable envelope aborts with zero writes, so old and new envelopes can never be
   * mixed by a half-rotation), re-encrypts through one shared encryption session, and persists
   * the whole fan-out through the coinless batch endpoint (chunked past
   * {@link BULK_KEY_UPDATE_BATCH_SIZE} items at the cost of all-or-nothing across chunks).
   */
  private async updateSafePassword(params: UpdatePasswordOptions & { safeId: string }): Promise<KeyBulkUpdateResponse> {
    const updates: KeyBulkUpdateBody['updates'] = [];
    let session: IEncryptionSession | undefined;
    let ownSession = false;
    try {
      let prevId: string | undefined;
      let keysLeft = true;
      while (keysLeft) {
        const result: ListKeychainsResult = await this.list({ limit: 500, prevId, safeId: params.safeId });
        for (const key of result.keys) {
          const oldEncryptedPrv = key.encryptedPrv;
          if (_.isUndefined(oldEncryptedPrv)) {
            // Public-only multisig children and MPC child backup/bitgo placeholders carry no
            // user-held envelope — nothing to rotate.
            continue;
          }
          // One session (one Argon2 run) is shared across the whole fan-out; created lazily so
          // a safe with nothing to rotate pays no KDF.
          if (!session) {
            session =
              params.encryptionSession ??
              (await this.bitgo.createEncryptionSession(params.newPassword, params.encryptionVersion));
            ownSession = !params.encryptionSession;
          }
          let decryptedPrv: string;
          try {
            decryptedPrv = await this.bitgo.decrypt({ input: oldEncryptedPrv, password: params.oldPassword });
          } catch (e) {
            // Deliberate divergence from the legacy path's skip-and-continue: a key that no
            // longer decrypts with the old passphrase would silently split the passphrase space
            // if left behind.
            const errorDetail = e instanceof Error ? e.message : String(e);
            throw new IncorrectPasswordError(
              `failed to decrypt keychain ${key.id} with the old passphrase: ${errorDetail}`
            );
          }
          updates.push({
            keyId: key.id,
            encryptedPrv: await session.encrypt(decryptedPrv),
            // Compare-and-swap against the exact envelope we decrypted, so an in-flight mint
            // racing the rotation is detected instead of silently mixing envelopes.
            expectedOldEncryptedPrv: oldEncryptedPrv,
          });
        }
        if (result.nextBatchPrevId) {
          prevId = result.nextBatchPrevId;
        } else {
          keysLeft = false;
        }
      }

      if (updates.length === 0) {
        return { updates: [] };
      }

      const responses: KeyBulkUpdateResponse[] = [];
      for (const chunk of _.chunk(updates, BULK_KEY_UPDATE_BATCH_SIZE)) {
        responses.push(
          (await this.bitgo
            .put(this.bitgo.url('/key/bulk', 2))
            .send({ updates: chunk })
            .result()) as KeyBulkUpdateResponse
        );
      }
      return { updates: responses.flatMap((response) => response.updates) };
    } finally {
      if (ownSession) {
        session?.destroy();
      }
    }
  }

  /**
   * Determine the encryption version of a ciphertext by inspecting its "v" field.
   *   - v1 (SJCL / PBKDF2-SHA256 + AES-256-CCM): "v" absent or explicitly 1
   *   - v2 (Argon2id + AES-256-GCM): "v" === 2
   * Throws on unrecognized values so callers cannot silently mis-handle unknown envelopes.
   */
  getEncryptionVersion(ciphertext: string): EncryptionVersion {
    let envelope: { v?: unknown };
    try {
      envelope = JSON.parse(ciphertext);
    } catch (e) {
      throw new Error(`Failed to parse ciphertext envelope: ${(e as Error).message}`);
    }
    if (envelope.v === 2) {
      return 2;
    }
    if (envelope.v === undefined || envelope.v === 1) {
      return 1;
    }
    throw new Error(`Unrecognized encryption version: ${String(envelope.v)}`);
  }

  /**
   * Update the password used to decrypt a single keychain. Defaults to preserving the
   * source envelope version (v1 stays v1, v2 stays v2), so this is a no-op with respect to
   * encryption version unless the caller opts in. Pass `encryptionVersion: 2` to explicitly
   * upgrade a v1 (SJCL) keychain to v2 (Argon2id + AES-256-GCM) as part of the password change
   * (e.g. once a caller is ready, after the Sept 15 breaking-change window closes).
   * @param params
   * @param params.keychain - The keychain whose password should be updated
   * @param params.oldPassword - The old password used for encrypting the key
   * @param params.newPassword - The new password to be used for encrypting the key
   * @param params.encryptionVersion - Optional envelope version to emit; defaults to the source envelope's version
   * @returns {Promise<Keychain>}
   */
  async updateSingleKeychainPassword(params: UpdateSingleKeychainPasswordOptions = {}): Promise<Keychain> {
    if (!_.isString(params.oldPassword)) {
      throw new Error('expected old password to be a string');
    }

    if (!_.isString(params.newPassword)) {
      throw new Error('expected new password to be a string');
    }

    if (!_.isObject(params.keychain) || !_.isString(params.keychain.encryptedPrv)) {
      throw new Error('expected keychain to be an object with an encryptedPrv property');
    }

    const oldEncryptedPrv = params.keychain.encryptedPrv;
    try {
      const decryptedPrv = await this.bitgo.decrypt({ input: oldEncryptedPrv, password: params.oldPassword });
      const newEncryptedPrv = params.encryptionSession
        ? await params.encryptionSession.encrypt(decryptedPrv)
        : await this.bitgo.encrypt({
            input: decryptedPrv,
            password: params.newPassword,
            encryptionVersion: params.encryptionVersion ?? this.getEncryptionVersion(oldEncryptedPrv),
          });
      return _.assign({}, params.keychain, { encryptedPrv: newEncryptedPrv });
    } catch (e) {
      // catching an error here means that the password was incorrect or, less likely, the input to decrypt is corrupted
      const errorDetail = e instanceof Error ? e.message : String(e);
      throw new Error(`failed to update keychain password: ${errorDetail}`);
    }
  }

  /**
   * Decrypt an encrypted private key with `passphrase` and re-encrypt it as a v2
   * (Argon2id + AES-256-GCM) envelope with the same passphrase.
   *
   * Used to upgrade legacy v1 (SJCL) envelopes to v2 without changing the passphrase.
   * Callers that need to try a fallback passphrase (e.g. an original passphrase from
   * before a password rotation) should handle that themselves — this primitive does one
   * thing and lets decryption errors surface directly.
   */
  async reencryptAsV2(encryptedPrv: string, passphrase: string): Promise<string> {
    const prv = await this.bitgo.decrypt({ input: encryptedPrv, password: passphrase });
    return this.bitgo.encrypt({ input: prv, password: passphrase, encryptionVersion: 2 });
  }

  /**
   * Create a public/private key pair
   * @param params - optional params
   * @param params.seed optional - seed to use for keypair generation
   * @param params.isRootKey optional - whether the resulting keypair should be a root key
   * @returns {KeyPair} - the generated keypair
   */
  create(params: { seed?: Buffer; isRootKey?: boolean } = {}): KeyPair {
    if (params?.isRootKey) {
      return this.baseCoin.generateRootKeyPair(params.seed);
    }
    return this.baseCoin.generateKeyPair(params.seed);
  }

  /**
   * Add a keychain to BitGo's records
   * @param params
   */
  async add(params: AddKeychainOptions = {}): Promise<Keychain> {
    params = params || {};
    common.validateParams(
      params,
      [],
      [
        'pub',
        'encryptedPrv',
        'keyType',
        'type',
        'source',
        'originalPasscodeEncryptionCode',
        'enterprise',
        'derivedFromParentWithSeed',
        'derivedFromParentWithPath',
        'parent',
        'safeId',
      ]
    );

    if (!_.isUndefined(params.disableKRSEmail)) {
      if (!_.isBoolean(params.disableKRSEmail)) {
        throw new Error('invalid disableKRSEmail argument, expecting boolean');
      }
    }

    if (params.reqId) {
      this.bitgo.setRequestTracer(params.reqId);
    }

    return await this.bitgo
      .post(this.baseCoin.url('/key'))
      .send({
        pub: params.pub,
        commonPub: params.commonPub,
        commonKeychain: params.commonKeychain,
        encryptedPrv: params.encryptedPrv,
        type: params.type,
        keyType: params.keyType,
        source: params.source,
        provider: params.provider,
        originalPasscodeEncryptionCode: params.originalPasscodeEncryptionCode,
        enterprise: params.enterprise,
        derivedFromParentWithSeed: params.derivedFromParentWithSeed,
        derivedFromParentWithPath: params.derivedFromParentWithPath,
        parent: params.parent,
        disableKRSEmail: params.disableKRSEmail,
        krsSpecific: params.krsSpecific,
        keyShares: params.keyShares,
        userGPGPublicKey: params.userGPGPublicKey,
        backupGPGPublicKey: params.backupGPGPublicKey,
        algoUsed: params.algoUsed,
        isDistributedCustody: params.isDistributedCustody,
        isMPCv2: params.isMPCv2,
        coinSpecific: params.coinSpecific,
        webauthnDevices: params.webauthnDevices,
        webauthnInfo: params.webauthnInfo,
        safeId: params.safeId,
      })
      .result();
  }

  /**
   * Create a BitGo key
   * @param params (empty)
   */
  async createBitGo(params: CreateBitGoOptions = {}): Promise<Keychain> {
    params.source = 'bitgo';

    this.baseCoin.preCreateBitGo(params as any);
    return await this.add(params);
  }

  /**
   * Create a backup key
   * @param params
   * @param params.provider (optional)
   */
  async createBackup(params: CreateBackupOptions = {}): Promise<Keychain> {
    params.source = 'backup';

    const isTssBackupKey = params.prv && (params.commonKeychain || params.commonPub);

    if (_.isUndefined(params.provider) && !isTssBackupKey) {
      // if the provider is undefined, we generate a local key and add the source details
      const key = this.create();
      _.extend(params, key);
      if (params.passphrase !== undefined) {
        _.extend(params, {
          encryptedPrv: await this.bitgo.encrypt({
            input: key.prv,
            password: params.passphrase,
            encryptionVersion: params.encryptionVersion,
          }),
        });
      }
    }

    // Wallet Safes v1 slot ④ (`ed25519Multisig`): store neutral raw derivation material as
    // publicKey32 || chainCode32, serialized together as canonical unpadded RFC 4648 base32
    // (exactly 103 uppercase characters). The root is deliberately not encoded as a
    // Stellar/Algorand/HBAR public key; coin-specific encoding happens after public soft
    // derivation when the wallet child is minted.
    const withKey = params as CreateBackupOptions & { pub?: string };
    if (params.safeId !== undefined && withKey.pub !== undefined && isValidEd25519StrKeyPublicKey(withKey.pub)) {
      withKey.pub = encodeDerivableEd25519Pub(decodeEd25519StrKeyPublicKey(withKey.pub), generateEd25519ChainCode());
    }

    const serverResponse = await this.add(params);
    return _.extend({}, serverResponse, _.pick(params, ['prv', 'encryptedPrv', 'provider', 'source']));
  }

  /**
   * Gets keys for signing from a wallet
   * @param params
   * @returns {Promise<Keychain[]>}
   */
  async getKeysForSigning(params: GetKeysForSigningOptions = {}): Promise<Keychain[]> {
    if (!_.isObject(params.wallet)) {
      throw new Error('missing required param wallet');
    }
    const wallet = params.wallet;
    const reqId = params.reqId || new RequestTracer();
    const ids = wallet.baseCoin.keyIdsForSigning();
    const keychainQueriesBluebirds = ids.map((id) => this.get({ id: wallet.keyIds()[id], reqId }));
    return Promise.all(keychainQueriesBluebirds);
  }

  /**
   * Convenience function to create and store MPC keychains with BitGo.
   * @param params passphrase used to encrypt secret materials
   * @return {Promise<KeychainsTriplet>} newly created User, Backup, and BitGo keys
   */
  async createMpc(params: CreateMpcOptions): Promise<KeychainsTriplet> {
    if (params.multisigType !== 'tss') {
      throw new Error('Unsupported multi-sig type');
    }

    const tssSettings: TssSettings = await this.bitgo
      .get(this.bitgo.microservicesUrl('/api/v2/tss/settings'))
      .query({ enterprise: params.enterprise })
      .result();
    const multisigTypeVersion =
      tssSettings.coinSettings[this.baseCoin.getFamily()]?.walletCreationSettings?.multiSigTypeVersion;

    const isMPCv2 = multisigTypeVersion === 'MPCv2';
    if (params.safeId && !isMPCv2) {
      // The legacy MPCv1 ceremonies accept a safeId for signature compatibility but silently
      // ignore it (see EDDSAUtils.default.createKeychains / ECDSAUtils.EcdsaUtils.createKeychains),
      // so the resulting keys never get tagged with the safe and WP's finalize step rejects them
      // with a generic 400. Fail fast here instead of letting that confusing error surface later.
      throw new SafeMpcCeremonyUnsupportedError(this.baseCoin.getFamily());
    }

    // A safeId on a keygen ceremony selects the VRF variant, which additionally runs the
    // VRF DKG alongside the signing DKG. Ordinary TSS wallet creation never sets safeId
    // and keeps the plain MPCv2 flow.
    let MpcUtils;
    if (this.baseCoin.getMPCAlgorithm() === 'eddsa') {
      MpcUtils = isMPCv2
        ? params.safeId
          ? EDDSAUtils.EddsaVrfMPCv2Utils
          : EDDSAUtils.EddsaMPCv2Utils
        : EDDSAUtils.default;
    } else {
      MpcUtils = isMPCv2
        ? params.safeId
          ? ECDSAUtils.EcdsaVrfMPCv2Utils
          : ECDSAUtils.EcdsaMPCv2Utils
        : ECDSAUtils.EcdsaUtils;
    }

    const mpcUtils = new MpcUtils(this.bitgo, this.baseCoin);
    return await mpcUtils.createKeychains({
      passphrase: params.passphrase,
      enterprise: params.enterprise,
      originalPasscodeEncryptionCode: params.originalPasscodeEncryptionCode,
      retrofit: params.retrofit,
      webauthnInfo: params.webauthnInfo,
      encryptionVersion: params.encryptionVersion,
      safeId: params.safeId,
    });
  }

  async recreateMpc(params: RecreateMpcOptions): Promise<KeychainsTriplet> {
    assert(params.coin, new Error('missing required param coin'));
    assert(params.walletId, new Error('missing required param walletId'));
    assert(params.otp, new Error('missing required param otp'));
    assert(params.passphrase, new Error('missing required param passphrase'));

    assert(
      params.encryptedMaterial.encryptedWalletPassphrase,
      new Error('missing required param encryptedWalletPassphrase')
    );
    assert(params.encryptedMaterial.encryptedUserKey, new Error('missing required param encryptedUserKey'));
    assert(params.encryptedMaterial.encryptedBackupKey, new Error('missing required param encryptedBackupKey'));

    await this.bitgo.post(this.bitgo.microservicesUrl('/api/v1/user/unlock')).send({ otp: params.otp }).result();
    const { recoveryInfo } = await this.bitgo
      .post(this.bitgo.microservicesUrl(`/api/v2/${params.coin}/wallet/${params.walletId}/passcoderecovery`))
      .result();

    if (!recoveryInfo || !('passcodeEncryptionCode' in recoveryInfo)) {
      throw new Error('failed to get recovery info');
    }

    const decryptedWalletPassphrase = await this.bitgo.decrypt({
      input: params.encryptedMaterial.encryptedWalletPassphrase,
      password: recoveryInfo.passcodeEncryptionCode,
    });

    const decryptedUserKey = await this.bitgo.decrypt({
      input: params.encryptedMaterial.encryptedUserKey,
      password: decryptedWalletPassphrase,
    });

    const decryptedBackupKey = await this.bitgo.decrypt({
      input: params.encryptedMaterial.encryptedBackupKey,
      password: decryptedWalletPassphrase,
    });

    return this.createMpc({
      ...params,
      multisigType: 'tss',
      retrofit: {
        decryptedUserKey,
        decryptedBackupKey,
        walletId: params.walletId,
      },
    });
  }

  /**
   * It parses the JSON downloaded from the OVC for platform (BitGo),
   * and creates a corresponding TSS BitGo key. It also returns the JSON that needs
   * to be uploaded back to the OVCs containing the BitGo -> OVC shares.
   * @param ovcOutputJson JSON format of the file downloaded from the OVC for platform
   * @param enterprise Optional enterprise ID associated with the key
   * @returns {BitGoKeyFromOvcShares}
   */
  async createTssBitGoKeyFromOvcShares(ovcOutputJson: unknown, enterprise?: string): Promise<BitGoKeyFromOvcShares> {
    const decodedOvcOutput = decodeOrElse(OvcToBitGoJSON.name, OvcToBitGoJSON, ovcOutputJson, (errors) => {
      throw new Error(`Error(s) parsing OVC JSON: ${errors}`);
    });

    if (decodedOvcOutput.state !== 1) {
      throw new Error('State expected to be "1". Please complete the first two OVC operations');
    }

    // OVC-1 is responsible for the User key
    const ovc1 = decodedOvcOutput.ovc[1];
    // OVC-2 is responsible for the Backup key
    const ovc2 = decodedOvcOutput.ovc[2];

    const keyShares: ApiKeyShare[] = [
      {
        from: 'user',
        to: 'bitgo',
        publicShare: ovc1.ovcToBitgoShare.publicShare,
        privateShare: ovc1.ovcToBitgoShare.privateShare,
        privateShareProof: ovc1.ovcToBitgoShare.uSig.toString() ?? '',
        vssProof: ovc1.ovcToBitgoShare.vssProof ?? '',
      },
      {
        from: 'backup',
        to: 'bitgo',
        publicShare: ovc2.ovcToBitgoShare.publicShare,
        privateShare: ovc2.ovcToBitgoShare.privateShare,
        privateShareProof: ovc2.ovcToBitgoShare.uSig.toString() ?? '',
        vssProof: ovc2.ovcToBitgoShare.vssProof ?? '',
      },
    ];

    const key = await this.baseCoin.keychains().add({
      source: 'bitgo',
      keyShares,
      keyType: 'tss',
      userGPGPublicKey: ovc1.gpgPubKey,
      backupGPGPublicKey: ovc2.gpgPubKey,
      enterprise,
    });
    assert(key.keyShares);
    assert(key.commonKeychain);
    assert(key.walletHSMGPGPublicKeySigs);

    const bitgoToUserShare = key.keyShares.find(
      (value: { from: string; to: string }) => value.from === 'bitgo' && value.to === 'user'
    );
    assert(bitgoToUserShare);
    assert(bitgoToUserShare.vssProof);
    assert(bitgoToUserShare.paillierPublicKey);
    const bitgoToBackupShare = key.keyShares.find(
      (value: { from: string; to: string }) => value.from === 'bitgo' && value.to === 'backup'
    );
    assert(bitgoToBackupShare);
    assert(bitgoToBackupShare.vssProof);
    assert(bitgoToBackupShare.paillierPublicKey);

    // Create JSON data with platform shares for OVC-1 and OVC-2
    const bitgoToOvcOutput: BitGoToOvcJSON = {
      wallet: {
        ...decodedOvcOutput,
        platform: {
          commonKeychain: key.commonKeychain,
          walletGpgPubKeySigs: key.walletHSMGPGPublicKeySigs,
          ovc: {
            // BitGo to User (OVC-1)
            1: {
              bitgoToOvcShare: {
                i: 1,
                j: 3,
                publicShare: bitgoToUserShare.publicShare,
                privateShare: bitgoToUserShare.privateShare,
                paillierPublicKey: bitgoToUserShare.paillierPublicKey,
                vssProof: bitgoToUserShare.vssProof,
              },
            },
            // BitGo to Backup (OVC-2)
            2: {
              bitgoToOvcShare: {
                i: 2,
                j: 3,
                publicShare: bitgoToBackupShare.publicShare,
                privateShare: bitgoToBackupShare.privateShare,
                paillierPublicKey: bitgoToBackupShare.paillierPublicKey,
                vssProof: bitgoToBackupShare.vssProof,
              },
            },
          },
        },
      },
    };

    // Mark it ready for next operation, should be 2
    bitgoToOvcOutput.wallet.state += 1;

    const output: BitGoKeyFromOvcShares = {
      bitGoKeyId: key.id,
      bitGoOutputJsonForOvc: bitgoToOvcOutput,
    };

    return decodeOrElse(BitGoKeyFromOvcShares.name, BitGoKeyFromOvcShares, output, (errors) => {
      throw new Error(`Error producing the output: ${errors}`);
    });
  }

  /**
   * Create user keychain, encrypt the private key with the wallet passphrase and store it in BitGo.
   * @param walletPassphrase
   * @returns Keychain including the decrypted private key
   */
  async createUserKeychain(
    walletPassphrase: string,
    encryptionVersion?: EncryptionVersion,
    session?: IEncryptionSession
  ): Promise<Keychain> {
    const keychains = this.baseCoin.keychains();
    const newKeychain = keychains.create();
    const originalPasscodeEncryptionCode = generateRandomPassword(5);

    // When a session is threaded in (typically from a bulk operation that already ran the KDF
    // once), reuse it so this envelope's AES key derives via HKDF instead of another Argon2.
    const encryptedPrv = session
      ? await session.encrypt(newKeychain.prv)
      : await this.bitgo.encrypt({
          password: walletPassphrase,
          input: newKeychain.prv,
          encryptionVersion,
        });

    return {
      ...(await keychains.add({
        encryptedPrv,
        originalPasscodeEncryptionCode,
        pub: newKeychain.pub,
        source: 'user',
      })),
      prv: newKeychain.prv,
    };
  }

  /**
   * Rotate an ofc multi-user-keychain by recreating a new keypair, encrypt it using the user password and sent it to WP
   * This is only meant to be called by ofc multi-user-wallet's key, and will throw if otherwise.
   *
   * Requires 2fa auth before calling. Call the bitgo.unlock() SDK method to unlock the session first.
   * @param params parameters for the rotate keychain method
   * @return rotatedKeychain
   */
  async rotateKeychain(params: RotateKeychainOptions): Promise<Keychain> {
    const keyChain = await this.get({ id: params.id });
    if (!Keychains.isMultiUserKey(keyChain)) {
      throw new Error(`rotateKeychain is only permitted for ofc multi-user-key wallet`);
    }

    let pub: string, encryptedPrv: string;
    if ('encryptedPrv' in params) {
      // client passed in pub and encryptedPrv directly
      pub = params.pub;
      encryptedPrv = params.encryptedPrv;
    } else {
      // bitgo generate pub and prv and encrypt it
      const { pub: keyPub, prv: keyPrv } = this.create();
      if (!keyPub) {
        throw Error('Expected a public key to be generated');
      }
      pub = keyPub;
      encryptedPrv = await this.bitgo.encrypt({
        input: keyPrv,
        password: params.password,
        encryptionVersion: params.encryptionVersion,
      });
    }

    return this.bitgo
      .put(this.baseCoin.url(`/key/${params.id}`))
      .send({
        encryptedPrv,
        pub,
        reqId: params.reqId,
      })
      .result();
  }

  /**
   * Static helper method to determine if a keychain is a ofc multi-user-key
   * @param keychain
   */
  static isMultiUserKey(keychain: Keychain): boolean {
    return (keychain.coinSpecific?.ofc?.['features'] ?? []).includes('multi-user-key');
  }
}
