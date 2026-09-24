/**
 * @prettier
 *
 * @experimental The safe client surface is experimental and may change (including breaking
 * changes) before the public release.
 */
import * as t from 'io-ts';
import { FreezeSafeBody, SafeData, SafeShareData, SafeShareState, type RootKeyType } from '@bitgo/public-types';
import { IBaseCoin } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { IncorrectPasswordError } from '../errors';
import { decryptKeychainPrivateKey } from '../keychain';
import { ECDSAUtils, parseSafeMpcKeyEnvelopes } from '../utils';
import { boundedInt, decodeWithCodec } from '../utils/codecs';
import { postWithCodec } from '../utils/postWithCodec';
import { Wallet } from '../wallet';
import { InvalidRootKeychainSourceError } from '../wallet/safeKeychain';
import { base64UrlToBuffer, deriveEnterpriseSalt, derivePassword, toBase64Url } from '../webauthn';
import {
  AcceptSafeShareOptions,
  AddSafeMemberOptions,
  AddSafeWalletMemberOptions,
  CreateSafeWalletOptions,
  ISafe,
  RegisterSafePasskeyOptions,
  RegisterSafePasskeyResponse,
  RemoveSafePasskeyOptions,
  UpdateSafeOptions,
  WalletShareData,
} from './iSafe';
import { coinForRoot, SAFE_ROOT_SLOTS } from './rootCoin';
import {
  deriveAndSelfCheckSafeChildHardened,
  deriveSafeChildEd25519Hardened,
  DerivedFromParentWithHardenedPath,
  onchainSlotForCoin,
  tssSlotForCoin,
} from '@bitgo/sdk-lib-safes';

const SafeRootKeySlot = t.keyof({
  secp256k1Multisig: null,
  ecdsaMpc: null,
  eddsaMpc: null,
  ed25519Multisig: null,
});

const GetDerivationIndexResponse = t.type({
  slot: SafeRootKeySlot,
  index: boundedInt(0, 0x7fffffff, 'derivationIndex'),
});

const CreateWalletInSafeBody = t.union([
  t.strict({
    coin: t.string,
    label: t.string,
    type: t.literal('hot'),
    multisigType: t.literal('onchain'),
    keys: t.tuple([t.string]),
  }),
  // TSS mint uses ordered user and backup child documents.
  t.strict({
    coin: t.string,
    label: t.string,
    type: t.literal('hot'),
    multisigType: t.literal('tss'),
    keys: t.tuple([t.string, t.string, t.string]),
  }),
]);

const PasskeyEntryCodec = t.type({
  keyId: t.string,
  encryptedPrv: t.string,
});

const RegisterSafePasskeyBody = t.type({
  otpDeviceId: t.string,
  prfSalt: t.string,
  entries: t.array(PasskeyEntryCodec),
});

const RegisterSafePasskeyResponseCodec = t.type({
  otpDeviceId: t.string,
  updatedKeys: t.array(t.string),
});

function rootIdFromSafe(safe: SafeData, slot: RootKeyType, position: 0 | 1 | 2): string | undefined {
  const triplet = safe.rootKeys?.hot?.[slot];
  if (!triplet || triplet.length !== 3) {
    return undefined;
  }
  const rootId = triplet[position];
  return rootId.length > 0 ? rootId : undefined;
}

/**
 * @experimental
 */
export class Safe implements ISafe {
  private readonly bitgo: BitGoBase;
  public readonly _safe: SafeData;

  constructor(bitgo: BitGoBase, safeData: SafeData) {
    this.bitgo = bitgo;
    this._safe = safeData;
  }

  id(): string {
    return this._safe.id;
  }

  enterpriseId(): string {
    return this._safe.enterpriseId;
  }

  label(): string {
    return this._safe.label;
  }

  status(): SafeData['status'] {
    return this._safe.status;
  }

  /**
   * Enterprise-scoped v2 URL for this safe, e.g. /api/v2/enterprise/:eId/safes/:safeId
   * @param extra
   */
  url(extra = ''): string {
    return this.bitgo.url(`/enterprise/${this.enterpriseId()}/safes/${this.id()}${extra}`, 2);
  }

  /**
   * Mint a child wallet: peek the sequential index, derive the child keys, register
   * them, then mint.
   *
   * `onchain`: hardened-derive the user child (`m/<index>'`), register it
   * public-only; backup and BitGo children are soft-derived on the server.
   *
   * `tss`: decrypt the user root blob, run the user/BitGo hard-derive ceremony,
   * register the ordered child documents, then mint.
   */
  async createWallet(params: CreateSafeWalletOptions): Promise<Wallet> {
    if (params.passphrase.length === 0) {
      throw new Error('passphrase is required to mint a safe wallet');
    }
    if (params.type !== undefined && params.type !== 'hot') {
      throw new Error('Safe wallets are hot-only in v1');
    }
    const multisigType = params.multisigType ?? 'onchain';
    const isTss = multisigType === 'tss';

    const coin = this.bitgo.coin(params.coin);
    const slot = isTss ? tssSlotForCoin(coin.getChain()) : onchainSlotForCoin(coin.getChain());

    const indexResponse = await this.bitgo.get(this.url('/derivation-index')).query({ slot }).result();
    const peeked = decodeWithCodec(GetDerivationIndexResponse, indexResponse, 'GetDerivationIndexResponse');
    if (peeked.slot !== slot) {
      throw new Error(`derivation-index returned slot '${peeked.slot}', expected '${slot}'`);
    }
    const { index } = peeked;

    const safeData = rootIdFromSafe(this._safe, slot, 0) !== undefined ? this._safe : await this.fetchSafeData();
    const userRootId = rootIdFromSafe(safeData, slot, 0);
    if (userRootId === undefined) {
      throw new Error(`Safe ${this.id()} is missing rootKeys.hot.${slot}`);
    }

    if (isTss) {
      const backupRootId = rootIdFromSafe(safeData, slot, 1);
      const bitgoRootId = rootIdFromSafe(safeData, slot, 2);
      if (backupRootId === undefined) {
        throw new Error(`Safe ${this.id()} is missing rootKeys.hot.${slot} backup key`);
      }
      if (bitgoRootId === undefined) {
        throw new Error(`Safe ${this.id()} is missing rootKeys.hot.${slot} bitgo key`);
      }
      return this.createTssWalletInSafe(coin, userRootId, backupRootId, bitgoRootId, index, params);
    }

    const keychains = coin.keychains();
    const rootKeychain = await keychains.get({ id: userRootId });
    if (rootKeychain.source !== 'user') {
      throw new InvalidRootKeychainSourceError(rootKeychain.id, rootKeychain.source);
    }
    const rootPrv = await decryptKeychainPrivateKey(this.bitgo, rootKeychain, params.passphrase);
    if (!rootPrv) {
      throw new IncorrectPasswordError();
    }

    const derived =
      slot === 'ed25519Multisig'
        ? deriveSafeChildEd25519Hardened(rootPrv, index)
        : deriveAndSelfCheckSafeChildHardened(rootPrv, index);
    const derivedFromParentWithHardenedPath = decodeWithCodec(
      DerivedFromParentWithHardenedPath,
      derived.derivationPath,
      'derivedFromParentWithHardenedPath'
    );

    const child = await keychains.add({
      pub: derived.pub,
      source: 'user',
      keyType: 'independent',
      parent: userRootId,
      safeId: this.id(),
      derivedFromParentWithPath: derivedFromParentWithHardenedPath,
    });
    const childId = child.id;
    if (childId.length === 0) {
      throw new Error('safe child key registration returned an empty id');
    }
    const keys: [string] = [childId];

    const response = await postWithCodec(this.bitgo, this.url('/wallets'), CreateWalletInSafeBody, {
      coin: params.coin,
      label: params.label,
      type: 'hot',
      multisigType,
      keys,
    }).result();
    return new Wallet(this.bitgo, coin, response);
  }

  /**
   * TSS wallet mint: decrypt the user root blob, run the user/BitGo hard-derive
   * ceremony, register the ordered child documents, then mint.
   */
  private async createTssWalletInSafe(
    coin: IBaseCoin,
    userRootId: string,
    backupRootId: string,
    bitgoRootId: string,
    index: number,
    params: CreateSafeWalletOptions
  ): Promise<Wallet> {
    const keychains = coin.keychains();
    const userRootKeychain = await keychains.get({ id: userRootId });
    if (userRootKeychain.source !== 'user') {
      throw new InvalidRootKeychainSourceError(userRootKeychain.id, userRootKeychain.source);
    }

    const userRootPrv = await decryptKeychainPrivateKey(this.bitgo, userRootKeychain, params.passphrase);
    if (!userRootPrv) {
      throw new IncorrectPasswordError();
    }
    const userRootMaterial = parseSafeMpcKeyEnvelopes(userRootPrv);

    const tssUtils = new ECDSAUtils.EcdsaVrfMPCv2Utils(this.bitgo, coin);
    const { userKeychain, backupKeychain, bitgoKeychain } = await tssUtils.createSafeChildKeychains({
      passphrase: params.passphrase,
      enterprise: this.enterpriseId(),
      safeId: this.id(),
      parentKeyId: bitgoRootId,
      derivationIndex: index,
      userRootKeyId: userRootId,
      backupRootKeyId: backupRootId,
      userRootKeyShare: userRootMaterial.signing,
      userRootVrfKeyShare: userRootMaterial.vrf,
    });
    if (userKeychain.id.length === 0 || backupKeychain.id.length === 0 || bitgoKeychain.id.length === 0) {
      throw new Error('safe child key registration returned an empty id');
    }
    const keys: [string, string, string] = [userKeychain.id, backupKeychain.id, bitgoKeychain.id];

    const response = await postWithCodec(this.bitgo, this.url('/wallets'), CreateWalletInSafeBody, {
      coin: params.coin,
      label: params.label,
      type: 'hot',
      multisigType: 'tss',
      keys,
    }).result();
    return new Wallet(this.bitgo, coin, response);
  }

  private async fetchSafeData(): Promise<SafeData> {
    const response = await this.bitgo.get(this.url()).result();
    return decodeWithCodec(SafeData, response, 'SafeData');
  }

  /**
   * Add a member to the whole safe (view/admin/spend). Spend opens a key share.
   */
  async addMember(params: AddSafeMemberOptions): Promise<SafeData> {
    throw new Error('Safe.addMember is not yet implemented');
  }

  /**
   * Share ONE safe wallet with a non-member via the existing wallet-share handshake.
   */
  async addMemberToWallet(params: AddSafeWalletMemberOptions): Promise<WalletShareData> {
    throw new Error('Safe.addMemberToWallet is not yet implemented');
  }

  /**
   * List the safe key shares visible to the caller.
   */
  async listShares(params: { state?: SafeShareState } = {}): Promise<SafeShareData[]> {
    throw new Error('Safe.listShares is not yet implemented');
  }

  /**
   * Accept a safe key share addressed to the caller.
   */
  async acceptShare(params: AcceptSafeShareOptions): Promise<SafeShareData> {
    throw new Error('Safe.acceptShare is not yet implemented');
  }

  /**
   * Update the safe label.
   */
  async update(params: UpdateSafeOptions): Promise<SafeData> {
    const response = await this.bitgo.put(this.url()).send({ label: params.label }).result();
    return decodeWithCodec(SafeData, response, 'SafeData');
  }

  /**
   * Freeze the safe — blocks withdrawals on all safe wallets. Safe stays 'active'.
   * @param params
   */
  async freeze(params: FreezeSafeBody = {}): Promise<SafeData> {
    const response = await postWithCodec(this.bitgo, this.url('/freeze'), FreezeSafeBody, params).result();
    return decodeWithCodec(SafeData, response, 'SafeData');
  }

  /**
   * Archive the safe. Requires every safe wallet to already be archived; also the abandonment
   * path for a stuck 'initializing' safe.
   */
  async archive(): Promise<SafeData> {
    const response = await this.bitgo.post(this.url('/archive')).send().result();
    return decodeWithCodec(SafeData, response, 'SafeData');
  }

  /**
   * Register a PRF passkey on every user root of the safe.
   *
   * For each user root (position 0 of each populated slot), decrypt the root with the Safe
   * password, then re-encrypt it under the PRF-derived password (bound to the enterprise via
   * AES-GCM AAD). One PRF assertion serves the whole safe; the write set is the user roots only
   * — backup and BitGo roots are never wrapped.
   */
  async registerPasskey(params: RegisterSafePasskeyOptions): Promise<RegisterSafePasskeyResponse> {
    const { device, safePassphrase, provider, encryptionVersion } = params;

    if (!device.id) {
      throw new Error('device.id is required to register a passkey on the safe');
    }
    if (!device.prfSalt) {
      throw new Error('PRF extension not supported by this device. Please use a different passkey.');
    }
    const enterpriseId = this.enterpriseId();
    const prfSalt = deriveEnterpriseSalt(device.prfSalt, enterpriseId);

    const entries: { keyId: string; encryptedPrv: string }[] = [];
    for (const slot of SAFE_ROOT_SLOTS) {
      const userRootId = rootIdFromSafe(this._safe, slot, 0);
      if (userRootId === undefined) {
        continue;
      }
      const keychain = await coinForRoot(this.bitgo, slot).keychains().get({ id: userRootId });
      if (keychain.source !== 'user') {
        throw new InvalidRootKeychainSourceError(keychain.id, keychain.source);
      }
      const rootPrv = await decryptKeychainPrivateKey(this.bitgo, keychain, safePassphrase);
      if (!rootPrv) {
        throw new IncorrectPasswordError();
      }
      entries.push({ keyId: userRootId, encryptedPrv: rootPrv });
    }

    if (entries.length === 0) {
      throw new Error(`Safe ${this.id()} has no user roots to attach a passkey to`);
    }

    const nodeBuf = base64UrlToBuffer(device.credentialId);
    const credentialIdBuffer = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.byteLength);
    const authResult = await provider.get({
      publicKey: {
        allowCredentials: [{ type: 'public-key', id: credentialIdBuffer }],
      } as PublicKeyCredentialRequestOptions,
      evalByCredential: { [device.credentialId]: prfSalt },
    });
    if (!authResult.prfResult) {
      throw new Error('PRF assertion did not return a result.');
    }
    if (toBase64Url(authResult.credentialId) !== toBase64Url(device.credentialId)) {
      throw new Error('PRF assertion returned an unexpected credential.');
    }
    const prfPassword = derivePassword(authResult.prfResult);

    const wrappedEntries = await Promise.all(
      entries.map(async ({ keyId, encryptedPrv }) => ({
        keyId,
        encryptedPrv: await this.bitgo.encrypt({
          password: prfPassword,
          input: encryptedPrv,
          encryptionVersion,
          adata: enterpriseId,
        }),
      }))
    );

    const response = await postWithCodec(this.bitgo, this.url('/passkeys'), RegisterSafePasskeyBody, {
      otpDeviceId: device.id,
      prfSalt,
      entries: wrappedEntries,
    }).result();
    return decodeWithCodec(RegisterSafePasskeyResponseCodec, response, 'RegisterSafePasskeyResponse');
  }

  /**
   * Remove a PRF passkey from every user root of the safe.
   *
   * The Safe password is verified client-side (decrypt one user root) before the server is
   * called; the server enforces owner authorization and performs the idempotent per-root `$pull`.
   */
  async removePasskey(params: RemoveSafePasskeyOptions): Promise<void> {
    const { device, safePassphrase } = params;
    if (!device.id) {
      throw new Error('device.id is required to remove a passkey from the safe');
    }

    const userRoots = SAFE_ROOT_SLOTS.flatMap((slot) => {
      const userRootId = rootIdFromSafe(this._safe, slot, 0);
      return userRootId === undefined ? [] : [{ slot, userRootId }];
    });
    if (userRoots.length === 0) {
      throw new Error(`Safe ${this.id()} has no user roots to remove a passkey from`);
    }

    let verified = false;
    for (const { slot, userRootId } of userRoots) {
      const keychain = await coinForRoot(this.bitgo, slot).keychains().get({ id: userRootId });
      const decrypted = await decryptKeychainPrivateKey(this.bitgo, keychain, safePassphrase);
      if (decrypted) {
        verified = true;
        break;
      }
    }
    if (!verified) {
      throw new IncorrectPasswordError();
    }

    await this.bitgo.del(this.url(`/passkeys/${device.id}`)).result();
  }

  toJSON(): SafeData {
    return this._safe;
  }
}
